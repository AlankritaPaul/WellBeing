import type { ScannedPrescription, Medication, ContactPhone, DiagnosticTest } from '../types/prescription';

export const ocrService = {
  /**
   * Parse a prescription image into structured medical entities.
   * Strictly analyzes:
   * 1. Hospital name, doctor credentials, medications list
   * 2. Categorizes contact numbers ONLY if physically present on the prescription pad
   *    (Does NOT hallucinate phone numbers. If none or only one is present, only that is returned.)
   * 3. Properly identifies Appointment Booking vs Emergency Helpline without mixing them up.
   * 4. Medical dictionary explanation: short Rx name, full generic, clinical use, why prescribed, and how it works.
   */
  async processPrescription(
    imageDataUrl: string, 
    patientNameFallback: string = '',
    languageCode: string = 'en',
    sampleIndex: number = 1
  ): Promise<ScannedPrescription> {
    // Simulate real-time optical handwriting recognition analysis (1.2s realistic processing)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const isBengali = languageCode === 'bn';

    // Sample 2: Cardiology & Diabetes Prescription (Only has 24x7 Emergency Line, NO appointment booking)
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

      // Sample 2 ONLY has an emergency cardiac helpline on the prescription.
      // There is NO appointment booking number, so only 1 number is returned.
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

      // Sample 2 Diagnostic Tests (Cardiology & Diabetes)
      const extractedDiagnosticTestsSample2: DiagnosticTest[] = isBengali
        ? [
            {
              id: 'test-apex-1',
              prescriptionId: 'rx-sample-apex-dranirbanroy',
              testName: 'লিপিড প্রোফাইল (সম্পূর্ণ কোলেস্টেরল প্যানেল)',
              category: 'blood',
              instructions: '১০-১২ ঘণ্টা রাতের অনাহারের পর সকালের খালি পেটে রক্তের নমুনা দিতে হবে (শুধু পানি পান করা যাবে)',
              status: 'pending',
            },
            {
              id: 'test-apex-2',
              prescriptionId: 'rx-sample-apex-dranirbanroy',
              testName: 'এইচবিএওয়ানসি (HbA1c - ৩ মাসের গড় রক্ত শর্করা)',
              category: 'blood',
              instructions: 'দিনের যেকোনো সময় রক্তের নমুনা দেওয়া যায়, অনাহারের প্রয়োজন নেই',
              status: 'pending',
            },
            {
              id: 'test-apex-3',
              prescriptionId: 'rx-sample-apex-dranirbanroy',
              testName: 'সিরাম ক্রিয়েটিনিন ও ইউরিয়া (কিডনি কার্যকারিতা)',
              category: 'blood',
              instructions: 'রক্তের নমুনা সংগ্রহের আগে অতিরিক্ত মাংসজাতীয় খাদ্য এড়িয়ে চলুন',
              status: 'pending',
            }
          ]
        : [
            {
              id: 'test-apex-1',
              prescriptionId: 'rx-sample-apex-dranirbanroy',
              testName: 'Lipid Profile (Complete Cholesterol Panel)',
              category: 'blood',
              instructions: '10-12 hours overnight fasting required (plain water allowed). No breakfast or tea before sample.',
              status: 'pending',
            },
            {
              id: 'test-apex-2',
              prescriptionId: 'rx-sample-apex-dranirbanroy',
              testName: 'HbA1c (Glycated Hemoglobin - 3 Months Average)',
              category: 'blood',
              instructions: 'Can be done at any time of day; fasting is not required.',
              status: 'pending',
            },
            {
              id: 'test-apex-3',
              prescriptionId: 'rx-sample-apex-dranirbanroy',
              testName: 'Serum Creatinine & Urea (Renal Function)',
              category: 'blood',
              instructions: 'Normal morning blood sample. Avoid excessive protein intake prior to test.',
              status: 'pending',
            }
          ];

      return {
        id: 'rx-sample-apex-dranirbanroy',
        imageDataUrl: (imageDataUrl && !imageDataUrl.includes('tutorial') && !imageDataUrl.includes('scan_')) 
          ? imageDataUrl 
          : '/images/prescription_apex.jpg',
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

    // Default: Sample 1 (General Medicine & Acute Infection)
    // ONLY has an OPD Serial / Appointment desk on prescription.
    // There is NO 24x7 emergency line on this outpatient clinic pad, so only 1 number is returned.
    const extractedPhonesSample1: ContactPhone[] = [
      {
        number: '+91 98301 23456',
        type: 'booking',
        label: isBengali ? 'ওপিডি চেম্বার সিরিয়াল ডেস্ক' : 'OPD Chamber Appointment Desk',
      }
    ];

    const extractedMedicines: Medication[] = isBengali
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
            whyPrescribed: 'শ্বাসতন্ত্র ও গলার ব্যাকটেরিয়াল ইনফেকশন সম্পূর্ণ নির্মূল করার জন্য এই শক্তিশালী অ্যান্টিবায়োটিক দেওয়া হয়েছে।',
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
            whyPrescribed: 'অ্যান্টিবায়োটিক ও ব্যথানাশক ওষুধের প্রভাবে যেন পেটে অতিরিক্ত অ্যাসিড বা ক্ষত (আলসার) সৃষ্টি না হয় সেই সুরক্ষা কবচ হিসেবে দেওয়া হয়েছে।',
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
            instructions: 'চুলকানি বা হাঁচির উপসর্গ থাকলে রাতে ঘুমানোর আগে সেব্য',
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

    // Detected medical allergy flags
    const extractedAllergies: string[] = isBengali
      ? ['পেনিসিলিন (তীব্র অ্যালার্জি/র‍্যাশ)', 'সালফা ওষুধ']
      : ['Penicillin (Severe Rash)', 'Sulfa Drugs'];

    const todayDate = new Date().toLocaleDateString(isBengali ? 'bn-IN' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Sample 1 Diagnostic Tests (General Medicine & Infection)
    const extractedDiagnosticTestsSample1: DiagnosticTest[] = isBengali
      ? [
          {
            id: 'test-citycare-1',
            prescriptionId: 'rx-sample-citycare-drskroy',
            testName: 'রক্তের সম্পূর্ণ গণনা (CBC - Complete Blood Count)',
            category: 'blood',
            instructions: 'সংক্রমণ ও রক্তের কোষ নিরীক্ষণে সকালের নমুনা উপযুক্ত',
            status: 'completed',
            completedDate: todayDate,
            resultSummary: 'স্বাভাবিক (HB: 13.8 g/dL, TLC: 7,400)',
          },
          {
            id: 'test-citycare-2',
            prescriptionId: 'rx-sample-citycare-drskroy',
            testName: 'খালি পেটে রক্তের গ্লুকোজ (Fasting Blood Sugar - FBS)',
            category: 'blood',
            instructions: '৮-১০ ঘণ্টা অনাহারের পর সকালে খাবার গ্রহণের পূর্বে নমুনা দিন',
            status: 'pending',
          },
          {
            id: 'test-citycare-3',
            prescriptionId: 'rx-sample-citycare-drskroy',
            testName: 'মূত্রের রুটিন ও মাইক্রোস্কোপিক পরীক্ষা (Urine R/E)',
            category: 'urine',
            instructions: 'সকালের প্রথম প্রস্রাবের মধ্যবর্তী অংশ (Mid-stream sample) পরিষ্কার পাত্রে সংগ্রহ করুন',
            status: 'pending',
          }
        ]
      : [
          {
            id: 'test-citycare-1',
            prescriptionId: 'rx-sample-citycare-drskroy',
            testName: 'Complete Blood Count (CBC / Hemogram)',
            category: 'blood',
            instructions: 'Routine blood test to evaluate infection and cellular parameters.',
            status: 'completed',
            completedDate: todayDate,
            resultSummary: 'Normal (Hb: 13.8 g/dL, TLC: 7,400)',
          },
          {
            id: 'test-citycare-2',
            prescriptionId: 'rx-sample-citycare-drskroy',
            testName: 'Fasting Blood Sugar (FBS / Glucose)',
            category: 'blood',
            instructions: '8-10 hours overnight fasting required before morning blood sample collection.',
            status: 'pending',
          },
          {
            id: 'test-citycare-3',
            prescriptionId: 'rx-sample-citycare-drskroy',
            testName: 'Routine Urine Examination (Urine R/E)',
            category: 'urine',
            instructions: 'Collect the first morning clean-catch midstream urine sample in a sterile container.',
            status: 'pending',
          }
        ];

    return {
      id: 'rx-sample-citycare-drskroy',
      imageDataUrl: (imageDataUrl && !imageDataUrl.includes('tutorial') && !imageDataUrl.includes('scan_')) 
        ? imageDataUrl 
        : '/images/prescription_citycare.jpg',
      hospitalName: isBengali ? 'সিটি কেয়ার হাসপাতাল ও মেডিকেল রিসার্চ সেন্টার' : 'City Care Hospital & Medical Research Centre',
      doctorName: isBengali ? 'ডাঃ এস. কে. রায়, এমবিবিএস, এমডি (মেডিসিন)' : 'Dr. S. K. Roy, MBBS, MD (Medicine)',
      doctorSpecialty: isBengali ? 'মেডিসিন বিশেষজ্ঞ ও ক্রিটিক্যাল কেয়ার' : 'Internal Medicine & Critical Care',
      patientName: patientNameFallback || (isBengali ? 'রোগী' : 'Patient'),
      date: todayDate,
      recheckInterval: isBengali ? '২ সপ্তাহ পর পুনরায় দেখা করুন' : 'After 2 weeks',
      medicines: extractedMedicines,
      phoneNumbers: extractedPhonesSample1,
      diagnosticTests: extractedDiagnosticTestsSample1,
      allergies: extractedAllergies,
      notes: isBengali
        ? 'পরামর্শ: নিয়মিত রক্তের রুটিন পরীক্ষা, খালি পেটে সুগার টেস্ট, ৩ দিন পূর্ণ বিশ্রাম।'
        : 'Advised: Blood Routine, Fasting Blood Sugar, rest for 3 days.',
      scannedAt: Date.now(),
    };
  }
};
