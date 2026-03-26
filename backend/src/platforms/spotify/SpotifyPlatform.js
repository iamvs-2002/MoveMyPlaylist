const crypto = require("crypto");
const BasePlatform = require("../base/BasePlatform");

/**
 * Spotify Platform Implementation
 * Implements the Platform interface for Spotify
 */
class SpotifyPlatform extends BasePlatform {
  constructor(config) {
    super(config);

    // Extract configuration
    this.clientId = config.oauth.clientId;
    this.clientSecret = config.oauth.clientSecret;
    this.redirectUri = config.oauth.redirectUri;
    this.baseUrl = config.api.baseUrl;
    this.authUrl = config.api.authUrl;
    this.tokenUrl = config.api.tokenUrl;
    this.scopes = config.oauth.scopes;
    this.responseType = config.oauth.responseType;
    this.showDialog = config.oauth.showDialog;
    this.pkceEnabled = config.oauth.pkceEnabled;
    this.codeVerifierLength = config.oauth.codeVerifierLength;
    this.contentType = config.contentType;
    this.userAgent = config.userAgent;
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
        console.warn(
          `[BYOK] Note: Global Spotify OAuth field '${field}' is missing. Users will need to provide their own keys in production.`,
        );
      }
    }

    return true;
  }

  /**
   * Generate PKCE code verifier and challenge
   * @returns {Object} Object containing code_verifier and code_challenge
   */
  generatePKCE() {
    const codeVerifier = crypto
      .randomBytes(this.codeVerifierLength)
      .toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate Spotify OAuth authorization URL with PKCE support
   * @param {string} state - Random state parameter for security
   * @param {Object} [options] - Additional options
   * @returns {string} Authorization URL
   */
  getAuthUrl(state, options = {}) {
    const params = {
      client_id: this.clientId,
      response_type: this.responseType,
      redirect_uri: this.redirectUri,
      state: state,
      scope: this.scopes.join(" "),
      show_dialog: this.showDialog,
    };

    // Add PKCE if enabled and code challenge is provided
    if (this.pkceEnabled && options.codeChallenge) {
      params.code_challenge = options.codeChallenge;
      params.code_challenge_method = "S256";
    }

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
      // Use provided credentials if available (BYOK), otherwise fallback to global config
      const clientId = options.clientId || this.clientId;
      const clientSecret = options.clientSecret || this.clientSecret;
      const redirectUri = options.redirectUri || this.redirectUri;

      const tokenData = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      };

      // Add PKCE code verifier if enabled and provided
      if (this.pkceEnabled && options.codeVerifier) {
        tokenData.code_verifier = options.codeVerifier;
      }

      const response = await this.apiService.post(
        this.tokenUrl,
        tokenData,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type":
              this.contentType || "application/x-www-form-urlencoded",
            "User-Agent": this.userAgent || "MoveMyPlaylist/1.0",
          },
        },
        "spotify",
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
        scope: response.data.scope,
      };
    } catch (error) {
      throw this.handleSpotifyError(error, "token_exchange");
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token response
   */
  async refreshTokens(refreshToken, options = {}) {
    try {
      // Use provided credentials if available (BYOK), otherwise fallback to global config
      const clientId = options.clientId || this.clientId;
      const clientSecret = options.clientSecret || this.clientSecret;

      const response = await this.apiService.post(
        this.tokenUrl,
        {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type":
              this.contentType || "application/x-www-form-urlencoded",
            "User-Agent": this.userAgent || "MoveMyPlaylist/1.0",
          },
        },
        "spotify",
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
        scope: response.data.scope,
      };
    } catch (error) {
      throw this.handleSpotifyError(error, "token_refresh");
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
        `${this.baseUrl}/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        "spotify",
      );

      return this.normalizeUserProfile(response.data);
    } catch (error) {
      throw this.handleSpotifyError(error, "profile_fetch");
    }
  }

  /**
   * Get user's playlists
   * @param {string} accessToken - Valid access token
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} User's playlists
   */
  async getUserPlaylists(accessToken, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const response = await this.apiService.get(
        `${this.baseUrl}/me/playlists`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: { limit, offset },
        },
        "spotify",
      );

      return response.data.items.map((playlist) =>
        this.normalizePlaylist(playlist),
      );
    } catch (error) {
      throw this.handleSpotifyError(error, "playlists_fetch");
    }
  }

  /**
   * Get specific playlist with tracks
   * @param {string} accessToken - Valid access token
   * @param {string} playlistId - Playlist identifier
   * @returns {Promise<Object>} Playlist data
   */
  async getPlaylist(accessToken, playlistId) {
    try {
      const response = await this.apiService.get(
        `${this.baseUrl}/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            fields:
              "id,name,description,images,owner,tracks.items(track(id,name,artists,album,external_ids,popularity)),tracks.total",
          },
        },
        "spotify",
      );

      return this.normalizePlaylist(response.data);
    } catch (error) {
      throw this.handleSpotifyError(error, "playlist_fetch");
    }
  }

  /**
   * Search for tracks by query
   * @param {string} accessToken - Valid access token
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchTracks(accessToken, query, options = {}) {
    try {
      const { limit = 20 } = options;

      const response = await this.apiService.get(
        `${this.baseUrl}/search`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            q: query,
            type: "track",
            limit,
            market: "from_token",
          },
        },
        "spotify",
      );

      return response.data.tracks.items.map((track) =>
        this.normalizeTrack(track),
      );
    } catch (error) {
      throw this.handleSpotifyError(error, "track_search");
    }
  }

  /**
   * Search for albums by artist name
   * @param {string} accessToken - Valid access token
   * @param {string} artistName - Artist name
   * @param {Object} [options] - Search options
   * @returns {Promise<Array>} Album search results
   */
  async searchAlbumsByArtist(accessToken, artistName, options = {}) {
    try {
      const { limit = 5 } = options;

      const response = await this.apiService.get(
        `${this.baseUrl}/search`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            q: artistName,
            type: "album",
            limit,
            market: "from_token",
          },
        },
        "spotify",
      );

      return response.data.albums.items.map((album) => ({
        id: album.id,
        name: album.name,
        artists: album.artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        })),
        images: album.images,
        release_date: album.release_date,
        total_tracks: album.total_tracks,
      }));
    } catch (error) {
      throw this.handleSpotifyError(error, "album_search");
    }
  }

  /**
   * Get tracks from a specific album
   * @param {string} accessToken - Valid access token
   * @param {string} albumId - Album identifier
   * @returns {Promise<Array>} Album tracks
   */
  async getAlbumTracks(accessToken, albumId) {
    try {
      const response = await this.apiService.get(
        `${this.baseUrl}/albums/${albumId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            limit: 50,
            market: "from_token",
          },
        },
        "spotify",
      );

      return response.data.items.map((track) => this.normalizeTrack(track));
    } catch (error) {
      throw this.handleSpotifyError(error, "album_tracks_fetch");
    }
  }

  /**
   * Create a new playlist
   * @param {string} accessToken - Valid access token
   * @param {Object} playlistData - Playlist creation data
   * @returns {Promise<Object>} Created playlist
   */
  async createPlaylist(accessToken, playlistData) {
    try {
      const { name, description = "", isPublic = false } = playlistData;

      // Get user ID first
      const userProfile = await this.getUserProfile(accessToken);

      const response = await this.apiService.post(
        `${this.baseUrl}/users/${userProfile.id}/playlists`,
        {
          name,
          description,
          public: isPublic,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
        "spotify",
      );

      return this.normalizePlaylist(response.data);
    } catch (error) {
      throw this.handleSpotifyError(error, "playlist_creation");
    }
  }

  /**
   * Add tracks to playlist
   * @param {string} accessToken - Valid access token
   * @param {string} playlistId - Playlist identifier
   * @param {Array} tracks - Tracks to add
   * @returns {Promise<Object>} Operation result
   */
  async addTracksToPlaylist(accessToken, playlistId, tracks) {
    try {
      const trackUris = tracks.map(
        (track) => track.uri || `spotify:track:${track.id}`,
      );

      const response = await this.apiService.post(
        `${this.baseUrl}/playlists/${playlistId}/tracks`,
        {
          uris: trackUris,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
        "spotify",
      );

      return {
        success: true,
        message: `Added ${trackUris.length} tracks to playlist`,
        data: {
          snapshot_id: response.data.snapshot_id,
          added_count: trackUris.length,
        },
      };
    } catch (error) {
      throw this.handleSpotifyError(error, "tracks_addition");
    }
  }

  /**
   * Normalize track data to common format
   * @param {Object} rawTrack - Raw track data from Spotify
   * @returns {Object} Normalized track data
   */
  normalizeTrack(rawTrack) {
    if (!rawTrack) return null;

    return {
      id: rawTrack.id,
      name: rawTrack.name,
      artists:
        rawTrack.artists?.map((artist) => ({
          id: artist.id,
          name: artist.name,
        })) || [],
      album: rawTrack.album
        ? {
            id: rawTrack.album.id,
            name: rawTrack.album.name,
            images: rawTrack.album.images,
          }
        : null,
      duration: rawTrack.duration_ms,
      externalIds: rawTrack.external_ids || {},
      platform: this.id,
      metadata: {
        popularity: rawTrack.popularity,
        track_number: rawTrack.track_number,
        disc_number: rawTrack.disc_number,
        uri: rawTrack.uri,
      },
    };
  }

  /**
   * Normalize playlist data to common format
   * @param {Object} rawPlaylist - Raw playlist data from Spotify
   * @returns {Object} Normalized playlist data
   */
  normalizePlaylist(rawPlaylist) {
    if (!rawPlaylist) return null;

    return {
      id: rawPlaylist.id,
      name: rawPlaylist.name,
      description: rawPlaylist.description,
      tracks:
        rawPlaylist.tracks?.items
          ?.map((item) => (item.track ? this.normalizeTrack(item.track) : null))
          .filter(Boolean) || [],
      owner: rawPlaylist.owner?.display_name || "Unknown",
      platform: this.id,
      metadata: {
        images: rawPlaylist.images,
        public: rawPlaylist.public,
        collaborative: rawPlaylist.collaborative,
        created_at: rawPlaylist.created_at,
        updated_at: rawPlaylist.snapshot_id,
        tracks_count: rawPlaylist.tracks?.total || 0,
        uri: rawPlaylist.uri,
      },
    };
  }

  /**
   * Normalize user profile data to common format
   * @param {Object} rawProfile - Raw profile data from Spotify
   * @returns {Object} Normalized profile data
   */
  normalizeUserProfile(rawProfile) {
    if (!rawProfile) return null;

    return {
      id: rawProfile.id,
      displayName: rawProfile.display_name,
      email: rawProfile.email,
      country: rawProfile.country,
      images: rawProfile.images,
      platform: this.id,
      metadata: {
        product: rawProfile.product,
        uri: rawProfile.uri,
        external_urls: rawProfile.external_urls,
      },
    };
  }

  /**
   * Handle Spotify API errors with specific error codes
   * @param {Error} error - Error object from API call
   * @param {string} operation - Operation that failed
   * @throws {Error} Standardized error message
   */
  handleSpotifyError(error, operation) {
    if (error.response?.data) {
      const { error: spotifyError, error_description } = error.response.data;

      switch (spotifyError) {
        case this.errors.invalidGrant:
          throw new Error("Authorization expired. Please log in again.");
        case this.errors.invalidClient:
          throw new Error(
            "Invalid application credentials. Please contact support.",
          );
        case this.errors.invalidRequest:
          throw new Error("Invalid request. Please try again.");
        case this.errors.unauthorizedClient:
          throw new Error(
            "Application not authorized. Please contact support.",
          );
        case this.errors.unsupportedGrantType:
          throw new Error(
            "Unsupported authorization method. Please contact support.",
          );
        case this.errors.invalidScope:
          throw new Error(
            "Invalid permissions requested. Please contact support.",
          );
        default:
          console.error(`Spotify ${operation} error:`, {
            error: spotifyError,
            description: error_description,
          });
          throw new Error("Unable to complete operation. Please try again.");
      }
    } else {
      console.error(`Spotify ${operation} network error:`, error.message);
      throw new Error(
        "Network error. Please check your connection and try again.",
      );
    }
  }
}

module.exports = SpotifyPlatform;
