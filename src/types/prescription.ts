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
}

export interface ContactPhone {
  number: string;
  type: 'booking' | 'emergency' | 'general';
  label: string;
}

export interface ScannedPrescription {
  id: string;
  imageDataUrl?: string;
  hospitalName: string;
  doctorName: string;
  doctorSpecialty?: string;
  patientName: string;
  date: string;
  medicines: Medication[];
  phoneNumbers: ContactPhone[];
  allergies: string[];
  notes?: string;
  scannedAt: number;
}
