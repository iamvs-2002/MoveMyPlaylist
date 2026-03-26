/**
 * Platform Interface
 * Defines the contract that all platform services must implement
 */

/**
 * @typedef {Object} Track
 * @property {string} id - Unique track identifier
 * @property {string} name - Track name
 * @property {Array<Artist>} artists - Array of artists
 * @property {Album} [album] - Album information
 * @property {number} [duration] - Track duration in milliseconds
 * @property {Object} externalIds - External identifiers (e.g., ISRC, UPC)
 * @property {string} platform - Source platform identifier
 * @property {Object} [metadata] - Additional platform-specific metadata
 */

/**
 * @typedef {Object} Artist
 * @property {string} id - Unique artist identifier
 * @property {string} name - Artist name
 * @property {Object} [metadata] - Additional platform-specific metadata
 */

/**
 * @typedef {Object} Album
 * @property {string} id - Unique album identifier
 * @property {string} name - Album name
 * @property {Array<Object>} [images] - Album artwork images
 * @property {string} [releaseDate] - Album release date
 * @property {number} [totalTracks] - Total number of tracks
 * @property {Object} [metadata] - Additional platform-specific metadata
 */

/**
 * @typedef {Object} Playlist
 * @property {string} id - Unique playlist identifier
 * @property {string} name - Playlist name
 * @property {string} [description] - Playlist description
 * @property {Array<Track>} tracks - Array of tracks
 * @property {string} owner - Playlist owner
 * @property {string} platform - Source platform identifier
 * @property {Object} [metadata] - Additional platform-specific metadata
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - Unique user identifier
 * @property {string} displayName - User's display name
 * @property {string} [email] - User's email address
 * @property {string} [country] - User's country
 * @property {Array<Object>} [images] - User profile images
 * @property {Object} [metadata] - Additional platform-specific metadata
 */

/**
 * @typedef {Object} AuthResult
 * @property {string} accessToken - Access token for API calls
 * @property {string} [refreshToken] - Refresh token for token renewal
 * @property {number} [expiresIn] - Token expiration time in seconds
 * @property {string} [tokenType] - Type of token (usually 'Bearer')
 * @property {string} [scope] - Granted permissions scope
 */

/**
 * @typedef {Object} PlaylistData
 * @property {string} name - Playlist name
 * @property {string} [description] - Playlist description
 * @property {boolean} [isPublic] - Whether playlist is public
 * @property {Object} [metadata] - Additional platform-specific metadata
 */

/**
 * @typedef {Object} Result
 * @property {boolean} success - Whether operation was successful
 * @property {string} [message] - Result message
 * @property {Object} [data] - Result data
 * @property {string} [error] - Error message if operation failed
 */

/**
 * @typedef {Object} PlatformCapabilities
 * @property {boolean} playlists - Can access user playlists
 * @property {boolean} search - Can search for tracks
 * @property {boolean} create - Can create playlists
 * @property {boolean} modify - Can modify existing playlists
 * @property {boolean} delete - Can delete playlists
 * @property {boolean} userProfile - Can access user profile
 */

/**
 * Platform Interface
 * All platform implementations must implement these methods
 */
class PlatformInterface {
  /**
   * Get platform information
   * @returns {Object} Platform metadata
   */
  getInfo() {
    throw new Error("getInfo() must be implemented");
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} state - Random state parameter for security
   * @param {Object} [options] - Additional options
   * @returns {string} Authorization URL
   */
  getAuthUrl(state, options = {}) {
    throw new Error("getAuthUrl() must be implemented");
  }

  /**
   * Exchange authorization code for access tokens
   * @param {string} code - Authorization code from callback
   * @param {Object} [options] - Additional options
   * @returns {Promise<AuthResult>} Token response
   */
  async exchangeCodeForTokens(code, options = {}) {
    throw new Error("exchangeCodeForTokens() must be implemented");
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<AuthResult>} New token response
   */
  async refreshTokens(refreshToken) {
    throw new Error("refreshTokens() must be implemented");
  }

  /**
   * Get user profile information
   * @param {string} accessToken - Valid access token
   * @returns {Promise<UserProfile>} User profile data
   */
  async getUserProfile(accessToken) {
    throw new Error("getUserProfile() must be implemented");
  }

  /**
   * Get user's playlists
   * @param {string} accessToken - Valid access token
   * @param {Object} [options] - Query options (limit, offset, etc.)
   * @returns {Promise<Array<Playlist>>} User's playlists
   */
  async getUserPlaylists(accessToken, options = {}) {
    throw new Error("getUserPlaylists() must be implemented");
  }

  /**
   * Get specific playlist with tracks
   * @param {string} accessToken - Valid access token
   * @param {string} playlistId - Playlist identifier
   * @returns {Promise<Playlist>} Playlist data
   */
  async getPlaylist(accessToken, playlistId) {
    throw new Error("getPlaylist() must be implemented");
  }

  /**
   * Search for tracks by query
   * @param {string} accessToken - Valid access token
   * @param {string} query - Search query
   * @param {Object} [options] - Search options (limit, type, etc.)
   * @returns {Promise<Array<Track>>} Search results
   */
  async searchTracks(accessToken, query, options = {}) {
    throw new Error("searchTracks() must be implemented");
  }

  /**
   * Create a new playlist
   * @param {string} accessToken - Valid access token
   * @param {PlaylistData} playlistData - Playlist creation data
   * @returns {Promise<Playlist>} Created playlist
   */
  async createPlaylist(accessToken, playlistData) {
    throw new Error("createPlaylist() must be implemented");
  }

  /**
   * Add tracks to playlist
   * @param {string} accessToken - Valid access token
   * @param {string} playlistId - Playlist identifier
   * @param {Array<Track>} tracks - Tracks to add
   * @returns {Promise<Result>} Operation result
   */
  async addTracksToPlaylist(accessToken, playlistId, tracks) {
    throw new Error("addTracksToPlaylist() must be implemented");
  }

  /**
   * Validate platform configuration
   * @returns {boolean} Whether configuration is valid
   */
  validateConfig() {
    throw new Error("validateConfig() must be implemented");
  }

  /**
   * Get platform-specific error handler
   * @returns {Function} Error handler function
   */
  getErrorHandler() {
    throw new Error("getErrorHandler() must be implemented");
  }
}

module.exports = PlatformInterface;
