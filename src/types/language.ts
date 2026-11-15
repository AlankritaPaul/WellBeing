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

  // Page 5: Digital File Cabinet & Multi-Doctor/Prescription Accounts
  accountsHubTitle: string;
  accountsHubSubtitle: string;
  accountNumberLabel: string;
  openAccountButton: string;
  allAccountsButton: string;
  totalMedicinesCountLabel: string;
  deleteAccountButton: string;
  deleteAccountConfirm: string;
  addNewAccountButton: string;
  singleAccountDirectNotice: string;

  // Page 6: "Scanned Papers" Digital Vault
  vaultTitle: string;
  vaultSubtitle: string;
  zoomInButton: string;
  zoomOutButton: string;
  resetZoomButton: string;
  rotateButton: string;
  downloadDocumentButton: string;
  printDocumentButton: string;
  documentDetailsTitle: string;
  consultingDoctorLabel: string;
  clinicalFacilityLabel: string;
  scanDateLabel: string;
  extractedMedicinesLabel: string;
  documentQualityLabel: string;
  highQualityScanBadge: string;
  switchPrescriptionLabel: string;
  backToCabinetButton: string;
  backToPrescriptionButton: string;
  openVaultButton: string;

  // Page 7: Diagnostic Lab Desk
  labDeskTitle: string;
  labDeskSubtitle: string;
  openLabDeskButton: string;
  testsCompletedBadge: string;
  testsPendingBadge: string;
  statusPendingLabel: string;
  statusCompletedLabel: string;
  markAsCompletedButton: string;
  markAsPendingButton: string;
  testPreparationNoticeTitle: string;
  fastingRequiredNotice: string;
  testDateLabel: string;
  addNewTestButton: string;
  addTestModalTitle: string;
  testNameInputLabel: string;
  testCategoryLabel: string;
  testCategoryBlood: string;
  testCategoryUrine: string;
  testCategoryImaging: string;
  testCategoryCardiac: string;
  testCategoryGeneral: string;
  testInstructionsInputLabel: string;
  saveTestButton: string;
  deleteTestButton: string;
  deleteTestConfirm: string;
  noTestsFoundNotice: string;
  allTestsCompletedCongrats: string;

  // Page 8: Current Pills Menu & Refill Inventory
  pillsMenuTitle: string;
  pillsMenuSubtitle: string;
  openPillsMenuButton: string;
  refillAlertBadge: string;
  daysRemainingLabel: string;
  pillsRemainingLabel: string;
  dailyConsumptionLabel: string;
  refillButton: string;
  refillModalTitle: string;
  refillQuantityInputLabel: string;
  currentStockLabel: string;
  safeStockBadge: string;
  lowStockAlertNotice: string;
  shoppingListTitle: string;
  shoppingListSubtitle: string;

  // Page 9: Daily Pill Accountability & 3-Button Smart Alarm
  accountabilityTitle: string;
  accountabilitySubtitle: string;
  openRemindersButton: string;
  morningBlueprintTitle: string;
  morningSlotLabel: string;
  afternoonSlotLabel: string;
  eveningSlotLabel: string;
  nightSlotLabel: string;
  takePillButton: string;
  delayAlarmButton: string;
  skipDoseButton: string;
  snoozeModalTitle: string;
  snooze15Min: string;
  snooze30Min: string;
  snooze1Hour: string;
  skipReasonModalTitle: string;
  skipReasonFasting: string;
  skipReasonUpset: string;
  skipReasonForgot: string;
  skipReasonDoctorHold: string;
  nightlySummaryTitle: string;
  adherenceScoreLabel: string;
  stripPackingListTitle: string;

  // Page 10: Doctor Review Mode & Compliance Export
  doctorReviewTitle: string;
  doctorReviewSubtitle: string;
  openDoctorReviewButton: string;
  nextVisitCountdownTitle: string;
  daysUntilVisitLabel: string;
  adherenceOverviewTitle: string;
  adherenceRate7Days: string;
  adherenceRate30Days: string;
  totalScheduledDosesLabel: string;
  takenOnTimeDosesLabel: string;
  delayedDosesLabel: string;
  skippedDosesLabel: string;
  doctorProofTableTitle: string;
  printDoctorReportButton: string;
  exportCsvButton: string;

  // Settings & Account Management
  settingsTitle: string;
  settingsSubtitle: string;
  openSettingsButton: string;
  deleteAccountsTitle: string;
  deleteAccountsDesc: string;
  courseCompletedTag: string;
  noLongerNeededTag: string;
  deleteSelectedButton: string;
  deleteAccountConfirmSingle: string;
  deleteAccountConfirmMultiple: string;
  themeSettingsTitle: string;
  themeMidnight: string;
  themeEmerald: string;
  themeLight: string;
  themeContrast: string;
  tutorialSettingsTitle: string;
  watchTutorialButton: string;
  selectAllAccounts: string;
  deselectAllAccounts: string;
  noAccountsToDelete: string;
}
