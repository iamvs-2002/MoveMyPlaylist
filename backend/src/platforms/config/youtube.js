/**
 * YouTube Music Platform Configuration
 */

module.exports = {
  id: "youtube",
  name: "YouTube Music",
  displayName: "YouTube Music",
  icon: "youtube",
  color: "youtube",

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
    baseUrl: "https://www.googleapis.com/youtube/v3",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    searchLimit: 20,
    videoSearchLimit: 5,
    playlistSearchLimit: 10,
  },

  // OAuth configuration
  oauth: {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri: process.env.YOUTUBE_REDIRECT_URI,
    scopes: [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    responseType: "code",
    accessType: "offline",
    prompt: "consent",
    includeGrantedScopes: "true",
  },

  // API key for YouTube Data API
  apiKey: process.env.YOUTUBE_API_KEY,

  // Error codes
  errors: {
    accessDenied: "access_denied",
    invalidGrant: "invalid_grant",
    invalidClient: "invalid_client",
    unauthorizedClient: "unauthorized_client",
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
