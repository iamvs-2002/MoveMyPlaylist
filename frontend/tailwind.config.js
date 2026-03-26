/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // We enforce dark mode via class
  theme: {
    extend: {
      colors: {
        // Pure deep dark base colors
        background: "#050505",
        foreground: "#F5F5F7",
        card: "#0D0D0D", // Very slight elevation
        "card-foreground": "#F5F5F7",
        popover: "#0D0D0D",
        "popover-foreground": "#F5F5F7",
        border: "#1A1A1A", // Minimal visibility
        input: "#1A1A1A",
        muted: "#141414",
        "muted-foreground": "#9E9E9E",

        // Brand Primary Glow (Deep Magenta/Purple)
        primary: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef", // Main brand accent
          600: "#c026d3", // Hover states
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
          DEFAULT: "#d946ef",
          foreground: "#FAFAFA",
        },

        // Secondary/Accent
        secondary: {
          DEFAULT: "#7e22ce",
          foreground: "#FAFAFA",
        },

        // Interactive Elements
        accent: {
          DEFAULT: "#ffffff",
          foreground: "#050505",
        },

        // Platform specific with higher contrast
        spotify: {
          DEFAULT: "#1ed760", // Brighter Spotify Green
          hover: "#1cdf59",
          bg: "#0a1a10", // Deep green glow base
        },
        youtube: {
          DEFAULT: "#ff0000", // Standard YouTube Red
          hover: "#ff3333",
          bg: "#200505", // Deep red glow base
        },

        // State Colors
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"], // Body texts
        display: ["Outfit", "system-ui", "sans-serif"], // Headings
        mono: ["JetBrains Mono", "monospace"],
      },

      fontSize: {
        display: [
          "clamp(3rem, 5vw, 4.5rem)",
          { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "800" },
        ],
        hero: [
          "clamp(2rem, 4vw, 3rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        title: [
          "clamp(1.5rem, 3vw, 2rem)",
          { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        subtitle: [
          "1.25rem",
          { lineHeight: "1.5", letterSpacing: "0em", fontWeight: "500" },
        ],
        body: [
          "1rem",
          { lineHeight: "1.6", letterSpacing: "0.01em", fontWeight: "400" },
        ],
        caption: [
          "0.875rem",
          { lineHeight: "1.5", letterSpacing: "0.02em", fontWeight: "400" },
        ],
      },

      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        full: "9999px",
      },

      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.5)",
        "glow-primary": "0 0 20px rgba(217, 70, 239, 0.3)",
        "glow-primary-lg": "0 0 40px rgba(217, 70, 239, 0.5)",
        "glow-spotify": "0 0 20px rgba(30, 215, 96, 0.3)",
        "glow-youtube": "0 0 20px rgba(255, 0, 0, 0.3)",
      },

      animation: {
        float: "float 6s ease-in-out infinite",
        "mesh-pan": "mesh-pan 15s ease infinite alternate",
        "pulse-glow": "pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.5s ease-out",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "mesh-pan": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
