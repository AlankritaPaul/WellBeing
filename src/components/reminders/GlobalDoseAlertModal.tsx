import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import type { Medication, ScannedPrescription } from '../../types/prescription';
import { BellRing, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';

interface GlobalDoseAlertModalProps {
  currentLanguage?: string;
  theme?: 'dark' | 'light';
}

interface AlarmEventDetail {
  slotLabel: string;
  medicines: Medication[];
  userName?: string;
  timestamp: number;
}

export const GlobalDoseAlertModal: React.FC<GlobalDoseAlertModalProps> = ({
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  const [activeAlert, setActiveAlert] = useState<AlarmEventDetail | null>(null);
  const [isSkipping, setIsSkipping] = useState<boolean>(false);
  const [customReason, setCustomReason] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen for in-app alarm trigger event dispatched by notificationService
    const handleAlarmPopup = (event: Event) => {
      const customEvent = event as CustomEvent<AlarmEventDetail>;
      if (customEvent.detail && customEvent.detail.medicines?.length > 0) {
        setActiveAlert(customEvent.detail);
        setIsSkipping(false);
      }
    };

    // 2. Listen for service worker notification click actions (lockscreen buttons)
    const handleSWAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ action: string; data: Record<string, unknown> }>;
      const action = customEvent.detail?.action;
      if (action === 'taken') {
        handleQuickTakeAll();
      } else if (action === 'delayed') {
        handleQuickDelayAll('15m');
      } else {
        // Open modal
        const prescriptions = storageService.getPrescriptions();
        if (prescriptions.length > 0) {
          const doc = prescriptions[0];
          setActiveAlert({
            slotLabel: 'Scheduled Medicine',
            medicines: (doc.medicines || []).slice(0, 3),
            userName: storageService.getUserName(),
            timestamp: Date.now(),
          });
        }
      }
    };

    window.addEventListener('wellbeing_dose_alarm_popup', handleAlarmPopup);
    window.addEventListener('wellbeing_sw_action', handleSWAction);

    return () => {
      window.removeEventListener('wellbeing_dose_alarm_popup', handleAlarmPopup);
      window.removeEventListener('wellbeing_sw_action', handleSWAction);
    };
  }, []);

  const getActivePrescription = (): ScannedPrescription | null => {
    const list = storageService.getPrescriptions();
    if (list.length === 0) return null;
    const activeId = storageService.getActiveAccountId();
    return (activeId ? list.find((p) => p.id === activeId) : null) || list[0];
  };

  const getSlotType = (label: string): 'morning' | 'afternoon' | 'night' => {
    const lower = label.toLowerCase();
    if (lower.includes('afternoon') || lower.includes('noon')) return 'afternoon';
    if (lower.includes('night') || lower.includes('evening')) return 'night';
    return 'morning';
  };

  // Action 1: "I TOOK IT"
  const handleQuickTakeAll = () => {
    const doc = getActivePrescription();
    if (!doc) {
      setActiveAlert(null);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const slot = activeAlert ? getSlotType(activeAlert.slotLabel) : 'morning';
    const meds = activeAlert?.medicines || doc.medicines || [];

    meds.forEach((med) => {
      storageService.logDoseAction({
        prescriptionId: doc.id,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        date: todayStr,
        timeSlot: slot,
        scheduledTime: activeAlert?.slotLabel || 'Dose Time',
        status: 'taken',
      });
    });

    notificationService.playAlertChime();
    setSuccessToast('✓ Doses logged as TAKEN! Adherence score updated.');
    setTimeout(() => {
      setSuccessToast(null);
      setActiveAlert(null);
      setIsSkipping(false);
    }, 2000);
  };

  // Action 2: "DELAY (+15 Mins)"
  const handleQuickDelayAll = (duration: string = '15m') => {
    const doc = getActivePrescription();
    if (!doc) {
      setActiveAlert(null);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const slot = activeAlert ? getSlotType(activeAlert.slotLabel) : 'morning';
    const meds = activeAlert?.medicines || doc.medicines || [];

    meds.forEach((med) => {
      storageService.logDoseAction({
        prescriptionId: doc.id,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        date: todayStr,
        timeSlot: slot,
        scheduledTime: activeAlert?.slotLabel || 'Dose Time',
        status: 'delayed',
        delayedUntil: duration,
      });
    });

    setSuccessToast(`⏱ Alarm delayed for ${duration}. Will remind you again!`);
    setTimeout(() => {
      setSuccessToast(null);
      setActiveAlert(null);
      setIsSkipping(false);
    }, 2000);
  };

  // Action 3: "SKIP DOSE"
  const handleConfirmSkip = (reason: string) => {
    const doc = getActivePrescription();
    if (!doc) {
      setActiveAlert(null);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const slot = activeAlert ? getSlotType(activeAlert.slotLabel) : 'morning';
    const meds = activeAlert?.medicines || doc.medicines || [];

    meds.forEach((med) => {
      storageService.logDoseAction({
        prescriptionId: doc.id,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        date: todayStr,
        timeSlot: slot,
        scheduledTime: activeAlert?.slotLabel || 'Dose Time',
        status: 'skipped',
        skipReason: reason,
      });
    });

    setSuccessToast(`✕ Dose marked as skipped: "${reason}". Saved for doctor review.`);
    setTimeout(() => {
      setSuccessToast(null);
      setActiveAlert(null);
      setIsSkipping(false);
      setCustomReason('');
    }, 2000);
  };

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border-2 p-6 sm:p-7 shadow-2xl relative transition-all ${
          isLight
            ? 'bg-white border-amber-400 text-slate-900 shadow-amber-200/50'
            : 'bg-slate-900 border-amber-500/80 text-white shadow-2xl'
        }`}
      >
        {/* Close / Dismiss Cross */}
        <button
          type="button"
          onClick={() => setActiveAlert(null)}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
            isLight
              ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-amber-500/30">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-500 shrink-0">
            <BellRing className="w-8 h-8 animate-bounce" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              {activeAlert.slotLabel}
            </span>
            <h2 className={`text-xl sm:text-2xl font-black mt-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Time to Take Your Medicine!
            </h2>
            <p className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {activeAlert.userName ? `${activeAlert.userName}, please ` : 'Please '}
              take your scheduled medication now.
            </p>
          </div>
        </div>

        {/* Success Toast banner */}
        {successToast && (
          <div className="my-4 p-3 rounded-2xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* List of Medicines Due */}
        {!isSkipping && (
          <div className="py-4 space-y-2.5">
            <span className={`text-[11px] font-black uppercase tracking-wider block ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>
              Prescribed Medicines:
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeAlert.medicines.map((med) => (
                <div
                  key={med.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-black">{med.name}</h4>
                    <p className={`text-xs font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                      {med.dosage} • <span className="capitalize">{med.form}</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                    isLight
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {med.timing === 'before_food' ? 'Before food' : 'After food'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3 Main Action Buttons */}
        {!isSkipping && !successToast && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            {/* BUTTON 1: TAKEN */}
            <button
              type="button"
              onClick={handleQuickTakeAll}
              className="py-3 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Taken</span>
            </button>

            {/* BUTTON 2: DELAY */}
            <button
              type="button"
              onClick={() => handleQuickDelayAll('15m')}
              className={`py-3 px-2 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
              className={`py-3 px-2 rounded-2xl border font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-rose-50 border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-900'
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
              <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                Why are you skipping this dose? (Saved for Doctor):
              </span>
              <button
                type="button"
                onClick={() => setIsSkipping(false)}
                className="text-xs text-blue-500 font-bold hover:underline"
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
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-950'
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
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-700 text-white'
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
