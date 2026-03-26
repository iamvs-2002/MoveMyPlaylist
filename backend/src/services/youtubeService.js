const axios = require("axios");
const querystring = require("querystring");
const apiService = require("./apiService");

/**
 * YouTube Service for MoveMyPlaylist
 * Handles all YouTube Data API v3 and OAuth interactions
 */

class YouTubeService {
  constructor() {
    this.clientId = process.env.YOUTUBE_CLIENT_ID;
    this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    // Provide a fallback redirect URI if not set in environment (BYOK mode support)
    this.redirectUri =
      process.env.YOUTUBE_REDIRECT_URI ||
      (process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/auth/youtube/callback`
        : "https://movemyplaylist.online/auth/youtube/callback");
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = "https://www.googleapis.com/youtube/v3";
    this.authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    this.tokenUrl = "https://oauth2.googleapis.com/token";
    this.userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
  }

  /**
   * Generate YouTube OAuth authorization URL
   */
  getAuthUrl(state, credentials = null) {
    const clientId = credentials?.clientId || this.clientId;
    const params = {
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      state: state,
      access_type: "offline",
      prompt: "consent",
      // Add these parameters for better handling of unverified apps
      include_granted_scopes: "true",
    };

    return `${this.authUrl}?${querystring.stringify(params)}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code, credentials = null) {
    try {
      const clientId = credentials?.clientId || this.clientId;
      const clientSecret = credentials?.clientSecret || this.clientSecret;

      const response = await apiService.post(
        this.tokenUrl,
        {
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: this.redirectUri,
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
      // Handle specific OAuth errors
      if (error.response?.data?.error) {
        const oauthError = error.response.data.error;

        switch (oauthError) {
          case "access_denied":
            throw new Error(
              "YouTube access was denied. This app is in testing mode and needs to be added as a test user. Please contact the developer to be added to the test users list.",
            );
          case "invalid_grant":
            throw new Error(
              "YouTube authorization code expired or is invalid. Please try logging in again.",
            );
          case "invalid_client":
            throw new Error(
              "YouTube client configuration error. Please contact support.",
            );
          case "unauthorized_client":
            throw new Error(
              "YouTube client is not authorized. Please contact support.",
            );
          default:
            throw new Error(
              `YouTube login failed: ${oauthError}. Please try again.`,
            );
        }
      }

      // Handle network or other errors
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Unable to connect to YouTube. Please check your internet connection and try again.",
        );
      }

      throw new Error("Unable to complete YouTube login. Please try again.");
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken, credentials = null) {
    try {
      const clientId = credentials?.clientId || this.clientId;
      const clientSecret = credentials?.clientSecret || this.clientSecret;

      const response = await axios.post(
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
      );

      return {
        access_token: response.data.access_token,
        refresh_token: refreshToken, // Keep the original refresh token
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error) {
      // Handle specific OAuth errors
      if (error.response?.data?.error) {
        const oauthError = error.response.data.error;

        switch (oauthError) {
          case "invalid_grant":
            throw new Error(
              "YouTube refresh token expired. Please log in again.",
            );
          case "invalid_client":
            throw new Error(
              "YouTube client configuration error. Please contact support.",
            );
          case "unauthorized_client":
            throw new Error(
              "YouTube client is not authorized. Please contact support.",
            );
          default:
            throw new Error(
              `YouTube token refresh failed: ${oauthError}. Please log in again.`,
            );
        }
      }

      throw new Error("Unable to refresh YouTube login. Please try again.");
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        id: response.data.id,
        display_name: response.data.name,
        email: response.data.email,
        picture: response.data.picture,
        locale: response.data.locale,
      };
    } catch (error) {
      throw new Error("Unable to get profile information. Please try again.");
    }
  }

  /**
   * Get user's playlists (YouTube Music)
   * Note: YouTube Music playlists are accessed through the regular YouTube API
   */
  async getUserPlaylists(
    accessToken,
    limit = 50,
    pageToken = null,
    credentials = null,
  ) {
    try {
      const apiKey = credentials?.apiKey || this.apiKey;
      const params = {
        part: "snippet,contentDetails",
        mine: true,
        maxResults: limit,
        key: apiKey,
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${this.baseUrl}/playlists`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      });

      return {
        items: response.data.items.map((playlist) => ({
          id: playlist.id,
          name: playlist.snippet.title,
          description: playlist.snippet.description,
          images: [
            {
              url:
                playlist.snippet.thumbnails?.high?.url ||
                playlist.snippet.thumbnails?.medium?.url ||
                playlist.snippet.thumbnails?.default?.url,
              width:
                playlist.snippet.thumbnails?.high?.width ||
                playlist.snippet.thumbnails?.medium?.width ||
                playlist.snippet.thumbnails?.default?.width,
              height:
                playlist.snippet.thumbnails?.high?.height ||
                playlist.snippet.thumbnails?.medium?.height ||
                playlist.snippet.thumbnails?.default?.height,
            },
          ],
          owner: playlist.snippet.channelTitle,
          tracks_count: playlist.contentDetails.itemCount,
          created_at: playlist.snippet.publishedAt,
          updated_at: playlist.snippet.publishedAt,
        })),
        nextPageToken: response.data.nextPageToken,
        total: response.data.pageInfo?.totalResults || 0,
      };
    } catch (error) {
      throw new Error("Unable to get playlists. Please try again.");
    }
  }

  /**
   * Get specific playlist with tracks
   */
  async getPlaylist(accessToken, playlistId, credentials = null) {
    try {
      const apiKey = credentials?.apiKey || this.apiKey;
      // Get playlist details
      const playlistResponse = await axios.get(`${this.baseUrl}/playlists`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          part: "snippet,contentDetails",
          id: playlistId,
          key: apiKey,
        },
      });

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
      );

      return {
        id: playlist.id,
        name: playlist.snippet.title,
        description: playlist.snippet.description,
        images: [
          {
            url:
              playlist.snippet.thumbnails?.high?.url ||
              playlist.snippet.thumbnails?.medium?.url ||
              playlist.snippet.thumbnails?.default?.url,
            width:
              playlist.snippet.thumbnails?.high?.width ||
              playlist.snippet.thumbnails?.medium?.width ||
              playlist.snippet.thumbnails?.default?.width,
            height:
              playlist.snippet.thumbnails?.high?.height ||
              playlist.snippet.thumbnails?.medium?.height ||
              playlist.snippet.thumbnails?.default?.height,
          },
        ],
        owner: playlist.snippet.channelTitle,
        tracks: tracksResponse.items,
        tracks_count: playlist.contentDetails.itemCount,
      };
    } catch (error) {
      throw new Error("Unable to get playlist. Please try again.");
    }
  }

  /**
   * Get tracks from a specific playlist
   */
  async getPlaylistTracks(
    accessToken,
    playlistId,
    limit = 50,
    pageToken = null,
    credentials = null,
  ) {
    try {
      const apiKey = credentials?.apiKey || this.apiKey;
      const params = {
        part: "snippet,contentDetails",
        playlistId: playlistId,
        maxResults: limit,
        key: apiKey,
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${this.baseUrl}/playlistItems`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      });

      return {
        items: response.data.items.map((item) => ({
          id: item.contentDetails.videoId,
          name: item.snippet.title,
          artists: [
            {
              id: item.snippet.videoOwnerChannelId,
              name: item.snippet.videoOwnerChannelTitle,
            },
          ],
          album: {
            id: item.snippet.playlistId,
            name: item.snippet.playlistTitle,
            images: [
              {
                url:
                  item.snippet.thumbnails?.high?.url ||
                  item.snippet.thumbnails?.medium?.url ||
                  item.snippet.thumbnails?.default?.url,
              },
            ],
          },
          external_ids: {
            youtube: item.contentDetails.videoId,
          },
        })),
        nextPageToken: response.data.nextPageToken,
        total: response.data.pageInfo?.totalResults || 0,
      };
    } catch (error) {
      throw new Error("Unable to get playlist songs. Please try again.");
    }
  }

  /**
   * Search for tracks by query
   */
  async searchTracks(accessToken, query, limit = 20, credentials = null) {
    try {
      const apiKey = credentials?.apiKey || this.apiKey;
      const response = await axios.get(`${this.baseUrl}/search`, {
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
      });

      return response.data.items.map((item) => ({
        id: item.id.videoId,
        name: item.snippet.title,
        artists: [
          {
            id: item.snippet.channelId,
            name: item.snippet.channelTitle,
          },
        ],
        album: {
          id: item.snippet.channelId,
          name: item.snippet.channelTitle,
          images: [
            {
              url:
                item.snippet.thumbnails?.high?.url ||
                item.snippet.thumbnails?.medium?.url ||
                item.snippet.thumbnails?.default?.url,
            },
          ],
        },
        external_ids: {
          youtube: item.id.videoId,
        },
      }));
    } catch (error) {
      throw new Error("Unable to search for songs. Please try again.");
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(
    accessToken,
    name,
    description = "",
    privacyStatus = "private",
    credentials = null,
  ) {
    try {
      const apiKey = credentials?.apiKey || this.apiKey;
      const response = await axios.post(
        `${this.baseUrl}/playlists`,
        {
          snippet: {
            title: name,
            description: description,
          },
          status: {
            privacyStatus: privacyStatus,
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
      );

      return {
        id: response.data.id,
        name: response.data.snippet.title,
        description: response.data.snippet.description,
        public: response.data.status.privacyStatus === "public",
        uri: `https://www.youtube.com/playlist?list=${response.data.id}`,
      };
    } catch (error) {
      throw new Error("Unable to create playlist. Please try again.");
    }
  }

  /**
   * Add tracks to playlist
   */
  async addTracksToPlaylist(
    accessToken,
    playlistId,
    videoIds,
    credentials = null,
  ) {
    try {
      const apiKey = credentials?.apiKey || this.apiKey;
      const promises = videoIds.map((videoId) =>
        axios.post(
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
        ),
      );

      const results = await Promise.all(promises);

      return {
        added_count: results.length,
        items: results.map((result) => result.data),
      };
    } catch (error) {
      throw new Error("Unable to add songs to playlist. Please try again.");
    }
  }
}

module.exports = new YouTubeService();
