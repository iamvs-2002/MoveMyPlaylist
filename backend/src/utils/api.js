/**
 * Standard API Response Utilities
 * Provides consistent response format for all API endpoints
 */

/**
 * Standard API Response Structure
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Human-readable message
 * @property {*} data - Response data (optional)
 * @property {Object} meta - Metadata like pagination, timestamps (optional)
 * @property {Object} error - Error details (only present when success is false)
 */

/**
 * Create a successful API response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted API response
 */
const successResponse = (data = null, message = "Success", meta = {}) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== null && { data }),
    ...(Object.keys(meta).length > 0 && { meta }),
  };

  return response;
};

/**
 * Create an error API response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} details - Additional error details
 * @param {string} code - Error code for client handling
 * @returns {Object} Formatted API error response
 */
const errorResponse = (
  message,
  statusCode = 500,
  details = null,
  code = null,
) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    error: {
      statusCode,
      ...(code && { code }),
      ...(details && { details }),
    },
  };

  return response;
};

/**
 * Create a paginated response
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated API response
 */
const paginatedResponse = (
  data,
  page,
  limit,
  total,
  message = "Data retrieved successfully",
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const meta = {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      ...(hasNextPage && { nextPage: page + 1 }),
      ...(hasPrevPage && { prevPage: page - 1 }),
    },
  };

  return successResponse(data, message, meta);
};

/**
 * Create a validation error response
 * @param {Array} errors - Validation error details
 * @param {string} message - Error message
 * @returns {Object} Formatted validation error response
 */
const validationErrorResponse = (errors, message = "Validation failed") => {
  return errorResponse(
    message,
    400,
    { validationErrors: errors },
    "VALIDATION_ERROR",
  );
};

/**
 * Create a not found error response
 * @param {string} resource - Name of the resource that wasn't found
 * @returns {Object} Formatted not found error response
 */
const notFoundResponse = (resource = "Resource") => {
  return errorResponse(`${resource} not found`, 404, null, "NOT_FOUND");
};

/**
 * Create an unauthorized error response
 * @param {string} message - Unauthorized message
 * @returns {Object} Formatted unauthorized error response
 */
const unauthorizedResponse = (message = "Unauthorized access") => {
  return errorResponse(message, 401, null, "UNAUTHORIZED");
};

/**
 * Create a forbidden error response
 * @param {string} message - Forbidden message
 * @returns {Object} Formatted forbidden error response
 */
const forbiddenResponse = (message = "Access forbidden") => {
  return errorResponse(message, 403, null, "FORBIDDEN");
};

/**
 * Create a conflict error response
 * @param {string} message - Conflict message
 * @param {*} details - Conflict details
 * @returns {Object} Formatted conflict error response
 */
const conflictResponse = (message = "Resource conflict", details = null) => {
  return errorResponse(message, 409, details, "CONFLICT");
};

/**
 * Create a rate limit error response
 * @param {string} message - Rate limit message
 * @param {number} retryAfter - Seconds to wait before retrying
 * @returns {Object} Formatted rate limit error response
 */
const rateLimitResponse = (message = "Too many requests", retryAfter = 60) => {
  return errorResponse(message, 429, { retryAfter }, "RATE_LIMIT_EXCEEDED");
};

/**
 * Send a standardized response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} response - API response object
 */
const sendResponse = (res, statusCode, response) => {
  res.status(statusCode).json(response);
};

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (
  res,
  data = null,
  message = "Success",
  meta = {},
  statusCode = 200,
) => {
  const response = successResponse(data, message, meta);
  sendResponse(res, statusCode, response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} details - Additional error details
 * @param {string} code - Error code for client handling
 */
const sendError = (
  res,
  message,
  statusCode = 500,
  details = null,
  code = null,
) => {
  const response = errorResponse(message, statusCode, details, code);
  sendResponse(res, statusCode, response);
};

/**
 * Async error handler wrapper for Express routes
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  // Response creators
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  rateLimitResponse,

  // Response senders
  sendResponse,
  sendSuccess,
  sendError,

  // Utilities
  asyncHandler,
};
