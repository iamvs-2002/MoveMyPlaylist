const axios = require("axios");
const querystring = require("querystring");
const crypto = require("crypto");
const apiService = require("./apiService");
const spotifyConfig = require("../config/spotifyConfig");

/**
 * Spotify Service for MoveMyPlaylist
 * Handles all Spotify Web API interactions following official documentation
 * @see https://developer.spotify.com/documentation/web-api/tutorials/getting-started
 */

class SpotifyService {
  constructor() {
    // Validate environment configuration (non-fatal in BYOK mode)
    spotifyConfig.validateEnvironment();

    this.config = spotifyConfig.getConfig();

    // Debug configuration loading
    console.log("Spotify service config loaded:", {
      hasClientId: !!this.config.clientId,
      hasClientSecret: !!this.config.clientSecret,
      hasRedirectUri: !!this.config.redirectUri,
      hasContentType: !!this.config.contentType,
      hasUserAgent: !!this.config.userAgent,
      contentType: this.config.contentType || "Missing",
      userAgent: this.config.userAgent || "Missing",
    });

    this.clientId = this.config.clientId;
    this.clientSecret = this.config.clientSecret;
    // Provide a fallback redirect URI if not set in environment (BYOK mode support)
    this.redirectUri =
      this.config.redirectUri ||
      (process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/auth/spotify/callback`
        : "https://movemyplaylist.online/auth/spotify/callback");
    this.baseUrl = this.config.api;
    this.authUrl = this.config.authorization;
    this.tokenUrl = this.config.token;
  }

  /**
   * Generate PKCE code verifier and challenge
   * @returns {Object} Object containing code_verifier and code_challenge
   */
  generatePKCE() {
    const codeVerifier = crypto
      .randomBytes(this.config.codeVerifierLength)
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
   * @param {string} codeChallenge - PKCE code challenge
   * @returns {string} Authorization URL
   */
  getAuthUrl(state, codeChallenge = null, credentials = null) {
    const clientId = credentials?.clientId || this.clientId;
    const params = {
      client_id: clientId,
      response_type: this.config.responseType,
      redirect_uri: this.redirectUri,
      state: state,
      scope: this.config.scopes,
      show_dialog: this.config.showDialog,
    };

    // Add PKCE if enabled and code challenge is provided
    if (this.config.pkceEnabled && codeChallenge) {
      params.code_challenge = codeChallenge;
      params.code_challenge_method = "S256";
    }

    return `${this.authUrl}?${querystring.stringify(params)}`;
  }

  /**
   * Exchange authorization code for access tokens
   * @param {string} code - Authorization code from callback
   * @param {string} codeVerifier - PKCE code verifier (if using PKCE)
   * @returns {Object} Token response
   */
  async exchangeCodeForTokens(code, codeVerifier = null, credentials = null) {
    try {
      const clientId = credentials?.clientId || this.clientId;
      const clientSecret = credentials?.clientSecret || this.clientSecret;

      const tokenData = {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: this.redirectUri,
      };

      // Add PKCE code verifier if enabled and provided
      if (this.config.pkceEnabled && codeVerifier) {
        tokenData.code_verifier = codeVerifier;
      }

      const response = await apiService.post(
        this.tokenUrl,
        tokenData,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type":
              this.config.contentType || "application/x-www-form-urlencoded",
            "User-Agent": this.config.userAgent || "MoveMyPlaylist/1.0",
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
      this.handleSpotifyError(error, "token_exchange");
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New token response
   */
  async refreshTokens(refreshToken, credentials = null) {
    try {
      const clientId = credentials?.clientId || this.clientId;
      const clientSecret = credentials?.clientSecret || this.clientSecret;

      const response = await apiService.post(
        this.tokenUrl,
        {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
            "Content-Type":
              this.config.contentType || "application/x-www-form-urlencoded",
            "User-Agent": this.config.userAgent || "MoveMyPlaylist/1.0",
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
      this.handleSpotifyError(error, "token_refresh");
    }
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
        case spotifyConfig.errors.invalidGrant:
          throw new Error("Authorization expired. Please log in again.");
        case spotifyConfig.errors.invalidClient:
          throw new Error(
            "Invalid application credentials. If you're using your own keys, please double-check your Client ID and Client Secret in the Spotify Developer Dashboard.",
          );
        case spotifyConfig.errors.invalidRequest:
          throw new Error("Invalid request. Please try again.");
        case spotifyConfig.errors.unauthorizedClient:
          throw new Error(
            "Application not authorized. Ensure you've added the correct Redirect URI to your Spotify App settings.",
          );
        case spotifyConfig.errors.unsupportedGrantType:
          throw new Error(
            "Unsupported authorization method. Please contact support.",
          );
        case spotifyConfig.errors.invalidScope:
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

  /**
   * Get user profile information
   * @param {string} accessToken - Valid access token
   * @returns {Object} User profile data
   */
  async getUserProfile(accessToken) {
    try {
      const response = await apiService.get(
        `${this.baseUrl}/me`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        "spotify",
      );

      return {
        id: response.data.id,
        display_name: response.data.display_name,
        email: response.data.email,
        country: response.data.country,
        images: response.data.images,
        product: response.data.product,
        uri: response.data.uri,
        external_urls: response.data.external_urls,
      };
    } catch (error) {
      console.error(
        "Spotify profile fetch error:",
        error.response?.data || error.message,
      );
      throw new Error("Unable to get profile information. Please try again.");
    }
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(accessToken, limit = 50, offset = 0) {
    try {
      console.log("SpotifyService.getUserPlaylists called with:", {
        hasToken: !!accessToken,
        tokenLength: accessToken?.length || 0,
        limit,
        offset,
        baseUrl: this.baseUrl,
        fullUrl: `${this.baseUrl}/me/playlists`,
      });

      // First, let's get the user profile to understand the account type
      let userId = null;
      try {
        const profileResponse = await axios.get(`${this.baseUrl}/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        userId = profileResponse.data.id;
        console.log("User profile response:", {
          status: profileResponse.status,
          product: profileResponse.data?.product,
          type: profileResponse.data?.type,
          displayName: profileResponse.data?.display_name,
          userId: userId,
        });
      } catch (profileError) {
        console.log("Could not fetch user profile:", profileError.message);
      }

      const response = await axios.get(`${this.baseUrl}/me/playlists`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit,
          offset,
          market: "from_token", // Add market parameter for better compatibility
        },
      });

      console.log("Spotify API response received:", {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : "No data",
        itemsCount: response.data?.items?.length || 0,
        total: response.data?.total || 0,
        fullResponse: JSON.stringify(response.data, null, 2),
      });

      const result = {
        items: response.data.items.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          images: playlist.images,
          owner: playlist.owner.display_name,
          tracks_count: playlist.tracks.total,
          public: playlist.public,
          collaborative: playlist.collaborative,
          created_at: playlist.created_at,
          updated_at: playlist.snapshot_id,
        })),
        total: response.data.total,
        limit: response.data.limit,
        offset: response.data.offset,
      };

      console.log("Processed playlists result:", {
        hasResult: !!result,
        itemsCount: result.items?.length || 0,
        total: result.total || 0,
      });

      // If no playlists found, try alternative endpoint
      if (result.items.length === 0 && userId) {
        console.log(
          "No playlists found with /me/playlists, trying alternative endpoint...",
        );
        try {
          const altResponse = await axios.get(
            `${this.baseUrl}/users/${userId}/playlists`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              params: {
                limit,
                offset,
              },
            },
          );

          console.log("Alternative endpoint response:", {
            status: altResponse.status,
            itemsCount: altResponse.data?.items?.length || 0,
            total: altResponse.data?.total || 0,
          });

          if (altResponse.data?.items?.length > 0) {
            console.log("Found playlists with alternative endpoint!");
            const altResult = {
              items: altResponse.data.items.map((playlist) => ({
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                images: playlist.images,
                owner: playlist.owner.display_name,
                tracks_count: playlist.tracks.total,
                public: playlist.public,
                collaborative: playlist.collaborative,
                created_at: playlist.created_at,
                updated_at: playlist.snapshot_id,
              })),
              total: altResponse.data.total,
              limit: altResponse.data.limit,
              offset: altResponse.data.offset,
            };
            return altResult;
          }
        } catch (altError) {
          console.log("Alternative endpoint also failed:", altError.message);
        }
      }

      return result;
    } catch (error) {
      console.error("Error in SpotifyService.getUserPlaylists:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw new Error("Unable to get playlists. Please try again.");
    }
  }

  /**
   * Get playlist details
   */
  async getPlaylist(accessToken, playlistId) {
    try {
      const response = await axios.get(
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
      );

      const playlist = response.data;
      return {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        images: playlist.images,
        owner: playlist.owner.display_name,
        tracks: playlist.tracks.items
          .map((item) => ({
            id: item.track?.id,
            name: item.track?.name,
            artists:
              item.track?.artists?.map((artist) => ({
                id: artist.id,
                name: artist.name,
              })) || [],
            album: item.track?.album
              ? {
                  id: item.track.album.id,
                  name: item.track.album.name,
                  images: item.track.album.images,
                }
              : null,
            external_ids: item.track?.external_ids || {},
            popularity: item.track?.popularity || 0,
          }))
          .filter((track) => track.id), // Filter out null tracks
        tracks_count: playlist.tracks.total,
      };
    } catch (error) {
      throw new Error("Unable to get playlist. Please try again.");
    }
  }

  /**
   * Search for tracks by query
   */
  async searchTracks(accessToken, query, limit = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          q: query,
          type: "track",
          limit,
          market: "from_token",
        },
      });

      return response.data.tracks.items.map((track) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        })),
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images,
        },
        external_ids: track.external_ids || {},
        popularity: track.popularity || 0,
      }));
    } catch (error) {
      throw new Error("Unable to search for songs. Please try again.");
    }
  }

  /**
   * Search for albums by artist name
   */
  async searchAlbumsByArtist(accessToken, artistName, limit = 5) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          q: artistName,
          type: "album",
          limit,
          market: "from_token",
        },
      });

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
      throw new Error("Unable to search for albums. Please try again.");
    }
  }

  /**
   * Get tracks from a specific album
   */
  async getAlbumTracks(accessToken, albumId) {
    try {
      const response = await axios.get(
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
      );

      return response.data.items.map((track) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        })),
        duration_ms: track.duration_ms,
        track_number: track.track_number,
        disc_number: track.disc_number,
      }));
    } catch (error) {
      throw new Error("Unable to get album tracks. Please try again.");
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(
    accessToken,
    userId,
    name,
    description = "",
    isPublic = false,
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users/${userId}/playlists`,
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
      );

      return {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        public: response.data.public,
        uri: response.data.uri,
      };
    } catch (error) {
      throw new Error("Unable to create playlist. Please try again.");
    }
  }

  /**
   * Add tracks to playlist
   */
  async addTracksToPlaylist(accessToken, playlistId, trackUris) {
    try {
      const response = await axios.post(
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
      );

      return {
        snapshot_id: response.data.snapshot_id,
        added_count: trackUris.length,
      };
    } catch (error) {
      throw new Error("Unable to add songs to playlist. Please try again.");
    }
  }
}

module.exports = new SpotifyService();
