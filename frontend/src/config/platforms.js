import { SpotifyIcon, YouTubeMusicIcon } from "../assets/icons";

/**
 * Frontend Platform Configuration
 * Defines platform metadata and capabilities for the UI
 */

export const platformConfigs = {
  spotify: {
    id: "spotify",
    name: "Spotify",
    displayName: "Spotify",
    icon: SpotifyIcon,
    color: "primary",
    authEndpoint: "/auth/spotify",
    capabilities: ["playlists", "search", "create", "modify", "userProfile"],
    description:
      "Connect your Spotify account to access your playlists and music library.",
    features: [
      "Access to your Spotify playlists",
      "Search and discover music",
      "Create new playlists",
      "High-quality audio streaming",
    ],
  },
  youtube: {
    id: "youtube",
    name: "YouTube Music",
    displayName: "YouTube Music",
    icon: YouTubeMusicIcon,
    color: "primary",
    authEndpoint: "/auth/youtube",
    capabilities: ["playlists", "search", "create", "modify", "userProfile"],
    description:
      "Connect your YouTube Music account to access your playlists and music library.",
    features: [
      "Access to your YouTube Music playlists",
      "Search and discover music",
      "Create new playlists",
      "Ad-free music experience",
    ],
  },
  // New platforms can be added here
};

/**
 * Get platform configuration by ID
 * @param {string} platformId - Platform identifier
 * @returns {Object|null} Platform configuration or null if not found
 */
export const getPlatformConfig = (platformId) => {
  return platformConfigs[platformId] || null;
};

/**
 * Get all platform configurations
 * @returns {Array} Array of platform configurations
 */
export const getAllPlatformConfigs = () => {
  return Object.values(platformConfigs);
};

/**
 * Get platforms with specific capability
 * @param {string} capability - Required capability
 * @returns {Array} Array of platforms with the capability
 */
export const getPlatformsWithCapability = (capability) => {
  return Object.values(platformConfigs).filter((platform) =>
    platform.capabilities.includes(capability),
  );
};

/**
 * Check if platform supports specific capability
 * @param {string} platformId - Platform identifier
 * @param {string} capability - Required capability
 * @returns {boolean} Whether platform supports the capability
 */
export const platformSupports = (platformId, capability) => {
  const platform = platformConfigs[platformId];
  return platform ? platform.capabilities.includes(capability) : false;
};

/**
 * Get platform color class for Tailwind CSS
 * @param {string} platformId - Platform identifier
 * @returns {string} Tailwind color class
 */
export const getPlatformColorClass = (platformId) => {
  return "primary";
};

/**
 * Get platform icon component
 * @param {string} platformId - Platform identifier
 * @returns {React.Component|null} Icon component or null if not found
 */
export const getPlatformIcon = (platformId) => {
  const platform = platformConfigs[platformId];
  return platform ? platform.icon : null;
};

/**
 * Get platform display name
 * @param {string} platformId - Platform identifier
 * @returns {string} Display name
 */
export const getPlatformDisplayName = (platformId) => {
  const platform = platformConfigs[platformId];
  return platform ? platform.displayName : platformId;
};

export default platformConfigs;
