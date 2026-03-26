import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "../utils/enhancedApi";
import { Music } from "lucide-react";

/**
 * AuthCallback Component
 * Handles the gap between frontend domain callbacks and backend processing.
 * Redirects the user from the frontend callback URL to the corresponding backend endpoint.
 */
const AuthCallback = ({ platform }) => {
  const location = useLocation();

  useEffect(() => {
    // Construct the backend callback URL
    // e.g. https://backend-url.com/auth/spotify/callback?code=...&state=...
    const backendCallbackUrl = `${API_BASE_URL}/auth/${platform}/callback${location.search}`;
    
    console.log(`Forwarding ${platform} callback to backend:`, backendCallbackUrl);
    
    // Perform a full page redirect to the backend
    // The backend will process the callback and then redirect back to the frontend /transfer page
    window.location.href = backendCallbackUrl;
  }, [platform, location.search]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="relative">
        <div className="absolute -inset-10 bg-primary/20 blur-[50px] rounded-full animate-pulse-slow"></div>
        <div className="relative bg-white/5 border border-white/10 p-12 rounded-[2.5rem] backdrop-blur-2xl shadow-glass flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 animate-bounce-slow">
             <Music className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-2xl font-display font-bold text-white mb-3">
            Authorizing...
          </h2>
          
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Securely connecting to {platform === 'spotify' ? 'Spotify' : 'YouTube Music'}. This will only take a moment.
          </p>

          {/* Loading Bar */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/2 animate-shimmer rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
