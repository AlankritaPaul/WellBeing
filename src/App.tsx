import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import { ALL_LANGUAGES } from './i18n/languages';
import { getTranslation } from './i18n/translations';
import { Header } from './components/layout/Header';
import { WelcomeLandingScreen } from './components/onboarding/WelcomeLandingScreen';
import { LanguageSelectScreen } from './components/onboarding/LanguageSelectScreen';
import { PreferredNameScreen } from './components/onboarding/PreferredNameScreen';
import { NameChangeModal } from './components/onboarding/NameChangeModal';
import { 
  RotateCcw, 
  Globe2, 
  UserCheck
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => storageService.getLanguage());
  const [userName, setUserName] = useState<string>(() => storageService.getUserName());
  
  // App Phase: 'welcome' | 'language_select' | 'preferred_name' | 'page2_completed'
  const [appPhase, setAppPhase] = useState<'welcome' | 'language_select' | 'preferred_name' | 'page2_completed'>('welcome');
  
  // Theme state: 'dark' | 'light' | 'emerald'
  const [theme, setTheme] = useState<'dark' | 'light' | 'emerald'>('dark');

  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
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

    window.addEventListener('wellbeing_language_changed', handleLangChange);
    window.addEventListener('wellbeing_name_changed', handleNameChange);

    return () => {
      window.removeEventListener('wellbeing_language_changed', handleLangChange);
      window.removeEventListener('wellbeing_name_changed', handleNameChange);
    };
  }, []);

  const handleStart = () => {
    setAppPhase('language_select');
  };

  // When Page 1 (Language) is completed -> move to Page 2 (Preferred Name)
  const handleSelectLanguage = (code: string) => {
    storageService.setLanguage(code);
    setCurrentLanguage(code);
    setAppPhase('preferred_name');
  };

  // When Page 2 (Name) is completed -> save and show summary review
  const handleSaveName = (name: string) => {
    storageService.setUserName(name);
    setUserName(name);
    setAppPhase('page2_completed');
  };

  const handleSkipName = () => {
    storageService.setUserName('');
    setUserName('');
    setAppPhase('page2_completed');
  };

  const handleBackToLanguage = () => {
    setAppPhase('language_select');
  };

  const handleResetToWelcome = () => {
    setAppPhase('welcome');
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'emerald' : prev === 'emerald' ? 'light' : 'dark'));
  };

  const currentLangObj = ALL_LANGUAGES.find((l) => l.code === currentLanguage) || ALL_LANGUAGES[0];
  const t = getTranslation(currentLanguage);

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      theme === 'dark' 
        ? 'bg-slate-950 text-slate-100' 
        : theme === 'emerald'
        ? 'bg-[#041a14] text-emerald-50'
        : 'bg-slate-100 text-slate-900'
    } flex flex-col`}>

      {/* Show Persistent Header once user leaves welcome page */}
      {appPhase !== 'welcome' && (
        <Header
          currentLanguage={currentLanguage}
          userName={userName}
          onOpenLanguageModal={() => setShowLanguageModal(true)}
          onOpenNameModal={() => setShowNameModal(true)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame((prev) => !prev)}
          onHomeClick={handleResetToWelcome}
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

          {/* Page 2 Completed & Verified View */}
          {appPhase === 'page2_completed' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-950/50">
                <UserCheck className="w-10 h-10" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                {userName ? `${currentLangObj.greeting}, ${userName}!` : `${currentLangObj.greeting}!`}
              </h2>
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-sm font-bold mb-6">
                <span>{currentLangObj.nativeName}</span>
              </div>

              {/* Action Buttons to Edit or Continue */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  onClick={() => setAppPhase('preferred_name')}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>{t.changeName}</span>
                </button>
                <button
                  onClick={handleBackToLanguage}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Globe2 className="w-4 h-4 text-amber-400" />
                  <span>{t.changeLanguage}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default App;
