import React, { useState } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
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
  X,
  FileCheck2,
  Bell,
  BellRing,
  Volume2
} from 'lucide-react';

interface DailyPillAccountabilityScreenProps {
  currentLanguage: string;
  userName?: string;
  theme?: 'dark' | 'light';
  activePrescription: ScannedPrescription | null;
  allPrescriptions: ScannedPrescription[];
  onSelectPrescription: (prescription: ScannedPrescription) => void;
  onBackToPrevious: () => void;
  onOpenPillsMenu?: () => void;
  onOpenDoctorReview?: () => void;
}

export const DailyPillAccountabilityScreen: React.FC<DailyPillAccountabilityScreenProps> = ({
  currentLanguage,
  userName = '',
  theme = 'dark',
  activePrescription,
  allPrescriptions,
  onSelectPrescription,
  onBackToPrevious,
  onOpenPillsMenu,
  onOpenDoctorReview,
}) => {
  const isLight = theme === 'light';
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
  const [customSkipReason, setCustomSkipReason] = useState<string>('');

  // Device Notification State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => notificationService.getPermission());
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const handleEnableNotifications = async () => {
    const perm = await notificationService.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      notificationService.playAlertChime();
      setTestFeedback(currentLangObj.code === 'bn' ? '✅ নোটিফিকেশন চালু হয়েছে! অ্যালার্ট সাউন্ড পরীক্ষা করা হয়েছে।' : '✅ Notifications enabled! Medical chime sounded.');
      setTimeout(() => setTestFeedback(null), 4000);
    }
  };

  const handleTestBeforeFoodAlert = () => {
    if (notifPermission !== 'granted') {
      handleEnableNotifications();
      return;
    }
    const meds = currentDoc?.medicines || [];
    const beforeMed = meds.find((m) => m.timing === 'before_food') || meds[0];
    if (!beforeMed) return;
    notificationService.sendSingleMedicineReminder(userName, beforeMed, 'Morning (07:30 AM Before Breakfast)', 'morning');
    setTestFeedback(currentLangObj.code === 'bn' ? `খাওয়ার আগের ওষুধের নোটিফিকেশন পাঠানো হয়েছে (${beforeMed.name})` : `Sent: Take this medicine before your food (${beforeMed.name})`);
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestAfterFoodAlert = () => {
    if (notifPermission !== 'granted') {
      handleEnableNotifications();
      return;
    }
    const meds = currentDoc?.medicines || [];
    const afterMed = meds.find((m) => m.timing !== 'before_food') || meds[1] || meds[0];
    if (!afterMed) return;
    notificationService.sendSingleMedicineReminder(userName, afterMed, 'Morning (08:30 AM After Breakfast)', 'morning');
    setTestFeedback(currentLangObj.code === 'bn' ? `খাওয়ার পরের ওষুধের নোটিফিকেশন পাঠানো হয়েছে (${afterMed.name})` : `Sent: Take this medicine after your food (${afterMed.name})`);
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestMorningBriefing = () => {
    if (notifPermission !== 'granted') {
      handleEnableNotifications();
      return;
    }
    if (!currentDoc) return;
    notificationService.sendMorningBriefing(userName, currentDoc);
    setTestFeedback(currentLangObj.code === 'bn' ? '☀️ সকালের পুরো দিনের ওষুধের তালিকা পাঠানো হয়েছে!' : '☀️ Morning Course Plan briefing sent to device!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  const handleTestNightSummary = () => {
    if (notifPermission !== 'granted') {
      handleEnableNotifications();
      return;
    }
    notificationService.sendNightSummary(userName, totalScheduled, takenCount, delayedCount, skippedCount);
    setTestFeedback(currentLangObj.code === 'bn' ? '🌙 রাতের সারাদিনের রিপোর্ট পাঠানো হয়েছে (ডাক্তারকে দেখানোর জন্য জমা থাকবে)!' : '🌙 Bedtime Adherence summary sent (saved for doctor visit)!');
    setTimeout(() => setTestFeedback(null), 4000);
  };

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
            ? isLight
              ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
              : 'bg-slate-900/60 border-emerald-800/60 shadow-md'
            : isDelayed
            ? isLight
              ? 'bg-amber-50 border-amber-300 shadow-sm'
              : 'bg-amber-950/40 border-amber-600/70 shadow-lg'
            : isSkipped
            ? isLight
              ? 'bg-slate-100 border-slate-300 opacity-80'
              : 'bg-slate-950/80 border-slate-800 opacity-70'
            : isLight
            ? 'bg-white border-2 border-slate-200 shadow-sm hover:border-blue-400'
            : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50 shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={`text-sm sm:text-base font-black ${
              isTaken
                ? isLight ? 'text-slate-500 line-through' : 'text-slate-300 line-through'
                : isLight ? 'text-slate-950' : 'text-white'
            }`}>
              {med.name}
            </h4>
            <p className={`text-xs font-bold mt-0.5 ${isLight ? 'text-blue-800' : 'text-blue-300'}`}>
              {med.dosage} • <span className="capitalize">{med.form}</span>
            </p>
            <p className={`text-[11px] mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {med.timing === 'before_food' ? t.timingBeforeFood : t.timingAfterFood}
            </p>
          </div>

          {/* Status Badge */}
          {isTaken && (
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
              isLight
                ? 'bg-emerald-100 border border-emerald-400 text-emerald-900'
                : 'bg-emerald-950 border border-emerald-600/70 text-emerald-300'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.takePillButton}</span>
            </span>
          )}
          {isDelayed && (
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
              isLight
                ? 'bg-amber-100 border border-amber-400 text-amber-900'
                : 'bg-amber-950 border border-amber-600/70 text-amber-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>+{log?.delayedUntil || '15m'}</span>
            </span>
          )}
          {isSkipped && (
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
              isLight
                ? 'bg-slate-200 border border-slate-300 text-slate-800'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{t.skipDoseButton}</span>
            </span>
          )}
        </div>

        {/* Skipped reason display */}
        {isSkipped && log?.skipReason && (
          <p className={`text-[11px] font-medium pl-2 border-l-2 ${
            isLight ? 'text-amber-800 border-amber-500' : 'text-amber-300 border-amber-600/60'
          }`}>
            {log.skipReason}
          </p>
        )}

        {/* 3-Button Smart Action Protocol */}
        {!isTaken && (
          <div className={`grid grid-cols-3 gap-1.5 pt-2 border-t ${
            isLight ? 'border-slate-200' : 'border-slate-800/80'
          }`}>
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
              className={`py-2 px-1.5 rounded-xl border font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all ${
                isLight
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                  : 'bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{t.delayAlarmButton}</span>
            </button>

            <button
              type="button"
              onClick={() => setSkippingItem({ med, slot, scheduledTime })}
              className={`py-2 px-1.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white'
              }`}
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
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToPrevious}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300'
                : 'border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
            }`}
            title={t.backButton}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backButton}</span>
          </button>

          {onOpenPillsMenu && (
            <button
              type="button"
              onClick={onOpenPillsMenu}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300'
                  : 'border border-blue-700/60 bg-blue-950/60 hover:bg-blue-900 text-blue-200'
              }`}
            >
              <Pill className={`w-4 h-4 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
              <span>{t.openPillsMenuButton}</span>
            </button>
          )}

          {onOpenDoctorReview && (
            <button
              type="button"
              onClick={onOpenDoctorReview}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300'
                  : 'border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
              }`}
              title={t.openDoctorReviewButton}
            >
              <FileCheck2 className={`w-4 h-4 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
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
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
          isLight ? 'text-slate-950 font-black' : 'text-white'
        }`}>
          {t.accountabilityTitle}
        </h1>
        <p className={`text-xs sm:text-sm max-w-2xl font-semibold ${
          isLight ? 'text-slate-700' : 'text-slate-400'
        }`}>
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

      {/* PATIENT DEVICE NOTIFICATION & ALARM CENTER */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 shadow-xl transition-all ${
        isLight
          ? notifPermission === 'granted'
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-emerald-100/50'
            : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-amber-100/50'
          : notifPermission === 'granted'
          ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
          : 'bg-amber-950/40 border-amber-600/70 text-amber-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
              notifPermission === 'granted'
                ? isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : isLight
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
            }`}>
              {notifPermission === 'granted' ? (
                <BellRing className="w-6 h-6 animate-pulse" />
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-black tracking-tight ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}>
                  {currentLangObj.code === 'bn' ? '🔔 মোবাইল ও কম্পিউটার নোটিফিকেশন অ্যালার্ম' : '🔔 Device Reminders & Alarm Notifications'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  notifPermission === 'granted'
                    ? isLight
                      ? 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                      : 'bg-emerald-900/80 text-emerald-300 border border-emerald-600'
                    : isLight
                    ? 'bg-amber-200 text-amber-900 border border-amber-400'
                    : 'bg-amber-900/80 text-amber-300 border border-amber-600'
                }`}>
                  {notifPermission === 'granted' ? 'Active' : 'Action Needed'}
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl font-medium ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                {notifPermission === 'granted'
                  ? (currentLangObj.code === 'bn'
                      ? 'সম্পূর্ণ স্বয়ংক্রিয়: ঘড়ির সময় অনুযায়ী মোবাইল রিং করবে এবং সরাসরি স্ক্রিনে Taken, Delay ও Skip এর পপআপ বক্স চলে আসবে। কোনো বোতাম টেপার প্রয়োজন নেই।'
                      : 'Runs 100% automatically in the background: your phone/device will ring loud at dose times, and an instant alert box will pop up on your screen with Taken, Delay, and Skip options without needing to click around!')
                  : (currentLangObj.code === 'bn'
                      ? 'একটি ওষুধও যেন বাদ না পড়ে — সকালে বের হওয়ার আগে পুরো তালিকা, সঠিক সময়ে উচ্চস্বরে অ্যালার্ট এবং রাতের রিপোর্ট পেতে অনুমতি দিন।'
                      : 'Never miss a single dose. Enable device notifications to receive morning packing plans, loud dose chime alerts, and nightly doctor compliance reports.')}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          {notifPermission !== 'granted' && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/30 transition-all shrink-0"
            >
              <Bell className="w-4 h-4" />
              <span>{currentLangObj.code === 'bn' ? 'নোটিফিকেশন চালু করুন' : 'Enable Device Notifications'}</span>
            </button>
          )}
        </div>

        {/* Live Test Controls (Visible when active) */}
        {notifPermission === 'granted' && (
          <div className={`mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'border-emerald-200' : 'border-emerald-800/60'
          }`}>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${
              isLight ? 'text-emerald-900' : 'text-emerald-300'
            }`}>
              <Volume2 className="w-4 h-4 text-emerald-500" />
              <span>{currentLangObj.code === 'bn' ? 'সাউন্ড ও অ্যালার্মের ভলিউম পরীক্ষা করুন:' : 'Preview Alarm & Test Volume:'}</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTestBeforeFoodAlert}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isLight
                    ? 'bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 shadow-sm'
                    : 'bg-amber-950/60 hover:bg-amber-900 text-amber-200 border border-amber-700/60'
                }`}
                title="Ring alarm for a single medicine BEFORE food"
              >
                <span>Test "Take Before Food"</span>
              </button>

              <button
                type="button"
                onClick={handleTestAfterFoodAlert}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isLight
                    ? 'bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm'
                    : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60'
                }`}
                title="Send notification for a single medicine AFTER food"
              >
                <span>Test "Take After Food"</span>
              </button>

              <button
                type="button"
                onClick={handleTestMorningBriefing}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isLight
                    ? 'bg-white hover:bg-blue-100 text-blue-950 border border-blue-300 shadow-sm'
                    : 'bg-blue-950/60 hover:bg-blue-900 text-blue-200 border border-blue-700/60'
                }`}
                title="Preview 8:00 AM morning full day packing briefing"
              >
                <span>☀️ Preview Morning Plan</span>
              </button>

              <button
                type="button"
                onClick={handleTestNightSummary}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isLight
                    ? 'bg-white hover:bg-purple-100 text-purple-950 border border-purple-300 shadow-sm'
                    : 'bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-700/60'
                }`}
                title="Preview bedtime adherence summary report"
              >
                <span>🌙 Preview Bedtime Report</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Alert toast */}
        {testFeedback && (
          <div className="mt-3 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testFeedback}</span>
          </div>
        )}
      </div>

      {/* MORNING AGENDA BLUEPRINT CARD (Summary & Packing List) */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
        isLight
          ? 'bg-gradient-to-br from-blue-50 via-white to-blue-100/60 border-2 border-blue-200'
          : 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/40 border border-blue-800/50'
      }`}>
        <div className="space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
            isLight
              ? 'bg-blue-100 border border-blue-300 text-blue-900'
              : 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
          }`}>
            <Sun className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <span>{t.morningBlueprintTitle}</span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black leading-snug ${
            isLight ? 'text-slate-950' : 'text-white'
          }`}>
            {userName ? `${userName}, ` : ''}{currentLangObj.code === 'bn' ? 'আজকের ঔষধ সূচি' : 'Today\'s Medicine Agenda'}
          </h2>
          <p className={`text-xs sm:text-sm max-w-xl font-medium ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}>
            {currentDoc.hospitalName} • {currentDoc.doctorName}
          </p>
        </div>

        {/* Daily Adherence Metric Box */}
        <div className={`p-4 rounded-2xl border text-right min-w-[140px] ${
          isLight
            ? 'bg-white border-2 border-slate-200 shadow-sm'
            : 'bg-slate-950/80 border border-slate-800/90'
        }`}>
          <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {t.adherenceScoreLabel}
          </span>
          <p className={`text-2xl sm:text-3xl font-black font-mono ${
            isLight ? 'text-emerald-700' : 'text-emerald-400'
          }`}>
            {scorePercent}%
          </p>
          <span className={`text-[10px] font-semibold ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {takenCount} {currentLangObj.code === 'bn' ? 'টি নেওয়া হয়েছে' : 'doses completed'}
          </span>
        </div>
      </div>

      {/* STRIP PACKING CHECKLIST FOR GOING OUTSIDE */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
        isLight
          ? 'bg-white border-2 border-slate-200 shadow-sm'
          : 'bg-slate-900/80 border border-slate-800'
      }`}>
        <Briefcase className={`w-5 h-5 shrink-0 mt-0.5 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
        <div>
          <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
            {t.stripPackingListTitle}:
          </h4>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {medicines.map((m) => (
              <span
                key={m.id}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                  isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-800'
                    : 'bg-slate-950 border border-slate-800 text-slate-300'
                }`}
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
        <div className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
          isLight
            ? 'bg-white border-2 border-slate-200'
            : 'bg-slate-900/90 border border-slate-800'
        }`}>
          <div className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <h3 className={`text-base font-black flex items-center gap-2 ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              <Sun className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>{t.morningSlotLabel} (08:00 AM)</span>
            </h3>
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {morningMeds.length} {t.totalMedicinesCountLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {morningMeds.map((med) => renderDoseCard(med, 'morning', '08:00 AM'))}
          </div>
        </div>

        {/* Slot 2: Afternoon */}
        {afternoonMeds.length > 0 && (
          <div className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
            isLight
              ? 'bg-white border-2 border-slate-200'
              : 'bg-slate-900/90 border border-slate-800'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <h3 className={`text-base font-black flex items-center gap-2 ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                <Sunset className={`w-5 h-5 ${isLight ? 'text-orange-600' : 'text-orange-400'}`} />
                <span>{t.afternoonSlotLabel} (01:30 PM)</span>
              </h3>
              <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {afternoonMeds.length} {t.totalMedicinesCountLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {afternoonMeds.map((med) => renderDoseCard(med, 'afternoon', '01:30 PM'))}
            </div>
          </div>
        )}

        {/* Slot 3: Night */}
        <div className={`p-5 rounded-3xl border shadow-xl space-y-4 ${
          isLight
            ? 'bg-white border-2 border-slate-200'
            : 'bg-slate-900/90 border border-slate-800'
        }`}>
          <div className={`flex items-center justify-between pb-3 border-b ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <h3 className={`text-base font-black flex items-center gap-2 ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              <Moon className={`w-5 h-5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span>{t.nightSlotLabel} (09:00 PM)</span>
            </h3>
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {nightMeds.length} {t.totalMedicinesCountLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nightMeds.map((med) => renderDoseCard(med, 'night', '09:00 PM'))}
          </div>
        </div>
      </div>

      {/* NIGHTLY COURSE SUMMARY CARD */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl space-y-3 ${
        isLight
          ? 'bg-white border-2 border-slate-200'
          : 'bg-slate-900/95 border border-slate-800'
      }`}>
        <h3 className={`text-base font-black flex items-center gap-2 ${
          isLight ? 'text-slate-950' : 'text-white'
        }`}>
          <Sparkles className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <span>{t.nightlySummaryTitle}</span>
        </h3>
        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
          {currentLangObj.code === 'bn'
            ? 'সারাদিনে সময়মতো নেওয়া, দেরিতে নেওয়া ও বাদ দেওয়া ঔষধের সার্বিক পর্যালোচনা।'
            : 'Comprehensive log of on-time, delayed, and skipped medications for today.'}
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
            isLight
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm'
              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
          }`}>
            <span className={`text-[11px] font-black uppercase tracking-wider block ${
              isLight ? 'text-emerald-900' : 'text-emerald-400'
            }`}>
              {t.takenOnTimeDosesLabel}
            </span>
            <p className={`text-2xl font-black font-mono mt-1 ${
              isLight ? 'text-emerald-950' : 'text-emerald-300'
            }`}>
              {takenCount}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
            isLight
              ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-sm'
              : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
          }`}>
            <span className={`text-[11px] font-black uppercase tracking-wider block ${
              isLight ? 'text-amber-950' : 'text-amber-400'
            }`}>
              {t.delayedDosesLabel}
            </span>
            <p className={`text-2xl font-black font-mono mt-1 ${
              isLight ? 'text-amber-950' : 'text-amber-300'
            }`}>
              {delayedCount}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
            isLight
              ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm'
              : 'bg-slate-950 border border-slate-800 text-slate-300'
          }`}>
            <span className={`text-[11px] font-black uppercase tracking-wider block ${
              isLight ? 'text-rose-900' : 'text-slate-400'
            }`}>
              {t.skippedDosesLabel}
            </span>
            <p className={`text-2xl font-black font-mono mt-1 ${
              isLight ? 'text-rose-950' : 'text-slate-300'
            }`}>
              {skippedCount}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: SNOOZE / DELAY ALARM MODAL */}
      {snoozingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-3xl border-2 p-6 shadow-2xl space-y-4 ${
            isLight
              ? 'bg-white border-amber-400 text-slate-900'
              : 'bg-slate-900 border-amber-600/70 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <h3 className={`text-sm font-black flex items-center gap-2 ${
                isLight ? 'text-amber-900' : 'text-amber-300'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{t.snoozeModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSnoozingItem(null)}
                className={`p-1 rounded-lg transition-colors ${
                  isLight
                    ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs font-bold ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>
              {snoozingItem.med.name} ({snoozingItem.med.dosage})
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmSnooze('15m')}
                className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition-colors flex items-center justify-between ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-slate-950 hover:bg-amber-600 hover:text-white border-slate-800 text-slate-200'
                }`}
              >
                <span>{t.snooze15Min}</span>
                <span className="text-[11px] opacity-70">+15 mins</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSnooze('30m')}
                className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition-colors flex items-center justify-between ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-slate-950 hover:bg-amber-600 hover:text-white border-slate-800 text-slate-200'
                }`}
              >
                <span>{t.snooze30Min}</span>
                <span className="text-[11px] opacity-70">+30 mins</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSnooze('1h')}
                className={`w-full py-3 px-4 rounded-xl border text-xs font-bold transition-colors flex items-center justify-between ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-slate-950 hover:bg-amber-600 hover:text-white border-slate-800 text-slate-200'
                }`}
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
          <div className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl space-y-4 ${
            isLight
              ? 'bg-white border-red-300 text-slate-900'
              : 'bg-slate-900 border-red-700/60 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <h3 className={`text-sm font-black flex items-center gap-2 ${
                isLight ? 'text-red-700' : 'text-red-400'
              }`}>
                <AlertCircle className="w-4 h-4" />
                <span>{t.skipReasonModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSkippingItem(null)}
                className={`p-1 rounded-lg transition-colors ${
                  isLight
                    ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs font-bold ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>
              {skippingItem.med.name} ({skippingItem.med.dosage})
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmSkip(t.skipReasonFasting)}
                className={`w-full py-3 px-4 rounded-xl border text-left font-bold text-xs transition-colors ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-950'
                    : 'bg-slate-950 hover:bg-red-950 border-slate-800 hover:border-red-600/70 text-slate-200'
                }`}
              >
                • {t.skipReasonFasting}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSkip(t.skipReasonUpset)}
                className={`w-full py-3 px-4 rounded-xl border text-left font-bold text-xs transition-colors ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-950'
                    : 'bg-slate-950 hover:bg-red-950 border-slate-800 hover:border-red-600/70 text-slate-200'
                }`}
              >
                • {t.skipReasonUpset}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSkip(t.skipReasonForgot)}
                className={`w-full py-3 px-4 rounded-xl border text-left font-bold text-xs transition-colors ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-950'
                    : 'bg-slate-950 hover:bg-red-950 border-slate-800 hover:border-red-600/70 text-slate-200'
                }`}
              >
                • {t.skipReasonForgot}
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSkip(t.skipReasonDoctorHold)}
                className={`w-full py-3 px-4 rounded-xl border text-left font-bold text-xs transition-colors ${
                  isLight
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-950'
                    : 'bg-slate-950 hover:bg-red-950 border-slate-800 hover:border-red-600/70 text-slate-200'
                }`}
              >
                • {t.skipReasonDoctorHold}
              </button>
            </div>

            {/* Custom Reason Box (When Option Is Not Mentioned) */}
            <div className={`pt-3 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <label className={`text-[11px] font-bold block ${isLight ? 'text-slate-800 font-extrabold' : 'text-slate-300'}`}>
                Or write your own reason (if option is not mentioned above):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customSkipReason}
                  onChange={(e) => setCustomSkipReason(e.target.value)}
                  placeholder="Type your reason here..."
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-red-600'
                      : 'bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customSkipReason.trim()) {
                      handleConfirmSkip(customSkipReason.trim());
                      setCustomSkipReason('');
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!customSkipReason.trim()}
                  onClick={() => {
                    if (customSkipReason.trim()) {
                      handleConfirmSkip(customSkipReason.trim());
                      setCustomSkipReason('');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shrink-0"
                >
                  Confirm Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
