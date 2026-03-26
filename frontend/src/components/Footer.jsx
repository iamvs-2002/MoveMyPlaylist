import React from "react";
import { Music, Github, Heart, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 relative z-0 w-full overflow-hidden">
      <div className="container-app py-12">
        <div className="flex flex-col space-y-8 lg:space-y-0 lg:flex-row lg:justify-between lg:items-start">
          {/* Logo and Description */}
          <div className="flex flex-col items-center lg:items-start space-y-4 text-center lg:text-left">
            <Link
              to="/"
              className="flex items-center space-x-3 group outline-none"
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img
                  src="/logo.png"
                  alt="MoveMyPlaylist Logo"
                  className="relative w-10 h-10 sm:w-12 sm:h-12 object-contain"
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight group-hover:text-primary transition-colors duration-300">
                MoveMyPlaylist
              </span>
            </Link>
            <p className="text-white/60 font-sans leading-relaxed">
              Transfer your music playlists between platforms securely,
              privately, and fast.
            </p>
            <a
              href="https://useneedle.net/directory/movemyplaylist"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4"
            >
              <img
                src="https://useneedle.net/badges/needle-directory.svg"
                alt="Listed on Needle Directory"
                height="44"
              />
            </a>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
            <Link
              to="/faq"
              className="text-white/60 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              FAQ
            </Link>
            <Link
              to="/privacy"
              className="text-white/60 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-white/60 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              Terms
            </Link>
            <a
              href="https://github.com/iamvs-2002/movemyplaylist"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="mailto:movemyplaylist.online@gmail.com"
              className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors duration-200 font-medium text-sm"
            >
              <Users className="w-4 h-4" />
              <span>Support</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-sm text-white/50 font-medium">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-primary animate-pulse" />
              <span>by the MoveMyPlaylist team</span>
            </div>
            <p className="text-sm text-white/40">
              © 2026 MoveMyPlaylist. Open Source.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
