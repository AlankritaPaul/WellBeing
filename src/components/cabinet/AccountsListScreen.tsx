import React, { useState } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { resolvePrescriptionImageUrl, storageService } from '../../services/storageService';
import type { ScannedPrescription } from '../../types/prescription';
import {
  FolderHeart,
  Building2,
  Calendar,
  Pill,
  ChevronRight,
  Plus,
  Trash2,
  ShieldAlert,
  AlertTriangle,
  X,
  Eye,
  FlaskConical,
  Clock,
  FileCheck2,
  FileText,
  Settings,
  Check,
  Edit3,
  ArrowLeft,
  UserCheck,
  Phone
} from 'lucide-react';

interface AccountsListScreenProps {
  currentLanguage: string;
  userName?: string;
  theme?: 'dark' | 'light';
  prescriptions: ScannedPrescription[];
  onSelectAccount: (prescription: ScannedPrescription) => void;
  onOpenVault?: (prescription: ScannedPrescription) => void;
  onOpenLabDesk?: (prescription: ScannedPrescription) => void;
  onOpenPillsMenu?: (prescription: ScannedPrescription) => void;
  onOpenDoctorReview?: (prescription: ScannedPrescription) => void;
  onOpenSettings?: () => void;
  onAddNewPrescription: () => void;
  onDeleteAccount: (prescriptionId: string) => void;
  onBackToPrevious?: () => void;
}

