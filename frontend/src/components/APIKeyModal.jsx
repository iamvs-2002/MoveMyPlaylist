import React, { useState } from "react";
import { Eye, EyeOff, Info, Key, Lock, X } from "lucide-react";
import { useModalScrollLock } from "../hooks/useModalScrollLock";

const APIKeyModal = ({ isOpen, platform, onClose, onSubmit }) => {
  useModalScrollLock(isOpen);
  const [credentials, setCredentials] = useState({
    clientId: "",
    clientSecret: "",
    apiKey: "", // Youtube specific
  });
  const [showSecret, setShowSecret] = useState(false);

  if (!isOpen || !platform) return null;

  const isSpotify = platform === "spotify";
  const platformName = isSpotify ? "Spotify" : "YouTube Music";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(platform, credentials);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-glass overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header Ribbon */}
        <div
          className={`h-2 flex-shrink-0 w-full ${isSpotify ? "bg-[#1DB954]" : "bg-[#FF0000]"}`}
        />

        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                BYOK Setup
              </h2>
              <p className="text-white/50 text-sm mt-1">
                Enter your{" "}
                <span className="text-white font-semibold">{platformName}</span>{" "}
                credentials
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs text-primary/80 leading-relaxed space-y-2">
              <p>
                Keys are strictly stored in your active session and never saved
                on our servers. You must provide your own credentials to bypass
                global rate limits.
              </p>
              <div className="pt-2 border-t border-primary/20">
                <p className="font-semibold text-primary">How to get keys:</p>
                {isSpotify ? (
                  <p>
                    Go to the{" "}
                    <a
                      href="https://developer.spotify.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-white transition-colors"
                    >
                      Spotify Developer Dashboard
                    </a>
                    , create an app, and copy the Client ID and Client Secret.
                    Ensure your Redirect URI is set to{" "}
                    <code className="bg-black/30 px-1 py-0.5 rounded text-white/90">
                      https://movemyplaylist.online/auth/spotify/callback
                    </code>{" "}
                    (or your domain).
                  </p>
                ) : (
                  <p>
                    Go to the{" "}
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-white transition-colors"
                    >
                      Google Cloud Console
                    </a>
                    , create a project, enable the YouTube Data API v3, and
                    generate an OAuth 2.0 Client ID (Web Application) and an API
                    Key. Ensure your authorized redirect URI is set to{" "}
                    <code className="bg-black/30 px-1 py-0.5 rounded text-white/90">
                      https://movemyplaylist.online/auth/youtube/callback
                    </code>{" "}
                    (or your domain).
                  </p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                Client ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-white/30" />
                </div>
                <input
                  type="text"
                  name="clientId"
                  value={credentials.clientId}
                  onChange={handleChange}
                  placeholder={`Your ${platformName} Client ID`}
                  className="input pl-10 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                Client Secret
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-white/30" />
                </div>
                <input
                  type={showSecret ? "text" : "password"}
                  name="clientSecret"
                  value={credentials.clientSecret}
                  onChange={handleChange}
                  placeholder={`Your ${platformName} Client Secret`}
                  className="input pl-10 pr-10 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/70 focus:outline-none"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {!isSpotify && (
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                  API Key (Required for YouTube)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-white/30" />
                  </div>
                  <input
                    type="text"
                    name="apiKey"
                    value={credentials.apiKey}
                    onChange={handleChange}
                    placeholder="Your YouTube API Key"
                    className="input pl-10 text-sm"
                    required
                  />
                </div>
              </div>
            )}

            <div className="pt-4 mt-6 border-t border-white/10">
              <button
                type="submit"
                className={`w-full relative overflow-hidden text-white font-display font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform active:scale-[0.98] ${
                  isSpotify
                    ? "bg-[#1DB954] hover:bg-[#1cdf59] shadow-[0_0_15px_rgba(30,185,84,0.3)] hover:shadow-[0_0_25px_rgba(30,185,84,0.5)]"
                    : "bg-[#FF0000] hover:bg-[#ff3333] shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_rgba(255,0,0,0.5)]"
                }`}
              >
                Connect {platformName}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default APIKeyModal;
