import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { loadEnv } from "./env.js";
import { BayerChatClient } from "./bayerClient.js";
import { mountRoutes } from "./routes.js";
import { Logger } from "./logger.js";

dotenv.config();

const env = loadEnv();

const logger = new Logger({ level: env.LOG_LEVEL });

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  const requestId = req.header("x-request-id") ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  (req as any).requestId = requestId;
  res.setHeader("x-request-id", requestId);

  if (!env.DEBUG_HTTP) return next();

  const start = Date.now();
  const log = logger.child({ requestId });

  const body = env.DEBUG_HTTP_BODY ? req.body : undefined;
  log.info("http.request", {
    method: req.method,
    path: req.originalUrl,
    body
  });

  res.on("finish", () => {
    log.info("http.response", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start
    });
  });

  next();
});

const client = new BayerChatClient({
  baseUrl: env.BAYER_CHAT_BASE_URL,
  accessToken: env.BAYER_CHAT_ACCESS_TOKEN,
  project: env.BAYER_CHAT_PROJECT,
  logger,
  debugUpstream: env.DEBUG_UPSTREAM
});

mountRoutes(app, client, logger);

app.listen(env.PORT, () => {
  logger.info("service.listening", { url: `http://localhost:${env.PORT}` });
});
