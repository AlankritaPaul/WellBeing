<div align="center">
  <img src="./public/images/wellbeing_heart_logo.png" alt="WellBeing Heart Logo" width="160" />
  <br />
  <img src="./public/images/wellbeing_header.svg" alt="WellBeing - Thoughtful Technology. Meaningful Healthcare." width="820" />
</div>

---

## 🌟 Overview

**WellBeing** is a 100% money-free, local-first medical utility designed to operate entirely on the patient's device storage (`localStorage` & `IndexedDB`). It runs seamlessly both online and offline, requiring **zero account creation, zero email IDs, and zero phone number inputs**, guaranteeing absolute data privacy and eliminating cybersecurity risks.

The application is thoughtfully crafted for everyone — including elderly patients, families, caregivers, and individuals managing chronic health conditions or daily medical routines with dignity, simplicity, and ease.

---

## 🚀 Key Architectural Features

### 1. Multi-Language Selection System
- **Alphabetical Ordering**: Complete database of 32 languages in strict continuous alphabetical order (Arabic, Assamese, Bengali, Bhojpuri, Bodo, Chinese, Dogri, English, French, German, Gujarati, Hindi, Japanese, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Portuguese, Punjabi, Russian, Sanskrit, Santali, Sindhi, Spanish, Tamil, Telugu, Urdu).
- **Search Box**: Styled with an emerald border, left-aligned search text, and a vertical divider with a magnifying search icon on the right.
- **Dynamic Action Button**: The confirmation button dynamically translates in real time to the selected language's native script (e.g., `Continue` → `अगें बद्घो` → `Continuer` → `继续` → `এগিয়ে যান` → `आगे बढ़ें`).
- **Changeable Anytime**: Patients can switch their preferred language and display name at any point from the persistent top navigation bar.

### 2. 10-Second Guidance Video Tutorial
- Eliminates scanning mistakes before document capture by demonstrating:
  1. Placing the prescription paper flat on a surface.
  2. Holding the phone parallel to avoid skew distortion.
  3. Ensuring even lighting and steady autofocus.
- Includes a 10-second countdown with play/pause and an instant **Skip** button.

### 3. Context-Aware Medical OCR Engine
- Specifically designed to decipher messy doctor handwriting and clinical shorthand (`BD`, `TDS`, `OD`, `HS`, `SOS`, `ac`, `pc`, `mg`, `tab`).
- Automatically extracts patient vitals (Name, Age, Blood Group, Weight, Visit Date) to build a localized profile without manual keystrokes.
- Bundled with high-resolution realistic sample clinical prescriptions for instant testing, alongside camera and photo upload modes.

### 4. Universal Drug Allergy Warning Shield
- Pinned in high-contrast amber/red at the top of the cabinet when an allergy is documented on the prescription.
- Cross-matches active pills against known drug interaction families (e.g., Sulfa, Penicillin, NSAIDs) to prevent accidental adverse interactions.
- If no allergy is present, it displays a safe neutral indicator (NKDA) to avoid false alarm.

### 5. Multi-Doctor & Multi-Disease Digital File Cabinet
Organizes records into isolated folders by medical condition and doctor, featuring:
- **"Scanned Papers" Digital Vault**: Electronic backup with high-resolution pan, zoom (1x to 4x), and download.
- **Diagnostic Lab Desk**: Interactive checklist tracking prescribed lab tests (*Pending* vs. *Completed*) with completion dates.
- **Current Pills Menu**: Active medication strips with pill counts and refill tracking.
- **Clinical Dictionary**: Plain-language explanations of what each medicine treats and how it actively works in the human body.
- **Live Check-up Countdown**: Real-time ticker counting down to the next doctor appointment.

### 6. Dual-Sided Accountability Engine
- **Morning Agenda Blueprint Card**: Lockscreen-style daily itinerary showing all scheduled pills, exact hours, meal timing (before/after food), and strip packing lists.
- **3-Button Smart Delayed Alarm**:
  - 🟢 **"I Took It"**: Logs taken dose timestamp, decrements inventory stock, updates adherence score.
  - 🟡 **"Delay Alarm"**: Silences noise instantly, opens duration sheet (15m, 30m, 1h), and locks a sticky pending banner until finalized.
  - 🔴 **"Skip Dose"**: Opens Zero-Mental-Fatigue reason sheet (medical fasting, side effects, forgot strip, doctor hold) with custom reason input box, locking an unalterable timestamped reason.
- **Nightly Course Summary**: Positive reinforcement for 100% adherence or an honest timeline of delayed/skipped entries.
- **Doctor Review Mode**: One-click printable PDF and Excel/CSV compliance report with mathematical proof of medication adherence for clinician consultations.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Iconography**: Lucide React
- **Local Storage Engine**: Browser LocalStorage & IndexedDB (Zero External Servers)
- **Audio Synthesis**: Web Audio API (Audible persistent alarm beeps)

---

## 📄 License & Credits

*Thoughtful Technology. Meaningful Healthcare.*  
Developed by **Alankrita Paul**.  
All rights reserved. Designed as a free, privacy-first healthcare utility.
