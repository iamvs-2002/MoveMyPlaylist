import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { get } from "../utils/enhancedApi";
import {
  Music,
  ListMusic,
  Clock,
  User,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Play,
} from "lucide-react";

const PlaylistSelector = ({
  selectedPlatforms,
  onPlaylistSelect,
  selectedPlaylist,
  onPlaylistChange,
  onStartTransfer,
}) => {
  console.log("🎵 PlaylistSelector: Component rendered with props:", {
    selectedPlatforms,
    selectedPlatformsKeys: selectedPlatforms
      ? Object.keys(selectedPlatforms)
      : "No selectedPlatforms",
    source: selectedPlatforms?.source,
    destination: selectedPlatforms?.destination,
    onPlaylistSelect: !!onPlaylistSelect,
    selectedPlaylist: !!selectedPlaylist,
    onPlaylistChange: !!onPlaylistChange,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSourcePlatform, setSelectedSourcePlatform] = useState(null);

  // Get playlists for the selected source platform
  const {
    data: playlists,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["playlists", selectedSourcePlatform],
    queryFn: async () => {
      if (!selectedSourcePlatform) return [];

      try {
        console.log(
          "🎵 PlaylistSelector: Fetching playlists for platform:",
          selectedSourcePlatform,
        );
        const response = await get(`/api/playlists/${selectedSourcePlatform}`);
        console.log("🎵 PlaylistSelector: Raw API response:", response);
        console.log("🎵 PlaylistSelector: Response type:", typeof response);
        console.log(
          "🎵 PlaylistSelector: Response keys:",
          response ? Object.keys(response) : "No response",
        );

        // enhancedApi already processes the response and returns the data directly
        // But we need to ensure we get the items array
        let playlistData = [];

        if (response && typeof response === "object") {
          if (Array.isArray(response)) {
            // If response is already an array, use it directly
            playlistData = response;
          } else if (response.items && Array.isArray(response.items)) {
            // If response has items array, use that
            playlistData = response.items;
          } else if (
            response.data &&
            response.data.items &&
            Array.isArray(response.data.items)
          ) {
            // Fallback: if response has nested data.items
            playlistData = response.data.items;
          } else {
            // If none of the above, try to use response as is
            playlistData = [response];
          }
        }

        console.log("🎵 PlaylistSelector: Final playlist data:", playlistData);
        console.log(
          "🎵 PlaylistSelector: Playlist data type:",
          typeof playlistData,
        );
        console.log(
          "🎵 PlaylistSelector: Is array:",
          Array.isArray(playlistData),
        );
        console.log("🎵 PlaylistSelector: Length:", playlistData.length);

        return playlistData;
      } catch (error) {
        console.error(
          `🎵 PlaylistSelector: Failed to fetch ${selectedSourcePlatform} playlists:`,
          error,
        );
        throw error;
      }
    },
    enabled: !!selectedSourcePlatform,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug the query state
  console.log("🎵 PlaylistSelector: Query state:", {
    selectedSourcePlatform,
    playlists,
    playlistsType: typeof playlists,
    isArray: Array.isArray(playlists),
    playlistsKeys:
      playlists && typeof playlists === "object"
        ? Object.keys(playlists)
        : "Not an object",
    itemsCount: Array.isArray(playlists) ? playlists.length : "Not an array",
    hasItems: Array.isArray(playlists) && playlists.length > 0,
  });

  // Ensure playlists is always an array for filtering
  const safePlaylists = Array.isArray(playlists) ? playlists : [];

  // Set source platform when platforms are selected
  useEffect(() => {
    console.log("🎵 PlaylistSelector: useEffect triggered:", {
      selectedPlatforms,
      selectedPlatformsSource: selectedPlatforms.source,
      selectedSourcePlatform,
      willSet: selectedPlatforms.source && !selectedSourcePlatform,
    });

    if (selectedPlatforms.source && !selectedSourcePlatform) {
      console.log(
        "🎵 PlaylistSelector: Setting source platform to:",
        selectedPlatforms.source,
      );
      setSelectedSourcePlatform(selectedPlatforms.source);
    }
  }, [selectedPlatforms.source, selectedSourcePlatform]);

  // Filter playlists based on search query
  const filteredPlaylists =
    safePlaylists.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.owner?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const handlePlaylistSelect = (playlist) => {
    onPlaylistSelect(playlist);
  };

  const formatDuration = (duration) => {
    if (!duration) return "Unknown";
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Helper function to get track count from playlist data
  const getTrackCount = (playlist) => {
    // Debug logging to see the actual structure
    console.log("🎵 PlaylistSelector: Playlist data structure:", {
      id: playlist.id,
      name: playlist.name,
      trackCount: playlist.trackCount,
      tracks: playlist.tracks,
      tracks_count: playlist.tracks_count,
      itemCount: playlist.itemCount,
      videoCount: playlist.videoCount,
      totalItems: playlist.totalItems,
      allKeys: Object.keys(playlist),
    });

    // Try multiple possible properties for track count
    const count =
      playlist.trackCount ||
      playlist.tracks?.length ||
      playlist.tracks_count ||
      playlist.itemCount ||
      playlist.videoCount ||
      playlist.totalItems ||
      (playlist.tracks && Array.isArray(playlist.tracks)
        ? playlist.tracks.length
        : 0) ||
      0;

    console.log("🎵 PlaylistSelector: Extracted track count:", count);
    return count;
  };

  const formatTrackCount = (count) => {
    if (!count) return "0 tracks";
    return `${count} track${count === 1 ? "" : "s"}`;
  };

  if (!selectedPlatforms.source) {
    return (
      <div className="text-center py-8">
        <ListMusic className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">Please select a source platform first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1">
          <h3 className="text-2xl font-display font-bold text-white mb-2">
            Select Playlist to Transfer
          </h3>
          <p className="text-sm text-white/60">
            Choose a playlist from your{" "}
            <span className="text-white font-medium">
              {selectedSourcePlatform === "spotify"
                ? "Spotify"
                : "YouTube Music"}
            </span>{" "}
            account
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-xl transition-colors disabled:opacity-50 font-medium"
          title="Refresh playlists"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">
            {isLoading ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search playlists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-white placeholder-white/30 transition-shadow outline-none shadow-glass"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block relative">
            <div className="w-10 h-10 border-4 border-white/10 border-t-primary rounded-full animate-spin relative z-10 mx-auto mb-4"></div>
            <div className="absolute inset-0 w-10 h-10 bg-primary/20 blur-xl rounded-full"></div>
          </div>
          <p className="text-white/50 text-sm tracking-wide">
            Loading playlists...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 shadow-glass">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h4 className="text-sm font-semibold text-red-400 tracking-wide">
              Failed to Load Playlists
            </h4>
          </div>
          <p className="text-sm text-red-300 mt-2 leading-relaxed">
            {error.message || "Unable to load playlists. Please try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors uppercase tracking-wider"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Playlists Grid */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {filteredPlaylists.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-base font-display font-medium text-white/60 mb-2">
                {searchQuery
                  ? "No playlists match your search"
                  : "No playlists found"}
              </p>
              {searchQuery && (
                <p className="text-xs text-white/40">
                  Try adjusting your search terms or clear the filter
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPlaylists.map((playlist) => {
                const isSelected = selectedPlaylist?.id === playlist.id;

                return (
                  <label
                    key={playlist.id}
                    className={`group relative flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(217,70,239,0.15)] ring-1 ring-primary/30 z-10"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="playlist"
                      value={playlist.id}
                      checked={isSelected}
                      onChange={() => onPlaylistSelect(playlist)}
                      className="w-4 h-4 bg-black/50 border-white/30 text-primary focus:ring-primary focus:ring-offset-0 focus:ring-1 focus:ring-offset-transparent mr-4 flex-shrink-0 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <h4
                          className={`text-base font-semibold truncate transition-colors ${isSelected ? "text-white" : "text-white/80 group-hover:text-white"}`}
                        >
                          {playlist.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wider self-start sm:self-auto ${
                            isSelected
                              ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(217,70,239,0.3)]"
                              : "bg-white/5 text-white/50 border border-white/5"
                          }`}
                        >
                          {formatTrackCount(getTrackCount(playlist))}
                        </span>
                      </div>

                      {playlist.owner && (
                        <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          <span className="font-medium text-white/60">
                            {playlist.owner}
                          </span>
                        </p>
                      )}

                      {playlist.description && (
                        <p className="text-xs text-white/30 line-clamp-1 leading-relaxed mt-1">
                          {playlist.description}
                        </p>
                      )}
                    </div>

                    {/* Hover subtle glow effect */}
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent ${isSelected ? "hidden" : "block"}`}
                    ></div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transfer Button - Only show when a playlist is selected */}
      {selectedPlaylist && !isLoading && !error && (
        <div className="mt-8 pt-8 border-t border-white/10 animate-fade-in">
          <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between shadow-glass mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                <ListMusic className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left max-w-[200px] sm:max-w-xs md:max-w-sm">
                <h4 className="text-base font-display font-bold text-white truncate">
                  {selectedPlaylist.name}
                </h4>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">
                  {formatTrackCount(getTrackCount(selectedPlaylist))} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (onStartTransfer) onStartTransfer(selectedPlaylist);
              }}
              className="btn-primary py-3 px-6 hidden sm:flex items-center shadow-[0_0_20px_rgba(217,70,239,0.4)]"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Transfer
            </button>
          </div>

          <button
            onClick={() => {
              if (onStartTransfer) onStartTransfer(selectedPlaylist);
            }}
            className="btn-primary w-full py-4 sm:hidden flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.4)] text-lg"
          >
            <Play className="w-5 h-5 mr-2 fill-current" />
            Transfer Playlist
          </button>
        </div>
      )}
    </div>
  );
};

export default PlaylistSelector;
