/**
 * Authentication middleware for MoveMyPlaylist
 * Checks if user has valid authentication tokens for specified platforms
 */

/**
 * Middleware to require authentication for a specific platform
 * @param {string} platform - 'spotify', 'youtube', or 'both'
 */
const requireAuth = (platform) => {
  return (req, res, next) => {
    try {
      // Check if user has a valid session
      if (!req.session || !req.session.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please log in to access this resource",
          code: "AUTH_REQUIRED",
        });
      }

      const { spotifyTokens, youtubeTokens } = req.session.user;

      // Check platform-specific authentication
      switch (platform) {
        case "spotify":
          if (!spotifyTokens || !spotifyTokens.access_token) {
            return res.status(401).json({
              success: false,
              error: {
                message: "Please connect your Spotify account to continue",
                statusCode: 401,
                code: "SPOTIFY_AUTH_REQUIRED",
              },
            });
          }
          break;

        case "youtube":
          if (!youtubeTokens || !youtubeTokens.access_token) {
            return res.status(401).json({
              success: false,
              error: {
                message:
                  "Please connect your YouTube Music account to continue",
                statusCode: 401,
                code: "YOUTUBE_AUTH_REQUIRED",
              },
            });
          }
          break;

        case "both":
          if (!spotifyTokens || !spotifyTokens.access_token) {
            return res.status(401).json({
              success: false,
              error: {
                message: "Please connect your Spotify account to continue",
                statusCode: 401,
                code: "SPOTIFY_AUTH_REQUIRED",
              },
            });
          }
          if (!youtubeTokens || !youtubeTokens.access_token) {
            return res.status(401).json({
              success: false,
              error: {
                message:
                  "Please connect your YouTube Music account to continue",
                statusCode: 401,
                code: "YOUTUBE_AUTH_REQUIRED",
              },
            });
          }
          break;

        default:
          if (!["spotify", "youtube"].includes(platform)) {
            return res.status(400).json({
              error: "Invalid music service",
              message: "Please select either Spotify or YouTube Music.",
              code: "INVALID_PLATFORM",
            });
          }
      }

      // Add user info to request for controllers to use
      req.user = req.session.user;
      next();
    } catch (error) {
      // Authentication failed
      return res.status(401).json({
        success: false,
        error: {
          message: "Please log in to continue",
          statusCode: 401,
          code: "AUTHENTICATION_REQUIRED",
        },
      });
    }
  };
};

/**
 * Middleware to check if user is authenticated (optional)
 * Adds user info to request if available, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      req.user = req.session.user;
    }
    next();
  } catch (error) {
    // Optional authentication failed, continue without user
    next();
  }
};

/**
 * Middleware to refresh expired tokens automatically
 */
const refreshTokensIfNeeded = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return next();
    }

    const { spotifyTokens, youtubeTokens } = req.session.user;
    const now = Date.now();

    // Check Spotify tokens
    if (
      spotifyTokens &&
      spotifyTokens.expires_at &&
      now >= spotifyTokens.expires_at
    ) {
      try {
        const spotifyService = require("../services/spotifyService");
        const newTokens = await spotifyService.refreshTokens(
          spotifyTokens.refresh_token,
        );
        req.session.user.spotifyTokens = newTokens;
        req.session.save();
      } catch (error) {
        // Failed to refresh Spotify tokens
        delete req.user.spotifyTokens;
      }
    }

    // Check YouTube tokens
    if (
      youtubeTokens &&
      youtubeTokens.expires_at &&
      now >= youtubeTokens.expires_at
    ) {
      try {
        const youtubeService = require("../services/youtubeService");
        const newTokens = await youtubeService.refreshTokens(
          youtubeTokens.refresh_token,
        );
        req.session.user.youtubeTokens = newTokens;
        req.session.save();
      } catch (error) {
        // Failed to refresh YouTube tokens
        delete req.user.youtubeTokens;
      }
    }

    next();
  } catch (error) {
    // Token refresh failed, continue without refresh
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  refreshTokensIfNeeded,
};
