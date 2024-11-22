import { Request, Response, NextFunction } from "express";

export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];
  console.log(apiKey);

  if (!apiKey) {
    console.error("No API key found in the request");
    res.status(401).json({ error: "No API key found in the request" });
    return;
  }

  if (apiKey !== process.env.API_KEY) {
    console.error("Unauthorized API key found in the request");
    res.status(403).json({ error: "Unauthorized API key" });
    return;
  }

  console.log("API key authenticated successfully");
  next();
};
