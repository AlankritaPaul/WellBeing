import React, { useState } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { storageService } from '../../services/storageService';
import type { ScannedPrescription, DiagnosticTest } from '../../types/prescription';
import {
  FlaskConical,
  Droplet,
  HeartPulse,
  Scan,
  Stethoscope,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Phone,
  Plus,
  Trash2,
  ArrowLeft,
  Layers,
  Sparkles,
  Check,
  RotateCcw,
  Building2,
  X,
  FileCheck2,
  UserCheck
} from 'lucide-react';

interface DiagnosticLabDeskScreenProps {
  currentLanguage: string;
  userName?: string;
  activePrescription: ScannedPrescription | null;
  allPrescriptions: ScannedPrescription[];
  onSelectPrescription: (prescription: ScannedPrescription) => void;
  onBackToPrevious: () => void;
  onBackToCabinet?: () => void;
  onOpenVault?: (prescription: ScannedPrescription) => void;
}

export const DiagnosticLabDeskScreen: React.FC<DiagnosticLabDeskScreenProps> = ({
  currentLanguage,
  userName = '',
  activePrescription,
  allPrescriptions,
  onSelectPrescription,
  onBackToPrevious,
  onBackToCabinet,
  onOpenVault,
}) => {
  const t = getTranslation(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  // Active prescription fallback
  const currentDoc: ScannedPrescription | null =
    activePrescription || (allPrescriptions.length > 0 ? allPrescriptions[0] : null);

  // Filter: 'all' | 'pending' | 'completed'
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');

  // Add Test Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTestName, setNewTestName] = useState<string>('');
  const [newTestCategory, setNewTestCategory] = useState<DiagnosticTest['category']>('blood');
  const [newTestInstructions, setNewTestInstructions] = useState<string>('');

  // Delete Confirmation Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Mark Completed Result Note Modal
  const [completingTestId, setCompletingTestId] = useState<string | null>(null);
  const [resultSummaryInput, setResultSummaryInput] = useState<string>('');

  if (!currentDoc) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 text-center text-slate-400">
        <p>{t.noTestsFoundNotice}</p>
      </div>
    );
  }

  const testsList: DiagnosticTest[] = currentDoc.diagnosticTests || [];
  const completedCount = testsList.filter((test) => test.status === 'completed').length;
  const pendingCount = testsList.filter((test) => test.status === 'pending').length;
  const totalCount = testsList.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered view
  const displayedTests = testsList.filter((test) => {
    if (filterMode === 'pending') return test.status === 'pending';
    if (filterMode === 'completed') return test.status === 'completed';
    return true;
  });

  // Category Icon & Label Helper
  const getCategoryMeta = (cat: DiagnosticTest['category']) => {
    switch (cat) {
      case 'blood':
        return {
          icon: Droplet,
          label: t.testCategoryBlood,
          color: 'text-rose-400 bg-rose-950/60 border-rose-800/60',
        };
      case 'urine':
        return {
          icon: FlaskConical,
          label: t.testCategoryUrine,
          color: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
        };
      case 'cardiac':
        return {
          icon: HeartPulse,
          label: t.testCategoryCardiac,
          color: 'text-red-400 bg-red-950/60 border-red-800/60',
        };
      case 'imaging':
        return {
          icon: Scan,
          label: t.testCategoryImaging,
          color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60',
        };
      default:
        return {
          icon: Stethoscope,
          label: t.testCategoryGeneral,
          color: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
        };
    }
  };

  // Toggle Test Completion
  const handleToggleStatus = (test: DiagnosticTest) => {
    if (test.status === 'pending') {
      // Prompt for optional result summary or quick mark
      setCompletingTestId(test.id);
      setResultSummaryInput('');
    } else {
      // Revert to pending
      storageService.updateDiagnosticTestStatus(currentDoc.id, test.id, 'pending');
    }
  };

  const handleConfirmComplete = () => {
    if (!completingTestId) return;
    const todayDate = new Date().toLocaleDateString(currentLangObj.code === 'bn' ? 'bn-IN' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    storageService.updateDiagnosticTestStatus(
      currentDoc.id,
      completingTestId,
      'completed',
      todayDate,
      resultSummaryInput.trim() || undefined
    );
    setCompletingTestId(null);
    setResultSummaryInput('');
  };

  // Add Test
  const handleSaveNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName.trim()) return;

    storageService.addDiagnosticTest(currentDoc.id, {
      testName: newTestName.trim(),
      category: newTestCategory,
      instructions: newTestInstructions.trim() || undefined,
      status: 'pending',
    });

    setNewTestName('');
    setNewTestInstructions('');
    setNewTestCategory('blood');
    setIsAddModalOpen(false);
  };

  // Delete Test
  const handleDeleteConfirm = () => {
    if (!confirmDeleteId) return;
    storageService.deleteDiagnosticTest(currentDoc.id, confirmDeleteId);
    setConfirmDeleteId(null);
  };

  // Find booking contact phone
  const bookingPhone = currentDoc.phoneNumbers?.find(
    (p) => p.type === 'booking' || p.type === 'general'
  );

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

          {onOpenVault && (
            <button
              type="button"
              onClick={() => onOpenVault(currentDoc)}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              title={t.openVaultButton}
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>{t.openVaultButton}</span>
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-700/60 text-blue-300 text-xs font-bold">
          <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
          <span>{totalCount} {t.labDeskTitle}</span>
        </div>
      </div>

      {/* Screen Title & Subtitle Banner */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t.labDeskTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          {t.labDeskSubtitle}
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
              const docTestCount = p.diagnosticTests?.length || 0;
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
                  <span className="px-1.5 py-0.2 rounded bg-slate-900/80 text-[10px] text-blue-300">
                    {docTestCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Doctor & Facility Overview Card with Lab Booking Shortcut */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white leading-snug">
              {currentDoc.hospitalName}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-blue-300 mt-0.5">
              {currentDoc.doctorName}
            </p>
            {currentDoc.doctorSpecialty && (
              <p className="text-xs text-slate-400">{currentDoc.doctorSpecialty}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>{userName || currentDoc.patientName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentDoc.date}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Lab Booking Telephone Call Button */}
        {bookingPhone && (
          <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <a
              href={`tel:${bookingPhone.number}`}
              className="w-full md:w-auto px-4 py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{bookingPhone.label}: {bookingPhone.number}</span>
            </a>
          </div>
        )}
      </div>

      {/* Progress & Fasting Notice Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Progress Card */}
        <div className="md:col-span-5 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.documentQualityLabel}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-700/60 text-blue-300 text-xs font-extrabold font-mono">
              {progressPercent}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {completedCount} <span className="text-sm font-normal text-slate-400">/ {totalCount} {t.statusCompletedLabel}</span>
              </h3>
              <span className="text-xs text-amber-400 font-bold">
                {pendingCount} {t.statusPendingLabel}
              </span>
            </div>

            {/* Custom Styled Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-950/60"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t.addNewTestButton}</span>
            </button>
          </div>
        </div>

        {/* Universal Fasting / Pre-Test Guideline Banner */}
        <div className="md:col-span-7 p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-blue-950/40 border border-blue-900/40 shadow-xl flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-200">
              {t.testPreparationNoticeTitle}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.fastingRequiredNotice}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Chips & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {totalCount} {currentLangObj.code === 'bn' ? 'সব পরীক্ষা' : 'All Tests'}
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filterMode === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{pendingCount} {t.statusPendingLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filterMode === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Check className="w-3 h-3" />
            <span>{completedCount} {t.statusCompletedLabel}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>{t.addNewTestButton}</span>
        </button>
      </div>

      {/* All Tests Completed Congratulatory Banner */}
      {totalCount > 0 && completedCount === totalCount && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-950/50 border-2 border-emerald-600/70 shadow-2xl flex items-center gap-3.5 text-emerald-200 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-emerald-300">
              {t.allTestsCompletedCongrats}
            </h4>
          </div>
        </div>
      )}

      {/* Grid of Diagnostic Tests */}
      {displayedTests.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <FlaskConical className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-400">
            {t.noTestsFoundNotice}
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewTestButton}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTests.map((test) => {
            const isCompleted = test.status === 'completed';
            const catMeta = getCategoryMeta(test.category);
            const CatIcon = catMeta.icon;

            return (
              <div
                key={test.id}
                className={`group p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                  isCompleted
                    ? 'bg-slate-900/60 border-emerald-900/60 shadow-lg'
                    : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50 shadow-xl'
                }`}
              >
                {/* Header: Category Badge & Status Badge & Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${catMeta.color}`}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                      <span>{catMeta.label}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                        isCompleted
                          ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300'
                          : 'bg-amber-950/70 border-amber-600/60 text-amber-300'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{isCompleted ? t.statusCompletedLabel : t.statusPendingLabel}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(test.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    title={t.deleteTestButton}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Test Name & Description */}
                <div className="space-y-1.5">
                  <h3
                    className={`text-base font-black leading-snug tracking-tight ${
                      isCompleted ? 'text-slate-300 line-through decoration-emerald-500/50' : 'text-white'
                    }`}
                  >
                    {test.testName}
                  </h3>

                  {/* Preparation Guidelines / Instructions */}
                  {test.instructions && (
                    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-300 block mb-0.5">
                          {t.testPreparationNoticeTitle}:
                        </span>
                        <span className="text-[11px] leading-relaxed">
                          {test.instructions}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Completed Date & Result Summary (if present) */}
                  {isCompleted && (
                    <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-200 space-y-1">
                      {test.completedDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.testDateLabel}: {test.completedDate}</span>
                        </div>
                      )}
                      {test.resultSummary && (
                        <p className="text-[11px] font-medium text-emerald-100 pl-5">
                          ✓ {test.resultSummary}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Action Button: Toggle Complete vs Pending */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  {isCompleted ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.markAsPendingButton}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(test)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/50"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>{t.markAsCompletedButton}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD PRESCRIBED LAB TEST MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-400" />
                <span>{t.addTestModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t.testNameInputLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  placeholder={currentLangObj.code === 'bn' ? 'যেমন: সিবিসি, লিপিড প্রোফাইল, সুগার' : 'e.g., HbA1c, Complete Blood Count, USG Abdomen'}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t.testCategoryLabel}
                </label>
                <select
                  value={newTestCategory}
                  onChange={(e) => setNewTestCategory(e.target.value as DiagnosticTest['category'])}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="blood">{t.testCategoryBlood}</option>
                  <option value="urine">{t.testCategoryUrine}</option>
                  <option value="cardiac">{t.testCategoryCardiac}</option>
                  <option value="imaging">{t.testCategoryImaging}</option>
                  <option value="general">{t.testCategoryGeneral}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {t.testInstructionsInputLabel}
                </label>
                <textarea
                  rows={2}
                  value={newTestInstructions}
                  onChange={(e) => setNewTestInstructions(e.target.value)}
                  placeholder={currentLangObj.code === 'bn' ? 'যেমন: ১০ ঘণ্টা খালি পেটে রক্তের নমুনা' : 'e.g., 10-12 hours overnight fasting required'}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
                >
                  {t.backButton}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-950/60 transition-all"
                >
                  {t.saveTestButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLETE TEST SUMMARY MODAL */}
      {completingTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-emerald-700/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{t.markAsCompletedButton}</span>
              </h3>
              <button
                type="button"
                onClick={() => setCompletingTestId(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                {currentLangObj.code === 'bn' ? 'ফলাফল বা সংক্ষিপ্ত মন্তব্য (ঐচ্ছিক)' : 'Result Summary / Notes (Optional)'}
              </label>
              <input
                type="text"
                value={resultSummaryInput}
                onChange={(e) => setResultSummaryInput(e.target.value)}
                placeholder={currentLangObj.code === 'bn' ? 'যেমন: স্বাভাবিক (Hb: 13.5 g/dL)' : 'e.g., Normal, 110 mg/dL, Clear'}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCompletingTestId(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
              >
                {t.backButton}
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/60 transition-all"
              >
                ✓ {t.statusCompletedLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE TEST CONFIRMATION MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-red-700/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{t.deleteTestButton}</span>
              </h3>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.deleteTestConfirm}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
              >
                {t.backButton}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
              >
                {t.deleteTestButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
