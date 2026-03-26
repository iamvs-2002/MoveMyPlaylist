const rateLimit = require("express-rate-limit");

/**
 * Rate limiting middleware for MoveMyPlaylist
 * Provides different rate limits for different types of endpoints
 */

// General API rate limit (100 requests per 15 minutes)
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests",
    message: "Rate limit exceeded. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: "Too many requests",
        statusCode: 429,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: 15 * 60,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Authentication endpoints rate limit (20 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs (increased from 5)
  message: {
    error: "Too many authentication attempts",
    message: "Too many authentication attempts. Please try again later.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: "Too many authentication attempts",
        statusCode: 429,
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        retryAfter: 15 * 60,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Status endpoints rate limit (50 requests per 15 minutes)
const statusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 status requests per windowMs
  message: {
    error: "Too many status requests",
    message: "Too many status requests. Please try again later.",
    code: "STATUS_RATE_LIMIT_EXCEEDED",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: "Too many status requests",
        statusCode: 429,
        code: "STATUS_RATE_LIMIT_EXCEEDED",
        retryAfter: 15 * 60,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Transfer endpoints rate limit (10 requests per hour)
const transferLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 transfer requests per hour
  message: {
    error: "Too many transfer requests",
    message: "Too many transfer requests. Please try again later.",
    code: "TRANSFER_RATE_LIMIT_EXCEEDED",
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: "Too many transfer requests",
        statusCode: 429,
        code: "TRANSFER_RATE_LIMIT_EXCEEDED",
        retryAfter: 60 * 60,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

// Health check rate limit (1000 requests per 15 minutes)
const healthCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 health check requests per windowMs
  message: {
    error: "Too many health check requests",
    message: "Too many health check requests.",
    code: "HEALTH_CHECK_RATE_LIMIT_EXCEEDED",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: "Too many health check requests",
        statusCode: 429,
        code: "HEALTH_CHECK_RATE_LIMIT_EXCEEDED",
        retryAfter: 15 * 60,
      },
      timestamp: new Date().toISOString(),
    });
  },
});

module.exports = {
  generalApiLimiter,
  authLimiter,
  statusLimiter,
  transferLimiter,
  healthCheckLimiter,
};
