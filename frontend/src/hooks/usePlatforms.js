import { useState, useCallback } from "react";
import { getAllPlatformConfigs, getPlatformConfig } from "../config/platforms";

/**
 * Custom hook for managing platform state and operations
 */
const usePlatforms = () => {
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    source: null,
    destination: null,
  });

  const [connectionStatus, setConnectionStatus] = useState({});
  const [connectionErrors, setConnectionErrors] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * Get all available platforms
   */
  const getAvailablePlatforms = useCallback(() => {
    return getAllPlatformConfigs();
  }, []);

  /**
   * Get platform configuration by ID
   */
  const getPlatform = useCallback((platformId) => {
    return getPlatformConfig(platformId);
  }, []);

  /**
   * Select a platform as source or destination
   */
  const selectPlatform = useCallback(
    (platformId, type) => {
      console.log("selectPlatform called:", {
        platformId,
        type,
        currentSelection: selectedPlatforms,
      });

      setSelectedPlatforms((prev) => {
        const newSelection = { ...prev };
        console.log("Previous selection:", prev);

        // If selecting as source, clear destination if it's the same platform
        if (type === "source") {
          if (prev.destination === platformId) {
            console.log(
              "Clearing destination as same platform selected as source",
            );
            newSelection.destination = null;
          }
          newSelection.source = platformId;
        }

        // If selecting as destination, clear source if it's the same platform
        if (type === "destination") {
          if (prev.source === platformId) {
            console.log(
              "Clearing source as same platform selected as destination",
            );
            newSelection.source = null;
          }
          newSelection.destination = platformId;
        }

        console.log("New selection:", newSelection);
        return newSelection;
      });
    },
    [selectedPlatforms],
  );

  /**
   * Deselect a platform
   */
  const deselectPlatform = useCallback((platformId) => {
    setSelectedPlatforms((prev) => {
      const newSelection = { ...prev };

      if (prev.source === platformId) {
        newSelection.source = null;
      }
      if (prev.destination === platformId) {
        newSelection.destination = null;
      }

      return newSelection;
    });
  }, []);

  /**
   * Clear all platform selections
   */
  const clearSelections = useCallback(() => {
    setSelectedPlatforms({
      source: null,
      destination: null,
    });
  }, []);

  /**
   * Check if a platform is selected
   */
  const isPlatformSelected = useCallback(
    (platformId, type = null) => {
      if (type === "source") {
        return selectedPlatforms.source === platformId;
      }
      if (type === "destination") {
        return selectedPlatforms.destination === platformId;
      }
      return (
        selectedPlatforms.source === platformId ||
        selectedPlatforms.destination === platformId
      );
    },
    [selectedPlatforms],
  );

  /**
   * Get the type of selection for a platform
   */
  const getPlatformSelectionType = useCallback(
    (platformId) => {
      if (selectedPlatforms.source === platformId) {
        return "source";
      }
      if (selectedPlatforms.destination === platformId) {
        return "destination";
      }
      return null;
    },
    [selectedPlatforms],
  );

  /**
   * Check if both platforms are selected
   */
  const areBothPlatformsSelected = useCallback(() => {
    return selectedPlatforms.source && selectedPlatforms.destination;
  }, [selectedPlatforms]);

  /**
   * Check if transfer is ready
   */
  const isTransferReady = useCallback(() => {
    return (
      areBothPlatformsSelected() &&
      connectionStatus[selectedPlatforms.source]?.connected &&
      connectionStatus[selectedPlatforms.destination]?.connected
    );
  }, [selectedPlatforms, connectionStatus, areBothPlatformsSelected]);

  /**
   * Update connection status for a platform
   */
  const updateConnectionStatus = useCallback((platformId, status) => {
    setConnectionStatus((prev) => ({
      ...prev,
      [platformId]: status,
    }));
  }, []);

  /**
   * Update connection error for a platform
   */
  const updateConnectionError = useCallback((platformId, error) => {
    setConnectionErrors((prev) => ({
      ...prev,
      [platformId]: error,
    }));
  }, []);

  /**
   * Clear connection error for a platform
   */
  const clearConnectionError = useCallback((platformId) => {
    setConnectionErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[platformId];
      return newErrors;
    });
  }, []);

  /**
   * Clear all connection errors
   */
  const clearAllConnectionErrors = useCallback(() => {
    setConnectionErrors({});
  }, []);

  /**
   * Set connecting state
   */
  const setConnecting = useCallback((connecting) => {
    setIsConnecting(connecting);
  }, []);

  /**
   * Set retrying state
   */
  const setRetrying = useCallback((retrying) => {
    setIsRetrying(retrying);
  }, []);

  /**
   * Get source platform info
   */
  const getSourcePlatform = useCallback(() => {
    return selectedPlatforms.source
      ? getPlatformConfig(selectedPlatforms.source)
      : null;
  }, [selectedPlatforms.source]);

  /**
   * Get destination platform info
   */
  const getDestinationPlatform = useCallback(() => {
    return selectedPlatforms.destination
      ? getPlatformConfig(selectedPlatforms.destination)
      : null;
  }, [selectedPlatforms.destination]);

  /**
   * Get source platform connection status
   */
  const getSourceConnectionStatus = useCallback(() => {
    return connectionStatus[selectedPlatforms.source] || null;
  }, [selectedPlatforms.source, connectionStatus]);

  /**
   * Get destination platform connection status
   */
  const getDestinationConnectionStatus = useCallback(() => {
    return connectionStatus[selectedPlatforms.destination] || null;
  }, [selectedPlatforms.destination, connectionStatus]);

  return {
    // State
    selectedPlatforms,
    connectionStatus,
    connectionErrors,
    isConnecting,
    isRetrying,

    // Platform management
    getAvailablePlatforms,
    getPlatform,

    // Selection management
    selectPlatform,
    deselectPlatform,
    clearSelections,
    isPlatformSelected,
    getPlatformSelectionType,
    areBothPlatformsSelected,
    isTransferReady,

    // Connection management
    updateConnectionStatus,
    updateConnectionError,
    clearConnectionError,
    clearAllConnectionErrors,
    setConnecting,
    setRetrying,

    // Convenience getters
    getSourcePlatform,
    getDestinationPlatform,
    getSourceConnectionStatus,
    getDestinationConnectionStatus,
  };
};

export default usePlatforms;
