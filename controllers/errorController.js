import multer from 'multer';
import AppError from '../utilis/appError.js';
import {
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  jsonWebTokenError,
  tokenExpiredError,
} from '../utilis/errorHandlers.js';

// Send detailed error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send user-friendly error in production
const sendErrorProd = (err, res) => {
  // Trusted operational error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown error: don't leak details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  // Default error values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // ✅ Handle Multer file upload errors before anything else
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      err = new AppError('File too large. Max allowed size is 500KB.', 400);
    } else {
      err = new AppError(err.message, 400);
    }
  }

  // Development: show full error details
  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  // Production: handle known errors gracefully
  if (process.env.NODE_ENV === 'production') {
    // Shallow clone to avoid mutating original error
    let error = { ...err };

    // Manually copy non-enumerable properties
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;
    error.stack = err.stack;
    error.statusCode = err.statusCode;
    error.status = err.status;

    // Mongoose/MongoDB specific errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    // JWT errors
    if (error.name === 'JsonWebTokenError') error = jsonWebTokenError();
    if (error.name === 'TokenExpiredError') error = tokenExpiredError();

    // Send safe response to client
    return sendErrorProd(error, res);
  }
};

export default globalErrorHandler;

//legacy code
// const globalErrorHandler = (err, req, res, next) => {
//   let error = { ...err, message: err.message };

//   error.statusCode = err.statusCode || 500;
//   error.status = err.status || 'error';

//   if (process.env.NODE_ENV === 'development') {
//     return res.status(error.statusCode).json({
//       status: error.status,
//       error,
//       message: error.message,
//       stack: error.stack,
//     });
//   }

//   if (process.env.NODE_ENV === 'production') {
//     if (err.name === 'CastError') error = handleCastErrorDB(err);
//     if (err.code === 11000) error = handleDuplicateFieldsDB(err);
//     if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
//     if (err.name === 'JsonWebTokenError') error = handleJWTError(err);

//     if (error.isOperational) {
//       return res.status(error.statusCode).json({
//         status: error.status,
//         message: error.message,
//       });
//     }

//     // Unknown or programming errors
//     return res.status(500).json({
//       status: 'error',
//       message: 'Something went very wrong!',
//     });
//   }

//   // Fallback
//   return res.status(error.statusCode).json({
//     status: error.status,
//     message: error.message,
//   });
// };

// export default globalErrorHandler;
