const { platformRegistry } = require("../platforms");
const transferConfig = require("../config/transferConfig");

/**
 * Enhanced Transfer Service with Platform-Agnostic Architecture
 * Implements multi-layered search algorithms for better track matching
 * Now supports any platform registered in the platform registry
 */

class TransferService {
  constructor() {
    this.searchAlgorithms = transferConfig.searchAlgorithms;
    this.defaultAlgorithm = transferConfig.defaultAlgorithm;
    this.trackSleepMs = transferConfig.rateLimiting.trackSleepMs;
    this.config = transferConfig;
  }

  /**
   * Enhanced track matching with smart batching and artist grouping
   */
  async findTrackMatch(
    sourceTrack,
    targetPlatformId,
    accessToken,
    algorithm = null,
    options = {},
  ) {
    const searchAlgo = algorithm || this.defaultAlgorithm;

    console.log(
      `🔍 TransferService: Finding match for "${sourceTrack.name}" on ${targetPlatformId} using ${searchAlgo} algorithm`,
    );

    try {
      let result = null;

      switch (searchAlgo) {
        case this.searchAlgorithms.FAST:
          result = await this.fastSearch(
            sourceTrack,
            targetPlatformId,
            accessToken,
            options,
          );
          break;
        case this.searchAlgorithms.STRICT:
          result = await this.strictSearch(
            sourceTrack,
            targetPlatformId,
            accessToken,
            options,
          );
          break;
        case this.searchAlgorithms.SMART:
          result = await this.smartSearch(
            sourceTrack,
            targetPlatformId,
            accessToken,
            options,
          );
          break;
        default:
          result = await this.smartSearch(
            sourceTrack,
            targetPlatformId,
            accessToken,
            options,
          );
      }

      if (result) {
        console.log(
          `🔍 TransferService: ✅ Match found: "${result.name}" (ID: ${result.id})`,
        );
      } else {
        console.log(
          `🔍 TransferService: ❌ No match found for "${sourceTrack.name}"`,
        );
      }

      return result;
    } catch (error) {
      console.error(
        `🔍 TransferService: ❌ Track matching failed for "${sourceTrack.name}":`,
        error.message,
      );
      return null;
    }
  }

  /**
   * NEW: Batch process multiple tracks efficiently by grouping by artist
   */
  async batchFindTrackMatches(
    sourceTracks,
    targetPlatformId,
    accessToken,
    algorithm = null,
    options = {},
  ) {
    console.log(
      `🔍 TransferService: Starting batch processing for ${sourceTracks.length} tracks on ${targetPlatformId}`,
    );

    // Group tracks by artist for efficient searching
    const artistGroups = this.groupTracksByArtist(sourceTracks);
    console.log(
      `🔍 TransferService: Grouped into ${Object.keys(artistGroups).length} artist groups:`,
      Object.keys(artistGroups).map(
        (artist) => `${artist} (${artistGroups[artist].length} tracks)`,
      ),
    );

    const results = new Map(); // trackId -> result
    const searchCache = new Map(); // artist -> search results

    // Process each artist group
    for (const [artistName, tracks] of Object.entries(artistGroups)) {
      try {
        console.log(
          `🔍 TransferService: Processing artist group: "${artistName}" with ${tracks.length} tracks`,
        );

        // Single API call per artist
        const artistSearchResults = await this.searchTracksByArtist(
          targetPlatformId,
          accessToken,
          artistName,
          50,
          options,
        );
        searchCache.set(artistName, artistSearchResults);

        // Match all tracks from this artist against the search results
        for (const track of tracks) {
          const match = this.findBestMatchInResults(track, artistSearchResults);
          if (match) {
            results.set(track.id, match);
            console.log(
              `🔍 TransferService: ✅ Batch match found: "${track.name}" -> "${match.name}"`,
            );
          } else {
            console.log(
              `🔍 TransferService: ❌ No batch match for "${track.name}" in artist results`,
            );
          }
        }

        // Rate limiting between artist groups
        if (Object.keys(artistGroups).length > 1) {
          await this.sleep(500); // Small delay between artists
        }
      } catch (error) {
        console.error(
          `🔍 TransferService: ❌ Failed to process artist group "${artistName}":`,
          error.message,
        );
        // Mark all tracks in this group as failed
        for (const track of tracks) {
          results.set(track.id, null);
        }
      }
    }

    // Convert results back to array format
    const finalResults = sourceTracks.map(
      (track) => results.get(track.id) || null,
    );

    const successCount = finalResults.filter((r) => r !== null).length;
    console.log(
      `🔍 TransferService: Batch processing complete: ${successCount}/${sourceTracks.length} tracks matched`,
    );

    return finalResults;
  }

