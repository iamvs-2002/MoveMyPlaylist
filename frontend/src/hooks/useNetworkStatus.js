import { useState, useEffect } from "react";

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkQuality, setNetworkQuality] = useState("good");
  const [lastSeen, setLastSeen] = useState(Date.now());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSeen(Date.now());
      setNetworkQuality("good");

      // Show success toast when coming back online
      if (window.showToast) {
        window.showToast.success(
          "Connection Restored",
          "You are back online and can continue using the app.",
          { duration: 3000 },
        );
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkQuality("offline");

      // Show warning toast when going offline
      if (window.showToast) {
        window.showToast.warning(
          "Connection Lost",
          "You are currently offline. Some features may not work properly.",
          { duration: 0 }, // Don't auto-dismiss offline warning
        );
      }
    };

    // Network quality detection using navigator.connection if available
    const checkNetworkQuality = () => {
      if (navigator.connection) {
        const connection = navigator.connection;

        if (
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g"
        ) {
          setNetworkQuality("poor");
        } else if (connection.effectiveType === "3g") {
          setNetworkQuality("fair");
        } else {
          setNetworkQuality("good");
        }
      }
    };

    // Check network quality periodically
    const qualityInterval = setInterval(checkNetworkQuality, 10000);

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial network quality
    checkNetworkQuality();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(qualityInterval);
    };
  }, []);

  // Function to test actual connectivity by making a small request
  const testConnectivity = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch("/health", {
        method: "HEAD",
        cache: "no-cache",
      });
      const endTime = Date.now();
      const latency = endTime - startTime;

      if (response.ok) {
        // Determine quality based on latency
        if (latency < 100) {
          setNetworkQuality("excellent");
        } else if (latency < 300) {
          setNetworkQuality("good");
        } else if (latency < 1000) {
          setNetworkQuality("fair");
        } else {
          setNetworkQuality("poor");
        }
        return true;
      }
      return false;
    } catch (error) {
      setNetworkQuality("offline");
      return false;
    }
  };

  // Function to get user-friendly network status message
  const getNetworkStatusMessage = () => {
    if (!isOnline) {
      return "You are currently offline";
    }

    switch (networkQuality) {
      case "excellent":
        return "Excellent connection - your transfer will be ultrafast and stable.";
      case "good":
        return "Good connection - your music transfer will be fast and reliable.";
      case "fair":
        return "Fair connection - matching might take slightly longer.";
      case "poor":
        return "Poor connection - transfers may experience delays or timeouts.";
      case "offline":
        return "No internet connection - please check your network.";
      default:
        return "Checking connection quality...";
    }
  };

  // Function to get network status color
  const getNetworkStatusColor = () => {
    if (!isOnline) return "text-red-600";

    switch (networkQuality) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-green-500";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-orange-600";
      case "offline":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return {
    isOnline,
    networkQuality,
    lastSeen,
    testConnectivity,
    getNetworkStatusMessage,
    getNetworkStatusColor,
  };
};

export default useNetworkStatus;
