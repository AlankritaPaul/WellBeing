import React, { useState } from 'react';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { getTranslation } from '../../i18n/translations';
import { 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Heart,
  FastForward
} from 'lucide-react';

interface PreferredNameScreenProps {
  currentLanguage: string;
  initialName?: string;
  onSaveName: (name: string) => void;
  onSkip: () => void;
  onBackToLanguage: () => void;
}

export const PreferredNameScreen: React.FC<PreferredNameScreenProps> = ({
  currentLanguage,
  initialName = '',
  onSaveName,
  onSkip,
  onBackToLanguage,
}) => {
  const [nameInput, setNameInput] = useState(initialName);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];
  const t = getTranslation(currentLanguage);

  const presets = t.presets || ['Dad', 'Mom', 'Grandpa', 'Grandma', 'Uncle', 'Aunty'];

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    setNameInput(preset);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameInput(e.target.value);
    setSelectedPreset(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nameInput.trim();
    if (finalName) {
      onSaveName(finalName);
    } else {
      onSkip();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Rectangular Container Box */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header with Back, Page 2 Badge, Active Language, and Skip button */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLanguage}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors flex items-center gap-1 text-xs sm:text-sm font-semibold"
              title={t.backButton}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backButton}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 font-bold">
              {currentLangObj.nativeName}
            </span>
            {/* Quick Skip button in Header */}
            <button
              type="button"
              onClick={onSkip}
              className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
              title={t.skipButton}
            >
              <span>{t.skipButton}</span>
              <FastForward className="w-3.5 h-3.5 text-emerald-500" />
            </button>
          </div>
        </div>

        {/* Main Content Area in Chosen Language */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Avatar Icon */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 shadow-inner">
            <User className="w-8 h-8 stroke-[2.2]" />
          </div>

          {/* Title in Chosen Language */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-snug">
            {t.nameScreenTitle}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={handleInputChange}
                  placeholder={t.nameInputPlaceholder}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-950 text-base sm:text-lg text-slate-900 dark:text-white placeholder-slate-400 border-2 border-emerald-500 rounded-xl focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all shadow-sm font-medium"
                  autoFocus
                />
                {nameInput.trim() && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tap Presets */}
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t.quickSuggestions}</span>
              </label>
              
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => {
                  const isActive = selectedPreset === preset || nameInput === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-xl border-2 transition-all font-semibold flex items-center gap-1.5 active:scale-95 ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                          : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isActive ? 'fill-current text-white' : 'text-slate-400'}`} />
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action Buttons: Back, Skip, Continue */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onBackToLanguage}
                className="px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.backButton}</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Secondary Skip button at bottom */}
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
                >
                  {t.skipButton}
                </button>

                {/* Primary Continue button */}
                <button
                  type="submit"
                  disabled={!nameInput.trim()}
                  className="px-5 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-xs sm:text-sm"
                >
                  <span>{currentLangObj.continueText || t.saveAndContinue || 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
