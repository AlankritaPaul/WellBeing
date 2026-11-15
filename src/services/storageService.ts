import type { ScannedPrescription, DiagnosticTest, DoseLogEntry } from '../types/prescription';

// Local-First Device Storage Service
// Zero account, zero email, zero phone number, 100% device persistence

const STORAGE_KEYS = {
  LANGUAGE: 'wellbeing_language',
  USER_NAME: 'wellbeing_user_name',
  ONBOARDING_STEP: 'wellbeing_onboarding_step',
  PRESCRIPTIONS: 'wellbeing_prescriptions',
  ACTIVE_ACCOUNT_ID: 'wellbeing_active_account_id',
  DOSE_LOGS: 'wellbeing_dose_logs',
  THEME: 'wellbeing_theme',
};

// Generates a canonical account key for medical deduplication.
// Real-world rule:
// A user can consult multiple doctors at the same hospital or clinic
// (e.g. Dr. S. K. Roy [Medicine] vs Dr. P. K. Banerjee [Orthopedics] at City Care Hospital).
// In that case, each doctor is a distinct medical account.
// However, the EXACT SAME doctor in the SAME hospital with the same prescription
// must NEVER be duplicated!
function getPrescriptionAccountKey(p: ScannedPrescription): string {
  const normDoc = (p.doctorName || '').trim().toLowerCase();
  const normHosp = (p.hospitalName || '').trim().toLowerCase();
  const id = (p.id || '').toLowerCase();

  // Canonical key for Sample 1: City Care Hospital & Dr. S. K. Roy (across all languages and historical IDs)
  if (
    id.includes('citycare') ||
    id.includes('drskroy') ||
    ((normDoc.includes('s. k. roy') || normDoc.includes('রায়') || normDoc.includes('roy')) &&
     (normHosp.includes('city care') || normHosp.includes('সিটি কেয়ার')))
  ) {
    return 'rx_sample_citycare_drskroy';
  }

  // Canonical key for Sample 2: Apex Heart & Dr. Anirban Roy (across all languages and historical IDs)
  if (
    id.includes('cardio') ||
    id.includes('apex') ||
    id.includes('anirban') ||
    ((normDoc.includes('anirban') || normDoc.includes('অনির্বাণ')) &&
     (normHosp.includes('apex') || normHosp.includes('অ্যাপেক্স')))
  ) {
    return 'rx_sample_apex_dranirbanroy';
  }

  // General medical identity key: Doctor Name + Hospital Name
  return `${normDoc.replace(/\s+/g, ' ')}__${normHosp.replace(/\s+/g, ' ')}`;
}

// Resolves the true prescription image for any record.
// 1. For sample prescriptions (Apex Heart, City Care), strictly resolves to the authentic paper prescription document!
//    This prevents ANY historical cache or hand-holding-phone photo from ever appearing.
// 2. If the user clicked/uploaded their own photo (data:image URL) with the camera, that exact photo is strictly preserved.
export function resolvePrescriptionImageUrl(p: ScannedPrescription | null | undefined): string {
  if (!p) return '';
  const id = (p.id || '').toLowerCase();
  const doc = (p.doctorName || '').toLowerCase();
  const hosp = (p.hospitalName || '').toLowerCase();
  const url = p.imageDataUrl || '';

  // Sample 2: Apex Heart & Diabetes Institute (Dr. Anirban Roy)
  // ALWAYS return official paper prescription document!
  if (
    id.includes('apex') ||
    id.includes('cardio') ||
    doc.includes('anirban') ||
    doc.includes('অনির্বাণ') ||
    hosp.includes('apex') ||
    hosp.includes('অ্যাপেক্স')
  ) {
    return '/images/prescription_apex.jpg';
  }

  // Sample 1: City Care Hospital & Medical Research Centre (Dr. S. K. Roy)
  // ALWAYS return official paper prescription document!
  if (
    id.includes('citycare') ||
    id.includes('drskroy') ||
    doc.includes('s. k. roy') ||
    doc.includes('রায়') ||
    doc.includes('roy') ||
    hosp.includes('city care') ||
    hosp.includes('সিটি কেয়ার')
  ) {
    return '/images/prescription_citycare.jpg';
  }

  // Real user photo taken via camera or uploaded: strictly preserve!
  if (url.startsWith('data:image')) {
    return url;
  }

  return url || '/images/prescription_citycare.jpg';
}

