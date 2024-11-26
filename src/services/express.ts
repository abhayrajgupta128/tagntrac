import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import compression from "compression";
import methodOverride from "method-override";

const expressLoader = async ({ app }: { app: any }) => {
  const morganFormat = process.env.NODE_ENV === "development" ? "dev" : "tiny";
  app.version = `${process.env.npm_package_version} (${process.env.NODE_ENV})`;

  // Middleware setup
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(
    compression({
      filter: (req: Request, res: Response) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    })
  );
  app.use(cors({ origin: "*" }));
  app.options("*", cors({ origin: "*" }));
  app.disable("x-powered-by");
  app.use(morgan(morganFormat));
  app.use(methodOverride("X-HTTP-Method-Override"));
  app.use(helmet());

  // CORS headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, enctype"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Accept", "application/json");
    next();
  });

  app.http = new http.Server(app);

  console.log("🖥️  Express initialized...");
};

export default expressLoader;