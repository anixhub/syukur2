import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Bell, 
  UserPlus, 
  ArrowRight, 
  CheckCheck, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  BookOpen,
  DollarSign,
  X
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'registration' | 'system' | 'academic' | 'finance';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationsPageProps {
  isOpen: boolean;
  onClose: () => void;
  pendingRegistrationsCount: number;
  onOpenPendingModal?: () => void;
  isMobile?: boolean;
}

export default function NotificationsPage({
  isOpen,
  onClose,
  pendingRegistrationsCount,
  onOpenPendingModal,
  isMobile: isMobileProp
}: NotificationsPageProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'registration' | 'system'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Detect mobile width if prop not provided
  const [isMobileWindow, setIsMobileWindow] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileWindow(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileWindow;

  // Listen to Escape key to close on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Base list of notifications
  const notifications: NotificationItem[] = [
    ...(pendingRegistrationsCount > 0
      ? [
          {
            id: 'pending-reg',
            type: 'registration' as const,
            title: `Permohonan Akun Pengurus Baru (${pendingRegistrationsCount})`,
            description: `Terdapat ${pendingRegistrationsCount} pengurus baru yang telah mendaftar dan menunggu verifikasi serta persetujuan dari Superadmin.`,
            time: 'Baru saja',
            isRead: false,
            actionLabel: 'Tinjau Pendaftar',
            onAction: () => {
              onClose();
              if (onOpenPendingModal) onOpenPendingModal();
            }
          }
        ]
      : []),
    {
      id: 'sys-sync',
      type: 'system',
      title: 'Sinkronisasi Data Santri Berhasil',
      description: 'Seluruh arsip data induk santri dan riwayat kamar telah berhasil diperbarui dan sinkron dengan basis data lokal.',
      time: '25 menit yang lalu',
      isRead: false
    },
    {
      id: 'fin-recap',
      type: 'finance',
      title: 'Rekapitulasi Syahriah Bulanan',
      description: 'Laporan keuangan dan pembayaran syahriah periode berjalan telah siap diunduh oleh Bendahara Pesantren.',
      time: '2 jam yang lalu',
      isRead: true
    },
    {
      id: 'acad-grade',
      type: 'academic',
      title: 'Pemutakhiran Nilai Ujian Semester',
      description: 'Bagian Pendidikan telah merilis daftar evaluasi kitab dan setoran tahfidz santri kelas wustha.',
      time: 'Kemarin, 16:30',
      isRead: true
    },
    {
      id: 'sec-backup',
      type: 'system',
      title: 'Pencadangan Sistem Otomatis',
      description: 'Cadangan data harian berhasil diamankan dengan enkripsi standar sistem AttarOkey.',
      time: '2 hari yang lalu',
      isRead: true
    }
  ];

  const handleMarkAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
  };

  const handleToggleRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredNotifications = notifications.filter(item => {
    const isItemRead = item.isRead || readIds.has(item.id);
    if (activeFilter === 'unread') return !isItemRead;
    if (activeFilter === 'registration') return item.type === 'registration';
    if (activeFilter === 'system') return item.type === 'system';
    return true;
  });

  const unreadCount = notifications.filter(n => !(n.isRead || readIds.has(n.id))).length;

  if (!isOpen) return null;

  return (
    <motion.div
      id="notifications-panel"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.32 }}
      className={`fixed top-0 bottom-0 right-0 z-50 md:z-40 bg-white flex flex-col overflow-hidden select-none border-l border-slate-200/90 shadow-2xl ${
        isMobile 
          ? 'left-0 w-full h-full' 
          : 'w-[380px] h-screen'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 py-3 w-full border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {/* Back Button matching search page on mobile, or back button on desktop */}
            <button
              id="btn-back-notifications"
              type="button"
              onClick={onClose}
              className="p-2 -ml-2 text-gray-700 hover:text-gray-950 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors shrink-0 cursor-pointer"
              aria-label="Kembali"
              title={isMobile ? "Kembali ke halaman sebelumnya" : "Tutup panel notifikasi"}
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>

            {/* Page Title */}
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                Notifikasi
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-600 border border-rose-200">
                  {unreadCount} Baru
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
                title="Tandai semua sebagai sudah dibaca"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Tandai Dibaca</span>
              </button>
            )}

            {/* Desktop direct close button */}
            {!isMobile && (
              <button
                id="btn-close-notifications-panel"
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Tutup Notifikasi (Esc)"
                aria-label="Tutup Notifikasi"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 mt-3.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'unread'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>
          {pendingRegistrationsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('registration')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'registration'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              Pendaftaran ({pendingRegistrationsCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveFilter('system')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeFilter === 'system'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sistem
          </button>
        </div>
      </div>

      {/* Notifications List Content */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 bg-slate-50/50">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Bell className="w-8 h-8 stroke-1" />
            </div>
            <p className="text-base font-bold text-slate-700">Tidak ada notifikasi</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Semua pemberitahuan sistem telah diperiksa. Anda akan mendapatkan update saat ada aktivitas baru.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isItemRead = item.isRead || readIds.has(item.id);

            const getIcon = () => {
              switch (item.type) {
                case 'registration':
                  return <UserPlus className="w-5 h-5 text-purple-600" />;
                case 'finance':
                  return <DollarSign className="w-5 h-5 text-emerald-600" />;
                case 'academic':
                  return <BookOpen className="w-5 h-5 text-blue-600" />;
                default:
                  return <ShieldCheck className="w-5 h-5 text-slate-600" />;
              }
            };

            const getBg = () => {
              switch (item.type) {
                case 'registration':
                  return 'bg-purple-100/80';
                case 'finance':
                  return 'bg-emerald-100/80';
                case 'academic':
                  return 'bg-blue-100/80';
                default:
                  return 'bg-slate-100';
              }
            };

            return (
              <div
                key={item.id}
                onClick={() => handleToggleRead(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isItemRead
                    ? 'bg-white border-slate-200/80 text-slate-700'
                    : 'bg-white border-slate-300 shadow-sm text-slate-900 ring-1 ring-slate-100'
                }`}
              >
                {!isItemRead && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                )}

                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${getBg()}`}>
                    {getIcon()}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm tracking-tight ${isItemRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {item.time}
                      </span>

                      {item.actionLabel && item.onAction && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            item.onAction!();
                          }}
                          className="ml-auto px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Minimal Footer */}
      <div className="p-3 bg-white border-t border-slate-100 text-center shrink-0">
        <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Sistem Notifikasi AttarOkey Realtime
        </p>
      </div>
    </motion.div>
  );
}
