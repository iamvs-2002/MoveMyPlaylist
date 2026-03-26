const apiService = require("../services/apiService");
const { sendSuccess, sendError } = require("../utils/api");

/**
 * System Controller for MoveMyPlaylist
 * Handles system health, status, and monitoring endpoints
 */

/**
 * Get system health and status
 */
const getSystemStatus = async (req, res) => {
  try {
    const circuitStatus = apiService.getCircuitStatus();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        formatted: formatUptime(uptime),
      },
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        external: formatBytes(memoryUsage.external),
      },
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      circuitBreakers: circuitStatus,
    };

    // Check if any circuit breakers are open
    const openCircuits = Object.entries(circuitStatus)
      .filter(([_, breaker]) => breaker.state === "OPEN")
      .map(([platform, _]) => platform);

    if (openCircuits.length > 0) {
      status.status = "degraded";
      status.warnings = [
        `Circuit breakers open for: ${openCircuits.join(", ")}`,
      ];
    }

    sendSuccess(res, status, "System status retrieved successfully");
  } catch (error) {
    sendError(
      res,
      "Unable to check system status. Please try again.",
      500,
      null,
      "SYSTEM_STATUS_FAILED",
    );
  }
};

/**
 * Get circuit breaker status
 */
const getCircuitBreakerStatus = async (req, res) => {
  try {
    const circuitStatus = apiService.getCircuitStatus();

    sendSuccess(
      res,
      {
        circuitBreakers: circuitStatus,
        timestamp: new Date().toISOString(),
      },
      "Circuit breaker status retrieved successfully",
    );
  } catch (error) {
    sendError(
      res,
      "Unable to check service status. Please try again.",
      500,
      null,
      "CIRCUIT_STATUS_FAILED",
    );
  }
};

/**
 * Reset circuit breaker for a specific platform
 */
const resetCircuitBreaker = async (req, res) => {
  try {
    const { platform } = req.params;

    if (!["spotify", "youtube"].includes(platform)) {
      return sendError(
        res,
        "Please select a valid music service (Spotify or YouTube Music).",
        400,
        null,
        "INVALID_PLATFORM",
      );
    }

    apiService.resetCircuit(platform);

    sendSuccess(
      res,
      {
        platform,
        message: `Circuit breaker reset for ${platform}`,
        timestamp: new Date().toISOString(),
      },
      "Circuit breaker reset successfully",
    );
  } catch (error) {
    sendError(
      res,
      "Unable to reset service status. Please try again.",
      500,
      null,
      "CIRCUIT_RESET_FAILED",
    );
  }
};

/**
 * Format uptime in human-readable format
 */
const formatUptime = (uptime) => {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format bytes in human-readable format
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

module.exports = {
  getSystemStatus,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
};
