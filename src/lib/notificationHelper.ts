/**
 * Notification Helper for SmartSantri
 * Manages Web Audio Chime, Device Vibration, and Native OS / Browser Notifications.
 */

// Synthesize pleasant chime using Web Audio API (Zero external mp3 dependencies, 100% offline & reliable)
let audioCtx: AudioContext | null = null;

export function playNotificationSound(): void {
  try {
    const isSoundEnabled = localStorage.getItem('smartsantri_sound_enabled') !== 'false';
    if (!isSoundEnabled) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Tone 1: Warm D5 (587.33 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.23);

    // Tone 2: Bright A5 (880.00 Hz) - 100ms later for melodic two-tone chime
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.1);

    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.46);
  } catch (err) {
    console.warn('[NotificationSound] Could not play audio chime:', err);
  }
}

export function triggerDeviceVibration(pattern: number[] = [150, 80, 150]): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Ignore vibration restrictions
  }
}

export function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export function openInNewTab(url?: string): void {
  if (typeof window === 'undefined') return;
  const target = url || window.location.href;
  window.open(target, '_blank', 'noopener,noreferrer');
}

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<{
  state: NotificationPermissionState;
  inIframe: boolean;
  error?: string;
}> {
  const inIframe = isInIframe();
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { state: 'unsupported', inIframe };
  }

  // If inside an iframe, browsers like Chrome disallow calling requestPermission()
  if (inIframe) {
    console.warn('[Notification] Calling requestPermission from within an iframe is restricted by browser security policy.');
  }

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('smartsantri_notification_permission', permission);
    return { state: permission, inIframe };
  } catch (e: any) {
    console.warn('[Notification] Error requesting permission:', e);
    const state = Notification.permission;
    return { 
      state, 
      inIframe, 
      error: e?.message || 'Permintaan izin notifikasi dibatasi oleh browser di dalam iFrame.' 
    };
  }
}

export interface SendDeviceNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: any;
  onClick?: () => void;
}

/**
 * Sends a native device/browser notification with sound & vibration
 */
export async function sendDeviceNotification(options: SendDeviceNotificationOptions): Promise<boolean> {
  // Always trigger sound and vibration regardless of visual banner permission
  playNotificationSound();
  triggerDeviceVibration([180, 90, 180]);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationTitle = options.title || 'SmartSantri Pesan Masuk';
  const notificationOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || '/logo.svg',
    badge: options.badge || '/logo.svg',
    tag: options.tag || 'smartsantri-msg',
    data: {
      url: options.url || '/',
      ...options.data,
    },
  };

  // Try Service Worker registration first (better support on mobile / PWA)
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(notificationTitle, notificationOptions);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Notification] Service worker notification fallback:', err);
  }

  // Fallback to standard window Notification
  try {
    const notif = new Notification(notificationTitle, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
      if (options.onClick) {
        options.onClick();
      }
    };
    return true;
  } catch (err) {
    console.warn('[Notification] Standard notification fallback failed:', err);
    return false;
  }
}
