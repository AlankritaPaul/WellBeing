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

      {/* Center Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto my-auto">
        {/* Animated Beating Heart & Oscillating ECG Wave (Background Removed) */}
        <AnimatedHeartECG className="mb-4 sm:mb-6" theme={theme} />

        {/* Title: WellBeing */}
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-3">
          <span className={`bg-clip-text text-transparent ${
            theme === 'light'
              ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 font-black'
              : 'bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300'
          }`}>
            WellBeing
          </span>
        </h1>

        {/* Medical Prescription Graphic Below WellBeing */}
        <div className="mb-4 sm:mb-5 flex items-center justify-center">
          <img
            src="/images/medical_rx_icon.png"
            alt="WellBeing Medical Icon"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-lg select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Tagline */}
        <p className={`text-lg sm:text-2xl max-w-2xl mx-auto leading-relaxed mb-10 ${
          theme === 'light'
            ? 'text-slate-900 font-extrabold'
            : 'text-slate-300 font-medium'
        }`}>
          Your Personal Medical File Cabinet & Pill Accountability Companion.
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

      {/* Footer Below Start Button */}
      <footer className={`relative z-10 w-full py-6 px-6 text-center border-t backdrop-blur-md ${
        theme === 'light'
          ? 'border-slate-300 bg-white/95 text-slate-800 shadow-inner'
          : 'border-slate-800/60 bg-slate-950/40 text-slate-400'
      }`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p className={theme === 'light' ? 'font-bold text-slate-800' : 'font-medium text-slate-400'}>
            Designed & Developed by <strong className={`font-black ${theme === 'light' ? 'text-slate-950' : 'text-slate-200'}`}>Alankrita Paul</strong>
          </p>
          <p className={theme === 'light' ? 'font-bold text-slate-800' : 'text-slate-400'}>
            Personal Health Utility
          </p>
        </div>
      </footer>
    </div>
  );
};
