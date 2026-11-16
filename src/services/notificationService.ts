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
      masterGain.gain.setValueAtTime(0.9, now);
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
        harmGain.gain.linearRampToValueAtTime(gainLevel * 0.4, startTime + 0.015);
        harmGain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 0.7);
        harm.connect(harmGain);
        harmGain.connect(masterGain);
        harm.start(startTime);
        harm.stop(startTime + duration + 0.05);
      };

      // Two complete cycles of a distinct 3-tone ascending hospital alarm chime:
      // Cycle 1:
      playBellTone(587.33, now, 0.45, 0.85);        // D5 (0.00s)
      playBellTone(739.99, now + 0.18, 0.45, 0.85); // F#5 (0.18s)
      playBellTone(880.00, now + 0.36, 0.85, 0.95); // A5 (0.36s)

      // Cycle 2 (Repeats loud for urgent notice):
      playBellTone(587.33, now + 0.90, 0.45, 0.85); // D5 (0.90s)
      playBellTone(739.99, now + 1.08, 0.45, 0.85); // F#5 (1.08s)
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

      // Use ServiceWorkerRegistration when available (enables action buttons like WhatsApp/Flipkart on Android)
      if (this.swRegistration && 'showNotification' in this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          ...options,
        });
        return true;
      }

      // Fallback to standard Window Notification
      const notif = new Notification(title, {
        icon: '/favicon.svg',
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

  // 1. Morning Daily Overview Notification (e.g. 8:00 AM)
  // Reminds patient of their full day course before leaving home
  public sendMorningBriefing(userName: string, prescription: ScannedPrescription): boolean {
    const meds = prescription.medicines || [];
    if (meds.length === 0) return false;

    const medNames = meds.map((m) => `${m.name} (${m.dosage})`).join(', ');
    const title = `☀️ Good Morning ${userName ? userName : 'Patient'}! Today's Medicine Plan`;
    const body = `Full Day Course: ${medNames}.\nTake your medicines with you before leaving home so you don't forget!`;

    this.sendNotification(title, {
      body,
      tag: `wellbeing-morning-${new Date().toISOString().split('T')[0]}`,
    });
    return true;
  }

  // 2. Scheduled Time-of-Dose Pill Reminder (Morning, Afternoon, Night)
  // Pops up notification on device + dispatches event for immediate in-app popup modal
  public sendDoseReminder(userName: string, slotLabel: string, medicines: Medication[]): boolean {
    if (medicines.length === 0) return false;

    const medList = medicines.map((m) => `${m.name} (${m.dosage})`).join(', ');
    const title = `⏰ Time for your ${slotLabel} Medicine!`;
    const body = `${userName ? `${userName}, ` : ''}Please take: ${medList}.\nTap to open WellBeing and mark as Taken, Delay or Skip.`;

    // 1. Send device notification with lockscreen action buttons (like WhatsApp/Flipkart)
    const options: NotificationOptions & { actions?: Array<{ action: string; title: string }> } = {
      body,
      tag: `wellbeing-dose-${slotLabel.toLowerCase().replace(/[^a-z0-9]/g, '')}-${new Date().toISOString().split('T')[0]}`,
      requireInteraction: true,
      actions: [
        { action: 'taken', title: '✓ Taken' },
        { action: 'delayed', title: '⏱ Delay (15m)' },
        { action: 'skipped', title: '✕ Skip' },
      ],
      data: { slotLabel, medicines, userName },
    };

    this.sendNotification(title, options as NotificationOptions);

    // 2. Dispatch custom event so the Instant In-App Popup Modal pops up on screen immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wellbeing_dose_alarm_popup', {
          detail: { slotLabel, medicines, userName, timestamp: Date.now() },
        })
      );
    }

    return true;
  }

  // 3. Night / End-of-Day Adherence Summary Report (e.g. 9:30 PM)
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
  // Runs automatically every 30 seconds and checks device time without any manual clicks
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

    // Helper: slot medicines
    const getSlotMeds = (slotIndex: 0 | 1 | 2) => {
      return (currentDoc.medicines || []).filter((med) => {
        const freq = med.frequency || '1-0-0';
        if (freq.includes('-')) {
          const parts = freq.split('-').map((p) => parseInt(p.trim(), 10) || 0);
          return parts[slotIndex] && parts[slotIndex] > 0;
        }
        return slotIndex === 0;
      });
    };

    // A. 8:00 AM - Morning Briefing & Morning Dose
    if (currentHour === 8 && currentMinute >= 0 && currentMinute <= 15) {
      const briefingKey = `wellbeing_briefing_sent_${todayStr}`;
      if (!localStorage.getItem(briefingKey)) {
        this.sendMorningBriefing(userName, currentDoc);
        localStorage.setItem(briefingKey, 'true');
      }

      const morningDoseKey = `wellbeing_morning_dose_sent_${todayStr}`;
      const morningMeds = getSlotMeds(0);
      if (morningMeds.length > 0 && !localStorage.getItem(morningDoseKey)) {
        this.sendDoseReminder(userName, 'Morning (08:00 AM)', morningMeds);
        localStorage.setItem(morningDoseKey, 'true');
      }
    }

    // B. 1:00 PM (13:00) - Afternoon Dose
    if (currentHour === 13 && currentMinute >= 0 && currentMinute <= 15) {
      const afternoonDoseKey = `wellbeing_afternoon_dose_sent_${todayStr}`;
      const afternoonMeds = getSlotMeds(1);
      if (afternoonMeds.length > 0 && !localStorage.getItem(afternoonDoseKey)) {
        this.sendDoseReminder(userName, 'Afternoon (01:00 PM)', afternoonMeds);
        localStorage.setItem(afternoonDoseKey, 'true');
      }
    }

    // C. 9:00 PM (21:00) - Night Dose
    if (currentHour === 21 && currentMinute >= 0 && currentMinute <= 15) {
      const nightDoseKey = `wellbeing_night_dose_sent_${todayStr}`;
      const nightMeds = getSlotMeds(2);
      if (nightMeds.length > 0 && !localStorage.getItem(nightDoseKey)) {
        this.sendDoseReminder(userName, 'Night (09:00 PM)', nightMeds);
        localStorage.setItem(nightDoseKey, 'true');
      }
    }

    // D. 9:30 PM (21:30) - End of Day Adherence Summary for Doctor
    if (currentHour === 21 && currentMinute >= 30 && currentMinute <= 55) {
      const nightSummaryKey = `wellbeing_night_summary_sent_${todayStr}`;
      if (!localStorage.getItem(nightSummaryKey)) {
        const morningMeds = getSlotMeds(0);
        const afternoonMeds = getSlotMeds(1);
        const nightMeds = getSlotMeds(2);
        const totalScheduled = morningMeds.length + afternoonMeds.length + nightMeds.length;

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
