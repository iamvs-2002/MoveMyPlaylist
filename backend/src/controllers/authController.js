const spotifyService = require("../services/spotifyService");
const youtubeService = require("../services/youtubeService");
const { generateRandomString } = require("../utils/crypto");
const {
  sendSuccess,
  sendError,
  unauthorizedResponse,
  asyncHandler,
} = require("../utils/api");

/**
 * Authentication Controller for MoveMyPlaylist
 * Handles OAuth flows for Spotify and YouTube Music
 * Follows Spotify Web API best practices
 * @see https://developer.spotify.com/documentation/web-api/tutorials/getting-started
 */

// In-memory session store for OAuth state and user data (temporary solution for domain mismatch)
const oauthSessionStore = new Map();
const userDataStore = new Map(); // Store user data by session ID

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  let userDataCleanedCount = 0;

  for (const [state, data] of oauthSessionStore.entries()) {
    if (now - data.timestamp > 600000) {
      // 10 minutes
      oauthSessionStore.delete(state);
      cleanedCount++;
    }
  }

  for (const [sessionId, userData] of userDataStore.entries()) {
    if (now - userData.timestamp > 3600000) {
      // 1 hour
      userDataStore.delete(sessionId);
      userDataCleanedCount++;
    }
  }

  if (cleanedCount > 0 || userDataCleanedCount > 0) {
    console.log(
      `Cleaned up ${cleanedCount} expired OAuth states and ${userDataCleanedCount} expired user data entries`,
    );
  }
}, 300000); // 5 minutes

/**
 * Initiate Spotify OAuth flow with PKCE support
 */
const initiateSpotifyAuth = async (req, res) => {
  try {
    console.log("Spotify auth initiation started:", {
      session: req.session ? "Session exists" : "No session",
      sessionData: req.session ? Object.keys(req.session) : "No session keys",
    });

    const state = generateRandomString(16);

    // Generate PKCE code verifier and challenge
    const { codeVerifier, codeChallenge } = spotifyService.generatePKCE();

    // Extract dynamic credentials if provided by user
    const credentials = req.body.credentials || null;

    // Store state and code verifier in both session and memory store
    req.session.spotifyState = state;
    req.session.spotifyCodeVerifier = codeVerifier;

    // Also store in memory store for cross-domain access
    oauthSessionStore.set(state, {
      codeVerifier,
      timestamp: Date.now(),
      sessionId: req.sessionID,
      credentials,
    });

    console.log("OAuth state stored in memory:", {
      state: state,
      storeSize: oauthSessionStore.size,
      hasCredentials: !!credentials,
      storedData: oauthSessionStore.get(state),
    });

    const authUrl = spotifyService.getAuthUrl(
      state,
      codeChallenge,
      credentials,
    );

    console.log("Spotify auth URL generated:", authUrl);

    sendSuccess(
      res,
      {
        authUrl,
        state,
        codeChallenge,
        expiresIn: 600, // 10 minutes for state expiration
      },
      "Redirect user to Spotify authorization URL",
    );
  } catch (error) {
    console.error("Spotify auth initiation error:", error);
    sendError(
      res,
      "Unable to start Spotify login. Please try again.",
      500,
      null,
      "SPOTIFY_AUTH_INIT_FAILED",
    );
  }
};

/**
 * Handle Spotify OAuth callback with PKCE verification
 */
