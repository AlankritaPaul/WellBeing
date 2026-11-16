import type { ScannedPrescription, Medication } from '../types/prescription';
import { storageService, isMedicationCourseCompleted, type NotificationToneId } from './storageService';
import { getReminderLocalization } from '../i18n/reminderTranslations';

// Browser & Device Native Notification Service
// 100% money-free, zero account, operating via Web Notifications, Service Worker & Web Audio API
class NotificationService {
  private schedulerInterval: number | null = null;
  private audioContext: AudioContext | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initServiceWorker();
    this.setupWakeListeners();
  }

  // Register background Service Worker for lockscreen/system notification banner
  private async initServiceWorker(): Promise<void> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        this.swRegistration = reg;

        // Listen for messages from service worker (e.g. user clicked "Taken" from notification bar)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'WELLBEING_NOTIFICATION_ACTION') {
            const { action, data } = event.data;
            window.dispatchEvent(
              new CustomEvent('wellbeing_sw_action', { detail: { action, data } })
            );
          }
        });
      } catch (e) {
        console.warn('Service worker registration note:', e);
      }
    }
  }

  // Whenever user unlocks mobile screen or switches back to tab, immediately check alarms
  private setupWakeListeners(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkAndDeliverScheduledAlerts();
      }
    });

    window.addEventListener('focus', () => {
      this.checkAndDeliverScheduledAlerts();
    });
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      this.initAudio();
      return permission;
    } catch (e) {
      console.warn('Could not request notification permission:', e);
      return this.getPermission();
    }
  }

  // Play a strong yet soothing, melodic reminder chime (2.0 – 2.8 seconds long)
  // Tuned to be clearly audible through laptop and mobile phone speakers ("soft yet loud") without harsh clipping.
  // Supports user-selected tone (or default 'gentle_harp')
  public playAlertChime(volumeLevel: number = 0.68, overrideToneId?: NotificationToneId): void {
    try {
      const ctx = this.initAudio();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const toneId: NotificationToneId = overrideToneId || storageService.getNotificationTone();
      const now = ctx.currentTime;

      // Dynamics Compressor / Limiter: prevents harsh digital clipping, keeps acoustic fullness
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-10, now);
      limiter.knee.setValueAtTime(24, now);
      limiter.ratio.setValueAtTime(5, now);
      limiter.attack.setValueAtTime(0.005, now);
      limiter.release.setValueAtTime(0.22, now);
      limiter.connect(ctx.destination);

      // Master Gain: strong and present, clearly heard through device speakers
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volumeLevel, now);
      masterGain.connect(limiter);

      // Helper to synthesize a melodic bell note with natural attack, overtone, and smooth acoustic decay
      const playMelodicNote = (
        freq: number, 
        startTime: number, 
        duration: number, 
        peakGain: number, 
        type: OscillatorType = 'sine',
        overtoneRatio: number = 2
      ) => {
        // Fundamental
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        // Acoustic warm overtone for richness and clarity
        const overtone = ctx.createOscillator();
        const overGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * overtoneRatio, startTime);

        overGain.gain.setValueAtTime(0, startTime);
        overGain.gain.linearRampToValueAtTime(peakGain * 0.22, startTime + 0.03);
        overGain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration * 0.65);

        overtone.connect(overGain);
        overGain.connect(masterGain);
        overtone.start(startTime);
        overtone.stop(startTime + duration + 0.05);
      };

      // Synthesis routines for the 5 distinct, strong 2 to 3 second melodies
      switch (toneId) {
        case 'soft_marimba': {
          // 2.5s Warm acoustic wooden marimba melody (A4 -> C#5 -> E5 -> A5 -> F#5 -> A5)
          playMelodicNote(440.00, now, 0.65, 0.80, 'triangle', 2);        // A4
          playMelodicNote(554.37, now + 0.30, 0.65, 0.82, 'triangle', 2); // C#5
          playMelodicNote(659.25, now + 0.62, 0.70, 0.85, 'sine', 2);     // E5
          playMelodicNote(880.00, now + 0.98, 0.80, 0.88, 'sine', 2);     // A5
          playMelodicNote(739.99, now + 1.35, 0.70, 0.78, 'sine', 2);     // F#5
          playMelodicNote(880.00, now + 1.70, 0.90, 0.85, 'sine', 2);     // A5 (warm finale)
          break;
        }

        case 'temple_bowl': {
          // 2.8s Deep Tibetan Singing Bowl with resonant harmonic drone & clear silver temple bells
          // Deep bowl fundamental drone (D3 146.83 Hz + A3 220 Hz + F#4 369.99 Hz)
          const oscDrone1 = ctx.createOscillator();
          const gainDrone1 = ctx.createGain();
          oscDrone1.type = 'sine';
          oscDrone1.frequency.setValueAtTime(146.83, now);
          gainDrone1.gain.setValueAtTime(0, now);
          gainDrone1.gain.linearRampToValueAtTime(0.80, now + 0.12);
          gainDrone1.gain.exponentialRampToValueAtTime(0.001, now + 2.75);
          oscDrone1.connect(gainDrone1);
          gainDrone1.connect(masterGain);
          oscDrone1.start(now);
          oscDrone1.stop(now + 2.80);

          const oscDrone2 = ctx.createOscillator();
          const gainDrone2 = ctx.createGain();
          oscDrone2.type = 'sine';
          oscDrone2.frequency.setValueAtTime(220.00, now);
          gainDrone2.gain.setValueAtTime(0, now);
          gainDrone2.gain.linearRampToValueAtTime(0.50, now + 0.10);
          gainDrone2.gain.exponentialRampToValueAtTime(0.001, now + 2.50);
          oscDrone2.connect(gainDrone2);
          gainDrone2.connect(masterGain);
          oscDrone2.start(now);
          oscDrone2.stop(now + 2.55);

          // Clear silver bells over the meditative drone
          playMelodicNote(440.00, now + 0.55, 1.10, 0.75, 'sine', 2);     // A4 bell
          playMelodicNote(587.33, now + 1.25, 1.50, 0.85, 'sine', 2);     // D5 bell
          break;
        }

        case 'birdsong': {
          // 2.4s Morning birdsong canopy: 4 natural playful chirps with soft harmonic background
          const chirp = (fStart: number, fEnd: number, tStart: number, dur: number, peak: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(fStart, tStart);
            osc.frequency.exponentialRampToValueAtTime(fEnd, tStart + dur);

            gain.gain.setValueAtTime(0, tStart);
            gain.gain.linearRampToValueAtTime(peak, tStart + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.001, tStart + dur);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(tStart);
            osc.stop(tStart + dur + 0.03);
          };

          chirp(1100, 1750, now, 0.22, 0.75);
          chirp(1350, 2200, now + 0.38, 0.25, 0.80);
          chirp(1800, 2550, now + 0.82, 0.30, 0.82);
          chirp(2100, 1450, now + 1.35, 0.40, 0.75);

          // Warm harmonic chime resolving underneath
          playMelodicNote(783.99, now + 0.45, 1.80, 0.60, 'sine', 2);      // G5 soft pad
          break;
        }

        case 'zen_wind': {
          // 2.7s 5-bell pentatonic Japanese wind chime breeze (D5 -> F#5 -> A5 -> B5 -> D6)
          playMelodicNote(587.33, now, 0.85, 0.75, 'sine', 2);             // D5
          playMelodicNote(739.99, now + 0.35, 0.85, 0.80, 'sine', 2);      // F#5
          playMelodicNote(880.00, now + 0.72, 0.90, 0.82, 'sine', 2);      // A5
          playMelodicNote(987.77, now + 1.15, 0.95, 0.85, 'sine', 2);      // B5
          playMelodicNote(1174.66, now + 1.60, 1.15, 0.90, 'sine', 2);     // D6 lingering bell
          break;
        }

        case 'gentle_harp':
        default: {
          // Default: 2.6s classical 6-note ascending & resolving harp arpeggio (C5 -> E5 -> G5 -> B5 -> C6 -> G5)
          playMelodicNote(523.25, now, 0.75, 0.78, 'sine', 2);             // C5
          playMelodicNote(659.25, now + 0.28, 0.75, 0.80, 'sine', 2);      // E5
          playMelodicNote(783.99, now + 0.58, 0.80, 0.82, 'sine', 2);      // G5
          playMelodicNote(987.77, now + 0.90, 0.85, 0.85, 'sine', 2);      // B5
          playMelodicNote(1046.50, now + 1.25, 1.35, 0.90, 'sine', 2);     // C6 (bright peak)
          playMelodicNote(783.99, now + 1.65, 1.00, 0.72, 'sine', 2);      // G5 (resolving warmth)
          break;
        }
      }
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }

    // Gentle haptic feedback (short soft double-tap, not a long vibration)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 70, 100]);
      } catch {
        // Ignored if vibration not permitted
      }
    }
  }

  // Play an instant preview of a specific tone (e.g. from Settings tone picker)
  public playTonePreview(toneId: NotificationToneId): void {
    this.playAlertChime(0.75, toneId);
  }

  private initAudio(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    return this.audioContext;
  }

  // Generic sender with sound, mobile notification bar actions & auto focus
  public async sendNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      this.playAlertChime();

      // Use ServiceWorkerRegistration when available (enables action buttons on Android Lock Screen & Notification Bar)
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          icon: '/images/wellbeing_app_icon.png',
          badge: '/images/wellbeing_app_icon.png',
          ...options,
        });
        return true;
      }

      // Fallback to standard Window Notification
      const notif = new Notification(title, {
        icon: '/images/wellbeing_app_icon.png',
        badge: '/images/wellbeing_app_icon.png',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return true;
    } catch (e) {
      console.warn('Notification send failed:', e);
      return false;
    }
  }

  // Helper to map timing labels to the user's selected language
  private resolveMealTimingText(
    timingKey: string,
    isBefore: boolean,
    loc: ReturnType<typeof getReminderLocalization>
  ): string {
    const key = (timingKey || '').toLowerCase();
    if (key.includes('breakfast')) {
      return isBefore ? loc.beforeBreakfast : loc.afterBreakfast;
    }
    if (key.includes('lunch')) {
      return isBefore ? loc.beforeLunch : loc.afterLunch;
    }
    if (key.includes('dinner')) {
      return isBefore ? loc.beforeDinner : loc.afterDinner;
    }
    return isBefore ? loc.beforeFoodGeneral : loc.afterFoodGeneral;
  }

  // 1. Morning Daily Overview Notification (Between 06:30 AM and 07:00 AM)
  // Single message in clean LIST format (bulleted lines, strictly NOT paragraph type)
  // Fully localized according to user's selected language (Bengali, Hindi, English, etc.)
  public sendMorningBriefing(userName: string, prescription: ScannedPrescription): boolean {
    const meds = prescription.medicines || [];
    if (meds.length === 0) return false;

    // Filter out medications whose course duration has completed
    const activeMeds = meds.filter((m) => !isMedicationCourseCompleted(m, prescription.date));
    if (activeMeds.length === 0) return false;

    const lang = storageService.getLanguage();
    const loc = getReminderLocalization(lang);

    // Helper to get exact meal relationship for each medicine
    const getTimingLabel = (m: Medication): string => {
      const isBefore = m.timing === 'before_food';
      const freq = m.frequency || '1-0-1';
      const parts = freq.split('-').map((p) => parseInt(p.trim(), 10) || 0);

      const times: string[] = [];
      if (parts[0] > 0) times.push(isBefore ? loc.beforeBreakfast : loc.afterBreakfast);
      if (parts[1] > 0) times.push(isBefore ? loc.beforeLunch : loc.afterLunch);
      if (parts[2] > 0) times.push(isBefore ? loc.beforeDinner : loc.afterDinner);

      if (times.length > 0) return times.join(', ');
      return isBefore ? loc.beforeFoodGeneral : loc.afterFoodGeneral;
    };

    // Format strictly as a clean, readable LIST (bulleted lines, never paragraph text)
    const listLines = activeMeds
      .map((m) => `• ${m.name} (${m.dosage}) — ${getTimingLabel(m)}`)
      .join('\n');

    const displayName = userName.trim() || 'Maa';
    const title = loc.morningTitle(displayName);
    const body = `${loc.morningHeader}\n${listLines}\n\n${loc.morningFooter}`;

    this.sendNotification(title, {
      body,
      tag: `wellbeing-morning-${new Date().toISOString().split('T')[0]}`,
    });
    return true;
  }

  // 2. INDIVIDUAL MEDICINE REMINDER
  // Strictly ONE single message for that specific medicine at its exact time
  // Gives only the medicine name and whether to take before breakfast, after breakfast, etc.
  // Language-sensitive: dynamically adapts to Bengali, Hindi, English, etc.
  public sendSingleMedicineReminder(
    userName: string, 
    med: Medication, 
    mealLabel: string, 
    slotType: 'morning' | 'afternoon' | 'night'
  ): boolean {
    const isBeforeFood = med.timing === 'before_food' || mealLabel.toLowerCase().includes('before');
    const displayName = userName.trim() || 'Maa';
    const lang = storageService.getLanguage();
    const loc = getReminderLocalization(lang);

    // Localize the meal timing phrase
    const localizedMeal = this.resolveMealTimingText(mealLabel, isBeforeFood, loc);

    // Single medicine message: only medicine name and before/after breakfast, lunch, or dinner
    const title = `💊 ${med.name} (${med.dosage})`;
    const body = loc.singleDosePrompt(displayName, med.name, med.dosage, localizedMeal);

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Send single system/lockscreen notification
    const options: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
      body,
      tag: `wellbeing-med-${med.id}-${slotType}-${todayStr}`,
      requireInteraction: true,
      actions: [
        { action: 'taken', title: loc.actionTaken },
        { action: 'delayed', title: loc.actionDelay15m },
        { action: 'skipped', title: loc.actionSkip },
      ],
      data: { med, timeLabel: localizedMeal, slotType, isBeforeFood, userName: displayName },
    };

    this.sendNotification(title, options as NotificationOptions);

    // 2. Dispatch custom event for the Instant In-App Popup Modal (focused strictly on THIS single medicine)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wellbeing_single_dose_popup', {
          detail: {
            med,
            timeLabel: localizedMeal,
            slotType,
            isBeforeFood,
            userName: displayName,
            timestamp: Date.now(),
          },
        })
      );
    }

    return true;
  }

  // 3. Night / End-of-Day Adherence Summary Report (09:45 PM)
  // Localized dynamically
  public sendNightSummary(userName: string, totalScheduled: number, takenCount: number, delayedCount: number, skippedCount: number): boolean {
    const displayName = userName.trim() || 'Maa';
    const lang = storageService.getLanguage();
    const loc = getReminderLocalization(lang);

    const title = loc.nightSummaryTitle(displayName);
    const adherencePercent = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;
    const body = loc.nightSummaryBody(takenCount, totalScheduled, adherencePercent, delayedCount, skippedCount);

    this.sendNotification(title, {
      body,
      tag: `wellbeing-night-${new Date().toISOString().split('T')[0]}`,
    });
    return true;
  }

  // Preview test reminder so user can hear the pleasant, gentle chime and see the natural reminder format
  public sendTestSampleReminder(userName: string): void {
    const displayName = userName.trim() || 'Maa';
    const lang = storageService.getLanguage();
    const loc = getReminderLocalization(lang);

    this.playAlertChime();
    this.sendNotification(`💊 Pantoprazole 40mg`, {
      body: loc.singleDosePrompt(displayName, 'Pantoprazole', '40mg', loc.beforeBreakfast),
      tag: 'wellbeing-test-sample-reminder',
    });
  }

  // Background Auto-Scheduler
  // Checks current time every 30 seconds, enforces course durations, and follows the natural meal sequence
  public startScheduler(): void {
    if (this.schedulerInterval) return;

    // Check immediately on startup
    this.checkAndDeliverScheduledAlerts();

    // Re-check every 30 seconds
    this.schedulerInterval = window.setInterval(() => {
      this.checkAndDeliverScheduledAlerts();
    }, 30000);
  }

  public stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  public checkAndDeliverScheduledAlerts(): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const prescriptions = storageService.getPrescriptions();
    if (prescriptions.length === 0) return;

    const activeId = storageService.getActiveAccountId();
    const currentDoc = (activeId ? prescriptions.find((p) => p.id === activeId) : null) || prescriptions[0];
    if (!currentDoc || !currentDoc.medicines || currentDoc.medicines.length === 0) return;

    const userName = storageService.getUserName() || 'Maa';
    const displayName = userName.trim() || 'Maa';
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Helper: does medicine have dose in this slot (0=morning, 1=afternoon, 2=night)
    const hasDoseInSlot = (med: Medication, slotIndex: 0 | 1 | 2): boolean => {
      const freq = med.frequency || '1-0-0';
      if (freq.includes('-')) {
        const parts = freq.split('-').map((p) => parseInt(p.trim(), 10) || 0);
        return Boolean(parts[slotIndex] && parts[slotIndex] > 0);
      }
      return slotIndex === 0;
    };

    // 0. COURSE DURATION TRACKING: Check if any medicine course duration has completed
    currentDoc.medicines.forEach((med) => {
      if (isMedicationCourseCompleted(med, currentDoc.date)) {
        const completeKey = `wellbeing_course_completed_sent_${med.id}`;
        if (!localStorage.getItem(completeKey)) {
          const lang = storageService.getLanguage();
          const loc = getReminderLocalization(lang);
          this.sendNotification(loc.courseCompletedTitle(displayName), {
            body: loc.courseCompletedBody(displayName, med.duration || 'prescribed', med.name, med.dosage),
            tag: `wellbeing-course-completed-${med.id}`,
          });
          localStorage.setItem(completeKey, 'true');
        }
      }
    });

    // Only active medicines (whose course duration is still ongoing) will receive reminders!
    const activeMedicines = currentDoc.medicines.filter((m) => !isMedicationCourseCompleted(m, currentDoc.date));
    if (activeMedicines.length === 0) return;

    // A. 06:30 AM to 07:00 AM Morning Full-Day Overview Briefing
    // Triggered strictly between 6:30 AM and 7:00 AM (with catch-up up to 8:30 AM if the device was asleep/offline)
    const isMorningTime = (currentHour === 6 && currentMinute >= 30) || (currentHour === 7 && currentMinute <= 15) || (currentHour === 7 || currentHour === 8);
    if (isMorningTime) {
      const briefingKey = `wellbeing_briefing_sent_${todayStr}`;
      if (!localStorage.getItem(briefingKey)) {
        this.sendMorningBriefing(displayName, currentDoc);
        localStorage.setItem(briefingKey, 'true');
      }
    }

    // B. BREAKFAST SEQUENCE (Normal household breakfast time ~ 9:00 AM to 9:30 AM):
    // 1. Morning BEFORE Breakfast: (Sent around 8:45 AM – 9:15 AM before breakfast)
    if ((currentHour === 8 && currentMinute >= 45) || (currentHour === 9 && currentMinute <= 15)) {
      activeMedicines.forEach((med) => {
        if (hasDoseInSlot(med, 0) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_morning_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(displayName, med, 'before breakfast', 'morning');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Morning AFTER Breakfast:
    // Triggered 15 to 20 minutes after taking Before Breakfast, OR during normal after-breakfast window (9:25 AM to 10:15 AM)
    const bfTakenTime = localStorage.getItem(`wellbeing_taken_before_breakfast_${todayStr}`);
    const is15MinsAfterBreakfast = bfTakenTime ? (Date.now() - parseInt(bfTakenTime, 10)) >= 15 * 60 * 1000 : false;
    const isAfterBreakfastWindow = (currentHour === 9 && currentMinute >= 25) || (currentHour === 10 && currentMinute <= 15);

    if (is15MinsAfterBreakfast || isAfterBreakfastWindow) {
      activeMedicines.forEach((med) => {
        if (hasDoseInSlot(med, 0) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_morning_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(displayName, med, 'after breakfast', 'morning');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // C. LUNCH SEQUENCE (Normal household lunch time ~ 1:30 PM to 2:00 PM):
    // 1. Afternoon BEFORE Lunch: (Sent around 1:00 PM – 1:30 PM before lunch)
    if (currentHour === 13 && currentMinute <= 30) {
      activeMedicines.forEach((med) => {
        if (hasDoseInSlot(med, 1) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_afternoon_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(displayName, med, 'before lunch', 'afternoon');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Afternoon AFTER Lunch:
    // Triggered 15 to 20 minutes after taking Before Lunch, OR during normal after-lunch window (1:45 PM to 2:30 PM)
    const lunchTakenTime = localStorage.getItem(`wellbeing_taken_before_lunch_${todayStr}`);
    const is15MinsAfterLunch = lunchTakenTime ? (Date.now() - parseInt(lunchTakenTime, 10)) >= 15 * 60 * 1000 : false;
    const isAfterLunchWindow = (currentHour === 13 && currentMinute >= 45) || (currentHour === 14 && currentMinute <= 30);

    if (is15MinsAfterLunch || isAfterLunchWindow) {
      activeMedicines.forEach((med) => {
        if (hasDoseInSlot(med, 1) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_afternoon_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(displayName, med, 'after lunch', 'afternoon');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // D. DINNER SEQUENCE (Normal household dinner time ~ 8:30 PM to 9:30 PM):
    // 1. Night BEFORE Dinner: (Sent around 8:00 PM – 8:30 PM before dinner)
    if (currentHour === 20 && currentMinute <= 30) {
      activeMedicines.forEach((med) => {
        if (hasDoseInSlot(med, 2) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_night_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(displayName, med, 'before dinner', 'night');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Night AFTER Dinner:
    // Triggered 15 to 20 minutes after taking Before Dinner, OR during normal after-dinner window (9:00 PM to 9:45 PM)
    const dinnerTakenTime = localStorage.getItem(`wellbeing_taken_before_dinner_${todayStr}`);
    const is15MinsAfterDinner = dinnerTakenTime ? (Date.now() - parseInt(dinnerTakenTime, 10)) >= 15 * 60 * 1000 : false;
    const isAfterDinnerWindow = (currentHour === 21 && currentMinute >= 0 && currentMinute <= 45);

    if (is15MinsAfterDinner || isAfterDinnerWindow) {
      activeMedicines.forEach((med) => {
        if (hasDoseInSlot(med, 2) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_night_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(displayName, med, 'after dinner', 'night');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // E. 09:45 PM Bedtime Adherence Summary for Doctor
    if (currentHour === 21 && currentMinute >= 45) {
      const nightSummaryKey = `wellbeing_night_summary_sent_${todayStr}`;
      if (!localStorage.getItem(nightSummaryKey)) {
        let totalScheduled = 0;
        activeMedicines.forEach((med) => {
          if (hasDoseInSlot(med, 0)) totalScheduled++;
          if (hasDoseInSlot(med, 1)) totalScheduled++;
          if (hasDoseInSlot(med, 2)) totalScheduled++;
        });

        const logs = storageService.getDoseLogs().filter((l) => l.date === todayStr && l.prescriptionId === currentDoc.id);
        const takenCount = logs.filter((l) => l.status === 'taken').length;
        const delayedCount = logs.filter((l) => l.status === 'delayed').length;
        const skippedCount = logs.filter((l) => l.status === 'skipped').length;

        this.sendNightSummary(displayName, totalScheduled, takenCount, delayedCount, skippedCount);
        localStorage.setItem(nightSummaryKey, 'true');
      }
    }
  }
}

export const notificationService = new NotificationService();
