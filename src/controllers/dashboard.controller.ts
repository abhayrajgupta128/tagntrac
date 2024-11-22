// Import required libraries
import { Request, Response } from 'express';
import { RowData, TMData } from '../typings';

// Define the function to handle the request
export const getDashboardDataFromBigQuery = async (req: Request, res: Response) => {
  const bigquery = req.app.bigQuerry;
  try {
    // Validate and parse query parameters
    const organizationId = req.params.tenantId as string;
    const platformType = Math.max(1, Math.min(Number(req.query.type) || 1, 2));

    if (!organizationId) {
      res.status(400).send({
        error: 'organizationId query parameter is required',
      });
      return;
    }

    // Define the query
    let query: string;
    if (platformType === 2) {
      query = `
                SELECT 
                    tenant.id as tenant_id,
                    tenant.name as tenant_name,
                    shipment.id as shipment_id,
                    shipment.shipment_identifier as shipment_name,
                    shipment.status as shipment_status,
                    shipment.transit_start_time as shipment_start_time,
                    shipment.transit_end_time as shipment_end_time,
                    shipment.source_address as shipment_source,
                    shipment.destination_address as shipment_destination,
                    shp_asset.status as shipment_asset_status,
                    asset.id as asset_id,
                    asset.name as asset_name,
                    asset.status as asset_status,
                    dev_prov.device_id,
                    device.device_identifier,
                    risk.risk_level,
                    risk.prediction_timestamp as timestamp
                FROM 
                    \`ai-use-cases-431720.tnt2_dataset.rp_tenants\` tenant
                JOIN 
                    \`ai-use-cases-431720.tnt2_dataset.rp_shipments\` shipment
                ON 
                    tenant.id = shipment.tenant_id
                JOIN 
                    \`ai-use-cases-431720.tnt2_dataset.rp_shipment_assets\` shp_asset
                ON 
                    shipment.id = shp_asset.shipment_id   
                JOIN 
                    \`ai-use-cases-431720.tnt2_dataset.rp_assets\` asset
                ON 
                    shp_asset.asset_id = asset.id
                JOIN 
                    \`ai-use-cases-431720.tnt2_dataset.rp_device_provisionables\` dev_prov
                ON 
                    dev_prov.provisionable_id = asset.id
                JOIN
                    \`ai-use-cases-431720.tnt2_dataset.rp_devices\` device
                ON 
                    dev_prov.device_id = device.id
                JOIN 
                    \`ai-use-cases-431720.tnt2_dataset.tnt2_device_raw_data\` dev_data
                ON 
                    dev_data.device_identifier = device.device_identifier
                JOIN \`ai-use-cases-431720.tnt2_dataset.device_shock_risk\` risk
                ON 
                    device.id = risk.device_id
                WHERE shipment.status = 2
                AND tenant.id = @organizationId`;
    } else {
      query = `
                WITH most_recent_raw_data AS (
                    SELECT *
                    FROM 
                        \`ai-use-cases-431720.tnt_dataset.tnt_device_raw_data\`
                    WHERE 
                        timestamp = (
                            SELECT MAX(timestamp)
                            FROM \`ai-use-cases-431720.tnt_dataset.tnt_device_raw_data\` AS inner_data
                            WHERE inner_data.device_identifier = \`ai-use-cases-431720.tnt_dataset.tnt_device_raw_data\`.device_identifier
                        )
                )
                SELECT 
                    tenant.id as tenant_id,
                    tenant.organizationName as tenant_name,
                    project.id as project_id,
                    project.projectName as projectName,
                    asset.id as asset_id,
                    asset.trackingId as asset_name,
                    asset.tuType as asset_type,
                    asset.state as asset_state,
                    deviceinfo.state as asset_status,
                    device.id as device_id,
                    device.id as device_identifier,
                    raw_data.latitude,
                    raw_data.longitude,
                    raw_data.timestamp as last_reported_at,
                    raw_data.tm,
                    risk.risk_level,
                    risk.timestamp,
                    risk.prediction_start_timestamp,
                    risk.predicted_temperature,
                    risk.time_until_excursion,
                    risk.distance_to_destination,
                    risk.latitude,
                    risk.longitude,
                    risk.dest_lat,
                    risk.dest_lng,
                    risk.source_lat,
                    risk.source_lng,
                    "excursion" as risk_type,
                    "temperature" as risk_sub_type
                FROM 
                    \`ai-use-cases-431720.tnt_dataset.tnt_organization\` tenant
                JOIN 
                    \`ai-use-cases-431720.tnt_dataset.tnt_device\` device
                ON
                    tenant.id = device.organizationId
                JOIN 
                    \`ai-use-cases-431720.tnt_dataset.tnt_deviceinfo\` deviceinfo
                ON 
                    device.id = deviceinfo.deviceId
                JOIN 
                    \`ai-use-cases-431720.tnt_dataset.tnt_trackedUnit\` asset
                ON
                    asset.id = deviceinfo.tuId
                JOIN 
                    \`ai-use-cases-431720.tnt_dataset.tnt_project\` project
                ON 
                    deviceinfo.projectId = project.id
                JOIN 
                    \`ai-use-cases-431720.risk_predictions.tnt_final_temp_predictions\` risk
                ON 
                    risk.device_id = device.id
                LEFT JOIN
                    most_recent_raw_data raw_data
                ON 
                    raw_data.device_identifier = device.id
                WHERE tenant.id = @organizationId`;
    }

    const options = {
      query,
      params: { organizationId },
    };

    const [rows] = await bigquery.query(options);

    if (rows.length === 0) {
      res.status(404).send({ error: 'No data found for this organizationId' });
      return;
    }

    const deviceId = rows[0].device_id;

    // Second query to get temperature ('tm') data
    const tmQuery = `
            SELECT 
                tm,
                TIMESTAMP_SECONDS(CAST(timestamp / 1000 AS INT64)) AS timestamp
            FROM 
                \`ai-use-cases-431720.tnt_dataset.tnt_device_raw_data\`
            WHERE 
                device_identifier = @device_id
                AND TIMESTAMP_SECONDS(CAST(timestamp / 1000 AS INT64)) >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
            ORDER BY timestamp ASC
        `;

    const tmOptions = {
      query: tmQuery,
      params: { device_id: String(deviceId) },
    };

    const [tmRows] = await bigquery.query(tmOptions);
    const result = rows.map((row: RowData) => ({
        ...row,
        tm_data: tmRows.map((tmRow: TMData) => ({
            tm: tmRow.tm,
            timestamp: tmRow.timestamp,
        })),
    }));

    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Error querying BigQuery:', error);
    res.status(500).send({
      error: 'An error occurred while querying BigQuery',
      details: (error as Error).message,
    });
  }
};
