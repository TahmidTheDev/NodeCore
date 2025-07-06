import {
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  jsonWebTokenError,
  tokenExpiredError,
} from '../utilis/errorHandlers.js';

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  // Set default values on original error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // In development, return full original error
    return sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Create a safe shallow clone
    let error = { ...err };

    // Copy important non-enumerable properties manually
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;
    error.stack = err.stack;
    error.statusCode = err.statusCode;
    error.status = err.status;

    // Handle known Mongoose errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = jsonWebTokenError();

    if (err.name === 'TokenExpiredError') error = tokenExpiredError();

    // Send production-appropriate response
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
