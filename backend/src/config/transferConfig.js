/**
 * Transfer Algorithm Configuration
 * Centralized configuration for the enhanced transfer service
 */

module.exports = {
  // Search algorithm settings
  searchAlgorithms: {
    FAST: 0, // Return first result (fastest, least accurate)
    STRICT: 1, // Exact match required (slower, more accurate)
    SMART: 2, // Fuzzy matching with fallbacks (balanced)
  },

  // Default algorithm to use
  defaultAlgorithm: 2, // SMART

  // Rate limiting settings
  rateLimiting: {
    trackSleepMs: 1000, // 1 second between tracks
    batchSize: 10, // Process tracks in batches
    batchDelayMs: 5000, // 5 seconds between batches
    maxRetries: 3, // Max retries for failed tracks
    retryDelayMs: 2000, // 2 seconds between retries
  },

  // Search settings
  search: {
    maxAlbumResults: 3, // Max albums to check per artist
    maxTrackResults: 10, // Max track results to analyze
    maxFuzzyVariations: 5, // Max search variations to try
    similarityThreshold: 0.8, // Minimum similarity for fuzzy match
    artistSimilarityThreshold: 0.7, // Minimum artist similarity
  },

  // Platform-specific settings
  platforms: {
    spotify: {
      searchLimit: 20,
      albumSearchLimit: 5,
      trackSearchLimit: 10,
    },
    youtube: {
      searchLimit: 20,
      videoSearchLimit: 5,
      playlistSearchLimit: 10,
    },
  },

  // Error handling
  errorHandling: {
    continueOnTrackFailure: true, // Continue transfer if individual tracks fail
    logFailedTracks: true, // Log details of failed tracks
    maxConsecutiveFailures: 5, // Max consecutive failures before pausing
    failurePauseMs: 10000, // Pause duration after consecutive failures
  },

  // Progress reporting
  progress: {
    updateIntervalMs: 1000, // How often to update progress
    detailedLogging: true, // Log detailed progress information
    saveIntermediateResults: true, // Save results as they're processed
  },
};
