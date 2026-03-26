import React from "react";

// Spotify Icon Component
export const SpotifyIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" {...props}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

export const YouTubeMusicIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg
    viewBox="0 0 100 100"
    version="1.1"
    className={className}
    fill="currentColor"
    {...props}
  >
    <g>
      <path
        className="fill-current"
        d="M50,2.5C23.766,2.5,2.5,23.823,2.5,50.126c2.502,63.175,92.507,63.157,95-0.001      C97.5,23.823,76.233,2.5,50,2.5z M50,77.399c-15.036,0-27.27-12.233-27.27-27.27c0.74-18.662,14.654-27.134,27.269-27.134      c0.001,0,0.001,0,0.002,0c12.616,0.001,26.531,8.473,27.267,27.073C77.27,65.167,65.036,77.399,50,77.399z"
      />
      <path
        className="fill-current opacity-80"
        d="M50.002,26.103c-15.946-0.001-23.704,12.486-24.165,24.088C25.838,63.453,36.677,74.292,50,74.292      S74.162,63.453,74.162,50.13C73.705,38.591,65.948,26.105,50.002,26.103z"
      />
      <path
        className="fill-white"
        d="M41.055,52.528c-0.001,2.575,0.001,7.867,0,10.46c0,0,21.802-13.417,21.802-13.417L41.055,37.272V52.528z"
      />
    </g>
  </svg>
);

// Music Note Icon Component
export const MusicNoteIcon = ({ className = "w-6 h-6", ...props }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" {...props}>
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);

// Export default icons for backward compatibility
export default {
  SpotifyIcon,
  YouTubeMusicIcon,
  MusicNoteIcon,
};
