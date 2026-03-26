const spotifyService = require("../services/spotifyService");
const youtubeService = require("../services/youtubeService");
const { sendError } = require("../utils/api");
const axios = require("axios"); // Added axios for direct Spotify API call

/**
 * Playlist Controller for MoveMyPlaylist
 * Handles playlist operations for Spotify and YouTube Music
 */

/**
 * Get user's Spotify playlists
 */
const getSpotifyPlaylists = async (req, res) => {
  try {
    console.log("getSpotifyPlaylists called with:", {
      hasUser: !!req.user,
      userKeys: req.user ? Object.keys(req.user) : "No user",
      hasSpotifyTokens: req.user?.spotifyTokens ? "Yes" : "No",
      tokenKeys: req.user?.spotifyTokens
        ? Object.keys(req.user.spotifyTokens)
        : "No tokens",
    });

    const { limit = 50, offset = 0 } = req.query;
    const { spotifyTokens } = req.user;

    if (!spotifyTokens || !spotifyTokens.access_token) {
      console.error("No Spotify tokens found in request");
      return sendError(
        res,
        "Spotify authentication required",
        401,
        null,
        "SPOTIFY_AUTH_REQUIRED",
      );
    }

    console.log("Calling spotifyService.getUserPlaylists with token:", {
      hasToken: !!spotifyTokens.access_token,
      tokenLength: spotifyTokens.access_token?.length || 0,
    });

    const playlists = await spotifyService.getUserPlaylists(
      spotifyTokens.access_token,
      parseInt(limit),
      parseInt(offset),
    );

    console.log("Playlists received from service:", {
      hasPlaylists: !!playlists,
      playlistsType: typeof playlists,
      itemsCount: playlists?.items?.length || 0,
      total: playlists?.total || 0,
    });

    res.json({
      success: true,
      data: playlists,
      platform: "spotify",
    });
  } catch (error) {
    console.error("Error in getSpotifyPlaylists:", error);
    sendError(
      res,
      "Unable to get Spotify playlists. Please try again.",
      500,
      null,
      "SPOTIFY_PLAYLISTS_FAILED",
    );
  }
};

/**
 * Get user's YouTube Music playlists
 */
const getYouTubePlaylists = async (req, res) => {
  try {
    const { limit = 50, pageToken } = req.query;
    const { youtubeTokens } = req.user;

    const playlists = await youtubeService.getUserPlaylists(
      youtubeTokens.access_token,
      parseInt(limit),
      pageToken,
    );

    res.json({
      success: true,
      data: playlists,
      platform: "youtube",
    });
  } catch (error) {
    res.status(500).json({
      error: "Unable to get YouTube Music playlist. Please try again.",
      message: error.message,
      code: "YOUTUBE_PLAYLIST_FAILED",
    });
  }
};

/**
 * Get specific Spotify playlist
 */
const getSpotifyPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyTokens } = req.user;

    const playlist = await spotifyService.getPlaylist(
      spotifyTokens.access_token,
      id,
    );

    res.json({
      success: true,
      data: playlist,
      platform: "spotify",
    });
  } catch (error) {
    sendError(
      res,
      "Unable to get Spotify playlist. Please try again.",
      500,
      null,
      "SPOTIFY_PLAYLIST_FAILED",
    );
  }
};

/**
 * Get specific YouTube playlist
 */
const getYouTubePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { youtubeTokens } = req.user;

    const playlist = await youtubeService.getPlaylist(
      youtubeTokens.access_token,
      id,
    );

    res.json({
      success: true,
      data: playlist,
      platform: "youtube",
    });
  } catch (error) {
    if (error.message === "Playlist not found") {
      return res.status(404).json({
        error: "Playlist not found",
        message:
          "The requested playlist could not be found or has been deleted.",
        code: "YOUTUBE_PLAYLIST_NOT_FOUND",
      });
    }

    res.status(500).json({
      error: "Unable to get YouTube playlist. Please try again.",
      message: error.message,
      code: "YOUTUBE_PLAYLIST_FAILED",
    });
  }
};

/**
 * Get tracks from specific Spotify playlist
 */
const getSpotifyPlaylistTracks = async (req, res) => {
  try {
    const { id } = req.params;
    const { spotifyTokens } = req.user;

    const playlist = await spotifyService.getPlaylist(
      spotifyTokens.access_token,
      id,
    );

    res.json({
      success: true,
      data: {
        id: playlist.id,
        name: playlist.name,
        tracks: playlist.tracks,
        tracks_count: playlist.tracks_count,
      },
      platform: "spotify",
    });
  } catch (error) {
    if (error.message === "Playlist not found") {
      return res.status(404).json({
        error: "Playlist not found",
        message:
          "The requested playlist could not be found or has been deleted.",
        code: "SPOTIFY_PLAYLIST_NOT_FOUND",
      });
    }

    res.status(500).json({
      error: "Unable to get Spotify playlist songs. Please try again.",
      message: error.message,
      code: "SPOTIFY_PLAYLIST_TRACKS_FAILED",
    });
  }
};

/**
 * Get tracks from specific YouTube playlist
 */
const getYouTubePlaylistTracks = async (req, res) => {
  try {
    const { id } = req.params;
    const { youtubeTokens } = req.user;

    const playlist = await youtubeService.getPlaylist(
      youtubeTokens.access_token,
      id,
    );

    res.json({
      success: true,
      data: {
        id: playlist.id,
        name: playlist.name,
        tracks: playlist.tracks,
        tracks_count: playlist.tracks_count,
      },
      platform: "youtube",
    });
  } catch (error) {
    if (error.message === "Playlist not found") {
      return res.status(404).json({
        error: "Playlist not found",
        message:
          "The requested playlist could not be found or has been deleted.",
        code: "YOUTUBE_PLAYLIST_NOT_FOUND",
      });
    }

    res.status(500).json({
      error: "Unable to get YouTube Music playlist songs. Please try again.",
      message: error.message,
      code: "YOUTUBE_PLAYLIST_TRACKS_FAILED",
    });
  }
};

/**
 * Get user's Spotify profile (for debugging)
 */
const getSpotifyProfile = async (req, res) => {
  try {
    console.log("getSpotifyProfile called with:", {
      hasUser: !!req.user,
      userKeys: req.user ? Object.keys(req.user) : "No user",
      hasSpotifyTokens: req.user?.spotifyTokens ? "Yes" : "No",
    });

    const { spotifyTokens } = req.user;

    if (!spotifyTokens || !spotifyTokens.access_token) {
      return sendError(
        res,
        "Spotify authentication required",
        401,
        null,
        "SPOTIFY_AUTH_REQUIRED",
      );
    }

    // Make a direct call to Spotify API to get user profile
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${spotifyTokens.access_token}`,
      },
    });

    res.json({
      success: true,
      data: response.data,
      platform: "spotify",
    });
  } catch (error) {
    console.error("Error in getSpotifyProfile:", error);
    sendError(
      res,
      "Unable to get Spotify profile. Please try again.",
      500,
      null,
      "SPOTIFY_PROFILE_FAILED",
    );
  }
};

module.exports = {
  getSpotifyPlaylists,
  getYouTubePlaylists,
  getSpotifyPlaylist,
  getYouTubePlaylist,
  getSpotifyPlaylistTracks,
  getYouTubePlaylistTracks,
  getSpotifyProfile, // Added new endpoint to exports
};
