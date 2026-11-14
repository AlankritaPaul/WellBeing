export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  script: string;
  greeting: string;
  continueText: string;
  popular?: boolean;
}

export type SupportedLanguageCode = 
  | 'as' | 'bn' | 'bho' | 'brx' | 'doi' | 'en' | 'gu' | 'hi' | 'kn' 
  | 'ks' | 'kok' | 'mai' | 'ml' | 'mni' | 'mr' | 'ne' | 'or' 
  | 'pa' | 'sa' | 'sat' | 'sd' | 'ta' | 'te' | 'ur'
  | 'ar' | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'ru' | 'zh';

export interface TranslationDictionary {
  appName: string;
  appTagline: string;
  languageLabel: string;
  selectLanguageTitle: string;
  selectLanguageSubtitle: string;
  searchPlaceholder: string;
  allLanguagesCount: string;
  noLanguagesFound: string;
  tryDifferentSearch: string;
  selectedLanguage: string;
  continueButton: string;
  changeLanguage: string;
  changeName: string;
  currentActive: string;
  alphabeticalOrder: string;
  totalLanguages: string;
  greetingPreview: string;
}
