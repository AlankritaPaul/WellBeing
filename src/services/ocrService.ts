import { createWorker } from 'tesseract.js';
import type { ScannedPrescription, Medication, ContactPhone, DiagnosticTest } from '../types/prescription';
import { geminiVisionService } from './geminiVisionService';

export interface OCRProcessOptions {
  isSample?: boolean;
  sampleIndex?: number;
}

// Comprehensive Clinical Medication Knowledge Base
interface ClinicalMedDef {
  name: string;
  generic: string;
  aliases: string[];
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
    aliases: ['paracetamol', 'dolo', 'calpol', 'crocin', 'pacimol', 'pcm', 'pyregesic', 'metacin'],
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
    aliases: ['augmentin', 'clavam', 'moxikind', 'amoxyclav', 'amoxicillin', 'mox', 'novamox'],
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
    aliases: ['pantoprazole', 'pantocid', 'pan', 'pan-d', 'pantop', 'pantodac', 'pantosec'],
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
    aliases: ['omeprazole', 'omez', 'omez-d', 'ocid'],
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
  rabeprazole: {
    name: 'Rabeprazole',
    generic: 'Rabeprazole Sodium',
    aliases: ['rabeprazole', 'rabekind', 'razo', 'cyra', 'cyra-d', 'happi', 'rabicip'],
    purpose: 'Rapid gastric acid suppression & peptic protection',
    purposeBn: 'তীব্র গ্যাস্ট্রিক আলসার ও বুকজ্বালার দ্রুত উপশম',
    whyPrescribed: 'Prescribed to fast-track healing of stomach mucosal lining and halt hyperacidity.',
    whyPrescribedBn: 'পাকস্থলীর ভেতরের আবরণের ক্ষত দ্রুত সারিয়ে তোলা এবং অতিরিক্ত অ্যাসিড বন্ধ করার জন্য দেওয়া হয়েছে।',
    howItWorks: 'Inhibits gastric H+/K+-ATPase enzyme system in gastric parietal cells.',
    howItWorksBn: 'পাকস্থলীর অ্যাসিড প্রস্তুতকারী এনজাইম নিষ্ক্রিয় করে এসিডিটি দূর করে।',
    defaultDosage: '20 mg',
    defaultTiming: 'before_food',
    defaultFreq: '1-0-0',
  },
  cetirizine: {
    name: 'Cetirizine',
    generic: 'Cetirizine Dihydrochloride',
    aliases: ['cetirizine', 'cetzine', 'okacet', 'alercet', 'zyrtec'],
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
    aliases: ['levocetirizine', 'levocet', '1-cet', 'hatric-l', 'teczine'],
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
  montelukast: {
    name: 'Montelukast + Levocetirizine',
    generic: 'Montelukast Sodium & Levocetirizine Hydrochloride',
    aliases: ['montair-lc', 'montek-lc', 'telekast-l', 'romilast-l', 'montair', 'montek'],
    purpose: 'Dual action for airway congestion, asthma & allergic rhinitis',
    purposeBn: 'শ্বাসকষ্ট, শ্বাসনালীর টান ও মারাত্মক অ্যালার্জি নিয়ন্ত্রণ',
    whyPrescribed: 'Prescribed to prevent wheezing, shortness of breath, and night-time coughing fits.',
    whyPrescribedBn: 'রাতের তীব্র কাশি, শ্বাসনালীর টান এবং বুকে কফ জমার সমস্যা দূর করতে দেওয়া হয়েছে।',
    howItWorks: 'Combines leukotriene receptor blockade with peripheral H1 antihistamine action.',
    howItWorksBn: 'শ্বাসনালীর লিউকোট্রিন রিসেপ্টর ব্লক করে শ্বাসপ্রশ্বাস সহজ করে এবং হিস্টামিন বন্ধ করে অ্যালার্জি থামায়।',
    defaultDosage: '10 mg',
    defaultTiming: 'after_food',
    defaultFreq: '0-0-1',
  },
  azithromycin: {
    name: 'Azithromycin',
    generic: 'Azithromycin Dihydrate',
    aliases: ['azithromycin', 'azithral', 'azee', 'zady', 'aziwok'],
    purpose: 'Macrolide antibiotic for respiratory & throat infections',
    purposeBn: 'শ্বাসতন্ত্র, গলা ও ফুসফুসের ব্যাকটেরিয়াল সংক্রমণ প্রতিরোধক',
    whyPrescribed: 'Prescribed to clear bacterial bronchitis, pharyngitis, and sinusitis.',
    whyPrescribedBn: 'গলা ও ফুসফুসের ব্যাকটেরিয়াল সংক্রমণ নির্মূল করতে দেওয়া হয়েছে।',
    howItWorks: 'Binds to the 50S ribosomal subunit of susceptible microorganisms, interfering with microbial protein synthesis.',
    howItWorksBn: 'ব্যাকটেরিয়ার প্রোটিন তৈরিতে বাধা দিয়ে জীবাণু ধ্বংস করে।',
    defaultDosage: '500 mg',
    defaultTiming: 'before_food',
    defaultFreq: '1-0-0',
  },
  metformin: {
    name: 'Metformin SR',
    generic: 'Metformin Hydrochloride Sustained Release',
    aliases: ['metformin', 'glycomet', 'glyciphage', 'cetapin', 'glucophage'],
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
  telmisartan: {
    name: 'Telmisartan',
    generic: 'Telmisartan',
    aliases: ['telmisartan', 'telma', 'telmikind', 'telpres', 'telsartan'],
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
    aliases: ['amlodipine', 'amlong', 'stamlo', 'amlopres', 'amlovas'],
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
  atorvastatin: {
    name: 'Atorvastatin',
    generic: 'Atorvastatin Calcium',
    aliases: ['atorvastatin', 'atorva', 'atorlip', 'lipitor', 'storvas'],
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
  rosuvastatin: {
    name: 'Rosuvastatin',
    generic: 'Rosuvastatin Calcium',
    aliases: ['rosuvastatin', 'rosuvas', 'rozavel', 'razel'],
    purpose: 'Potent cholesterol management and arterial protection',
    purposeBn: 'উচ্চ কোলেস্টেরল নিয়ন্ত্রণ ও রক্তনালী সুরক্ষা',
    whyPrescribed: 'Prescribed to clear high cholesterol levels and stabilize cardiac blood vessels.',
    whyPrescribedBn: 'রক্তের চর্বি দ্রুত কমিয়ে হৃদপিণ্ড সুরক্ষিত রাখতে দেওয়া হয়েছে।',
    howItWorks: 'Competitively inhibits HMG-CoA reductase to stimulate LDL receptor clearance.',
    howItWorksBn: 'লিভারে কোলেস্টেরল উৎপাদন থামিয়ে ক্ষতিকর চর্বি দূর করে।',
    defaultDosage: '10 mg',
    defaultTiming: 'after_food',
    defaultFreq: '0-0-1',
  },
  aspirin: {
    name: 'Ecosprin (Aspirin)',
    generic: 'Aspirin Gastro-resistant',
    aliases: ['ecosprin', 'aspirin', 'loprin', 'delisprin'],
    purpose: 'Antiplatelet cardiac shield to prevent blood clots',
    purposeBn: 'রক্ত জমাট বাঁধা প্রতিরোধ ও হার্ট অ্যাটাকের সুরক্ষা কবচ',
    whyPrescribed: 'Prescribed as daily cardiac protection to maintain smooth arterial blood flow.',
    whyPrescribedBn: 'রক্তনালীতে রক্ত যেন জমাট না বাঁধে এবং হার্ট সুস্থ থাকে সেজন্য দেওয়া হয়েছে।',
    howItWorks: 'Irreversibly inhibits platelet cyclooxygenase-1 to prevent thromboxane A2 formation.',
    howItWorksBn: 'রক্তের প্লেটলেটকে জমাট বাঁধতে না দিয়ে রক্ত পাতলা ও সচল রাখে।',
    defaultDosage: '75 mg',
    defaultTiming: 'after_food',
    defaultFreq: '0-0-1',
  },
  levothyroxine: {
    name: 'Thyronorm (Levothyroxine)',
    generic: 'Levothyroxine Sodium',
    aliases: ['thyronorm', 'eltroxin', 'thyrox', 'levothyroxine'],
    purpose: 'Thyroid hormone replacement for hypothyroidism',
    purposeBn: 'থাইরয়েড হরমোনের ঘাটতি পূরণ ও বিপাক নিয়ন্ত্রণ',
    whyPrescribed: 'Prescribed to restore normal thyroid levels and treat sluggish metabolism, fatigue, and weight gain.',
    whyPrescribedBn: 'থাইরয়েডের স্বাভাবিক মাত্রা বজায় রাখতে এবং ক্লান্তি ও ওজন বৃদ্ধি রোধ করতে দেওয়া হয়েছে।',
    howItWorks: 'Supplements synthetic T4 which converts to active T3 in peripheral tissues.',
    howItWorksBn: 'শরীরে প্রয়োজনীয় থাইরক্সিন হরমোন পূরণ করে স্বাভাবিক মেটাবলিজম ফিরিয়ে আনে।',
    defaultDosage: '50 mcg',
    defaultTiming: 'before_food',
    defaultFreq: '1-0-0',
  },
  ibuprofen: {
    name: 'Combiflam (Ibuprofen + Paracetamol)',
    generic: 'Ibuprofen & Paracetamol',
    aliases: ['combiflam', 'brufen', 'ibugesic', 'flexon', 'ibuprofen'],
    purpose: 'Dual action for musculoskeletal pain, inflammation & swelling',
    purposeBn: 'তীব্র পেশি ব্যথা, ফোলা ও প্রদাহ নিরাময়',
    whyPrescribed: 'Prescribed for rapid relief of severe joint pain, dental ache, or injury swelling.',
    whyPrescribedBn: 'হাড় ও পেশির তীব্র যন্ত্রণা এবং ফোলা উপশমের জন্য দেওয়া হয়েছে।',
    howItWorks: 'Inhibits COX enzymes to eliminate prostaglandins at inflammatory sites.',
    howItWorksBn: 'প্রদাহ সৃষ্টিকারী প্রোস্টাগ্ল্যান্ডিন উৎপাদন বন্ধ করে ব্যথা ও ফোলা কমায়।',
    defaultDosage: '400 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  aceclofenac: {
    name: 'Zerodol-SP',
    generic: 'Aceclofenac, Paracetamol & Serratiopeptidase',
    aliases: ['zerodol', 'zerodol-sp', 'zerodol-p', 'aceclo-sp', 'aceclo', 'hifenac'],
    purpose: 'Triple action anti-inflammatory, pain relief & tissue healing',
    purposeBn: 'তীব্র আঘাত, অস্ত্রোপচার পরবর্তী ব্যথা ও ফোলা নিরাময়',
    whyPrescribed: 'Prescribed to rapidly resolve severe acute pain and promote tissue healing enzyme action.',
    whyPrescribedBn: 'শরীরের গভীর ব্যথা ও ফোলা দ্রুত কমাতে এবং টিস্যু সুস্থ করতে দেওয়া হয়েছে।',
    howItWorks: 'Blocks inflammatory prostaglandins while serratiopeptidase dissolves fibrous exudate.',
    howItWorksBn: 'ব্যথানাশক উপাদানের পাশাপাশি এনজাইম ফোলা রক্তরস দ্রুত শোষণ করে ব্যথা দূর করে।',
    defaultDosage: '1 tab',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  mefenamic: {
    name: 'Meftal-Spas',
    generic: 'Mefenamic Acid & Dicyclomine Hydrochloride',
    aliases: ['meftal', 'meftal-spas', 'meftagesic'],
    purpose: 'Antispasmodic for acute abdominal colic & intestinal cramps',
    purposeBn: 'তীব্র পেটের মোচড়, পেট ব্যথা ও ক্র্যাম্প নিরাময়',
    whyPrescribed: 'Prescribed for swift relief from severe abdominal cramps, stomach spasms, and colic.',
    whyPrescribedBn: 'পেটের তীব্র মোচড় ও মাংসপেশির খিঁচুনি বন্ধ করতে দেওয়া হয়েছে।',
    howItWorks: 'Relaxes smooth muscle spasm in gut wall while mefenamic acid curbs local pain.',
    howItWorksBn: 'পাকস্থলী ও অন্ত্রের মাংসপেশির খিঁচুনি শিথিল করে পেটের ব্যথা থামায়।',
    defaultDosage: '1 tab',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  diclofenac: {
    name: 'Voveran',
    generic: 'Diclofenac Sodium',
    aliases: ['voveran', 'volini', 'dynapar', 'diclogel', 'diclofenac'],
    purpose: 'Potent analgesic for severe joint, bone & spine pain',
    purposeBn: 'হাড়, জয়েন্ট ও মেরুদণ্ডের তীব্র ব্যথা নিরাময়',
    whyPrescribed: 'Prescribed to manage severe arthritis flare-ups, back pain, and orthopedic conditions.',
    whyPrescribedBn: 'বাতব্যথা, কোমর ও পিঠের তীব্র যন্ত্রণা নিয়ন্ত্রণে দেওয়া হয়েছে।',
    howItWorks: 'Strongly inhibits arachidonic acid cascade to halt pain neurotransmission.',
    howItWorksBn: 'ব্যথার সংকেত সৃষ্টিকারী রাসায়নিকের প্রবাহ বন্ধ করে তীব্র ব্যথা কমায়।',
    defaultDosage: '50 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  vitamin_b: {
    name: 'Becosules / Neurobion Forte',
    generic: 'Vitamin B-Complex & Vitamin C with Zinc',
    aliases: ['becosules', 'neurobion', 'neurobion-forte', 'b-complex', 'cobadex'],
    purpose: 'Nerve rejuvenation, mouth ulcer healing & daily energy boost',
    purposeBn: 'স্নায়ু শক্তি বৃদ্ধি, মুখের ঘা নিরাময় ও শারীরিক দুর্বলতা দূর',
    whyPrescribed: 'Prescribed to support nerve health, heal mucosal tissues, and recover from fatigue.',
    whyPrescribedBn: 'স্নায়ুর কার্যক্ষমতা বৃদ্ধি, মুখের ক্ষত সারানো ও দুর্বলতা দূর করতে দেওয়া হয়েছে।',
    howItWorks: 'Essential coenzymes in cellular metabolic pathways and myelin sheath maintenance.',
    howItWorksBn: 'কোষে শক্তি উৎপাদনের পাশাপাশি স্নায়ুর প্রতিরক্ষামূলক আবরণ সুরক্ষিত রাখে।',
    defaultDosage: '1 cap',
    defaultTiming: 'after_food',
    defaultFreq: '0-1-0',
  },
  calcium: {
    name: 'Shelcal 500',
    generic: 'Calcium & Vitamin D3',
    aliases: ['shelcal', 'gemcal', 'calcimax', 'cipcal', 'calcium'],
    purpose: 'Bone mineral density enhancement & calcium supplementation',
    purposeBn: 'হাড় ও দাঁত মজবুতকরণ এবং ক্যালসিয়ামের ঘাটতি পূরণ',
    whyPrescribed: 'Prescribed to maintain strong bone mass and prevent bone thinning or osteoporosis.',
    whyPrescribedBn: 'হাড়ের ঘনত্ব বাড়াতে এবং ক্যালসিয়ামের ঘাটতি দূর করতে দেওয়া হয়েছে।',
    howItWorks: 'Provides elemental calcium while Vitamin D3 facilitates active intestinal calcium transport.',
    howItWorksBn: 'ভিটামিন ডি-৩ অন্ত্র থেকে রক্তে ক্যালসিয়াম শোষণ বাড়িয়ে হাড়ে জমা করে।',
    defaultDosage: '500 mg',
    defaultTiming: 'after_food',
    defaultFreq: '0-0-1',
  },
  ranitidine: {
    name: 'Rantac / Aciloc',
    generic: 'Ranitidine Hydrochloride',
    aliases: ['rantac', 'aciloc', 'zinetac', 'ranitidine'],
    purpose: 'H2 receptor blocker for acid indigestion and sour stomach',
    purposeBn: 'বুকজ্বালা, টক ঢেকুর ও বদহজম নিরাময়',
    whyPrescribed: 'Prescribed for rapid relief of stomach burning sensation and gastric reflux.',
    whyPrescribedBn: 'বুকজ্বালা ও টক ঢেকুরের কষ্ট দ্রুত দূর করতে দেওয়া হয়েছে।',
    howItWorks: 'Blocks H2 receptors in gastric parietal cells to curb nocturnal and daytime acid output.',
    howItWorksBn: 'পাকস্থলীর এইচ২ রিসেপ্টর ব্লক করে অতিরিক্ত অ্যাসিড নিঃসরণ থামায়।',
    defaultDosage: '150 mg',
    defaultTiming: 'before_food',
    defaultFreq: '1-0-1',
  },
  ciprofloxacin: {
    name: 'Cifran 500',
    generic: 'Ciprofloxacin Hydrochloride',
    aliases: ['cifran', 'ciplox', 'ciprofloxacin'],
    purpose: 'Broad spectrum fluoroquinolone antibiotic',
    purposeBn: 'পেটের ইনফেকশন ও ব্যাকটেরিয়াল সংক্রমণ নির্মূল',
    whyPrescribed: 'Prescribed to treat acute gastroenteritis, urinary tract, and systemic infections.',
    whyPrescribedBn: 'পেটের ডায়রিয়া ও মূত্রনালীর মারাত্মক ইনফেকশন দূর করতে দেওয়া হয়েছে।',
    howItWorks: 'Inhibits bacterial DNA gyrase and topoisomerase IV to stop bacterial cell division.',
    howItWorksBn: 'ব্যাকটেরিয়ার বংশবৃদ্ধি ও ডিএনএ বিভাজন ধ্বংস করে জীবাণু মারে।',
    defaultDosage: '500 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  ofloxacin: {
    name: 'Oflox-OZ / Zenflox',
    generic: 'Ofloxacin & Ornidazole',
    aliases: ['oflox', 'zenflox', 'oflox-oz', 'norflox'],
    purpose: 'Potent dual antibiotic & antiprotozoal for acute diarrhea',
    purposeBn: 'আমাশয়, পাতলা পায়খানা ও পেটের জীবাণু সংক্রমণ নিরাময়',
    whyPrescribed: 'Prescribed for rapid control of severe gastrointestinal infections, loose motions, and cramps.',
    whyPrescribedBn: 'মারাত্মক পাতলা পায়খানা ও আমাশয়ের জীবাণু নির্মূলের জন্য দেওয়া হয়েছে।',
    howItWorks: 'Dual action against aerobic bacteria and anaerobic protozoan parasites.',
    howItWorksBn: 'ব্যাকটেরিয়া ও প্রোটোজোয়া উভয় জীবাণুকে একসাথে ধ্বংস করে পেট ভালো করে।',
    defaultDosage: '1 tab',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  cefixime: {
    name: 'Taxim-O 200',
    generic: 'Cefixime Trihydrate',
    aliases: ['taxim-o', 'cefix', 'mahacef', 'zipod', 'cefixime'],
    purpose: '3rd generation cephalosporin antibiotic for typhoid & chest infections',
    purposeBn: 'টাইফয়েড, ফুসফুস ও শ্বাসতন্ত্রের সংক্রমণ নিরাময়',
    whyPrescribed: 'Prescribed to eradicate resistant bacterial respiratory and urinary infections.',
    whyPrescribedBn: 'টাইফয়েড ও জটিল ব্যাকটেরিয়াল সংক্রমণ সম্পূর্ণ নির্মূল করতে দেওয়া হয়েছে।',
    howItWorks: 'Inhibits bacterial cell wall synthesis with superior beta-lactamase stability.',
    howItWorksBn: 'প্রতিরোধক ব্যাকটেরিয়ার কোষপ্রাচীর ভেঙে জীবাণু ধ্বংস করে।',
    defaultDosage: '200 mg',
    defaultTiming: 'after_food',
    defaultFreq: '1-0-1',
  },
  cough_syrup: {
    name: 'Ascoril-LS / Benadryl',
    generic: 'Levosalbutamol, Ambroxol & Guaiphenesin Expectorant',
    aliases: ['ascoril', 'benadryl', 'zedex', 'grilinctus', 'koflet', 'syrup'],
    purpose: 'Bronchodilator and mucolytic cough expectorant syrup',
    purposeBn: 'বুকে জমা কফ তরলীকরণ ও খুসখুসে কাশি উপশম',
    whyPrescribed: 'Prescribed to liquefy thick mucus phlegm, ease breathing, and stop coughing spasms.',
    whyPrescribedBn: 'বুকে জমে থাকা কফ নরম করে বের করে দিতে এবং শ্বাসপ্রশ্বাস সহজ করতে দেওয়া হয়েছে।',
    howItWorks: 'Dilates airways while ambroxol breaks down dense mucus polymers for effortless expectoration.',
    howItWorksBn: 'শ্বাসনালী প্রসারিত করে এবং জমাট কফ ভেঙে সহজে কাশি দূর করে।',
    defaultDosage: '10 ml',
    defaultTiming: 'after_food',
    defaultFreq: '1-1-1',
  },
};

// Algorithmic Fuzzy Matching Engine for Messy Doctor Handwriting
function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function isAbbrMatch(abbr: string, target: string): boolean {
  if (abbr.length < 3 || target.length < 3) return false;
  if (abbr[0] !== target[0]) return false;
  let i = 0, j = 0;
  while (i < abbr.length && j < target.length) {
    if (abbr[i] === target[j]) i++;
    j++;
  }
  return i === abbr.length && (abbr.length / target.length >= 0.45);
}

function matchFuzzyWord(rawWord: string, alias: string): boolean {
  const w = rawWord.toLowerCase().replace(/[^a-z0-9]/g, '');
  const a = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!w || !a) return false;
  if (w === a || w.includes(a) || a.includes(w)) return true;
  if (isAbbrMatch(w, a)) return true;
  if (w.length >= 4 && a.length >= 4) {
    const dist = levenshteinDistance(w, a);
    const maxLen = Math.max(w.length, a.length);
    if (dist <= 2 && dist / maxLen <= 0.3) return true;
  }
  return false;
}

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
    // Priority 1: Gemini Vision AI (Deciphers messy cursive doctor handwriting)
    // ========================================================
    if (geminiVisionService.isConfigured()) {
      try {
        const aiResult = await geminiVisionService.analyzePrescription(
          imageDataUrl,
          languageCode,
          patientNameFallback
        );
        return aiResult;
      } catch (aiErr) {
        console.warn('Gemini Vision AI error, proceeding to local scanner fallback:', aiErr);
      }
    }

    const uniqueRxId = 'rx-user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    let rawOcrText = '';

    // Run Tesseract Optical Character Recognition with local offline bundle (100% money-free, zero network calls, zero CDN fails)
    try {
      const worker = await createWorker('eng', 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core-simd-lstm.wasm.js',
        langPath: '/tesseract',
      });
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
      // Specialty detection
      if (/Cardio/i.test(line)) extractedSpecialty = isBengali ? 'হৃদরোগ বিশেষজ্ঞ' : 'Cardiologist';
      else if (/Pediatric|Child/i.test(line)) extractedSpecialty = isBengali ? 'শিশু বিশেষজ্ঞ' : 'Pediatrician';
      else if (/Ortho/i.test(line)) extractedSpecialty = isBengali ? 'অস্থি ও জয়েন্ট বিশেষজ্ঞ' : 'Orthopedic Surgeon';
      else if (/Gynae|Obs/i.test(line)) extractedSpecialty = isBengali ? 'স্ত্রী ও প্রসূতি বিশেষজ্ঞ' : 'Gynecologist';
      else if (/ENT/i.test(line)) extractedSpecialty = isBengali ? 'নাক, কান ও গলা বিশেষজ্ঞ' : 'ENT Specialist';
      else if (/Dermatolog/i.test(line)) extractedSpecialty = isBengali ? 'চর্মরোগ বিশেষজ্ঞ' : 'Dermatologist';
      else if (/Consultant\s*Physician/i.test(line)) extractedSpecialty = isBengali ? 'কনসালটেন্ট ফিজিশিয়ান' : 'Consultant Physician';
      else if (/\b(Physician|Surgeon|Consultant)\b/i.test(line) && !extractedSpecialty) {
        extractedSpecialty = isBengali ? 'চিকিৎসক ও কনসালটেন্ট' : 'Consultant Physician';
      }

      // Doctor name MUST explicitly have Dr. or Doctor followed by a legitimate name
      // NEVER accept OCR noise lines like "MS gt BA Crt, xt BE a"
      const drMatch = line.match(/\b(?:Dr\.?|Doctor)\s+([A-Z][a-zA-Z\.\s]{2,30})/i);
      if (drMatch && !extractedDoctorName) {
        const candidate = drMatch[0].trim();
        const afterPrefix = candidate.replace(/^(?:Dr\.?|Doctor)\s+/i, '').trim();
        const candidateWords = afterPrefix.split(/[\s,.:]+/).filter((w) => w.length > 0);
        // Valid doctor name has at least 1 word with >= 3 characters (e.g. "Dr. Roy", "Dr. S. K. Roy")
        const hasValidWord = candidateWords.some((w) => w.length >= 3 && /^[A-Za-z]+$/.test(w));
        const hasOnlyShortFragments = candidateWords.every((w) => w.length <= 2);
        if (hasValidWord && !hasOnlyShortFragments) {
          extractedDoctorName = candidate;
        }
      }
    }

    if (!extractedDoctorName) {
      extractedDoctorName = isBengali ? 'চিকিৎসক (প্রেসক্রিপশন অনুযায়ী)' : 'Doctor (From Prescription)';
    }
    if (!extractedSpecialty) {
      extractedSpecialty = isBengali ? 'প্রেসক্রিপশন অনুযায়ী চিকিৎসা' : 'Clinical Consultation';
    }

    // 2. Hospital / Clinical Facility Extraction
    let extractedHospitalName = '';
    for (let i = 0; i < Math.min(6, lines.length); i++) {
      const line = lines[i];
      const words = line.split(/[\s,.:]+/).filter((w) => w.length > 0);
      const shortWordCount = words.filter((w) => w.length <= 2).length;
      const isNoise = words.length > 0 && shortWordCount > words.length * 0.45;

      if (
        /Hospital|Clinic|Centre|Center|Care|Health|Institute|Dispensary|Nursing\s*Home|Chamber/i.test(line) &&
        !/Dr\.|Doctor/i.test(line) &&
        !isNoise &&
        line.length >= 5
      ) {
        extractedHospitalName = line.replace(/^[=\-—\s:.]+/g, '').trim();
        break;
      }
    }
    if (!extractedHospitalName) {
      extractedHospitalName = isBengali ? 'চিকিৎসা প্রতিষ্ঠান' : 'Medical Health Facility';
    }

    // 3. Contact Phone Numbers Extraction (Only genuine numbers with keywords or 10-digit mobile)
    const extractedPhones: ContactPhone[] = [];
    for (const line of lines) {
      const hasPhoneKeyword = /Phone|Ph|Tel|Mobile|Call|Contact|Helpline|Booking/i.test(line);
      const mobileMatch = line.match(/(?:\+?91[\-\s]?)?[6-9]\d{9}/);
      const landlineMatch = line.match(/\b0\d{2,4}[\-\s]?\d{6,8}\b/);

      if (mobileMatch) {
        const phoneClean = mobileMatch[0].trim();
        if (!extractedPhones.some((p) => p.number === phoneClean)) {
          extractedPhones.push({
            number: phoneClean,
            type: /Emergency|24x7|ICU|Casualty/i.test(line) ? 'emergency' : 'booking',
            label: /Emergency|24x7/i.test(line)
              ? (isBengali ? 'জরুরি হেল্পলাইন' : 'Emergency Helpline')
              : (isBengali ? 'চেম্বার অ্যাপয়েন্টমেন্ট' : 'Appointment Desk'),
          });
        }
      } else if (hasPhoneKeyword && landlineMatch) {
        const phoneClean = landlineMatch[0].trim();
        if (!extractedPhones.some((p) => p.number === phoneClean)) {
          extractedPhones.push({
            number: phoneClean,
            type: 'booking',
            label: isBengali ? 'যোগাযোগ নম্বর' : 'Contact Phone',
          });
        }
      }
    }

    // 4. Patient Name Extraction
    let extractedPatientName = patientNameFallback || '';
    for (const line of lines) {
      const ptMatch = line.match(/(?:Patient\s*Name|Pt\.?\s*Name|Patient|Pt)[\s:=]+([A-Za-z\s]{3,30})(?:\s+Age|\s+Date|\s+Sex|\s+BP|\s+Y\/M|$)/i);
      if (ptMatch) {
        const candidate = ptMatch[1].trim();
        const words = candidate.split(/\s+/);
        if (words.every((w) => w.length >= 2) && candidate.length >= 3) {
          extractedPatientName = candidate;
          break;
        }
      }
    }

    // 5. Date Extraction (DO NOT fake today's date if not found!)
    let extractedDate = '';
    for (const line of lines) {
      const dateMatch = line.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
      if (dateMatch) {
        extractedDate = dateMatch[1];
        break;
      }
    }

    // 6. Medication Entities Parsing
    const extractedMedicines: Medication[] = [];

    // Helper to find catalog definition with fuzzy and abbreviation matching
    const findInCatalog = (str: string): { def: ClinicalMedDef; matchedAlias?: string } | null => {
      const cleanedTokens = str
        .split(/[\s,.:;+\-\/]+/)
        .filter((w) => w.length >= 3 && !/^(tab|cap|syr|inj|drops|mg|mcg|gm|ml|day|days|od|bd|tds|qid|hs|sos)$/i.test(w));

      for (const token of cleanedTokens) {
        for (const def of Object.values(CLINICAL_CATALOG)) {
          for (const alias of def.aliases) {
            if (matchFuzzyWord(token, alias)) {
              return { def, matchedAlias: alias };
            }
          }
        }
      }

      const lowerStr = str.toLowerCase();
      for (const def of Object.values(CLINICAL_CATALOG)) {
        for (const alias of def.aliases) {
          if (lowerStr.includes(alias.toLowerCase())) {
            return { def, matchedAlias: alias };
          }
        }
      }

      return null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const combined = `${line} ${nextLine}`;

      const catMatch = findInCatalog(combined);
      const isMedLine = 
        Boolean(catMatch) ||
        /\b(Tab|Tablet|Cap|Capsule|Syr|Syrup|Inj|Injection|Drops|Ointment)\b/i.test(line) ||
        /\b\d+\s*(mg|mcg|gm|g|ml)\b/i.test(line);

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
        const medNameClean = line.replace(/^[=\-—\d.:\s]+/, '').replace(/\b(Tab|Cap|Syr|Inj)\b\.?/gi, '').trim();

        if (catMatch) {
          const cat = catMatch.def;
          const displayMedName = catMatch.matchedAlias && catMatch.matchedAlias.length >= 4
            ? catMatch.matchedAlias.charAt(0).toUpperCase() + catMatch.matchedAlias.slice(1)
            : cat.name;

          // Avoid duplicate entry
          if (!extractedMedicines.some((m) => m.name.toLowerCase() === displayMedName.toLowerCase() || m.name.toLowerCase() === cat.name.toLowerCase())) {
            extractedMedicines.push({
              id: 'med-' + Math.random().toString(36).substring(2, 9),
              name: isBengali && cat.name === 'Paracetamol' ? 'প্যারাসিটামল' : displayMedName,
              shortName: `${form === 'capsule' ? 'Cap.' : 'Tab.'} ${displayMedName} ${dosage || cat.defaultDosage}`,
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
        } else if (medNameClean.length >= 4) {
          // General uncatalogued medicine: verify it is NOT noise or patient/doctor metadata
          const isMetadataWord = /^(Patient|Doctor|Hospital|Clinic|Address|Phone|Booking|Date|Signature|Years|Male|Female|Weight|Blood)$/i.test(medNameClean);
          const hasRealLetters = /^[A-Za-z\s\-]+$/.test(medNameClean) && medNameClean.split(/\s+/).some((w) => w.length >= 4);
          if (!isMetadataWord && hasRealLetters) {
            const cleanDisplayName = medNameClean.split(/[-—(]/)[0].trim();
            if (!extractedMedicines.some((m) => m.name.toLowerCase() === cleanDisplayName.toLowerCase())) {
              extractedMedicines.push({
                id: 'med-' + Math.random().toString(36).substring(2, 9),
                name: cleanDisplayName,
                shortName: `${form === 'capsule' ? 'Cap.' : 'Tab.'} ${cleanDisplayName} ${dosage || '1 tab'}`,
                fullForm: `${cleanDisplayName} ${dosage || '1 tab'}`.trim(),
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
    }

    // 7. Diagnostic Tests Extraction (Strict matching: only multi-word tests or explicit lab context)
    const extractedDiagnosticTests: DiagnosticTest[] = [];
    for (const line of lines) {
      const isTestContext = /Test|Lab|Investigation|Advised|Report|Profile|Panel/i.test(line);
      const multiWordTestMatch = line.match(/\b(Lipid\s*Profile|Blood\s*Sugar|Complete\s*Blood\s*Count|Liver\s*Function\s*Test|Kidney\s*Function\s*Test|Thyroid\s*Profile|Urine\s*R\/E|Chest\s*X-Ray|ECG\s*12\s*Lead)\b/i);

      if (multiWordTestMatch) {
        const name = multiWordTestMatch[0];
        extractedDiagnosticTests.push({
          id: 'test-user-' + Math.random().toString(36).substring(2, 7),
          prescriptionId: uniqueRxId,
          testName: name,
          category: /Urine/i.test(name) ? 'urine' : /ECG|X-Ray/i.test(name) ? 'imaging' : 'blood',
          instructions: isBengali ? 'ল্যাবরেটরি থেকে পরীক্ষা করান' : 'Complete at clinical laboratory',
          status: 'pending',
        });
      } else if (isTestContext) {
        const abbrevMatch = line.match(/\b(CBC|HbA1c|FBS|PPBS|Creatinine|Urea|ECG)\b/i);
        if (abbrevMatch) {
          const name = abbrevMatch[0];
          extractedDiagnosticTests.push({
            id: 'test-user-' + Math.random().toString(36).substring(2, 7),
            prescriptionId: uniqueRxId,
            testName: name,
            category: /ECG/i.test(name) ? 'imaging' : 'blood',
            instructions: isBengali ? 'ল্যাবরেটরি থেকে পরীক্ষা করান' : 'Complete at clinical laboratory',
            status: 'pending',
          });
        }
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
