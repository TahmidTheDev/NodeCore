import express from 'express';

// import dotenv from 'dotenv';
// dotenv.config();
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import path from 'path';
import { fileURLToPath } from 'url';
import sanitizeMongoMiddleware from './santizeData/santizeMongo.js';
import sanitizeXSSMiddleware from './santizeData/sanitizeXSS.js';
import globalErrorHandler from './controllers/errorController.js';
import AppError from './utilis/appError.js';
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';

const app = express();

app.use(helmet());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const apiLimit = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api', apiLimit);

app.use(express.json({ limit: '10kb' }));

app.use(sanitizeMongoMiddleware);
app.use(sanitizeXSSMiddleware);

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all(/.*/, (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on the server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);

export default app;
