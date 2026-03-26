import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "../utils/enhancedApi";
import { useAuth } from "../hooks/useAuth";
import useNetworkStatus from "../hooks/useNetworkStatus";
import usePlatforms from "../hooks/usePlatforms";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  WifiOff,
  X,
  RefreshCw,
  ListMusic,
  Play,
  Info,
} from "lucide-react";
import { MusicNoteIcon, SpotifyIcon, YouTubeMusicIcon } from "../assets/icons";
import NetworkStatusIndicator from "../components/NetworkStatusIndicator";
import PlatformSelector from "../components/PlatformSelector";
import PlaylistSelector from "../components/PlaylistSelector";
import TransferConfirmationModal from "../components/TransferConfirmationModal";
import APIKeyModal from "../components/APIKeyModal";
import TransferProgress from "../components/TransferProgress";
import { showErrorToast } from "../utils/errorHandler.jsx";

const TransferPage = () => {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  // Use the new platform hook
  const {
    selectedPlatforms,
    connectionStatus,
    connectionErrors,
    isConnecting,
    isRetrying,
    selectPlatform,
    updateConnectionStatus,
    updateConnectionError,
    clearConnectionError,
    setConnecting,
    setRetrying,
    isTransferReady,
  } = usePlatforms();

  // Transfer state
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [intendedType, setIntendedType] = useState(null);
  const [activeModalPlatform, setActiveModalPlatform] = useState(null);

  // Use React Query to fetch auth status with caching
  const {
    data: authStatusData,
    isLoading: authLoading,
    refetch: refetchAuthStatus,
    error: authError,
  } = useQuery({
    queryKey: ["authStatus"],
    queryFn: async () => {
      try {
        const response = await get("/auth/status");
        console.log("Auth status API response:", response);

        // Ensure we always return a valid object
        if (response && typeof response === "object") {
          console.log("Returning response directly");
          return response;
        } else if (response?.data && typeof response.data === "object") {
          console.log("Returning response.data");
          return response.data;
        } else {
          console.warn("Unexpected response format:", response);
          return { authenticated: false, platforms: {} };
        }
      } catch (error) {
        console.error("Error fetching auth status:", error);
        return { authenticated: false, platforms: {} };
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Update connection status when auth status changes
  useEffect(() => {
    if (authStatusData?.platforms) {
      const { platforms } = authStatusData;

      // Update connection status for each platform
      Object.keys(platforms).forEach((platformId) => {
        const platformData = platforms[platformId];
        updateConnectionStatus(platformId, {
          connected: platformData?.connected || false,
          profile: platformData?.profile || null,
        });

        // Clear any connection errors if platform is now connected
        if (platformData?.connected) {
          clearConnectionError(platformId);
        }
      });
    }
  }, [authStatusData, updateConnectionStatus, clearConnectionError]);

  // Check for OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get("platform");
    const status = urlParams.get("status");
    const error = urlParams.get("error");
    const user = urlParams.get("user");

    if (platform && status === "success") {
      console.log("OAuth success callback:", { platform, status, user });

      // Successfully connected to platform
      const storedIntendedType = sessionStorage.getItem(
        "intendedSelectionType",
      );
      const storedPlatform = sessionStorage.getItem("intendedPlatformId");

      if (storedIntendedType && storedPlatform === platform) {
        console.log("Applying intended selection from session:", {
          platform,
          storedIntendedType,
        });
        selectPlatform(platform, storedIntendedType);
        sessionStorage.removeItem("intendedSelectionType");
        sessionStorage.removeItem("intendedPlatformId");

        if (window.showToast?.success) {
          const platformName =
            platform === "spotify" ? "Spotify" : "YouTube Music";
          const typeLabel =
            storedIntendedType === "source" ? "source" : "destination";
          window.showToast.success(
            "Connected & Selected",
            `Successfully connected and selected ${platformName} as ${typeLabel}.`,
            { duration: 4500 },
          );
        }
      } else if (window.showToast?.success) {
        const platformName =
          platform === "spotify" ? "Spotify" : "YouTube Music";
        window.showToast.success(
          "Connected Successfully",
          `Successfully connected to ${platformName}${user ? ` as ${user}` : ""}`,
          { duration: 3000 },
        );
      }

      // Refresh authentication status to get updated data
      setTimeout(() => {
        console.log("Refreshing auth status after callback...");
        queryClient.invalidateQueries({ queryKey: ["authStatus"] });
        refetchAuthStatus();
      }, 1000);

      // Clear URL parameters
      window.history.replaceState({}, document.title, "/transfer");
    } else if (platform && error) {
      // Handle error
      let errorMessage = "Connection failed";
      let errorDetails = null;

      switch (error) {
        case "login_cancelled":
          errorMessage = "Login was cancelled";
          break;
        case "security_check_failed":
          errorMessage = "Security check failed";
          break;
        case "login_incomplete":
          errorMessage = "Login was incomplete";
          break;
        case "login_failed":
          errorMessage = "Login failed";
          break;
        case "state_expired":
          errorMessage = "Login session expired";
          break;
        case "access_denied":
          if (platform === "youtube") {
            errorMessage = "YouTube Access Denied";
            errorDetails =
              "This app is in testing mode and needs to be added as a test user. Please contact the developer to be added to the test users list.";
          } else {
            errorMessage = "Access denied";
          }
          break;
        default:
          errorMessage = "Connection failed";
      }

      // Update connection error for the platform
      const fullErrorMessage = errorDetails
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;
      updateConnectionError(platform, fullErrorMessage);

      // Show error message
      if (window.showToast) {
        window.showToast.error(
          "Connection Failed",
          `Failed to connect to ${platform === "spotify" ? "Spotify" : "YouTube Music"}: ${errorMessage}`,
          { duration: 8000 },
        );
      }

      // Clear URL parameters
      window.history.replaceState({}, document.title, "/transfer");
    }
  }, [updateConnectionError]);

  const handlePlatformSelect = useCallback(
    async (platformId) => {
      console.log("Platform selection requested:", {
        platformId,
        currentSelection: selectedPlatforms,
      });

      // Check if platform is already connected
      const isConnected = connectionStatus[platformId]?.connected;
      console.log("Platform connection status:", { platformId, isConnected });

      if (!isConnected) {
        // Determine what this would have been if connected
        const type = !selectedPlatforms.source ? "source" : "destination";
        setIntendedType(type);

        // Platform is not connected, open BYOK Key Modal
        console.log(
          "Platform not connected, opening BYOK modal to set as:",
          type,
        );
        setActiveModalPlatform(platformId);
        return;
      }

      // Platform is connected, proceed with selection logic
      if (!selectedPlatforms.source) {
        // No source selected, select this as source
        console.log("Selecting as source platform");
        selectPlatform(platformId, "source");
      } else if (selectedPlatforms.source === platformId) {
        // This platform is already selected as source, deselect it
        console.log("Deselecting source platform");
        selectPlatform(null, "source");
      } else if (!selectedPlatforms.destination) {
        // Source is selected, this is different, select as destination
        console.log("Selecting as destination platform");
        selectPlatform(platformId, "destination");
      } else if (selectedPlatforms.destination === platformId) {
        // This platform is already selected as destination, deselect it
        console.log("Deselecting destination platform");
        selectPlatform(null, "destination");
      } else {
        // Both source and destination are selected, and this is a different platform
        // Ask user what they want to do or replace destination
        console.log("Both platforms selected, showing info message");
        if (window.showToast?.info) {
          window.showToast.info(
            "Platform Selection",
            "Both source and destination are already selected. Click on an existing selection to change it.",
            { duration: 3000 },
          );
        }
      }
    },
    [selectedPlatforms, connectionStatus, selectPlatform],
  );

  const handlePlatformConnect = useCallback(
    async (platformId, credentials = null) => {
      setActiveModalPlatform(null); // Close modal
      setConnecting(true);
      clearConnectionError(platformId);

      try {
        // Call the actual backend OAuth endpoint with credentials
        const response = await post(`/auth/${platformId}`, {
          platform: platformId,
          credentials,
        });

        if (response?.authUrl) {
          // Store intended selection type so we can auto-apply it after returning
          if (intendedType) {
            sessionStorage.setItem("intendedSelectionType", intendedType);
            sessionStorage.setItem("intendedPlatformId", platformId);
          }

          // Redirect directly to OAuth URL instead of opening popup
          window.location.href = response.authUrl;
        } else {
          throw new Error(
            "Unable to start the login process. Please try again.",
          );
        }
      } catch (error) {
        let errorMessage = "Unable to connect to the music service";

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        updateConnectionError(platformId, errorMessage);

        if (window.showToast?.error) {
          window.showToast.error("Connection Failed", errorMessage, {
            duration: 5000,
          });
        }
      } finally {
        setConnecting(false);
      }
    },
    [clearConnectionError, setConnecting, updateConnectionError],
  );

  const handlePlatformRetry = async (platformId) => {
    // Also trigger modal on retry since we need custom keys again
    setActiveModalPlatform(platformId);
  };

  // Transfer handlers
  const handlePlaylistSelect = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowPlaylistSelector(false);
  };

  const handleStartTransfer = () => {
    if (!selectedPlaylist) {
      setShowPlaylistSelector(true);
    } else {
      setShowConfirmationModal(true);
    }
  };

  const handleTransferConfirm = async (transferData) => {
    setIsTransferring(true);
    setShowConfirmationModal(false);

    try {
      const response = await post("/api/transfer", transferData);

      if (response.transferId) {
        setCurrentTransfer({
          transferId: response.transferId,
          status: "starting",
          ...transferData,
        });

        if (window.showToast?.success) {
          window.showToast.success(
            "Transfer Started",
            "Your playlist transfer has begun. You can monitor progress below.",
            { duration: 5000 },
          );
        }
      } else {
        throw new Error("No transfer ID received");
      }
    } catch (error) {
      console.error("Transfer start failed:", error);

      if (window.showToast?.error) {
        window.showToast.error(
          "Transfer Failed",
          error.message || "Failed to start transfer. Please try again.",
          { duration: 8000 },
        );
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferComplete = (transfer) => {
    setCurrentTransfer(transfer);

    if (transfer.status === "completed") {
      if (window.showToast?.success) {
        window.showToast.success(
          "Transfer Complete!",
          `Successfully transferred ${transfer.tracks?.matched || 0} tracks to ${transfer.targetPlaylist?.name || "new playlist"}`,
          { duration: 8000 },
        );
      }
    } else if (transfer.status === "failed") {
      if (window.showToast?.error) {
        window.showToast.error(
          "Transfer Failed",
          transfer.error?.message ||
            "Transfer failed. Please check the details below.",
          { duration: 8000 },
        );
      }
    }
  };

  const handleTransferError = (transfer) => {
    setCurrentTransfer(transfer);

    if (window.showToast?.error) {
      window.showToast.error(
        "Transfer Error",
        transfer.error?.message || "An error occurred during transfer.",
        { duration: 8000 },
      );
    }
  };

  const handleNewTransfer = () => {
    setCurrentTransfer(null);
    // Keep the selected playlist so the selector remains visible
    // setSelectedPlaylist(null)
    // Don't hide the playlist selector - let users keep their selection
    // setShowPlaylistSelector(false)
    setShowConfirmationModal(false);
  };

  return (
    <div className="min-h-screen bg-background text-white relative flex flex-col items-center">
      {/* Subtle Background Mesh */}
      <div className="absolute inset-0 bg-mesh-dark opacity-30 pointer-events-none z-0"></div>

      <div className="container-app py-10 sm:py-16 relative z-10 w-full mt-4 flex-grow flex flex-col">
        {/* Network Status Indicator */}
        <div className="flex justify-end mb-6">
          <NetworkStatusIndicator />
        </div>

        {/* Clean Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-tight">
            Transfer Your Playlists
          </h1>
          <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
            Transfer your music library securely using your own API credentials.
            Connect your accounts and start moving playlists in minutes.
          </p>
        </div>

        {/* Show Transfer Progress if transfer is active */}
        {currentTransfer ? (
          <div className="w-full">
            <TransferProgress
              transferId={currentTransfer.transferId}
              onTransferComplete={handleTransferComplete}
              onTransferError={handleTransferError}
              onCancelTransfer={() => setCurrentTransfer(null)}
              onNewTransfer={handleNewTransfer}
            />
          </div>
        ) : (
          <>
            {/* Simple Transfer Flow */}
            <div className="w-full mb-12 sm:mb-16">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-6 sm:space-y-0 sm:space-x-8 mb-8 sm:mb-12">
                {/* Source Platform */}
                <div className="text-center flex flex-col items-center">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 ${
                      selectedPlatforms.source
                        ? "bg-[#0A0A0A] shadow-glass border border-white/20"
                        : "bg-black/20 border border-dashed border-white/20"
                    } ${
                      selectedPlatforms.source === "spotify"
                        ? "border-[#1DB954] shadow-[0_0_15px_rgba(30,185,84,0.3)]"
                        : selectedPlatforms.source === "youtube"
                          ? "border-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                          : ""
                    }`}
                  >
                    {selectedPlatforms.source ? (
                      selectedPlatforms.source === "spotify" ? (
                        <SpotifyIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[#1ed760]" />
                      ) : (
                        <YouTubeMusicIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[#ff0000]" />
                      )
                    ) : (
                      <MusicNoteIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white/20" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white/50 text-center">
                    {selectedPlatforms.source ? (
                      <>
                        <span className="block font-semibold text-white">
                          Source Selected
                        </span>
                        <span className="text-xs text-primary mt-0.5 inline-block">
                          {selectedPlatforms.source === "spotify"
                            ? "Spotify"
                            : "YouTube Music"}
                        </span>
                      </>
                    ) : (
                      "Source"
                    )}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-full pointer-events-none"></div>
                  </div>
                  <p className="text-xs text-white/50 mt-2 font-medium">
                    Transfer
                  </p>
                </div>

                {/* Destination Platform */}
                <div className="text-center flex flex-col items-center">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 ${
                      selectedPlatforms.destination
                        ? "bg-[#0A0A0A] shadow-glass border border-white/20"
                        : "bg-black/20 border border-dashed border-white/20"
                    } ${
                      selectedPlatforms.destination === "spotify"
                        ? "border-[#1DB954] shadow-[0_0_15px_rgba(30,185,84,0.3)]"
                        : selectedPlatforms.destination === "youtube"
                          ? "border-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                          : ""
                    }`}
                  >
                    {selectedPlatforms.destination ? (
                      selectedPlatforms.destination === "spotify" ? (
                        <SpotifyIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[#1ed760]" />
                      ) : (
                        <YouTubeMusicIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[#ff0000]" />
                      )
                    ) : (
                      <MusicNoteIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white/20" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white/50 text-center">
                    {selectedPlatforms.destination ? (
                      <>
                        <span className="block font-semibold text-white">
                          Destination Selected
                        </span>
                        <span className="text-xs text-secondary mt-0.5 inline-block">
                          {selectedPlatforms.destination === "spotify"
                            ? "Spotify"
                            : "YouTube Music"}
                        </span>
                      </>
                    ) : (
                      "Destination"
                    )}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center mb-6 sm:mb-8 flex justify-center">
                {!selectedPlatforms.source ? (
                  <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide">
                    <span className="bg-primary/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Choose your source platform</span>
                  </div>
                ) : !selectedPlatforms.destination ? (
                  <div className="inline-flex items-center space-x-2 bg-secondary/10 border border-secondary/20 text-secondary px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide">
                    <span className="bg-secondary/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Choose your destination platform</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 bg-success/10 border border-success/20 text-success px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ready to transfer!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Selection */}
            <div className="w-full mb-12 sm:mb-16">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                  {!selectedPlatforms.source
                    ? "Select Source Platform"
                    : !selectedPlatforms.destination
                      ? "Select Destination Platform"
                      : "Platforms Ready"}
                </h2>
              </div>

              {/* Loading State */}
              {authLoading && (
                <div className="text-center py-12">
                  <div className="inline-block relative">
                    <div className="w-10 h-10 border-4 border-white/10 border-t-primary rounded-full animate-spin relative z-10"></div>
                  </div>
                  <p className="text-white/50 text-sm mt-4 font-medium tracking-wide">
                    Syncing connection states...
                  </p>
                </div>
              )}

              {/* Error State */}
              {authError && (
                <div className="mb-6 p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h3 className="text-sm font-display font-semibold text-red-400 tracking-wide">
                      Sync Error
                    </h3>
                  </div>
                  <p className="text-sm text-red-400/80 mt-2">
                    Failed to fetch the latest authorization states.
                  </p>
                  <button
                    onClick={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["authStatus"],
                      });
                      refetchAuthStatus();
                    }}
                    className="mt-4 px-4 py-2 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Platform Grid */}
              {!authLoading && (
                <PlatformSelector
                  selectedPlatforms={selectedPlatforms}
                  onPlatformSelect={(pid) => handlePlatformSelect(pid)}
                  onPlatformConnect={(pid) => setActiveModalPlatform(pid)}
                  onPlatformRetry={(pid) => setActiveModalPlatform(pid)}
                  connectionStatus={connectionStatus}
                  connectionErrors={connectionErrors}
                  isConnecting={isConnecting}
                  isRetrying={isRetrying}
                />
              )}
            </div>

            {/* Playlist Selection - Only show when both platforms are connected */}
            {selectedPlatforms.source && selectedPlatforms.destination && (
              <div className="max-w-4xl mx-auto">
                {!showPlaylistSelector && !selectedPlaylist ? (
                  // Show button to open playlist selector
                  <div className="text-center">
                    <button
                      onClick={() => setShowPlaylistSelector(true)}
                      className="btn-primary py-4 px-10 text-lg shadow-[0_0_20px_rgba(217,70,239,0.3)] animate-pulse hover:animate-none"
                    >
                      <ListMusic className="w-5 h-5 mr-3" />
                      Select Playlist
                    </button>
                  </div>
                ) : showPlaylistSelector ? (
                  // Show playlist selector
                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-glass">
                    <PlaylistSelector
                      selectedPlatforms={selectedPlatforms}
                      onPlaylistSelect={handlePlaylistSelect}
                      selectedPlaylist={selectedPlaylist}
                      onStartTransfer={(playlist) => {
                        setSelectedPlaylist(playlist);
                        setShowPlaylistSelector(false);
                        setShowConfirmationModal(true);
                      }}
                    />
                  </div>
                ) : selectedPlaylist ? (
                  // Show selected playlist and start transfer button
                  <div className="text-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-glass mt-4">
                    <h3 className="text-xl font-display font-semibold text-white mb-6">
                      Playlist Ready
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <button
                        onClick={() => setShowPlaylistSelector(true)}
                        className="btn-outline w-full sm:w-auto py-3.5"
                      >
                        <ListMusic className="w-4 h-4 mr-2" />
                        Change Playlist
                      </button>
                      <button
                        onClick={() => setShowConfirmationModal(true)}
                        className="btn-primary w-full sm:w-auto py-3.5 px-8 flex items-center shadow-[0_0_20px_rgba(217,70,239,0.3)] group"
                      >
                        <Play className="w-5 h-5 mr-2 fill-current group-hover:scale-110 transition-transform" />
                        Start Transfer
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <div className="max-w-3xl mx-auto mb-8 w-full mt-4">
            <div className="bg-warning/10 border border-warning/20 shadow-[0_0_15px_rgba(234,179,8,0.1)] rounded-xl p-5 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <WifiOff className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-warning tracking-wide mb-1">
                    Offline Mode
                  </h3>
                  <p className="text-sm text-warning/80 leading-relaxed">
                    You are currently offline. Operations requiring API requests
                    will fail. Please restore your internet connection to
                    continue syncing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Key BYOK Modal */}
        <APIKeyModal
          isOpen={!!activeModalPlatform}
          platform={activeModalPlatform}
          onClose={() => setActiveModalPlatform(null)}
          onSubmit={(platformId, credentials) =>
            handlePlatformConnect(platformId, credentials)
          }
        />

        {/* Transfer Confirmation Modal */}
        <TransferConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={handleTransferConfirm}
          selectedPlatforms={selectedPlatforms}
          selectedPlaylist={selectedPlaylist}
          isTransferring={isTransferring}
        />
      </div>
    </div>
  );
};

export default TransferPage;
