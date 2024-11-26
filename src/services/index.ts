import bigQueryLoader from './bigQuerry'
import expressLoader from "./express";
import generativeAILoader from "./generativeAi";


const service = async ({ app }: { app: any }) => {
    await expressLoader({ app });
    await bigQueryLoader({ app });
    await generativeAILoader({ app });
};

export default service;