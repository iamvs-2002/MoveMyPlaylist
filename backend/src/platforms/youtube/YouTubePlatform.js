const BasePlatform = require("../base/BasePlatform");

/**
 * YouTube Platform Implementation
 * Implements the Platform interface for YouTube Music
 */
class YouTubePlatform extends BasePlatform {
  constructor(config) {
    super(config);

    // Extract configuration
    this.clientId = config.oauth.clientId;
    this.clientSecret = config.oauth.clientSecret;
    this.redirectUri = config.oauth.redirectUri;
    this.baseUrl = config.api.baseUrl;
    this.authUrl = config.api.authUrl;
    this.tokenUrl = config.api.tokenUrl;
    this.userInfoUrl = config.api.userInfoUrl;
    this.scopes = config.oauth.scopes;
    this.responseType = config.oauth.responseType;
    this.accessType = config.oauth.accessType;
    this.prompt = config.oauth.prompt;
    this.includeGrantedScopes = config.oauth.includeGrantedScopes;
    this.apiKey = config.apiKey;
    this.errors = config.errors;
  }

  /**
   * Validate platform configuration
   * @returns {boolean} Whether configuration is valid
   */
  validateConfig() {
    if (!super.validateConfig()) {
      return false;
    }

    // Check required OAuth fields
    const requiredOAuthFields = ["clientId", "clientSecret", "redirectUri"];
    for (const field of requiredOAuthFields) {
      if (!this.config.oauth[field]) {
        console.error(
          `Missing required OAuth field '${field}' in YouTube config`,
        );
        return false;
      }
    }

    // Check API key
    if (!this.apiKey) {
      console.error("Missing required API key in YouTube config");
      return false;
    }

    return true;
  }

  /**
   * Generate YouTube OAuth authorization URL
   * @param {string} state - Random state parameter for security
   * @param {Object} [options] - Additional options
   * @returns {string} Authorization URL
   */
  getAuthUrl(state, options = {}) {
    const clientId =
      options.clientId || options.credentials?.clientId || this.clientId;
    const redirectUri =
      options.redirectUri ||
      options.credentials?.redirectUri ||
      this.redirectUri;

    const params = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: this.responseType,
      scope: this.scopes.join(" "),
      state: state,
      access_type: this.accessType,
      prompt: this.prompt,
      include_granted_scopes: this.includeGrantedScopes,
    };

