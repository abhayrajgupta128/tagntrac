import questionServiceLoader from './questionService';
import bigQueryLoader from './bigQuerryService'


const service = async ({ app }: { app: any }) => {
    await bigQueryLoader({ app });
    // await questionServiceLoader({ app });
};

export default service;