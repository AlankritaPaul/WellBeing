import type { ScannedPrescription, Medication } from '../types/prescription';
import { storageService } from './storageService';

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
  // Reminds patient of their full day course before leaving home
  public sendMorningBriefing(userName: string, prescription: ScannedPrescription): boolean {
    const meds = prescription.medicines || [];
    if (meds.length === 0) return false;

    const medNames = meds.map((m) => `${m.name} (${m.timing === 'before_food' ? 'Before food' : 'After food'})`).join(', ');
    const title = `☀️ Good Morning ${userName ? userName : 'Patient'}! Today's Medicine Plan`;
    const body = `🌅 Morning Reminder (6:30 - 7:00 AM):\nYour full day course: ${medNames}.\nPlease keep your medicines handy with you before leaving home!`;

    this.sendNotification(title, {
      body,
      tag: `wellbeing-morning-${new Date().toISOString().split('T')[0]}`,
    });
    return true;
  }

  // 2. INDIVIDUAL MEDICINE REMINDER (One by One, strictly separating Before Food and After Food, 5-10 mins in advance!)
  public sendSingleMedicineReminder(
    userName: string, 
    med: Medication, 
    timeLabel: string, 
    slotType: 'morning' | 'afternoon' | 'night'
  ): boolean {
    const isBeforeFood = med.timing === 'before_food';
    const timingBadge = isBeforeFood ? 'Take Before Food' : 'Take After Food';

    const title = `💊 ${med.name} (${med.dosage}) • ${timingBadge}`;
    const body = isBeforeFood 
      ? `⏰ 5-10 min advance reminder: Meal coming up. Please take ${med.name} on an empty stomach before food.`
      : `⏰ 5-10 min advance reminder: Meal finishing soon. Please keep ${med.name} ready to take right after food.`;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Send system/lockscreen notification
    const options: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
      body,
      tag: `wellbeing-med-${med.id}-${slotType}-${todayStr}`,
      requireInteraction: true,
      actions: [
        { action: 'taken', title: '✓ Taken' },
        { action: 'delayed', title: '⏱ Delay (15m)' },
        { action: 'skipped', title: '✕ Skip' },
      ],
      data: { med, timeLabel, slotType, isBeforeFood, userName },
    };

    this.sendNotification(title, options as NotificationOptions);

    // 2. Dispatch custom event for the Instant In-App Popup Modal (focused strictly on THIS single medicine)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wellbeing_single_dose_popup', {
          detail: {
            med,
            timeLabel,
            slotType,
            isBeforeFood,
            userName,
            timestamp: Date.now(),
          },
        })
      );
    }

    return true;
  }

  // 3. Night / End-of-Day Adherence Summary Report (09:30 PM)
  public sendNightSummary(userName: string, totalScheduled: number, takenCount: number, delayedCount: number, skippedCount: number): boolean {
    const title = `🌙 Daily Medicine Summary for ${userName ? userName : 'Today'}`;
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

  // Preview test reminder so user can hear the pleasant, gentle chime and see the 5-10 min advance notification
  public sendTestSampleReminder(userName: string): void {
    this.playAlertChime();
    this.sendNotification(`💊 Pantoprazole 40mg • Take Before Food`, {
      body: `⏰ 5-10 min advance reminder for ${userName ? userName : 'Patient'}: Breakfast is in 10 minutes. Please take Pantoprazole 40mg on an empty stomach. (Sound is set to gentle chime)`,
      tag: 'wellbeing-test-sample-reminder',
    });
  }

  // Background Auto-Scheduler
  // Checks current time every 30 seconds and checks each medicine individually at its exact Before/After food time
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

    const userName = storageService.getUserName();
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

    // A. 06:30 AM to 07:00 AM Morning Full-Day Overview Briefing
    // Triggered strictly between 6:30 AM and 7:00 AM (with catch-up up to 8:30 AM if the device was asleep/offline)
    const isMorningTime = (currentHour === 6 && currentMinute >= 30) || (currentHour === 7 && currentMinute <= 15) || (currentHour === 7 || currentHour === 8);
    if (isMorningTime) {
      const briefingKey = `wellbeing_briefing_sent_${todayStr}`;
      if (!localStorage.getItem(briefingKey)) {
        this.sendMorningBriefing(userName, currentDoc);
        localStorage.setItem(briefingKey, 'true');
      }
    }

    // B. MORNING MEDICINES (At least 5 to 10 minutes before):
    // 1. Morning BEFORE Food: (07:20 AM to 07:55 AM — 5-10 mins advance before food / dose)
    if (currentHour === 7 && currentMinute >= 20 && currentMinute <= 55) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 0) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_morning_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Morning (5-10 min Before Breakfast)', 'morning');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Morning AFTER Food: (08:20 AM to 08:55 AM — 5-10 mins advance before finishing breakfast)
    if (currentHour === 8 && currentMinute >= 20 && currentMinute <= 55) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 0) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_morning_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Morning (5-10 min Before Finishing Breakfast)', 'morning');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // C. AFTERNOON MEDICINES (At least 5 to 10 minutes before):
    // 1. Afternoon BEFORE Food: (12:20 PM to 12:55 PM — 5-10 mins advance before lunch)
    if (currentHour === 12 && currentMinute >= 20 && currentMinute <= 55) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 1) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_afternoon_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Afternoon (5-10 min Before Lunch)', 'afternoon');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Afternoon AFTER Food: (01:20 PM to 01:55 PM — 5-10 mins advance before finishing lunch)
    if (currentHour === 13 && currentMinute >= 20 && currentMinute <= 55) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 1) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_afternoon_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Afternoon (5-10 min Before Finishing Lunch)', 'afternoon');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // D. NIGHT MEDICINES (At least 5 to 10 minutes before):
    // 1. Night BEFORE Food: (07:50 PM to 08:25 PM — 5-10 mins advance before dinner)
    if ((currentHour === 19 && currentMinute >= 50) || (currentHour === 20 && currentMinute <= 25)) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 2) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_night_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Night (5-10 min Before Dinner)', 'night');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Night AFTER Food: (08:50 PM to 09:25 PM — 5-10 mins advance before finishing dinner)
    if ((currentHour === 20 && currentMinute >= 50) || (currentHour === 21 && currentMinute <= 25)) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 2) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_night_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Night (5-10 min Before Finishing Dinner)', 'night');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // E. 09:30 PM to 10:00 PM Bedtime Adherence Summary for Doctor
    if (currentHour === 21 && currentMinute >= 30) {
      const nightSummaryKey = `wellbeing_night_summary_sent_${todayStr}`;
      if (!localStorage.getItem(nightSummaryKey)) {
        let totalScheduled = 0;
        currentDoc.medicines.forEach((med) => {
          if (hasDoseInSlot(med, 0)) totalScheduled++;
          if (hasDoseInSlot(med, 1)) totalScheduled++;
          if (hasDoseInSlot(med, 2)) totalScheduled++;
        });

        const logs = storageService.getDoseLogs().filter((l) => l.date === todayStr && l.prescriptionId === currentDoc.id);
        const takenCount = logs.filter((l) => l.status === 'taken').length;
        const delayedCount = logs.filter((l) => l.status === 'delayed').length;
        const skippedCount = logs.filter((l) => l.status === 'skipped').length;

        this.sendNightSummary(userName, totalScheduled, takenCount, delayedCount, skippedCount);
        localStorage.setItem(nightSummaryKey, 'true');
      }
    }
  }
}

export const notificationService = new NotificationService();
