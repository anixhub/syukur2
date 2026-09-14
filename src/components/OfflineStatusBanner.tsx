import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Cloud, Database, X, AlertCircle } from 'lucide-react';
import { subscribeSyncStatus, processOfflineQueue, SyncStatus } from '../lib/offlineSync';

export default function OfflineStatusBanner() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
  });

  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showReconnectedAlert, setShowReconnectedAlert] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((newStatus) => {
      setStatus(newStatus);

      if (!newStatus.isOnline) {
        setWasOffline(true);
      } else if (wasOffline && newStatus.isOnline) {
        // Trigger temporary reconnected celebration pill
        setShowReconnectedAlert(true);
        const timer = setTimeout(() => {
          setShowReconnectedAlert(false);
          setWasOffline(false);
        }, 4500);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, [wasOffline]);

  const handleManualSync = async () => {
    await processOfflineQueue();
  };

  // If online, not syncing, no pending mutations, and not showing reconnection alert -> don't render anything to keep UI clean
  if (status.isOnline && !status.isSyncing && status.pendingCount === 0 && !showReconnectedAlert) {
    return null;
  }

  return (
    <>
      {/* Floating Status Pill */}
      <div 
        id="offline-status-banner-container"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 max-w-[calc(100vw-32px)] transition-all duration-300 pointer-events-auto"
      >
        {/* Offline Banner State */}
        {!status.isOnline ? (
          <div 
            id="offline-banner-pill"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-900/90 hover:bg-amber-900 text-white shadow-xl backdrop-blur-md border border-amber-500/40 text-xs sm:text-sm font-medium transition-all"
          >
            <div className="relative flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
            </div>

            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-amber-100 flex items-center gap-1.5">
                Mode Offline Aktif
                {status.pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                    {status.pendingCount} tersimpan lokal
                  </span>
                )}
              </span>
              <span className="text-[11px] text-amber-200/80 hidden sm:inline">
                Aplikasi tetap berjalan menggunakan data lokal di komputer ini.
              </span>
            </div>

            <button
              id="btn-offline-detail"
              onClick={() => setShowDetailModal(true)}
              className="ml-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-amber-100 font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
              title="Pelajari cara kerja mode offline"
            >
              Info
            </button>
          </div>
        ) : status.isSyncing ? (
          /* Syncing State */
          <div 
            id="syncing-banner-pill"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-950/90 text-white shadow-xl backdrop-blur-md border border-emerald-500/40 text-xs sm:text-sm font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4 text-emerald-300 animate-spin" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-emerald-100">
                Menyinkronkan ke Server...
              </span>
              <span className="text-[11px] text-emerald-300/80">
                {status.pendingCount > 0 ? `${status.pendingCount} data sedang dikirim ke database` : 'Memperbarui data pusat'}
              </span>
            </div>
          </div>
        ) : showReconnectedAlert ? (
          /* Reconnected Alert State */
          <div 
            id="reconnected-banner-pill"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-900/90 text-white shadow-xl backdrop-blur-md border border-emerald-400/40 text-xs sm:text-sm font-medium transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-emerald-100">
                Terhubung Kembali
              </span>
              <span className="text-[11px] text-emerald-200/80">
                Internet aktif, semua data tersinkron sempurna.
              </span>
            </div>
            <button
              onClick={() => setShowReconnectedAlert(false)}
              className="p-1 text-emerald-300 hover:text-white transition-colors rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : status.pendingCount > 0 ? (
          /* Online with Pending Changes */
          <div 
            id="pending-sync-banner-pill"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 text-white shadow-xl backdrop-blur-md border border-slate-700 text-xs sm:text-sm font-medium transition-all"
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-slate-100">
                {status.pendingCount} Perubahan Belum Disinkron
              </span>
              <span className="text-[11px] text-slate-400">
                Klik sinkronkan untuk memperbarui database pusat
              </span>
            </div>
            <button
              id="btn-manual-sync-now"
              onClick={handleManualSync}
              className="ml-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              Sinkronkan
            </button>
          </div>
        ) : null}
      </div>

      {/* Offline Info Modal */}
      {showDetailModal && (
        <div 
          id="offline-info-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            id="offline-info-modal-content"
            className="w-full max-w-md bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Status Koneksi: Mode Offline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem Penyimpanan Cerdas Santri
                  </p>
                </div>
              </div>
              <button
                id="btn-close-offline-modal"
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Apakah data saya tetap aman?</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong>Ya, 100% aman.</strong> Aplikasi Go AttarOkey dilengkapi fitur <em>Local-First Caching</em>. Seluruh data santri, kamar, dan riwayat yang pernah Anda buka tersimpan di komputer ini.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Yang dapat Anda lakukan saat offline:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Melihat seluruh data santri, kamar, dan riwayat.</li>
                  <li>Melakukan pencarian, filtering, dan melihat statistik.</li>
                  <li>Menginput santri baru atau mengedit data (disimpan di komputer ini).</li>
                  <li>Mencetak laporan yang sudah terunduh.</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Sinkronisasi Otomatis</p>
                  <p className="text-amber-800/90 mt-0.5">
                    Ketika komputer terhubung kembali ke internet, aplikasi akan <strong>otomatis menyinkronkan</strong> semua perubahan ke database server MySQL tanpa perlu tindakan manual.
                  </p>
                </div>
              </div>

              {status.pendingCount > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg text-xs">
                  <span className="text-slate-600">Perubahan tertunda saat ini:</span>
                  <span className="font-bold text-slate-900 px-2 py-0.5 bg-white rounded-md border border-slate-200">
                    {status.pendingCount} item
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                id="btn-retry-sync"
                onClick={handleManualSync}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${status.isSyncing ? 'animate-spin' : ''}`} />
                Coba Sinkronkan Sekarang
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
