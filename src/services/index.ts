import questionServiceLoader from './questionService';
import bigQueryLoader from './bigQuerryService'
import expressLoader from "./express";


const service = async ({ app }: { app: any }) => {
    await bigQueryLoader({ app });
    await expressLoader({ app });
    // await questionServiceLoader({ app });
};

export default service;