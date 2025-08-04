// ------------------------------
// Core Module Imports
// ------------------------------
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ------------------------------
// Third-Party Middleware
// ------------------------------
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// ------------------------------
// Security & Sanitization Middleware
// ------------------------------
import sanitizeMongoMiddleware from './santizeData/santizeMongo.js';
import sanitizeXSSMiddleware from './santizeData/sanitizeXSS.js';

// ------------------------------
// Error Handling
// ------------------------------
import globalErrorHandler from './controllers/errorController.js';
import AppError from './utilis/appError.js';

// ------------------------------
// Route Imports
// ------------------------------
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// ------------------------------
// App Initialization
// ------------------------------
const app = express();

// Resolve __dirname in ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------
// Global Middleware Setup
// ------------------------------

// Serve static files (e.g. from /public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Set HTTP headers for security
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting for API (100 requests per hour)
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

// Body parser - reading data from body into req.body (limit to 10kb)
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL injection and XSS
app.use(sanitizeMongoMiddleware);
app.use(sanitizeXSSMiddleware);

// Add request time to each request object
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ------------------------------
// Routes Mounting
// ------------------------------
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRoutes);

// ------------------------------
// Unhandled Routes
// ------------------------------
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

// ------------------------------
// Global Error Handling Middleware
// ------------------------------
app.use(globalErrorHandler);

// ------------------------------
// Export App
// ------------------------------
export default app;
