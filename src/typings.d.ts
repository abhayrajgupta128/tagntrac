import { BigQuery } from '@google-cloud/bigquery';
import winston from 'winston';

declare global {
  namespace Express {
    export interface Request {
      correlationID: string;
      logger: winston.Logger;
    }

    export interface Application {
      bigQuerry: BigQuery;
      generativeModel: ReturnType<VertexAI['getGenerativeModel']>;
    }
  }
}

export interface RowData {
  tenant_id: string;
  tenant_name: string;
  shipment_id?: string;
  shipment_name?: string;
  shipment_status?: number;
  shipment_start_time?: string;
  shipment_end_time?: string;
  shipment_source?: string;
  shipment_destination?: string;
  shipment_asset_status?: number;
  asset_id: string;
  asset_name: string;
  asset_status: number;
  device_id: string;
  device_identifier: string;
  risk_level: number;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  last_reported_at?: string;
  tm?: number;
  prediction_start_timestamp?: string;
  predicted_temperature?: number;
  time_until_excursion?: number;
  distance_to_destination?: number;
  dest_lat?: number;
  dest_lng?: number;
  source_lat?: number;
  source_lng?: number;
  risk_type?: string;
  risk_sub_type?: string;
}

export interface TMData {
  tm: number;
  timestamp: string;
}

declare namespace API {}
