/**
 * Centralized error handling utilities
 * Provides consistent error responses and logging
 */

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Custom error class for validation errors
 */
class ValidationError extends APIError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Custom error class for Spotify API errors
 */
class SpotifyError extends APIError {
  constructor(message, originalError = null) {
    super(message, 500, 'SPOTIFY_ERROR');
    this.name = 'SpotifyError';
    this.originalError = originalError;
    
    // Map common Spotify error status codes
    if (originalError && originalError.statusCode) {
      switch (originalError.statusCode) {
        case 401:
          this.statusCode = 401;
          this.code = 'SPOTIFY_UNAUTHORIZED';
          break;
        case 403:
          this.statusCode = 403;
          this.code = 'SPOTIFY_FORBIDDEN';
          break;
        case 429:
          this.statusCode = 429;
          this.code = 'SPOTIFY_RATE_LIMITED';
          break;
        case 404:
          this.statusCode = 404;
          this.code = 'SPOTIFY_NOT_FOUND';
          break;
      }
    }
  }
}

/**
 * Formats error response for API
 * @param {Error} error - Error object
 * @param {string} requestId - Optional request ID for tracking
 * @returns {Object} - Formatted error response
 */
function formatErrorResponse(error, requestId = null) {
  const response = {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: error.timestamp || new Date().toISOString()
    }
  };
  
  if (requestId) {
    response.error.requestId = requestId;
  }
  
  // Add validation errors if present
  if (error instanceof ValidationError && error.errors.length > 0) {
    response.error.validationErrors = error.errors;
  }
  
  // Add additional context for development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    
    if (error.originalError) {
      response.error.originalError = {
        message: error.originalError.message,
        statusCode: error.originalError.statusCode,
        body: error.originalError.body
      };
    }
  }
  
  return response;
}

/**
 * Logs error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function logError(error, context = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    },
    context
  };
  
  console.error('🚨 Error occurred:', JSON.stringify(logData, null, 2));
}

/**
 * Express error handling middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorMiddleware(error, req, res, next) {
  // Generate request ID for tracking
  const requestId = req.headers['x-request-id'] || 
                   req.id || 
                   Math.random().toString(36).substring(7);
  
  // Log error with request context
  logError(error, {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Determine status code
  const statusCode = error.statusCode || 500;
  
  // Format and send error response
  const errorResponse = formatErrorResponse(error, requestId);
  res.status(statusCode).json(errorResponse);
}

/**
 * Async wrapper for route handlers
 * Automatically catches and forwards async errors
 * @param {Function} fn - Async route handler
 * @returns {Function} - Wrapped route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Creates a timeout wrapper for async operations
 * @param {Function} fn - Async function
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} timeoutMessage - Timeout error message
 * @returns {Function} - Wrapped function with timeout
 */
function withTimeout(fn, timeoutMs = 30000, timeoutMessage = 'Operation timed out') {
  return async (...args) => {
    return Promise.race([
      fn(...args),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new APIError(timeoutMessage, 408, 'TIMEOUT'));
        }, timeoutMs);
      })
    ]);
  };
}

module.exports = {
  APIError,
  ValidationError,
  SpotifyError,
  formatErrorResponse,
  logError,
  errorMiddleware,
  asyncHandler,
  withTimeout
};
