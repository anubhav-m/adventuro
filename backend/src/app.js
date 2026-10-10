import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { LIMITS } from './config/constants.js';
import { env } from './config/env.js';
import { logger, serializeRequest } from './config/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { globalLimiter } from './middlewares/rateLimiters.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: [...env.CORS_ORIGINS], credentials: true }));
app.use(pinoHttp({ logger, serializers: { req: serializeRequest } }));
app.use(globalLimiter);
app.use(express.json({ limit: LIMITS.JSON_BODY }));
app.use(cookieParser());

app.use('/api/v1', apiRouter);

app.use(notFound);
app.use(errorHandler);
