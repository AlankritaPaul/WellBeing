# WellBeing

> **Personal Medical File Cabinet & Pill Accountability Companion**  
> **Designed & Developed by [Alankrita Paul](https://github.com/AlankritaPaul)**

---

## 🌟 Overview

**WellBeing** is a 100% money-free, local-first medical utility designed to operate entirely on the patient's device storage (`localStorage` & `IndexedDB`). It requires **zero account creation, zero email IDs, and zero phone number inputs**, guaranteeing absolute data privacy and eliminating cybersecurity risks.

The application is tailored for elderly patients, non-English speakers, and individuals managing multiple chronic conditions or complex medication regimens.

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

### 4. Strict Phone Number Analysis Matrix
- Context-aware parser strictly separates hospital contact numbers:
  - **Appointment / Booking Desk** (`Reception`, `Booking`, `Registration`, `OPD`).
  - **Urgent Queries & Emergency Line** (`Casualty`, `Emergency`, `Direct`, `Doctor Mobile`).
- Eliminates misclassification so patients never dial the wrong department during urgent situations. If no number is listed, it honestly states "No contact number listed".

### 5. Universal Drug Allergy Warning Shield
- Pinned in high-contrast amber/red at the top of the cabinet when an allergy is documented on the prescription.
- Cross-matches active pills against known drug interaction families (e.g., Sulfa, Penicillin, NSAIDs) to prevent accidental adverse interactions.
- If no allergy is present, it displays a safe neutral indicator (NKDA) to avoid false alarm.

### 6. Multi-Doctor & Multi-Disease Digital File Cabinet
Organizes records into isolated folders by medical condition and doctor, featuring:
- **"Scanned Papers" Digital Vault**: Electronic backup with high-resolution pan, zoom (1x to 4x), and download.
- **Diagnostic Lab Desk**: Interactive checklist tracking prescribed lab tests (*Pending* vs. *Completed*) with completion dates.
- **Current Pills Menu**: Active medication strips with pill counts and refill tracking.
- **Clinical Dictionary**: Plain-language explanations of what each medicine treats and how it actively works in the human body.
- **Live Check-up Countdown**: Real-time ticker counting down to the next doctor appointment.

### 7. Dual-Sided Accountability Engine
- **Morning Agenda Blueprint Card**: Lockscreen-style daily itinerary showing all scheduled pills, exact hours, meal timing (before/after food), and strip packing lists.
- **3-Button Smart Delayed Alarm**:
  - 🟢 **"I Took It"**: Logs taken dose timestamp, decrements inventory stock, updates adherence score.
  - 🟡 **"Delay Alarm"**: Silences noise instantly, opens duration sheet (15m, 30m, 1h), and locks a sticky pending banner until finalized.
  - 🔴 **"Skip Dose"**: Opens Zero-Mental-Fatigue reason sheet (medical fasting, side effects, forgot strip, doctor hold) with optional voice dictation, locking an unalterable timestamped reason.
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

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v20+ recommended)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/AlankritaPaul/WellBeing.git

# Navigate to project folder
cd WellBeing

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser to view the application.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🗺️ Project Roadmap & Branch Structure

| Phase | Feature / Page | Target Branch |
|---|---|---|
| **Page 1** | Multi-Language Selection System | `page-language-selector` |
| **Page 2** | Preferred Name Screen (*"In what name you want us to call you?"*) | `feature-preferred-name` |
| **Page 3** | 10-Second Interactive Guidance Video Tutorial | `page-tutorial-guide` |
| **Page 4** | Prescription Camera & Handwriting Medical OCR | `page-prescription-scanner` |
| **Page 5** | Digital File Cabinet & Multi-Doctor Folders | `feature-multi-doctor-folders` |
| **Page 6** | "Scanned Papers" Digital Vault | `feature-prescription-digital-vault` |
| **Page 7** | Diagnostic Lab Desk Checklist | `feature-diagnostic-lab-checklist` |
| **Page 8** | Current Pills & Clinical Drug Dictionary | `feature-clinical-drug-dictionary` |
| **Page 9** | Daily Accountability & 3-Button Smart Alarm | `page-daily-agenda-alarm` |
| **Page 10** | Doctor Review Mode & PDF/Excel Export | `feature-pdf-doctor-review-report` |

---

## 📄 License & Credits

Created with ❤️ by **Alankrita Paul**.  
All rights reserved. Designed as a free, privacy-first healthcare utility.
