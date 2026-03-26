/**
 * Spotify OAuth Configuration
 * Follows Spotify Web API best practices
 * @see https://developer.spotify.com/documentation/web-api/tutorials/getting-started
 */

const spotifyConfig = {
  // OAuth endpoints
  endpoints: {
    authorization: "https://accounts.spotify.com/authorize",
    token: "https://accounts.spotify.com/api/token",
    api: "https://api.spotify.com/v1",
  },

  // Required scopes for playlist transfer functionality
  scopes: [
    "user-read-private", // Read user's private information
    "user-read-email", // Read user's email address
    "playlist-read-private", // Read user's private playlists
    "playlist-read-collaborative", // Read collaborative playlists
    "playlist-modify-public", // Modify public playlists
    "playlist-modify-private", // Modify private playlists
  ],

  // OAuth flow configuration
  oauth: {
    responseType: "code",
    showDialog: false, // Set to true to force re-authorization
    stateLength: 16, // Length of random state parameter
    pkceEnabled: true, // Enable PKCE for enhanced security
    codeVerifierLength: 32, // Length of PKCE code verifier
    stateExpiration: 600000, // State expiration time in milliseconds (10 minutes)
    tokenExpirationBuffer: 300000, // Buffer time before token expiration (5 minutes)
  },

  // Rate limiting configuration
  rateLimits: {
    requestsPerSecond: 10, // Spotify's default rate limit
    burstLimit: 100, // Burst limit for short periods
    retryAfter: 1000, // Wait time after rate limit hit
    maxRetries: 3, // Maximum retry attempts
  },

  // Error handling
  errors: {
    invalidGrant: "invalid_grant",
    invalidClient: "invalid_client",
    invalidRequest: "invalid_request",
    unauthorizedClient: "unauthorized_client",
    unsupportedGrantType: "unsupported_grant_type",
    invalidScope: "invalid_scope",
  },

  // HTTP headers
  headers: {
    userAgent: "MoveMyPlaylist/1.0",
    accept: "application/json",
    contentType: "application/x-www-form-urlencoded",
  },

  // Validation rules
  validation: {
    clientId: {
      minLength: 20,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9]+$/,
    },
    clientSecret: {
      minLength: 20,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9]+$/,
    },
    redirectUri: {
      pattern: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
      allowedSchemes: ["http", "https"],
    },
  },

  // Environment validation
  validateEnvironment() {
    const required = [
      "SPOTIFY_CLIENT_ID",
      "SPOTIFY_CLIENT_SECRET",
      "SPOTIFY_REDIRECT_URI",
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      console.warn(
        `[BYOK MODE] Note: Global Spotify environment variables are missing (${missing.join(", ")}). Users will need to provide their own keys to connect to Spotify.`
      );
      return true;
    }

    // Validate client ID format
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!this.validation.clientId.pattern.test(clientId)) {
      console.warn("Invalid global Spotify Client ID format. Check your .env file.");
    }

    // Validate redirect URI format
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    if (!this.validation.redirectUri.pattern.test(redirectUri)) {
      console.warn("Invalid global Spotify Redirect URI format. Check your .env file.");
    }

    return true;
  },

  // Get configuration for specific environment
  getConfig(environment = process.env.NODE_ENV || "development") {
    const baseConfig = {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
      scopes: this.scopes.join(" "),
      ...this.oauth,
      ...this.endpoints,
      ...this.headers, // Include headers configuration
    };

    // Environment-specific overrides
    if (environment === "production") {
      baseConfig.showDialog = false;
      baseConfig.stateExpiration = 300000; // 5 minutes in production
    } else if (environment === "development") {
      baseConfig.showDialog = true;
      baseConfig.stateExpiration = 600000; // 10 minutes in development
    }

    return baseConfig;
  },
};

module.exports = spotifyConfig;
