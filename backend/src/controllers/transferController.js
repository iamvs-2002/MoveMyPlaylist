const { platformRegistry } = require("../platforms");
const transferService = require("../services/transferService");
const firestoreService = require("../services/firestoreService");
const { generateRandomString } = require("../utils/crypto");

/**
 * Transfer Controller for MoveMyPlaylist
 * Handles playlist transfers between any platforms registered in the platform registry
 */

/**
 * Transfer playlist from one platform to another
 */
const transferPlaylist = async (req, res) => {
  try {
    const { sourcePlatform, sourcePlaylistId, targetPlatform, playlistName } =
      req.validatedData;
    const { spotifyTokens, youtubeTokens } = req.user;

    // Validate platforms exist
    const sourcePlatformInstance = platformRegistry.getPlatform(sourcePlatform);
    const targetPlatformInstance = platformRegistry.getPlatform(targetPlatform);

    if (!sourcePlatformInstance) {
      return res.status(400).json({
        error: "Invalid source platform",
        message: `Platform '${sourcePlatform}' is not supported.`,
        code: "INVALID_SOURCE_PLATFORM",
      });
    }

    if (!targetPlatformInstance) {
      return res.status(400).json({
        error: "Invalid target platform",
        message: `Platform '${targetPlatform}' is not supported.`,
        code: "INVALID_TARGET_PLATFORM",
      });
    }

    // Generate transfer ID
    const transferId = generateRandomString(16);

    // Create transfer record in Firestore
    const transferData = {
      transferId,
      sessionId: req.sessionID || generateRandomString(16),
      platforms: {
        from: sourcePlatform,
        to: targetPlatform,
      },
      sourcePlaylist: {
        id: sourcePlaylistId,
        name: "", // Will be populated when we fetch the playlist
        trackCount: 0,
        platform: sourcePlatform,
      },
      targetPlaylist: {
        id: "",
        name: playlistName || "",
        url: "",
        platform: targetPlatform,
        created: false,
      },
      status: "starting",
      progress: 0,
      startedAt: new Date(),
      tracks: {
        total: 0,
        processed: 0,
        matched: 0,
        notFound: 0,
        failed: 0,
      },
      searchAlgorithm: "SMART",
      performance: {
        totalDuration: 0,
        averageTrackProcessingTime: 0,
        rateLimitDelays: 0,
        retryCount: 0,
      },
    };

    // Store in Firestore (optional - for statistics)
    try {
      await firestoreService.createTransfer(transferData);
    } catch (firebaseError) {
      console.warn(
        "Firebase not available, continuing without transfer tracking:",
        firebaseError.message,
      );
      // Continue without Firebase - transfer will still work
    }

    // Start transfer process asynchronously
    processTransfer(
      transferId,
      sourcePlatform,
      sourcePlaylistId,
      targetPlatform,
      playlistName,
      spotifyTokens,
      youtubeTokens,
      req.user.spotifyCredentials,
      req.user.youtubeCredentials,
    );

    res.json({
      success: true,
      transferId,
      message: "Transfer started successfully",
      status: "starting",
    });
  } catch (error) {
    console.error("Transfer start error:", error);
    res.status(500).json({
      error: "Unable to start transfer. Please try again.",
      message: error.message,
      code: "TRANSFER_START_FAILED",
    });
  }
};

/**
 * Process the actual transfer
 */
