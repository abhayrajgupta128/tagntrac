import bigQueryLoader from './bigQuerry'
import expressLoader from "./express";
import generativeAILoader from "./generativeAi";


const service = async ({ app }: { app: any }) => {
    await bigQueryLoader({ app });
    await expressLoader({ app });
    await generativeAILoader({ app });
};

export default service;