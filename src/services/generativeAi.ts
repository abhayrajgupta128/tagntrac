import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';

dotenv.config();

const project = process.env.PROJECT_ID;
const location = process.env.LOCATION;
const textModel = process.env.TEXT_MODEL || "gemini-pro";


const generativeAiService = async ({ app }: { app: any }) => {

    const vertexAI = new VertexAI({ project, location });
    try {
        app.generativeModel = vertexAI.getGenerativeModel({
            model: textModel,
            generationConfig : {
                maxOutputTokens : 4096,
                temperature: 0.3,
                topK: 20,
                topP: 0.9,
            }
        });

        console.log('🤖 Generative AI service initialized...');
    } catch (error) {
        console.error('Error initializing Generative AI service:', error);
    }
};

export default generativeAiService;