const processTransfer = async (
  transferId,
  sourcePlatform,
  sourcePlaylistId,
  targetPlatform,
  playlistName,
  spotifyTokens,
  youtubeTokens,
  spotifyCredentials = null,
  youtubeCredentials = null,
) => {
  try {
    // Determine which credentials to use for each platform
    const sourceCredentials =
      sourcePlatform === "spotify" ? spotifyCredentials : youtubeCredentials;
    const targetCredentials =
      targetPlatform === "spotify" ? spotifyCredentials : youtubeCredentials;

    // Get platform instances
    const sourcePlatformInstance = platformRegistry.getPlatform(sourcePlatform);
    const targetPlatformInstance = platformRegistry.getPlatform(targetPlatform);

    if (!sourcePlatformInstance || !targetPlatformInstance) {
      throw new Error("Platform not found");
    }

    // Get source playlist using platform-agnostic approach
    const sourcePlaylist = await sourcePlatformInstance.getPlaylist(
      getAccessToken(sourcePlatform, spotifyTokens, youtubeTokens),
      sourcePlaylistId,
      { credentials: sourceCredentials },
    );

    console.log(`🎵 Transfer: Source playlist retrieved:`, {
      id: sourcePlaylist.id,
      name: sourcePlaylist.name,
      trackCount: sourcePlaylist.tracks?.length || 0,
    });

    // Update source playlist info and track count (optional)
    try {
      await firestoreService.updateTransfer(transferId, {
        "sourcePlaylist.name": sourcePlaylist.name,
        "sourcePlaylist.trackCount": sourcePlaylist.tracks.length,
        "tracks.total": sourcePlaylist.tracks.length,
        progress: 20,
      });
    } catch (firebaseError) {
      console.warn(
        "Firebase not available, continuing without progress tracking:",
        firebaseError.message,
      );
    }

    // Use provided name or source playlist name
    const finalPlaylistName =
      playlistName ||
      `${sourcePlaylist.name} (Transferred from ${sourcePlatform})`;

    // NEW: Use quota-aware batch processing for efficiency
    const matchedTracks =
      await transferService.batchFindTrackMatchesWithQuotaAwareness(
        sourcePlaylist.tracks,
        targetPlatform,
        getAccessToken(targetPlatform, spotifyTokens, youtubeTokens),
        { credentials: targetCredentials },
      );

    // Count successful matches
    const successfulMatches = matchedTracks.filter((track) => track !== null);
    const failedMatches =
      sourcePlaylist.tracks.length - successfulMatches.length;

    console.log(`🎵 Transfer: Batch processing complete:`);
    console.log(`🎵 Transfer: - Total tracks: ${sourcePlaylist.tracks.length}`);
    console.log(`🎵 Transfer: - Matched tracks: ${successfulMatches.length}`);
    console.log(`🎵 Transfer: - Unmatched tracks: ${failedMatches}`);

    if (successfulMatches.length === 0) {
      console.log(
        `🎵 Transfer: ⚠️ No tracks were matched, so none will be added to the target playlist`,
      );
      // Update status to failed
      try {
        await firestoreService.updateTransfer(transferId, {
          status: "failed",
          error: {
            message: "No tracks could be matched on the target platform",
            code: "NO_TRACKS_MATCHED",
            occurredAt: new Date(),
          },
          completedAt: new Date(),
        });
      } catch (firestoreError) {
        console.error(
          "Failed to update transfer status in Firestore:",
          firestoreError,
        );
      }
      return;
    }

    // Create target playlist
    const targetPlaylist = await targetPlatformInstance.createPlaylist(
      getAccessToken(targetPlatform, spotifyTokens, youtubeTokens),
      finalPlaylistName,
      { credentials: targetCredentials },
    );

    console.log(
      `🎵 Transfer: Target playlist created: ${targetPlaylist.name} (ID: ${targetPlaylist.id})`,
    );

    // Add matched tracks to playlist
    const addResult = await targetPlatformInstance.addTracksToPlaylist(
      getAccessToken(targetPlatform, spotifyTokens, youtubeTokens),
      targetPlaylist.id,
      successfulMatches,
      { credentials: targetCredentials },
    );

    console.log(`🎵 Transfer: Tracks added to playlist:`, {
      playlistId: targetPlaylist.id,
      playlistName: targetPlaylist.name,
      tracksAdded: successfulMatches.length,
      addResult: addResult,
    });

    return {
      success: true,
      message: `Successfully transferred ${successfulMatches.length} tracks to ${targetPlatform}`,
      data: {
        sourcePlaylist: sourcePlaylist.name,
        targetPlaylist: targetPlaylist.name,
        targetPlaylistId: targetPlaylist.id,
        totalTracks: sourcePlaylist.tracks.length,
        matchedTracks: successfulMatches.length,
        unmatchedTracks: failedMatches,
        addResult: addResult,
      },
    };
  } catch (error) {
    // Transfer process failed
    console.error("Transfer process failed:", error);

    try {
      await firestoreService.updateTransfer(transferId, {
        status: "failed",
        error: {
          message: error.message,
          code: "TRANSFER_PROCESS_FAILED",
          occurredAt: new Date(),
        },
        completedAt: new Date(),
      });
    } catch (firestoreError) {
      console.error(
        "Failed to update transfer status in Firestore:",
        firestoreError,
      );
    }
  }
};

/**
 * Get transfer status and progress
 */
const getTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;

    let transfer = null;
    try {
      transfer = await firestoreService.getTransfer(id);
    } catch (firebaseError) {
      console.warn(
        "Firebase not available, cannot get transfer status:",
        firebaseError.message,
      );
      return res.status(404).json({
        error: "Transfer not found",
        message:
          "Transfer tracking is not available. Please check if the transfer was completed successfully.",
        code: "TRANSFER_NOT_FOUND",
      });
    }

    if (!transfer) {
      return res.status(404).json({
        error: "Transfer not found",
        message: "The requested transfer could not be found.",
        code: "TRANSFER_NOT_FOUND",
      });
    }

    // SECURITY FIX: Ensure the transfer belongs to the current session
    if (transfer.sessionId !== req.sessionID) {
      console.warn(
        `🚨 SECURITY: User ${req.sessionID} tried to access transfer ${id} owned by ${transfer.sessionId}`,
      );
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this transfer.",
        code: "TRANSFER_FORBIDDEN",
      });
    }

    res.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    console.error("Get transfer status error:", error);
    res.status(500).json({
      error: "Unable to get transfer status. Please try again.",
      message: error.message,
      code: "TRANSFER_STATUS_FAILED",
    });
  }
};

/**
 * Get user's transfer history
 */
const getTransferHistory = async (req, res) => {
  try {
    // Get and filter transfers by sessionId (secure)
    let transfers = [];
    try {
      transfers = await firestoreService.getTransfersBySessionId(
        req.sessionID,
        50,
      );
    } catch (firebaseError) {
      console.warn(
        "Firebase not available, cannot get transfer history:",
        firebaseError.message,
      );
      return res.json({
        success: true,
        data: {
          transfers: [],
          total: 0,
          message: "Transfer history not available",
        },
      });
    }

    res.json({
      success: true,
      data: {
        transfers: transfers,
        total: transfers.length,
      },
    });
  } catch (error) {
    console.error("Get transfer history error:", error);
    res.status(500).json({
      error: "Unable to get transfer history. Please try again.",
      message: error.message,
      code: "TRANSFER_HISTORY_FAILED",
    });
  }
};

/**
 * Cancel ongoing transfer
 */
const cancelTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    let transfer = null;
    try {
      transfer = await firestoreService.getTransfer(id);
    } catch (firebaseError) {
      console.warn(
        "Firebase not available, cannot get transfer for cancellation:",
        firebaseError.message,
      );
      return res.status(404).json({
        error: "Transfer not found",
        message: "Transfer tracking is not available.",
        code: "TRANSFER_NOT_FOUND",
      });
    }

    if (!transfer) {
      return res.status(404).json({
        error: "Transfer not found",
        message: "The requested transfer could not be found.",
        code: "TRANSFER_NOT_FOUND",
      });
    }

    // SECURITY FIX: Ensure the transfer belongs to the current session
    if (transfer.sessionId !== req.sessionID) {
      console.warn(
        `🚨 SECURITY: User ${req.sessionID} tried to cancel transfer ${id} owned by ${transfer.sessionId}`,
      );
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to cancel this transfer.",
        code: "TRANSFER_FORBIDDEN",
      });
    }

    if (transfer.status !== "starting" && transfer.status !== "processing") {
      return res.status(400).json({
        error: "Transfer cannot be cancelled",
        message: "Only starting or processing transfers can be cancelled.",
        code: "TRANSFER_CANNOT_CANCEL",
      });
    }

    // Update status to cancelled
    try {
      await firestoreService.updateTransfer(id, {
        status: "cancelled",
        completedAt: new Date(),
      });
    } catch (firebaseError) {
      console.warn(
        "Firebase not available, cannot update transfer status:",
        firebaseError.message,
      );
      return res.status(500).json({
        error: "Cannot cancel transfer",
        message: "Transfer tracking is not available.",
        code: "TRANSFER_CANCEL_FAILED",
      });
    }

    res.json({
      success: true,
      message: "Transfer cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel transfer error:", error);
    res.status(500).json({
      error: "Unable to cancel transfer. Please try again.",
      message: error.message,
      code: "TRANSFER_CANCEL_FAILED",
    });
  }
};

/**
 * Validate playlist before transfer (dry run)
 */
