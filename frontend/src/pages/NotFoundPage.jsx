import React from "react";
import { Link } from "react-router-dom";
import { Music, Home, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-mesh-dark opacity-30 z-0"></div>

      <div className="relative z-10 max-w-2xl w-full text-center animate-fade-in">
        <div className="mb-12 relative flex justify-center">
          <div className="absolute -inset-10 bg-primary/20 blur-[60px] rounded-full opacity-50"></div>
          <div className="relative text-[10rem] md:text-[15rem] font-black text-white/5 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 border border-primary/20 p-8 rounded-[2rem] backdrop-blur-xl shadow-glass transform hover:scale-105 transition-transform duration-500">
              <Music className="w-20 h-20 text-primary animate-bounce-slow" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-6 tracking-tight">
          Oops! Lost in the <span className="text-primary">Rythm?</span>
        </h1>
        
        <p className="text-xl text-white/50 mb-12 font-light leading-relaxed max-w-md mx-auto">
          The page you're searching for seems to have skipped a beat or moved to a different playlist.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            to="/"
            className="flex items-center space-x-3 bg-primary hover:bg-primary-600 text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-glow-primary group w-full sm:w-auto justify-center"
          >
            <Home className="w-5 h-5" />
            <span>Return Home</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-10 py-5 rounded-full font-bold text-lg transition-all backdrop-blur-md w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="mt-20 flex items-center justify-center space-x-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
           <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
           <span className="text-sm font-semibold tracking-widest text-white uppercase">MoveMyPlaylist</span>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
