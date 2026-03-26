import { useMemo } from "react";

export const useAuth = (authStatus) => {
  const authState = useMemo(() => {
    if (!authStatus) {
      return {
        isAuthenticated: false,
        hasSpotify: false,
        hasYouTube: false,
        hasBothPlatforms: false,
        spotifyProfile: null,
        youtubeProfile: null,
        canTransfer: false,
      };
    }

    const hasSpotify = authStatus.platforms?.spotify?.connected || false;
    const hasYouTube = authStatus.platforms?.youtube?.connected || false;
    const hasBothPlatforms = hasSpotify && hasYouTube;

    return {
      isAuthenticated: authStatus.authenticated || false,
      hasSpotify,
      hasYouTube,
      hasBothPlatforms,
      spotifyProfile: authStatus.platforms?.spotify?.profile || null,
      youtubeProfile: authStatus.platforms?.youtube?.profile || null,
      canTransfer: hasBothPlatforms,
    };
  }, [authStatus]);

  return authState;
};
