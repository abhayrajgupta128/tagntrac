import { BigQuery } from '@google-cloud/bigquery';
import * as fs from 'fs';
import * as path from 'path';

const bigQuerryService = async ({ app }: { app: any }) => {
  try {
    const credentialsPath = path.resolve(__dirname, '../../ai-use-cases-431720-3a078e52f84d.json');
    const bigQuerryConfig = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    app.bigQuerry = new BigQuery({
      credentials: bigQuerryConfig,
      projectId: bigQuerryConfig.project_id,
    });

    console.log('📀 BigQuery service initialized...');
  } catch (error) {
    console.error('Error initializing BigQuery service:', error);
  }
};

export default bigQuerryService;
