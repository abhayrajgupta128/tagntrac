import { Request, Response, Application } from 'express';
// import { init, GenerativeModel } from '@google-cloud/aiplatform'; // TODO
import dotenv from 'dotenv';
import { buildPrompt } from '../utilities/promptBuilder';
import { buildSqlQuery } from '../utilities/sqlBuilder';
import * as Utils from '../utilities/queryTypeDetector';
import * as UtilHelper from '../utilities/helper';

dotenv.config();

// const PROJECT_ID = process.env.PROJECT_ID;
// const LOCATION = process.env.LOCATION;

export const answerQuestion = async (app: Application, req: Request, res: Response): Promise<void> => {
    const { question } = req.body;
    try {
        const data = await runSearch(app, question);  // TODO: data from bigquery
        if (!data) {
            res.status(204).json({ answer: defaultChatbotResponse() });
            return;
        }
        const prompt = buildPrompt(data, question);

        const answer = await answerQuestionGemini(prompt);  // TODO : data from gemini
        res.status(200).json({ answer: cleanOutput(answer) });

    } catch (error: any) {
        res.status(404).json({ answer: `Error processing question: ${error.message}` });
    }
};

const runSearch = async (app: Application, question: string): Promise<string | null> => {
    let shipment_id: string | null;
    try {
        if (Utils.isLocationQuery(question) ||
            Utils.isDetailsQuery(question) ||
            Utils.isEtaQuery(question) ||
            Utils.isDetailedDataReportQuery(question)
        ){
            shipment_id = UtilHelper.getShipmentIdFromQuery(question);
        } else shipment_id = null;

        const { time_period, days } = UtilHelper.getTimePeriodFromQuery(question);  // review from helper.ts (missing in previous)

        // Initialize query parameters

        // const qp = BigQuery.valueToQueryParameter_({ name: 'question', parameterType: 'STRING', parameterValue: question });
        const bigQuerry = app.bigQuerry;
        const [rowsss] = await bigQuerry.query('SELECT * FROM `your_dataset.your_table` LIMIT 10');
        
        let queryParams = [  // TODO (get the bigquery parameters : get docs)
            { name: 'question', parameterType: 'STRING', parameterValue: question }
        ];

        /** PYTHON REFERENCE

        # Initialize query parameters
        query_params = [
            bigquery.ScalarQueryParameter("question", "STRING", question)
        ]

        */

        if (shipment_id) {
            queryParams.push({ name: 'shipment_id', parameterType: 'STRING', parameterValue: shipment_id });
        }

        // Execute query
        const sql = buildSqlQuery(question);
        const options = {
            query: sql,
            params: queryParams
        };
        const [rows] = await bigQuerry.query(options);
        console.log(rows);
        

        // Initialize data collectors
        let data = '';
        const route_summary = {
            total_shipments: 0,
            on_time_count: 0,
            temperature_issues: 0,
            locations: new Set<string>()
        };

        const route_excursions: Record<string, any> = {};

        const sensor_issues = {
            total_interruptions: 0,
            affected_shipments: new Set<string>(),
            long_downtime_shipments: [] as { shipment_id: string; downtime: number }[]
        };

        const delay_trends = {
            total_shipments: 0,
            delayed_shipments: 0,
            avg_delay_hours: 0,
            reasons: {} as Record<string, number>
        };

        const detailed_data = {
            temperature_readings: [] as { temp: number; time: string }[],
            location_updates: [] as { location: string; time: string }[],
            timestamps: [] as string[]
        };

        // Process results based on query type
        for (const row of rows) {
            if (Utils.isRouteSummaryQuery(question)) {
                route_summary.total_shipments += 1;
                if (row.actual_delivery_time <= row.planned_delivery_time) {
                    route_summary.on_time_count += 1;
                }
                if (UtilHelper.checkTemperatureExcursion(row.temperature)[0]) {
                    route_summary.temperature_issues += 1;
                }
                route_summary.locations.add(row.shipment_source);
                route_summary.locations.add(row.shipment_destination);

            } else if (Utils.isRouteExcursionAnalysisQuery(question)) {
                const route_key = `${row.shipment_source} to ${row.shipment_destination}`;
                if (!route_excursions[route_key]) {
                    route_excursions[route_key] = {
                        excursion_count: row.excursion_count,
                        total_shipments: row.total_shipments,
                        excursion_rate: row.excursion_rate
                    };
                }

            } else if (Utils.isSensorBreakdownQuery(question)) {
                sensor_issues.total_interruptions += row.interruption_count;
                sensor_issues.affected_shipments.add(row.shipment_id);
                if (row.max_gap_duration > 120) {  // 2 hours
                    sensor_issues.long_downtime_shipments.push({
                        shipment_id: row.shipment_id,
                        downtime: row.max_gap_duration
                    });
                }

            } else if (Utils.isDelayTrendQuery(question)) {
                delay_trends.total_shipments = row.total_shipments;
                delay_trends.delayed_shipments = row.delayed_shipments;
                delay_trends.avg_delay_hours = row.avg_delay_hours;
                for (const reason of row.delay_reasons.split(', ')) {
                    if (reason) {
                        delay_trends.reasons[reason] = (delay_trends.reasons[reason] || 0) + 1;
                    }
                }

            } else if (Utils.isDetailedDataReportQuery(question)) {
                if (row.temperature) {
                    detailed_data.temperature_readings.push({
                        temp: row.temperature,
                        time: row.timestamp
                    });
                }
                if (row.current_location) {
                    detailed_data.location_updates.push({
                        location: row.current_location,
                        time: row.timestamp
                    });
                }
                if (row.timestamp) {
                    detailed_data.timestamps.push(row.timestamp);
                }
            }

            // Add raw data to string
            data += Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n') + '\n';
        }

        return data.trim() !== '' ? data : null;
    } catch (error: any) {
        return null;
    }
};

const answerQuestionGemini = async (prompt: string): Promise<string> => {  //TODO
    try {
        const model = new GenerativeModel('gemini-pro');  // TODO (get the model for Nodejs)
        const response = await model.generateContent({   // TODO: implement this ftn
            prompt,
            generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.3,
                topP: 0.9,
                topK: 20,
            },
            stream: false,
        });
        return response.text;
    } catch (error: any) {
        return `Error in Gemini model: ${error.message}`;
    }
};

const cleanOutput = (text: string): string => {
    return text.replace(/[^\w\s.,:]/g, '');
};

const defaultChatbotResponse = (): string => {
    return "I'm sorry, I couldn't find any relevant information for your query.";
};
