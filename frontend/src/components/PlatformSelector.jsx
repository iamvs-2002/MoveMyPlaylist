import React from "react";
import { getAllPlatformConfigs } from "../config/platforms";
import PlatformCard from "./PlatformCard";

/**
 * Generic Platform Selector Component
 * Displays all available platforms and handles platform selection
 */
const PlatformSelector = ({
  selectedPlatforms = {},
  onPlatformSelect,
  onPlatformConnect,
  onPlatformRetry,
  connectionStatus = {},
  connectionErrors = {},
  isConnecting = false,
  isRetrying = false,
}) => {
  const platforms = getAllPlatformConfigs();

  const handlePlatformSelect = (platformId) => {
    if (onPlatformSelect) {
      onPlatformSelect(platformId);
    }
  };

  const handlePlatformConnect = (platformId) => {
    if (onPlatformConnect) {
      onPlatformConnect(platformId);
    }
  };

  const handlePlatformRetry = (platformId) => {
    if (onPlatformRetry) {
      onPlatformRetry(platformId);
    }
  };

  const getSelectedType = (platformId) => {
    if (selectedPlatforms.source === platformId) {
      return { type: "source", platformId };
    }
    if (selectedPlatforms.destination === platformId) {
      return { type: "destination", platformId };
    }
    return null;
  };

  const isConnected = (platformId) => {
    return connectionStatus[platformId]?.connected || false;
  };

  const getUserProfile = (platformId) => {
    return connectionStatus[platformId]?.profile || null;
  };

  const getConnectionError = (platformId) => {
    return connectionErrors[platformId] || null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {platforms.map((platform) => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          isSelected={getSelectedType(platform.id)}
          isConnected={isConnected(platform.id)}
          connectionError={getConnectionError(platform.id)}
          userProfile={getUserProfile(platform.id)}
          onSelect={handlePlatformSelect}
          onConnect={handlePlatformConnect}
          onRetry={handlePlatformRetry}
          isConnecting={isConnecting}
          isRetrying={isRetrying}
        />
      ))}
    </div>
  );
};

export default PlatformSelector;
