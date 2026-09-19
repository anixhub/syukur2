/**
 * Notification Helper for SmartSantri
 * Manages Web Audio Chime, Device Vibration, In-App Notifications,
 * and Native OS / Browser Notifications.
 */

// Synthesize pleasant chime using Web Audio API (Zero external mp3 dependencies, 100% offline & reliable)
let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

export function unlockAudioContext(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    } else {
      isAudioUnlocked = true;
    }
  } catch (e) {}
}

// Auto unlock audio context on very first user interaction anywhere on the page
if (typeof window !== 'undefined') {
  const handleInteractionUnlock = () => {
    unlockAudioContext();
    window.removeEventListener('click', handleInteractionUnlock);
    window.removeEventListener('touchstart', handleInteractionUnlock);
    window.removeEventListener('keydown', handleInteractionUnlock);
  };
  window.addEventListener('click', handleInteractionUnlock, { once: true, passive: true });
  window.addEventListener('touchstart', handleInteractionUnlock, { once: true, passive: true });
  window.addEventListener('keydown', handleInteractionUnlock, { once: true, passive: true });
}

function playChime(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;

    // Tone 1: Warm D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.28, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.23);

    // Tone 2: Melodic A5 (880.00 Hz) - 100ms later for signature two-tone chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.1);

    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.32, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.46);
  } catch (err) {
    console.warn('[NotificationSound] Oscillator schedule error:', err);
  }
}

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
      audioCtx.resume().then(() => {
        if (audioCtx) playChime(audioCtx);
      }).catch(() => {
        // Autoplay policy prevented playback, will play on subsequent user gesture
      });
    } else {
      playChime(audioCtx);
    }
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

export function openInNewTab(path: string = '/'): void {
  if (typeof window === 'undefined') return;
  const baseUrl = window.location.origin;
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  window.open(url, '_blank', 'noopener,noreferrer');
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

  // Ensure AudioContext is unlocked during this user-initiated permission click
  unlockAudioContext();

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
      error: inIframe 
        ? 'Browser membatasi pop-up perizinan di dalam iFrame. Silakan buka aplikasi di tab baru.' 
        : (e?.message || 'Gagal meminta izin notifikasi.')
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
  channel?: string;
  senderAvatar?: string;
  data?: any;
  playSound?: boolean;
  onClick?: () => void;
}

/**
 * Sends a native device/browser notification with sound & vibration,
 * and emits an in-app notification event for foreground displays.
 */
export async function sendDeviceNotification(options: SendDeviceNotificationOptions): Promise<boolean> {
  // 1. Play sound & vibration if enabled
  if (options.playSound !== false) {
    playNotificationSound();
  }
  triggerDeviceVibration([180, 90, 180]);

  // 2. Broadcast in-app notification event so active pages can show a toast banner
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('smartsantri-in-app-notification', {
        detail: {
          title: options.title,
          body: options.body,
          icon: options.icon || options.senderAvatar || '/logo.svg',
          channel: options.channel || 'semua',
          onClick: options.onClick,
        }
      }));
    } catch (e) {}
  }

  // 3. If Notification API is not available or not granted, return early
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationTitle = options.title || 'SmartSantri Pesan Masuk';
  const notificationOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || options.senderAvatar || '/logo.svg',
    badge: options.badge || '/logo.svg',
    tag: options.tag || `smartsantri-${Date.now()}`,
    data: {
      url: options.url || '/',
      channel: options.channel || 'semua',
      ...options.data,
    },
  };

  let notificationShown = false;

  // 4. Try Service Worker showNotification first (crucial for Android / Mobile PWA)
  if ('serviceWorker' in navigator) {
    try {
      // Use getRegistration() with a short timeout so we NEVER hang if no SW is active
      const reg = await Promise.race([
        navigator.serviceWorker.getRegistration(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 250))
      ]);

      if (reg && 'showNotification' in reg && reg.active) {
        await reg.showNotification(notificationTitle, notificationOptions);
        notificationShown = true;
      }
    } catch (err) {
      console.warn('[Notification] Service worker showNotification fallback:', err);
    }
  }

  // 5. Fallback to standard window Notification constructor if not shown via SW
  if (!notificationShown) {
    try {
      const notif = new Notification(notificationTitle, notificationOptions);
      notif.onclick = () => {
        window.focus();
        notif.close();
        if (options.onClick) {
          options.onClick();
        }
      };
      notificationShown = true;
    } catch (err) {
      console.warn('[Notification] Standard notification fallback:', err);
    }
  }

  return notificationShown;
}
