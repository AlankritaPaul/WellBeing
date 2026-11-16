import { createWorker } from 'tesseract.js';
import type { ScannedPrescription, Medication, ContactPhone, DiagnosticTest } from '../types/prescription';

export interface OCRProcessOptions {
  isSample?: boolean;
  sampleIndex?: number;
}

// Comprehensive Clinical Medication Knowledge Base
interface ClinicalMedDef {
  name: string;
  generic: string;
  purpose: string;
  purposeBn: string;
  whyPrescribed: string;
  whyPrescribedBn: string;
  howItWorks: string;
  howItWorksBn: string;
  defaultDosage: string;
  defaultTiming: 'before_food' | 'after_food' | 'with_food' | 'as_needed';
  defaultFreq: string;
}

const CLINICAL_CATALOG: Record<string, ClinicalMedDef> = {
  paracetamol: {
    name: 'Paracetamol',
    generic: 'Paracetamol (Acetaminophen)',
    purpose: 'Fever reduction & rapid alleviation of body ache',
    purposeBn: 'জ্বর নিরাময় ও তীব্র শরীর ব্যথার দ্রুত উপশম',
    whyPrescribed: 'Prescribed to rapidly bring down elevated body temperature and relieve muscle aches and joint pain.',
    whyPrescribedBn: 'রোগীর উচ্চ তাপমাত্রা নিয়ন্ত্রণ এবং পেশি ও হাড়ের জয়েন্টের তীব্র যন্ত্রণা কমানোর জন্য দেওয়া হয়েছে।',
    howItWorks: 'Inhibits prostaglandin synthesis in the central nervous system and acts on the hypothalamic heat-regulating center.',
    howItWorksBn: 'মস্তিষ্কের হাইপোথ্যালামাসের তাপ নিয়ন্ত্রক কেন্দ্রে সংকেত পাঠিয়ে তাপমাত্রা কমায় এবং প্রোস্টাগ্ল্যান্ডিন উৎপাদন বন্ধ করে ব্যথা রোধ করে।',
    defaultDosage: '650 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  amoxicillin: {
    name: 'Amoxicillin + Clavulanic Acid',
    generic: 'Amoxicillin & Potassium Clavulanate',
    purpose: 'Eradication of bacterial infections & inflammation',
    purposeBn: 'ব্যাকটেরিয়া জনিত তীব্র সংক্রমণ ও প্রদাহ নির্মূল',
    whyPrescribed: 'Prescribed to eliminate bacterial infections of the respiratory tract, throat, and tissues.',
    whyPrescribedBn: 'শ্বাসতন্ত্র ও গলার ব্যাকটেরিয়াল ইনফেকশন সম্পূর্ণ নির্মূল করার জন্য এই অ্যান্টিবায়োটিক দেওয়া হয়েছে।',
    howItWorks: 'Inhibits bacterial cell wall synthesis while clavulanic acid protects amoxicillin from beta-lactamase degradation.',
    howItWorksBn: 'ব্যাকটেরিয়ার প্রতিরক্ষামূলক কোষপ্রাচীর গঠনে বাধা দিয়ে ব্যাকটেরিয়া ধ্বংস করে এবং সংক্রমণ ছড়াতে দেয় না।',
    defaultDosage: '625 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  pantoprazole: {
    name: 'Pantoprazole',
    generic: 'Pantoprazole Sodium Gastro-resistant',
    purpose: 'Relief of gastric irritation, GERD & acidity protection',
    purposeBn: 'গ্যাস্ট্রিক আলসার, তীব্র বুকজ্বালা ও এসিডিটি নিরাময়',
    whyPrescribed: 'Prescribed as a protective gastric shield to prevent acid rebound and stomach ulcers caused by medications or stress.',
    whyPrescribedBn: 'অ্যান্টিবায়োটিক ও ব্যথানাশক ওষুধের প্রভাবে যেন পেটে অতিরিক্ত অ্যাসিড বা ক্ষত সৃষ্টি না হয় সেই সুরক্ষা কবচ হিসেবে দেওয়া হয়েছে।',
    howItWorks: 'Selectively binds to the proton pump (H+/K+-ATPase) in stomach parietal cells to inhibit stomach acid secretion.',
    howItWorksBn: 'পাকস্থলীর প্রোটন পাম্প সরাসরি নিষ্ক্রিয় করে অ্যাসিড উৎপাদন উল্লেখযোগ্যভাবে কমিয়ে পাকস্থলীকে শান্ত রাখে।',
    defaultDosage: '40 mg',
    defaultTiming: 'before_food',
    defaultFreq: '1-0-0',
  },
  omeprazole: {
    name: 'Omeprazole',
    generic: 'Omeprazole Magnesium Gastro-resistant',
    purpose: 'Gastric acid suppression, heartburn & ulcer healing',
    purposeBn: 'বুকজ্বালা, পেপটিক আলসার ও এসিডিটি নিরাময়',
    whyPrescribed: 'Prescribed to heal stomach ulcerations and treat acid reflux disease.',
    whyPrescribedBn: 'পাকস্থলীর ক্ষত নিরাময় এবং অ্যাসিড রিফ্লাক্সের লক্ষণ দূর করার জন্য দেওয়া হয়েছে।',
    howItWorks: 'Suppresses gastric basal and stimulated acid secretion by inhibiting the parietal cell proton pump.',
    howItWorksBn: 'পাকস্থলীর অ্যাসিড নিঃসরণকারী কোষের প্রোটন পাম্প বন্ধ করে অ্যাসিড উৎপাদন থামায়।',
    defaultDosage: '20 mg',
    defaultTiming: 'before_food',
    defaultFreq: '1-0-0',
  },
  cetirizine: {
    name: 'Cetirizine',
    generic: 'Cetirizine Dihydrochloride',
    purpose: 'Allergy relief, anti-histamine & anti-sneezing',
    purposeBn: 'অ্যালার্জি, অনবরত হাঁচি, সর্দি ও ত্বকের চুলকানি নিরাময়',
    whyPrescribed: 'Prescribed to relieve runny nose, constant sneezing, itchy eyes, and allergic skin irritation.',
    whyPrescribedBn: 'নাক দিয়ে পানি পড়া, চোখ দিয়ে পানি আসা এবং ত্বকের অ্যালার্জিক চুলকানি সম্পূর্ণ বন্ধ করতে দেওয়া হয়েছে।',
    howItWorks: 'Selectively antagonizes peripheral H1 histamine receptors to halt allergy-triggered inflammatory reactions.',
    howItWorksBn: 'শরীরে অ্যালার্জি সৃষ্টিকারী হিস্টামিন হরমোনকে ব্লক করে অ্যালার্জির সংকেত পরিবহন বন্ধ করে দেয়।',
    defaultDosage: '10 mg',
    defaultTiming: 'after_food',
    defaultFreq: '0-0-1',
  },
  levocetirizine: {
    name: 'Levocetirizine',
    generic: 'Levocetirizine Hydrochloride',
    purpose: 'Non-sedating antihistamine for allergic rhinitis',
    purposeBn: 'নন-সিডেটিভ অ্যালার্জি ও সর্দি প্রতিরোধক',
    whyPrescribed: 'Prescribed for continuous relief from persistent seasonal allergies and allergic skin hives.',
    whyPrescribedBn: 'দীর্ঘস্থায়ী অ্যালার্জি ও ত্বকের চুলকানি নিয়ন্ত্রণের জন্য দেওয়া হয়েছে।',
    howItWorks: 'High-affinity inverse agonist at the H1 histamine receptor.',
    howItWorksBn: 'অ্যালার্জির হিস্টামিন রিসেপ্টরকে নিষ্ক্রিয় করে দ্রুত আরাম দেয়।',
    defaultDosage: '5 mg',
    defaultTiming: 'after_food',
    defaultFreq: '0-0-1',
  },
  metformin: {
    name: 'Metformin SR',
    generic: 'Metformin Hydrochloride Sustained Release',
    purpose: 'Blood glucose regulation & glycemic control',
    purposeBn: 'রক্তের শর্করা (সুগার) নিয়ন্ত্রণ ও ডায়াবেটিস ব্যবস্থাপনা',
    whyPrescribed: 'Prescribed to maintain healthy fasting and postprandial blood sugar levels in type 2 diabetes.',
    whyPrescribedBn: 'খাবার পরবর্তী রক্তের অতিরিক্ত গ্লুকোজ স্বাভাবিক রাখা এবং ইনসুলিন সংবেদনশীলতা বাড়ানোর জন্য দেওয়া হয়েছে।',
    howItWorks: 'Reduces hepatic glucose output and enhances cellular insulin-mediated glucose uptake.',
    howItWorksBn: 'যকৃত থেকে রক্তে অতিরিক্ত গ্লুকোজ নিঃসরণ দমন করে এবং শরীরের কোষে গ্লুকোজ ব্যবহার বাড়ায়।',
    defaultDosage: '500 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  atorvastatin: {
    name: 'Atorvastatin',
    generic: 'Atorvastatin Calcium',
    purpose: 'Lipid lowering, reduction of bad LDL cholesterol & triglycerides',
    purposeBn: 'রক্তের ক্ষতিকর কোলেস্টেরল ও ট্রাইগ্লিসারাইড দ্রুত হ্রাস',
    whyPrescribed: 'Prescribed to prevent cardiovascular events and clear lipid arterial plaque formation.',
    whyPrescribedBn: 'হৃদরোগের ঝুঁকি কমানো এবং রক্তনালীতে চর্বি জমে ব্লক তৈরি হওয়া প্রতিরোধে দেওয়া হয়েছে।',
    howItWorks: 'Inhibits HMG-CoA reductase, the rate-limiting enzyme in hepatic cholesterol synthesis.',
    howItWorksBn: 'লিভারে ক্ষতিকর কোলেস্টেরল তৈরির প্রধান এনজাইম HMG-CoA রিডাক্টেস নিষ্ক্রিয় করে কোলেস্টেরল উৎপাদন বন্ধ করে।',
    defaultDosage: '20 mg',
    defaultTiming: 'after_food',
    defaultFreq: '0-0-1',
  },
  telmisartan: {
    name: 'Telmisartan',
    generic: 'Telmisartan',
    purpose: 'Blood pressure control & cardiovascular protection',
    purposeBn: 'উচ্চ রক্তচাপ নিয়ন্ত্রণ ও কিডনি সুরক্ষা',
    whyPrescribed: 'Prescribed to keep arterial blood pressure normal and reduce workload on the heart.',
    whyPrescribedBn: 'রক্তচাপ স্বাভাবিক রাখা এবং হার্টের উপর অতিরিক্ত চাপ প্রতিরোধ করার জন্য দেওয়া হয়েছে।',
    howItWorks: 'Blocks angiotensin II type 1 receptors, causing blood vessels to dilate and relax.',
    howItWorksBn: 'রক্তনালীকে সংকুচিতকারী অ্যাঞ্জিওটেনসিন-২ রিসেপ্টরকে ব্লক করে রক্তনালী প্রসারিত ও শিথিল রাখে।',
    defaultDosage: '40 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-0',
  },
  amlodipine: {
    name: 'Amlodipine',
    generic: 'Amlodipine Besylate',
    purpose: 'Calcium channel blocker for hypertension & angina',
    purposeBn: 'উচ্চ রক্তচাপ ও বুকের ব্যথা প্রতিরোধক',
    whyPrescribed: 'Prescribed to relax arterial vascular muscles and decrease peripheral arterial resistance.',
    whyPrescribedBn: 'রক্তনালীর দেওয়াল শিথিল করে স্বাভাবিক রক্তপ্রবাহ বজায় রাখতে দেওয়া হয়েছে।',
    howItWorks: 'Inhibits transmembrane influx of calcium ions into cardiac and vascular smooth muscle.',
    howItWorksBn: 'কোষে ক্যালসিয়ামের প্রবেশ আটকে রক্তনালী শিথিল করে।',
    defaultDosage: '5 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-0',
  },
  azithromycin: {
    name: 'Azithromycin',
    generic: 'Azithromycin Dihydrate',
    purpose: 'Macrolide antibiotic for respiratory & throat infections',
    purposeBn: 'শ্বাসতন্ত্র ও ফুসফুসের ব্যাকটেরিয়াল সংক্রমণ প্রতিরোধক',
    whyPrescribed: 'Prescribed to clear bacterial bronchitis, pharyngitis, and sinusitis.',
    whyPrescribedBn: 'গলা ও ফুসফুসের ব্যাকটেরিয়াল সংক্রমণ নির্মূল করতে দেওয়া হয়েছে।',
    howItWorks: 'Binds to the 50S ribosomal subunit of susceptible microorganisms, interfering with microbial protein synthesis.',
    howItWorksBn: 'ব্যাকটেরিয়ার প্রোটিন তৈরিতে বাধা দিয়ে জীবাণু ধ্বংস করে।',
    defaultDosage: '500 mg',
    defaultTiming: 'before_food',
    defaultFreq: '1-0-0',
  },
  montelukast: {
    name: 'Montelukast',
    generic: 'Montelukast Sodium',
    purpose: 'Leukotriene receptor antagonist for asthma & allergies',
    purposeBn: 'শ্বাসকষ্ট, হাঁপানি ও দীর্ঘস্থায়ী অ্যালার্জি নিয়ন্ত্রণ',
    whyPrescribed: 'Prescribed to prevent wheezing, shortness of breath, and allergic airway inflammation.',
    whyPrescribedBn: 'শ্বাসনালীর সংকোচন ও অ্যালার্জির টান কমাতে দেওয়া হয়েছে।',
    howItWorks: 'Selectively blocks cysteinyl leukotriene CysLT1 receptors in the airways.',
    howItWorksBn: 'শ্বাসনালীতে প্রদাহ সৃষ্টিকারী লিউকোট্রিন হরমোনকে নিষ্ক্রিয় করে শ্বাসপ্রশ্বাস সহজ করে।',
    defaultDosage: '10 mg',
    defaultTiming: 'after_food',
    defaultFreq: '0-0-1',
  },
  ibuprofen: {
    name: 'Ibuprofen',
    generic: 'Ibuprofen',
    purpose: 'NSAID for inflammatory pain, fever, and swelling',
    purposeBn: 'প্রদাহজনিত তীব্র ব্যথা ও ফোলা নিরাময়',
    whyPrescribed: 'Prescribed for quick relief of musculoskeletal ache, toothache, and headache.',
    whyPrescribedBn: 'পেশি, দাঁত বা হাড়ের তীব্র ব্যথা কমাতে দেওয়া হয়েছে।',
    howItWorks: 'Non-selectively inhibits cyclooxygenase-1 and -2 enzymes.',
    howItWorksBn: 'শরীরে ব্যথা সৃষ্টিকারী এনজাইম নিষ্ক্রিয় করে ব্যথা কমায়।',
    defaultDosage: '400 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
};

export const ocrService = {
  /**
   * Parse a prescription image into structured medical entities.
   * If isSample is true, returns verified clinical demo data.
   * If isSample is false (real user scan), runs authentic Tesseract OCR on the user's image,
   * extracts genuine text, and strictly preserves the original user photo without overwriting.
   */
  async processPrescription(
    imageDataUrl: string, 
    patientNameFallback: string = '',
    languageCode: string = 'en',
    sampleIndexOrOptions: number | OCRProcessOptions = 1
  ): Promise<ScannedPrescription> {
    const isBengali = languageCode === 'bn';

    const isSample = typeof sampleIndexOrOptions === 'number' 
      ? true 
      : Boolean(sampleIndexOrOptions?.isSample);
    const sampleIndex = typeof sampleIndexOrOptions === 'number' 
      ? sampleIndexOrOptions 
      : (sampleIndexOrOptions?.sampleIndex ?? 1);

    // ==========================================
    // PATH 1: SAMPLE PRESCRIPTIONS (Verified Demo)
    // ==========================================
    if (isSample) {
      // Simulate real-time optical handwriting recognition analysis (1.2s realistic processing)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      if (sampleIndex === 2) {
        const extractedMedicinesSample2: Medication[] = isBengali
          ? [
              {
                id: 'med-' + Math.random().toString(36).substring(2, 9),
                name: 'অ্যাটরভাস্ট্যাটিন',
                shortName: 'Tab. Atorva 20',
                fullForm: 'অ্যাটরভাস্ট্যাটিন ক্যালসিয়াম ২০ মি.গ্রা.',
                purpose: 'রক্তের ক্ষতিকর কোলেস্টেরল ও ট্রাইগ্লিসারাইড দ্রুত হ্রাস',
                whyPrescribed: 'হৃদরোগের ঝুঁকি কমানো এবং রক্তনালীতে চর্বি জমে ব্লক তৈরি হওয়া প্রতিরোধে দেওয়া হয়েছে।',
                howItWorks: 'লিভারে ক্ষতিকর কোলেস্টেরল তৈরির প্রধান এনজাইম HMG-CoA রিডাক্টেস নিষ্ক্রিয় করে কোলেস্টেরল উৎপাদন বন্ধ করে।',
                dosage: '২০ মি.গ্রা.',
                form: 'tablet',
                frequency: '0-0-1',
                timing: 'after_food',
                duration: '৩০ দিন',
                instructions: 'রাতে খাবারের পর নিয়মিত এক গ্লাস পানি সহ সেব্য',
              },
              {
                id: 'med-' + Math.random().toString(36).substring(2, 9),
                name: 'মেটফর্মিন',
                shortName: 'Tab. Glycomet 500 SR',
                fullForm: 'মেটফর্মিন হাইড্রোক্লোরাইড সাসটেইন্ড রিলিজ ৫০০ মি.গ্রা.',
                purpose: 'রক্তের শর্করা (সুগার) নিয়ন্ত্রণ ও ডায়াবেটিস ব্যবস্থাপনা',
                whyPrescribed: 'খাবার পরবর্তী রক্তের অতিরিক্ত গ্লুকোজ স্বাভাবিক রাখা এবং ইনসুলিন সংবেদনশীলতা বাড়ানোর জন্য দেওয়া হয়েছে।',
                howItWorks: 'যকৃত (লিভার) থেকে রক্তে অতিরিক্ত গ্লুকোজ নিঃসরণ দমন করে এবং শরীরের কোষে গ্লুকোজ ব্যবহার বাড়ায়।',
                dosage: '৫০০ মি.গ্রা.',
                form: 'tablet',
                frequency: '1-0-1',
                timing: 'after_food',
                duration: '৩০ দিন',
                instructions: 'সকাল ও রাতের ভারী খাবারের পরপরই সেব্য',
              },
              {
                id: 'med-' + Math.random().toString(36).substring(2, 9),
                name: 'টেলমিসারটান',
                shortName: 'Tab. Telma 40',
                fullForm: 'টেলমিসারটান ৪০ মি.গ্রা.',
                purpose: 'উচ্চ রক্তচাপ নিয়ন্ত্রণ ও কিডনি সুরক্ষা',
                whyPrescribed: 'রক্তচাপ স্বাভাবিক রাখা এবং হার্টের উপর অতিরিক্ত চাপ প্রতিরোধ করার জন্য দেওয়া হয়েছে।',
                howItWorks: 'রক্তনালীকে সংকুচিতকারী অ্যাঞ্জিওটেনসিন-২ রিসেপ্টরকে ব্লক করে রক্তনালী প্রসারিত ও শিথিল রাখে।',
                dosage: '৪০ মি.গ্রা.',
                form: 'tablet',
                frequency: '1-0-0',
                timing: 'after_food',
                duration: '৩০ দিন',
                instructions: 'প্রতিদিন সকালে নির্দিষ্ট সময়ে এক কাপ পানির সাথে সেব্য',
              }
            ]
          : [
              {
                id: 'med-' + Math.random().toString(36).substring(2, 9),
                name: 'Atorvastatin',
                shortName: 'Tab. Atorva 20',
                fullForm: 'Atorvastatin Calcium 20 mg',
                purpose: 'Lipid lowering, reduction of bad LDL cholesterol & triglycerides',
                whyPrescribed: 'Prescribed to prevent cardiovascular events and clear lipid arterial plaque formation.',
                howItWorks: 'Inhibits HMG-CoA reductase, the rate-limiting enzyme in hepatic cholesterol synthesis.',
                dosage: '20 mg',
                form: 'tablet',
                frequency: '0-0-1',
                timing: 'after_food',
                duration: '30 days',
                instructions: 'Take once daily at bedtime after dinner',
              },
              {
                id: 'med-' + Math.random().toString(36).substring(2, 9),
                name: 'Metformin SR',
                shortName: 'Tab. Glycomet 500 SR',
                fullForm: 'Metformin Hydrochloride Sustained Release 500 mg',
                purpose: 'Blood glucose regulation & glycemic control',
                whyPrescribed: 'Prescribed to maintain healthy fasting and postprandial blood sugar levels.',
                howItWorks: 'Reduces hepatic glucose output and enhances cellular insulin-mediated glucose uptake.',
                dosage: '500 mg',
                form: 'tablet',
                frequency: '1-0-1',
                timing: 'after_food',
                duration: '30 days',
                instructions: 'Take immediately with or after meals to avoid stomach upset',
              },
              {
                id: 'med-' + Math.random().toString(36).substring(2, 9),
                name: 'Telmisartan',
                shortName: 'Tab. Telma 40',
                fullForm: 'Telmisartan 40 mg',
                purpose: 'Blood pressure control & cardiovascular protection',
                whyPrescribed: 'Prescribed to keep arterial blood pressure normal and reduce workload on the heart.',
                howItWorks: 'Blocks angiotensin II type 1 receptors, causing blood vessels to dilate and relax.',
                dosage: '40 mg',
                form: 'tablet',
                frequency: '1-0-0',
                timing: 'after_food',
                duration: '30 days',
                instructions: 'Take every morning at the same time',
              }
            ];

        const extractedPhonesSample2: ContactPhone[] = [
          {
            number: '+91 98311 00911',
            type: 'emergency',
            label: isBengali ? '২৪x৭ জরুরি কার্ডিয়াক হেল্পলাইন' : '24x7 Cardiac Emergency Helpline',
          }
        ];

        const todayDate = new Date().toLocaleDateString(isBengali ? 'bn-IN' : 'en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const extractedDiagnosticTestsSample2: DiagnosticTest[] = isBengali
          ? [
              {
                id: 'test-apex-1',
                prescriptionId: 'rx-sample-apex-dranirbanroy',
                testName: 'লিপিড প্রোফাইল (সম্পূর্ণ কোলেস্টেরল প্যানেল)',
                category: 'blood',
                instructions: '১০-১২ ঘণ্টা রাতের অনাহারের পর সকালের খালি পেটে রক্তের নমুনা দিতে হবে',
                status: 'pending',
              },
              {
                id: 'test-apex-2',
                prescriptionId: 'rx-sample-apex-dranirbanroy',
                testName: 'এইচবিএওয়ানসি (HbA1c - ৩ মাসের গড় রক্ত শর্করা)',
                category: 'blood',
                instructions: 'দিনের যেকোনো সময় রক্তের নমুনা দেওয়া যায়',
                status: 'pending',
              }
            ]
          : [
              {
                id: 'test-apex-1',
                prescriptionId: 'rx-sample-apex-dranirbanroy',
                testName: 'Lipid Profile (Complete Cholesterol Panel)',
                category: 'blood',
                instructions: '10-12 hours overnight fasting required before morning sample',
                status: 'pending',
              },
              {
                id: 'test-apex-2',
                prescriptionId: 'rx-sample-apex-dranirbanroy',
                testName: 'HbA1c (Glycated Hemoglobin - 3 Months Average)',
                category: 'blood',
                instructions: 'Can be done at any time of day; fasting is not required.',
                status: 'pending',
              }
            ];

        return {
          id: 'rx-sample-apex-dranirbanroy',
          imageDataUrl: '/images/prescription_apex.jpg',
          hospitalName: isBengali ? 'অ্যাপেক্স হার্ট ও ডায়াবেটিস সেন্টার' : 'Apex Heart & Diabetes Institute',
          doctorName: isBengali ? 'ডাঃ অনির্বাণ রায়, এমডি, ডিএম (কার্ডিওলজি)' : 'Dr. Anirban Roy, MD, DM (Cardiology)',
          doctorSpecialty: isBengali ? 'সিনিয়র কনসালটেন্ট হৃদরোগ ও ডায়াবেটিস বিশেষজ্ঞ' : 'Senior Interventional Cardiologist',
          patientName: patientNameFallback || (isBengali ? 'রোগী' : 'Patient'),
          date: todayDate,
          recheckInterval: isBengali ? '১ মাস পর পুনরায় দেখা করুন' : 'After 1 month',
          medicines: extractedMedicinesSample2,
          phoneNumbers: extractedPhonesSample2,
          diagnosticTests: extractedDiagnosticTestsSample2,
          allergies: isBengali ? ['এসপিরিন সংবেদনশীলতা'] : ['Aspirin Sensitivity'],
          notes: isBengali
            ? 'পরামর্শ: প্রতি মাসে লিপিড প্রোফাইল ও এইচবিএওয়ানসি পরীক্ষা, প্রতিদিন ৩০ মিনিট হাঁটা।'
            : 'Advised: Monthly Lipid Profile & HbA1c test, 30 minutes daily walking.',
          scannedAt: Date.now(),
        };
      }

      // Sample 1: General Medicine
      const extractedMedicinesSample1: Medication[] = isBengali
        ? [
            {
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: 'প্যারাসিটামল',
              shortName: 'Tab. PCM 650',
              fullForm: 'প্যারাসিটামল (অ্যাসিটামিনোফেন) ৬৫০ মি.গ্রা.',
              purpose: 'জ্বর নিরাময় ও তীব্র শরীর ব্যথার দ্রুত উপশম',
              whyPrescribed: 'রোগীর উচ্চ তাপমাত্রা নিয়ন্ত্রণ এবং পেশি ও হাড়ের জয়েন্টের তীব্র যন্ত্রণা কমানোর জন্য দেওয়া হয়েছে।',
              howItWorks: 'মস্তিষ্কের হাইপোথ্যালামাসের তাপ নিয়ন্ত্রক কেন্দ্রে সংকেত পাঠিয়ে তাপমাত্রা কমায় এবং প্রোস্টাগ্ল্যান্ডিন উৎপাদন বন্ধ করে ব্যথা রোধ করে।',
              dosage: '৬৫০ মি.গ্রা.',
              form: 'tablet',
              frequency: '1-0-1',
              timing: 'after_food',
              duration: '৫ দিন',
              instructions: 'খাবারের পর কুসুম গরম পানি সহ সেব্য',
            },
            {
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: 'অ্যামোক্সিসিলিন + ক্ল্যাভুলানিক অ্যাসিড',
              shortName: 'Tab. Augmentin 625',
              fullForm: 'অ্যামোক্সিসিলিন ও পটাশিয়াম ক্ল্যাভুলানেট ৬২৫ মি.গ্রা.',
              purpose: 'ব্যাকটেরিয়া জনিত তীব্র সংক্রমণ ও প্রদাহ নির্মূল',
              whyPrescribed: 'শ্বাসতন্ত্র ও গলার ব্যাকটেরিয়াল ইনফেকশন সম্পূর্ণ নির্মূল করার জন্য এই অ্যান্টিবায়োটিক দেওয়া হয়েছে।',
              howItWorks: 'ব্যাকটেরিয়ার প্রতিরক্ষামূলক কোষপ্রাচীর গঠনে বাধা দিয়ে ব্যাকটেরিয়া ধ্বংস করে এবং সংক্রমণ ছড়াতে দেয় না।',
              dosage: '৬২৫ মি.গ্রা.',
              form: 'tablet',
              frequency: '1-0-1',
              timing: 'after_food',
              duration: '৭ দিন',
              instructions: 'এন্টিবায়োটিকের সম্পূর্ণ কোর্স সমাপ্ত করুন',
            },
            {
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: 'প্যান্টোপ্রাজল',
              shortName: 'Cap. Pan 40',
              fullForm: 'প্যান্টোপ্রাজল সোডিয়াম গ্যাস্ট্রো-রেজিস্ট্যান্ট ৪০ মি.গ্রা.',
              purpose: 'গ্যাস্ট্রিক আলসার, তীব্র বুকজ্বালা ও এসিডিটি নিরাময়',
              whyPrescribed: 'অ্যান্টিবায়োটিক ও ব্যথানাশক ওষুধের প্রভাবে যেন পেটে অতিরিক্ত অ্যাসিড বা ক্ষত সৃষ্টি না হয় সেই সুরক্ষা কবচ হিসেবে দেওয়া হয়েছে।',
              howItWorks: 'পাকস্থলীর প্রোটন পাম্প সরাসরি নিষ্ক্রিয় করে অ্যাসিড উৎপাদন উল্লেখযোগ্যভাবে কমিয়ে পাকস্থলীকে শান্ত রাখে।',
              dosage: '৪০ মি.গ্রা.',
              form: 'capsule',
              frequency: '1-0-0',
              timing: 'before_food',
              duration: '১৪ দিন',
              instructions: 'সকালের নাস্তার ৩০ মিনিট আগে খালি পেটে সেব্য',
            },
            {
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: 'সেটিরিজিন',
              shortName: 'Tab. Cetzine 10',
              fullForm: 'সেটিরিজিন ডাইহাইড্রোক্লোরাইড ১০ মি.গ্রা.',
              purpose: 'অ্যালার্জি, অনবরত হাঁচি, সর্দি ও ত্বকের চুলকানি নিরাময়',
              whyPrescribed: 'নাক দিয়ে পানি পড়া, চোখ দিয়ে পানি আসা এবং ত্বকের অ্যালার্জিক চুলকানি সম্পূর্ণ বন্ধ করতে দেওয়া হয়েছে।',
              howItWorks: 'শরীরে অ্যালার্জি সৃষ্টিকারী হিস্টামিন হরমোনকে ব্লক করে অ্যালার্জির সংকেত পরিবহন বন্ধ করে দেয়।',
              dosage: '১০ মি.গ্রা.',
              form: 'tablet',
              frequency: '0-0-1',
              timing: 'after_food',
              duration: '৫ দিন',
              instructions: 'রাতে ঘুমানোর আগে সেব্য',
            }
          ]
        : [
            {
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: 'Paracetamol',
              shortName: 'Tab. PCM 650',
              fullForm: 'Paracetamol (Acetaminophen) 650 mg',
              purpose: 'Fever reduction & rapid alleviation of body ache',
              whyPrescribed: 'Prescribed to rapidly bring down elevated body temperature and relieve muscle aches and joint pain.',
              howItWorks: 'Inhibits prostaglandin synthesis in the central nervous system and acts on the hypothalamic heat-regulating center.',
              dosage: '650 mg',
              form: 'tablet',
              frequency: '1-0-1',
              timing: 'after_food',
              duration: '5 days',
              instructions: 'Take with warm water after meals',
            },
            {
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: 'Amoxicillin + Clavulanic Acid',
              shortName: 'Tab. Augmentin 625',
              fullForm: 'Amoxicillin & Potassium Clavulanate 625 mg',
              purpose: 'Eradication of bacterial infections & inflammation',
              whyPrescribed: 'Prescribed to eliminate bacterial infections of the respiratory tract and throat.',
              howItWorks: 'Inhibits bacterial cell wall synthesis while clavulanic acid protects amoxicillin from beta-lactamase degradation.',
              dosage: '625 mg',
              form: 'tablet',
              frequency: '1-0-1',
              timing: 'after_food',
              duration: '7 days',
              instructions: 'Complete full antibacterial course',
            },
            {
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: 'Pantoprazole',
              shortName: 'Cap. Pan 40',
              fullForm: 'Pantoprazole Sodium Gastro-resistant 40 mg',
              purpose: 'Relief of gastric irritation, GERD & acidity protection',
              whyPrescribed: 'Prescribed as a protective gastric shield to prevent acid rebound and stomach ulcers caused by other medications.',
              howItWorks: 'Selectively binds to the proton pump (H+/K+-ATPase) in stomach parietal cells to inhibit stomach acid secretion.',
              dosage: '40 mg',
              form: 'capsule',
              frequency: '1-0-0',
              timing: 'before_food',
              duration: '14 days',
              instructions: 'Take on empty stomach 30 mins before breakfast',
            },
            {
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: 'Cetirizine',
              shortName: 'Tab. Cetzine 10',
              fullForm: 'Cetirizine Dihydrochloride 10 mg',
              purpose: 'Allergy relief, anti-histamine & anti-sneezing',
              whyPrescribed: 'Prescribed to relieve runny nose, constant sneezing, itchy eyes, and allergic skin irritation.',
              howItWorks: 'Selectively antagonizes peripheral H1 histamine receptors to halt allergy-triggered inflammatory reactions.',
              dosage: '10 mg',
              form: 'tablet',
              frequency: '0-0-1',
              timing: 'after_food',
              duration: '5 days',
              instructions: 'Take before bedtime if itchy or sneezing',
            }
          ];

      const extractedPhonesSample1: ContactPhone[] = [
        {
          number: '+91 98301 23456',
          type: 'booking',
          label: isBengali ? 'ওপিডি চেম্বার সিরিয়াল ডেস্ক' : 'OPD Chamber Appointment Desk',
        }
      ];

      const todayDate = new Date().toLocaleDateString(isBengali ? 'bn-IN' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      return {
        id: 'rx-sample-citycare-drskroy',
        imageDataUrl: '/images/prescription_citycare.jpg',
        hospitalName: isBengali ? 'সিটি কেয়ার হাসপাতাল ও মেডিকেল রিসার্চ সেন্টার' : 'City Care Hospital & Medical Research Centre',
        doctorName: isBengali ? 'ডাঃ এস. কে. রায়, এমবিবিএস, এমডি (মেডিসিন)' : 'Dr. S. K. Roy, MBBS, MD (Medicine)',
        doctorSpecialty: isBengali ? 'মেডিসিন বিশেষজ্ঞ ও ক্রিটিক্যাল কেয়ার' : 'Internal Medicine & Critical Care',
        patientName: patientNameFallback || (isBengali ? 'রোগী' : 'Patient'),
        date: todayDate,
        recheckInterval: isBengali ? '২ সপ্তাহ পর পুনরায় দেখা করুন' : 'After 2 weeks',
        medicines: extractedMedicinesSample1,
        phoneNumbers: extractedPhonesSample1,
        diagnosticTests: [
          {
            id: 'test-citycare-1',
            prescriptionId: 'rx-sample-citycare-drskroy',
            testName: isBengali ? 'রক্তের সম্পূর্ণ গণনা (CBC)' : 'Complete Blood Count (CBC / Hemogram)',
            category: 'blood',
            instructions: isBengali ? 'সকালের রক্ত নমুনা' : 'Routine morning blood sample',
            status: 'completed',
            completedDate: todayDate,
            resultSummary: isBengali ? 'স্বাভাবিক' : 'Normal (Hb: 13.8 g/dL, TLC: 7,400)',
          }
        ],
        allergies: isBengali ? ['পেনিসিলিন', 'সালফা ওষুধ'] : ['Penicillin', 'Sulfa Drugs'],
        notes: isBengali ? 'পরামর্শ: প্রচুর পানি পান ও বিশ্রাম নিন।' : 'Advised: Plenty of fluids and rest.',
        scannedAt: Date.now(),
      };
    }

    // ========================================================
    // PATH 2: REAL USER PRESCRIPTION (Authentic OCR & Storage)
    // ========================================================
    const uniqueRxId = 'rx-user-' + Date.now();
    const todayDate = new Date().toLocaleDateString(isBengali ? 'bn-IN' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    let rawOcrText = '';

    // Run Tesseract Optical Character Recognition
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageDataUrl);
      rawOcrText = ret?.data?.text || '';
      await worker.terminate();
    } catch (ocrErr) {
      console.warn('Real-time OCR recognition warning (offline/handwriting fallback):', ocrErr);
    }

    const lines = rawOcrText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 1. Doctor Name & Credentials Extraction
    let extractedDoctorName = '';
    let extractedSpecialty = '';
    for (const line of lines) {
      if (/Dr\.|Doctor|MBBS|MD|MS|FRCS|Consultant|BAMS|BHMS|DNB/i.test(line)) {
        extractedDoctorName = line.replace(/^[=\-—\s:.]+/g, '').trim();
        if (/Cardio/i.test(line)) extractedSpecialty = isBengali ? 'হৃদরোগ বিশেষজ্ঞ' : 'Cardiologist';
        else if (/Pediatric|Child/i.test(line)) extractedSpecialty = isBengali ? 'শিশু বিশেষজ্ঞ' : 'Pediatrician';
        else if (/Ortho/i.test(line)) extractedSpecialty = isBengali ? 'অস্থি ও জয়েন্ট বিশেষজ্ঞ' : 'Orthopedic Surgeon';
        else if (/Gynae|Obs/i.test(line)) extractedSpecialty = isBengali ? 'স্ত্রী ও প্রসূতি বিশেষজ্ঞ' : 'Gynecologist';
        else if (/ENT/i.test(line)) extractedSpecialty = isBengali ? 'নাক, কান ও গলা বিশেষজ্ঞ' : 'ENT Specialist';
        else extractedSpecialty = isBengali ? 'চিকিৎসক ও কনসালটেন্ট' : 'Consultant Physician';
        break;
      }
    }

    if (!extractedDoctorName) {
      extractedDoctorName = isBengali ? 'ডাঃ (প্রেসক্রিপশন অনুযায়ী)' : 'Consulting Doctor (From Prescription)';
      extractedSpecialty = isBengali ? 'প্রেসক্রিপশন অনুযায়ী চিকিৎসা' : 'General Clinical Consultation';
    }

    // 2. Hospital / Clinical Facility Extraction
    let extractedHospitalName = '';
    for (let i = 0; i < Math.min(6, lines.length); i++) {
      const line = lines[i];
      if (
        /Hospital|Clinic|Centre|Center|Care|Health|Institute|Dispensary|Nursing\s*Home|Chamber|Medical/i.test(line) &&
        !/Dr\.|Doctor/i.test(line)
      ) {
        extractedHospitalName = line.replace(/^[=\-—\s:.]+/g, '').trim();
        break;
      }
    }
    if (!extractedHospitalName) {
      extractedHospitalName = isBengali ? 'চিকিৎসা ক্লিনিক / হাসপাতাল' : 'Medical Clinic & Health Facility';
    }

    // 3. Contact Phone Numbers Extraction
    const extractedPhones: ContactPhone[] = [];
    for (const line of lines) {
      const match = line.match(/(?:\+?91[\-\s]?)?[6-9]\d{9}|(?:\+?91[\-\s]?)?\d{5}[\-\s]\d{5}|\b\d{3,5}[\-\s]\d{6,8}\b/);
      if (match) {
        const phoneClean = match[0].trim();
        if (!extractedPhones.some((p) => p.number === phoneClean)) {
          extractedPhones.push({
            number: phoneClean,
            type: /Emergency|24x7|ICU|Casualty/i.test(line) ? 'emergency' : 'booking',
            label: /Emergency|24x7/i.test(line)
              ? (isBengali ? 'জরুরি হেল্পলাইন' : 'Emergency Helpline')
              : (isBengali ? 'চেম্বার অ্যাপয়েন্টমেন্ট' : 'Chamber Appointment Desk'),
          });
        }
      }
    }

    // 4. Patient Name Extraction
    let extractedPatientName = patientNameFallback || '';
    for (const line of lines) {
      const ptMatch = line.match(/(?:Patient|Pt|Name)[\s:=]+([A-Za-z\s]+?)(?:\s+Age|\s+Date|\s+Sex|\s+BP|$)/i);
      if (ptMatch && ptMatch[1].trim().length > 2) {
        extractedPatientName = ptMatch[1].trim();
        break;
      }
    }
    if (!extractedPatientName) {
      extractedPatientName = patientNameFallback || (isBengali ? 'রোগী' : 'Patient');
    }

    // 5. Date Extraction
    let extractedDate = todayDate;
    for (const line of lines) {
      const dateMatch = line.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
      if (dateMatch) {
        extractedDate = dateMatch[1];
        break;
      }
    }

    // 6. Medication Entities Parsing
    const extractedMedicines: Medication[] = [];

    // Helper to find catalog definition
    const findInCatalog = (str: string): ClinicalMedDef | null => {
      const lower = str.toLowerCase();
      for (const [key, def] of Object.entries(CLINICAL_CATALOG)) {
        if (lower.includes(key)) return def;
      }
      return null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const combined = `${line} ${nextLine}`;

      const isMedLine = 
        /\b(Tab|Tablet|Cap|Capsule|Syr|Syrup|Inj|Injection|Drops|Ointment)\b/i.test(line) ||
        /\b\d+\s*(mg|mcg|gm|g|ml)\b/i.test(line) ||
        Object.keys(CLINICAL_CATALOG).some((k) => line.toLowerCase().includes(k));

      if (isMedLine) {
        // Extract dosage
        const dosageMatch = combined.match(/\b\d+(\.\d+)?\s*(mg|mcg|gm|g|ml)\b/i);
        const dosage = dosageMatch ? dosageMatch[0] : '';

        // Extract frequency
        let frequency = '1-0-1';
        if (/\b(1-0-1|1-0-0|0-0-1|1-1-1|0-1-0|0-1-1|1-1-0|2-0-2)\b/.test(combined)) {
          const fm = combined.match(/\b(1-0-1|1-0-0|0-0-1|1-1-1|0-1-0|0-1-1|1-1-0|2-0-2)\b/);
          if (fm) frequency = fm[0];
        } else if (/\b(TDS|TID|thrice)\b/i.test(combined)) {
          frequency = '1-1-1';
        } else if (/\b(BD|BID|twice)\b/i.test(combined)) {
          frequency = '1-0-1';
        } else if (/\b(OD|once)\b/i.test(combined)) {
          frequency = '1-0-0';
        } else if (/\b(HS|bedtime|night)\b/i.test(combined)) {
          frequency = '0-0-1';
        } else if (/\b(SOS)\b/i.test(combined)) {
          frequency = '1-0-0';
        }

        // Extract timing
        let timing: 'before_food' | 'after_food' | 'with_food' | 'as_needed' = 'after_food';
        if (/\b(before\s*food|before\s*meal|empty\s*stomach|ac|a\.c\.)\b/i.test(combined)) {
          timing = 'before_food';
        } else if (/\b(after\s*food|after\s*meal|pc|p\.c\.)\b/i.test(combined)) {
          timing = 'after_food';
        }

        // Extract duration
        let duration = isBengali ? '৫ দিন' : '5 days';
        const durMatch = combined.match(/\b(\d+)\s*(days|day|weeks|week|months|month)\b/i) ||
                         combined.match(/[xX]\s*(\d+)\s*(days|day)?/);
        if (durMatch) {
          const num = durMatch[1];
          duration = isBengali ? `${num} দিন` : `${num} days`;
        }

        // Form
        let form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'drops' | 'cream' = 'tablet';
        if (/Cap|Capsule/i.test(line)) form = 'capsule';
        else if (/Syr|Syrup/i.test(line)) form = 'syrup';
        else if (/Inj|Injection/i.test(line)) form = 'injection';
        else if (/Drop/i.test(line)) form = 'drops';

        // Check catalog match for medical dictionary explanation
        const cat = findInCatalog(combined);
        const medNameClean = line.replace(/^[=\-—\d.:\s]+/, '').replace(/\b(Tab|Cap|Syr|Inj)\b\.?/gi, '').trim();

        if (cat) {
          // Avoid duplicate entry
          if (!extractedMedicines.some((m) => m.name.toLowerCase() === cat.name.toLowerCase())) {
            extractedMedicines.push({
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: isBengali && cat.name === 'Paracetamol' ? 'প্যারাসিটামল' : cat.name,
              shortName: `${form === 'capsule' ? 'Cap.' : 'Tab.'} ${cat.name} ${dosage || cat.defaultDosage}`,
              fullForm: `${cat.generic} ${dosage || cat.defaultDosage}`,
              purpose: isBengali ? cat.purposeBn : cat.purpose,
              whyPrescribed: isBengali ? cat.whyPrescribedBn : cat.whyPrescribed,
              howItWorks: isBengali ? cat.howItWorksBn : cat.howItWorks,
              dosage: dosage || cat.defaultDosage,
              form,
              frequency,
              timing: timing || cat.defaultTiming,
              duration,
              instructions: timing === 'before_food'
                ? (isBengali ? 'খাবারের ৩০ মিনিট পূর্বে খালি পেটে সেব্য' : 'Take 30 mins before meals on empty stomach')
                : (isBengali ? 'খাবারের পর পানির সাথে সেব্য' : 'Take with water after meals'),
            });
          }
        } else if (medNameClean.length >= 3) {
          // General uncatalogued medicine from paper
          const cleanDisplayName = medNameClean.split(/[-—(]/)[0].trim();
          if (!extractedMedicines.some((m) => m.name.toLowerCase() === cleanDisplayName.toLowerCase())) {
            extractedMedicines.push({
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: cleanDisplayName,
              shortName: `${form === 'capsule' ? 'Cap.' : 'Tab.'} ${cleanDisplayName} ${dosage}`,
              fullForm: `${cleanDisplayName} ${dosage}`.trim(),
              purpose: isBengali ? 'প্রেসক্রিপশন অনুযায়ী নিরাময় চিকিৎসা' : 'Physician-prescribed therapeutic treatment',
              whyPrescribed: isBengali
                ? 'ডাক্তারের প্রেসক্রিপশন অনুযায়ী রোগীর দ্রুত সুস্থতার জন্য নির্দেশিত।'
                : 'Prescribed by the doctor for symptom resolution and patient recovery.',
              howItWorks: isBengali
                ? 'শারীরিক উপসর্গ নিয়ন্ত্রণ করে আরোগ্য লাভে সহায়তা করে।'
                : 'Acts on target biological pathways to manage health symptoms.',
              dosage: dosage || '1 tab',
              form,
              frequency,
              timing,
              duration,
              instructions: timing === 'before_food'
                ? (isBengali ? 'খাবারের পূর্বে সেব্য' : 'Take before food')
                : (isBengali ? 'খাবারের পর সেব্য' : 'Take after food'),
            });
          }
        }
      }
    }

    // Fallback if handwriting is too faint or handwriting cursive prevented automatic medicine detection
    if (extractedMedicines.length === 0) {
      extractedMedicines.push({
        id: 'med-' + Math.random().toString(36).substring(2, 9),
        name: isBengali ? 'প্রেসক্রিপশন ওষুধ ১ (ক্লিক করে নাম লিখুন)' : 'Prescription Medicine 1 (Click to Edit)',
        shortName: isBengali ? 'ট্যাবলেট ১' : 'Tab. Medicine 1',
        fullForm: isBengali ? 'ডাক্তারের প্রেসক্রিপশন অনুযায়ী ওষুধ' : 'Doctor Prescribed Medication',
        purpose: isBengali ? 'চিকিৎসা ও রোগ নিরাময়' : 'Therapeutic healing and treatment',
        whyPrescribed: isBengali ? 'প্রেসক্রিপশন অনুযায়ী নির্ধারিত' : 'Prescribed as per scanned consultation',
        howItWorks: isBengali ? 'রোগ উপশমে সাহায্য করে' : 'Aids in health recovery',
        dosage: '1 tab',
        form: 'tablet',
        frequency: '1-0-1',
        timing: 'after_food',
        duration: isBengali ? '৫ দিন' : '5 days',
        instructions: isBengali ? 'খাবারের পর পানির সাথে সেব্য' : 'Take with water after meals',
      });
    }

    // 7. Diagnostic Tests Extraction
    const extractedDiagnosticTests: DiagnosticTest[] = [];
    for (const line of lines) {
      if (/\b(CBC|Hemogram|Lipid|HbA1c|Sugar|FBS|PPBS|Creatinine|Urea|LFT|KFT|Urine|ECG|X-Ray|USG)\b/i.test(line)) {
        const testMatch = line.match(/\b(CBC|Hemogram|Lipid\s*Profile|HbA1c|Blood\s*Sugar|FBS|PPBS|Creatinine|Urea|LFT|KFT|Urine\s*R\/E|ECG|X-Ray|Ultrasound)\b/i);
        const name = testMatch ? testMatch[0] : 'Laboratory Investigation';
        extractedDiagnosticTests.push({
          id: 'test-user-' + Math.random().toString(36).substring(2, 7),
          prescriptionId: uniqueRxId,
          testName: name,
          category: /ECG|X-Ray|Ultrasound/i.test(name) ? 'imaging' : /Urine/i.test(name) ? 'urine' : 'blood',
          instructions: isBengali ? 'ল্যাবরেটরি থেকে পরীক্ষা করান' : 'Complete at clinical laboratory',
          status: 'pending',
        });
      }
    }

    return {
      id: uniqueRxId,
      imageDataUrl: imageDataUrl, // STRICTLY PRESERVES THE REAL USER PHOTO!
      hospitalName: extractedHospitalName,
      doctorName: extractedDoctorName,
      doctorSpecialty: extractedSpecialty,
      patientName: extractedPatientName,
      date: extractedDate,
      recheckInterval: isBengali ? 'প্রেসক্রিপশন অনুযায়ী' : 'As advised by doctor',
      medicines: extractedMedicines,
      phoneNumbers: extractedPhones,
      diagnosticTests: extractedDiagnosticTests,
      allergies: [],
      notes: isBengali
        ? 'প্রেসক্রিপশনটি নিরাপদে ডিজিটাল ভল্টে সংরক্ষিত হয়েছে। নিচে ওষুধের নাম ও সময়সূচি যাচাই বা পরিবর্তন করতে পারেন।'
        : 'Prescription document securely saved in your Digital Vault. You can easily review, edit, or adjust medicine timings below.',
      scannedAt: Date.now(),
    };
  }
};
