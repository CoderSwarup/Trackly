import logger from '../utils/logger.js';
import config from '../config/config.js';

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.log('Global Error Handler:', {
    error: error.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }



  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Redis connection errors
  if (err.message && err.message.includes('Redis')) {
    const message = 'Database connection error';
    error = { message, statusCode: 503 };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    error = {
      message: err.message || 'Too many requests',
      statusCode: 429
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(config.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
};

export default globalErrorHandler;
