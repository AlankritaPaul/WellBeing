import type { ScannedPrescription, Medication } from '../types/prescription';
import { storageService, isMedicationCourseCompleted } from './storageService';

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

  // Play a GENTLE, soothing, non-disturbing melodic chime
  // Crystal clear and audible on phone/laptop speakers, but never harsh or piercing
  public playAlertChime(volumeLevel: number = 0.32): void {
    try {
      const ctx = this.initAudio();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Soft limiter for smooth acoustic dynamics (zero harsh clipping)
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-12, now);
      limiter.knee.setValueAtTime(30, now);
      limiter.ratio.setValueAtTime(4, now);
      limiter.attack.setValueAtTime(0.01, now);
      limiter.release.setValueAtTime(0.25, now);
      limiter.connect(ctx.destination);

      // Master Gain set to comfortable, gentle level (never blaring)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volumeLevel, now);
      masterGain.connect(limiter);

      // Helper to synthesize a gentle, warm bell chime with soft envelope
      const playGentleTone = (freq: number, startTime: number, duration: number, peakGain: number) => {
        // Warm sine wave fundamental
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        // Smooth gradual attack (0.04s) to prevent clicking, followed by pleasant exponential ring
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        // Soft warm harmonic overtone (low amplitude for warmth, not sharpness)
        const overtone = ctx.createOscillator();
        const overGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, startTime);
        overGain.gain.setValueAtTime(0, startTime);
        overGain.gain.linearRampToValueAtTime(peakGain * 0.2, startTime + 0.03);
        overGain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration * 0.6);

        overtone.connect(overGain);
        overGain.connect(masterGain);
        overtone.start(startTime);
        overtone.stop(startTime + duration + 0.05);
      };

      // A gentle, peaceful 3-note ascending harp/marimba chime (C5 -> E5 -> G5)
      // Plays ONCE smoothly without harsh repetitions
      playGentleTone(523.25, now, 0.45, 0.70);        // C5 (warm base)
      playGentleTone(659.25, now + 0.16, 0.50, 0.75); // E5 (bright pleasant center)
      playGentleTone(783.99, now + 0.34, 0.90, 0.85); // G5 (peaceful lingering bell)
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
          icon: '/images/wellbeing_heart_logo.png',
          badge: '/favicon.svg',
          ...options,
        });
        return true;
      }

      // Fallback to standard Window Notification
      const notif = new Notification(title, {
        icon: '/images/wellbeing_heart_logo.png',
        badge: '/favicon.svg',
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

  // 1. Morning Daily Overview Notification (Between 06:30 AM and 07:00 AM)
  // Single message in clean LIST format (bulleted lines, strictly NOT paragraph type)
  public sendMorningBriefing(userName: string, prescription: ScannedPrescription): boolean {
    const meds = prescription.medicines || [];
    if (meds.length === 0) return false;

    // Filter out medications whose course duration has completed
    const activeMeds = meds.filter((m) => !isMedicationCourseCompleted(m, prescription.date));
    if (activeMeds.length === 0) return false;

    // Helper to get exact meal relationship for each medicine
    const getTimingLabel = (m: Medication): string => {
      const isBefore = m.timing === 'before_food';
      const freq = m.frequency || '1-0-1';
      const parts = freq.split('-').map((p) => parseInt(p.trim(), 10) || 0);

      const times: string[] = [];
      if (parts[0] > 0) times.push(isBefore ? 'Before breakfast' : 'After breakfast');
      if (parts[1] > 0) times.push(isBefore ? 'Before lunch' : 'After lunch');
      if (parts[2] > 0) times.push(isBefore ? 'Before dinner' : 'After dinner');

      if (times.length > 0) return times.join(', ');
      return isBefore ? 'Before food' : 'After food';
    };

    // Format strictly as a clean, readable LIST (bulleted lines, never paragraph text)
    const listLines = activeMeds
      .map((m) => `• ${m.name} (${m.dosage}) — ${getTimingLabel(m)}`)
      .join('\n');

    const displayName = userName.trim() || 'Maa';
    const title = `☀️ Good morning, ${displayName}!`;
    const body = `Today's medicine list:\n${listLines}\n\nPlease keep your medicines with you.`;

    this.sendNotification(title, {
      body,
      tag: `wellbeing-morning-${new Date().toISOString().split('T')[0]}`,
    });
    return true;
  }

  // 2. INDIVIDUAL MEDICINE REMINDER
  // Strictly ONE single message for that specific medicine at its exact time
  // Gives only the medicine name and whether to take before breakfast, after breakfast, etc.
  public sendSingleMedicineReminder(
    userName: string, 
    med: Medication, 
    mealLabel: string, 
    slotType: 'morning' | 'afternoon' | 'night'
  ): boolean {
    const isBeforeFood = med.timing === 'before_food' || mealLabel.toLowerCase().includes('before');
    const displayName = userName.trim() || 'Maa';

    // Single medicine message: only medicine name and before/after breakfast, lunch, or dinner
    const title = `💊 ${med.name} (${med.dosage})`;
    const body = `${displayName}, please take ${med.name} (${med.dosage}) ${mealLabel}.`;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Send single system/lockscreen notification
    const options: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
      body,
      tag: `wellbeing-med-${med.id}-${slotType}-${todayStr}`,
      requireInteraction: true,
      actions: [
        { action: 'taken', title: '✓ Taken' },
        { action: 'delayed', title: '⏱ Delay (15m)' },
        { action: 'skipped', title: '✕ Skip' },
      ],
      data: { med, timeLabel: mealLabel, slotType, isBeforeFood, userName: displayName },
    };

    this.sendNotification(title, options as NotificationOptions);

    // 2. Dispatch custom event for the Instant In-App Popup Modal (focused strictly on THIS single medicine)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wellbeing_single_dose_popup', {
          detail: {
            med,
            timeLabel: mealLabel,
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
  public sendNightSummary(userName: string, totalScheduled: number, takenCount: number, delayedCount: number, skippedCount: number): boolean {
    const displayName = userName.trim() || 'Maa';
    const title = `🌙 Daily Medicine Summary for ${displayName}`;
    const adherencePercent = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;

    let detail = `${takenCount} of ${totalScheduled} taken on time (${adherencePercent}%)`;
    if (delayedCount > 0) detail += `, ${delayedCount} delayed`;
    if (skippedCount > 0) detail += `, ${skippedCount} skipped`;

    const body = `${detail}.\nAll details are safely saved in your report to show your doctor on your next checkup!`;

    this.sendNotification(title, {
      body,
      tag: `wellbeing-night-${new Date().toISOString().split('T')[0]}`,
    });
    return true;
  }

  // Preview test reminder so user can hear the pleasant, gentle chime and see the natural reminder format
  public sendTestSampleReminder(userName: string): void {
    const displayName = userName.trim() || 'Maa';
    this.playAlertChime();
    this.sendNotification(`💊 Pantoprazole 40mg`, {
      body: `${displayName}, please take Pantoprazole 40mg before breakfast.`,
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
          this.sendNotification(`🎉 Course Completed for ${displayName}!`, {
            body: `${displayName}, your ${med.duration || 'prescribed'} course of ${med.name} (${med.dosage}) is now successfully completed! Well done.`,
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
