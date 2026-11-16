import { ALL_LANGUAGES } from './languages';

export interface LocalizedClinicalDictionary {
  doctorFallback: string;
  hospitalFallback: string;
  specialtyFallback: string;
  emergencyHelpline: string;
  appointmentDesk: string;
  contactPhone: string;
  beforeFoodInstructions: string;
  afterFoodInstructions: string;
  generalInstructions: string;
  labTestInstructions: string;
  asAdvisedByDoctor: string;
  scannedVaultNote: string;
  therapeuticPurpose: string;
  therapeuticWhy: string;
  therapeuticHow: string;
  defaultDurationDays: (days: number | string) => string;
}

// Multilingual clinical dictionary for major supported languages with fallback to English
export const CLINICAL_I18N: Record<string, Partial<LocalizedClinicalDictionary>> = {
  en: {
    doctorFallback: 'Doctor (From Prescription)',
    hospitalFallback: 'Medical Health Facility',
    specialtyFallback: 'Clinical Consultation',
    emergencyHelpline: 'Emergency Helpline',
    appointmentDesk: 'Appointment Desk',
    contactPhone: 'Contact Phone',
    beforeFoodInstructions: 'Take before meals on empty stomach',
    afterFoodInstructions: 'Take with water after meals',
    generalInstructions: 'Take as directed by physician',
    labTestInstructions: 'Complete at clinical laboratory',
    asAdvisedByDoctor: 'As advised by doctor',
    scannedVaultNote: 'Prescription document securely saved in your Digital Vault. You can easily review, edit, or adjust medicine timings below.',
    therapeuticPurpose: 'Physician-prescribed therapeutic treatment',
    therapeuticWhy: 'Prescribed by the doctor for symptom resolution and patient recovery.',
    therapeuticHow: 'Acts on target biological pathways to manage health symptoms.',
    defaultDurationDays: (d) => `${d} days`,
  },
  hi: {
    doctorFallback: 'डॉक्टर (पर्चे के अनुसार)',
    hospitalFallback: 'चिकित्सा स्वास्थ्य केंद्र',
    specialtyFallback: 'चिकित्सीय परामर्श',
    emergencyHelpline: 'आपातकालीन हेल्पलाइन',
    appointmentDesk: 'अपॉइंटमेंट डेस्क',
    contactPhone: 'संपर्क फोन',
    beforeFoodInstructions: 'भोजन से 30 मिनट पहले खाली पेट लें',
    afterFoodInstructions: 'भोजन के बाद पानी के साथ लें',
    generalInstructions: 'चिकित्सक के निर्देशानुसार लें',
    labTestInstructions: 'क्लिनिकल प्रयोगशाला से जांच कराएं',
    asAdvisedByDoctor: 'डॉक्टर की सलाह के अनुसार',
    scannedVaultNote: 'पर्चा आपके डिजिटल वॉल्ट में सुरक्षित रूप से सहेजा गया है। आप नीचे दवाओं के नाम और समय की समीक्षा या संपादन कर सकते हैं।',
    therapeuticPurpose: 'चिकित्सक द्वारा निर्धारित चिकित्सीय उपचार',
    therapeuticWhy: 'लक्षणों के समाधान और मरीज के स्वस्थ होने के लिए डॉक्टर द्वारा निर्धारित।',
    therapeuticHow: 'स्वास्थ्य लक्षणों को नियंत्रित करने के लिए जैविक तंत्र पर कार्य करती है।',
    defaultDurationDays: (d) => `${d} दिन`,
  },
  bn: {
    doctorFallback: 'চিকিৎসক (প্রেসক্রিপশন অনুযায়ী)',
    hospitalFallback: 'চিকিৎসা প্রতিষ্ঠান',
    specialtyFallback: 'প্রেসক্রিপশন অনুযায়ী চিকিৎসা',
    emergencyHelpline: 'জরুরি হেল্পলাইন',
    appointmentDesk: 'চেম্বার অ্যাপয়েন্টমেন্ট ডেস্ক',
    contactPhone: 'যোগাযোগ নম্বর',
    beforeFoodInstructions: 'খাবারের ৩০ মিনিট পূর্বে খালি পেটে সেব্য',
    afterFoodInstructions: 'খাবারের পর পানির সাথে সেব্য',
    generalInstructions: 'চিকিৎসকের পরামর্শ অনুযায়ী সেব্য',
    labTestInstructions: 'ল্যাবরেটরি থেকে পরীক্ষা করান',
    asAdvisedByDoctor: 'প্রেসক্রিপশন অনুযায়ী',
    scannedVaultNote: 'প্রেসক্রিপশনটি নিরাপদে ডিজিটাল ভল্টে সংরক্ষিত হয়েছে। নিচে ওষুধের নাম ও সময়সূচি যাচাই বা পরিবর্তন করতে পারেন।',
    therapeuticPurpose: 'প্রেসক্রিপশন অনুযায়ী নিরাময় চিকিৎসা',
    therapeuticWhy: 'ডাক্তারের প্রেসক্রিপশন অনুযায়ী রোগীর দ্রুত সুস্থতার জন্য নির্দেশিত।',
    therapeuticHow: 'শারীরিক উপসর্গ নিয়ন্ত্রণ করে আরোগ্য লাভে সহায়তা করে।',
    defaultDurationDays: (d) => `${d} দিন`,
  },
  es: {
    doctorFallback: 'Médico (De la receta)',
    hospitalFallback: 'Centro de Salud Médico',
    specialtyFallback: 'Consulta Clínica',
    emergencyHelpline: 'Línea de Emergencia',
    appointmentDesk: 'Recepción de Citas',
    contactPhone: 'Teléfono de Contacto',
    beforeFoodInstructions: 'Tomar antes de las comidas con el estómago vacío',
    afterFoodInstructions: 'Tomar con agua después de las comidas',
    generalInstructions: 'Tomar según las indicaciones del médico',
    labTestInstructions: 'Realizar en laboratorio clínico',
    asAdvisedByDoctor: 'Según indicación médica',
    scannedVaultNote: 'Receta guardada de forma segura en su Bóveda Digital.',
    therapeuticPurpose: 'Tratamiento terapéutico recetado por el médico',
    therapeuticWhy: 'Recetado por el médico para la recuperación del paciente.',
    therapeuticHow: 'Actúa sobre las vías biológicas para controlar los síntomas.',
    defaultDurationDays: (d) => `${d} días`,
  },
  fr: {
    doctorFallback: 'Médecin (Sur ordonnance)',
    hospitalFallback: 'Établissement de Santé',
    specialtyFallback: 'Consultation Clinique',
    emergencyHelpline: "Ligne d'Urgence",
    appointmentDesk: 'Bureau des Rendez-vous',
    contactPhone: 'Téléphone de Contact',
    beforeFoodInstructions: 'À prendre à jeun avant les repas',
    afterFoodInstructions: "À prendre avec de l'eau après les repas",
    generalInstructions: 'Prendre selon les instructions du médecin',
    labTestInstructions: 'À réaliser en laboratoire médical',
    asAdvisedByDoctor: 'Selon les conseils du médecin',
    scannedVaultNote: 'Ordonnance enregistrée en toute sécurité dans votre Coffre Numérique.',
    therapeuticPurpose: 'Traitement thérapeutique prescrit par un médecin',
    therapeuticWhy: 'Prescrit par le médecin pour le rétablissement du patient.',
    therapeuticHow: 'Agit sur les voies biologiques pour soulager les symptômes.',
    defaultDurationDays: (d) => `${d} jours`,
  },
  de: {
    doctorFallback: 'Arzt (Aus Rezept)',
    hospitalFallback: 'Medizinische Einrichtung',
    specialtyFallback: 'Klinische Konsultation',
    emergencyHelpline: 'Notrufnummer',
    appointmentDesk: 'Terminvergabe',
    contactPhone: 'Kontakttelefon',
    beforeFoodInstructions: 'Vor den Mahlzeiten auf nüchternen Magen einnehmen',
    afterFoodInstructions: 'Nach den Mahlzeiten mit Wasser einnehmen',
    generalInstructions: 'Wie vom Arzt verordnet einnehmen',
    labTestInstructions: 'Im medizinischen Labor durchführen',
    asAdvisedByDoctor: 'Wie vom Arzt verordnet',
    scannedVaultNote: 'Rezept sicher in Ihrem digitalen Tresor gespeichert.',
    therapeuticPurpose: 'Vom Arzt verordnete therapeutische Behandlung',
    therapeuticWhy: 'Vom Arzt zur Genesung verordnet.',
    therapeuticHow: 'Wirkt auf biologische Signalwege zur Symptomkontrolle.',
    defaultDurationDays: (d) => `${d} Tage`,
  },
  mr: {
    doctorFallback: 'डॉक्टर (प्रिस्क्रिप्शननुसार)',
    hospitalFallback: 'वैद्यकीय आरोग्य केंद्र',
    specialtyFallback: 'वैद्यकीय सल्ला',
    emergencyHelpline: 'आपत्कालीन हेल्पलाइन',
    appointmentDesk: 'अपॉइंटमेंट डेस्क',
    contactPhone: 'संपर्क फोन',
    beforeFoodInstructions: 'जेवणापूर्वी रिकाम्या पोटी घ्यावे',
    afterFoodInstructions: 'जेवणानंतर पाण्यासोबत घ्यावे',
    generalInstructions: 'डॉक्टरांच्या सल्ल्यानुसार घ्यावे',
    labTestInstructions: 'क्लिनिकल प्रयोगशाळेतून चाचणी करून घ्या',
    asAdvisedByDoctor: 'डॉक्टरांच्या सल्ल्यानुसार',
    scannedVaultNote: 'प्रिस्क्रिप्शन तुमच्या डिजिटल व्हॉल्टमध्ये सुरक्षित ठेवले आहे.',
    therapeuticPurpose: 'डॉक्टरांनी सुचवलेले वैद्यकीय उपचार',
    therapeuticWhy: 'रुग्णाच्या लवकर बऱ्या होण्यासाठी डॉक्टरांनी दिले आहे.',
    therapeuticHow: 'आरोग्य लक्षणे नियंत्रित करण्यास मदत करते.',
    defaultDurationDays: (d) => `${d} दिवस`,
  },
  gu: {
    doctorFallback: 'ડૉક્ટર (પ્રિસ્ક્રિપ્શન મુજબ)',
    hospitalFallback: 'તબીબી આરોગ્ય કેન્દ્ર',
    specialtyFallback: 'ક્લિનિકલ કન્સલ્ટેશન',
    emergencyHelpline: 'ઇમરજન્સી હેલ્પલાઇન',
    appointmentDesk: 'અપોઇન્ટમેન્ટ ડેસ્ક',
    contactPhone: 'સંપર્ક ફોન',
    beforeFoodInstructions: 'જમ્યા પહેલાં ભૂખ્યા પેટે લેવું',
    afterFoodInstructions: 'જમ્યા પછી પાણી સાથે લેવું',
    generalInstructions: 'ડૉક્ટરની સૂચના મુજબ લો',
    labTestInstructions: 'લેબોરેટરીમાંથી તપાસ કરાવો',
    asAdvisedByDoctor: 'ડૉક્ટરની સલાહ મુજબ',
    scannedVaultNote: 'પ્રિસ્ક્રિપ્શન તમારા ડિજિટલ વૉલ્ટમાં સુરક્ષિત રીતે સચવાયેલ છે.',
    therapeuticPurpose: 'ડૉક્ટર દ્વારા સૂચવેલ સારવાર',
    therapeuticWhy: 'દર્દીની ઝડપી સ્વસ્થતા માટે ડૉક્ટર દ્વારા સૂચવવામાં આવેલ.',
    therapeuticHow: 'લક્ષણોને નિયંત્રિત કરવા માટે કામ કરે છે.',
    defaultDurationDays: (d) => `${d} દિવસ`,
  },
  ta: {
    doctorFallback: 'மருத்துவர் (மருந்துச் சீட்டு)',
    hospitalFallback: 'மருத்துவ சுகாதார மையம்',
    specialtyFallback: 'மருத்துவ ஆலோசனை',
    emergencyHelpline: 'அவசர உதவி எண்',
    appointmentDesk: 'முன்பதிவு மையம்',
    contactPhone: 'தொடர்பு எண்',
    beforeFoodInstructions: 'உணவுக்கு முன் வெறும் வயிற்றில் எடுக்கவும்',
    afterFoodInstructions: 'உணவுக்குப் பின் தண்ணீருடன் உட்கொள்ளவும்',
    generalInstructions: 'மருத்துவர் அறிவுறுத்தியபடி எடுக்கவும்',
    labTestInstructions: 'மருத்துவ ஆய்வகத்தில் பரிசோதிக்கவும்',
    asAdvisedByDoctor: 'மருத்துவர் அறிவுரைப்படி',
    scannedVaultNote: 'மருந்துச் சீட்டு உங்கள் டிஜிட்டல் வால்ட்டில் பாதுகாப்பாக சேமிக்கப்பட்டுள்ளது.',
    therapeuticPurpose: 'மருத்துவர் பரிந்துரைத்த சிகிச்சை',
    therapeuticWhy: 'நோயாளி விரைவாக குணமடைய மருத்துவரால் பரிந்துரைக்கப்பட்டது.',
    therapeuticHow: 'அறிகுறிகளைக் கட்டுப்படுத்த செயல்படுகிறது.',
    defaultDurationDays: (d) => `${d} நாட்கள்`,
  },
  te: {
    doctorFallback: 'వైద్యులు (ప్రిస్క్రిప్షన్ ప్రకారం)',
    hospitalFallback: 'వైద్య ఆరోగ్య కేంద్రం',
    specialtyFallback: 'క్లినికల్ సంప్రదింపు',
    emergencyHelpline: 'అత్యవసర హెల్ప్‌లైన్',
    appointmentDesk: 'అపాయింట్‌మెంట్ డెస్క్',
    contactPhone: 'సంప్రదింపు నంబర్',
    beforeFoodInstructions: 'భోజనానికి ముందు ఖాళీ కడుపుతో తీసుకోవాలి',
    afterFoodInstructions: 'భోజనం తర్వాత నీటితో తీసుకోవాలి',
    generalInstructions: 'వైద్యుల సలహా మేరకు తీసుకోండి',
    labTestInstructions: 'క్లినికల్ లాబొరేటరీలో పరీక్ష చేయించండి',
    asAdvisedByDoctor: 'వైద్యుల సలహా ప్రకారం',
    scannedVaultNote: 'ప్రిస్క్రిప్షన్ మీ డిజిటల్ వాల్ట్‌లో భద్రపరచబడింది.',
    therapeuticPurpose: 'వైద్యులు సూచించిన చికిత్స',
    therapeuticWhy: 'రోగి వేగంగా కోలుకోవడానికి వైద్యులు సూచించారు.',
    therapeuticHow: 'ఆరోగ్య లక్షణాలను నియంత్రించడంలో సహాయపడుతుంది.',
    defaultDurationDays: (d) => `${d} రోజులు`,
  },
};

/**
 * Multilingual clinical string resolver supporting all 32 languages (English, Hindi, Bengali, etc.)
 */
export function getLocalizedClinicalText(
  lang: string,
  texts: { en: string; hi?: string; bn?: string; es?: string; fr?: string; de?: string; mr?: string; gu?: string; ta?: string; te?: string; [key: string]: string | undefined }
): string {
  return texts[lang] || texts['en'] || '';
}

/**
 * Returns complete clinical dictionary for given language code with fallback to English
 */
export function getClinicalDictionary(languageCode: string): LocalizedClinicalDictionary {
  const defaults = CLINICAL_I18N['en'] as LocalizedClinicalDictionary;
  const target = CLINICAL_I18N[languageCode] || {};
  return {
    ...defaults,
    ...target,
  };
}

/**
 * Gets human-readable target language name for AI prompt injection (e.g. "Hindi (हिन्दी)")
 */
export function getLanguageDisplayName(languageCode: string): string {
  const langObj = ALL_LANGUAGES.find((l) => l.code === languageCode);
  if (!langObj) return 'English';
  return `${langObj.name} (${langObj.nativeName})`;
}
