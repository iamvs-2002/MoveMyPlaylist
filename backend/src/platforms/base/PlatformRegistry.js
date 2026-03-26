const fs = require("fs");
const path = require("path");

/**
 * Platform Registry
 * Dynamically loads and manages platform instances
 */
class PlatformRegistry {
  constructor() {
    this.platforms = new Map();
    this.platformConfigs = new Map();
    this.apiService = null;
  }

  /**
   * Set API service instance for all platforms
   * @param {Object} apiService - API service instance
   */
  setApiService(apiService) {
    this.apiService = apiService;

    // Update all existing platforms
    for (const platform of this.platforms.values()) {
      platform.setApiService(apiService);
    }
  }

  /**
   * Load platform configurations
   * @param {string} configPath - Path to platform configs
   */
  loadPlatformConfigs(configPath = null) {
    const configsPath = configPath || path.join(__dirname, "../config");

    try {
      if (fs.existsSync(configsPath)) {
        const configFiles = fs.readdirSync(configsPath);

        configFiles.forEach((file) => {
          if (file.endsWith(".js") && file !== "index.js") {
            const config = require(path.join(configsPath, file));
            if (config.id && config.name) {
              this.platformConfigs.set(config.id, config);
              console.log(`Loaded platform config: ${config.id}`);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading platform configs:", error);
    }
  }

  /**
   * Load platform implementations
   * @param {string} platformsPath - Path to platform implementations
   */
  loadPlatforms(platformsPath = null) {
    const platformsDir = platformsPath || path.join(__dirname, "..");

    try {
      if (fs.existsSync(platformsDir)) {
        const platformDirs = fs.readdirSync(platformsDir);

        platformDirs.forEach((dir) => {
          if (dir !== "base" && dir !== "config") {
            const platformPath = path.join(platformsDir, dir);
            const stats = fs.statSync(platformPath);

            if (stats.isDirectory()) {
              this.loadPlatform(dir, platformPath);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading platforms:", error);
    }
  }

  /**
   * Load a specific platform
   * @param {string} platformId - Platform identifier
   * @param {string} platformPath - Path to platform directory
   */
  loadPlatform(platformId, platformPath) {
    try {
      const indexPath = path.join(platformPath, "index.js");

      if (fs.existsSync(indexPath)) {
        const PlatformClass = require(indexPath);

        // Check if platform config exists
        const config = this.platformConfigs.get(platformId);
        if (!config) {
          console.warn(`No config found for platform: ${platformId}`);
          return;
        }

        // Create platform instance
        const platform = new PlatformClass(config);

        // Validate platform
        if (!platform.validateConfig()) {
          console.error(`Invalid configuration for platform: ${platformId}`);
          return;
        }

        // Set API service if available
        if (this.apiService) {
          platform.setApiService(this.apiService);
        }

        // Register platform
        this.register(platform);
        console.log(`Loaded platform: ${platformId}`);
      }
    } catch (error) {
      console.error(`Error loading platform ${platformId}:`, error);
    }
  }

  /**
   * Register a platform instance
   * @param {Object} platform - Platform instance
   */
  register(platform) {
    if (!platform.id) {
      console.error("Cannot register platform without ID");
      return;
    }

    if (this.platforms.has(platform.id)) {
      console.warn(`Platform ${platform.id} already registered, replacing...`);
    }

    this.platforms.set(platform.id, platform);
    console.log(`Registered platform: ${platform.id}`);
  }

  /**
   * Get platform by ID
   * @param {string} platformId - Platform identifier
   * @returns {Object|null} Platform instance or null if not found
   */
  getPlatform(platformId) {
    return this.platforms.get(platformId) || null;
  }

  /**
   * Get all registered platforms
   * @returns {Array} Array of platform instances
   */
  getAllPlatforms() {
    return Array.from(this.platforms.values());
  }

  /**
   * Get platform IDs
   * @returns {Array} Array of platform IDs
   */
  getPlatformIds() {
    return Array.from(this.platforms.keys());
  }

  /**
   * Check if platform is registered
   * @param {string} platformId - Platform identifier
   * @returns {boolean} Whether platform is registered
   */
  hasPlatform(platformId) {
    return this.platforms.has(platformId);
  }

  /**
   * Get platform configuration
   * @param {string} platformId - Platform identifier
   * @returns {Object|null} Platform configuration or null if not found
   */
  getPlatformConfig(platformId) {
    return this.platformConfigs.get(platformId) || null;
  }

  /**
   * Get all platform configurations
   * @returns {Array} Array of platform configurations
   */
  getAllPlatformConfigs() {
    return Array.from(this.platformConfigs.values());
  }

  /**
   * Unregister a platform
   * @param {string} platformId - Platform identifier
   * @returns {boolean} Whether platform was unregistered
   */
  unregister(platformId) {
    if (this.platforms.has(platformId)) {
      this.platforms.delete(platformId);
      console.log(`Unregistered platform: ${platformId}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all platforms
   */
  clear() {
    this.platforms.clear();
    console.log("Cleared all platforms");
  }

  /**
   * Get platform info for all registered platforms
   * @returns {Array} Array of platform info objects
   */
  getAllPlatformInfo() {
    return Array.from(this.platforms.values()).map((platform) =>
      platform.getInfo(),
    );
  }

  /**
   * Get platforms with specific capability
   * @param {string} capability - Required capability
   * @returns {Array} Array of platforms with the capability
   */
  getPlatformsWithCapability(capability) {
    return Array.from(this.platforms.values()).filter(
      (platform) => platform.capabilities[capability] === true,
    );
  }

  /**
   * Validate all platforms
   * @returns {Object} Validation results
   */
  validateAllPlatforms() {
    const results = {
      valid: [],
      invalid: [],
    };

    for (const [id, platform] of this.platforms) {
      try {
        if (platform.validateConfig()) {
          results.valid.push(id);
        } else {
          results.invalid.push(id);
        }
      } catch (error) {
        results.invalid.push({ id, error: error.message });
      }
    }

    return results;
  }

  /**
   * Initialize the registry
   * @param {Object} options - Initialization options
   */
  async initialize(options = {}) {
    console.log("Initializing platform registry...");

    // Load platform configs
    if (options.configPath) {
      this.loadPlatformConfigs(options.configPath);
    } else {
      this.loadPlatformConfigs();
    }

    // Load platform implementations
    if (options.platformsPath) {
      this.loadPlatforms(options.platformsPath);
    } else {
      this.loadPlatforms();
    }

    // Validate all platforms
    const validation = this.validateAllPlatforms();
    console.log(
      `Platform registry initialized. Valid: ${validation.valid.length}, Invalid: ${validation.invalid.length}`,
    );

    if (validation.invalid.length > 0) {
      console.warn("Invalid platforms:", validation.invalid);
    }

    return validation;
  }
}

module.exports = PlatformRegistry;