const validateTransfer = async (req, res) => {
  try {
    const { sourcePlatform, sourcePlaylistId, targetPlatform } =
      req.validatedData;
    const { spotifyTokens, youtubeTokens } = req.user;

    // Validate platforms exist
    const sourcePlatformInstance = platformRegistry.getPlatform(sourcePlatform);
    const targetPlatformInstance = platformRegistry.getPlatform(targetPlatform);

    if (!sourcePlatformInstance || !targetPlatformInstance) {
      return res.status(400).json({
        error: "Invalid platform",
        message: "One or both platforms are not supported.",
        code: "INVALID_PLATFORM",
      });
    }

    // Get source playlist using platform-agnostic approach
    const sourcePlaylist = await sourcePlatformInstance.getPlaylist(
      getAccessToken(sourcePlatform, spotifyTokens, youtubeTokens),
      sourcePlaylistId,
    );

    // Sample a few tracks to estimate match rate
    const sampleSize = Math.min(5, sourcePlaylist.tracks.length);
    const sampleTracks = sourcePlaylist.tracks.slice(0, sampleSize);

    let estimatedMatches = 0;
    for (const track of sampleTracks) {
      try {
        const matchedTrack = await transferService.findTrackMatch(
          track,
          targetPlatform,
          getAccessToken(targetPlatform, spotifyTokens, youtubeTokens),
          transferService.searchAlgorithms.SMART,
        );

        if (matchedTrack) {
          estimatedMatches++;
        }
      } catch (error) {
        // Track validation failed, continue with next track
        console.error(
          `Validation failed for track "${track.name}":`,
          error.message,
        );
      }
    }

    const estimatedMatchRate =
      sampleSize > 0 ? (estimatedMatches / sampleSize) * 100 : 0;

    res.json({
      success: true,
      data: {
        sourcePlaylist: {
          id: sourcePlaylist.id,
          name: sourcePlaylist.name,
          tracks_count: sourcePlaylist.tracks.length,
        },
        estimatedMatchRate: Math.round(estimatedMatchRate),
        estimatedMatches: Math.round(
          (estimatedMatchRate / 100) * sourcePlaylist.tracks.length,
        ),
        estimatedUnmatched:
          sourcePlaylist.tracks.length -
          Math.round((estimatedMatchRate / 100) * sourcePlaylist.tracks.length),
        validation: "success",
      },
    });
  } catch (error) {
    console.error("Validate transfer error:", error);
    res.status(500).json({
      error: "Unable to validate transfer. Please try again.",
      message: error.message,
      code: "TRANSFER_VALIDATION_FAILED",
    });
  }
};

/**
 * Get global transfer statistics
 */
const getTransferStats = async (req, res) => {
  try {
    const stats = await firestoreService.getGlobalStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get transfer stats error:", error);
    res.status(500).json({
      error: "Unable to get transfer statistics. Please try again.",
      message: error.message,
      code: "TRANSFER_STATS_FAILED",
    });
  }
};

/**
 * Get available platforms
 */
const getAvailablePlatforms = async (req, res) => {
  try {
    const platforms = platformRegistry.getAllPlatformInfo();

    res.json({
      success: true,
      data: {
        platforms: platforms,
        total: platforms.length,
      },
    });
  } catch (error) {
    console.error("Get available platforms error:", error);
    res.status(500).json({
      error: "Unable to get available platforms. Please try again.",
      message: error.message,
      code: "PLATFORMS_FETCH_FAILED",
    });
  }
};

/**
 * Helper function to get access token for a platform
 */
const getAccessToken = (platform, spotifyTokens, youtubeTokens) => {
  console.log(`🔑 TransferController: Getting access token for ${platform}`);
  console.log(`🔑 TransferController: Available tokens:`, {
    hasSpotifyTokens: !!spotifyTokens,
    hasYoutubeTokens: !!youtubeTokens,
    spotifyTokenLength: spotifyTokens?.access_token?.length || 0,
    youtubeTokenLength: youtubeTokens?.access_token?.length || 0,
  });

  let token = null;
  switch (platform) {
    case "spotify":
      token = spotifyTokens?.access_token;
      break;
    case "youtube":
      token = youtubeTokens?.access_token;
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  if (token) {
    console.log(
      `🔑 TransferController: ✅ Got token for ${platform}, length: ${token.length}`,
    );
  } else {
    console.error(`🔑 TransferController: ❌ No token found for ${platform}`);
  }

  return token;
};

/**
 * Helper function to get playlist URL for a platform
 */
const getPlaylistUrl = (platform, playlist) => {
  switch (platform) {
    case "spotify":
      return playlist.uri || `https://open.spotify.com/playlist/${playlist.id}`;
    case "youtube":
      return (
        playlist.uri || `https://www.youtube.com/playlist?list=${playlist.id}`
      );
    default:
      return playlist.uri || "";
  }
};

module.exports = {
  transferPlaylist,
  getTransferStatus,
  getTransferHistory,
  cancelTransfer,
  validateTransfer,
  getTransferStats,
  getAvailablePlatforms,
};
