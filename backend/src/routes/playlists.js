const express = require("express");
const playlistController = require("../controllers/playlistController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route GET /api/playlists/spotify/profile
 * @desc Get user's Spotify profile (for debugging)
 * @access Private (requires Spotify auth)
 */
router.get(
  "/spotify/profile",
  requireAuth("spotify"),
  playlistController.getSpotifyProfile,
);

/**
 * @route GET /api/playlists/spotify
 * @desc Get user's Spotify playlists
 * @access Private (requires Spotify auth)
 */
router.get(
  "/spotify",
  requireAuth("spotify"),
  playlistController.getSpotifyPlaylists,
);

/**
 * @route GET /api/playlists/youtube
 * @desc Get user's YouTube Music playlists
 * @access Private (requires YouTube auth)
 */
router.get(
  "/youtube",
  requireAuth("youtube"),
  playlistController.getYouTubePlaylists,
);

/**
 * @route GET /api/playlists/spotify/:id
 * @desc Get specific Spotify playlist with tracks
 * @access Private (requires Spotify auth)
 */
router.get(
  "/spotify/:id",
  requireAuth("spotify"),
  playlistController.getSpotifyPlaylist,
);

/**
 * @route GET /api/playlists/youtube/:id
 * @desc Get specific YouTube playlist with tracks
 * @access Private (requires YouTube auth)
 */
router.get(
  "/youtube/:id",
  requireAuth("youtube"),
  playlistController.getYouTubePlaylist,
);

/**
 * @route GET /api/playlists/spotify/:id/tracks
 * @desc Get tracks from specific Spotify playlist
 * @access Private (requires Spotify auth)
 */
router.get(
  "/spotify/:id/tracks",
  requireAuth("spotify"),
  playlistController.getSpotifyPlaylistTracks,
);

/**
 * @route GET /api/playlists/youtube/:id/tracks
 * @desc Get tracks from specific YouTube playlist
 * @access Private (requires YouTube auth)
 */
router.get(
  "/youtube/:id/tracks",
  requireAuth("youtube"),
  playlistController.getYouTubePlaylistTracks,
);

module.exports = router;
