import React, { useState, useMemo } from 'react';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { 
  Search, 
  Check, 
  X, 
  ArrowRight
} from 'lucide-react';

interface LanguageSelectScreenProps {
  currentLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({
  currentLanguage,
  onSelectLanguage,
  isModal = false,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState(currentLanguage || 'en');

  // Strict alphabetical filtering matching English name or native script
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ALL_LANGUAGES;

    return ALL_LANGUAGES.filter((lang) => 
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.region.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeLanguageObj = useMemo(() => {
    return ALL_LANGUAGES.find((l) => l.code === selectedCode) || ALL_LANGUAGES[0];
  }, [selectedCode]);

  const handleSelect = (code: string) => {
    setSelectedCode(code);
  };

  const handleConfirm = () => {
    onSelectLanguage(selectedCode);
    if (onClose) onClose();
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Dropdown-style Container Box as shown in Picture 2 */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header where 'Language' is written as requested */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <label className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-wide">
            Language
          </label>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Box exactly matching Picture 1 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative flex items-center w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 rounded-xl border-2 border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 italic outline-none"
              autoFocus
            />
            {/* Divider and Search Icon on the right as in Picture 1 */}
            <div className="flex items-center pl-2 shrink-0">
              <span className="h-5 w-[1.5px] bg-emerald-500/60 mr-2.5"></span>
              <Search className="w-5 h-5 text-emerald-500 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Vertical Dropdown List matching Picture 2 */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 select-none">
          {filteredLanguages.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No language found matching "{searchQuery}"
            </div>
          ) : (
            filteredLanguages.map((lang) => {
              const isSelected = selectedCode === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between text-sm sm:text-base transition-colors ${
                    isSelected
                      ? 'bg-blue-600 dark:bg-emerald-600 text-white font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {lang.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {lang.nativeName}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-white stroke-[3] shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Confirmation Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 flex items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Selected: <strong className="text-slate-900 dark:text-white">{activeLanguageObj.name} ({activeLanguageObj.nativeName})</strong>
          </div>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
          >
            <span>{activeLanguageObj.continueText || 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
