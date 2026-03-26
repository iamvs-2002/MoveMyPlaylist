/**
 * Spotify Platform Configuration
 */

module.exports = {
  id: "spotify",
  name: "Spotify",
  displayName: "Spotify",
  icon: "spotify",
  color: "spotify",

  // Platform capabilities
  capabilities: {
    playlists: true,
    search: true,
    create: true,
    modify: true,
    delete: false, // Not implemented yet
    userProfile: true,
  },

  // API configuration
  api: {
    baseUrl: "https://api.spotify.com/v1",
    authUrl: "https://accounts.spotify.com/authorize",
    tokenUrl: "https://accounts.spotify.com/api/token",
    searchLimit: 20,
    albumSearchLimit: 5,
    trackSearchLimit: 10,
  },

  // OAuth configuration
  oauth: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    scopes: [
      "user-read-private",
      "user-read-email",
      "playlist-read-private",
      "playlist-read-collaborative",
      "playlist-modify-public",
      "playlist-modify-private",
    ],
    responseType: "code",
    showDialog: false,
    pkceEnabled: true,
    codeVerifierLength: 128,
  },

  // Content type and user agent
  contentType: "application/x-www-form-urlencoded",
  userAgent: "MoveMyPlaylist/1.0",

  // Error codes
  errors: {
    invalidGrant: "invalid_grant",
    invalidClient: "invalid_client",
    invalidRequest: "invalid_request",
    unauthorizedClient: "unauthorized_client",
    unsupportedGrantType: "unsupported_grant_type",
    invalidScope: "invalid_scope",
  },

  // Search algorithms
  searchAlgorithms: {
    FAST: 0,
    STRICT: 1,
    SMART: 2,
  },

  // Default search algorithm
  defaultAlgorithm: 2, // SMART

  // Rate limiting
  rateLimiting: {
    trackSleepMs: 1000,
    batchSize: 10,
    batchDelayMs: 5000,
    maxRetries: 3,
    retryDelayMs: 2000,
  },
};
