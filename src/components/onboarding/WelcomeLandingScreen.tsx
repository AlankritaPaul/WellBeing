import React from 'react';
import { ArrowRight, Sun, Moon, Sparkles } from 'lucide-react';
import { AnimatedHeartECG } from '../common/AnimatedHeartECG';

interface WelcomeLandingScreenProps {
  onStart: () => void;
  theme: 'dark' | 'light' | 'emerald' | 'contrast';
  onToggleTheme: () => void;
}

export const WelcomeLandingScreen: React.FC<WelcomeLandingScreenProps> = ({
  onStart,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden select-none">
      {/* Animated Medical Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Top Bar with Theme Changing Option */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-emerald-400 font-bold text-lg tracking-tight">
          WellBeing
        </div>

        {/* Theme Changing Button */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/50 text-xs sm:text-sm font-semibold transition-all backdrop-blur-md shadow-lg"
          title="Change Theme"
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-4 h-4 text-amber-300" />
              <span>Theme: Dark</span>
            </>
          ) : theme === 'light' ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Theme: Light</span>
            </>
          ) : theme === 'emerald' ? (
            <>
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Theme: Emerald</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Theme: Contrast</span>
            </>
          )}
        </button>
      </header>

      {/* Center Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto my-auto">
        {/* Animated Beating Heart & Oscillating ECG Wave (Background Removed) */}
        <AnimatedHeartECG className="mb-4 sm:mb-6" />

        {/* Title: WellBeing */}
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-4">
          <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
            WellBeing
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-2xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
          Your Personal Medical File Cabinet & Pill Accountability Companion.
        </p>

        {/* Start Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 text-xl font-extrabold rounded-3xl shadow-2xl shadow-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3.5 ring-4 ring-emerald-400/30"
          >
            <span>Start</span>
            <div className="w-8 h-8 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5 text-slate-950 stroke-[3]" />
            </div>
          </button>
        </div>
      </main>

      {/* Footer Below Start Button */}
      <footer className="relative z-10 w-full py-6 px-6 text-center border-t border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p className="font-medium">
            Designed & Developed by <strong className="text-slate-200 font-bold">Alankrita Paul</strong>
          </p>
          <p className="text-slate-400">
            Personal Health Utility
          </p>
        </div>
      </footer>
    </div>
  );
};
