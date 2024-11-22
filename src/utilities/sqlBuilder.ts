import * as Utils from '../utilities/queryTypeDetector';


export const buildSqlQuery = (question: string): string => {
    let sql: string;

    if (Utils.isRouteSummaryQuery(question)) {
        sql = `
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
          base.shipment_start_time,
          base.shipment_end_time,
          base.temperature,
          base.actual_delivery_time,
          base.planned_delivery_time,
          (SELECT 
            SUM(e1 * e2) / SQRT(SUM(e1 * e1) * SUM(e2 * e2))
           FROM UNNEST(base.text_embedding) e1 WITH OFFSET pos1
           JOIN UNNEST(query_embedding.query_embedding) e2 WITH OFFSET pos2
           ON pos1 = pos2) AS similarity
        FROM \`ai-use-cases-431720.tnt2_dataset.bqdoc_with_embeddings\` base
        CROSS JOIN query_embedding
        WHERE 
          (LOWER(base.shipment_source) LIKE '%california%' AND LOWER(base.shipment_destination) LIKE '%texas%')
          OR (LOWER(base.shipment_source) LIKE '%texas%' AND LOWER(base.shipment_destination) LIKE '%california%')
          AND DATE(base.shipment_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        ORDER BY base.shipment_start_time DESC;
        `;
    } else if (Utils.isRouteExcursionAnalysisQuery(question)) {
        sql = `
        WITH route_excursions AS (
          SELECT 
            shipment_source,
            shipment_destination,
            COUNT(*) as total_shipments,
            SUM(CASE WHEN temperature < 15 OR temperature > 25 THEN 1 ELSE 0 END) as excursion_count
          FROM \`ai-use-cases-431720.tnt2_dataset.bqdoc_with_embeddings\`
          WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
          GROUP BY shipment_source, shipment_destination
        )
        SELECT 
          *,
          excursion_count / NULLIF(total_shipments, 0) as excursion_rate
        FROM route_excursions
        ORDER BY excursion_count DESC
        LIMIT 10;
        `;
    } else if (Utils.isSensorBreakdownQuery(question)) {
        sql = `
        WITH sensor_stats AS (
          SELECT 
            shipment_id,
            device_id,
            timestamp,
            sensor_status,
            TIMESTAMP_DIFF(
              LEAD(timestamp) OVER (PARTITION BY shipment_id ORDER BY timestamp),
              timestamp,
              MINUTE
            ) as gap_duration
          FROM \`ai-use-cases-431720.tnt2_dataset.bqdoc_with_embeddings\`
          WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        )
        SELECT 
          shipment_id,
          device_id,
          COUNT(CASE WHEN gap_duration > 30 THEN 1 END) as interruption_count,
          MAX(gap_duration) as max_gap_duration
        FROM sensor_stats
        GROUP BY shipment_id, device_id
        HAVING interruption_count > 0
        ORDER BY max_gap_duration DESC;
        `;
    } else if (Utils.isDelayTrendQuery(question)) {
        sql = `
        WITH delay_analysis AS (
          SELECT 
            shipment_id,
            planned_delivery_time,
            actual_delivery_time,
            delay_reason,
            TIMESTAMP_DIFF(actual_delivery_time, planned_delivery_time, HOUR) as delay_hours,
            DATE_TRUNC(shipment_start_time, MONTH) as month
          FROM \`ai-use-cases-431720.tnt2_dataset.bqdoc_with_embeddings\`
          WHERE DATE(shipment_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
        )
        SELECT 
          month,
          COUNT(*) as total_shipments,
          COUNT(CASE WHEN delay_hours > 0 THEN 1 END) as delayed_shipments,
          AVG(delay_hours) as avg_delay_hours,
          STRING_AGG(DISTINCT delay_reason, ', ') as delay_reasons
        FROM delay_analysis
        GROUP BY month
        ORDER BY month DESC;
        `;
    } else if (Utils.isDetailedDataReportQuery(question)) {
        sql = `
        WITH query_embedding AS (
          SELECT text_embedding AS query_embedding
          FROM ML.GENERATE_TEXT_EMBEDDING(
            MODEL \`ai-use-cases-431720.tnt2_dataset.embedding_model\`,
            (SELECT @question AS content)
          )
        )
        SELECT 
          base.shipment_id,
          base.timestamp,
          base.temperature,
          base.current_location,
          base.latitude,
          base.longitude,
          base.sensor_status,
          base.device_id,
          (SELECT 
            SUM(e1 * e2) / SQRT(SUM(e1 * e1) * SUM(e2 * e2))
           FROM UNNEST(base.text_embedding) e1 WITH OFFSET pos1
           JOIN UNNEST(query_embedding.query_embedding) e2 WITH OFFSET pos2
           ON pos1 = pos2) AS similarity
        FROM \`ai-use-cases-431720.tnt2_dataset.bqdoc_with_embeddings\` base
        CROSS JOIN query_embedding
        WHERE base.shipment_id = @shipment_id
        ORDER BY base.timestamp ASC
        LIMIT 20;
        `;
    } else {
        // Default query for other types
        sql = `
        WITH query_embedding AS (
          SELECT text_embedding AS query_embedding
          FROM ML.GENERATE_TEXT_EMBEDDING(
            MODEL \`ai-use-cases-431720.tnt2_dataset.embedding_model\`,
            (SELECT @question AS content)
          )
        )
        SELECT 
          base.*,
          (SELECT 
            SUM(e1 * e2) / SQRT(SUM(e1 * e1) * SUM(e2 * e2))
           FROM UNNEST(base.text_embedding) e1 WITH OFFSET pos1
           JOIN UNNEST(query_embedding.query_embedding) e2 WITH OFFSET pos2
           ON pos1 = pos2) AS similarity
        FROM \`ai-use-cases-431720.tnt2_dataset.bqdoc_with_embeddings\` base
        CROSS JOIN query_embedding
        ORDER BY similarity DESC
        LIMIT 20;
        `;
    }

    return sql;
};
