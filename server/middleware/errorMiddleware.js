import logger from '../config/logger.js';

export const notFound = (req, res, next) => {
  const error = new Error('Resource not found');
  res.status(404);
  next(error);
};

// Global Enterprise Error Handler
// eslint-disable-next-line
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let clientMessage = err.message || 'An unexpected error occurred';

  // Check for Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    clientMessage = 'Resource not found';
    statusCode = 404;
  }

  // Check for MongoDB duplicate key error
  if (err.code === 11000) {
    clientMessage = 'A record with this identifier already exists.';
    statusCode = 409;
  }

  // Check for Mongoose validation errors
  if (err.name === 'ValidationError') {
    clientMessage = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    clientMessage = 'Authentication token invalid or expired';
    statusCode = 401;
  }

  // Hide internal server / database / Redis error messages in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    clientMessage = 'Internal server error';
  }

  // Log error using winston server-side only
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (statusCode === 500 && err.stack) {
    logger.error(err.stack);
  }

  const response = {
    error: clientMessage
  };

  // Only attach stack trace in development
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
