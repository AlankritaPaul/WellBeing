import React, { useState, useEffect, useRef } from 'react';
import { ALL_LANGUAGES } from '../../i18n/languages';
import { getTranslation } from '../../i18n/translations';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  FastForward, 
  CheckCircle2, 
  XCircle, 
  Check, 
  Maximize2, 
  Minimize2
} from 'lucide-react';

interface ScanningTutorialScreenProps {
  currentLanguage: string;
  onCompleteTutorial: () => void;
  onSkip: () => void;
  onBackToPrevious: () => void;
}

export const ScanningTutorialScreen: React.FC<ScanningTutorialScreenProps> = ({
  currentLanguage,
  onCompleteTutorial,
  onSkip,
  onBackToPrevious,
}) => {
  // Relaxed 18-second story (6s per scene)
  // Scene 1: Real photo of hand & phone casting shadow -> Red ✕ (0s - 6s)
  // Scene 2: Real photo of proper angle & clean lighting, shutter flash -> Blue ✓ (6s - 12s)
  // Scene 3: Photo accepted successfully with clear message (12s - 18s)
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];
  const t = getTranslation(currentLanguage);

  const TOTAL_DURATION_MS = 18000; // 18 seconds

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => {
          const next = prev + 50;
          if (next >= TOTAL_DURATION_MS) {
            setIsPlaying(false);
            return TOTAL_DURATION_MS;
          }
          return next;
        });
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const isScene1Shadow = elapsedTime < 6000;
  const isScene2ProperAngle = elapsedTime >= 6000 && elapsedTime < 12000;
  const isScene3Accepted = elapsedTime >= 12000;

  // Shutter flash effect around 10.5s
  const isShutterFlash = elapsedTime >= 10500 && elapsedTime <= 10800;

  const progressPercent = Math.min(100, (elapsedTime / TOTAL_DURATION_MS) * 100);

  const handleTogglePlay = () => {
    if (elapsedTime >= TOTAL_DURATION_MS) {
      setElapsedTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    setElapsedTime(0);
    setIsPlaying(true);
  };

  const handleSelectScene = (sceneIndex: 1 | 2 | 3) => {
    if (sceneIndex === 1) setElapsedTime(0);
    if (sceneIndex === 2) setElapsedTime(6200);
    if (sceneIndex === 3) setElapsedTime(12200);
    setIsPlaying(true);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Container Box */}
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Bar: Back Button, Native Language Badge, and Skip Button */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onBackToPrevious}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
            aria-label={t.backButton}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backButton}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold">
              {currentLangObj.nativeName}
            </span>
            <button
              type="button"
              onClick={onSkip}
              className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>{t.skipButton}</span>
              <FastForward className="w-3.5 h-3.5 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="pt-5 px-6 pb-2 text-center">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {t.tutorialTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t.tutorialSubtitle}
          </p>
        </div>

        {/* Video Player Section with Fullscreen Capability */}
        <div className="p-4 sm:p-6 flex flex-col items-center">
          <div 
            className={`w-full relative rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between select-none bg-slate-950 transition-all ${
              isFullscreen 
                ? 'fixed inset-0 z-50 rounded-none border-none p-4 sm:p-8 flex flex-col justify-between' 
                : 'h-[380px] sm:h-[480px]'
            }`}
          >
            {/* Top Overlay Bar inside Player: Status Alert Pill & Fullscreen Toggle */}
            <div className="z-30 p-3 sm:p-4 flex items-center justify-between pointer-events-auto">
              {/* Scene Indicator Alert Pill */}
              <div>
                {isScene1Shadow && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600/95 text-white font-extrabold text-xs sm:text-sm shadow-xl border border-red-400 backdrop-blur-sm animate-pulse">
                    <XCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>{t.shadowWrongTitle}</span>
                  </div>
                )}
                {isScene2ProperAngle && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600/95 text-white font-extrabold text-xs sm:text-sm shadow-xl border border-blue-400 backdrop-blur-sm">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{t.properAngleTitle}</span>
                  </div>
                )}
                {isScene3Accepted && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600/95 text-white font-extrabold text-xs sm:text-sm shadow-xl border border-blue-400 backdrop-blur-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t.finalNoteTitle}</span>
                  </div>
                )}
              </div>

              {/* Fullscreen Expand / Exit Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Minimize' : 'Fullscreen'}</span>
              </button>
            </div>

            {/* Shutter Camera Flash Overlay */}
            {isShutterFlash && (
              <div className="absolute inset-0 bg-white z-40 pointer-events-none animate-out fade-out duration-300"></div>
            )}

            {/* Real Visual Content Area (Table, Prescription & Hands Holding Phone) */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2">
              
              {/* Scene 1: Real Photo of Hand & Phone casting shadow on Prescription */}
              {isScene1Shadow && (
                <div className="relative w-full h-full flex items-center justify-center animate-in fade-in duration-500">
                  <img
                    src="/images/tutorial_shadow.jpg"
                    alt="Hands holding phone casting shadow on prescription"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  />
                  {/* Subtle Red Warning Border Glow */}
                  <div className="absolute inset-2 border-2 border-red-500/60 rounded-xl pointer-events-none"></div>
                </div>
              )}

              {/* Scene 2: Real Photo of Proper Angle with Live Viewfinder & No Shadow */}
              {isScene2ProperAngle && (
                <div className="relative w-full h-full flex items-center justify-center animate-in fade-in duration-500">
                  <img
                    src="/images/tutorial_clean.jpg"
                    alt="Proper angle document scanning with hands holding phone above paper"
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  />
                  {/* Subtle Blue Focus Framing Glow */}
                  <div className="absolute inset-2 border-2 border-blue-400/60 rounded-xl pointer-events-none"></div>
                </div>
              )}

              {/* Scene 3: Final Note Before Taking Photo */}
              {isScene3Accepted && (
                <div className="relative w-full h-full flex items-center justify-center animate-in fade-in duration-500 p-4">
                  {/* Background Clean Image Preview */}
                  <img
                    src="/images/tutorial_clean.jpg"
                    alt="Prescription guidance"
                    className="max-w-full max-h-full object-contain rounded-xl opacity-30 blur-xs"
                  />
                  
                  {/* Foreground Card: Final Note */}
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-slate-900/95 border-2 border-blue-500 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-md flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg mb-3">
                        <Check className="w-7 h-7 stroke-[3]" />
                      </div>
                      <h3 className="text-base sm:text-xl font-black text-white mb-2">
                        {t.finalNoteTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                        {t.finalNoteDesc}
                      </p>
                      <div className="w-full text-left space-y-1.5 pt-2 border-t border-slate-800 text-[11px] sm:text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span>{t.finalNoteFlat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span>{t.finalNoteLight}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span>{t.finalNoteClear}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video Control Bar: Play/Pause, Replay & Progress Scrubber */}
            <div className="z-30 bg-slate-950/95 border-t border-slate-800 p-3 sm:p-3.5 flex flex-col gap-2.5">
              
              {/* Progress Scrubber Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Bottom Controls Row: Play/Pause, Replay & Descriptive Scene Tabs */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlay}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center shadow-sm"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button
                    onClick={handleRestart}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title={t.replayButton}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Scene Selectors (Click to jump to any stage) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleSelectScene(1)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isScene1Shadow
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t.shadowWrongTitle.split('—')[0]}</span>
                  </button>
                  <button
                    onClick={() => handleSelectScene(2)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isScene2ProperAngle
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.properAngleTitle.split('—')[0]}</span>
                  </button>
                  <button
                    onClick={() => handleSelectScene(3)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isScene3Accepted
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.finalNoteTitle.split('—')[0].split(':')[0]}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Captions Card in Selected Language */}
          <div className="w-full mt-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border-2 border-slate-300 dark:border-slate-700 transition-all text-left">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              {isScene1Shadow ? t.shadowWrongTitle : isScene2ProperAngle ? t.properAngleTitle : t.finalNoteTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {isScene1Shadow ? t.shadowWrongDesc : isScene2ProperAngle ? t.properAngleDesc : t.finalNoteDesc}
            </p>
          </div>

          {/* Bottom Actions: Skip & Start Scanning */}
          <div className="w-full mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
            >
              {t.skipButton}
            </button>

            <button
              type="button"
              onClick={onCompleteTutorial}
              className="flex-1 max-w-xs py-3 px-5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <span>{t.startScanningButton}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
