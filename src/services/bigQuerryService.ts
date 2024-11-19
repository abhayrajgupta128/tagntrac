import { BigQuery } from '@google-cloud/bigquery';
import bigQuerryConfig from "../../ai-use-cases-431720-3a078e52f84d.json";

const bigQuerryService = async ({ app }: { app: any }) => {
  try {
    const credentials = bigQuerryConfig;

    app.bigQuerry = new BigQuery({
      credentials: credentials,
      projectId: credentials.project_id,
    });

    console.log('BigQuery service initialized successfully.');
  } catch (error) {
    console.error('Error initializing BigQuery service:', error);
    console.log('BigQuery service not initialized.');
  }
};

export default bigQuerryService;


/* -----------exaple use------------- 
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/query', async (req: Request, res: Response) => {
  try {
    const bigquery = req.app.bigQuerry;
    const [rows] = await bigquery.query('SELECT * FROM `your_dataset.your_table` LIMIT 10');
    res.json(rows);
  } catch (error) {
    console.error('Error executing BigQuery query:', error);
    res.status(500).send('Error executing BigQuery query');
  }
});

export default router;
-----------------------------------
*/