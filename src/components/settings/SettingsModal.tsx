import React, { useState } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { storageService, NOTIFICATION_TONES, type NotificationToneId } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
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
  Clock
} from 'lucide-react';

export type AppTheme = 'dark' | 'light';

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
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  const [activeTab, setActiveTab] = useState<'accounts' | 'theme' | 'tutorial' | 'reminders'>('accounts');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<NotificationToneId>(() => storageService.getNotificationTone());
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    show: boolean;
    ids: string[];
  }>({ show: false, ids: [] });

  const handleSelectTone = (toneId: NotificationToneId) => {
    setSelectedTone(toneId);
    storageService.setNotificationTone(toneId);
    notificationService.playTonePreview(toneId);
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
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {t.settingsTitle}
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-sm">
                {userName ? `${userName} • ` : ''}{t.settingsSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-3 sm:px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-red-500 text-red-400 bg-red-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>{t.deleteAccountsTitle}</span>
            {prescriptions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {prescriptions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4 text-blue-400" />
            <span>{t.themeSettingsTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'tutorial'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-400" />
            <span>{t.tutorialSettingsTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'reminders'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="w-4 h-4 text-amber-400" />
            <span>Reminders & Sounds</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: ACCOUNTS MANAGEMENT & PERMANENT DELETION */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {/* Action Toolbar for Batch Selection */}
              {prescriptions.length > 0 && (
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
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
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all"
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
                          className="mt-1 text-slate-400 hover:text-white transition-colors shrink-0"
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
                          className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/60 transition-colors shrink-0"
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

          {/* TAB 2: THEME SELECTION */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 text-left">
                {t.settingsSubtitle}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Theme 1: Midnight Slate (Default) */}
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

                {/* Theme 2: Soft Daylight */}
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

          {/* TAB 3: GUIDANCE VIDEO TUTORIAL REPLAY */}
          {activeTab === 'tutorial' && (
            <div className="space-y-4 text-left">
              <div className="p-5 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
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
                    onClose();
                    onReplayTutorial();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>{t.watchTutorialButton}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: REMINDERS & SOUND SETTINGS */}
          {activeTab === 'reminders' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2.5 text-amber-400">
                  <Clock className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Morning Reminder Schedule (6:30 AM – 7:00 AM)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your daily full-course reminder arrives strictly between <strong>6:30 AM and 7:00 AM</strong> each morning so you can pack all your medicine strips before heading out for the day.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Active Window: 06:30 AM – 07:00 AM</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2.5 text-blue-400">
                  <BellRing className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Meal Reminders (5 to 10 Minutes Before)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Before-food and after-food reminders are delivered at least <strong>5 to 10 minutes in advance</strong>. This gives you time to take empty-stomach pills before eating, and to keep post-meal medicines ready right as your meal finishes.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="text-amber-400 block mb-0.5">🟡 Before Food:</span>
                    Sent 5–10 min before meal time
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="text-emerald-400 block mb-0.5">🟢 After Food:</span>
                    Sent 5–10 min before meal finishes
                  </div>
                </div>
              </div>

              {/* NOTIFICATION TONE SELECTOR */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Volume2 className="w-5 h-5 shrink-0" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Notification Tone / Reminder Sound
                      </h3>
                      <p className="text-xs text-slate-400">
                        Choose a soothing, pleasant tone — never loud, piercing, or disturbing
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
                    <span>🔔 Test Reminder Banner</span>
                  </button>
                </div>

                {/* Tone Options List */}
                <div className="space-y-2 pt-1">
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
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white truncate">
                                {tone.name}
                              </span>
                              {tone.isDefault && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800 shrink-0">
                                  Default
                                </span>
                              )}
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800 shrink-0 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Active</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
                          }`}
                          title={`Listen to ${tone.name}`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>🔊 Listen</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Access to Language & Name at the bottom of modal */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLanguageModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                title="Change language"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>🌐 {currentLangObj.nativeName} ({t.changeLanguage})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNameModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                title="Change user name"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span>👤 {userName || t.changeName}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onReplayTutorial();
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-bold flex items-center gap-2 border border-emerald-800/60 transition-colors cursor-pointer"
              title="Watch tutorial video"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span>🎥 {t.watchTutorialButton} (10s)</span>
            </button>
          </div>
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
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                {t.backButton}
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-1.5"
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
