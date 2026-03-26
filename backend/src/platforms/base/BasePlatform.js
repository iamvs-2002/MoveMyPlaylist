const PlatformInterface = require("./PlatformInterface");

/**
 * Base Platform Class
 * Provides common functionality and default implementations for platform services
 */
class BasePlatform extends PlatformInterface {
  constructor(config) {
    super();
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.displayName = config.displayName;
    this.icon = config.icon;
    this.color = config.color;
    this.capabilities = config.capabilities || {};
    this.apiService = null; // Will be injected
  }

  /**
   * Get platform information
   * @returns {Object} Platform metadata
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      icon: this.icon,
      color: this.color,
      capabilities: this.capabilities,
      config: this.config,
    };
  }

  /**
   * Validate platform configuration
   * @returns {boolean} Whether configuration is valid
   */
  validateConfig() {
    const requiredFields = ["id", "name", "displayName", "icon", "color"];

    for (const field of requiredFields) {
      if (!this.config[field]) {
        console.error(
          `Missing required field '${field}' in platform config for ${this.id}`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Set API service instance
   * @param {Object} apiService - API service instance
   */
  setApiService(apiService) {
    this.apiService = apiService;
  }

  /**
   * Normalize track data to common format
   * @param {Object} rawTrack - Raw track data from platform
   * @returns {Object} Normalized track data
   */
  normalizeTrack(rawTrack) {
    // This should be overridden by platform implementations
    throw new Error("normalizeTrack() must be implemented by platform");
  }

  /**
   * Normalize playlist data to common format
   * @param {Object} rawPlaylist - Raw playlist data from platform
   * @returns {Object} Normalized playlist data
   */
  normalizePlaylist(rawPlaylist) {
    // This should be overridden by platform implementations
    throw new Error("normalizePlaylist() must be implemented by platform");
  }

  /**
   * Normalize user profile data to common format
   * @param {Object} rawProfile - Raw profile data from platform
   * @returns {Object} Normalized profile data
   */
  normalizeUserProfile(rawProfile) {
    // This should be overridden by platform implementations
    throw new Error("normalizeUserProfile() must be implemented by platform");
  }

  /**
   * Build search query from track information
   * @param {Object} track - Track object
   * @returns {string} Search query
   */
  buildSearchQuery(track) {
    let query = track.name || "";

    if (track.artists && track.artists.length > 0) {
      const artistNames = track.artists.map((artist) => artist.name).join(" ");
      query += ` ${artistNames}`;
    }

    if (track.album && track.album.name) {
      query += ` ${track.album.name}`;
    }

    return query.trim();
  }

  /**
   * Normalize track name for comparison
   * @param {string} name - Track name
   * @returns {string} Normalized name
   */
  normalizeTrackName(name) {
    if (!name) return "";

    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Normalize artist name for comparison
   * @param {string} name - Artist name
   * @returns {string} Normalized name
   */
  normalizeArtistName(name) {
    if (!name) return "";

    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Check if tracks are an exact match
   * @param {Object} source - Source track
   * @param {Object} target - Target track
   * @returns {boolean} Whether tracks match exactly
   */
  isExactMatch(source, target) {
    const sourceName = this.normalizeTrackName(source.name);
    const targetName = this.normalizeTrackName(target.name);

    if (sourceName !== targetName) return false;

    // Check artist match
    if (source.artists && target.artists) {
      const sourceArtists = source.artists.map((a) =>
        this.normalizeArtistName(a.name),
      );
      const targetArtists = target.artists.map((a) =>
        this.normalizeArtistName(a.name),
      );

      return sourceArtists.some((sArtist) =>
        targetArtists.some((tArtist) => sArtist === tArtist),
      );
    }

    return true;
  }

  /**
   * Check if tracks are a fuzzy match
   * @param {Object} source - Source track
   * @param {Object} target - Target track
   * @param {number} similarityThreshold - Minimum similarity threshold
   * @returns {boolean} Whether tracks match approximately
   */
  isFuzzyMatch(source, target, similarityThreshold = 0.8) {
    const sourceName = this.normalizeTrackName(source.name);
    const targetName = this.normalizeTrackName(target.name);

    // Check if names are similar
    if (
      this.calculateSimilarity(sourceName, targetName) < similarityThreshold
    ) {
      return false;
    }

    // Check artist similarity
    if (source.artists && target.artists) {
      const sourceArtists = source.artists.map((a) =>
        this.normalizeArtistName(a.name),
      );
      const targetArtists = target.artists.map((a) =>
        this.normalizeArtistName(a.name),
      );

      return sourceArtists.some((sArtist) =>
        targetArtists.some(
          (tArtist) =>
            this.calculateSimilarity(sArtist, tArtist) >
            similarityThreshold - 0.1,
        ),
      );
    }

    return true;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0) return 0.0;
    if (str2.length === 0) return 0.0;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate search query variations for better matching
   * @param {Object} track - Track object
   * @returns {Array<string>} Array of search variations
   */
  generateSearchVariations(track) {
    const variations = [];
    const baseName = track.name || "";
    const artistName = track.artists?.[0]?.name || "";

    // Remove common brackets and parentheses
    const cleanName = baseName.replace(/[\(\[\{].*?[\)\]\}]/g, "").trim();
    if (cleanName !== baseName) {
      variations.push(`${cleanName} ${artistName}`.trim());
    }

    // Add artist first variations
    if (artistName) {
      variations.push(`${artistName} ${baseName}`);
      variations.push(`${artistName} - ${baseName}`);
    }

    // Original query
    variations.push(`${baseName} ${artistName}`.trim());

    return variations.filter((v) => v.length > 0);
  }

  /**
   * Default error handler
   * @param {Error} error - Error object
   * @param {string} operation - Operation that failed
   * @returns {Error} Standardized error
   */
  handleError(error, operation) {
    console.error(`${this.name} ${operation} error:`, error.message);

    // Return a standardized error
    return new Error(
      `Unable to complete ${operation} on ${this.displayName}. Please try again.`,
    );
  }

  /**
   * Get platform-specific error handler
   * @returns {Function} Error handler function
   */
  getErrorHandler() {
    return this.handleError.bind(this);
  }

  /**
   * Sleep utility for rate limiting
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after sleep
   */
  async sleep(ms = 1000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = BasePlatform;
