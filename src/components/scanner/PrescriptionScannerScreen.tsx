import React, { useState, useRef, useEffect } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { ocrService } from '../../services/ocrService';
import { storageService, resolvePrescriptionImageUrl } from '../../services/storageService';
import type { ScannedPrescription, Medication } from '../../types/prescription';
import {
  Camera,
  Upload,
  Sparkles,
  ShieldAlert,
  Phone,
  PhoneCall,
  Pill,
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Save,
  ArrowLeft,
  Eye,
  X,
  FileText,
  AlertCircle,
  Copy,
  Check,
  Building2,
  UserCheck,
  FilePlus,
  HelpCircle,
  Info,
  Layers,
  ChevronRight,
  FlaskConical,
  FileCheck2
} from 'lucide-react';

interface PrescriptionScannerScreenProps {
  currentLanguage: string;
  userName?: string;
  initialPrescription?: ScannedPrescription | null;
  hasMultipleAccounts?: boolean;
  onBackToAccounts?: () => void;
  onBackToTutorial: () => void;
  onOpenVault?: () => void;
  onOpenLabDesk?: () => void;
  onOpenPillsMenu?: () => void;
  onOpenReminders?: () => void;
  onOpenDoctorReview?: () => void;
  onSavedToCabinet?: (prescription: ScannedPrescription) => void;
}

