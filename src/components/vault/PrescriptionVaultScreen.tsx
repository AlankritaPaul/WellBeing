import React, { useState, useRef, useEffect } from 'react';
import { getTranslation } from '../../i18n/translations';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { resolvePrescriptionImageUrl } from '../../services/storageService';
import type { ScannedPrescription } from '../../types/prescription';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  RotateCcw,
  Building2,
  Calendar,
  Pill,
  ShieldAlert,
  ArrowLeft,
  FileCheck2,
  UserCheck
} from 'lucide-react';

interface PrescriptionVaultScreenProps {
  currentLanguage: string;
  userName?: string;
  theme?: 'dark' | 'light';
  activePrescription: ScannedPrescription | null;
  allPrescriptions: ScannedPrescription[];
  onSelectPrescription: (prescription: ScannedPrescription) => void;
  onBackToPrevious: () => void;
}

export const PrescriptionVaultScreen: React.FC<PrescriptionVaultScreenProps> = ({
  currentLanguage,
  userName = '',
  theme = 'dark',
  activePrescription,
  allPrescriptions,
  onSelectPrescription,
  onBackToPrevious,
}) => {
  const isLight = theme === 'light';
  const t = getTranslation(currentLanguage);
  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];

  // Pan & Zoom Controls (1x to 4x)
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Selected prescription to display (fallback to first if none specified)
  const currentDoc: ScannedPrescription | null =
    activePrescription || (allPrescriptions.length > 0 ? allPrescriptions[0] : null);

  const documentImageUrl = resolvePrescriptionImageUrl(currentDoc);

  // Reset zoom & pan when switching document
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  }, [currentDoc?.id]);

  // Zoom handlers (range: 1.0 to 4.0)
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 4.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1.0);
      if (next === 1.0) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - panPosition.x,
      y: e.touches[0].clientY - panPosition.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomLevel <= 1 || e.touches.length !== 1) return;
    setPanPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Download document image file locally
  const handleDownload = () => {
    if (!documentImageUrl) return;
    const link = document.createElement('a');
    link.href = documentImageUrl;
    const docName = (currentDoc?.doctorName || 'Prescription').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `WellBeing_${docName}_Document.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Native Print / Save to PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b mb-5 ${
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
        </div>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          isLight
            ? 'bg-blue-50 border border-blue-200 text-blue-900'
            : 'bg-blue-950/80 border border-blue-700/60 text-blue-300'
        }`}>
          <FileCheck2 className={`w-3.5 h-3.5 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
          <span>{t.highQualityScanBadge}</span>
        </div>
      </div>

      {/* Screen Title & Subtitle Banner */}
      <div className="space-y-1 mb-5">
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
          isLight ? 'text-slate-950 font-black' : 'text-white'
        }`}>
          {t.vaultTitle}
        </h1>
        <p className={`text-xs sm:text-sm max-w-2xl font-semibold ${
          isLight ? 'text-slate-700' : 'text-slate-400'
        }`}>
          {t.vaultSubtitle}
        </p>
      </div>

      {/* Multi-Prescription Tabs (If patient has multiple accounts) */}
      {allPrescriptions.length > 1 && (
        <div className="mb-5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2 overflow-x-auto shadow-lg">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap pl-1">
            {t.switchPrescriptionLabel}:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {allPrescriptions.map((p, idx) => {
              const isSelected = p.id === currentDoc?.id;
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
                  <span>{p.hospitalName.slice(0, 20)}...</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Vault Workspace: Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive High-Resolution Document Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Inspection Toolbar: Zoom, Rotate, Reset, Fullscreen */}
          <div className="p-3 rounded-2xl bg-slate-900/95 border border-slate-800 flex items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950/80 text-slate-200 border border-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                title={t.zoomOutButton}
              >
                <ZoomOut className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">{t.zoomOutButton}</span>
              </button>

              <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-300 font-mono font-bold text-xs min-w-[54px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950/80 text-slate-200 border border-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                title={t.zoomInButton}
              >
                <ZoomIn className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">{t.zoomInButton}</span>
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                title={t.resetZoomButton}
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{t.resetZoomButton}</span>
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                title={t.rotateButton}
              >
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">{t.rotateButton}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                title="Fullscreen Toggle"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-slate-300" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-slate-300" />
                )}
              </button>
            </div>
          </div>

          {/* Interactive Document Viewport */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center select-none shadow-2xl transition-all ${
              isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'min-h-[460px] sm:min-h-[580px]'
            } ${zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
          >
            {documentImageUrl ? (
              <div
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                  transformOrigin: 'center center',
                }}
                className="max-w-[90%] max-h-[85%] flex items-center justify-center p-4 pointer-events-none"
              >
                <img
                  src={documentImageUrl}
                  alt="Original Medical Prescription"
                  className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-800/80"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <FileCheck2 className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">{t.noLanguagesFound}</p>
              </div>
            )}

            {/* Quick Hint Overlay when Zoomed In */}
            {zoomLevel > 1 && (
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-300 font-medium pointer-events-none">
                {currentLangObj.code === 'bn' ? '👆 মাউস দিয়ে টেনে পুরো পাতা দেখুন' : '👆 Drag to pan around the document'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prescription Metadata Card & Action Tools */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Metadata Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>{t.documentDetailsTitle}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold text-[10px]">
                {t.highQualityScanBadge}
              </span>
            </div>

            {/* Hospital & Doctor Details */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t.clinicalFacilityLabel}
                </span>
                <p className="text-base font-extrabold text-white leading-snug">
                  {currentDoc?.hospitalName}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t.consultingDoctorLabel}
                </span>
                <p className="font-bold text-blue-300">
                  {currentDoc?.doctorName}
                </p>
                {currentDoc?.doctorSpecialty && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentDoc.doctorSpecialty}
                  </p>
                )}
              </div>

              {/* Patient & Date Meta */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.patientName}</span>
                  </span>
                  <p className="font-bold text-white text-xs sm:text-sm">
                    {currentDoc?.patientName || userName}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.scanDateLabel}</span>
                  </span>
                  <p className="font-bold text-white text-xs sm:text-sm">
                    {currentDoc?.date}
                  </p>
                </div>
              </div>

              {/* Medicines Count Snapshot */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-2 text-xs">
                  <Pill className="w-4 h-4 text-emerald-400" />
                  <span>{t.extractedMedicinesLabel}:</span>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-extrabold text-xs">
                  {currentDoc?.medicines?.length || 0} {t.totalMedicinesCountLabel}
                </span>
              </div>

              {/* Allergy Alert Tag if present */}
              {currentDoc?.allergies && currentDoc.allergies.length > 0 && (
                <div className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs ${
                  isLight
                    ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
                    : 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                }`}>
                  <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                  <div>
                    <span className={`font-extrabold block mb-0.5 ${isLight ? 'text-amber-950' : 'text-amber-300'}`}>{t.allergyShieldTitle}:</span>
                    <span className={`text-[11px] font-medium ${isLight ? 'text-amber-900' : 'text-amber-200'}`}>
                      {currentDoc.allergies.join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Download & Print PDF */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-950/60"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadDocumentButton}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>{t.printDocumentButton}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
