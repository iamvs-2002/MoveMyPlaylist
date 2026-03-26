import React from "react";
import { Link } from "react-router-dom";
import {
  Music,
  ArrowRight,
  Zap,
  Shield,
  Smartphone,
  Globe,
  Play,
  Users,
  CheckCircle,
  Star,
  Github,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get your playlists transferred in under 5 minutes.",
    highlight: "5 minutes",
  },
  {
    icon: Shield,
    title: "Bring Your Own Key",
    description: "Your own API keys. We never store them on our servers.",
    highlight: "100% Private",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description: "Transfer from any device with just a browser.",
    highlight: "Any device",
  },
  {
    icon: Globe,
    title: "Cross-Platform Magic",
    description: "Spotify to YouTube Music seamlessly.",
    highlight: "Seamless",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Subtle Background Mesh */}
      <div className="absolute inset-0 bg-mesh-dark z-0 opacity-40"></div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-24 lg:pt-48 lg:pb-36 flex flex-col items-center">
        <div className="container-app relative">
          {/* Subtle accent element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-30 mix-blend-screen"></div>

          <div className="text-center animate-fade-in relative z-10">
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 backdrop-blur-md rounded-full px-5 py-2 mb-10 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:bg-white/10 transition-colors cursor-pointer">
              <Star className="w-4 h-4 text-primary fill-current animate-pulse" />
              <span className="text-sm font-semibold tracking-wide text-white/90">
                Premium Open Source Software
              </span>
            </div>

            <h1 className="text-display max-w-5xl mx-auto leading-[1.1] mb-8 font-black text-white drop-shadow-lg">
              Transfer Your Music Playlists
              <span className="block text-primary mt-2 py-2">
                Securely & Easily
              </span>
            </h1>

            <p className="text-lg md:text-2xl font-light mb-14 max-w-3xl mx-auto text-white/70 leading-relaxed">
              Move your favorite playlists between Spotify and YouTube Music
              quickly. Our new{" "}
              <strong className="text-white font-medium">BYOK</strong> system
              ensures complete privacy—no backend storage, absolute freedom.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link
                to="/transfer"
                className="relative inline-flex items-center justify-center w-full sm:w-auto overflow-hidden rounded-full p-0.5 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-70 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                <div className="relative z-10 flex items-center space-x-3 bg-black/20 hover:bg-transparent transition-colors duration-300 px-10 py-5 rounded-full">
                  <span className="text-xl font-bold text-white tracking-wide">
                    Start Free Transfer Now
                  </span>
                  <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </Link>

              <button
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    .scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center justify-center w-full sm:w-auto px-10 py-5 text-xl font-medium rounded-full bg-white/5 text-white border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-md"
              >
                <span>See How It Works</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm font-medium text-white/50 bg-black/20 py-4 px-8 rounded-full border border-white/5 backdrop-blur-sm max-w-fit mx-auto">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>100% Free & Open Source</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 border-y border-white/5">
        <div className="container-app">
          <div className="text-center mb-20 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-white mb-6">
              Why Choose MoveMyPlaylist
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto font-light">
              Built for privacy-conscious music enthusiasts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative p-8 flex flex-col items-center text-center bg-white/[0.02] border border-white/10 rounded-[2rem] hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 hover:-translate-y-2 group shadow-glass"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]"></div>

                <div className="relative z-10 w-20 h-20 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-primary/5 rounded-[1.5rem] blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <feature.icon className="w-10 h-10 text-primary relative z-10" />
                </div>

                <h3 className="text-2xl font-display font-semibold text-white mb-4 relative z-10">
                  {feature.title}
                </h3>

                <p className="text-white/50 min-h-[60px] leading-relaxed mb-8 relative z-10">
                  {feature.description}
                </p>

                <div className="mt-auto relative z-10 inline-flex items-center justify-center bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-bold tracking-wide border border-primary/20">
                  {feature.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="relative z-10 py-32 border-b border-white/5"
      >
        <div className="container-app">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto font-light">
              A private, secure transfer using your own credentials.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-16 md:space-y-0 relative">
            {/* Vertical Line Gradient */}
            <div className="absolute left-[39px] md:left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent md:-translate-x-1/2 hidden md:block"></div>

            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-10 group">
              <div className="md:w-1/2 md:text-right order-2 md:order-1 md:pr-20">
                <h3 className="text-3xl font-display font-medium text-white mb-4 tracking-tight">
                  1. Bring Your Own Keys
                </h3>
                <p className="text-lg text-white/50 leading-relaxed font-light">
                  Provide your own Spotify and YouTube Developer API keys. This
                  ensures you never hit global rate limits and your credentials
                  remain entirely yours.
                </p>
              </div>
              <div className="flex-shrink-0 w-20 h-20 bg-black border-2 border-primary rounded-full flex items-center justify-center text-3xl font-black text-primary shadow-glow-primary relative z-10 order-1 md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 group-hover:scale-110 transition-transform duration-500">
                1
              </div>
              <div className="md:w-1/2 order-3 hidden md:block"></div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-10 md:mt-32 group">
              <div className="md:w-1/2 order-1 hidden md:block"></div>
              <div className="flex-shrink-0 w-20 h-20 bg-black border-2 border-primary rounded-full flex items-center justify-center text-3xl font-black text-primary shadow-glow-primary relative z-10 order-1 md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 group-hover:scale-110 transition-transform duration-500">
                2
              </div>
              <div className="md:w-1/2 md:text-left order-2 md:order-3 md:pl-20">
                <h3 className="text-3xl font-display font-medium text-white mb-4 tracking-tight">
                  2. Authenticate Securely
                </h3>
                <p className="text-lg text-white/50 leading-relaxed font-light">
                  Connect to your accounts. Everything happens in your browser
                  and current session. We store nothing permanently.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-10 md:mt-32 group">
              <div className="md:w-1/2 md:text-right order-2 md:order-1 md:pr-20">
                <h3 className="text-3xl font-display font-medium text-white mb-4 tracking-tight">
                  3. Rapid Transfer
                </h3>
                <p className="text-lg text-white/50 leading-relaxed font-light">
                  Our algorithm cross-references tracks and magically rebuilds
                  your playlist on the destination platform.
                </p>
              </div>
              <div className="flex-shrink-0 w-20 h-20 bg-black border-2 border-primary rounded-full flex items-center justify-center text-3xl font-black text-primary shadow-glow-primary relative z-10 order-1 md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 group-hover:scale-110 transition-transform duration-500">
                3
              </div>
              <div className="md:w-1/2 order-3 hidden md:block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative z-10 py-32 lg:py-48 px-4">
        <div className="container-app relative">
          <div className="relative max-w-7xl mx-auto rounded-[2.5rem] sm:rounded-[3rem] bg-white/[0.03] border border-white/10 p-8 sm:p-12 md:p-24 overflow-hidden shadow-glass">
            {/* Minimal Background Accents */}
            <div className="absolute -top-[200px] -left-[200px] w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div
              className="absolute -bottom-[200px] -right-[200px] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full"
              style={{ animationDelay: "2s" }}
            ></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="inline-flex items-center space-x-2 bg-black/40 border border-white/10 backdrop-blur-xl rounded-full px-5 py-2.5 mb-10 shadow-glass">
                <Music className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold tracking-widest text-white/90 uppercase">
                  Join the Revolution
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl md:text-7xl font-display font-black mb-6 sm:mb-8 leading-[1.1] tracking-tight text-white drop-shadow-2xl">
                Your Music.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  Your Rules.
                </span>
              </h2>

              <p className="text-lg md:text-2xl text-white/60 mb-10 sm:mb-14 max-w-2xl font-light leading-relaxed">
                Break down the walls between streaming platforms. Start moving
                your playlists instantly.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center">
                <Link
                  to="/transfer"
                  className="relative group inline-flex w-full sm:w-auto"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-black group-hover:bg-transparent transition-colors duration-300 inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-bold text-white rounded-full w-full">
                    <span>Start Moving Now</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </Link>

                <a
                  href="https://github.com/iamvs-2002/movemyplaylist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-semibold rounded-full bg-white/5 text-white border border-white/20 hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-md w-full sm:w-auto"
                >
                  <Github className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-white/70" />
                  <span>Star on GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
