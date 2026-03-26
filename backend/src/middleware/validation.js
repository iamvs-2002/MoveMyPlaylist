/**
 * Validation middleware for MoveMyPlaylist
 * Validates request data before processing
 */

/**
 * Validate authentication request
 */
const validateAuthRequest = (req, res, next) => {
  try {
    const { platform } = req.body;

    if (!platform || !["spotify", "youtube"].includes(platform)) {
      return res.status(400).json({
        error: "Invalid music service",
        message: "Please select either Spotify or YouTube Music",
        code: "INVALID_PLATFORM",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: "Something went wrong",
      message: "Please try again",
      code: "VALIDATION_FAILED",
    });
  }
};

/**
 * Validate transfer request
 */
const validateTransferRequest = (req, res, next) => {
  try {
    const { sourcePlatform, sourcePlaylistId, targetPlatform, playlistName } =
      req.body;

    // Check required fields
    if (!sourcePlatform || !sourcePlaylistId || !targetPlatform) {
      return res.status(400).json({
        error: "Missing information",
        message:
          "Please provide the source music service, playlist, and destination music service",
        code: "MISSING_FIELDS",
      });
    }

    // Validate platforms
    if (!["spotify", "youtube"].includes(sourcePlatform)) {
      return res.status(400).json({
        error: "Invalid source music service",
        message: "Please select either Spotify or YouTube Music as your source",
        code: "INVALID_SOURCE_PLATFORM",
      });
    }

    if (!["spotify", "youtube"].includes(targetPlatform)) {
      return res.status(400).json({
        error: "Invalid destination music service",
        message:
          "Please select either Spotify or YouTube Music as your destination",
        code: "INVALID_TARGET_PLATFORM",
      });
    }

    // Check that source and target are different
    if (sourcePlatform === targetPlatform) {
      return res.status(400).json({
        error: "Cannot transfer to same service",
        message:
          "Please select different music services for source and destination",
        code: "SAME_PLATFORM",
      });
    }

    // Validate playlist ID format
    if (
      typeof sourcePlaylistId !== "string" ||
      sourcePlaylistId.trim().length === 0
    ) {
      return res.status(400).json({
        error: "Invalid playlist",
        message: "Please provide a valid playlist to transfer",
        code: "INVALID_PLAYLIST_ID",
      });
    }

    // Validate playlist name if provided
    if (
      playlistName &&
      (typeof playlistName !== "string" || playlistName.trim().length === 0)
    ) {
      return res.status(400).json({
        error: "Invalid playlist name",
        message: "Please provide a valid name for your new playlist",
        code: "INVALID_PLAYLIST_NAME",
      });
    }

    // Add validated data to request
    req.validatedData = {
      sourcePlatform: sourcePlatform.trim(),
      sourcePlaylistId: sourcePlaylistId.trim(),
      targetPlatform: targetPlatform.trim(),
      playlistName: playlistName ? playlistName.trim() : null,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      error: "Something went wrong",
      message: "Please try again",
      code: "VALIDATION_FAILED",
    });
  }
};

/**
 * Validate playlist ID parameter
 */
const validatePlaylistId = (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid playlist",
        message: "Please provide a valid playlist",
        code: "INVALID_PLAYLIST_ID",
      });
    }

    req.validatedPlaylistId = id.trim();
    next();
  } catch (error) {
    return res.status(500).json({
      error: "Something went wrong",
      message: "Please try again",
      code: "VALIDATION_FAILED",
    });
  }
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  try {
    const { limit = "20", offset = "0" } = req.query;

    // Validate limit
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: "Invalid page size",
        message: "Page size must be between 1 and 100",
        code: "INVALID_LIMIT",
      });
    }

    // Validate offset
    const offsetNum = parseInt(offset, 10);
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        error: "Invalid page number",
        message: "Page number must be 0 or greater",
        code: "INVALID_OFFSET",
      });
    }

    req.validatedPagination = {
      limit: limitNum,
      offset: offsetNum,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      error: "Something went wrong",
      message: "Please try again",
      code: "VALIDATION_FAILED",
    });
  }
};

module.exports = {
  validateAuthRequest,
  validateTransferRequest,
  validatePlaylistId,
  validatePagination,
};
