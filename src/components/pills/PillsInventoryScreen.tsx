import React, { useState } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { storageService } from '../../services/storageService';
import type { ScannedPrescription, Medication } from '../../types/prescription';
import {
  Pill,
  AlertTriangle,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  ArrowLeft,
  RefreshCw,
  Building2,
  X,
  FileCheck2,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

interface PillsInventoryScreenProps {
  currentLanguage: string;
  userName?: string;
  theme?: 'dark' | 'light';
  activePrescription: ScannedPrescription | null;
  allPrescriptions: ScannedPrescription[];
  onSelectPrescription: (prescription: ScannedPrescription) => void;
  onBackToPrevious: () => void;
  onOpenReminders?: () => void;
  onOpenDoctorReview?: () => void;
}

export const PillsInventoryScreen: React.FC<PillsInventoryScreenProps> = ({
  currentLanguage,
  userName = '',
  theme = 'dark',
  activePrescription,
  allPrescriptions,
  onSelectPrescription,
  onBackToPrevious,
  onOpenReminders,
  onOpenDoctorReview,
}) => {
  const isLight = theme === 'light';
  const t = getTranslation(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  const [currentDoc, setCurrentDoc] = useState<ScannedPrescription | null>(
    activePrescription || (allPrescriptions.length > 0 ? allPrescriptions[0] : null)
  );

  React.useEffect(() => {
    if (activePrescription) {
      setCurrentDoc(activePrescription);
    } else if (allPrescriptions.length > 0) {
      setCurrentDoc(allPrescriptions[0]);
    }
  }, [activePrescription, allPrescriptions]);

  React.useEffect(() => {
    const handlePrescriptionsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<ScannedPrescription[]>;
      const all = customEvent.detail || storageService.getPrescriptions();
      if (currentDoc) {
        const found = all.find((p) => p.id === currentDoc.id);
        if (found) setCurrentDoc(found);
      }
    };
    window.addEventListener('wellbeing_prescriptions_changed', handlePrescriptionsChanged);
    return () => window.removeEventListener('wellbeing_prescriptions_changed', handlePrescriptionsChanged);
  }, [currentDoc?.id]);

  // Refill Modal State
  const [refillMed, setRefillMed] = useState<Medication | null>(null);
  const [refillAmount, setRefillAmount] = useState<number>(10);

  // Shopping List Modal State
  const [showShoppingModal, setShowShoppingModal] = useState<boolean>(false);

  if (!currentDoc) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 text-center text-slate-400">
        <p>{t.noLanguagesFound}</p>
      </div>
    );
  }

  const medicines = currentDoc.medicines || [];

  // Calculate daily burn rate from frequency string e.g. "1-0-1" -> 2 pills/day
  const calculateDailyBurn = (freq: string): number => {
    if (!freq) return 1;
    if (freq.includes('-')) {
      const parts = freq.split('-').map((p) => parseInt(p.trim(), 10) || 0);
      const sum = parts.reduce((acc, curr) => acc + curr, 0);
      return sum > 0 ? sum : 1;
    }
    return 1;
  };

  // Metric summaries
  const medStats = medicines.map((med) => {
    const burn = calculateDailyBurn(med.frequency);
    const rem = med.remainingQuantity !== undefined ? med.remainingQuantity : 10;
    const daysLeft = Math.floor(rem / burn);
    const isLow = daysLeft <= (med.refillThresholdDays || 3);
    return {
      med,
      burn,
      rem,
      daysLeft,
      isLow,
    };
  });

  const lowStockItems = medStats.filter((item) => item.isLow);
  const safeStockItems = medStats.filter((item) => !item.isLow);

  // Handle refill submission
  const handleConfirmRefill = () => {
    if (!refillMed || !currentDoc) return;
    const addedAmount = Number(refillAmount) || 10;
    storageService.refillMedication(currentDoc.id, refillMed.id, addedAmount);
    const updatedMeds = (currentDoc.medicines || []).map((m) => {
      if (m.id !== refillMed.id) return m;
      return {
        ...m,
        remainingQuantity: (m.remainingQuantity || 0) + addedAmount,
        lastRefillDate: new Date().toISOString().split('T')[0],
      };
    });
    const updatedDoc = { ...currentDoc, medicines: updatedMeds };
    setCurrentDoc(updatedDoc);
    onSelectPrescription(updatedDoc);
    setRefillMed(null);
  };

  // Quick adjust
  const handleQuickAdjust = (medId: string, currentRem: number, change: number) => {
    if (!currentDoc) return;
    const newQty = Math.max(0, currentRem + change);
    storageService.updateMedicationStock(currentDoc.id, medId, newQty);
    const updatedMeds = (currentDoc.medicines || []).map((m) => {
      if (m.id !== medId) return m;
      return { ...m, remainingQuantity: newQty };
    });
    const updatedDoc = { ...currentDoc, medicines: updatedMeds };
    setCurrentDoc(updatedDoc);
    onSelectPrescription(updatedDoc);
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

          {onOpenReminders && (
            <button
              type="button"
              onClick={onOpenReminders}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300'
                  : 'border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Clock className={`w-4 h-4 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
              <span>{t.openRemindersButton}</span>
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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-700/60 text-blue-300 text-xs font-bold">
          <Pill className="w-3.5 h-3.5 text-blue-400" />
          <span>{medicines.length} {t.totalMedicinesCountLabel}</span>
        </div>
      </div>

      {/* Screen Title & Subtitle Banner */}
      <div className="space-y-1">
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
          isLight ? 'text-slate-950 font-black' : 'text-white'
        }`}>
          {t.pillsMenuTitle}
        </h1>
        <p className={`text-xs sm:text-sm max-w-2xl font-semibold ${
          isLight ? 'text-slate-700' : 'text-slate-400'
        }`}>
          {userName ? `${userName} • ` : ''}{t.pillsMenuSubtitle}
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
              const count = p.medicines?.length || 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setCurrentDoc(p);
                    onSelectPrescription(p);
                  }}
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
                  <span className="px-1.5 py-0.2 rounded bg-slate-900/80 text-[10px] text-blue-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Doctor & Facility Header */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white leading-snug">
              {currentDoc.hospitalName}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-blue-300">
              {currentDoc.doctorName}
            </p>
          </div>
        </div>

        {/* Pharmacy Shopping List Button */}
        {lowStockItems.length > 0 && (
          <button
            type="button"
            onClick={() => setShowShoppingModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t.shoppingListTitle} ({lowStockItems.length})</span>
          </button>
        )}
      </div>

      {/* LOW STOCK REFILL ALERT BANNER */}
      {lowStockItems.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-red-950/60 to-amber-950/80 border-2 border-amber-600/80 shadow-2xl flex items-start gap-3.5 text-amber-200 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-2">
              <span>{t.refillAlertBadge} ({lowStockItems.length})</span>
            </h3>
            <p className="text-xs text-amber-100 leading-relaxed">
              {t.lowStockAlertNotice}
            </p>
            <div className="flex flex-wrap gap-2 pt-1.5">
              {lowStockItems.map(({ med, daysLeft, rem }) => (
                <span
                  key={med.id}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/60 border border-amber-600/70 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Pill className="w-3 h-3 text-amber-400" />
                  <span>{med.name}: {rem} {t.pillsRemainingLabel} ({daysLeft} {t.daysRemainingLabel})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {currentLangObj.code === 'bn' ? 'মোট চালু ঔষধ' : 'Active Strips'}
          </span>
          <p className="text-xl sm:text-2xl font-black text-white">
            {medicines.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            {t.safeStockBadge}
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-300">
            {safeStockItems.length}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            {t.refillAlertBadge}
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-300">
            {lowStockItems.length}
          </p>
        </div>
      </div>

      {/* Grid of Medication Pill Strips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medStats.map(({ med, burn, rem, daysLeft, isLow }) => {
          const totalQ = med.totalQuantity || 30;
          const fillPercent = Math.min(100, Math.round((rem / totalQ) * 100));

          return (
            <div
              key={med.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                isLow
                  ? 'bg-slate-900/95 border-amber-600/70 shadow-xl shadow-amber-950/20'
                  : 'bg-slate-900/90 border-slate-800 shadow-xl'
              }`}
            >
              {/* Card Header: Form & Days Left Pill */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-950/70 border border-blue-700/60 text-blue-300">
                  <Pill className="w-3.5 h-3.5" />
                  <span className="capitalize">{med.form}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${
                      isLow
                        ? 'bg-red-950/80 border-red-600/70 text-red-300 animate-pulse'
                        : 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300'
                    }`}
                  >
                    {isLow ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{daysLeft} {t.daysRemainingLabel}</span>
                  </span>
                </div>
              </div>

              {/* Medicine Name, Dosage & Clinical Purpose */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                    {med.name}
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {med.dosage}
                  </span>
                </div>

                {med.shortName && (
                  <p className="text-xs font-bold text-blue-300">{med.shortName}</p>
                )}

                {med.purpose && (
                  <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                    {med.purpose}
                  </p>
                )}
              </div>

              {/* Stock Progress & Details */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">
                    {t.currentStockLabel}: <span className="text-white font-extrabold">{rem} / {totalQ} {t.pillsRemainingLabel}</span>
                  </span>
                  <span className="text-slate-400 font-bold">
                    {t.dailyConsumptionLabel}: <span className="text-blue-300 font-mono font-extrabold">{burn} / দিন</span>
                  </span>
                </div>

                {/* Visual Strip Fill Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${fillPercent}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLow
                        ? 'bg-gradient-to-r from-red-500 to-amber-500'
                        : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                    }`}
                  />
                </div>

                {/* Timing Badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1 font-mono font-semibold">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{med.frequency}</span>
                  </span>
                  <span className="font-semibold text-slate-300">
                    {med.timing === 'before_food' ? t.timingBeforeFood : t.timingAfterFood}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Quick - / + and Log Refill */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust(med.id, rem, -1)}
                    disabled={rem <= 0}
                    className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white"
                    title="Deduct 1 pill"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-xs font-mono font-extrabold text-white">
                    {rem}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdjust(med.id, rem, 1)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Add 1 pill"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRefillMed(med);
                    setRefillAmount(med.form === 'capsule' ? 14 : 30);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-950/50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.refillButton}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: LOG REFILL MODAL */}
      {refillMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-blue-600/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-blue-400" />
                <span>{t.refillModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRefillMed(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-blue-300">{refillMed.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{refillMed.dosage} • {refillMed.form}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {t.refillQuantityInputLabel}
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[10, 14, 15, 30].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRefillAmount(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      refillAmount === num
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    +{num}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="500"
                value={refillAmount}
                onChange={(e) => setRefillAmount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRefillMed(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
              >
                {t.backButton}
              </button>
              <button
                type="button"
                onClick={handleConfirmRefill}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-950/60 transition-all"
              >
                ✓ {t.refillButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PHARMACY REFILL SHOPPING LIST MODAL */}
      {showShoppingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-amber-600/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <span>{t.shoppingListTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowShoppingModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {t.shoppingListSubtitle}:
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {lowStockItems.map(({ med, rem, daysLeft }) => (
                <div
                  key={med.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-amber-800/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{med.name}</h4>
                    <p className="text-xs text-slate-400">{med.dosage} • {med.frequency}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-lg bg-red-950 text-red-300 text-xs font-bold font-mono">
                      {rem} {t.pillsRemainingLabel} ({daysLeft} {t.daysRemainingLabel})
                    </span>
                    <p className="text-[11px] text-amber-400 mt-1 font-semibold">
                      +1 {currentLangObj.code === 'bn' ? 'পাতা কিনুন' : 'Pack Needed'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                <span>{t.printDocumentButton}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShoppingModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                {t.backButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
