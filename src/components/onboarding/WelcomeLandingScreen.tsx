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
        <div className={`font-black text-lg tracking-tight ${
          theme === 'light' ? 'text-emerald-900' : 'text-emerald-400'
        }`}>
          WellBeing
        </div>

        {/* Theme Changing Button */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all backdrop-blur-md shadow-md ${
            theme === 'light'
              ? 'bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 ring-1 ring-slate-200'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/50'
          }`}
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

      {/* Center Hero Content (Full Viewport Focus) */}
      <main className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-10 text-center max-w-4xl mx-auto my-auto">
        {/* Animated Beating Heart & Oscillating ECG Wave (Background Removed) */}
        <AnimatedHeartECG className="mb-4 sm:mb-6" theme={theme} />

        {/* Title: WellBeing (Focused hero size with animated dual color contrast, word stays completely still) */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-2 sm:mb-3 select-none">
          <span className={theme === 'light' ? 'animate-dual-color-light' : 'animate-dual-color-dark'}>
            WellBeing
          </span>
        </h1>

        {/* Medical Prescription Graphic Below WellBeing */}
        <div className="mb-4 sm:mb-5 flex items-center justify-center">
          <img
            src="/images/medical_rx_icon.png"
            alt="WellBeing Medical Icon"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-xl select-none pointer-events-none transition-transform duration-300 hover:scale-105"
            draggable={false}
          />
        </div>

        {/* Slogan directly on Landing Page */}
        <h2 className={`text-xl sm:text-2xl md:text-3xl max-w-2xl mx-auto font-black tracking-tight mb-2 sm:mb-3 ${
          theme === 'light' ? 'text-slate-950 font-black' : 'text-white font-black'
        }`}>
          More Than Medicine, A Commitment to Care
        </h2>

        {/* Tagline */}
        <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 ${
          theme === 'light' ? 'text-slate-800 font-bold' : 'text-slate-300 font-medium'
        }`}>
          Your Personal Medical File Cabinet &amp; Pill Accountability Companion.
        </p>

        {/* Start Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className={`group relative px-10 py-5 text-xl font-black rounded-3xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3.5 ${
              theme === 'light'
                ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 hover:from-emerald-800 hover:via-teal-800 hover:to-cyan-900 text-white shadow-emerald-950/25 ring-4 ring-emerald-600/40'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/40 ring-4 ring-emerald-400/30'
            }`}
          >
            <span>Start</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform ${
              theme === 'light' ? 'bg-white/20' : 'bg-slate-950/20'
            }`}>
              <ArrowRight className={`w-5 h-5 stroke-[3] ${theme === 'light' ? 'text-white' : 'text-slate-950'}`} />
            </div>
          </button>
        </div>
      </main>

      {/* Substantial, Prominent Footer Portion (Scroll Down to View) */}
      <footer className={`relative z-10 w-full py-14 sm:py-20 px-6 text-center border-t-2 backdrop-blur-md transition-colors ${
        theme === 'light'
          ? 'border-slate-300 bg-white/95 text-slate-800 shadow-2xl'
          : 'border-slate-800 bg-slate-950/95 text-slate-300 shadow-2xl'
      }`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-base sm:text-lg">
          <p className={`font-black tracking-tight text-lg sm:text-xl ${
            theme === 'light' ? 'text-slate-950 font-black' : 'text-white font-black'
          }`}>
            A Little More Care in Every Part of Life
          </p>
          <p className={`text-sm sm:text-base font-semibold ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-400'
          }`}>
            100% On-Device Medical Utility
          </p>
        </div>
      </footer>
    </div>
  );
};
