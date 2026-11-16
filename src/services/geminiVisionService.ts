import type { ScannedPrescription, Medication, ContactPhone, DiagnosticTest } from '../types/prescription';
import { storageService } from './storageService';

export interface GeminiAnalysisResult {
  hospitalName: string;
  doctorName: string;
  doctorSpecialty: string;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  date: string;
  recheckInterval: string;
  medicines: Array<{
    name: string;
    generic?: string;
    dosage: string;
    form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'drops' | 'cream';
    frequency: string;
    timing: 'before_food' | 'after_food' | 'with_food' | 'as_needed';
    duration: string;
    purpose: string;
    whyPrescribed: string;
    instructions?: string;
  }>;
  phoneNumbers?: Array<{
    number: string;
    type: 'booking' | 'emergency';
    label: string;
  }>;
  diagnosticTests?: Array<{
    testName: string;
    category: 'blood' | 'urine' | 'imaging' | 'cardiac';
    instructions?: string;
  }>;
  allergies?: string[];
  notes?: string;
}

export const geminiVisionService = {
  isConfigured(): boolean {
    const key = storageService.getGeminiApiKey();
    return Boolean(key && key.trim().length > 10);
  },

  async analyzePrescription(
    imageDataUrl: string,
    languageCode: string = 'en',
    userPreferredName?: string
  ): Promise<ScannedPrescription> {
    const apiKey = storageService.getGeminiApiKey();
    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    // Extract base64 and mime type from dataUrl
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('INVALID_IMAGE_FORMAT');
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const isBengali = languageCode === 'bn';
    const targetLangName = isBengali ? 'Bengali (বাংলা)' : 'English';

    const prompt = `You are a licensed Senior Clinical Pharmacist and Medical Transcription AI with expertise in deciphering messy, handwritten, and cursive Indian doctor prescriptions.

Analyze the uploaded prescription photo with extreme medical care, visual diligence, and pharmacology knowledge.

CRITICAL INSTRUCTIONS:
1. DOCTOR DETAILS:
   - Decipher the doctor's name, qualifications (e.g. MBBS, MD, MS, DNB), and clinical specialty.
   - If not found or ambiguous, use "Doctor (From Prescription)".

2. HOSPITAL / CLINIC:
   - Decipher the hospital, nursing home, or clinic letterhead name and address.
   - If not found, use "Medical Clinic".

3. PATIENT DETAILS:
   - Decipher the patient name, age, and sex if written on the paper.
   - If not written, leave patientName as empty string "". Do NOT invent a fake patient name.

4. VISIT DATE:
   - Decipher the exact consultation date written on the prescription paper (e.g., "12/10/2026").
   - If no date is written on the document, return an empty string "". Do NOT guess or use today's date.

5. PRESCRIBED MEDICINES (Decipher messy cursive handwriting):
   - Closely inspect every handwritten drug line.
   - Cross-reference cursive stroke shapes with known medical drug databases (e.g., Augmentin, Pantocid/Pantoprazole, Paracetamol/Calpol, Azithromycin/Azee, Metformin, Telmisartan, Montair-LC, Cetirizine, etc.).
   - Extract exact dosage (e.g., "625 mg", "40 mg", "500 mg", "1 tab").
   - Extract form ("tablet", "capsule", "syrup", "injection", "drops", "cream").
   - Extract exact frequency: convert shorthand like "1-0-1", "1-0-0", "0-0-1", "1-1-1", "TDS", "BD", "OD", "HS", "SOS" to standard "1-0-1" format.
   - Extract timing: "before_food" (if marked before meal, ac, empty stomach) or "after_food" (pc, after meal).
   - Extract duration: e.g. "5 days", "10 days".
   - Provide clear, simple purpose explaining what this medicine treats in ${targetLangName}.
   - CRITICAL SAFETY: Never hallucinate or invent drugs not written by the doctor.

6. TESTS / LAB INVESTIGATIONS:
   - Only include lab tests (e.g., CBC, Lipid Profile, Sugar) if EXPLICITLY ordered under tests/investigations on the paper. Do NOT invent tests. If none are ordered, return an empty array [].

7. CONTACT PHONE:
   - Only include phone numbers explicitly written on the paper. If none, return [].

OUTPUT FORMAT:
Return strictly a valid JSON object matching this schema (do not wrap in markdown or prose):
{
  "hospitalName": "string",
  "doctorName": "string",
  "doctorSpecialty": "string",
  "patientName": "string",
  "patientAge": "string",
  "patientGender": "string",
  "date": "string",
  "recheckInterval": "string",
  "medicines": [
    {
      "name": "string",
      "generic": "string",
      "dosage": "string",
      "form": "tablet",
      "frequency": "1-0-1",
      "timing": "after_food",
      "duration": "5 days",
      "purpose": "string",
      "whyPrescribed": "string",
      "instructions": "string"
    }
  ],
  "phoneNumbers": [
    {
      "number": "string",
      "type": "booking",
      "label": "string"
    }
  ],
  "diagnosticTests": [
    {
      "testName": "string",
      "category": "blood",
      "instructions": "string"
    }
  ],
  "allergies": [],
  "notes": "string"
}`;

    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    let lastError: Error | null = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: 'application/json',
                temperature: 0.1,
              },
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${response.status}`;
          throw new Error(`Gemini API Error (${modelName}): ${errMsg}`);
        }

        const data = await response.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) {
          throw new Error('Empty response from Gemini Vision');
        }

        const parsed: GeminiAnalysisResult = JSON.parse(rawJsonText);
        const uniqueRxId = 'rx-ai-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

        const mappedMedicines: Medication[] = (parsed.medicines || []).map((m) => ({
          id: 'med-' + Math.random().toString(36).substring(2, 9),
          name: m.name || 'Medication',
          shortName: `${m.form === 'capsule' ? 'Cap.' : 'Tab.'} ${m.name}`,
          fullForm: m.generic ? `${m.name} (${m.generic})` : m.name,
          purpose: m.purpose || (isBengali ? 'প্রেসক্রিপশন অনুযায়ী চিকিৎসা' : 'Clinical Treatment'),
          whyPrescribed: m.whyPrescribed || (isBengali ? 'ডাক্তারের নির্দেশিত ওষুধ' : 'Doctor prescribed medication'),
          howItWorks: isBengali ? 'শারীরিক উপসর্গ নিয়ন্ত্রণ করে' : 'Regulates physiological symptoms',
          dosage: m.dosage || '1 tab',
          form: m.form || 'tablet',
          frequency: m.frequency || '1-0-1',
          timing: m.timing || 'after_food',
          duration: m.duration || (isBengali ? '৫ দিন' : '5 days'),
          instructions: m.instructions || (m.timing === 'before_food' 
            ? (isBengali ? 'খাবারের পূর্বে সেব্য' : 'Take before food')
            : (isBengali ? 'খাবারের পর সেব্য' : 'Take after food')),
        }));

        const mappedPhones: ContactPhone[] = (parsed.phoneNumbers || []).map((p) => ({
          number: p.number,
          type: p.type || 'booking',
          label: p.label || (isBengali ? 'যোগাযোগ নম্বর' : 'Contact Phone'),
        }));

        const mappedTests: DiagnosticTest[] = (parsed.diagnosticTests || []).map((t) => ({
          id: 'test-ai-' + Math.random().toString(36).substring(2, 7),
          prescriptionId: uniqueRxId,
          testName: t.testName,
          category: t.category || 'blood',
          instructions: t.instructions || (isBengali ? 'ল্যাবরেটরি থেকে পরীক্ষা করান' : 'Complete at clinical laboratory'),
          status: 'pending',
        }));

        return {
          id: uniqueRxId,
          imageDataUrl: imageDataUrl, // Strictly preserve authentic user photo
          hospitalName: parsed.hospitalName || (isBengali ? 'চিকিৎসা প্রতিষ্ঠান' : 'Medical Health Facility'),
          doctorName: parsed.doctorName || (isBengali ? 'চিকিৎসক (প্রেসক্রিপশন অনুযায়ী)' : 'Doctor (From Prescription)'),
          doctorSpecialty: parsed.doctorSpecialty || (isBengali ? 'ক্লিনিক্যাল পরামর্শ' : 'Clinical Consultation'),
          patientName: parsed.patientName || userPreferredName || '',
          date: parsed.date || '',
          recheckInterval: parsed.recheckInterval || (isBengali ? 'ডাক্তারের পরামর্শ অনুযায়ী' : 'As advised by doctor'),
          medicines: mappedMedicines,
          phoneNumbers: mappedPhones,
          diagnosticTests: mappedTests,
          allergies: parsed.allergies || [],
          notes: parsed.notes || '',
          scannedAt: Date.now(),
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Failed with model ${modelName}, trying fallback...`, err);
      }
    }

    throw lastError || new Error('Failed to analyze prescription with Gemini Vision');
  },
};
