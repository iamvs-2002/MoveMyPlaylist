const express = require("express");
const systemController = require("../controllers/systemController");
const { generalApiLimiter } = require("../middleware/rateLimit");

const router = express.Router();

/**
 * @route GET /api/system/status
 * @desc Get comprehensive system status and health
 * @access Public (with rate limiting)
 */
router.get("/status", generalApiLimiter, systemController.getSystemStatus);

/**
 * @route GET /api/system/circuit-breakers
 * @desc Get circuit breaker status for all platforms
 * @access Public (with rate limiting)
 */
router.get(
  "/circuit-breakers",
  generalApiLimiter,
  systemController.getCircuitBreakerStatus,
);

/**
 * @route POST /api/system/circuit-breakers/:platform/reset
 * @desc Reset circuit breaker for a specific platform
 * @access Public (with rate limiting)
 */
router.post(
  "/circuit-breakers/:platform/reset",
  generalApiLimiter,
  systemController.resetCircuitBreaker,
);

module.exports = router;
