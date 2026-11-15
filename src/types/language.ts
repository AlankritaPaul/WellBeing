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

  // Page 2: Preferred Name Screen
  nameScreenTitle: string;
  nameInputPlaceholder: string;
  quickSuggestions: string;
  backButton: string;
  skipButton: string;
  saveAndContinue: string;
  page2Badge: string;
  presets: string[];

  // Page 3: Interactive Guidance Video Tutorial (Shadow -> Proper Angle -> Photo Accepted)
  tutorialTitle: string;
  tutorialSubtitle: string;
  shadowWrongTitle: string;
  shadowWrongDesc: string;
  properAngleTitle: string;
  properAngleDesc: string;
  photoAcceptedTitle: string;
  photoAcceptedDesc: string;
  hospitalName: string;
  patientName: string;
  doctorName: string;
  startScanningButton: string;
  replayButton: string;

  // Page 4: Prescription Camera & Medical OCR
  scannerTitle: string;
  scannerSubtitle: string;
  openCameraButton: string;
  uploadPhotoBtn: string;
  orUseSample: string;
  scanningInProgress: string;
  allergyShieldTitle: string;
  bookingPhoneTitle: string;
  emergencyPhoneTitle: string;
  medicinesFoundTitle: string;
  dosageLabel: string;
  frequencyLabel: string;
  timingBeforeFood: string;
  timingAfterFood: string;
  addMedicineButton: string;
  saveToCabinetButton: string;
  retakeButton: string;

  // Medicine Purpose & Multi-Prescription Options
  medicinePurposeTitle: string;
  scheduleTimingTitle: string;
  shortNameLabel: string;
  fullNameLabel: string;
  usePurposeLabel: string;
  whyPrescribedLabel: string;
  howItWorksLabel: string;
  addAnotherPrescription: string;
  allPrescriptionsCount: string;
  sample1Title: string;
  sample1Desc: string;
  sample2Button: string;
  sample2Title: string;
  sample2Desc: string;
  addAnotherPrescriptionSubtitle: string;
  formTabletText: string;
  formCapsuleText: string;
}