    const queryString = new URLSearchParams(params).toString();
    return `${this.authUrl}?${queryString}`;
  }

  /**
   * Exchange authorization code for access tokens
   * @param {string} code - Authorization code from callback
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForTokens(code, options = {}) {
    try {
      const clientId =
        options.clientId || options.credentials?.clientId || this.clientId;
      const clientSecret =
        options.clientSecret ||
        options.credentials?.clientSecret ||
        this.clientSecret;
      const redirectUri =
        options.redirectUri ||
        options.credentials?.redirectUri ||
        this.redirectUri;

      const response = await this.apiService.post(
        this.tokenUrl,
        {
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
        "youtube",
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error) {
      throw this.handleYouTubeError(error, "token_exchange");
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token response
   */
  async refreshTokens(refreshToken, options = {}) {
    try {
      const clientId =
        options.clientId || options.credentials?.clientId || this.clientId;
      const clientSecret =
        options.clientSecret ||
        options.credentials?.clientSecret ||
        this.clientSecret;

      const response = await this.apiService.post(
        this.tokenUrl,
        {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
        "youtube",
      );

      return {
        access_token: response.data.access_token,
        refresh_token: refreshToken, // Keep the original refresh token
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error) {
      throw this.handleYouTubeError(error, "token_refresh");
    }
  }

  /**
   * Get user profile information
   * @param {string} accessToken - Valid access token
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(accessToken) {
    try {
      const response = await this.apiService.get(
        this.userInfoUrl,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        "youtube",
      );

      return this.normalizeUserProfile(response.data);
    } catch (error) {
      throw this.handleYouTubeError(error, "profile_fetch");
    }
  }

  /**
   * Get user's playlists (YouTube Music)
   * @param {string} accessToken - Valid access token
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} User's playlists
   */
  async getUserPlaylists(accessToken, options = {}) {
    try {
      const { limit = 50, pageToken = null } = options;
      const apiKey = options.credentials?.apiKey || this.apiKey;

      const params = {
        part: "snippet,contentDetails",
        mine: true,
        maxResults: limit,
        key: apiKey,
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await this.apiService.get(
        `${this.baseUrl}/playlists`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params,
        },
        "youtube",
      );

      return response.data.items.map((playlist) =>
        this.normalizePlaylist(playlist),
      );
    } catch (error) {
      throw this.handleYouTubeError(error, "playlists_fetch");
    }
  }

  /**
   * Get specific playlist with tracks
   * @param {string} accessToken - Valid access token
   * @param {string} playlistId - Playlist identifier
   * @returns {Promise<Object>} Playlist data
   */
  async getPlaylist(accessToken, playlistId, options = {}) {
    try {
      const apiKey = options.credentials?.apiKey || this.apiKey;
      // Get playlist details
      const playlistResponse = await this.apiService.get(
        `${this.baseUrl}/playlists`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            part: "snippet,contentDetails",
            id: playlistId,
            key: apiKey,
          },
        },
        "youtube",
      );

      if (
        !playlistResponse.data.items ||
        playlistResponse.data.items.length === 0
      ) {
        throw new Error("Playlist not found");
      }

      const playlist = playlistResponse.data.items[0];

      // Get playlist items (tracks)
      const tracksResponse = await this.getPlaylistTracks(
        accessToken,
        playlistId,
        options,
      );

      return this.normalizePlaylist({
        ...playlist,
        tracks: tracksResponse.items,
      });
    } catch (error) {
      throw this.handleYouTubeError(error, "playlist_fetch");
    }
  }

  /**
   * Get tracks from a specific playlist
   * @param {string} accessToken - Valid access token
   * @param {string} playlistId - Playlist identifier
   * @param {Object} [options] - Query options
   * @returns {Promise<Object>} Playlist tracks
   */
  async getPlaylistTracks(accessToken, playlistId, options = {}) {
    try {
      const { limit = 50, pageToken = null } = options;
      const apiKey = options.credentials?.apiKey || this.apiKey;

      const params = {
        part: "snippet,contentDetails",
        playlistId: playlistId,
        maxResults: limit,
        key: apiKey,
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await this.apiService.get(
        `${this.baseUrl}/playlistItems`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params,
        },
        "youtube",
      );

      return {
        items: response.data.items.map((item) => this.normalizeTrack(item)),
        nextPageToken: response.data.nextPageToken,
        total: response.data.pageInfo?.totalResults || 0,
      };
    } catch (error) {
      throw this.handleYouTubeError(error, "playlist_tracks_fetch");
    }
  }

  /**
   * Search for tracks/videos
   * @param {string} accessToken - Valid access token
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchTracks(accessToken, query, options = {}) {
    try {
      const { limit = 20 } = options;
      const apiKey = options.credentials?.apiKey || this.apiKey;

      console.log(`🎵 YouTube: Searching for "${query}" with limit ${limit}`);

      const response = await this.apiService.get(
        `${this.baseUrl}/search`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            part: "snippet",
            q: query,
            type: "video",
            maxResults: limit,
            key: apiKey,
          },
        },
        "youtube",
      );

      console.log(`🎵 YouTube: API response received:`, {
        hasData: !!response.data,
        hasItems: !!response.data?.items,
        itemCount: response.data?.items?.length || 0,
        sampleItem: response.data?.items?.[0]
          ? {
              id: response.data.items[0].id,
              snippet: response.data.items[0].snippet
                ? {
                    title: response.data.items[0].snippet.title,
                    channelTitle: response.data.items[0].snippet.channelTitle,
                  }
                : "No snippet",
            }
          : "No items",
      });

      const normalizedTracks = response.data.items
        .map((item) => {
          const normalized = this.normalizeTrack(item);
          console.log(`🎵 YouTube: Normalized track:`, {
            original: { id: item.id, title: item.snippet?.title },
            normalized: normalized
              ? {
                  id: normalized.id,
                  name: normalized.name,
                  artist: normalized.artists?.[0]?.name,
                }
              : "Failed to normalize",
          });
          return normalized;
        })
        .filter(Boolean);

      console.log(
        `🎵 YouTube: Returning ${normalizedTracks.length} normalized tracks`,
      );
      return normalizedTracks;
    } catch (error) {
      console.error(`🎵 YouTube: ❌ Search failed:`, error.message);
      throw this.handleYouTubeError(error, "track_search");
    }
  }

  /**
   * Create a new playlist
   * @param {string} accessToken - Valid access token
   * @param {Object} playlistData - Playlist creation data
   * @returns {Promise<Object>} Created playlist
   */
  async createPlaylist(accessToken, playlistData, options = {}) {
    try {
      const { name, description = "", isPublic = false } = playlistData;
      const apiKey = options.credentials?.apiKey || this.apiKey;

      const response = await this.apiService.post(
        `${this.baseUrl}/playlists`,
        {
          snippet: {
            title: name,
            description: description,
          },
          status: {
            privacyStatus: isPublic ? "public" : "private",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            part: "snippet,status",
            key: apiKey,
          },
        },
        "youtube",
      );

      return this.normalizePlaylist(response.data);
    } catch (error) {
      throw this.handleYouTubeError(error, "playlist_creation");
    }
  }

  /**
   * Add tracks to playlist
   * @param {string} accessToken - Valid access token
   * @param {string} playlistId - Playlist identifier
   * @param {Array} tracks - Tracks to add
   * @returns {Promise<Object>} Operation result
   */
  async addTracksToPlaylist(accessToken, playlistId, tracks, options = {}) {
    try {
      const apiKey = options.credentials?.apiKey || this.apiKey;
      console.log(
        `🎵 YouTube: Adding ${tracks.length} tracks to playlist ${playlistId}`,
      );
      console.log(
        `🎵 YouTube: Sample track:`,
        tracks[0]
          ? {
              id: tracks[0].id,
              name: tracks[0].name,
              artist: tracks[0].artists?.[0]?.name,
            }
          : "No tracks",
      );

      // Extract video IDs properly - handle both string and object formats
      const videoIds = tracks
        .map((track) => {
          let videoId = track.id;

          // If id is an object with videoId property (from search results)
          if (videoId && typeof videoId === "object" && videoId.videoId) {
            videoId = videoId.videoId;
          }

          // If id is an object with kind and videoId (from search results)
          if (
            videoId &&
            typeof videoId === "object" &&
            videoId.kind === "youtube#video"
          ) {
            videoId = videoId.videoId;
          }

          console.log(
            `🎵 YouTube: Extracted video ID: "${videoId}" from track ID:`,
            track.id,
          );
          return videoId;
        })
        .filter(Boolean); // Remove any undefined/null IDs

      console.log(
        `🎵 YouTube: Video IDs to add:`,
        videoIds.slice(0, 5),
        videoIds.length > 5 ? `... and ${videoIds.length - 5} more` : "",
      );

      if (videoIds.length === 0) {
        throw new Error("No valid video IDs found in tracks");
      }

      const promises = videoIds.map((videoId) => {
        console.log(`🎵 YouTube: Adding video ${videoId} to playlist`);
        return this.apiService.post(
          `${this.baseUrl}/playlistItems`,
          {
            snippet: {
              playlistId: playlistId,
              resourceId: {
                kind: "youtube#video",
                videoId: videoId,
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            params: {
              part: "snippet",
              key: apiKey,
            },
          },
          "youtube",
        );
      });

      console.log(
        `🎵 YouTube: Executing ${promises.length} API calls to add tracks...`,
      );
      const results = await Promise.all(promises);

      console.log(`🎵 YouTube: All tracks added successfully. Results:`, {
        successCount: results.filter((r) => r.status >= 200 && r.status < 300)
          .length,
        totalCount: results.length,
        sampleResult: results[0]
          ? {
              status: results[0].status,
              hasData: !!results[0].data,
            }
          : "No results",
      });

      return {
        success: true,
        message: `Added ${videoIds.length} tracks to playlist`,
        data: {
          addedCount: videoIds.length,
          playlistId: playlistId,
          results: results,
        },
      };
    } catch (error) {
      console.error(
        `🎵 YouTube: ❌ Failed to add tracks to playlist:`,
        error.message,
      );
      console.error(`🎵 YouTube: Error details:`, {
        message: error.message,
        stack: error.stack,
        playlistId,
        trackCount: tracks.length,
      });
      throw this.handleYouTubeError(error, "add_tracks_to_playlist");
    }
  }

  /**
   * Normalize track data to common format
   * @param {Object} rawTrack - Raw track data from YouTube
   * @returns {Object} Normalized track data
   */
  normalizeTrack(rawTrack) {
    if (!rawTrack) return null;

    // Handle playlist item format
    if (rawTrack.snippet) {
      const artistName = this.extractArtistFromYouTubeData(rawTrack.snippet);

      return {
        id: rawTrack.contentDetails?.videoId || rawTrack.id,
        name: rawTrack.snippet.title,
        artists: [
          {
            id: rawTrack.snippet.videoOwnerChannelId,
            name: artistName,
          },
        ],
        album: {
          id: rawTrack.snippet.playlistId,
          name: rawTrack.snippet.playlistTitle,
          images: [
            {
              url:
                rawTrack.snippet.thumbnails?.high?.url ||
                rawTrack.snippet.thumbnails?.medium?.url ||
                rawTrack.snippet.thumbnails?.default?.url,
            },
          ],
        },
        externalIds: {
          youtube: rawTrack.contentDetails?.videoId || rawTrack.id,
        },
        platform: this.id,
        metadata: {
          publishedAt: rawTrack.snippet.publishedAt,
          thumbnails: rawTrack.snippet.thumbnails,
        },
      };
    }

    // Handle search result format
    if (rawTrack.id?.videoId) {
      const artistName = this.extractArtistFromYouTubeData(rawTrack.snippet);

      return {
        id: rawTrack.id.videoId,
        name: rawTrack.snippet.title,
        artists: [
          {
            id: rawTrack.snippet.channelId,
            name: artistName,
          },
        ],
        album: {
          id: rawTrack.snippet.channelId,
          name: rawTrack.snippet.channelTitle,
          images: [
            {
              url:
                rawTrack.snippet.thumbnails?.high?.url ||
                rawTrack.snippet.thumbnails?.medium?.url ||
                rawTrack.snippet.thumbnails?.default?.url,
            },
          ],
        },
        externalIds: {
          youtube: rawTrack.id.videoId,
        },
        platform: this.id,
        metadata: {
          publishedAt: rawTrack.snippet.publishedAt,
          thumbnails: rawTrack.snippet.thumbnails,
          description: rawTrack.snippet.description,
        },
      };
    }

    return null;
  }

  /**
   * Extract artist name from YouTube video data
   * @param {Object} snippet - YouTube video snippet
   * @returns {string} Artist name
   */
  extractArtistFromYouTubeData(snippet) {
    if (!snippet) return "Unknown Artist";

    console.log(`🎵 YouTube: Extracting artist from:`, {
      title: snippet.title,
      channelTitle: snippet.channelTitle,
    });

    // Try to extract artist from channel title first
    if (snippet.channelTitle) {
      // Remove common channel suffixes
      let artistName = snippet.channelTitle
        .replace(/\s*-\s*Official\s*Channel/i, "")
        .replace(/\s*Official\s*Channel/i, "")
        .replace(/\s*Music\s*Channel/i, "")
        .replace(/\s*Songs/i, "")
        .replace(/\s*Filmi\s*Gaane/i, "")
        .replace(/\s*Hindi\s*Songs/i, "")
        .replace(/\s*Classic\s*Songs/i, "")
        .replace(/\s*Evergreen\s*Songs/i, "")
        .trim();

      if (artistName && artistName !== "") {
        console.log(
          `🎵 YouTube: ✅ Extracted artist from channel: "${artistName}"`,
        );
        return artistName;
      }
    }

    // Try to extract artist from video title
    if (snippet.title) {
      // Look for common patterns in Hindi song titles
      const title = snippet.title;

      // Pattern: "Song Name | Artist Name | Movie"
      const artistMatch = title.match(/\|\s*([^|]+?)\s*\|/);
      if (artistMatch && artistMatch[1]) {
        const artist = artistMatch[1].trim();
        console.log(
          `🎵 YouTube: ✅ Extracted artist from title pattern 1: "${artist}"`,
        );
        return artist;
      }

      // Pattern: "Song Name - Artist Name"
      const dashMatch = title.match(/-\s*([^-]+?)(?:\s*\||\s*$)/);
      if (dashMatch && dashMatch[1]) {
        const artist = dashMatch[1].trim();
        console.log(
          `🎵 YouTube: ✅ Extracted artist from title pattern 2: "${artist}"`,
        );
        return artist;
      }

      // Pattern: "Song Name by Artist Name"
      const byMatch = title.match(/by\s+([^|]+?)(?:\s*\||\s*$)/i);
      if (byMatch && byMatch[1]) {
        const artist = byMatch[1].trim();
        console.log(
          `🎵 YouTube: ✅ Extracted artist from title pattern 3: "${artist}"`,
        );
        return artist;
      }

      // Pattern: "Song Name ft. Artist Name"
      const ftMatch = title.match(/ft\.?\s*([^|]+?)(?:\s*\||\s*$)/i);
      if (ftMatch && ftMatch[1]) {
        const artist = ftMatch[1].trim();
        console.log(
          `🎵 YouTube: ✅ Extracted artist from title pattern 4: "${artist}"`,
        );
        return artist;
      }
    }

    // Fallback to channel title or unknown
    const fallbackArtist = snippet.channelTitle || "Unknown Artist";
    console.log(`🎵 YouTube: ⚠️ Using fallback artist: "${fallbackArtist}"`);
    return fallbackArtist;
  }

  /**
   * Normalize playlist data to common format
   * @param {Object} rawPlaylist - Raw playlist data from YouTube
   * @returns {Object} Normalized playlist data
   */
  normalizePlaylist(rawPlaylist) {
    if (!rawPlaylist) return null;

    return {
      id: rawPlaylist.id,
      name: rawPlaylist.snippet?.title || rawPlaylist.name,
      description: rawPlaylist.snippet?.description || rawPlaylist.description,
      tracks: rawPlaylist.tracks || [],
      owner:
        rawPlaylist.snippet?.channelTitle || rawPlaylist.owner || "Unknown",
      platform: this.id,
      metadata: {
        images: [
          {
            url:
              rawPlaylist.snippet?.thumbnails?.high?.url ||
              rawPlaylist.snippet?.thumbnails?.medium?.url ||
              rawPlaylist.snippet?.thumbnails?.default?.url,
          },
        ],
        created_at: rawPlaylist.snippet?.publishedAt,
        tracks_count:
          rawPlaylist.contentDetails?.itemCount ||
          rawPlaylist.tracks?.length ||
          0,
        privacyStatus: rawPlaylist.status?.privacyStatus,
      },
    };
  }

  /**
   * Normalize user profile data to common format
   * @param {Object} rawProfile - Raw profile data from YouTube
   * @returns {Object} Normalized profile data
   */
  normalizeUserProfile(rawProfile) {
    if (!rawProfile) return null;

    return {
      id: rawProfile.id,
      displayName: rawProfile.name,
      email: rawProfile.email,
      images: rawProfile.picture ? [{ url: rawProfile.picture }] : [],
      platform: this.id,
      metadata: {
        locale: rawProfile.locale,
        picture: rawProfile.picture,
      },
    };
  }

  /**
   * Handle YouTube API errors with better error messages
   */
  handleYouTubeError(error, operation) {
    console.error(`🎵 YouTube: Error in ${operation}:`, {
      status: error.response?.status,
      message: error.message,
      response: error.response?.data,
    });

    // Handle specific error cases
    if (error.response?.status === 403) {
      if (error.response?.data?.error?.code === "quotaExceeded") {
        throw new Error(
          "YouTube API quota exceeded. Please try again later or check your API key limits.",
        );
      } else if (error.response?.data?.error?.code === "accessNotConfigured") {
        throw new Error(
          "YouTube API not configured. Please check your API key and enable YouTube Data API v3.",
        );
      } else {
        throw new Error(
          "YouTube API access denied. Please check your API key and permissions.",
        );
      }
    } else if (error.response?.status === 429) {
      throw new Error(
        "YouTube API rate limit exceeded. Please wait a moment and try again.",
      );
    } else if (error.response?.status === 400) {
      throw new Error(
        `YouTube API request failed: ${error.response?.data?.error?.message || "Bad request"}`,
      );
    } else if (error.response?.status >= 500) {
      throw new Error("YouTube API server error. Please try again later.");
    } else if (error.message?.includes("Circuit breaker")) {
      throw new Error(
        "YouTube API temporarily unavailable due to repeated failures. Please try again in a moment.",
      );
    }

    // Generic error
    throw new Error(`YouTube ${operation} failed: ${error.message}`);
  }
}

module.exports = YouTubePlatform;
