export interface Medication {
  id: string;
  name: string;
  shortName?: string; // e.g. "Tab PCM 650"
  fullForm?: string;  // e.g. "Paracetamol (Acetaminophen) 650 mg"
  purpose?: string;   // What is the use of it e.g. "জ্বর ও তীব্র শরীর ব্যথার উপশম"
  whyPrescribed?: string; // Why given to this patient e.g. "জ্বর ও গা ব্যথা কমানোর জন্য"
  howItWorks?: string;    // How it works e.g. "মস্তিষ্কের তাপ ও ব্যথা সংকেত নিয়ন্ত্রণ করে"
  dosage: string;
  form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'drops' | 'cream';
  frequency: string; // e.g. "1-0-1", "1-0-0", "1-1-1", "0-0-1", "SOS"
  timing: 'before_food' | 'after_food' | 'with_food' | 'as_needed';
  duration: string; // e.g. "5 days", "14 days", "1 month"
  instructions?: string;
  // Page 8: Inventory & Refill Tracking
  totalQuantity?: number;
  remainingQuantity?: number;
  refillThresholdDays?: number;
  lastRefillDate?: string;
}

export interface DoseLogEntry {
  id: string;
  prescriptionId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  scheduledTime: string;
  status: 'taken' | 'delayed' | 'skipped' | 'pending';
  actionTimestamp?: number;
  delayedUntil?: string;
  skipReason?: string;
  notes?: string;
}

export interface ContactPhone {
  number: string;
  type: 'booking' | 'emergency' | 'general';
  label: string;
}

export interface DiagnosticTest {
  id: string;
  prescriptionId: string;
  testName: string;
  category: 'blood' | 'urine' | 'cardiac' | 'imaging' | 'general';
  instructions?: string;
  status: 'pending' | 'completed';
  completedDate?: string;
  resultSummary?: string;
  notes?: string;
}

export interface ScannedPrescription {
  id: string;
  imageDataUrl?: string;
  hospitalName: string;
  doctorName: string;
  doctorSpecialty?: string;
  patientName: string;
  date: string; // Date of visit
  nextAppointmentDate?: string; // e.g. "15 Dec 2024" or "2024-12-15"
  recheckInterval?: string; // e.g. "After 2 weeks", "After 1 month", "After 10 days"
  medicines: Medication[];
  phoneNumbers: ContactPhone[];
  diagnosticTests?: DiagnosticTest[];
  allergies: string[];
  notes?: string;
  scannedAt: number;
}
