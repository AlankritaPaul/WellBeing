import React, { useState } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { storageService } from '../../services/storageService';
import type { ScannedPrescription, Medication, DoseLogEntry } from '../../types/prescription';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  Pill,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Layers,
  X,
  FileCheck2
} from 'lucide-react';

interface DailyPillAccountabilityScreenProps {
  currentLanguage: string;
  userName?: string;
  activePrescription: ScannedPrescription | null;
  allPrescriptions: ScannedPrescription[];
  onSelectPrescription: (prescription: ScannedPrescription) => void;
  onBackToPrevious: () => void;
  onBackToCabinet?: () => void;
  onOpenPillsMenu?: () => void;
  onOpenDoctorReview?: () => void;
}

export const DailyPillAccountabilityScreen: React.FC<DailyPillAccountabilityScreenProps> = ({
  currentLanguage,
  userName = '',
  activePrescription,
  allPrescriptions,
  onSelectPrescription,
  onBackToPrevious,
  onBackToCabinet,
  onOpenPillsMenu,
  onOpenDoctorReview,
}) => {
  const t = getTranslation(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  const currentDoc: ScannedPrescription | null =
    activePrescription || (allPrescriptions.length > 0 ? allPrescriptions[0] : null);

  // Today Date string YYYY-MM-DD
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Logs state
  const [logsList, setLogsList] = useState<DoseLogEntry[]>(() => storageService.getDoseLogs());

  // Snooze Modal State
  const [snoozingItem, setSnoozingItem] = useState<{ med: Medication; slot: 'morning' | 'afternoon' | 'evening' | 'night'; scheduledTime: string } | null>(null);

  // Skip Modal State
  const [skippingItem, setSkippingItem] = useState<{ med: Medication; slot: 'morning' | 'afternoon' | 'evening' | 'night'; scheduledTime: string } | null>(null);

  if (!currentDoc) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 text-center text-slate-400">
        <p>{t.noLanguagesFound}</p>
      </div>
    );
  }

  const medicines = currentDoc.medicines || [];

  // Helper to determine which medicines belong to which time slot
  // Frequency e.g. "1-0-1" -> slot 0 (morning), slot 2 (night)
  // "1-1-1" -> slot 0 (morning), slot 1 (afternoon), slot 2 (night)
  // "1-0-0" -> slot 0 (morning)
  // "0-0-1" -> slot 2 (night)
  const getSlotMeds = (slotIndex: 0 | 1 | 2) => {
    return medicines.filter((med) => {
      const freq = med.frequency || '1-0-0';
      if (freq.includes('-')) {
        const parts = freq.split('-').map((p) => parseInt(p.trim(), 10) || 0);
        return parts[slotIndex] && parts[slotIndex] > 0;
      }
      return slotIndex === 0; // Default to morning
    });
  };

  const morningMeds = getSlotMeds(0);
  const afternoonMeds = getSlotMeds(1);
  const nightMeds = getSlotMeds(2);

  // Get log status for a specific med in a specific slot today
  const getDoseStatus = (medId: string, slot: 'morning' | 'afternoon' | 'evening' | 'night') => {
    const entry = logsList.find(
      (l) => l.date === todayDateStr && l.medicationId === medId && l.timeSlot === slot
    );
    return entry || null;
  };

  // Handle Dose Actions
  const handleTakeDose = (med: Medication, slot: 'morning' | 'afternoon' | 'evening' | 'night', scheduledTime: string) => {
    storageService.logDoseAction({
      prescriptionId: currentDoc.id,
      medicationId: med.id,
      medicationName: med.name,
      dosage: med.dosage,
      date: todayDateStr,
      timeSlot: slot,
      scheduledTime,
      status: 'taken',
    });
    setLogsList(storageService.getDoseLogs());
  };

  const handleConfirmSnooze = (duration: string) => {
    if (!snoozingItem) return;
    storageService.logDoseAction({
      prescriptionId: currentDoc.id,
      medicationId: snoozingItem.med.id,
      medicationName: snoozingItem.med.name,
      dosage: snoozingItem.med.dosage,
      date: todayDateStr,
      timeSlot: snoozingItem.slot,
      scheduledTime: snoozingItem.scheduledTime,
      status: 'delayed',
      delayedUntil: duration,
    });
    setLogsList(storageService.getDoseLogs());
    setSnoozingItem(null);
  };

  const handleConfirmSkip = (reason: string) => {
    if (!skippingItem) return;
    storageService.logDoseAction({
      prescriptionId: currentDoc.id,
      medicationId: skippingItem.med.id,
      medicationName: skippingItem.med.name,
      dosage: skippingItem.med.dosage,
      date: todayDateStr,
      timeSlot: skippingItem.slot,
      scheduledTime: skippingItem.scheduledTime,
      status: 'skipped',
      skipReason: reason,
    });
    setLogsList(storageService.getDoseLogs());
    setSkippingItem(null);
  };

  // Adherence Calculations for today
  const allScheduledToday = [
    ...morningMeds.map((m) => ({ med: m, slot: 'morning' as const })),
    ...afternoonMeds.map((m) => ({ med: m, slot: 'afternoon' as const })),
    ...nightMeds.map((m) => ({ med: m, slot: 'night' as const })),
  ];

  const totalScheduled = allScheduledToday.length;
  const takenCount = allScheduledToday.filter((item) => {
    const log = getDoseStatus(item.med.id, item.slot);
    return log?.status === 'taken';
  }).length;
  const delayedCount = allScheduledToday.filter((item) => {
    const log = getDoseStatus(item.med.id, item.slot);
    return log?.status === 'delayed';
  }).length;
  const skippedCount = allScheduledToday.filter((item) => {
    const log = getDoseStatus(item.med.id, item.slot);
    return log?.status === 'skipped';
  }).length;

  const scorePercent = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;

  // Render Dose Card Helper
  const renderDoseCard = (med: Medication, slot: 'morning' | 'afternoon' | 'evening' | 'night', scheduledTime: string) => {
    const log = getDoseStatus(med.id, slot);
    const isTaken = log?.status === 'taken';
    const isDelayed = log?.status === 'delayed';
    const isSkipped = log?.status === 'skipped';

    return (
      <div
        key={`${med.id}-${slot}`}
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
          isTaken
            ? 'bg-slate-900/60 border-emerald-800/60 shadow-md'
            : isDelayed
            ? 'bg-amber-950/40 border-amber-600/70 shadow-lg'
            : isSkipped
            ? 'bg-slate-950/80 border-slate-800 opacity-70'
            : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50 shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={`text-sm sm:text-base font-black ${isTaken ? 'text-slate-300 line-through' : 'text-white'}`}>
              {med.name}
            </h4>
            <p className="text-xs text-blue-300 font-bold mt-0.5">
              {med.dosage} • <span className="capitalize">{med.form}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {med.timing === 'before_food' ? t.timingBeforeFood : t.timingAfterFood}
            </p>
          </div>

          {/* Status Badge */}
          {isTaken && (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-950 border border-emerald-600/70 text-emerald-300 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.takePillButton}</span>
            </span>
          )}
          {isDelayed && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-950 border border-amber-600/70 text-amber-300 text-xs font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>+{log?.delayedUntil || '15m'}</span>
            </span>
          )}
          {isSkipped && (
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{t.skipDoseButton}</span>
            </span>
          )}
        </div>

        {/* Skipped reason display */}
        {isSkipped && log?.skipReason && (
          <p className="text-[11px] text-amber-300 font-medium pl-2 border-l-2 border-amber-600/60">
            {log.skipReason}
          </p>
        )}

        {/* 3-Button Smart Action Protocol */}
        {!isTaken && (
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => handleTakeDose(med, slot, scheduledTime)}
              className="py-2 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              <span>{t.takePillButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setSnoozingItem({ med, slot, scheduledTime })}
              className="py-2 px-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Clock className="w-3 h-3" />
              <span>{t.delayAlarmButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setSkippingItem({ med, slot, scheduledTime })}
              className="py-2 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all"
            >
              <X className="w-3 h-3" />
              <span>{t.skipDoseButton}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 animate-in fade-in duration-300 space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToPrevious}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            title={t.backToPrescriptionButton}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToPrescriptionButton}</span>
          </button>

          {onBackToCabinet && allPrescriptions.length > 1 && (
            <button
              type="button"
              onClick={onBackToCabinet}
              className="px-3 py-2 rounded-xl border border-blue-700/60 bg-blue-950/60 hover:bg-blue-900 text-blue-200 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              title={t.backToCabinetButton}
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>{t.backToCabinetButton}</span>
            </button>
          )}

          {onOpenPillsMenu && (
            <button
              type="button"
              onClick={onOpenPillsMenu}
              className="px-3 py-2 rounded-xl border border-blue-700/60 bg-blue-950/60 hover:bg-blue-900 text-blue-200 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Pill className="w-4 h-4 text-blue-400" />
              <span>{t.openPillsMenuButton}</span>
            </button>
          )}

          {onOpenDoctorReview && (
            <button
              type="button"
              onClick={onOpenDoctorReview}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>{t.openDoctorReviewButton}</span>
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{takenCount} / {totalScheduled} {t.takePillButton}</span>
        </div>
      </div>

      {/* Screen Title & Subtitle Banner */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t.accountabilityTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          {userName ? `${userName} • ` : ''}{t.accountabilitySubtitle}
        </p>
      </div>

      {/* Multi-Prescription Tabs (When patient has multiple accounts) */}
      {allPrescriptions.length > 1 && (
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 overflow-x-auto shadow-lg">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap pl-1">
            {t.switchPrescriptionLabel}:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {allPrescriptions.map((p, idx) => {
              const isSelected = p.id === currentDoc.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPrescription(p)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
                      : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-blue-950 text-blue-300 flex items-center justify-center text-[10px] font-mono">
                    {idx + 1}
                  </span>
                  <span>{p.hospitalName.slice(0, 22)}...</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MORNING AGENDA BLUEPRINT CARD (Summary & Packing List) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/40 border border-blue-800/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-bold">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>{t.morningBlueprintTitle}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
            {userName ? `${userName}, ` : ''}{currentLangObj.code === 'bn' ? 'আজকের ঔষধ সূচি' : 'Today\'s Medicine Agenda'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {currentDoc.hospitalName} • {currentDoc.doctorName}
          </p>
        </div>

        {/* Daily Adherence Metric Box */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-right min-w-[140px]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.adherenceScoreLabel}
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {scorePercent}%
          </p>
          <span className="text-[10px] text-slate-400 font-semibold">
            {takenCount} {currentLangObj.code === 'bn' ? 'টি নেওয়া হয়েছে' : 'doses completed'}
          </span>
        </div>
      </div>

      {/* STRIP PACKING CHECKLIST FOR GOING OUTSIDE */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
        <Briefcase className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-slate-300">
            {t.stripPackingListTitle}:
          </h4>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {medicines.map((m) => (
              <span
                key={m.id}
                className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-bold"
              >
                ✓ {m.name} ({m.frequency})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* TIME SLOTS: MORNING, AFTERNOON, NIGHT */}
      <div className="space-y-6">
        {/* Slot 1: Morning */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <span>{t.morningSlotLabel} (08:00 AM)</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              {morningMeds.length} {t.totalMedicinesCountLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {morningMeds.map((med) => renderDoseCard(med, 'morning', '08:00 AM'))}
          </div>
        </div>

        {/* Slot 2: Afternoon */}
        {afternoonMeds.length > 0 && (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sunset className="w-5 h-5 text-orange-400" />
                <span>{t.afternoonSlotLabel} (01:30 PM)</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold">
                {afternoonMeds.length} {t.totalMedicinesCountLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {afternoonMeds.map((med) => renderDoseCard(med, 'afternoon', '01:30 PM'))}
            </div>
          </div>
        )}

        {/* Slot 3: Night */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>{t.nightSlotLabel} (09:00 PM)</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              {nightMeds.length} {t.totalMedicinesCountLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nightMeds.map((med) => renderDoseCard(med, 'night', '09:00 PM'))}
          </div>
        </div>
      </div>

      {/* NIGHTLY COURSE SUMMARY CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>{t.nightlySummaryTitle}</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {currentLangObj.code === 'bn'
            ? 'সারাদিনে সময়মতো নেওয়া, দেরিতে নেওয়া ও বাদ দেওয়া ঔষধের সার্বিক পর্যালোচনা।'
            : 'Comprehensive log of on-time, delayed, and skipped medications for today.'}
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-center">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              {t.takenOnTimeDosesLabel}
            </span>
            <p className="text-xl font-black text-emerald-300 font-mono mt-0.5">
              {takenCount}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-center">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              {t.delayedDosesLabel}
            </span>
            <p className="text-xl font-black text-amber-300 font-mono mt-0.5">
              {delayedCount}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.skippedDosesLabel}
            </span>
            <p className="text-xl font-black text-slate-300 font-mono mt-0.5">
              {skippedCount}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: SNOOZE / DELAY ALARM MODAL */}
      {snoozingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-amber-600/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{t.snoozeModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSnoozingItem(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-bold text-white">
              {snoozingItem.med.name} ({snoozingItem.med.dosage})
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmSnooze('15m')}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-amber-600 hover:text-white border border-slate-800 text-slate-200 font-bold text-xs transition-colors flex items-center justify-between"
              >
                <span>{t.snooze15Min}</span>
                <span className="text-[11px] opacity-70">+15 mins</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSnooze('30m')}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-amber-600 hover:text-white border border-slate-800 text-slate-200 font-bold text-xs transition-colors flex items-center justify-between"
              >
                <span>{t.snooze30Min}</span>
                <span className="text-[11px] opacity-70">+30 mins</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSnooze('1h')}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-amber-600 hover:text-white border border-slate-800 text-slate-200 font-bold text-xs transition-colors flex items-center justify-between"
              >
                <span>{t.snooze1Hour}</span>
                <span className="text-[11px] opacity-70">+60 mins</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SKIP REASON MODAL */}
      {skippingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-red-700/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{t.skipReasonModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSkippingItem(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-bold text-white">
              {skippingItem.med.name} ({skippingItem.med.dosage})
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmSkip(t.skipReasonFasting)}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-red-950 border border-slate-800 hover:border-red-600/70 text-slate-200 text-left font-bold text-xs transition-colors"
              >
                • {t.skipReasonFasting}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSkip(t.skipReasonUpset)}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-red-950 border border-slate-800 hover:border-red-600/70 text-slate-200 text-left font-bold text-xs transition-colors"
              >
                • {t.skipReasonUpset}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSkip(t.skipReasonForgot)}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-red-950 border border-slate-800 hover:border-red-600/70 text-slate-200 text-left font-bold text-xs transition-colors"
              >
                • {t.skipReasonForgot}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSkip(t.skipReasonDoctorHold)}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-red-950 border border-slate-800 hover:border-red-600/70 text-slate-200 text-left font-bold text-xs transition-colors"
              >
                • {t.skipReasonDoctorHold}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