export const AccountsListScreen: React.FC<AccountsListScreenProps> = ({
  currentLanguage,
  userName = '',
  theme = 'dark',
  prescriptions,
  onSelectAccount,
  onOpenVault,
  onOpenLabDesk,
  onOpenPillsMenu,
  onOpenDoctorReview,
  onOpenSettings,
  onAddNewPrescription,
  onDeleteAccount,
  onBackToPrevious,
}) => {
  const isLight = theme === 'light';
  const t = getTranslation(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [customAppointmentText, setCustomAppointmentText] = useState<string>('');

  const handleDeleteConfirmed = (id: string) => {
    onDeleteAccount(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* Screen Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-700/60 text-blue-300 text-xs font-bold mb-2">
          <FolderHeart className="w-4 h-4 text-blue-400" />
          <span>
            {prescriptions.length} {t.accountNumberLabel}
          </span>
        </div>

        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
          isLight ? 'text-slate-950 font-black' : 'text-white'
        }`}>
          {userName ? `${currentLangObj.greeting}, ${userName}!` : t.accountsHubTitle}
        </h1>

        <p className={`text-xs sm:text-sm max-w-md mx-auto font-semibold ${
          isLight ? 'text-slate-700' : 'text-slate-400'
        }`}>
          {t.accountsHubSubtitle}
        </p>
      </div>

      {/* Settings & Add Prescription Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          {onBackToPrevious && (
            <button
              type="button"
              onClick={onBackToPrevious}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300'
                  : 'bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200'
              }`}
              title={t.backButton}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backButton}</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300'
                  : 'bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 text-slate-200'
              }`}
            >
              <Settings className={`w-4 h-4 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
              <span>{t.settingsTitle}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onAddNewPrescription}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t.addNewAccountButton}</span>
        </button>
      </div>

      {/* Grid of Real Accounts (One Account per Prescription) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {prescriptions.map((prescription, index) => {
          const medCount = prescription.medicines?.length || 0;
          const allergyCount = prescription.allergies?.length || 0;
          const docTests = prescription.diagnosticTests || [];
          const totalDocTests = docTests.length;
          const pendingDocTests = docTests.filter((t) => t.status === 'pending').length;
          const completedDocTests = docTests.filter((t) => t.status === 'completed').length;

          return (
            <div
              key={prescription.id}
              className="group p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-950/40 transition-all flex flex-col justify-between gap-4 relative overflow-hidden"
            >
              {/* Top Banner: Account Badge & Delete */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-black tracking-wide">
                    {t.accountNumberLabel} {index + 1}
                  </span>
                  {allergyCount > 0 && (
                    <span className="p-1 rounded-lg bg-amber-950/60 border border-amber-600/60 text-amber-400" title={t.allergyShieldTitle}>
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Delete Account Trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(prescription.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
                    title={t.deleteAccountButton}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hospital & Doctor Details */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-300 transition-colors leading-snug">
                        {prescription.hospitalName}
                      </h3>
                      <p className="text-xs font-bold text-slate-300 mt-0.5">
                        {prescription.doctorName}
                      </p>
                      {prescription.doctorSpecialty && (
                        <p className="text-[11px] text-slate-400">
                          {prescription.doctorSpecialty}
                        </p>
                      )}
                    </div>
                  </div>

                  {resolvePrescriptionImageUrl(prescription) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenVault?.(prescription);
                      }}
                      className="group/thumb relative w-12 h-14 rounded-xl overflow-hidden border border-slate-700/80 shrink-0 shadow-sm bg-slate-950 hover:border-blue-400 hover:scale-105 transition-all cursor-pointer"
                      title={t.openVaultButton}
                    >
                      <img
                        src={resolvePrescriptionImageUrl(prescription)}
                        alt="Prescription Document"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Visit Date & Patient Details Block */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                {/* Patient Name & Age */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t.patientName || 'Patient'}:</span>
                  </span>
                  <span className="font-black text-emerald-300 px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-[11px]">
                    {prescription.patientName || userName || t.patientName || 'Patient'}
                    {prescription.patientAge ? ` (${prescription.patientAge} Y${prescription.patientGender ? ` / ${prescription.patientGender}` : ''})` : ''}
                  </span>
                </div>

                {/* Date of Visit */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Date of Visit:</span>
                  </span>
                  <span className="font-black text-white px-2.5 py-0.5 rounded-lg bg-blue-950/80 border border-blue-700/60 font-mono text-[11px]">
                    {prescription.date || 'Not mentioned'}
                  </span>
                </div>

                {/* Contact Phone (if extracted from prescription) */}
                {prescription.phoneNumbers && prescription.phoneNumbers.length > 0 && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>{prescription.phoneNumbers[0].label || 'Phone'}:</span>
                    </span>
                    <a
                      href={`tel:${prescription.phoneNumbers[0].number.replace(/\s+/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-blue-300 hover:text-blue-200 px-2 py-0.5 rounded-lg bg-blue-950/80 border border-blue-700/60 font-mono text-[11px] flex items-center gap-1"
                      title="Tap to call"
                    >
                      <span>{prescription.phoneNumbers[0].number}</span>
                    </a>
                  </div>
                )}

                {/* Next Appointment / Re-Check Date or Duration */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Next Appointment / Re-check:</span>
                    </span>

                    {(prescription.nextAppointmentDate || prescription.recheckInterval) ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-300 px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-600/70 text-[11px]">
                          {prescription.nextAppointmentDate || prescription.recheckInterval}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAppointmentId(prescription.id);
                            setCustomAppointmentText(prescription.nextAppointmentDate || prescription.recheckInterval || '');
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="Edit Next Appointment"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 hover:text-amber-300" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAppointmentId(prescription.id);
                          setCustomAppointmentText('');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Re-check / Next Visit</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Writer Box for Patient if not mentioned or editing */}
                  {editingAppointmentId === prescription.id && (
                    <div
                      className="mt-2.5 p-3 rounded-xl bg-slate-900 border border-amber-500/50 space-y-2.5 animate-in fade-in duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[11px] font-bold text-amber-300">
                        When should the patient visit the doctor again? (e.g. after how many weeks, months, or exact date):
                      </p>

                      {/* Quick Duration Buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {['After 1 week', 'After 2 weeks', 'After 1 month', 'After 3 months'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setCustomAppointmentText(chip)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              customAppointmentText === chip
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Custom write-in box */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customAppointmentText}
                          onChange={(e) => setCustomAppointmentText(e.target.value)}
                          placeholder="Write here: e.g. After 15 days, 10 Dec 2024..."
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              storageService.updatePrescriptionAppointment(prescription.id, {
                                recheckInterval: customAppointmentText.trim() || undefined,
                              });
                              setEditingAppointmentId(null);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            storageService.updatePrescriptionAppointment(prescription.id, {
                              recheckInterval: customAppointmentText.trim() || undefined,
                            });
                            setEditingAppointmentId(null);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAppointmentId(null)}
                          className="px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prescribed Diagnostic Tests Clear Overview (ONLY shown if doctor actually ordered tests) */}
              {totalDocTests > 0 && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-blue-400" />
                      <span>Prescribed Medical Tests ({totalDocTests}):</span>
                    </span>
                    {onOpenLabDesk && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLabDesk(prescription);
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-bold underline flex items-center gap-1"
                      >
                        <span>Open Lab Desk</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {pendingDocTests > 0 && (
                      <span className="px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 bg-amber-950/80 border-amber-600/70 text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{pendingDocTests} Tests NOT Done Yet</span>
                      </span>
                    )}

                    {completedDocTests > 0 && (
                      <span className="px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 bg-emerald-950/80 border-emerald-600/70 text-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{completedDocTests} Tests Done</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Medicines Preview Snapshot */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.medicinesFoundTitle}:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-extrabold text-[11px]">
                    {medCount} {t.totalMedicinesCountLabel}
                  </span>
                </div>

                {/* List first 2 medications */}
                <div className="space-y-1.5">
                  {prescription.medicines?.slice(0, 2).map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800"
                    >
                      <span className="font-bold text-white truncate max-w-[160px]">
                        {med.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">
                          {med.frequency}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {med.timing === 'before_food' ? t.timingBeforeFood : t.timingAfterFood}
                        </span>
                      </div>
                    </div>
                  ))}

                  {medCount > 2 && (
                    <p className="text-[11px] text-slate-500 font-medium pl-1">
                      + {medCount - 2} {t.totalMedicinesCountLabel}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Open Account, Lab Tests & View Vault */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectAccount(prescription)}
                  className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md group-hover:shadow-blue-900/50"
                >
                  <span>{t.openAccountButton}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {onOpenLabDesk && (
                    <button
                      type="button"
                      onClick={() => onOpenLabDesk(prescription)}
                      className={`py-2 px-2 rounded-xl active:scale-[0.98] font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                        isLight
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={t.openLabDeskButton}
                    >
                      <FlaskConical className={`w-3.5 h-3.5 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
                      <span>{t.openLabDeskButton}</span>
                    </button>
                  )}

                  {onOpenPillsMenu && (
                    <button
                      type="button"
                      onClick={() => onOpenPillsMenu(prescription)}
                      className={`py-2 px-2 rounded-xl active:scale-[0.98] font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                        isLight
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={t.openPillsMenuButton}
                    >
                      <Pill className={`w-3.5 h-3.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                      <span>{t.openPillsMenuButton}</span>
                    </button>
                  )}

                  {onOpenVault && (
                    <button
                      type="button"
                      onClick={() => onOpenVault(prescription)}
                      className={`py-2 px-2 rounded-xl active:scale-[0.98] font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                        isLight
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={t.openVaultButton}
                    >
                      <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                      <span>{t.openVaultButton}</span>
                    </button>
                  )}

                  {onOpenDoctorReview && (
                    <button
                      type="button"
                      onClick={() => onOpenDoctorReview(prescription)}
                      className={`py-2 px-2 rounded-xl active:scale-[0.98] font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={t.openDoctorReviewButton}
                    >
                      <FileCheck2 className={`w-3.5 h-3.5 ${isLight ? 'text-blue-700' : 'text-blue-300'}`} />
                      <span>{t.openDoctorReviewButton}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Dedicated "+ Add Another Prescription (New Account)" Card */}
        <button
          type="button"
          onClick={onAddNewPrescription}
          className="group p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-950/40 active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center gap-4 cursor-pointer min-h-[300px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg shadow-emerald-950/50">
            <Plus className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors">
              {t.addNewAccountButton}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              {t.addAnotherPrescriptionSubtitle}
            </p>
          </div>
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-red-700/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{t.deleteAccountButton}</span>
              </h4>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.deleteAccountConfirm}
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
                onClick={() => handleDeleteConfirmed(confirmDeleteId)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
              >
                {t.deleteAccountButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
