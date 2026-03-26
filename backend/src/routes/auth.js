const express = require("express");
const authController = require("../controllers/authController");
const { validateAuthRequest } = require("../middleware/validation");
const { statusLimiter } = require("../middleware/rateLimit");

const router = express.Router();

const isDevelopment = process.env.NODE_ENV === "development";

if (isDevelopment) {
  /**
   * @route GET /auth/test
   * @desc Test route to verify auth routes are working
   * @access Private (Dev only)
   */
  router.get("/test", (req, res) => {
    // Test session functionality
    if (!req.session.testCount) {
      req.session.testCount = 1;
    } else {
      req.session.testCount++;
    }

    res.json({
      message: "Auth routes are working",
      timestamp: new Date().toISOString(),
      session: req.session ? "Session exists" : "No session",
      sessionID: req.sessionID,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      testCount: req.session.testCount,
      cookies: req.headers.cookie ? "Present" : "Missing",
    });
  });

  /**
   * @route GET /auth/debug/oauth-store
   * @desc Debug endpoint to check OAuth memory store status
   * @access Private (Dev only)
   */
  router.get("/debug/oauth-store", (req, res) => {
    // Get the oauthSessionStore from the controller module
    const authController = require("../controllers/authController");

    // Access the store through the module scope
    const store = authController.oauthSessionStore || new Map();

    res.json({
      message: "OAuth Memory Store Debug",
      timestamp: new Date().toISOString(),
      storeSize: store.size,
      storeEntries: Array.from(store.entries()).map(([state, data]) => ({
        state: state.substring(0, 8) + "...",
        hasCodeVerifier: !!data.codeVerifier,
        age: Date.now() - data.timestamp,
        expired: Date.now() - data.timestamp > 600000,
      })),
    });
  });
}

/**
 * @route POST /auth/spotify
 * @desc Initiate Spotify OAuth flow
 * @access Public
 */
router.post(
  "/spotify",
  validateAuthRequest,
  authController.initiateSpotifyAuth,
);

/**
 * @route GET /auth/callback/spotify
 * @desc Handle Spotify OAuth callback (backward compatibility)
 * @access Public
 */
router.get("/callback/spotify", authController.handleSpotifyCallback);

/**
 * @route GET /auth/spotify/callback
 * @desc Handle Spotify OAuth callback (matches redirect URI)
 * @access Public
 */
router.get("/spotify/callback", authController.handleSpotifyCallback);

/**
 * @route POST /auth/spotify/refresh
 * @desc Refresh Spotify access token
 * @access Public
 */
router.post("/spotify/refresh", authController.refreshSpotifyToken);

/**
 * @route POST /auth/youtube
 * @desc Initiate YouTube OAuth flow
 * @access Public
 */
router.post(
  "/youtube",
  validateAuthRequest,
  authController.initiateYouTubeAuth,
);

/**
 * @route GET /auth/callback/youtube
 * @desc Handle YouTube OAuth callback (backward compatibility)
 * @access Public
 */
router.get("/callback/youtube", authController.handleYouTubeCallback);

/**
 * @route GET /auth/youtube/callback
 * @desc Handle YouTube OAuth callback (matches redirect URI)
 * @access Public
 */
router.get("/youtube/callback", authController.handleYouTubeCallback);

/**
 * @route POST /auth/logout
 * @desc Logout user and clear session
 * @access Public
 */
router.post("/logout", authController.logout);

/**
 * @route GET /auth/status
 * @desc Get current authentication status
 * @access Public
 */
router.get("/status", statusLimiter, authController.getAuthStatus);

module.exports = router;