  /**
   * NEW: Group tracks by artist for efficient batch processing
   */
  groupTracksByArtist(tracks) {
    const groups = {};

    for (const track of tracks) {
      const artistName = track.artists?.[0]?.name || "Unknown Artist";

      if (!groups[artistName]) {
        groups[artistName] = [];
      }
      groups[artistName].push(track);
    }

    // Sort groups by track count (most tracks first for efficiency)
    const sortedGroups = {};
    Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length)
      .forEach(([artist, tracks]) => {
        sortedGroups[artist] = tracks;
      });

    return sortedGroups;
  }

  /**
   * NEW: Search tracks by artist name (single API call for multiple tracks)
   */
  async searchTracksByArtist(
    platformId,
    accessToken,
    artistName,
    limit = 50,
    options = {},
  ) {
    console.log(
      `🔍 TransferService: Searching tracks by artist "${artistName}" on ${platformId} (limit: ${limit})`,
    );

    const platform = platformRegistry.getPlatform(platformId);
    if (!platform) {
      throw new Error(`Unsupported platform: ${platformId}`);
    }

    try {
      // Search by artist name to get multiple tracks at once
      const searchQuery = artistName;
      const results = await platform.searchTracks(accessToken, searchQuery, {
        limit,
        ...options,
      });

      console.log(
        `🔍 TransferService: Artist search returned ${results?.length || 0} results for "${artistName}"`,
      );

      if (results && results.length > 0) {
        console.log(`🔍 TransferService: Sample artist results:`, {
          artist: artistName,
          trackCount: results.length,
          sampleTracks: results.slice(0, 3).map((t) => ({
            name: t.name,
            artist: t.artists?.[0]?.name,
            id: t.id,
          })),
        });
      }

      return results || [];
    } catch (error) {
      console.error(
        `🔍 TransferService: ❌ Artist search failed for "${artistName}" on ${platformId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * NEW: Find best match for a track within pre-fetched search results
   */
  findBestMatchInResults(sourceTrack, searchResults) {
    if (!searchResults || searchResults.length === 0) return null;

    console.log(
      `🔍 TransferService: Finding best match for "${sourceTrack.name}" in ${searchResults.length} pre-fetched results`,
    );

    let bestMatch = null;
    let bestScore = 0;

    for (const result of searchResults) {
      const score = this.calculateMatchScore(sourceTrack, result);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
      }

      // Early exit if we find a perfect match
      if (score === 1.0) {
        console.log(
          `🔍 TransferService: ✅ Perfect match found: "${sourceTrack.name}" -> "${result.name}"`,
        );
        return result;
      }
    }

    // Only return match if score is above threshold
    if (bestScore >= 0.6) {
      console.log(
        `🔍 TransferService: ✅ Best match found: "${sourceTrack.name}" -> "${result.name}" (score: ${bestScore.toFixed(2)})`,
      );
      return bestMatch;
    }

    console.log(
      `🔍 TransferService: ❌ No good match found for "${sourceTrack.name}" (best score: ${bestScore.toFixed(2)})`,
    );
    return null;
  }

  /**
   * NEW: Calculate match score between source and result track
   */
  calculateMatchScore(sourceTrack, resultTrack) {
    if (!sourceTrack || !resultTrack) return 0;

    const sourceName = this.normalizeTrackName(sourceTrack.name);
    const resultName = this.normalizeTrackName(resultTrack.name);
    const sourceArtist = this.normalizeArtistName(
      sourceTrack.artists?.[0]?.name || "",
    );
    const resultArtist = this.normalizeArtistName(
      resultTrack.artists?.[0]?.name || "",
    );

    // Name similarity (60% weight)
    const nameSimilarity = this.calculateSimilarity(sourceName, resultName);

    // Artist similarity (40% weight)
    const artistSimilarity =
      sourceArtist && resultArtist
        ? this.calculateSimilarity(sourceArtist, resultArtist)
        : 0.5; // Neutral if no artist info

    // Weighted score
    const score = nameSimilarity * 0.6 + artistSimilarity * 0.4;

    return score;
  }

  /**
   * Fast search - return first result (current behavior)
   */
  async fastSearch(sourceTrack, targetPlatformId, accessToken, options = {}) {
    console.log(
      `🔍 TransferService: Fast search for "${sourceTrack.name}" on ${targetPlatformId}`,
    );

    const searchQuery = this.buildSearchQuery(sourceTrack);
    const searchResults = await this.searchTracks(
      targetPlatformId,
      accessToken,
      searchQuery,
      1,
      options,
    );

    console.log(
      `🔍 TransferService: Fast search returned ${searchResults?.length || 0} results`,
    );

    if (searchResults && searchResults.length > 0) {
      const firstResult = searchResults[0];
      console.log(
        `🔍 TransferService: Fast search first result: "${firstResult.name}" by ${firstResult.artists?.[0]?.name || "Unknown"} (ID: ${firstResult.id})`,
      );
      return firstResult;
    } else {
      console.log(
        `🔍 TransferService: Fast search returned no results for "${searchQuery}"`,
      );
      return null;
    }
  }

  /**
   * Strict search - exact match required
   */
  async strictSearch(sourceTrack, targetPlatformId, accessToken, options = {}) {
    // First try album-based search for better accuracy
    const albumMatch = await this.searchByAlbum(
      sourceTrack,
      targetPlatformId,
      accessToken,
      options,
    );
    if (albumMatch) return albumMatch;

    // Fallback to song search with exact matching
    const searchQuery = this.buildSearchQuery(sourceTrack);
    const searchResults = await this.searchTracks(
      targetPlatformId,
      accessToken,
      searchQuery,
      this.config.search.maxTrackResults,
      options,
    );

    // Find exact match
    for (const result of searchResults) {
      if (this.isExactMatch(sourceTrack, result)) {
        return result;
      }
    }

    return null;
  }

  /**
   * Smart search - fuzzy matching with multiple fallbacks
   */
  async smartSearch(sourceTrack, targetPlatformId, accessToken, options = {}) {
    // Strategy 1: Album-based search (most accurate)
    const albumMatch = await this.searchByAlbum(
      sourceTrack,
      targetPlatformId,
      accessToken,
      options,
    );
    if (albumMatch) return albumMatch;

    // Strategy 2: Exact song search
    const exactMatch = await this.strictSearch(
      sourceTrack,
      targetPlatformId,
      accessToken,
      options,
    );
    if (exactMatch) return exactMatch;

    // Strategy 3: Fuzzy matching
    const fuzzyMatch = await this.fuzzySearch(
      sourceTrack,
      targetPlatformId,
      accessToken,
      options,
    );
    if (fuzzyMatch) return fuzzyMatch;

    // Strategy 4: Platform-specific fallbacks
    const platform = platformRegistry.getPlatform(targetPlatformId);
    if (platform && platform.platformSpecificSearch) {
      const platformMatch = await platform.platformSpecificSearch(
        sourceTrack,
        accessToken,
        options,
      );
      if (platformMatch) return platformMatch;
    }

    return null;
  }

  /**
   * Search for track by finding the album first (most accurate method)
   */
  async searchByAlbum(
    sourceTrack,
    targetPlatformId,
    accessToken,
    options = {},
  ) {
    if (!sourceTrack.artists || sourceTrack.artists.length === 0) {
      return null;
    }

    const artistName = sourceTrack.artists[0].name;
    const trackName = sourceTrack.name;
    const platform = platformRegistry.getPlatform(targetPlatformId);

    if (!platform) {
      console.error(`Platform not found: ${targetPlatformId}`);
      return null;
    }

    try {
      // Check if platform supports album-based search
      if (platform.searchAlbumsByArtist && platform.getAlbumTracks) {
        const albums = await platform.searchAlbumsByArtist(
          accessToken,
          artistName,
          { limit: this.config.search.maxAlbumResults, ...options },
        );

        // Look for exact track match in albums
        for (const album of albums) {
          const albumTracks = await platform.getAlbumTracks(
            accessToken,
            album.id,
            options,
          );
          const trackMatch = albumTracks.find(
            (track) =>
              this.normalizeTrackName(track.name) ===
              this.normalizeTrackName(trackName),
          );
          if (trackMatch) return trackMatch;
        }
      } else {
        // Fallback to general search for platforms without album support
        const searchQuery =
          `${artistName} ${sourceTrack.album?.name || ""}`.trim();
        const searchResults = await this.searchTracks(
          targetPlatformId,
          accessToken,
          searchQuery,
          5,
          options,
        );

        // Look for tracks that match both artist and track name
        for (const result of searchResults) {
          if (this.isArtistTrackMatch(sourceTrack, result)) {
            return result;
          }
        }
      }
    } catch (error) {
      console.error("Album-based search failed:", error.message);
    }

    return null;
  }

  /**
   * Fuzzy search with bracket removal and variations
   */
  async fuzzySearch(sourceTrack, targetPlatformId, accessToken, options = {}) {
    console.log(
      `🔍 TransferService: Fuzzy search for "${sourceTrack.name}" on ${targetPlatformId}`,
    );

    const variations = this.generateSearchVariations(sourceTrack);

    for (const variation of variations) {
      try {
        console.log(`🔍 TransferService: Trying variation: "${variation}"`);
        const searchResults = await this.searchTracks(
          targetPlatformId,
          accessToken,
          variation,
          this.config.search.maxFuzzyVariations,
          options,
        );

        for (const result of searchResults) {
          if (this.isFuzzyMatch(sourceTrack, result)) {
            console.log(
              `🔍 TransferService: ✅ Fuzzy match found with variation "${variation}": "${result.name}"`,
            );
            return result;
          }
        }
      } catch (error) {
        console.log(
          `🔍 TransferService: Variation "${variation}" failed, trying next...`,
        );
        continue; // Try next variation
      }
    }

    console.log(
      `🔍 TransferService: ❌ No fuzzy match found for "${sourceTrack.name}"`,
    );
    return null;
  }

  /**
   * Generate search query variations for better matching
   */
  generateSearchVariations(sourceTrack) {
    const variations = [];
    const baseName = sourceTrack.name;
    const artistName = sourceTrack.artists?.[0]?.name || "";

    console.log(
      `🔍 TransferService: Generating variations for "${baseName}" by "${artistName}"`,
    );

    // Remove common brackets and parentheses
    const cleanName = baseName.replace(/[\(\[\{].*?[\)\]\}]/g, "").trim();
    if (cleanName !== baseName) {
      const variation = `${cleanName} ${artistName}`.trim();
      variations.push(variation);
      console.log(
        `🔍 TransferService: Variation 1 (clean name): "${variation}"`,
      );
    }

    // Add artist first variations
    if (artistName) {
      const artistFirst1 = `${artistName} ${baseName}`;
      const artistFirst2 = `${artistName} - ${baseName}`;
      variations.push(artistFirst1, artistFirst2);
      console.log(
        `🔍 TransferService: Variation 2 (artist first): "${artistFirst1}"`,
      );
      console.log(
        `🔍 TransferService: Variation 3 (artist first with dash): "${artistFirst2}"`,
      );
    }

    // Original query
    const originalQuery = `${baseName} ${artistName}`.trim();
    variations.push(originalQuery);
    console.log(
      `🔍 TransferService: Variation 4 (original): "${originalQuery}"`,
    );

    // For Hindi songs, try without artist if the name is long enough
    if (
      baseName.length > 10 &&
      !baseName.includes("|") &&
      !baseName.includes("-")
    ) {
      variations.push(baseName);
      console.log(`🔍 TransferService: Variation 5 (name only): "${baseName}"`);
    }

    // Try with common Hindi song suffixes
    if (
      baseName.includes("Charche") ||
      baseName.includes("Gaane") ||
      baseName.includes("Song")
    ) {
      const withoutSuffix = baseName
        .replace(/\s+(Charche|Gaane|Song|Lyrics).*$/i, "")
        .trim();
      if (withoutSuffix !== baseName) {
        const variation = `${withoutSuffix} ${artistName}`.trim();
        variations.push(variation);
        console.log(
          `🔍 TransferService: Variation 6 (without suffix): "${variation}"`,
        );
      }
    }

    console.log(
      `🔍 TransferService: Generated ${variations.length} search variations`,
    );
    return variations;
  }

  /**
   * Build basic search query
   */
  buildSearchQuery(sourceTrack) {
    let query = sourceTrack.name;

    if (sourceTrack.artists && sourceTrack.artists.length > 0) {
      const artistNames = sourceTrack.artists
        .map((artist) => artist.name)
        .join(" ");
      query = `${query} ${artistNames}`;
    }

    if (sourceTrack.album && sourceTrack.album.name) {
      query = `${query} ${sourceTrack.album.name}`;
    }

    const finalQuery = query.trim();
    console.log(
      `🔍 TransferService: Built search query: "${finalQuery}" from track: "${sourceTrack.name}" by ${sourceTrack.artists?.[0]?.name || "Unknown"}`,
    );

    return finalQuery;
  }

  /**
   * Check if two tracks are an exact match
   */
  isExactMatch(sourceTrack, targetTrack) {
    if (!sourceTrack || !targetTrack) return false;

    const sourceName = this.normalizeTrackName(sourceTrack.name);
    const targetName = this.normalizeTrackName(targetTrack.name);

    // Exact name match
    if (sourceName === targetName) {
      // If we have artist info for both, check artist match
      if (sourceTrack.artists?.[0]?.name && targetTrack.artists?.[0]?.name) {
        const sourceArtist = this.normalizeArtistName(
          sourceTrack.artists[0].name,
        );
        const targetArtist = this.normalizeArtistName(
          targetTrack.artists[0].name,
        );
        return sourceArtist === targetArtist;
      }
      // If no artist info, just match on name
      return true;
    }

    return false;
  }

  /**
   * Check if artist and track names match
   */
  isArtistTrackMatch(sourceTrack, targetTrack) {
    if (!sourceTrack || !targetTrack) return false;

    const sourceName = this.normalizeTrackName(sourceTrack.name);
    const targetName = this.normalizeTrackName(targetTrack.name);

    // Check if track names are similar
    if (this.calculateSimilarity(sourceName, targetName) < 0.7) {
      return false;
    }

    // Check if artists match
    if (sourceTrack.artists?.[0]?.name && targetTrack.artists?.[0]?.name) {
      const sourceArtist = this.normalizeArtistName(
        sourceTrack.artists[0].name,
      );
      const targetArtist = this.normalizeArtistName(
        targetTrack.artists[0].name,
      );

      // Artist names should be very similar
      return this.calculateSimilarity(sourceArtist, targetArtist) > 0.8;
    }

    // If no artist info, just check track name similarity
    return this.calculateSimilarity(sourceName, targetName) > 0.8;
  }

  /**
   * Check if tracks are a fuzzy match
   */
  isFuzzyMatch(sourceTrack, targetTrack) {
    if (!sourceTrack || !targetTrack) return false;

    const sourceName = this.normalizeTrackName(sourceTrack.name);
    const targetName = this.normalizeTrackName(targetTrack.name);

    // Track names should be reasonably similar
    const nameSimilarity = this.calculateSimilarity(sourceName, targetName);
    console.log(
      `🔍 TransferService: Name similarity: "${sourceName}" vs "${targetName}" = ${nameSimilarity.toFixed(2)}`,
    );

    if (nameSimilarity < 0.5) {
      console.log(
        `🔍 TransferService: Name similarity too low (${nameSimilarity.toFixed(2)})`,
      );
      return false;
    }

    // If we have artist info, check artist similarity too
    if (sourceTrack.artists?.[0]?.name && targetTrack.artists?.[0]?.name) {
      const sourceArtist = this.normalizeArtistName(
        sourceTrack.artists[0].name,
      );
      const targetArtist = this.normalizeArtistName(
        targetTrack.artists[0].name,
      );
      const artistSimilarity = this.calculateSimilarity(
        sourceArtist,
        targetArtist,
      );

      console.log(
        `🔍 TransferService: Artist similarity: "${sourceArtist}" vs "${targetArtist}" = ${artistSimilarity.toFixed(2)}`,
      );

      // Both name and artist should be reasonably similar
      if (nameSimilarity > 0.5 && artistSimilarity > 0.4) {
        console.log(
          `🔍 TransferService: ✅ Fuzzy match passed - Name: ${nameSimilarity.toFixed(2)}, Artist: ${artistSimilarity.toFixed(2)}`,
        );
        return true;
      } else {
        console.log(
          `🔍 TransferService: ❌ Fuzzy match failed - Name: ${nameSimilarity.toFixed(2)}, Artist: ${artistSimilarity.toFixed(2)}`,
        );
        return false;
      }
    }

    // If no artist info, just check track name with higher threshold
    if (nameSimilarity > 0.6) {
      console.log(
        `🔍 TransferService: ✅ Fuzzy match passed (no artist) - Name: ${nameSimilarity.toFixed(2)}`,
      );
      return true;
    } else {
      console.log(
        `🔍 TransferService: ❌ Fuzzy match failed (no artist) - Name: ${nameSimilarity.toFixed(2)}`,
      );
      return false;
    }
  }

  /**
   * Normalize track names for comparison
   */
  normalizeTrackName(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Normalize artist names for comparison
   */
  normalizeArtistName(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Calculate string similarity using Levenshtein distance
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
   * Search tracks on the target platform
   */
  async searchTracks(platformId, accessToken, query, limit, options = {}) {
    console.log(
      `🔍 TransferService: Searching tracks on ${platformId} with query: "${query}" (limit: ${limit})`,
    );

    const platform = platformRegistry.getPlatform(platformId);
    if (!platform) {
      console.error(`🔍 TransferService: ❌ Platform not found: ${platformId}`);
      throw new Error(`Unsupported platform: ${platformId}`);
    }

    try {
      const results = await platform.searchTracks(accessToken, query, {
        limit,
        ...options,
      });
      console.log(
        `🔍 TransferService: Search returned ${results?.length || 0} results for "${query}"`,
      );

      if (results && results.length > 0) {
        console.log(`🔍 TransferService: Sample result:`, {
          name: results[0].name,
          artist: results[0].artists?.[0]?.name,
          id: results[0].id,
        });
      }

      return results;
    } catch (error) {
      console.error(
        `🔍 TransferService: ❌ Search failed for "${query}" on ${platformId}:`,
        error.message,
      );

      // If it's a circuit breaker error, try to reset it
      if (
        error.message?.includes("Circuit breaker") ||
        error.message?.includes("temporarily unavailable")
      ) {
        console.log(
          `🔍 TransferService: Attempting to reset circuit breaker for ${platformId}`,
        );
        try {
          // Import apiService dynamically to avoid circular dependency
          const { default: apiService } =
            await import("../services/apiService.js");
          apiService.resetCircuitBreaker(platformId);
          console.log(
            `🔍 TransferService: Circuit breaker reset for ${platformId}`,
          );
        } catch (resetError) {
          console.log(
            `🔍 TransferService: Failed to reset circuit breaker:`,
            resetError.message,
          );
        }
      }

      throw error;
    }
  }

  /**
   * NEW: Quota-aware search that adapts strategy based on remaining quota
   */
  async searchTracksWithQuotaAwareness(
    platformId,
    accessToken,
    query,
    limit,
    quotaStatus = null,
    options = {},
  ) {
    console.log(
      `🔍 TransferService: Quota-aware search for "${query}" on ${platformId}`,
    );

    // If we have quota info, adapt our strategy
    if (quotaStatus) {
      console.log(`🔍 TransferService: Quota status:`, {
        remainingQuota: quotaStatus.remaining,
        quotaUsed: quotaStatus.used,
        quotaLimit: quotaStatus.limit,
      });

      // If quota is critically low, reduce search limit
      if (quotaStatus.remaining < 100) {
        const originalLimit = limit;
        limit = Math.min(limit, 10); // Reduce to max 10 results
        console.log(
          `🔍 TransferService: ⚠️ Low quota detected, reducing search limit from ${originalLimit} to ${limit}`,
        );
      }

      // If quota is very low, skip non-essential searches
      if (quotaStatus.remaining < 50) {
        console.log(
          `🔍 TransferService: 🚨 Very low quota (${quotaStatus.remaining}), skipping search for "${query}"`,
        );
        throw new Error(
          `Insufficient quota for search: ${quotaStatus.remaining} remaining`,
        );
      }
    }

    try {
      const results = await this.searchTracks(
        platformId,
        accessToken,
        query,
        limit,
        options,
      );
      return results;
    } catch (error) {
      // If it's a quota error, log it specifically
      if (error.message?.includes("quota") || error.message?.includes("403")) {
        console.log(
          `🔍 TransferService: 🚨 Quota exceeded during search for "${query}"`,
        );
      }
      throw error;
    }
  }

  /**
   * NEW: Enhanced batch processing with quota awareness
   */
  async batchFindTrackMatchesWithQuotaAwareness(
    sourceTracks,
    targetPlatformId,
    accessToken,
    algorithm = null,
    options = {},
  ) {
    console.log(
      `🔍 TransferService: Starting quota-aware batch processing for ${sourceTracks.length} tracks on ${targetPlatformId}`,
    );

    // Group tracks by artist for efficient searching
    const artistGroups = this.groupTracksByArtist(sourceTracks);
    console.log(
      `🔍 TransferService: Grouped into ${Object.keys(artistGroups).length} artist groups:`,
      Object.keys(artistGroups).map(
        (artist) => `${artist} (${artistGroups[artist].length} tracks)`,
      ),
    );

    const results = new Map(); // trackId -> result
    const searchCache = new Map(); // artist -> search results

    // Process each artist group with quota awareness
    for (const [artistName, tracks] of Object.entries(artistGroups)) {
      try {
        console.log(
          `🔍 TransferService: Processing artist group: "${artistName}" with ${tracks.length} tracks`,
        );

        // Single API call per artist with quota awareness
        const artistSearchResults = await this.searchTracksWithQuotaAwareness(
          targetPlatformId,
          accessToken,
          artistName,
          50, // Get more results to match multiple tracks
          null, // No quota status for now
          options,
        );

        searchCache.set(artistName, artistSearchResults);

        // Match all tracks from this artist against the search results
        for (const track of tracks) {
          const match = this.findBestMatchInResults(track, artistSearchResults);
          if (match) {
            results.set(track.id, match);
            console.log(
              `🔍 TransferService: ✅ Batch match found: "${track.name}" -> "${match.name}"`,
            );
          } else {
            console.log(
              `🔍 TransferService: ❌ No batch match for "${track.name}" in artist results`,
            );
          }
        }

        // Rate limiting between artist groups (reduced delay for efficiency)
        if (Object.keys(artistGroups).length > 1) {
          await this.sleep(200); // Reduced from 500ms to 200ms
        }
      } catch (error) {
        console.error(
          `🔍 TransferService: ❌ Failed to process artist group "${artistName}":`,
          error.message,
        );

        // If it's a quota error, stop processing to save remaining quota
        if (
          error.message?.includes("quota") ||
          error.message?.includes("Insufficient quota")
        ) {
          console.log(
            `🔍 TransferService: 🚨 Quota exhausted, stopping batch processing`,
          );
          break;
        }

        // Mark all tracks in this group as failed
        for (const track of tracks) {
          results.set(track.id, null);
        }
      }
    }

    // Convert results back to array format
    const finalResults = sourceTracks.map(
      (track) => results.get(track.id) || null,
    );

    const successCount = finalResults.filter((r) => r !== null).length;
    console.log(
      `🔍 TransferService: Quota-aware batch processing complete: ${successCount}/${sourceTracks.length} tracks matched`,
    );

    return finalResults;
  }

  /**
   * NEW: Estimate quota usage for a batch transfer
   */
  estimateQuotaUsage(sourceTracks, targetPlatformId) {
    console.log(
      `🔍 TransferService: Estimating quota usage for ${sourceTracks.length} tracks on ${targetPlatformId}`,
    );

    // Group tracks by artist
    const artistGroups = this.groupTracksByArtist(sourceTracks);
    const uniqueArtists = Object.keys(artistGroups);

    // Estimate API calls needed
    const estimatedApiCalls = uniqueArtists.length; // One search per artist
    const estimatedQuotaPerSearch = 100; // YouTube search costs ~100 quota units
    const totalEstimatedQuota = estimatedApiCalls * estimatedQuotaPerSearch;

    console.log(`🔍 TransferService: Quota estimation:`, {
      totalTracks: sourceTracks.length,
      uniqueArtists: uniqueArtists.length,
      estimatedApiCalls,
      estimatedQuotaPerSearch,
      totalEstimatedQuota,
      efficiency: `1 API call per ${(sourceTracks.length / uniqueArtists.length).toFixed(1)} tracks`,
    });

    return {
      totalTracks: sourceTracks.length,
      uniqueArtists: uniqueArtists.length,
      estimatedApiCalls,
      estimatedQuotaPerSearch,
      totalEstimatedQuota,
      efficiency: sourceTracks.length / uniqueArtists.length,
    };
  }

  /**
   * NEW: Check if transfer is feasible with current quota
   */
  isTransferFeasible(sourceTracks, targetPlatformId, availableQuota = null) {
    const estimation = this.estimateQuotaUsage(sourceTracks, targetPlatformId);

    if (availableQuota === null) {
      console.log(
        `🔍 TransferService: No quota info available, assuming transfer is feasible`,
      );
      return { feasible: true, estimation };
    }

    const feasible = estimation.totalEstimatedQuota <= availableQuota;

    console.log(`🔍 TransferService: Transfer feasibility check:`, {
      required: estimation.totalEstimatedQuota,
      available: availableQuota,
      feasible,
      margin: availableQuota - estimation.totalEstimatedQuota,
    });

    return { feasible, estimation };
  }

  /**
   * Get platform instance by ID
   */
  getPlatform(platformId) {
    return platformRegistry.getPlatform(platformId);
  }

  /**
   * Get all available platforms
   */
  getAvailablePlatforms() {
    return platformRegistry.getAllPlatforms();
  }

  /**
   * Check if platform supports specific capability
   */
  platformSupports(platformId, capability) {
    const platform = platformRegistry.getPlatform(platformId);
    return platform ? platform.capabilities[capability] === true : false;
  }

  /**
   * Sleep between track processing to avoid rate limiting
   */
  async sleep(ms = null) {
    const sleepTime = ms || this.trackSleepMs;
    console.log(
      `🔍 TransferService: Sleeping for ${sleepTime}ms to avoid rate limiting`,
    );
    return new Promise((resolve) => setTimeout(resolve, sleepTime));
  }

  /**
   * Enhanced sleep with exponential backoff for rate limiting
   */
  async sleepWithBackoff(attempt, baseDelay = 1000) {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), 10000); // Max 10 seconds
    console.log(
      `🔍 TransferService: Rate limit backoff: sleeping for ${delay}ms (attempt ${attempt})`,
    );
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

module.exports = new TransferService();
