import React, { useState } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { storageService, NOTIFICATION_TONES, type NotificationToneId } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import { getSettingsLocalization } from '../../i18n/settingsTranslations';
import type { ScannedPrescription } from '../../types/prescription';
import {
  Settings,
  X,
  Trash2,
  Palette,
  Video,
  CheckCircle2,
  Building2,
  Calendar,
  Pill,
  Sun,
  Moon,
  CheckSquare,
  Square,
  Globe,
  User,
  ShieldCheck,
  BellRing,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check
} from 'lucide-react';

export type AppTheme = 'dark' | 'light';
export type SettingsSection = 'main' | 'tones' | 'theme' | 'tutorial' | 'accounts' | 'gemini';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  userName: string;
  theme: AppTheme;
  onSelectTheme: (newTheme: AppTheme) => void;
  prescriptions: ScannedPrescription[];
  onOpenLanguageModal: () => void;
  onOpenNameModal: () => void;
  onReplayTutorial: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  userName,
  theme,
  onSelectTheme,
  prescriptions,
  onOpenLanguageModal,
  onOpenNameModal,
  onReplayTutorial,
}) => {
  const t = getTranslation(currentLanguage);
  const sLoc = getSettingsLocalization(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  const [currentSection, setCurrentSection] = useState<SettingsSection>('main');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<NotificationToneId>(() => storageService.getNotificationTone());
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    show: boolean;
    ids: string[];
  }>({ show: false, ids: [] });

  const activeTone = NOTIFICATION_TONES.find((tone) => tone.id === selectedTone) || NOTIFICATION_TONES[0];

  const [apiKeyInput, setApiKeyInput] = useState<string>(() => storageService.getGeminiApiKey());
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);

  const handleSaveApiKey = () => {
    storageService.setGeminiApiKey(apiKeyInput.trim());
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2000);
  };

  const handleSelectTone = (toneId: NotificationToneId) => {
    setSelectedTone(toneId);
    storageService.setNotificationTone(toneId);
    notificationService.playTonePreview(toneId);
  };

  const handleClose = () => {
    setCurrentSection('main');
    onClose();
  };

  if (!isOpen) return null;

  // Toggle multi-select checkbox for an account
  const toggleSelectAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === prescriptions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(prescriptions.map((p) => p.id));
    }
  };

  // Initiate deletion confirmation
  const handleRequestDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    setConfirmDeleteModal({ show: true, ids });
  };

  // Confirm and execute deletion
  const handleConfirmDelete = () => {
    if (confirmDeleteModal.ids.length > 0) {
      storageService.deletePrescriptions(confirmDeleteModal.ids);
      setSelectedIds([]);
      setConfirmDeleteModal({ show: false, ids: [] });
    }
  };

  const selectedPrescriptionsList = prescriptions.filter((p) =>
    confirmDeleteModal.ids.includes(p.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL TOP HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          {currentSection === 'main' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {sLoc.settingsTitle}
                </h2>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentSection('main')}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  {sLoc.settingsMenuBack}
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  {currentSection === 'tones' && sLoc.notificationToneTitle}
                  {currentSection === 'theme' && sLoc.themeTitle}
                  {currentSection === 'tutorial' && sLoc.tutorialTitle}
                  {currentSection === 'accounts' && sLoc.deleteAccountsTitle}
                  {currentSection === 'gemini' && (currentLangObj.code === 'bn' ? 'এআই হাতের লেখা রিডার' : 'AI Handwriting Reader')}
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

          {/* 1. TOP-LEVEL VERTICAL LIST VIEW (UP TO DOWN) */}
          {currentSection === 'main' && (
            <div className="space-y-2.5 animate-in fade-in">
              <p className="text-xs font-semibold text-slate-400 pb-1">
                {sLoc.chooseOptionPrompt}
              </p>

              {/* Item 1: User Preferred Name */}
              <div
                onClick={() => {
                  handleClose();
                  onOpenNameModal();
                }}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {sLoc.userNameTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 text-[11px] font-bold border border-blue-800">
                        {userName || 'Maa'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {sLoc.userNameDesc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Item 2: App Language */}
              <div
                onClick={() => {
                  handleClose();
                  onOpenLanguageModal();
                }}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {sLoc.languageTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[11px] font-bold border border-emerald-800">
                        {currentLangObj.nativeName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {sLoc.languageDesc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Item 3: Notification Tone & Reminder Sound */}
              <div
                onClick={() => setCurrentSection('tones')}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {sLoc.notificationToneTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 text-[11px] font-bold border border-amber-800">
                        {activeTone.icon} {activeTone.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {sLoc.notificationToneDesc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Item 4: Display Theme */}
              <div
                onClick={() => setCurrentSection('theme')}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {sLoc.themeTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 text-[11px] font-bold border border-purple-800">
                        {theme === 'dark' ? t.themeMidnight : t.themeLight}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {sLoc.themeDesc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Item 5: 10-Second Guidance Video (No badge) */}
              <div
                onClick={() => setCurrentSection('tutorial')}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/60 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm sm:text-base">
                      {sLoc.tutorialTitle}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {sLoc.tutorialDesc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Item 6: Manage & Delete Accounts (No badge) */}
              <div
                onClick={() => setCurrentSection('accounts')}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-red-500/60 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm sm:text-base">
                      {sLoc.deleteAccountsTitle}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {sLoc.deleteAccountsDesc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Item 7: AI Prescription Vision Scanner (Doctor Handwriting Reader) */}
              <div
                onClick={() => setCurrentSection('gemini')}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        {currentLangObj.code === 'bn' ? 'এআই হাতের লেখা রিডার' : 'AI Handwriting Reader'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        apiKeyInput
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      }`}>
                        {apiKeyInput ? '✓ Active' : 'Free Setup'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {currentLangObj.code === 'bn'
                        ? 'ডাক্তারদের পেঁচানো ও অস্পষ্ট হাতের লেখা পড়ার প্রযুক্তি'
                        : 'Decipher messy doctor cursive handwriting with Vision AI'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          )}

          {/* 2. SUBVIEW: NOTIFICATION TONE & REMINDER SOUND */}
          {currentSection === 'tones' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <Volume2 className="w-5 h-5 shrink-0" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {sLoc.notificationToneHeader}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {sLoc.notificationToneSub}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      notificationService.sendTestSampleReminder(userName);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <BellRing className="w-4 h-4" />
                    <span>🔔 {sLoc.testBannerButton}</span>
                  </button>
                </div>

                {/* Tone Options List */}
                <div className="space-y-2.5 pt-1">
                  {NOTIFICATION_TONES.map((tone) => {
                    const isSelected = selectedTone === tone.id;
                    return (
                      <div
                        key={tone.id}
                        onClick={() => handleSelectTone(tone.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-md shadow-emerald-950/30'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0 select-none">{tone.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white">
                                {tone.name}
                              </span>
                              {tone.isDefault && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800">
                                  {sLoc.defaultBadge}
                                </span>
                              )}
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>{sLoc.activeBadge}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {tone.description}
                            </p>
                          </div>
                        </div>

                        {/* Dedicated Preview Play Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTone(tone.id);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
                          }`}
                          title={`Listen to ${tone.name}`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>🔊 {sLoc.listenButton}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. SUBVIEW: DISPLAY THEME */}
          {currentSection === 'theme' && (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-400 text-left">
                Select your preferred interface color mode:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Midnight Slate (Dark) */}
                <div
                  onClick={() => onSelectTheme('dark')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 text-left ${
                    theme === 'dark'
                      ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/30'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {t.themeMidnight}
                      </span>
                      {theme === 'dark' && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Clinical deep slate dark mode, gentle on eyes.
                    </p>
                  </div>
                </div>

                {/* Soft Daylight (Light) */}
                <div
                  onClick={() => onSelectTheme('light')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 text-left ${
                    theme === 'light'
                      ? 'bg-slate-200 border-amber-500 ring-2 ring-amber-500/30 text-slate-950'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                        {t.themeLight}
                      </span>
                      {theme === 'light' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>
                      High clarity daytime mode for bright room viewing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. SUBVIEW: GUIDANCE VIDEO TUTORIAL REPLAY */}
          {currentSection === 'tutorial' && (
            <div className="space-y-4 text-left animate-in fade-in">
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {t.tutorialSettingsTitle}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t.tutorialSubtitle}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs text-slate-300 font-semibold">{t.finalNoteFlat}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-slate-300 font-semibold">{t.finalNoteLight}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onReplayTutorial();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 active:scale-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>{t.watchTutorialButton} (10s)</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. SUBVIEW: MANAGE & PERMANENT DELETE ACCOUNTS */}
          {currentSection === 'accounts' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Action Toolbar for Batch Selection */}
              {prescriptions.length > 0 && (
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {selectedIds.length === prescriptions.length ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                        <span>{t.deselectAllAccounts}</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 text-slate-400" />
                        <span>{t.selectAllAccounts}</span>
                      </>
                    )}
                  </button>

                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(selectedIds)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.deleteSelectedButton} ({selectedIds.length})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Accounts List */}
              {prescriptions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Building2 className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold">{t.noAccountsToDelete}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription, idx) => {
                    const isChecked = selectedIds.includes(prescription.id);
                    const medCount = prescription.medicines?.length || 0;

                    return (
                      <div
                        key={prescription.id}
                        className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 text-left relative ${
                          isChecked
                            ? 'bg-red-950/30 border-red-700/60 shadow-lg shadow-red-950/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Multi-Select Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleSelectAccount(prescription.id)}
                          className="mt-1 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                          title="Select account"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-red-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 text-[11px] font-mono font-bold border border-blue-800">
                                #{idx + 1}
                              </span>
                              <h3 className="font-bold text-white text-sm sm:text-base truncate">
                                {prescription.hospitalName}
                              </h3>
                            </div>

                            {/* Clinical Reason Tag */}
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold">
                                {t.courseCompletedTag}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium hidden sm:inline">
                                {t.noLongerNeededTag}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                            <span>{prescription.doctorName}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {prescription.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5 text-blue-400" />
                              {medCount} {t.totalMedicinesCountLabel}
                            </span>
                          </div>
                        </div>

                        {/* Individual Trash Button */}
                        <button
                          type="button"
                          onClick={() => handleRequestDelete([prescription.id])}
                          className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/60 transition-colors shrink-0 cursor-pointer"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 6. SUBVIEW: AI PRESCRIPTION HANDWRITING READER (GEMINI VISION) */}
          {currentSection === 'gemini' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">
                      {currentLangObj.code === 'bn'
                        ? 'ডাক্তারদের হাতের লেখা পড়ার এআই ইঞ্জিন'
                        : 'Doctor Handwriting Vision AI Engine'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {currentLangObj.code === 'bn'
                        ? 'ডাক্তারদের পেঁচানো ও অস্পষ্ট হাতের লেখা সঠিক ওষুধের নামসহ বুঝতে গুগল জেমিনাই ভিশন এআই ব্যবহার করুন। এটি ১০০% বিনামূল্যে ব্যবহারযোগ্য।'
                        : 'Decipher messy doctor cursive handwriting, dosages, and instructions with Google Gemini Vision AI. 100% free forever with zero payment required.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    {currentLangObj.code === 'bn' ? 'গুগল জেমিনাই এপিআই কি (API Key)' : 'Google Gemini API Key'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Paste your free API key here (AIzaSy...)"
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      {isKeySaved ? '✓ Saved!' : 'Save Key'}
                    </button>
                  </div>
                  {apiKeyInput && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold pt-1">
                      <Check className="w-4 h-4" />
                      <span>{currentLangObj.code === 'bn' ? 'এআই হাতের লেখা রিডার সক্রিয়' : 'AI Handwriting Reader Active & Ready'}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 space-y-2">
                  <span className="font-bold text-cyan-300 block">
                    {currentLangObj.code === 'bn' ? 'বিনামূল্যে কীভাবে এপিআই কি পাবেন:' : 'How to get your free key in 10 seconds:'}
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>
                      Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-bold">aistudio.google.com/apikey</a>
                    </li>
                    <li>Click <strong>&quot;Create API key&quot;</strong> with your Google account.</li>
                    <li>Copy and paste it into the box above, then tap <strong>Save Key</strong>.</li>
                  </ol>
                  <p className="text-[10px] text-slate-400 italic pt-1">
                    * Your API key is stored 100% locally on your device in private storage. It is never transmitted to any third party.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CONFIRMATION MODAL FOR PERMANENT DELETION */}
      {confirmDeleteModal.show && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-red-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {confirmDeleteModal.ids.length > 1
                  ? t.deleteSelectedButton
                  : t.deleteAccountButton}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmDeleteModal.ids.length > 1
                  ? t.deleteAccountConfirmMultiple
                  : t.deleteAccountConfirmSingle}
              </p>
            </div>

            {/* List of accounts about to be deleted */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left max-h-36 overflow-y-auto space-y-2">
              {selectedPrescriptionsList.map((p) => (
                <div key={p.id} className="text-xs border-b border-slate-800/80 pb-1.5 last:border-b-0 last:pb-0">
                  <div className="font-bold text-white truncate">{p.hospitalName}</div>
                  <div className="text-slate-400 text-[11px] truncate">{p.doctorName}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal({ show: false, ids: [] })}
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                {t.backButton}
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.deleteAccountButton}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