export const PrescriptionScannerScreen: React.FC<PrescriptionScannerScreenProps> = ({
  currentLanguage,
  userName = '',
  initialPrescription = null,
  hasMultipleAccounts = false,
  onBackToAccounts,
  onBackToTutorial,
  onOpenVault,
  onOpenLabDesk,
  onOpenPillsMenu,
  onOpenReminders,
  onOpenDoctorReview,
  onSavedToCabinet,
}) => {
  const t = getTranslation(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  const [previewImage, setPreviewImage] = useState<string | null>(() => resolvePrescriptionImageUrl(initialPrescription) || null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);
  const [scannedData, setScannedData] = useState<ScannedPrescription | null>(() => {
    if (!initialPrescription) return null;
    return {
      ...initialPrescription,
      imageDataUrl: resolvePrescriptionImageUrl(initialPrescription),
    };
  });
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Sync state if initialPrescription changes
  useEffect(() => {
    if (initialPrescription) {
      const resolved = {
        ...initialPrescription,
        imageDataUrl: resolvePrescriptionImageUrl(initialPrescription),
      };
      setScannedData(resolved);
      setPreviewImage(resolved.imageDataUrl || null);
    }
  }, [initialPrescription]);

  // Tab View for Medicines: 'schedule' ("Which medicine should be taken at what time") vs 'purpose' ("For which medicine is used for what?")
  const [medicineViewMode, setMedicineViewMode] = useState<'schedule' | 'purpose'>('schedule');

  // Multi-prescription storage list
  const [savedPrescriptionsList, setSavedPrescriptionsList] = useState<ScannedPrescription[]>(() =>
    storageService.getPrescriptions()
  );

  // Add Medication Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedShortName, setNewMedShortName] = useState<string>('');
  const [newMedFullForm, setNewMedFullForm] = useState<string>('');
  const [newMedPurpose, setNewMedPurpose] = useState<string>('');
  const [newMedWhyPrescribed, setNewMedWhyPrescribed] = useState<string>('');
  const [newMedDosage, setNewMedDosage] = useState<string>('');
  const [newMedFreq, setNewMedFreq] = useState<string>('1-0-1');
  const [newMedTiming, setNewMedTiming] = useState<'before_food' | 'after_food'>('after_food');
  const [newMedDuration, setNewMedDuration] = useState<string>('5 days');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addPrescriptionFileRef = useRef<HTMLInputElement>(null);
  const addPrescriptionCameraRef = useRef<HTMLInputElement>(null);

  // Refresh saved prescriptions list when updated
  useEffect(() => {
    const handlePrescriptionsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<ScannedPrescription[]>;
      setSavedPrescriptionsList(customEvent.detail || []);
    };
    window.addEventListener('wellbeing_prescriptions_changed', handlePrescriptionsChanged);
    return () => {
      window.removeEventListener('wellbeing_prescriptions_changed', handlePrescriptionsChanged);
    };
  }, []);

  // Process Prescription Image through Medical OCR
  const handleProcessImage = async (dataUrl: string, sampleIndex: number = 1) => {
    setPreviewImage(dataUrl);
    setIsScanning(true);
    setScannedData(null);
    setIsSaved(false);
    setScanStepIndex(0);

    const step1 = setTimeout(() => setScanStepIndex(1), 400);
    const step2 = setTimeout(() => setScanStepIndex(2), 800);

    try {
      const result = await ocrService.processPrescription(dataUrl, userName, currentLanguage, sampleIndex);
      setScannedData(result);
      // Automatically save to local storage cabinet
      storageService.savePrescription(result);
      setSavedPrescriptionsList(storageService.getPrescriptions());
    } catch (err) {
      console.error('OCR processing error:', err);
    } finally {
      clearTimeout(step1);
      clearTimeout(step2);
      setIsScanning(false);
    }
  };

  // Handle file chosen from upload or camera
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleProcessImage(reader.result, 1);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Use Sample Prescription for 1-Click Verification
  const handleUseSample = (sampleNum: number = 1) => {
    const sampleImageUrl = sampleNum === 2 ? '/images/prescription_apex.jpg' : '/images/prescription_citycare.jpg';
    handleProcessImage(sampleImageUrl, sampleNum);
  };

  // Save Prescription to Local Device Storage
  const handleSaveToCabinet = () => {
    if (!scannedData) return;
    storageService.savePrescription(scannedData);
    setSavedPrescriptionsList(storageService.getPrescriptions());
    setIsSaved(true);
    if (onSavedToCabinet) {
      onSavedToCabinet(scannedData);
    }
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  // Retake / Scan Another
  const handleRetake = () => {
    setPreviewImage(null);
    setScannedData(null);
    setIsSaved(false);
  };

  // Add Another Prescription (Resets scanner for 2nd prescription while keeping previous saved)
  const handleAddAnotherPrescription = () => {
    if (scannedData) {
      storageService.savePrescription(scannedData);
    }
    setPreviewImage(null);
    setScannedData(null);
    setIsSaved(false);
  };

  // Select a previously saved prescription to view
  const handleSelectSavedPrescription = (p: ScannedPrescription) => {
    setScannedData(p);
    setPreviewImage(p.imageDataUrl || null);
    setIsSaved(false);
  };

  // Delete a medication item from parsed list
  const handleDeleteMedication = (id: string) => {
    if (!scannedData) return;
    const updated = {
      ...scannedData,
      medicines: scannedData.medicines.filter((m) => m.id !== id),
    };
    setScannedData(updated);
    storageService.savePrescription(updated);
  };

  // Add a new medication manually
  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedData || !newMedName.trim()) return;

    const newMed: Medication = {
      id: 'med-' + Math.random().toString(36).substring(2, 9),
      name: newMedName.trim(),
      shortName: newMedShortName.trim() || `Tab. ${newMedName.trim().slice(0, 4)}`,
      fullForm: newMedFullForm.trim() || newMedName.trim(),
      purpose: newMedPurpose.trim() || (currentLangObj.code === 'bn' ? 'চিকিৎসা ও রোগ নিরাময়' : 'Therapeutic treatment'),
      whyPrescribed: newMedWhyPrescribed.trim() || (currentLangObj.code === 'bn' ? 'শারীরিক সুস্থতার জন্য ডাক্তারের নির্দেশিত' : 'Doctor prescribed for health recovery'),
      howItWorks: currentLangObj.code === 'bn' ? 'নির্দিষ্ট শারীরিক লক্ষণ নিয়ন্ত্রণ করে' : 'Regulates physiological response',
      dosage: newMedDosage.trim() || '1 tab',
      form: 'tablet',
      frequency: newMedFreq,
      timing: newMedTiming,
      duration: newMedDuration.trim() || '5 days',
    };

    const updated = {
      ...scannedData,
      medicines: [...scannedData.medicines, newMed],
    };

    setScannedData(updated);
    storageService.savePrescription(updated);

    setNewMedName('');
    setNewMedShortName('');
    setNewMedFullForm('');
    setNewMedPurpose('');
    setNewMedWhyPrescribed('');
    setNewMedDosage('');
    setIsAddModalOpen(false);
  };

  // Copy phone number to clipboard
  const handleCopyPhone = (number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedPhone(number);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 animate-in fade-in duration-300">
      {/* Hidden file inputs for Camera and File Picker */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={addPrescriptionCameraRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={addPrescriptionFileRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Screen Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        {hasMultipleAccounts && onBackToAccounts ? (
          <button
            type="button"
            onClick={onBackToAccounts}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-blue-600/60 bg-blue-950/60 hover:bg-blue-900 text-blue-200 text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            title={t.allAccountsButton}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.allAccountsButton}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onBackToTutorial}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.backButton}</span>
          </button>
        )}

        <div className="text-center flex-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            {t.scannerTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t.scannerSubtitle}
          </p>
        </div>

        <div className="w-12 sm:w-16 flex justify-end">
          <span className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-700/60 text-blue-300 text-xs font-bold">
            {currentLangObj.nativeName}
          </span>
        </div>
      </div>

      {/* MULTI-PRESCRIPTION SWITCHER BAR (ONLY IF USER HAS 2 OR MORE ACCOUNTS) */}
      {savedPrescriptionsList.length > 1 && (
        <div className="mb-5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
              {t.allPrescriptionsCount}:
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {savedPrescriptionsList.map((p, idx) => {
              const isActive = scannedData?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectSavedPrescription(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {idx + 1}. {p.hospitalName.slice(0, 18)}...
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dedicated "Add Another Prescription" Quick Pill in Bar */}
          <button
            type="button"
            onClick={handleAddAnotherPrescription}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs whitespace-nowrap flex items-center gap-1 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.addAnotherPrescription}</span>
          </button>
        </div>
      )}

      {/* VIEW 1: EMPTY CAPTURE STATE (Before Image Selected) */}
      {!previewImage && !isScanning && !scannedData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action 1: Open Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="group p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 border-2 border-blue-500/40 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-900/40 active:scale-[0.98] transition-all flex flex-col items-center text-center justify-center gap-4 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shadow-blue-950/50">
                <Camera className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {t.openCameraButton}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
                  {t.properAngleTitle}
                </p>
              </div>
            </button>

            {/* Action 2: Upload from Device Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950 border-2 border-indigo-500/40 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-900/40 active:scale-[0.98] transition-all flex flex-col items-center text-center justify-center gap-4 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-indigo-950/50">
                <Upload className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {t.uploadPhotoBtn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
                  {t.photoAcceptedTitle}
                </p>
              </div>
            </button>
          </div>

          {/* Quick 1-Click Samples for Immediate Testing */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.orUseSample}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sample 1: General Medicine */}
              <button
                type="button"
                onClick={() => handleUseSample(1)}
                className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 text-left transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    <img
                      src="/images/prescription_citycare.jpg"
                      alt="Sample Prescription 1"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-300">
                      {t.sample1Title}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {t.sample1Desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Sample 2: Cardiology & Diabetes (Testing "Add Another Prescription") */}
              <button
                type="button"
                onClick={() => handleUseSample(2)}
                className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 text-left transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-700/60 shrink-0">
                    <img
                      src="/images/prescription_apex.jpg"
                      alt="Sample Prescription 2"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-emerald-300">
                      {t.sample2Title}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {t.sample2Desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ACTIVE OCR SCANNING ANIMATION */}
      {isScanning && (
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border-2 border-blue-500/50 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Prescription Image with Sweeping Laser Line */}
          <div className="w-full max-w-md h-72 sm:h-80 relative rounded-2xl overflow-hidden border-2 border-blue-400/60 shadow-xl bg-black">
            {previewImage && (
              <img
                src={previewImage}
                alt="Scanning Prescription"
                className="w-full h-full object-cover filter brightness-90 contrast-105"
              />
            )}

            {/* Glowing Laser Scanner Beam */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse transition-all duration-75"
                 style={{
                   animation: 'scanningLaser 2s ease-in-out infinite alternate',
                 }}
            />

            {/* Scanner Grid Overlay */}
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex flex-col justify-between p-4">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>
              </div>
            </div>
          </div>

          {/* Scanning Progress Status */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/90 border border-blue-700/80 text-blue-300 font-bold text-xs sm:text-sm animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>{t.scanningInProgress}</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400">
              <p className={scanStepIndex >= 0 ? 'text-cyan-400 font-medium' : ''}>
                ✓ {t.hospitalName} & {t.doctorName}
              </p>
              <p className={scanStepIndex >= 1 ? 'text-cyan-400 font-medium' : ''}>
                ✓ {t.medicinesFoundTitle}
              </p>
              <p className={scanStepIndex >= 2 ? 'text-cyan-400 font-medium' : ''}>
                ✓ {t.allergyShieldTitle} & {t.emergencyPhoneTitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STRUCTURED MEDICAL OCR RESULTS */}
      {scannedData && !isScanning && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Header Card: Hospital, Doctor, Patient, Date */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {scannedData.hospitalName}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-blue-300 mt-0.5">
                    {scannedData.doctorName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {scannedData.doctorSpecialty}
                  </p>
                </div>
              </div>

              {/* Photo Thumbnail with Digital Vault / Zoom Trigger */}
              {resolvePrescriptionImageUrl(scannedData) && (
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenVault) {
                        onOpenVault();
                      } else {
                        setShowImageModal(true);
                      }
                    }}
                    className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-slate-700 hover:border-blue-400 transition-all shadow-md cursor-pointer"
                    title={t.openVaultButton}
                  >
                    <img
                      src={resolvePrescriptionImageUrl(scannedData)}
                      alt="Prescription Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </button>
                  {onOpenVault && (
                    <button
                      type="button"
                      onClick={onOpenVault}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{t.openVaultButton}</span>
                    </button>
                  )}
                  {onOpenLabDesk && (
                    <button
                      type="button"
                      onClick={onOpenLabDesk}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                    >
                      <FlaskConical className="w-3 h-3" />
                      <span>{t.openLabDeskButton}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Patient & Date Meta Info */}
            <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-400">{t.patientName}:</span>
                <span className="font-bold text-white">
                  {userName || scannedData.patientName}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>{scannedData.date}</span>
              </div>
            </div>

            {/* Quick Diagnostic Lab Desk Banner */}
            {scannedData.diagnosticTests && scannedData.diagnosticTests.length > 0 && onOpenLabDesk && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-300 flex items-center gap-1.5 font-bold">
                  <FlaskConical className="w-4 h-4 text-blue-400" />
                  <span>{scannedData.diagnosticTests.length} {t.labDeskTitle}</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenLabDesk}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>{t.openLabDeskButton}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Quick Feature Navigation Shortcuts */}
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {onOpenLabDesk && (
                <button
                  type="button"
                  onClick={onOpenLabDesk}
                  className="py-2 px-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.openLabDeskButton}</span>
                </button>
              )}

              {onOpenPillsMenu && (
                <button
                  type="button"
                  onClick={onOpenPillsMenu}
                  className="py-2 px-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <Pill className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.openPillsMenuButton}</span>
                </button>
              )}

              {onOpenReminders && (
                <button
                  type="button"
                  onClick={onOpenReminders}
                  className="py-2 px-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.openRemindersButton}</span>
                </button>
              )}

              {onOpenDoctorReview && (
                <button
                  type="button"
                  onClick={onOpenDoctorReview}
                  className="py-2 px-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-300" />
                  <span>{t.openDoctorReviewButton}</span>
                </button>
              )}
            </div>
          </div>

          {/* ALLERGY SHIELD ALERT BANNER */}
          {scannedData.allergies && scannedData.allergies.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border-2 border-amber-600/70 shadow-lg text-amber-200 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm sm:text-base font-black text-amber-300 tracking-tight flex items-center gap-2">
                  <span>{t.allergyShieldTitle}</span>
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {scannedData.allergies.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-900/60 border border-amber-600/60 text-xs sm:text-sm font-bold text-white"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CLINIC & EMERGENCY CONTACT NUMBERS (ONE-TAP DIAL) */}
          {/* Strictly displayed ONLY if detected and analyzed on the prescription pad */}
          {scannedData.phoneNumbers && scannedData.phoneNumbers.length > 0 && (
            <div className={`grid gap-3 ${scannedData.phoneNumbers.length === 1 ? 'grid-cols-1 max-w-md mx-auto w-full' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {scannedData.phoneNumbers.map((phone, idx) => {
                const isEmergency = phone.type === 'emergency';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
                      isEmergency
                        ? 'bg-red-950/40 border-red-600/60 text-red-100'
                        : 'bg-slate-900/90 border-slate-800 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isEmergency
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                      }`}>
                        {isEmergency ? <PhoneCall className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          {isEmergency ? t.emergencyPhoneTitle : t.bookingPhoneTitle}
                        </span>
                        <a
                          href={`tel:${phone.number.replace(/\s+/g, '')}`}
                          className="text-sm sm:text-base font-black hover:underline"
                        >
                          {phone.number}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(phone.number)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copy Number"
                      >
                        {copiedPhone === phone.number ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={`tel:${phone.number.replace(/\s+/g, '')}`}
                        className={`p-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                          isEmergency
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                        }`}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DEDICATED MEDICATIONS SECTION WITH DUAL VIEW OPTIONS */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            {/* Top Toolbar: Heading, Counts, and "+ Add Another Medicine" button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {t.medicinesFoundTitle}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
                  {scannedData.medicines.length}
                </span>
              </div>

              {/* Action: Add Medicine */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addMedicineButton}</span>
              </button>
            </div>

            {/* DUAL VIEW OPTIONS TABS:
                Option 1: "Which medicine should be taken at what time" (Schedule, 1-0-1, Before/After Food)
                Option 2: "For which medicine is used for what?" (Short name in Rx, full form, purpose, why & how)
            */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMedicineViewMode('schedule')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  medicineViewMode === 'schedule'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{t.scheduleTimingTitle}</span>
              </button>

              <button
                type="button"
                onClick={() => setMedicineViewMode('purpose')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  medicineViewMode === 'purpose'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-cyan-300" />
                <span>{t.medicinePurposeTitle}</span>
              </button>
            </div>

            {/* OPTION 1 CONTENT: "Which medicine should be taken at what time" (Schedule View) */}
            {medicineViewMode === 'schedule' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                {scannedData.medicines.map((med) => {
                  const isBeforeFood = med.timing === 'before_food';
                  const freqParts = med.frequency.split('-');

                  return (
                    <div
                      key={med.id}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                            {med.name}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-950/70 border border-blue-800/60 text-blue-300 text-xs font-bold">
                            {med.dosage}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">
                            ({med.form === 'capsule' ? t.formCapsuleText : t.formTabletText})
                          </span>
                        </div>

                        {med.instructions && (
                          <p className="text-xs text-slate-400 italic">
                            ℹ️ {med.instructions}
                          </p>
                        )}
                      </div>

                      {/* Schedule Pills & Actions */}
                      <div className="flex flex-wrap items-center gap-2 sm:self-center">
                        {/* Schedule Badges (Morning / Afternoon / Night) */}
                        {freqParts.length === 3 && (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                            <span className={`font-bold ${freqParts[0] !== '0' ? 'text-amber-400' : 'text-slate-500'}`}>
                              ☀️ {freqParts[0]}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className={`font-bold ${freqParts[1] !== '0' ? 'text-amber-400' : 'text-slate-500'}`}>
                              🌤️ {freqParts[1]}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className={`font-bold ${freqParts[2] !== '0' ? 'text-indigo-400' : 'text-slate-500'}`}>
                              🌙 {freqParts[2]}
                            </span>
                          </div>
                        )}

                        {/* Timing Badge (Before vs After Food) */}
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${
                          isBeforeFood
                            ? 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                            : 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {isBeforeFood ? t.timingBeforeFood : t.timingAfterFood}
                        </span>

                        {/* Duration */}
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
                          {med.duration}
                        </span>

                        {/* Quick Shortcut to Switch to Purpose View for this medicine */}
                        <button
                          type="button"
                          onClick={() => setMedicineViewMode('purpose')}
                          className="px-2 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-700/60 text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title={t.medicinePurposeTitle}
                        >
                          <Info className="w-3 h-3" />
                          <span className="hidden sm:inline">{t.usePurposeLabel.split(' ')[0]}</span>
                        </button>

                        {/* Delete Medication Action */}
                        <button
                          type="button"
                          onClick={() => handleDeleteMedication(med.id)}
                          className="p-1.5 rounded-lg hover:bg-red-950/60 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* OPTION 2 CONTENT: "For which medicine is used for what?" (Purpose & Explanation View) */}
            {medicineViewMode === 'purpose' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {scannedData.medicines.map((med) => (
                  <div
                    key={med.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-cyan-800/40 hover:border-cyan-600/60 transition-all space-y-3"
                  >
                    {/* Header: Short Name in Prescription vs Full Generic Name */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-mono font-bold">
                            Rx: {med.shortName || med.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({t.shortNameLabel})
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                          {med.fullForm || med.name}
                        </h4>
                      </div>

                      <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 self-start sm:self-auto">
                        {med.dosage} • {med.form === 'capsule' ? t.formCapsuleText : t.formTabletText}
                      </span>
                    </div>

                    {/* What is the use of it? */}
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-700/40 text-xs sm:text-sm text-cyan-200 space-y-1">
                      <div className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{t.usePurposeLabel}:</span>
                      </div>
                      <p className="text-slate-200 font-medium pl-5">
                        {med.purpose || (currentLangObj.code === 'bn' ? 'রোগ নিরাময় ও শারীরিক সুস্থতা বৃদ্ধি' : 'Therapeutic healing and wellness')}
                      </p>
                    </div>

                    {/* Why and How it is given to patient? */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      {/* Why Prescribed */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-1">
                        <span className="font-bold text-amber-300 block">
                          📌 {t.whyPrescribedLabel}:
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {med.whyPrescribed || (currentLangObj.code === 'bn' ? 'রোগের কারণ নির্মূল ও লক্ষণ নিরাময়ের জন্য' : 'To address underlying diagnosis')}
                        </p>
                      </div>

                      {/* How it Works */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-1">
                        <span className="font-bold text-emerald-300 block">
                          ⚙️ {t.howItWorksLabel}:
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {med.howItWorks || (currentLangObj.code === 'bn' ? 'শরীরের ভেতরে সুনির্দিষ্টভাবে কার্যক্ষমতা প্রদান করে' : 'Acts on targeted physiological pathways')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Doctor's Notes */}
            {scannedData.notes && (
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">
                    {currentLangObj.code === 'bn' ? 'ডাক্তারের পরামর্শ:' : 'Doctor Advice:'}
                  </strong>{' '}
                  {scannedData.notes}
                </span>
              </div>
            )}
          </div>

          {/* DEDICATED SPACE: "ADD ANOTHER PRESCRIPTION" SECTION */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 transition-all shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <FilePlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {t.addAnotherPrescription}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t.addAnotherPrescriptionSubtitle}
                  </p>
                </div>
              </div>

              {/* Action buttons inside dedicated space */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => addPrescriptionCameraRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t.openCameraButton}</span>
                </button>

                <button
                  type="button"
                  onClick={() => addPrescriptionFileRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t.uploadPhotoBtn}</span>
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
            <button
              type="button"
              onClick={handleRetake}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>{t.retakeButton}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToCabinet}
              disabled={isSaved}
              className={`w-full sm:flex-1 max-w-md py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xl ${
                isSaved
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white shadow-blue-900/50'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>✓ {t.saveToCabinetButton}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 text-white" />
                  <span>{t.saveToCabinetButton}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: FULLSCREEN LIGHTBOX FOR ORIGINAL PRESCRIPTION PHOTO */}
      {showImageModal && scannedData?.imageDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">
                {currentLangObj.code === 'bn' ? 'মূল প্রেসক্রিপশন নথি' : 'Original Prescription Document'}
              </h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60">
              <img
                src={resolvePrescriptionImageUrl(scannedData)}
                alt="Full Prescription"
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MEDICATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-400" />
                <span>{t.addMedicineButton}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {currentLangObj.code === 'bn' ? 'ঔষধের নাম' : 'Medicine Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder={currentLangObj.code === 'bn' ? 'যেমন: প্যারাসিটামল' : 'e.g. Paracetamol'}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t.shortNameLabel}
                  </label>
                  <input
                    type="text"
                    value={newMedShortName}
                    onChange={(e) => setNewMedShortName(e.target.value)}
                    placeholder="Tab. PCM 650"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t.dosageLabel}
                  </label>
                  <input
                    type="text"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    placeholder="500 mg"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {t.usePurposeLabel}
                </label>
                <input
                  type="text"
                  value={newMedPurpose}
                  onChange={(e) => setNewMedPurpose(e.target.value)}
                  placeholder={currentLangObj.code === 'bn' ? 'যেমন: জ্বর ও শরীর ব্যথার উপশম' : 'e.g. Pain relief & fever reduction'}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {t.frequencyLabel}
                  </label>
                  <select
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="1-0-1">1-0-1</option>
                    <option value="1-0-0">1-0-0</option>
                    <option value="0-0-1">0-0-1</option>
                    <option value="1-1-1">1-1-1</option>
                    <option value="SOS">SOS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {currentLangObj.code === 'bn' ? 'খাওয়ার সময়' : 'Timing'}
                  </label>
                  <select
                    value={newMedTiming}
                    onChange={(e) => setNewMedTiming(e.target.value as 'before_food' | 'after_food')}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="after_food">{t.timingAfterFood}</option>
                    <option value="before_food">{t.timingBeforeFood}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {currentLangObj.code === 'bn' ? 'সময়কাল' : 'Duration'}
                  </label>
                  <input
                    type="text"
                    value={newMedDuration}
                    onChange={(e) => setNewMedDuration(e.target.value)}
                    placeholder={currentLangObj.code === 'bn' ? '৫ দিন' : '5 days'}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
                >
                  {t.backButton}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md"
                >
                  {t.addMedicineButton}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
