import { app } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

await connectDb();
logger.info('MongoDB connected');

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Adventuro API listening');
});

let shuttingDown = false;

const shutdown = async (reason, exitCode) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ reason }, 'Shutting down');

  setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  try {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    await disconnectDb();
    process.exit(exitCode);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));

process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'Unhandled promise rejection');
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  shutdown('uncaughtException', 1);
});
