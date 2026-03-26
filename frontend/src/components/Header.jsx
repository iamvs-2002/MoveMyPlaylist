import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#030303]/90 backdrop-blur-xl border-b border-white/5 shadow-glass w-full">
      <div className="container-app">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 group outline-none"
            onClick={closeMobileMenu}
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img
                src="/logo.png"
                alt="MoveMyPlaylist Logo"
                className="relative w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="text-xl font-display font-bold text-white tracking-tight group-hover:text-primary transition-colors duration-300">
              MoveMyPlaylist
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="https://github.com/iamvs-2002/movemyplaylist"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors duration-200 outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeMobileMenu}
            />

            {/* Mobile Menu Content */}
            <div className="absolute top-20 left-4 right-4 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-glass z-50 animate-slide-up overflow-hidden">
              <div className="px-4 py-6 flex flex-col space-y-4">
                <a
                  href="https://github.com/iamvs-2002/movemyplaylist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 font-medium py-3"
                  onClick={closeMobileMenu}
                >
                  <Github className="w-5 h-5" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
