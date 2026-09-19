import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Volume2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Smartphone
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  playNotificationSound, 
  sendDeviceNotification, 
  isInIframe, 
  openInNewTab,
  NotificationPermissionState 
} from '../lib/notificationHelper';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export default function NotificationPermissionModal({
  isOpen,
  onClose,
  onPermissionGranted
}: NotificationPermissionModalProps) {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [inIframe, setInIframe] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setInIframe(isInIframe());
      setErrorMessage(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestNativePermission = async () => {
    setErrorMessage(null);
    const result = await requestNotificationPermission();
    setPermission(result.state);

    if (result.state === 'granted') {
      setIsSuccess(true);
      playNotificationSound();
      sendDeviceNotification({
        title: 'Notifikasi SmartSantri Berhasil Aktif!',
        body: 'Perangkat Anda kini siap menerima notifikasi pesan masuk kapan pun.',
        icon: '/logo.svg',
      });
      if (onPermissionGranted) onPermissionGranted();
    } else if (result.state === 'denied') {
      setErrorMessage('Izin notifikasi ditolak oleh browser. Silakan klik ikon gembok di bilah URL untuk mengubah izin situs.');
    } else if (result.inIframe) {
      setErrorMessage('Browser memblokir jendela perizinan karena aplikasi berada di dalam iFrame pratinjau. Silakan gunakan tombol "Buka di Tab Baru" di bawah.');
    }
  };

  const handleOpenInNewTab = () => {
    openInNewTab();
    onClose();
  };

  const handleTestSound = () => {
    setIsTesting(true);
    playNotificationSound();
    sendDeviceNotification({
      title: 'Uji Suara & Notifikasi',
      body: 'Nada dering dua nada khas SmartSantri telah berbunyi di perangkat Anda.',
      icon: '/logo.svg',
    });
    setTimeout(() => setIsTesting(false), 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Pattern */}
        <div className="h-2.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header Icon & Title */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-sm">
                {permission === 'granted' || isSuccess ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in" />
                ) : (
                  <BellRing className="w-8 h-8 text-emerald-600 animate-bounce" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600" />
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isSuccess ? 'Notifikasi Berhasil Diaktifkan!' : 'Aktifkan Notifikasi Perangkat'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
              Dapatkan pemberitahuan seketika di ponsel atau komputer setiap kali ada pesan obrolan masuk.
            </p>
          </div>

          {/* Value Props */}
          <div className="space-y-2.5 mb-5 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70 text-left">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Banner Pop-up Sistem</p>
                <p className="text-[11px] text-slate-500">Muncul di bar notifikasi & layar kunci perangkat.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Volume2 className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Nada Dering Harmonis & Getar</p>
                <p className="text-[11px] text-slate-500">Bunyi dering jernih dan getaran saat ada kiriman pesan baru.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Buka Obrolan Otomatis</p>
                <p className="text-[11px] text-slate-500">Sentuh notifikasi untuk langsung membalas percakapan.</p>
              </div>
            </div>
          </div>

          {/* In-Iframe Explanation Banner (Crucial for AI Studio / Embedded Context) */}
          {inIframe && permission !== 'granted' && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-left">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-900 leading-snug">
                    Mengapa Pop-Up Izin Belum Muncul?
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Browser modern (Chrome, Safari, Edge) <strong>memblokir</strong> pop-up permintaan izin jika aplikasi berada di dalam bingkai pratinjau (iFrame).
                  </p>
                  <p className="text-[11px] text-amber-800 font-semibold mt-1">
                    Silakan buka aplikasi di <u>Tab Baru</u> agar pop-up izin resmi peramban muncul di layar Anda.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Blocked/Denied Notice */}
          {permission === 'denied' && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-left">
              <div className="flex items-start gap-2.5">
                <BellOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-900">Izin Diblokir Browser</p>
                  <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                    Browser Anda telah menandai izin notifikasi sebagai "Blokir". Untuk membukanya, klik ikon gembok / pengaturan situs di sebelah kiri URL browser Anda lalu pilih <strong>Izinkan Notifikasi</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Error Message */}
          {errorMessage && (
            <p className="mb-4 text-xs text-rose-600 font-medium text-center bg-rose-50 py-2 px-3 rounded-xl border border-rose-100">
              {errorMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {inIframe && permission !== 'granted' ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Tab Baru &amp; Izinkan Notifikasi</span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestNativePermission}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                  <span>Coba Munculkan Izin di Tab Ini</span>
                </button>
              </>
            ) : permission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestNativePermission}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Izinkan Notifikasi Sekarang</span>
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center mb-2">
                <p className="text-xs font-bold text-emerald-800">Status: Notifikasi Telah Aktif</p>
                <p className="text-[11px] text-emerald-600">Perangkat Anda siap menerima peringatan.</p>
              </div>
            )}

            {/* Test Audio Button */}
            <button
              type="button"
              onClick={handleTestSound}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-2xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Volume2 className={`w-4 h-4 text-emerald-600 ${isTesting ? 'animate-ping' : ''}`} />
              <span>{isTesting ? 'Memutar Nada Dering...' : 'Uji Coba Suara Dering Notifikasi'}</span>
            </button>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('smartsantri_notif_modal_dismissed', 'true');
                onClose();
              }}
              className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
