import React from "react";
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Key,
} from "lucide-react";

/**
 * Generic Platform Card Component
 * Displays platform information and handles platform selection in Dark Mode styling
 */
const PlatformCard = ({
  platform,
  isSelected,
  isConnected,
  connectionError,
  onSelect,
  onConnect,
  onRetry,
  isConnecting = false,
  isRetrying = false,
  userProfile = null,
}) => {
  const platformId = platform.id;
  const isSpotify = platformId === "spotify";
  const displayName =
    platform.name || (isSpotify ? "Spotify" : "YouTube Music");

  // Hardcoded glow colors for tailwind safe-listing
  // Theme colors
  const glowBorderClass = "border-primary/50";
  const glowShadowClass = "shadow-glass";
  const bgActive = "bg-primary/10";

  const isSource =
    isSelected?.type === "source" && isSelected?.platformId === platformId;
  const isDestination =
    isSelected?.type === "destination" && isSelected?.platformId === platformId;
  const isSelectedPlatform = isSource || isDestination;

  const handleClick = () => {
    if (isConnected) {
      if (onSelect) onSelect(platformId);
    } else {
      if (onConnect) onConnect(platformId);
    }
  };

  const handleRetry = (e) => {
    e.stopPropagation();
    if (onRetry) onRetry(platformId);
  };

  return (
    <div
      className={`relative group p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden ${
        isSelectedPlatform
          ? `${glowBorderClass} ${bgActive} ${glowShadowClass} cursor-pointer`
          : "border-white/10 bg-black/40 backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 hover:-translate-y-1 cursor-pointer shadow-glass"
      }`}
      onClick={handleClick}
    >
      {/* Background soft glow gradient */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${isSpotify ? "from-[#1ed760] to-transparent" : "from-[#ff0000] to-transparent"}`}
      ></div>

      {/* Selection Indicator */}
      {isSelectedPlatform && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-glass z-10 animate-bounce-in">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          {/* Platform Icon */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-105 ${isSelectedPlatform ? "bg-primary" : "bg-white/5 border border-white/10"}`}
          >
            {platform.icon ? (
              React.createElement(platform.icon, {
                className: "w-8 h-8 text-white",
              })
            ) : (
              <span className="text-white font-display font-bold text-2xl">
                {displayName.charAt(0)}
              </span>
            )}

            {/* Connected Dot */}
            {isConnected && !isSelectedPlatform && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-[#0A0A0A]"></div>
            )}
          </div>
        </div>

        {/* Platform Info */}
        <div className="space-y-3">
          <h3 className="text-2xl font-display font-bold text-white tracking-tight">
            {displayName}
          </h3>

          <p className="text-sm text-white/50 leading-relaxed min-h-[40px]">
            {isConnected && userProfile
              ? `Connected as ${userProfile.display_name || userProfile.email || "User"}`
              : platform.description || "Connect your account to continue"}
          </p>

          {/* Status Badge */}
          {isSelectedPlatform && (
            <div className="inline-flex items-center space-x-2 bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full mt-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                {isSource ? "Source" : "Destination"}
              </span>
            </div>
          )}

          {/* Error Display */}
          {connectionError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-xs text-red-400 block break-words">
                  {connectionError}
                </span>
              </div>
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 text-red-400"
                title="Retry connection"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          )}

          {/* Action Hint */}
          {!isSelectedPlatform && !connectionError && (
            <div className="flex items-center space-x-2 mt-4 text-white/40 group-hover:text-white transition-colors duration-300">
              {isConnected ? (
                <>
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Click to select</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Click to connect via BYOK
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlatformCard);
