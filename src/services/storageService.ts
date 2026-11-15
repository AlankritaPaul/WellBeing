import type { ScannedPrescription } from '../types/prescription';

// Local-First Device Storage Service
// Zero account, zero email, zero phone number, 100% device persistence

const STORAGE_KEYS = {
  LANGUAGE: 'wellbeing_language',
  USER_NAME: 'wellbeing_user_name',
  ONBOARDING_STEP: 'wellbeing_onboarding_step',
  PRESCRIPTIONS: 'wellbeing_prescriptions',
};

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
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePrescription(prescription: ScannedPrescription): void {
    try {
      const current = this.getPrescriptions();
      const updated = [prescription, ...current.filter((p) => p.id !== prescription.id)];
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('wellbeing_prescriptions_changed', { detail: updated }));
    } catch (e) {
      console.warn('Could not save prescription to device storage:', e);
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
