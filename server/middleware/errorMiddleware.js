import logger from '../config/logger.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// eslint-disable-next-line
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Check for Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Check for MongoDB duplicate key error (e.g., duplicate email/phone on signup)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : 'unknown';
    message = `A record with that ${field} already exists. (Value: ${value})`;
    statusCode = 409;
  }

  // Check for Mongoose validation errors
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // Log error using winston
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (statusCode === 500) {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'production' ? '🛡️' : err.stack,
  });
};
