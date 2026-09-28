/**
 * ECHO ROUTE SMART WASTE
 * Centralized Error Handling Middleware & Custom Error Class
 */

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, details = null) {
    return new ApiError(400, msg, details);
  }

  static unauthorized(msg = 'Authentication required', details = null) {
    return new ApiError(401, msg, details);
  }

  static forbidden(msg = 'Access denied for this role', details = null) {
    return new ApiError(403, msg, details);
  }

  static notFound(msg = 'Requested resource not found', details = null) {
    return new ApiError(404, msg, details);
  }

  static conflict(msg, details = null) {
    return new ApiError(409, msg, details);
  }

  static internal(msg = 'Internal server error', details = null) {
    return new ApiError(500, msg, details);
  }
}

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found on Echo Route server`));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  const details = err.details || null;

  // Log server errors for operational auditing
  if (statusCode >= 500) {
    console.error(`[ECHO ROUTE ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      status: statusCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  });
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler
};
