import React, { useState } from 'react';
import { X, User, Check, Sparkles } from 'lucide-react';
import { getTranslation } from '../../i18n/translations';

interface NameChangeModalProps {
  currentName: string;
  currentLanguage: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveName: (name: string) => void;
}

export const NameChangeModal: React.FC<NameChangeModalProps> = ({
  currentName,
  currentLanguage,
  isOpen,
  onClose,
  onSaveName,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const t = getTranslation(currentLanguage);

  if (!isOpen) return null;

  const presets = t.presets || ['Dad', 'Mom', 'Grandpa', 'Grandma', 'Uncle', 'Aunty'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onSaveName(nameInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t.changeName}</h2>
            <p className="text-xs text-slate-400">{t.nameScreenTitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t.nameInputPlaceholder}
              className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl text-white outline-none focus:ring-4 focus:ring-emerald-500/20 text-lg transition-all"
              autoFocus
            />
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {t.quickSuggestions}
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNameInput(preset)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                    nameInput === preset
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
            >
              {t.backButton}
            </button>
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t.saveAndContinue}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
