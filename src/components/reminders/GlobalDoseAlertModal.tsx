import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import type { Medication, ScannedPrescription } from '../../types/prescription';
import { BellRing, CheckCircle2, Clock, X, AlertCircle, UtensilsCrossed, AlertTriangle } from 'lucide-react';

interface GlobalDoseAlertModalProps {
  currentLanguage?: string;
  theme?: 'dark' | 'light';
}

interface SingleAlarmDetail {
  med: Medication;
  timeLabel: string;
  slotType: 'morning' | 'afternoon' | 'night';
  isBeforeFood: boolean;
  userName?: string;
  timestamp: number;
}

export const GlobalDoseAlertModal: React.FC<GlobalDoseAlertModalProps> = ({
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Queue of individual medication alerts to show ONE BY ONE
  const [alarmQueue, setAlarmQueue] = useState<SingleAlarmDetail[]>([]);
  const [isSkipping, setIsSkipping] = useState<boolean>(false);
  const [customReason, setCustomReason] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen for individual medicine alert event
    const handleSingleAlarm = (event: Event) => {
      const customEvent = event as CustomEvent<SingleAlarmDetail>;
      if (customEvent.detail && customEvent.detail.med) {
        setAlarmQueue((prev) => {
          // Avoid duplicate entry in queue
          const exists = prev.some(
            (item) => item.med.id === customEvent.detail.med.id && item.slotType === customEvent.detail.slotType
          );
          if (exists) return prev;
          return [...prev, customEvent.detail];
        });
        setIsSkipping(false);
      }
    };

    // 2. Listen for service worker notification click actions (lockscreen buttons)
    const handleSWAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action: string; data: Record<string, unknown> }>;
      const action = customEvent.detail?.action;
      if (action === 'taken') {
        handleTakeCurrent();
      } else if (action === 'delayed') {
        handleDelayCurrent('15m');
      }
    };

    window.addEventListener('wellbeing_single_dose_popup', handleSingleAlarm);
    window.addEventListener('wellbeing_sw_action', handleSWAction);

    return () => {
      window.removeEventListener('wellbeing_single_dose_popup', handleSingleAlarm);
      window.removeEventListener('wellbeing_sw_action', handleSWAction);
    };
  }, []);

  const currentAlert: SingleAlarmDetail | null = alarmQueue.length > 0 ? alarmQueue[0] : null;

  const getActivePrescription = (): ScannedPrescription | null => {
    const list = storageService.getPrescriptions();
    if (list.length === 0) return null;
    const activeId = storageService.getActiveAccountId();
    return (activeId ? list.find((p) => p.id === activeId) : null) || list[0];
  };

  const advanceQueue = () => {
    setAlarmQueue((prev) => prev.slice(1));
    setIsSkipping(false);
    setCustomReason('');
  };

  // Action 1: "TAKEN"
  const handleTakeCurrent = () => {
    if (!currentAlert) return;
    const doc = getActivePrescription();
    if (!doc) {
      advanceQueue();
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    storageService.logDoseAction({
      prescriptionId: doc.id,
      medicationId: currentAlert.med.id,
      medicationName: currentAlert.med.name,
      dosage: currentAlert.med.dosage,
      date: todayStr,
      timeSlot: currentAlert.slotType,
      scheduledTime: currentAlert.timeLabel,
      status: 'taken',
    });

    notificationService.playAlertChime();
    setSuccessToast(`✓ ${currentAlert.med.name} logged as TAKEN! Adherence score updated.`);
    setTimeout(() => {
      setSuccessToast(null);
      advanceQueue();
    }, 1800);
  };

  // Action 2: "DELAY (15m)"
  const handleDelayCurrent = (duration: string = '15m') => {
    if (!currentAlert) return;
    const doc = getActivePrescription();
    if (!doc) {
      advanceQueue();
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    storageService.logDoseAction({
      prescriptionId: doc.id,
      medicationId: currentAlert.med.id,
      medicationName: currentAlert.med.name,
      dosage: currentAlert.med.dosage,
      date: todayStr,
      timeSlot: currentAlert.slotType,
      scheduledTime: currentAlert.timeLabel,
      status: 'delayed',
      delayedUntil: duration,
    });

    setSuccessToast(`⏱ ${currentAlert.med.name} delayed for ${duration}. Will ring again!`);
    setTimeout(() => {
      setSuccessToast(null);
      advanceQueue();
    }, 1800);
  };

  // Action 3: "SKIP DOSE"
  const handleConfirmSkip = (reason: string) => {
    if (!currentAlert) return;
    const doc = getActivePrescription();
    if (!doc) {
      advanceQueue();
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    storageService.logDoseAction({
      prescriptionId: doc.id,
      medicationId: currentAlert.med.id,
      medicationName: currentAlert.med.name,
      dosage: currentAlert.med.dosage,
      date: todayStr,
      timeSlot: currentAlert.slotType,
      scheduledTime: currentAlert.timeLabel,
      status: 'skipped',
      skipReason: reason,
    });

    setSuccessToast(`✕ ${currentAlert.med.name} marked as skipped: "${reason}". Saved for doctor review.`);
    setTimeout(() => {
      setSuccessToast(null);
      advanceQueue();
    }, 1800);
  };

  if (!currentAlert) return null;

  const isBefore = currentAlert.isBeforeFood;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border-2 p-6 sm:p-7 shadow-2xl relative transition-all ${
          isLight
            ? isBefore
              ? 'bg-amber-50/95 border-amber-400 text-slate-950 shadow-amber-100/50'
              : 'bg-emerald-50/95 border-emerald-400 text-slate-950 shadow-emerald-100/50'
            : isBefore
            ? 'bg-slate-900 border-amber-500/80 text-white shadow-2xl'
            : 'bg-slate-900 border-emerald-500/80 text-white shadow-2xl'
        }`}
      >
        {/* Close / Dismiss Cross */}
        <button
          type="button"
          onClick={advanceQueue}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
            isLight
              ? 'hover:bg-slate-200/80 text-slate-600 hover:text-slate-950'
              : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header: Clear Before Food vs After Food Tag */}
        <div className="flex items-start gap-4 pb-4 border-b border-slate-300 dark:border-slate-800">
          <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 ${
            isBefore
              ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isBefore ? (
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            ) : (
              <UtensilsCrossed className="w-8 h-8 animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isLight ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-blue-950/80 text-blue-300 border border-blue-700/60'
              }`}>
                ⏰ 5-10 Min Advance Reminder
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isBefore
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-emerald-600 text-white shadow-sm'
              }`}>
                {isBefore ? 'Take Before Food' : 'Take After Food'}
              </span>
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {currentAlert.timeLabel}
              </span>
            </div>

            <h2 className={`text-xl sm:text-2xl font-black mt-2 leading-snug ${isLight ? 'text-slate-950' : 'text-white'}`}>
              {currentAlert.med.name} ({currentAlert.med.dosage})
            </h2>
            <p className={`text-xs sm:text-sm font-bold mt-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {isBefore
                ? 'Meal is coming up in 5-10 minutes. Please take this medicine on an empty stomach before food.'
                : 'Meal finishing in 5-10 minutes. Please keep this medicine ready to take right after food.'}
            </p>
          </div>
        </div>

        {/* Success Toast banner */}
        {successToast && (
          <div className="my-4 p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2 animate-in fade-in shadow-md">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Single Medicine Spotlight Card */}
        {!isSkipping && (
          <div className={`my-4 p-4 rounded-2xl border-2 ${
            isLight
              ? 'bg-white border-slate-300 shadow-sm text-slate-950'
              : 'bg-slate-950 border-slate-800 text-white'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block mb-0.5 ${
                  isLight ? 'text-blue-900' : 'text-blue-400'
                }`}>
                  Current Medicine:
                </span>
                <h3 className="text-lg sm:text-xl font-black">{currentAlert.med.name}</h3>
                <p className={`text-xs sm:text-sm font-bold mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {currentAlert.med.dosage} • <span className="capitalize">{currentAlert.med.form}</span>
                </p>
              </div>

              <div className={`px-3 py-1.5 rounded-xl border text-right text-xs font-black ${
                isBefore
                  ? isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-amber-950/80 border-amber-700 text-amber-300'
                  : isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                  : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              }`}>
                <span>{isBefore ? 'খাওয়ার আগে' : 'খাওয়ার পরে'}</span>
              </div>
            </div>

            {/* Remaining in queue notice if multiple medicines are waiting */}
            {alarmQueue.length > 1 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5" />
                <span>+ {alarmQueue.length - 1} more medicine waiting after this</span>
              </div>
            )}
          </div>
        )}

        {/* 3 Main Action Buttons for THIS Specific Medicine */}
        {!isSkipping && !successToast && (
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {/* BUTTON 1: TAKEN */}
            <button
              type="button"
              onClick={handleTakeCurrent}
              className="py-3.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Taken</span>
            </button>

            {/* BUTTON 2: DELAY */}
            <button
              type="button"
              onClick={() => handleDelayCurrent('15m')}
              className={`py-3.5 px-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-950'
                  : 'bg-amber-950/60 hover:bg-amber-900 border-amber-600/70 text-amber-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Delay (15m)</span>
            </button>

            {/* BUTTON 3: SKIP */}
            <button
              type="button"
              onClick={() => setIsSkipping(true)}
              className={`py-3.5 px-3 rounded-2xl border font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-rose-50 border-slate-300 hover:border-rose-300 text-slate-800 hover:text-rose-950'
                  : 'bg-slate-800 hover:bg-rose-950 border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-200'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Skip Dose</span>
            </button>
          </div>
        )}

        {/* Skip Reason Picker (When User Taps Skip Dose) */}
        {isSkipping && !successToast && (
          <div className="py-3 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                Why are you skipping {currentAlert.med.name}? (Recorded for Doctor):
              </span>
              <button
                type="button"
                onClick={() => setIsSkipping(false)}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Back
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                'Medical Fasting / Test Prep',
                'Stomach Upset / Side Effect',
                'Forgot Medicine Strip at Home',
                'Doctor Advised to Hold',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => handleConfirmSkip(reason)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-colors ${
                    isLight
                      ? 'bg-white hover:bg-rose-100 border-rose-300 text-rose-950'
                      : 'bg-slate-950 hover:bg-rose-950 border-slate-800 hover:border-rose-700 text-slate-200'
                  }`}
                >
                  • {reason}
                </button>
              ))}
            </div>

            {/* Custom reason input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Or type custom reason..."
                className={`flex-1 py-2 px-3 rounded-xl border text-xs focus:outline-none ${
                  isLight
                    ? 'bg-white border-2 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border border-slate-700 text-white'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customReason.trim()) {
                    handleConfirmSkip(customReason.trim());
                  }
                }}
              />
              <button
                type="button"
                disabled={!customReason.trim()}
                onClick={() => {
                  if (customReason.trim()) handleConfirmSkip(customReason.trim());
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
