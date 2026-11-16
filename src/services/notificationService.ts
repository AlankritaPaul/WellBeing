import type { ScannedPrescription, Medication } from '../types/prescription';
import { storageService } from './storageService';

// Browser & Device Native Notification Service
// 100% money-free, zero account, operating via standard Web Notifications & Web Audio API
class NotificationService {
  private schedulerInterval: number | null = null;
  private audioContext: AudioContext | null = null;

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
      // Also initialize AudioContext on user interaction
      this.initAudio();
      return permission;
    } catch (e) {
      console.warn('Could not request notification permission:', e);
      return this.getPermission();
    }
  }

  // Play a pleasant, gentle two-tone medical chime using Web Audio API
  public playAlertChime(): void {
    try {
      const ctx = this.initAudio();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Note 1: 587.33 Hz (D5) - gentle bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // Note 2: 880 Hz (A5) - chime resolution
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.2);
      gain2.gain.setValueAtTime(0, now + 0.2);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.95);
    } catch (e) {
      console.warn('Audio chime playback error:', e);
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

  // Generic sender with sound and focus capability
  public sendNotification(title: string, options: NotificationOptions = {}): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      this.playAlertChime();

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

    return this.sendNotification(title, {
      body,
      tag: `wellbeing-morning-${new Date().toISOString().split('T')[0]}`,
    });
  }

  // 2. Scheduled Time-of-Dose Pill Reminder (Morning, Afternoon, Night)
  public sendDoseReminder(userName: string, slotLabel: string, medicines: Medication[]): boolean {
    if (medicines.length === 0) return false;

    const medList = medicines.map((m) => `${m.name} (${m.dosage})`).join(', ');
    const title = `⏰ Time for your ${slotLabel} Medicine!`;
    const body = `${userName ? `${userName}, ` : ''}Please take: ${medList}.\nTap to open WellBeing and mark as Taken or Delay.`;

    return this.sendNotification(title, {
      body,
      tag: `wellbeing-dose-${slotLabel.toLowerCase()}-${new Date().toISOString().split('T')[0]}`,
      requireInteraction: true,
    });
  }

  // 3. Night / End-of-Day Adherence Summary Report (e.g. 9:30 PM)
  public sendNightSummary(userName: string, totalScheduled: number, takenCount: number, delayedCount: number, skippedCount: number): boolean {
    const title = `🌙 Daily Medicine Summary for ${userName ? userName : 'Today'}`;
    const adherencePercent = totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;
    
    let detail = `${takenCount} of ${totalScheduled} taken (${adherencePercent}%)`;
    if (delayedCount > 0) detail += `, ${delayedCount} delayed`;
    if (skippedCount > 0) detail += `, ${skippedCount} skipped`;

    const body = `${detail}.\nAll doses are safely saved in your report to show your doctor on your next visit!`;

    return this.sendNotification(title, {
      body,
      tag: `wellbeing-night-${new Date().toISOString().split('T')[0]}`,
    });
  }

  // Background Auto-Scheduler
  // Checks current time every 30 seconds and delivers timely notifications
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

  private checkAndDeliverScheduledAlerts(): void {
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
    if (currentHour === 8 && currentMinute >= 0 && currentMinute <= 10) {
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
    if (currentHour === 13 && currentMinute >= 0 && currentMinute <= 10) {
      const afternoonDoseKey = `wellbeing_afternoon_dose_sent_${todayStr}`;
      const afternoonMeds = getSlotMeds(1);
      if (afternoonMeds.length > 0 && !localStorage.getItem(afternoonDoseKey)) {
        this.sendDoseReminder(userName, 'Afternoon (01:00 PM)', afternoonMeds);
        localStorage.setItem(afternoonDoseKey, 'true');
      }
    }

    // C. 9:00 PM (21:00) - Night Dose
    if (currentHour === 21 && currentMinute >= 0 && currentMinute <= 10) {
      const nightDoseKey = `wellbeing_night_dose_sent_${todayStr}`;
      const nightMeds = getSlotMeds(2);
      if (nightMeds.length > 0 && !localStorage.getItem(nightDoseKey)) {
        this.sendDoseReminder(userName, 'Night (09:00 PM)', nightMeds);
        localStorage.setItem(nightDoseKey, 'true');
      }
    }

    // D. 9:30 PM (21:30) - End of Day Adherence Summary for Doctor
    if (currentHour === 21 && currentMinute >= 30 && currentMinute <= 45) {
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
