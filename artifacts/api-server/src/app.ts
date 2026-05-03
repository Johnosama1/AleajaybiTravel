import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.disable("etag");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use("/api", router);

const panelFile = path.resolve(__dirname, "public", "panel.html");
if (fs.existsSync(panelFile)) {
  app.get("/panel", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(panelFile);
  });
}

const staticDir = path.resolve(__dirname, "..", "..", "aleajayhi", "dist", "public");
if (fs.existsSync(staticDir)) {
  app.use(
    express.static(staticDir, {
      maxAge: 0,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      },
    }),
  );
  app.use((_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
  logger.info({ staticDir }, "Serving static frontend");
}

export default app;
