import React, { useState } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { resolvePrescriptionImageUrl } from '../../services/storageService';
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
  X
} from 'lucide-react';

interface AccountsListScreenProps {
  currentLanguage: string;
  userName?: string;
  prescriptions: ScannedPrescription[];
  onSelectAccount: (prescription: ScannedPrescription) => void;
  onAddNewPrescription: () => void;
  onDeleteAccount: (prescriptionId: string) => void;
}

export const AccountsListScreen: React.FC<AccountsListScreenProps> = ({
  currentLanguage,
  userName = '',
  prescriptions,
  onSelectAccount,
  onAddNewPrescription,
  onDeleteAccount,
}) => {
  const t = getTranslation(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {userName ? `${currentLangObj.greeting}, ${userName}!` : t.accountsHubTitle}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          {t.accountsHubSubtitle}
        </p>
      </div>

      {/* Grid of Real Accounts (One Account per Prescription) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {prescriptions.map((prescription, index) => {
          const medCount = prescription.medicines?.length || 0;
          const allergyCount = prescription.allergies?.length || 0;

          return (
            <div
              key={prescription.id}
              className="group p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-950/40 transition-all flex flex-col justify-between gap-5 relative overflow-hidden"
            >
              {/* Top Banner: Account Badge & Date */}
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
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {prescription.date}
                  </span>

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
                    <div className="w-12 h-14 rounded-xl overflow-hidden border border-slate-700/80 shrink-0 shadow-sm bg-slate-950 group-hover:border-blue-500/50 transition-colors">
                      <img
                        src={resolvePrescriptionImageUrl(prescription)}
                        alt="Prescription Document"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

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

              {/* Primary Action Button: Open Account */}
              <button
                type="button"
                onClick={() => onSelectAccount(prescription)}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-blue-900/50"
              >
                <span>{t.openAccountButton}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
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
