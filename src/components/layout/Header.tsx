import React from 'react';
import { Globe, User, Smartphone, Monitor } from 'lucide-react';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { getTranslation } from '../../i18n/translations';

interface HeaderProps {
  currentLanguage: string;
  userName: string;
  onOpenLanguageModal: () => void;
  onOpenNameModal: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  userName,
  onOpenLanguageModal,
  onOpenNameModal,
  isMobileFrame,
  onToggleMobileFrame,
}) => {
  const t = getTranslation(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-950/40">
            W
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                {t.appName}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {t.appTagline}
            </p>
          </div>
        </div>

        {/* Change Language & Name Action Buttons (Changeable Anytime) */}
        <div className="flex items-center gap-2">
          {/* Change Language Button */}
          <button
            onClick={onOpenLanguageModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/50 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            title={t.changeLanguage}
          >
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/80">
              {currentLangObj.nativeName}
            </span>
          </button>

          {/* Change Name Button */}
          <button
            onClick={onOpenNameModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            title={t.changeName}
          >
            <User className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="hidden xs:inline">{userName || t.changeName}</span>
          </button>

          {/* Device Frame Viewport Toggle */}
          <button
            onClick={onToggleMobileFrame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            title={isMobileFrame ? "Switch to Fullscreen Responsive View" : "Switch to Smartphone Mockup Frame"}
          >
            {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