const handleSpotifyCallback = async (req, res) => {
  try {
    console.log("Spotify callback received:", {
      query: req.query,
      session: req.session ? "Session exists" : "No session",
      sessionData: req.session ? Object.keys(req.session) : "No session keys",
    });

    const { code, state, error } = req.query;

    // Try to get state from session first, then from memory store
    let sessionState = req.session.spotifyState;
    let codeVerifier = req.session.spotifyCodeVerifier;
    let credentials = null;

    // If not in session, try memory store (handles domain mismatch)
    // Or if credentials are in memory store
    let memoryData = oauthSessionStore.get(state);
    if (memoryData && memoryData.credentials) {
      credentials = memoryData.credentials;
    }

    if (!sessionState || !codeVerifier) {
      console.log("State not found in session, checking memory store...");
      console.log("Memory store status:", {
        storeSize: oauthSessionStore.size,
        allStates: Array.from(oauthSessionStore.keys()),
        requestedState: state,
      });

      memoryData = oauthSessionStore.get(state);

      if (memoryData) {
        console.log("Found state in memory store:", {
          state: state,
          hasCodeVerifier: !!memoryData.codeVerifier,
          timestamp: memoryData.timestamp,
          age: Date.now() - memoryData.timestamp,
        });

        // Check if state is not expired (10 minutes)
        if (Date.now() - memoryData.timestamp < 600000) {
          codeVerifier = memoryData.codeVerifier;
          sessionState = state; // Use the state from query as it matches
        } else {
          console.error("State expired in memory store");
          oauthSessionStore.delete(state);
          return res.redirect(
            `${process.env.FRONTEND_URL}/transfer?error=state_expired&platform=spotify`,
          );
        }
      } else {
        console.log("State not found in memory store");
      }
    }

    // Check for OAuth errors
    if (error) {
      console.error("Spotify OAuth error:", error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/transfer?error=login_cancelled&platform=spotify`,
      );
    }

    // Verify state parameter
    if (!state || state !== sessionState) {
      console.error("Spotify state mismatch:", {
        received: state,
        expected: sessionState,
        sessionState: sessionState ? "exists" : "missing",
        memoryStoreSize: oauthSessionStore.size,
      });
      return res.redirect(
        `${process.env.FRONTEND_URL}/transfer?error=security_check_failed&platform=spotify`,
      );
    }

    // Check if code is present
    if (!code) {
      console.error("Spotify callback missing authorization code");
      return res.redirect(
        `${process.env.FRONTEND_URL}/transfer?error=login_incomplete&platform=spotify`,
      );
    }

    console.log(
      "Spotify callback validation passed, proceeding with token exchange",
    );

    // Exchange code for tokens with PKCE (Pass credentials as options)
    const tokens = await spotifyService.exchangeCodeForTokens(code, {
      codeVerifier,
      ...credentials,
    });
    console.log("Spotify tokens received successfully");

    // Get user profile - this endpoint might not strictly require custom clientId/secret but good to pass if service uses it
    const userProfile = await spotifyService.getUserProfile(
      tokens.access_token,
    );
    console.log("Spotify user profile retrieved:", userProfile.display_name);

    // Store user data in memory store for cross-session access
    const userData = {
      spotifyTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + tokens.expires_in * 1000,
        scope: tokens.scope,
      },
      spotifyCredentials: credentials, // Save custom credentials for future refresh/api calls
      spotifyProfile: userProfile,
      timestamp: Date.now(),
    };

    // Store in memory store using the original session ID from memory store
    console.log("Memory store debug - before retrieval:", {
      state,
      storeSize: oauthSessionStore.size,
      allStates: Array.from(oauthSessionStore.keys()),
      currentSessionID: req.sessionID,
    });

    memoryData = oauthSessionStore.get(state);
    console.log("Memory store debug - retrieved data:", {
      memoryData,
      hasSessionId: memoryData?.sessionId,
      sessionId: memoryData?.sessionId,
    });

    if (memoryData && memoryData.sessionId) {
      userDataStore.set(memoryData.sessionId, userData);
      console.log(
        "User data stored in memory store for session:",
        memoryData.sessionId,
      );
      console.log("Memory store after storing user data:", {
        userDataStoreSize: userDataStore.size,
        userDataStoreKeys: Array.from(userDataStore.keys()),
      });
    } else {
      console.error(
        "No memory data found for state:",
        state,
        "Available states:",
        Array.from(oauthSessionStore.keys()),
      );
    }

    // Clear sensitive data from both session and memory store AFTER storing user data
    delete req.session.spotifyState;
    delete req.session.spotifyCodeVerifier;
    oauthSessionStore.delete(state);

    // Also try to save to current session as backup
    try {
      if (!req.session.user) {
        req.session.user = {};
      }

      // Merge Spotify data with existing session data (preserve YouTube data)
      req.session.user.spotifyTokens = userData.spotifyTokens;
      req.session.user.spotifyProfile = userData.spotifyProfile;
      req.session.user.spotifyCredentials = userData.spotifyCredentials;

      // Also try to get existing data from memory store and merge it
      if (req.sessionID) {
        const existingMemoryData = userDataStore.get(req.sessionID);
        if (existingMemoryData) {
          // Preserve YouTube data in session if it exists in memory
          if (existingMemoryData.youtubeTokens) {
            req.session.user.youtubeTokens = existingMemoryData.youtubeTokens;
          }
          if (existingMemoryData.youtubeProfile) {
            req.session.user.youtubeProfile = existingMemoryData.youtubeProfile;
          }
        }
      }

      // Save session
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          // Continue anyway since we have data in memory store
        }

        console.log("Session saved with merged data:", {
          hasSpotifyTokens: !!req.session.user.spotifyTokens,
          hasYouTubeTokens: !!req.session.user.youtubeTokens,
          hasSpotifyProfile: !!req.session.user.spotifyProfile,
          hasYouTubeProfile: !!req.session.user.youtubeProfile,
        });

        // Redirect back to transfer page with success
        res.redirect(
          `${process.env.FRONTEND_URL}/transfer?platform=spotify&status=success&user=${encodeURIComponent(userProfile.display_name || "")}`,
        );
      });
    } catch (sessionError) {
      console.error(
        "Session save failed, but continuing with memory store:",
        sessionError,
      );

      // Redirect anyway since we have data in memory store
      res.redirect(
        `${process.env.FRONTEND_URL}/transfer?platform=spotify&status=success&user=${encodeURIComponent(userProfile.display_name || "")}`,
      );
    }
  } catch (error) {
    console.error("Spotify callback error:", error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/transfer?error=login_failed&platform=spotify`,
    );
  }
};

/**
 * Initiate YouTube OAuth flow
 */
const initiateYouTubeAuth = async (req, res) => {
  try {
    const state = generateRandomString(16);
    const credentials = req.body.credentials || null;

    // Store state in session for security
    req.session.youtubeState = state;

    // Store credentials in memory store just like spotify
    oauthSessionStore.set(state, {
      timestamp: Date.now(),
      sessionId: req.sessionID,
      credentials,
    });

    const authUrl = youtubeService.getAuthUrl(state, credentials);

    sendSuccess(
      res,
      { authUrl, state },
      "Redirect user to YouTube authorization URL",
    );
  } catch (error) {
    sendError(
      res,
      "Unable to start YouTube Music login. Please try again.",
      500,
      null,
      "YOUTUBE_AUTH_INIT_FAILED",
    );
  }
};

/**
 * Handle YouTube OAuth callback
 */
const handleYouTubeCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/transfer?error=login_cancelled&platform=youtube`,
      );
    }

    // Verify state parameter
    if (!state || state !== req.session.youtubeState) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/transfer?error=security_check_failed&platform=youtube`,
      );
    }

    // Clear state from session
    delete req.session.youtubeState;

    // Retrieve memory data for custom credentials
    const memoryData = oauthSessionStore.get(state);
    const credentials = memoryData?.credentials || null;

    if (!code) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/transfer?error=login_incomplete&platform=youtube`,
      );
    }

    // Exchange code for tokens
    const tokens = await youtubeService.exchangeCodeForTokens(
      code,
      credentials,
    );

    // Get user profile
    const userProfile = await youtubeService.getUserProfile(
      tokens.access_token,
    );

    // Store user data in memory store for cross-session access
    const userData = {
      youtubeTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + tokens.expires_in * 1000,
      },
      youtubeCredentials: credentials, // Save custom credentials
      youtubeProfile: userProfile,
      timestamp: Date.now(),
    };

    // Use sessionId from memory data if available
    const targetSessionId = memoryData?.sessionId || req.sessionID;

    // Store in memory store using target session ID
    if (targetSessionId) {
      // Get existing user data or create new
      const existingUserData = userDataStore.get(targetSessionId) || {};
      const updatedUserData = { ...existingUserData, ...userData };
      userDataStore.set(req.sessionID, updatedUserData);
      console.log(
        "YouTube user data stored in memory store for session:",
        req.sessionID,
      );
    }

    // Also try to save to current session as backup
    try {
      if (!req.session.user) {
        req.session.user = {};
      }

      // Merge YouTube data with existing session data (preserve Spotify data)
      req.session.user.youtubeTokens = userData.youtubeTokens;
      req.session.user.youtubeProfile = userData.youtubeProfile;
      req.session.user.youtubeCredentials = userData.youtubeCredentials;

      // Also try to get existing data from memory store and merge it
      if (req.sessionID) {
        const existingMemoryData = userDataStore.get(req.sessionID);
        if (existingMemoryData) {
          // Preserve Spotify data in session if it exists in memory
          if (existingMemoryData.spotifyTokens) {
            req.session.user.spotifyTokens = existingMemoryData.spotifyTokens;
          }
          if (existingMemoryData.spotifyProfile) {
            req.session.user.spotifyProfile = existingMemoryData.spotifyProfile;
          }
        }
      }

      // Save session
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          // Continue anyway since we have data in memory store
        }

        console.log("Session saved with merged data:", {
          hasSpotifyTokens: !!req.session.user.spotifyTokens,
          hasYouTubeTokens: !!req.session.user.youtubeTokens,
          hasSpotifyProfile: !!req.session.user.spotifyProfile,
          hasYouTubeProfile: !!req.session.user.youtubeProfile,
        });

        // Redirect to frontend with success
        res.redirect(
          `${process.env.FRONTEND_URL}/transfer?platform=youtube&status=success&user=${encodeURIComponent(userProfile.display_name || "")}`,
        );
      });
    } catch (sessionError) {
      console.error(
        "Session save failed, but continuing with memory store:",
        sessionError,
      );

      // Redirect anyway since we have data in memory store
      res.redirect(
        `${process.env.FRONTEND_URL}/transfer?platform=youtube&status=success&user=${encodeURIComponent(userProfile.display_name || "")}`,
      );
    }
  } catch (error) {
    res.redirect(
      `${process.env.FRONTEND_URL}/transfer?error=login_failed&platform=youtube`,
    );
  }
};

/**
 * Logout user and clear session
 */
const logout = (req, res) => {
  try {
    // Clear user data from memory store
    if (req.sessionID && userDataStore.has(req.sessionID)) {
      userDataStore.delete(req.sessionID);
      console.log(
        "Cleared user data from memory store for session:",
        req.sessionID,
      );
    }

    req.session.destroy((err) => {
      if (err) {
        // Session destruction failed
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  } catch (error) {
    sendError(
      res,
      "Unable to log out. Please try again.",
      500,
      null,
      "LOGOUT_FAILED",
    );
  }
};

/**
 * Refresh Spotify access token
 */
const refreshSpotifyToken = async (req, res) => {
  try {
    if (!req.session.user?.spotifyTokens?.refresh_token) {
      return sendError(
        res,
        "No refresh token available",
        401,
        null,
        "NO_REFRESH_TOKEN",
      );
    }

    const { refresh_token } = req.session.user.spotifyTokens;
    const credentials = req.session.user.spotifyCredentials || null;
    const newTokens = await spotifyService.refreshTokens(
      refresh_token,
      credentials,
    );

    // Update session with new tokens
    req.session.user.spotifyTokens = {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_at: Date.now() + newTokens.expires_in * 1000,
      scope: newTokens.scope,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error during token refresh:", err);
        return sendError(
          res,
          "Failed to save session",
          500,
          null,
          "SESSION_SAVE_FAILED",
        );
      }

      sendSuccess(
        res,
        {
          access_token: newTokens.access_token,
          expires_in: newTokens.expires_in,
          scope: newTokens.scope,
        },
        "Token refreshed successfully",
      );
    });
  } catch (error) {
    console.error("Spotify token refresh error:", error);

    // Clear invalid tokens from session
    if (req.session.user?.spotifyTokens) {
      delete req.session.user.spotifyTokens;
      delete req.session.user.spotifyProfile;
    }

    sendError(
      res,
      "Token refresh failed. Please re-authenticate.",
      401,
      null,
      "TOKEN_REFRESH_FAILED",
    );
  }
};

/**
 * Get current authentication status with token validation
 */
const getAuthStatus = async (req, res) => {
  try {
    console.log("getAuthStatus called:", {
      hasSession: !!req.session,
      hasUser: !!(req.session && req.session.user),
      sessionKeys: req.session ? Object.keys(req.session) : "No session",
      userKeys: req.session?.user ? Object.keys(req.session.user) : "No user",
      sessionID: req.sessionID,
      memoryStoreSize: userDataStore.size,
      memoryStoreKeys: Array.from(userDataStore.keys()),
    });

    // Try to get user data from session first, then from memory store
    let userData = req.session?.user;
    let dataSource = "session";

    if (!userData && req.sessionID) {
      // Check memory store for user data
      userData = userDataStore.get(req.sessionID);
      if (userData) {
        dataSource = "memory_store";
        console.log(
          "Found user data in memory store for session:",
          req.sessionID,
        );
      }
    }

    if (!userData) {
      console.log(
        "No user data found in session or memory store, returning unauthenticated status",
      );
      return sendSuccess(
        res,
        {
          authenticated: false,
          platforms: {
            spotify: { connected: false, profile: null, needsRefresh: false },
            youtube: { connected: false, profile: null, needsRefresh: false },
          },
        },
        "Authentication status retrieved",
      );
    }

    console.log(`Using user data from ${dataSource}:`, {
      hasSpotifyTokens: !!userData.spotifyTokens,
      hasYouTubeTokens: !!userData.youtubeTokens,
      hasSpotifyProfile: !!userData.spotifyProfile,
      hasYouTubeProfile: !!userData.youtubeProfile,
    });

    const { spotifyTokens, youtubeTokens, spotifyProfile, youtubeProfile } =
      userData;

    console.log("Session data found:", {
      hasSpotifyTokens: !!spotifyTokens,
      hasYouTubeTokens: !!youtubeTokens,
      hasSpotifyProfile: !!spotifyProfile,
      hasYouTubeProfile: !!youtubeProfile,
      spotifyTokensKeys: spotifyTokens
        ? Object.keys(spotifyTokens)
        : "No tokens",
      spotifyProfileKeys: spotifyProfile
        ? Object.keys(spotifyProfile)
        : "No profile",
    });

    // Check if Spotify tokens are expired and try to refresh
    let spotifyStatus = {
      connected: false,
      profile: null,
      needsRefresh: false,
    };

    if (spotifyTokens && spotifyTokens.access_token) {
      const isExpired = Date.now() >= spotifyTokens.expires_at;
      const timeUntilExpiry = spotifyTokens.expires_at - Date.now();

      console.log("Spotify token check:", {
        hasAccessToken: !!spotifyTokens.access_token,
        hasRefreshToken: !!spotifyTokens.refresh_token,
        expiresAt: new Date(spotifyTokens.expires_at).toISOString(),
        currentTime: new Date().toISOString(),
        isExpired,
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + " seconds",
      });

      if (isExpired && spotifyTokens.refresh_token) {
        console.log("Spotify tokens expired, attempting refresh...");
        try {
          const credentials = req.session.user.spotifyCredentials || null;
          const newTokens = await spotifyService.refreshTokens(
            spotifyTokens.refresh_token,
            credentials,
          );
          console.log("Spotify token refresh successful");

          // Update session with new tokens
          const updatedTokens = {
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token,
            expires_at: Date.now() + newTokens.expires_in * 1000,
            scope: newTokens.scope,
          };

          req.session.user.spotifyTokens = updatedTokens;

          // Also update memory store if we're using it
          if (req.sessionID && userDataStore.has(req.sessionID)) {
            const memoryUserData = userDataStore.get(req.sessionID);
            memoryUserData.spotifyTokens = updatedTokens;
            memoryUserData.timestamp = Date.now();
            userDataStore.set(req.sessionID, memoryUserData);
            console.log("Updated Spotify tokens in memory store");
          }

          spotifyStatus = {
            connected: true,
            profile: spotifyProfile,
            needsRefresh: false,
          };
        } catch (refreshError) {
          console.error("Auto-refresh failed:", refreshError);
          spotifyStatus.needsRefresh = true;

          // Clear invalid tokens
          delete req.session.user.spotifyTokens;
          delete req.session.user.spotifyProfile;
        }
      } else if (!isExpired) {
        console.log("Spotify tokens still valid");
        spotifyStatus = {
          connected: true,
          profile: spotifyProfile,
          needsRefresh: false,
        };
      }
    } else {
      console.log("No Spotify tokens found in session");
    }

    const youtubeStatus = {
      connected: !!(youtubeTokens && youtubeTokens.access_token),
      profile: youtubeProfile || null,
      needsRefresh: false,
    };

    const status = {
      authenticated: spotifyStatus.connected || youtubeStatus.connected,
      platforms: {
        spotify: spotifyStatus,
        youtube: youtubeStatus,
      },
    };

    console.log("Final auth status:", {
      authenticated: status.authenticated,
      spotifyConnected: status.platforms.spotify.connected,
      youtubeConnected: status.platforms.youtube.connected,
      spotifyStatus: status.platforms.spotify,
      youtubeStatus: status.platforms.youtube,
    });

    // Save session if tokens were refreshed
    if (spotifyStatus.connected && !spotifyStatus.needsRefresh) {
      req.session.save();
    }

    sendSuccess(res, status, "Authentication status retrieved");
  } catch (error) {
    console.error("Auth status check error:", error);
    sendError(
      res,
      "Unable to check login status. Please try again.",
      500,
      null,
      "AUTH_STATUS_FAILED",
    );
  }
};

module.exports = {
  initiateSpotifyAuth,
  handleSpotifyCallback,
  initiateYouTubeAuth,
  handleYouTubeCallback,
  refreshSpotifyToken,
  logout,
  getAuthStatus,
};
