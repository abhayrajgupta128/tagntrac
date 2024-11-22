import { Request, Response } from 'express';
import { VertexAI } from '@google-cloud/vertexai'
import dotenv from 'dotenv';
import { BigQuery } from '@google-cloud/bigquery';
import { buildPrompt } from '../utilities/promptBuilder';
import { buildSqlQuery } from '../utilities/sqlBuilder';
import * as Utils from '../utilities/queryTypeDetector';
import * as UtilHelper from '../utilities/helper';

dotenv.config();

export const answerQuestion = async (req: Request, res: Response): Promise<void> => {
    let { question } = req.body;

    try {
        const bigquery = req.app.bigQuerry;
        const genAI = req.app.generativeModel;
        const data = await runSearch(bigquery, question);
        console.log("runSearch Data :", data);
        

        if (!data) {
            res.status(202).json({ answer: "I'm sorry, I couldn't find any relevant information for your query." });
            return;
        }
        const prompt = buildPrompt(data, question);

        const answer = await answerQuestionGemini(genAI, prompt);
        console.log('GeminiAnswer: ', answer);

        res.status(200).json({ answer: cleanOutput(answer) });

    } catch (error: any) {
        res.status(404).json({ answer: `Error processing question: ${error?.message}` });
    }
};

const runSearch = async (bigquery: BigQuery, question: string) => {
    let shipment_id: string | null;
    try {
        if (Utils.isLocationQuery(question) ||
            Utils.isDetailsQuery(question) ||
            Utils.isEtaQuery(question) ||
            Utils.isDetailedDataReportQuery(question)
        ) {
            shipment_id = UtilHelper.getShipmentIdFromQuery(question);
        } else shipment_id = null;

        const { time_period, days } = UtilHelper.getTimePeriodFromQuery(question);
        console.log("Time period: ", time_period, days);

        console.log("------------demo : 1--------");
        const demoQuery = `
            WITH query_embedding AS (
            SELECT text_embedding AS query_embedding
            FROM ML.GENERATE_TEXT_EMBEDDING(
            MODEL \`ai-use-cases-431720.tnt2_dataset.embedding_model\`,
            (SELECT @question AS content)
            )
        )
        SELECT 
            base.shipment_id,
            base.shipment_source,
            base.shipment_destination,
            base.shipment_status,
            (SELECT 
            SUM(e1 * e2) / SQRT(SUM(e1 * e1) * SUM(e2 * e2))
            FROM UNNEST(base.text_embedding) e1
            JOIN UNNEST(query_embedding.query_embedding) e2
            ON e1 = e2) AS similarity
        FROM \`ai-use-cases-431720.tnt2_dataset.bqdoc_with_embeddings\` base
        CROSS JOIN query_embedding
        LIMIT 5;
        `;
        const [demo] = await bigquery.query(demoQuery);
        console.log("------------2--------");
        console.log("Rishav's demo here", demo);

        // Initialize query parameters
        let queryParams = [
            { name: 'question', parameterType:'STRING', parameterValue: question }
        ];

        if (shipment_id) {
            queryParams.push({ name: 'shipment_id', parameterType: 'STRING', parameterValue: shipment_id });
        }

        // Execute query
        const sqlQuerry = buildSqlQuery(question);
        const options = {
            query: sqlQuerry,
            params: queryParams
        };
        const [rows] = await bigquery.query(options);

        // Initialize data collectors
        let dataCollector: string[] = [];
        let route_summary = {
            total_shipments: 0,
            on_time_count: 0,
            temperature_issues: 0,
            locations: new Set<string>()
        };

        let route_excursions: Record<string, any> = {};

        let sensor_issues = {
            total_interruptions: 0,
            affected_shipments: new Set<string>(),
            long_downtime_shipments: [] as { shipment_id: string; downtime: number }[]
        };

        let delay_trends = {
            total_shipments: 0,
            delayed_shipments: 0,
            avg_delay_hours: 0,
            reasons: {} as Record<string, number>
        };

        let detailed_data = {
            temperature_readings: [] as { temp: number; time: string }[],
            location_updates: [] as { location: string; time: string }[],
            timestamps: [] as string[]
        };

        // Process results based on query type
        for (const row of rows) {
            if (Utils.isRouteSummaryQuery(question)) {
                route_summary.total_shipments++;
                if (row.actual_delivery_time <= row.planned_delivery_time) {
                    route_summary.on_time_count++;
                }
                if (UtilHelper.checkTemperatureExcursion(row.temperature)[0]) {
                    route_summary.temperature_issues++;
                }
                // Add locations
                [row.shipment_source, row.shipment_destination].forEach(location =>
                    route_summary.locations.add(location)
                );

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
                if (row.max_gap_duration > 120) { // 2 hours
                    sensor_issues.long_downtime_shipments.push({
                        shipment_id: row.shipment_id,
                        downtime: row.max_gap_duration
                    });
                }

            } else if (Utils.isDelayTrendQuery(question)) {
                delay_trends.total_shipments = row.total_shipments;
                delay_trends.delayed_shipments = row.delayed_shipments;
                delay_trends.avg_delay_hours = row.avg_delay_hours;
                parseDelayReasons(row.delay_reasons, delay_trends.reasons);

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

            // Add raw data to data collector
            dataCollector.push(
                Object.entries(row)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
            );
        }

        // Join all collected raw data
        const data = dataCollector.join('\n');
        return data;
    } catch (error: any) {
        console.log('Error in BigQuery: ', error.message);
        return error.message;
    }
}

const answerQuestionGemini = async (genAI: ReturnType<VertexAI['getGenerativeModel']>, prompt: string): Promise<string> => {
    try {
        const result = await genAI.generateContent(prompt);
        let response = JSON.stringify(result.response);

        console.log('Response: ', response);
        return response;
    } catch (error: any) {
        return `Error in GenerativeAI model: ${error.message}`;
    }
};

// const cleanOutput = (text: string): string => {
//     return text.replace(/[^\w\s.,:]/g, '');
// };

const cleanOutput = (text: string): string => {
    return text
        .replace(/\s*\n\s*/g, ' ') // Replace newlines and surrounding spaces with a single space
        .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with a single space
        .trim();                  // Trim leading and trailing spaces
};


const parseDelayReasons = (reasonsString: string, reasonsMap: Record<string, number>) => {
    for (const reason of reasonsString.split(', ')) {
        if (reason) {
            reasonsMap[reason] = (reasonsMap[reason] || 0) + 1;
        }
    }
};
