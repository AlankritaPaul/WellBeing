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

  // Play a LOUD, rich, resonant medical alarm chime sequence
  // Designed to cut through background noise and ring loud and clear on phone/laptop speakers
  public playAlertChime(): void {
    try {
      const ctx = this.initAudio();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Master Compressor to maximize acoustic loudness without clipping
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-15, now);
      compressor.knee.setValueAtTime(20, now);
      compressor.ratio.setValueAtTime(8, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.2, now);
      compressor.connect(ctx.destination);

      // Master Gain for full loud volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.95, now);
      masterGain.connect(compressor);

      // Helper to synthesize a crisp, resonant bell tone with harmonic overtones
      const playBellTone = (freq: number, startTime: number, duration: number, gainLevel: number) => {
        // Fundamental frequency
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        // Harmonic overtone (2x freq for bright bell clarity)
        const harm = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harm.type = 'sine';
        harm.frequency.setValueAtTime(freq * 2, startTime);
        harmGain.gain.setValueAtTime(0, startTime);
        harmGain.gain.linearRampToValueAtTime(gainLevel * 0.45, startTime + 0.015);
        harmGain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 0.7);
        harm.connect(harmGain);
        harmGain.connect(masterGain);
        harm.start(startTime);
        harm.stop(startTime + duration + 0.05);
      };

      // Two complete cycles of a distinct 3-tone ascending hospital alarm chime:
      // Cycle 1:
      playBellTone(587.33, now, 0.45, 0.90);        // D5 (0.00s)
      playBellTone(739.99, now + 0.18, 0.45, 0.90); // F#5 (0.18s)
      playBellTone(880.00, now + 0.36, 0.85, 0.98); // A5 (0.36s)

      // Cycle 2 (Repeats loud for urgent notice):
      playBellTone(587.33, now + 0.90, 0.45, 0.90); // D5 (0.90s)
      playBellTone(739.99, now + 1.08, 0.45, 0.90); // F#5 (1.08s)
      playBellTone(1174.66, now + 1.26, 1.20, 1.0); // D6 (1.26s) High resolution bell
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }

    // Trigger physical mobile phone vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400, 150, 600]);
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

  // 1. Morning Daily Overview Notification (08:00 AM)
  // Reminds patient of their full day course before leaving home
  public sendMorningBriefing(userName: string, prescription: ScannedPrescription): boolean {
    const meds = prescription.medicines || [];
    if (meds.length === 0) return false;

    const medNames = meds.map((m) => `${m.name} (${m.timing === 'before_food' ? 'Before food' : 'After food'})`).join(', ');
    const title = `☀️ Good Morning ${userName ? userName : 'Patient'}! Today's Medicine Plan`;
    const body = `Your Full Day Course: ${medNames}.\nPlease pack your medicine strips with you before leaving home so you don't forget!`;

    this.sendNotification(title, {
      body,
      tag: `wellbeing-morning-${new Date().toISOString().split('T')[0]}`,
    });
    return true;
  }

  // 2. INDIVIDUAL MEDICINE REMINDER (One by One, strictly separating Before Food and After Food!)
  public sendSingleMedicineReminder(
    userName: string, 
    med: Medication, 
    timeLabel: string, 
    slotType: 'morning' | 'afternoon' | 'night'
  ): boolean {
    const isBeforeFood = med.timing === 'before_food';
    const timingBadge = isBeforeFood ? 'Take BEFORE Food' : 'Take AFTER Food';
    const instructions = isBeforeFood 
      ? 'on an empty stomach, 30 minutes before your meal.'
      : 'after having your meal.';

    const title = `${isBeforeFood ? '⚠️' : '💊'} ${timingBadge}: ${med.name} (${med.dosage})`;
    const body = `${userName ? `${userName}, please ` : 'Please '}take ${med.name} (${med.dosage}) now ${instructions}\nTap to mark as Taken, Delay, or Skip.`;

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

    // A. 08:00 AM Morning Full-Day Overview Briefing
    if (currentHour === 8 && currentMinute >= 0 && currentMinute <= 15) {
      const briefingKey = `wellbeing_briefing_sent_${todayStr}`;
      if (!localStorage.getItem(briefingKey)) {
        this.sendMorningBriefing(userName, currentDoc);
        localStorage.setItem(briefingKey, 'true');
      }
    }

    // B. MORNING MEDICINES:
    // 1. Morning BEFORE Food (07:30 AM to 08:15 AM)
    if (currentHour === 7 && currentMinute >= 30 || (currentHour === 8 && currentMinute <= 15)) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 0) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_morning_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Morning (Before Breakfast)', 'morning');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Morning AFTER Food (08:30 AM to 09:15 AM)
    if (currentHour === 8 && currentMinute >= 30 || (currentHour === 9 && currentMinute <= 15)) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 0) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_morning_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Morning (After Breakfast)', 'morning');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // C. AFTERNOON MEDICINES:
    // 1. Afternoon BEFORE Food (12:45 PM to 01:15 PM)
    if ((currentHour === 12 && currentMinute >= 45) || (currentHour === 13 && currentMinute <= 15)) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 1) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_afternoon_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Afternoon (Before Lunch)', 'afternoon');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Afternoon AFTER Food (01:45 PM to 02:30 PM)
    if ((currentHour === 13 && currentMinute >= 45) || (currentHour === 14 && currentMinute <= 30)) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 1) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_afternoon_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Afternoon (After Lunch)', 'afternoon');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // D. NIGHT MEDICINES:
    // 1. Night BEFORE Food (07:45 PM to 08:30 PM)
    if ((currentHour === 19 && currentMinute >= 45) || (currentHour === 20 && currentMinute <= 30)) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 2) && med.timing === 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_night_beforefood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Night (Before Dinner)', 'night');
            localStorage.setItem(medKey, 'true');
          }
        }
      });
    }

    // 2. Night AFTER Food (09:00 PM to 09:45 PM)
    if (currentHour === 21 && currentMinute >= 0 && currentMinute <= 45) {
      currentDoc.medicines.forEach((med) => {
        if (hasDoseInSlot(med, 2) && med.timing !== 'before_food') {
          const medKey = `wellbeing_dose_${med.id}_night_afterfood_${todayStr}`;
          if (!localStorage.getItem(medKey)) {
            this.sendSingleMedicineReminder(userName, med, 'Night (After Dinner)', 'night');
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
