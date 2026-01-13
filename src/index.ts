import app from "./app.js";
import websocket from "./websocket.js";
import config from "./config/config.js";
import logger from "./config/logger.js";
import { initSql, closeSql } from "./lib/prisma/index.js";
import { initValkey, closeValkey } from "./lib/valkey.js";
import http from "http";
import wsSubscriber from "./subscribers/ws.subscriber.js";

(async () => {
  await Promise.all([initSql(), initValkey()]);

  const server = http.createServer(app);

  const wss = await websocket.createSocketServer(server);

  wsSubscriber.initialize();

  server.listen(config.port, () => {
    logger.info(`Listening on port ${config.port}`);
  });

  const shutdown = async () => {
    await Promise.allSettled([closeSql(), closeValkey()]);

    wss.clients.forEach((client) => {
      logger.info("Terminating WebSocket client...");
      client.terminate();
    });

    server.close();
  };

  const unexpectedErrorHandler = (error: Error) => {
    logger.error(error);
    shutdown();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
})();
