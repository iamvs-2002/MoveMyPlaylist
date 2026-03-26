import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Music,
  ArrowRight,
  Settings,
} from "lucide-react";
import { SpotifyIcon, YouTubeMusicIcon } from "../assets/icons";
import { useModalScrollLock } from "../hooks/useModalScrollLock";

const TransferConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPlatforms,
  selectedPlaylist,
  isTransferring = false,
}) => {
  useModalScrollLock(isOpen);
  const [playlistName, setPlaylistName] = useState("");
  const [transferOptions, setTransferOptions] = useState({
    searchAlgorithm: "SMART",
    createPublic: false,
    includeDescription: true,
  });

  // Set default playlist name when playlist is selected
  React.useEffect(() => {
    if (selectedPlaylist) {
      const defaultName = `${selectedPlaylist.name} (Transferred from ${selectedPlatforms.source})`;
      setPlaylistName(defaultName);
    }
  }, [selectedPlaylist, selectedPlatforms.source]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      sourcePlatform: selectedPlatforms.source,
      sourcePlaylistId: selectedPlaylist.id,
      targetPlatform: selectedPlatforms.destination,
      playlistName: playlistName.trim() || selectedPlaylist.name,
      options: transferOptions,
    });
  };

  const getPlatformName = (platformId) => {
    return platformId === "spotify" ? "Spotify" : "YouTube Music";
  };

  const getPlatformIcon = (platformId) => {
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-3 shadow-glass border border-primary/50 transition-all duration-300">
        {platformId === "spotify" ? (
          <SpotifyIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
        ) : (
          <YouTubeMusicIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
        )}
      </div>
    );
  };

  const getSearchAlgorithmDescription = (algorithm) => {
    switch (algorithm) {
      case "FAST":
        return "Quick search with basic matching (faster, less accurate)";
      case "STRICT":
        return "Exact matching only (slower, most accurate)";
      case "SMART":
        return "Intelligent matching with fallbacks (recommended)";
      default:
        return "Intelligent matching with fallbacks";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-glass flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header Ribbon */}
        <div className="h-2 w-full bg-primary flex-shrink-0" />

        <div className="overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
            <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-primary" />
              Confirm Transfer
            </h2>
            <button
              onClick={onClose}
              disabled={isTransferring}
              className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Visual Transfer Overview */}
            <div className="relative rounded-2xl p-6 bg-gradient-to-r from-white/5 to-white/5 border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-mesh-dark opacity-30 mix-blend-screen pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-6">
                  Transfer Path
                </h3>
                <div className="flex items-center justify-center space-x-6 md:space-x-12 w-full">
                  {/* Source */}
                  <div className="flex flex-col items-center">
                    {getPlatformIcon(selectedPlatforms.source)}
                    <p className="font-display font-bold text-white">
                      {getPlatformName(selectedPlatforms.source)}
                    </p>
                    <p className="text-xs text-white/50">Source</p>
                  </div>

                  {/* Animated Arrow */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative">
                      <ArrowRight className="w-10 h-10 text-primary animate-pulse" />
                      <div className="absolute inset-0 bg-primary/20 blur-md rounded-full"></div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex flex-col items-center">
                    {getPlatformIcon(selectedPlatforms.destination)}
                    <p className="font-display font-bold text-white">
                      {getPlatformName(selectedPlatforms.destination)}
                    </p>
                    <p className="text-xs text-white/50">Destination</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    Playlist Details
                  </h3>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/50">Name:</span>
                      <span
                        className="font-semibold text-white max-w-[200px] truncate"
                        title={selectedPlaylist?.name}
                      >
                        {selectedPlaylist?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/50">Tracks:</span>
                      <span className="font-semibold text-white bg-primary/20 px-2 py-0.5 rounded text-xs">
                        {selectedPlaylist?.tracks_count ||
                          selectedPlaylist?.tracks?.length ||
                          0}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">
                    New Playlist Name
                  </label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Enter playlist name..."
                    className="input text-sm"
                    disabled={isTransferring}
                    spellCheck={false}
                  />
                  <p className="text-xs text-white/40 mt-2">
                    Leave empty to use original name
                  </p>
                </div>
              </div>

              {/* Right Column: Options */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Transfer Settings
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-white/70 mb-2">
                        Matching Engine
                      </label>
                      <select
                        value={transferOptions.searchAlgorithm}
                        onChange={(e) =>
                          setTransferOptions((prev) => ({
                            ...prev,
                            searchAlgorithm: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:border-primary/50 text-sm"
                        disabled={isTransferring}
                      >
                        <option value="FAST" className="bg-[#0A0A0A]">
                          Fast Search
                        </option>
                        <option value="SMART" className="bg-[#0A0A0A]">
                          Smart Search (Recommended)
                        </option>
                        <option value="STRICT" className="bg-[#0A0A0A]">
                          Strict Search
                        </option>
                      </select>
                      <p className="text-xs text-white/40 mt-2">
                        {getSearchAlgorithmDescription(
                          transferOptions.searchAlgorithm,
                        )}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 border border-white/30 rounded bg-white/5 group-hover:border-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={transferOptions.createPublic}
                            onChange={(e) =>
                              setTransferOptions((prev) => ({
                                ...prev,
                                createPublic: e.target.checked,
                              }))
                            }
                            className="absolute opacity-0 cursor-pointer"
                            disabled={isTransferring}
                          />
                          {transferOptions.createPublic && (
                            <CheckCircle className="w-3.5 h-3.5 text-primary" />
                          )}
                        </div>
                        <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                          Create as public playlist
                        </span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 border border-white/30 rounded bg-white/5 group-hover:border-primary transition-colors">
                          <input
                            type="checkbox"
                            checked={transferOptions.includeDescription}
                            onChange={(e) =>
                              setTransferOptions((prev) => ({
                                ...prev,
                                includeDescription: e.target.checked,
                              }))
                            }
                            className="absolute opacity-0 cursor-pointer"
                            disabled={isTransferring}
                          />
                          {transferOptions.includeDescription && (
                            <CheckCircle className="w-3.5 h-3.5 text-primary" />
                          )}
                        </div>
                        <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                          Include original description
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning mb-1">
                  Transfer Notes
                </p>
                <p className="text-xs text-warning/80 leading-relaxed">
                  Matching accuracy varies by platform. Not all songs are
                  available on every service. Due to API limits, extremely
                  massive playlists may take a few minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-white/10 bg-white/[0.02]">
            <button
              onClick={onClose}
              disabled={isTransferring}
              className="px-6 py-2.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 text-sm font-medium outline-none"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={isTransferring || !playlistName.trim()}
              className="btn-primary py-2.5 px-8 flex items-center gap-2"
            >
              {isTransferring ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Initialising...</span>
                </>
              ) : (
                <>
                  <span>Start Transfer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferConfirmationModal;
