import React from "react";
import { Wifi, WifiOff, AlertTriangle, Signal, SignalHigh } from "lucide-react";
import useNetworkStatus from "../hooks/useNetworkStatus";

const NetworkStatusIndicator = ({ className = "" }) => {
  const {
    isOnline,
    networkQuality,
    getNetworkStatusMessage,
    getNetworkStatusColor,
  } = useNetworkStatus();

  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    switch (networkQuality) {
      case "excellent":
        return <SignalHigh className="w-4 h-4 text-success" />;
      case "good":
        return <Signal className="w-4 h-4 text-success/80" />;
      case "fair":
        return <Signal className="w-4 h-4 text-warning" />;
      case "poor":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Wifi className="w-4 h-4 text-white/40" />;
    }
  };

  const getQualityText = () => {
    if (!isOnline) return "Offline";

    switch (networkQuality) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "fair":
        return "Fair";
      case "poor":
        return "Poor";
      default:
        return "Unknown";
    }
  };

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-glass ${className}`}
      title={getNetworkStatusMessage()}
    >
      {getIcon()}
      <span
        className={`text-xs font-semibold tracking-wide uppercase ${isOnline ? "text-white/70" : "text-red-400"}`}
      >
        {getQualityText()}
      </span>
    </div>
  );
};

export default NetworkStatusIndicator;
