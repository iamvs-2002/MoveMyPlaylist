/**
 * Platforms Index
 * Main entry point for the platform system
 */

const PlatformRegistry = require("./base/PlatformRegistry");
const apiService = require("../services/apiService");

// Create and configure platform registry
const platformRegistry = new PlatformRegistry();

// Set API service for all platforms
platformRegistry.setApiService(apiService);

// Initialize platform registry
platformRegistry.initialize().catch((error) => {
  console.error("Failed to initialize platform registry:", error);
});

module.exports = {
  platformRegistry,
  PlatformRegistry,
};