export const storageService = {
  getLanguage(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
    } catch {
      return 'en';
    }
  },

  setLanguage(code: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, code);
      // Dispatch custom event for real-time reactive sync across components
      window.dispatchEvent(new CustomEvent('wellbeing_language_changed', { detail: code }));
    } catch (e) {
      console.warn('LocalStorage unavailable in local-first environment:', e);
    }
  },

  getUserName(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
    } catch {
      return '';
    }
  },

  setUserName(name: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
      window.dispatchEvent(new CustomEvent('wellbeing_name_changed', { detail: name }));
    } catch (e) {
      console.warn('LocalStorage unavailable in local-first environment:', e);
    }
  },

  getOnboardingStep(): number {
    try {
      const step = localStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP);
      return step ? parseInt(step, 10) : 1;
    } catch {
      return 1;
    }
  },

  setOnboardingStep(step: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, step.toString());
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  },

  getPrescriptions(): ScannedPrescription[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
      if (!data) return [];
      const list: ScannedPrescription[] = JSON.parse(data);

      // Strict Medical Deduplication:
      // A patient can consult multiple different doctors in the same hospital.
      // But the SAME doctor in the SAME hospital with the same medication regimen is a single account!
      const uniqueMap = new Map<string, ScannedPrescription>();

      for (const rawP of list) {
        let p: ScannedPrescription = {
          ...rawP,
          imageDataUrl: resolvePrescriptionImageUrl(rawP),
        };
        const key = getPrescriptionAccountKey(p);

        // Ensure diagnostic tests exist for existing accounts
        if (!p.diagnosticTests || p.diagnosticTests.length === 0) {
          if (key === 'rx_sample_citycare_drskroy') {
            p.diagnosticTests = [
              {
                id: 'test-citycare-1',
                prescriptionId: p.id,
                testName: 'Complete Blood Count (CBC / Hemogram)',
                category: 'blood',
                instructions: 'Routine blood test to evaluate infection and cellular parameters.',
                status: 'completed',
                completedDate: p.date,
                resultSummary: 'Normal (Hb: 13.8 g/dL, TLC: 7,400)',
              },
              {
                id: 'test-citycare-2',
                prescriptionId: p.id,
                testName: 'Fasting Blood Sugar (FBS / Glucose)',
                category: 'blood',
                instructions: '8-10 hours overnight fasting required before morning blood sample collection.',
                status: 'pending',
              },
              {
                id: 'test-citycare-3',
                prescriptionId: p.id,
                testName: 'Routine Urine Examination (Urine R/E)',
                category: 'urine',
                instructions: 'Collect the first morning clean-catch midstream urine sample in a sterile container.',
                status: 'pending',
              }
            ];
          } else if (key === 'rx_sample_apex_dranirbanroy') {
            p.diagnosticTests = [
              {
                id: 'test-apex-1',
                prescriptionId: p.id,
                testName: 'Lipid Profile (Complete Cholesterol Panel)',
                category: 'blood',
                instructions: '10-12 hours overnight fasting required (plain water allowed). No breakfast or tea before sample.',
                status: 'pending',
              },
              {
                id: 'test-apex-2',
                prescriptionId: p.id,
                testName: 'HbA1c (Glycated Hemoglobin - 3 Months Average)',
                category: 'blood',
                instructions: 'Can be done at any time of day; fasting is not required.',
                status: 'pending',
              },
              {
                id: 'test-apex-3',
                prescriptionId: p.id,
                testName: 'Serum Creatinine & Urea (Renal Function)',
                category: 'blood',
                instructions: 'Normal morning blood sample. Avoid excessive protein intake prior to test.',
                status: 'pending',
              }
            ];
          }
        }

        // Initialize pill stock inventory if missing
        if (p.medicines && p.medicines.length > 0) {
          p.medicines = p.medicines.map((m, mIdx) => {
            if (m.remainingQuantity !== undefined && m.totalQuantity !== undefined) {
              return m;
            }
            const lowStockIndices = key === 'rx_sample_citycare_drskroy' ? [1, 3] : [1, 2];
            const isLow = lowStockIndices.includes(mIdx);
            return {
              ...m,
              totalQuantity: m.totalQuantity || (m.form === 'capsule' ? 14 : 30),
              remainingQuantity: m.remainingQuantity !== undefined ? m.remainingQuantity : (isLow ? 2 : 16),
              refillThresholdDays: m.refillThresholdDays || 3,
            };
          });
        }

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, p);
        } else {
          // If a duplicate was created, retain the latest updated one
          const existing = uniqueMap.get(key)!;
          if ((p.scannedAt || 0) >= (existing.scannedAt || 0)) {
            uniqueMap.set(key, { ...p, id: existing.id || p.id });
          }
        }
      }

      const deduplicated = Array.from(uniqueMap.values());
      // Always synchronize sanitized and resolved records to local storage immediately!
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(deduplicated));
      return deduplicated;
    } catch {
      return [];
    }
  },

  savePrescription(rawPrescription: ScannedPrescription): void {
    try {
      const current = this.getPrescriptions();
      let prescription = {
        ...rawPrescription,
        imageDataUrl: resolvePrescriptionImageUrl(rawPrescription),
      };
      const incomingKey = getPrescriptionAccountKey(prescription);

      // Check if an account for this specific doctor and hospital already exists
      const existingIndex = current.findIndex((p) => {
        return p.id === prescription.id || getPrescriptionAccountKey(p) === incomingKey;
      });

      let updated: ScannedPrescription[];
      if (existingIndex >= 0) {
        // Update existing doctor's account in place (preserving account ID) — NEVER DUPLICATE!
        const existingId = current[existingIndex].id;
        updated = current.map((p, idx) => 
          idx === existingIndex ? { ...prescription, id: existingId, scannedAt: Date.now() } : p
        );
      } else {
        // Add as a genuinely new doctor account
        updated = [prescription, ...current];
      }

      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wellbeing_prescriptions_changed', { detail: updated }));
    } catch (e) {
      console.warn('Could not save prescription to device storage:', e);
    }
  },

  deletePrescription(id: string): void {
    this.deletePrescriptions([id]);
  },

  deletePrescriptions(ids: string[]): void {
    try {
      const idSet = new Set(ids);
      const current = this.getPrescriptions();
      const updated = current.filter((p) => !idSet.has(p.id));
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      
      // Clean associated dose logs
      try {
        const logs = this.getDoseLogs();
        const updatedLogs = logs.filter((l) => !idSet.has(l.prescriptionId));
        localStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(updatedLogs));
        window.dispatchEvent(new CustomEvent('wellbeing_dose_logs_changed', { detail: updatedLogs }));
      } catch (e) {
        console.warn('Could not clean dose logs on delete:', e);
      }

      // If active account was deleted, reset active selection
      const activeId = this.getActiveAccountId();
      if (activeId && idSet.has(activeId)) {
        this.setActiveAccountId(null);
      }

      window.dispatchEvent(new CustomEvent('wellbeing_prescriptions_changed', { detail: updated }));
    } catch (e) {
      console.warn('Could not delete prescriptions:', e);
    }
  },

  getTheme(): 'dark' | 'light' {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  },

  setTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      window.dispatchEvent(new CustomEvent('wellbeing_theme_changed', { detail: theme }));
    } catch (e) {
      console.warn('Could not set theme:', e);
    }
  },

  updateDiagnosticTestStatus(
    prescriptionId: string, 
    testId: string, 
    status: 'pending' | 'completed',
    completedDate?: string,
    resultSummary?: string
  ): void {
    try {
      const current = this.getPrescriptions();
      const updated = current.map((p) => {
        if (p.id !== prescriptionId) return p;
        const tests = (p.diagnosticTests || []).map((t) => {
          if (t.id !== testId) return t;
          return {
            ...t,
            status,
            completedDate: status === 'completed' ? (completedDate || new Date().toLocaleDateString('en-GB')) : undefined,
            resultSummary: status === 'completed' ? (resultSummary ?? t.resultSummary) : undefined,
          };
        });
        return { ...p, diagnosticTests: tests };
      });
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wellbeing_prescriptions_changed', { detail: updated }));
    } catch (e) {
      console.warn('Could not update diagnostic test status:', e);
    }
  },

  addDiagnosticTest(
    prescriptionId: string, 
    newTest: Omit<DiagnosticTest, 'id' | 'prescriptionId'>
  ): void {
    try {
      const current = this.getPrescriptions();
      const testId = 'test-' + Math.random().toString(36).substring(2, 9);
      const testObj: DiagnosticTest = {
        ...newTest,
        id: testId,
        prescriptionId,
      };

      const updated = current.map((p) => {
        if (p.id !== prescriptionId) return p;
        return {
          ...p,
          diagnosticTests: [...(p.diagnosticTests || []), testObj],
        };
      });
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wellbeing_prescriptions_changed', { detail: updated }));
    } catch (e) {
      console.warn('Could not add diagnostic test:', e);
    }
  },

  deleteDiagnosticTest(prescriptionId: string, testId: string): void {
    try {
      const current = this.getPrescriptions();
      const updated = current.map((p) => {
        if (p.id !== prescriptionId) return p;
        return {
          ...p,
          diagnosticTests: (p.diagnosticTests || []).filter((t) => t.id !== testId),
        };
      });
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wellbeing_prescriptions_changed', { detail: updated }));
    } catch (e) {
      console.warn('Could not delete diagnostic test:', e);
    }
  },

  refillMedication(prescriptionId: string, medicationId: string, addedQuantity: number): void {
    try {
      const current = this.getPrescriptions();
      const todayDate = new Date().toLocaleDateString('en-GB');
      const updated = current.map((p) => {
        if (p.id !== prescriptionId) return p;
        const meds = (p.medicines || []).map((m) => {
          if (m.id !== medicationId) return m;
          const currentRemaining = m.remainingQuantity || 0;
          return {
            ...m,
            remainingQuantity: currentRemaining + addedQuantity,
            lastRefillDate: todayDate,
          };
        });
        return { ...p, medicines: meds };
      });
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wellbeing_prescriptions_changed', { detail: updated }));
    } catch (e) {
      console.warn('Could not refill medication:', e);
    }
  },

  updateMedicationStock(prescriptionId: string, medicationId: string, newRemaining: number): void {
    try {
      const current = this.getPrescriptions();
      const updated = current.map((p) => {
        if (p.id !== prescriptionId) return p;
        const meds = (p.medicines || []).map((m) => {
          if (m.id !== medicationId) return m;
          return {
            ...m,
            remainingQuantity: Math.max(0, newRemaining),
          };
        });
        return { ...p, medicines: meds };
      });
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wellbeing_prescriptions_changed', { detail: updated }));
    } catch (e) {
      console.warn('Could not update medication stock:', e);
    }
  },

  getDoseLogs(): DoseLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOSE_LOGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  logDoseAction(entry: Omit<DoseLogEntry, 'id'>): void {
    try {
      const currentLogs = this.getDoseLogs();
      const newEntry: DoseLogEntry = {
        ...entry,
        id: 'log-' + Math.random().toString(36).substring(2, 9),
        actionTimestamp: Date.now(),
      };
      
      // If taken, decrement medication remaining quantity by 1
      if (entry.status === 'taken') {
        const prescriptions = this.getPrescriptions();
        const targetPrescription = prescriptions.find((p) => p.id === entry.prescriptionId);
        const targetMed = targetPrescription?.medicines?.find((m) => m.id === entry.medicationId);
        if (targetMed && (targetMed.remainingQuantity || 0) > 0) {
          this.updateMedicationStock(
            entry.prescriptionId, 
            entry.medicationId, 
            (targetMed.remainingQuantity || 0) - 1
          );
        }
      }

      // Check if entry for this date, prescription, med and timeSlot already exists
      const existingIdx = currentLogs.findIndex(
        (l) => l.date === entry.date && l.medicationId === entry.medicationId && l.timeSlot === entry.timeSlot
      );

      let updatedLogs: DoseLogEntry[];
      if (existingIdx >= 0) {
        updatedLogs = currentLogs.map((l, idx) => (idx === existingIdx ? newEntry : l));
      } else {
        updatedLogs = [newEntry, ...currentLogs];
      }

      localStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(updatedLogs));
      window.dispatchEvent(new CustomEvent('wellbeing_dose_logs_changed', { detail: updatedLogs }));
    } catch (e) {
      console.warn('Could not log dose action:', e);
    }
  },

  getActiveAccountId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
    } catch {
      return null;
    }
  },

  setActiveAccountId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
      }
      window.dispatchEvent(new CustomEvent('wellbeing_active_account_changed', { detail: id }));
    } catch (e) {
      console.warn('Could not set active account id:', e);
    }
  },

  hasCompletedOnboarding(): boolean {
    try {
      const prescriptions = this.getPrescriptions();
      return prescriptions.length > 0;
    } catch {
      return false;
    }
  },

  clearAllData(): void {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.warn('Clear data failed:', e);
    }
  }
};
