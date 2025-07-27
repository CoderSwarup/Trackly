import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import config from './config/config.js';
import responseMessage from './constant/responseMessage.js';
import httpError from './utils/httpError.js';
import globalErrorHandler from './middlewares/globalErrorHandler.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import routes from './routes/routes.js';

dotenv.config();

// Initialize express app
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up CORS to accept requests from a specific origin
app.use(
  cors({
    origin: config.CORS_ORIGIN,
  })
);

// Use cookie parser to read cookies
app.use(cookieParser());

// Accept JSON payloads in requests, limiting the size to 16kb
app.use(
  express.json({
    limit: '16kb',
  })
);

// Parse URL-encoded payloads with a limit of 16kb
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Serve static files from the 'Public' folder
app.use(express.static('Public'));

// Apply rate limiting to all routes
app.use('/api/v1', generalLimiter);

// Routes
app.get('/api/v1/healthcheck', async (req, res) => {
  res.send('Hello Sever is Running.....')
})

app.use('/api/v1', routes)


app.use((req, res, next) => {
  try {
    throw new Error(responseMessage.NOT_FOUND('route'))
  } catch (err) {
    httpError(next, err, req, 404)
  }
})

app.use(globalErrorHandler)


export default app;
