import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import { ALL_LANGUAGES } from './i18n/languages';
import { getTranslation } from './i18n/translations';
import { Header } from './components/layout/Header';
import { WelcomeLandingScreen } from './components/onboarding/WelcomeLandingScreen';
import { LanguageSelectScreen } from './components/onboarding/LanguageSelectScreen';
import { PreferredNameScreen } from './components/onboarding/PreferredNameScreen';
import { ScanningTutorialScreen } from './components/onboarding/ScanningTutorialScreen';
import { PrescriptionScannerScreen } from './components/scanner/PrescriptionScannerScreen';
import { AccountsListScreen } from './components/cabinet/AccountsListScreen';
import { PrescriptionVaultScreen } from './components/vault/PrescriptionVaultScreen';
import { DiagnosticLabDeskScreen } from './components/lab/DiagnosticLabDeskScreen';
import { PillsInventoryScreen } from './components/pills/PillsInventoryScreen';
import { GlobalDoseAlertModal } from './components/reminders/GlobalDoseAlertModal';
import { DoctorReviewScreen } from './components/review/DoctorReviewScreen';
import { NameChangeModal } from './components/onboarding/NameChangeModal';
import { SettingsModal, type AppTheme } from './components/settings/SettingsModal';
import type { ScannedPrescription } from './types/prescription';
import { 
  RotateCcw, 
  Globe2, 
  Scan,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => storageService.getLanguage());
  const [userName, setUserName] = useState<string>(() => storageService.getUserName());
  
  const [prescriptions, setPrescriptions] = useState<ScannedPrescription[]>(() =>
    storageService.getPrescriptions()
  );

  const [selectedPrescription, setSelectedPrescription] = useState<ScannedPrescription | null>(() => {
    const list = storageService.getPrescriptions();
    const activeId = storageService.getActiveAccountId();
    if (activeId) {
      const found = list.find((p) => p.id === activeId);
      if (found) return found;
    }
    return list.length > 0 ? list[0] : null;
  });

  // App Phase:
  // - If 0 accounts exist (first-time brand new user) -> start on 'welcome'
  // - If 1 prescription account exists -> land directly on that prescription ('scanner')
  // - If >1 accounts exist -> land on the accounts list ('accounts_hub')
  type AppPhase = 'welcome' | 'language_select' | 'preferred_name' | 'tutorial' | 'scanner' | 'accounts_hub' | 'vault' | 'lab' | 'pills_inventory' | 'doctor_review' | 'page3_completed';
  const [appPhase, setAppPhase] = useState<AppPhase>(() => {
    const list = storageService.getPrescriptions();
    if (list.length === 1) {
      return 'scanner';
    } else if (list.length > 1) {
      return 'accounts_hub';
    }
    return 'welcome';
  });

  // Navigation History Stack so Back buttons always navigate smoothly without getting stuck or looping
  const [, setNavHistory] = useState<AppPhase[]>([]);

  const navigateTo = (nextPhase: AppPhase) => {
    if (nextPhase === appPhase) return;
    setNavHistory((prev) => [...prev, appPhase]);
    setAppPhase(nextPhase);
  };

  const navigateBack = () => {
    const stored = storageService.getPrescriptions();
    setNavHistory((prev) => {
      const history = [...prev];
      // Discard any entries that match the current screen
      while (history.length > 0 && history[history.length - 1] === appPhase) {
        history.pop();
      }
      if (history.length > 0) {
        const target = history.pop()!;
        // Anti-looping rule: Once an account exists, NEVER navigate back into onboarding (welcome, language_select, preferred_name, tutorial)!
        if (stored.length > 0 && ['welcome', 'language_select', 'preferred_name', 'tutorial'].includes(target)) {
          setAppPhase(stored.length > 1 ? 'accounts_hub' : 'scanner');
          return [];
        }
        setAppPhase(target);
        return history;
      }

      // Logical fallback if history stack is empty
      if (['vault', 'lab', 'pills_inventory', 'doctor_review'].includes(appPhase)) {
        setAppPhase(stored.length > 1 ? 'accounts_hub' : 'scanner');
      } else if (appPhase === 'accounts_hub') {
        if (stored.length === 1) {
          setAppPhase('scanner');
        }
      } else if (appPhase === 'scanner') {
        if (stored.length > 1) {
          setAppPhase('accounts_hub');
        }
        // If stored.length === 1, keep the user on their prescription account! Never loop to tutorial or welcome!
      } else if (appPhase === 'tutorial') {
        setAppPhase('preferred_name');
      } else if (appPhase === 'preferred_name') {
        setAppPhase('language_select');
      } else if (appPhase === 'language_select') {
        setAppPhase('welcome');
      } else {
        if (stored.length === 1) {
          setAppPhase('scanner');
        } else if (stored.length > 1) {
          setAppPhase('accounts_hub');
        } else {
          setAppPhase('welcome');
        }
      }
      return [];
    });
  };
  
  // Theme state: 'dark' | 'emerald' | 'light' | 'contrast'
  const [theme, setTheme] = useState<AppTheme>(() => storageService.getTheme());

  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // Sync state when storage events occur
  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setCurrentLanguage(customEvent.detail);
    };

    const handleNameChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setUserName(customEvent.detail);
    };

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppTheme>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener('wellbeing_language_changed', handleLangChange);
    window.addEventListener('wellbeing_name_changed', handleNameChange);
    window.addEventListener('wellbeing_theme_changed', handleThemeChange);

    const handlePrescriptionsChange = (e: Event) => {
      const customEvent = e as CustomEvent<ScannedPrescription[]>;
      const updated = customEvent.detail || [];
      setPrescriptions(updated);
      if (updated.length === 0) {
        setSelectedPrescription(null);
        setAppPhase('welcome');
      } else {
        setSelectedPrescription((prev) => {
          if (!prev) return updated[0];
          const found = updated.find((p) => p.id === prev.id);
          return found || updated[0];
        });
        if (updated.length === 1 && appPhase === 'accounts_hub') {
          setAppPhase('scanner');
        }
      }
    };

    window.addEventListener('wellbeing_prescriptions_changed', handlePrescriptionsChange);

    // Start background notification scheduler
    notificationService.startScheduler();

    return () => {
      window.removeEventListener('wellbeing_language_changed', handleLangChange);
      window.removeEventListener('wellbeing_name_changed', handleNameChange);
      window.removeEventListener('wellbeing_theme_changed', handleThemeChange);
      window.removeEventListener('wellbeing_prescriptions_changed', handlePrescriptionsChange);
      notificationService.stopScheduler();
    };
  }, [appPhase]);

  const handleHomeClick = () => {
    const list = storageService.getPrescriptions();
    if (list.length === 1) {
      setSelectedPrescription(list[0]);
      storageService.setActiveAccountId(list[0].id);
      setAppPhase('scanner');
    } else if (list.length > 1) {
      setAppPhase('accounts_hub');
    } else {
      handleResetToWelcome();
    }
  };

  const handleStart = () => {
    navigateTo('language_select');
  };

  // When Page 1 (Language) is completed -> move to Page 2 (Preferred Name)
  const handleSelectLanguage = (code: string) => {
    storageService.setLanguage(code);
    setCurrentLanguage(code);
    navigateTo('preferred_name');
  };

  // When Page 2 (Name) is completed -> move directly to Page 3 (10-Second Guidance Video Tutorial)
  const handleSaveName = (name: string) => {
    storageService.setUserName(name);
    setUserName(name);
    navigateTo('tutorial');
  };

  const handleSkipName = () => {
    storageService.setUserName('');
    setUserName('');
    navigateTo('tutorial');
  };

  const handleBackToLanguage = () => {
    navigateBack();
  };

  const handleBackToName = () => {
    navigateBack();
  };

  const handleCompleteTutorial = () => {
    navigateTo('scanner');
  };

  const handleSkipTutorial = () => {
    navigateTo('scanner');
  };

  const handleResetToWelcome = () => {
    setNavHistory([]);
    setAppPhase('welcome');
  };

  const handleToggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    storageService.setTheme(nextTheme);
    setTheme(nextTheme);
  };

  const handleSelectTheme = (newTheme: AppTheme) => {
    storageService.setTheme(newTheme);
    setTheme(newTheme);
  };

  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];
  const t = getTranslation(currentLanguage);

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      theme === 'light' 
        ? 'bg-slate-100 text-slate-900' 
        : 'bg-slate-950 text-slate-100'
    } flex flex-col`}>

      {/* Show Persistent Header once user leaves welcome page */}
      {appPhase !== 'welcome' && (
        <Header
          currentLanguage={currentLanguage}
          userName={userName}
          onOpenLanguageModal={() => setShowLanguageModal(true)}
          onOpenNameModal={() => setShowNameModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame((prev) => !prev)}
          onHomeClick={handleHomeClick}
        />
      )}

      {/* Main View Area */}
      <div className={`flex-1 flex flex-col items-center justify-center ${
        isMobileFrame && appPhase !== 'welcome' ? 'p-4 sm:p-8 bg-slate-900/60' : ''
      }`}>
        <div className={`w-full transition-all duration-300 ${
          isMobileFrame && appPhase !== 'welcome'
            ? 'max-w-[420px] bg-slate-950 rounded-[44px] border-[10px] border-slate-800 shadow-2xl overflow-hidden min-h-[760px] flex flex-col relative' 
            : 'flex-1 flex flex-col'
        }`}>

          {/* Welcome / Landing Page */}
          {appPhase === 'welcome' && (
            <WelcomeLandingScreen
              onStart={handleStart}
              theme={theme}
              onToggleTheme={handleToggleTheme}
            />
          )}

          {/* Page 1: Language Selection in Dropdown Box */}
          {appPhase === 'language_select' && (
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
              <LanguageSelectScreen
                currentLanguage={currentLanguage}
                onSelectLanguage={handleSelectLanguage}
                onBackToWelcome={() => setAppPhase('welcome')}
              />
            </div>
          )}

          {/* Page 2: Preferred Name Screen ("In what name you want us to call you?") */}
          {appPhase === 'preferred_name' && (
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
              <PreferredNameScreen
                currentLanguage={currentLanguage}
                initialName={userName}
                onSaveName={handleSaveName}
                onSkip={handleSkipName}
                onBackToLanguage={handleBackToLanguage}
              />
            </div>
          )}

          {/* Page 3: 10-Second Interactive Guidance Video Tutorial */}
          {appPhase === 'tutorial' && (
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-4">
              <ScanningTutorialScreen
                currentLanguage={currentLanguage}
                onCompleteTutorial={handleCompleteTutorial}
                onSkip={handleSkipTutorial}
                onBackToPrevious={handleBackToName}
              />
            </div>
          )}

          {/* Page 3 Completed & Ready for Page 4 View */}
          {appPhase === 'page3_completed' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-950/50">
                <Scan className="w-10 h-10" />
              </div>

              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${
                theme === 'light' ? 'text-slate-950 font-black' : 'text-white'
              }`}>
                {userName ? `${currentLangObj.greeting}, ${userName}!` : `${currentLangObj.greeting}!`}
              </h2>
              
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold mb-6">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentLangObj.nativeName}</span>
              </div>

              {/* Final Note Before Taking / Uploading Picture */}
              <div className={`w-full rounded-2xl p-4 mb-6 text-left space-y-2.5 border-2 ${
                theme === 'light'
                  ? 'bg-blue-50/95 border-blue-400 text-slate-900 shadow-md ring-1 ring-blue-200'
                  : 'bg-blue-950/40 border-blue-500/40'
              }`}>
                <div className={`flex items-center gap-2 font-black text-sm ${
                  theme === 'light' ? 'text-blue-950' : 'text-blue-400'
                }`}>
                  <AlertCircle className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-blue-700 stroke-[2.5]' : ''}`} />
                  <span>{t.finalNoteTitle}</span>
                </div>
                <p className={`text-xs leading-relaxed ${
                  theme === 'light' ? 'text-slate-900 font-extrabold' : 'text-slate-300'
                }`}>
                  {t.finalNoteDesc}
                </p>
                <div className={`pt-2 border-t space-y-1.5 text-xs ${
                  theme === 'light' ? 'border-blue-200 text-slate-900 font-bold' : 'border-blue-900/50 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme === 'light' ? 'bg-blue-700' : 'bg-blue-400'}`} />
                    <span>{t.finalNoteFlat}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme === 'light' ? 'bg-blue-700' : 'bg-blue-400'}`} />
                    <span>{t.finalNoteLight}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme === 'light' ? 'bg-blue-700' : 'bg-blue-400'}`} />
                    <span>{t.finalNoteClear}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons to Replay Tutorial or Edit Name / Language */}
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => setAppPhase('scanner')}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <span>{t.startScanningButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                  <button
                    onClick={() => setAppPhase('tutorial')}
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <span>{t.replayButton}</span>
                  </button>
                  <button
                    onClick={handleBackToName}
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>{t.changeName}</span>
                  </button>
                  <button
                    onClick={handleBackToLanguage}
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Globe2 className="w-4 h-4 text-amber-400" />
                    <span>{t.changeLanguage}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page 5: Digital File Cabinet & Accounts Hub (Multi-Account List) */}
          {appPhase === 'accounts_hub' && (
            <div className="flex-1 flex flex-col items-center justify-start py-4 sm:py-6 w-full">
              <AccountsListScreen
                currentLanguage={currentLanguage}
                userName={userName}
                theme={theme}
                prescriptions={prescriptions}
                onSelectAccount={(prescription) => {
                  setSelectedPrescription(prescription);
                  storageService.setActiveAccountId(prescription.id);
                  navigateTo('scanner');
                }}
                onOpenVault={(prescription: ScannedPrescription) => {
                  setSelectedPrescription(prescription);
                  storageService.setActiveAccountId(prescription.id);
                  navigateTo('vault');
                }}
                onOpenLabDesk={(prescription: ScannedPrescription) => {
                  setSelectedPrescription(prescription);
                  storageService.setActiveAccountId(prescription.id);
                  navigateTo('lab');
                }}
                onOpenPillsMenu={(prescription: ScannedPrescription) => {
                  setSelectedPrescription(prescription);
                  storageService.setActiveAccountId(prescription.id);
                  navigateTo('pills_inventory');
                }}
                onOpenDoctorReview={(prescription: ScannedPrescription) => {
                  setSelectedPrescription(prescription);
                  storageService.setActiveAccountId(prescription.id);
                  navigateTo('doctor_review');
                }}
                onOpenSettings={() => setShowSettingsModal(true)}
                onAddNewPrescription={() => {
                  setSelectedPrescription(null);
                  navigateTo('scanner');
                }}
                onBackToPrevious={navigateBack}
                onDeleteAccount={(id) => {
                  storageService.deletePrescription(id);
                  const remaining = storageService.getPrescriptions();
                  if (remaining.length <= 1) {
                    setSelectedPrescription(remaining[0] || null);
                    setAppPhase(remaining.length === 1 ? 'scanner' : 'welcome');
                  }
                }}
              />
            </div>
          )}

          {/* Page 4: Prescription Camera & Handwriting Medical OCR */}
          {appPhase === 'scanner' && (
            <div className="flex-1 flex flex-col items-center justify-start py-4 sm:py-6 w-full">
              <PrescriptionScannerScreen
                currentLanguage={currentLanguage}
                userName={userName}
                theme={theme}
                initialPrescription={selectedPrescription}
                hasMultipleAccounts={prescriptions.length > 1}
                onBackToAccounts={navigateBack}
                onBackToTutorial={navigateBack}
                onOpenVault={() => {
                  navigateTo('vault');
                }}
                onOpenLabDesk={() => {
                  navigateTo('lab');
                }}
                onOpenPillsMenu={() => {
                  navigateTo('pills_inventory');
                }}
                onOpenDoctorReview={() => {
                  navigateTo('doctor_review');
                }}
                onSavedToCabinet={(savedPrescription) => {
                  setSelectedPrescription(savedPrescription);
                  storageService.setActiveAccountId(savedPrescription.id);
                  const currentList = storageService.getPrescriptions();
                  if (currentList.length > 1) {
                    navigateTo('accounts_hub');
                  }
                }}
              />
            </div>
          )}

          {/* Page 6: Original Prescription Paper Document Viewer (Pan & Zoom 1x to 4x, Rotation, Print & Download) */}
          {appPhase === 'vault' && (
            <div className="flex-1 flex flex-col items-center justify-start py-4 sm:py-6 w-full">
              <PrescriptionVaultScreen
                currentLanguage={currentLanguage}
                userName={userName}
                theme={theme}
                activePrescription={selectedPrescription}
                allPrescriptions={prescriptions}
                onSelectPrescription={(p) => {
                  setSelectedPrescription(p);
                  storageService.setActiveAccountId(p.id);
                }}
                onBackToPrevious={navigateBack}
              />
            </div>
          )}

          {/* Page 7: Diagnostic Lab Desk (Doctor-Advised Tests, Pre-Test Prep, Pending vs Completed) */}
          {appPhase === 'lab' && (
            <div className="flex-1 flex flex-col items-center justify-start py-4 sm:py-6 w-full">
              <DiagnosticLabDeskScreen
                currentLanguage={currentLanguage}
                userName={userName}
                theme={theme}
                activePrescription={selectedPrescription}
                allPrescriptions={prescriptions}
                onSelectPrescription={(p) => {
                  setSelectedPrescription(p);
                  storageService.setActiveAccountId(p.id);
                }}
                onBackToPrevious={navigateBack}
                onOpenPillsMenu={() => {
                  navigateTo('pills_inventory');
                }}
                onOpenVault={(p) => {
                  setSelectedPrescription(p);
                  storageService.setActiveAccountId(p.id);
                  navigateTo('vault');
                }}
              />
            </div>
          )}

          {/* Page 8: Current Pills Menu & Refill Inventory */}
          {appPhase === 'pills_inventory' && (
            <div className="flex-1 flex flex-col items-center justify-start py-4 sm:py-6 w-full">
              <PillsInventoryScreen
                currentLanguage={currentLanguage}
                userName={userName}
                theme={theme}
                activePrescription={selectedPrescription}
                allPrescriptions={prescriptions}
                onSelectPrescription={(p) => {
                  setSelectedPrescription(p);
                  storageService.setActiveAccountId(p.id);
                }}
                onBackToPrevious={navigateBack}
                onOpenLabDesk={() => {
                  navigateTo('lab');
                }}
                onOpenDoctorReview={() => {
                  navigateTo('doctor_review');
                }}
              />
            </div>
          )}

          {/* Page 9: Doctor Review Mode & Adherence Proof Report */}
          {appPhase === 'doctor_review' && (
            <div className="flex-1 flex flex-col items-center justify-start py-4 sm:py-6 w-full">
              <DoctorReviewScreen
                currentLanguage={currentLanguage}
                userName={userName}
                theme={theme}
                activePrescription={selectedPrescription}
                allPrescriptions={prescriptions}
                onSelectPrescription={(p) => {
                  setSelectedPrescription(p);
                  storageService.setActiveAccountId(p.id);
                }}
                onBackToPrevious={navigateBack}
                onOpenLabDesk={() => {
                  navigateTo('lab');
                }}
                onOpenPillsMenu={() => {
                  navigateTo('pills_inventory');
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Footer (Visible across all views) */}
      {appPhase !== 'welcome' && (
        <footer className={`w-full py-3 px-6 text-center border-t text-xs transition-colors backdrop-blur-md shrink-0 ${
          theme === 'light'
            ? 'border-slate-200 bg-white/95 text-slate-800 shadow-sm'
            : 'border-slate-800/80 bg-slate-950/80 text-slate-400'
        }`}>
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
            <p className={`font-bold tracking-tight ${theme === 'light' ? 'text-slate-900 font-extrabold' : 'text-slate-300'}`}>
              A Little More Care in Every Part of Life
            </p>
            <p className={theme === 'light' ? 'text-slate-700 font-medium' : 'text-slate-400 font-medium'}>
              Developed by <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>Alankrita Paul</span>
            </p>
          </div>
        </footer>
      )}

      {/* Language Change Modal (Changeable Anytime) */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <LanguageSelectScreen
            currentLanguage={currentLanguage}
            onSelectLanguage={(code) => {
              storageService.setLanguage(code);
              setCurrentLanguage(code);
              setShowLanguageModal(false);
            }}
            isModal={true}
            onClose={() => setShowLanguageModal(false)}
          />
        </div>
      )}

      {/* Name Change Modal (Changeable Anytime) */}
      <NameChangeModal
        currentName={userName}
        currentLanguage={currentLanguage}
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onSaveName={(name) => {
          storageService.setUserName(name);
          setUserName(name);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentLanguage={currentLanguage}
        userName={userName}
        theme={theme}
        onSelectTheme={handleSelectTheme}
        prescriptions={prescriptions}
        onOpenLanguageModal={() => setShowLanguageModal(true)}
        onOpenNameModal={() => setShowNameModal(true)}
        onReplayTutorial={() => {
          navigateTo('tutorial');
        }}
      />

      {/* Global In-App Dose Alert Popup Modal (Time to Take Medicine: Taken / Delay / Skip) */}
      <GlobalDoseAlertModal
        currentLanguage={currentLanguage}
        theme={theme}
      />
    </div>
  );
};

export default App;
