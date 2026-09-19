import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, X, ArrowRight, BellRing } from 'lucide-react';

export interface ChatToastData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  channel?: string;
  onClick?: () => void;
}

interface ChatNotificationToastProps {
  onOpenChat: (channel?: string) => void;
}

export const ChatNotificationToast: React.FC<ChatNotificationToastProps> = ({ onOpenChat }) => {
  const [activeToast, setActiveToast] = useState<ChatToastData | null>(null);
  const timerRef = useRef<any>(null);

  const dismissToast = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActiveToast(null);
  };

  useEffect(() => {
    const handleInAppNotification = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const detail = customEvent.detail;
      if (!detail) return;

      const newToast: ChatToastData = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: detail.title || 'Pesan Baru',
        body: detail.body || '',
        icon: detail.icon || '/logo.svg',
        channel: detail.channel || 'semua',
        onClick: detail.onClick,
      };

      setActiveToast(newToast);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 5500);
    };

    window.addEventListener('smartsantri-in-app-notification', handleInAppNotification);
    return () => {
      window.removeEventListener('smartsantri-in-app-notification', handleInAppNotification);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!activeToast) return null;

  const handleClick = () => {
    if (activeToast.onClick) {
      activeToast.onClick();
    } else {
      onOpenChat(activeToast.channel);
    }
    dismissToast();
  };

  return (
    <div 
      id="chat-notification-toast-container"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-9999 max-w-[92vw] sm:max-w-sm w-full animate-in slide-in-from-top-3 fade-in duration-200"
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => {
        timerRef.current = setTimeout(dismissToast, 4000);
      }}
    >
      <div 
        onClick={handleClick}
        className="bg-white/95 backdrop-blur-md border border-emerald-200/90 shadow-xl rounded-2xl p-3.5 flex items-start gap-3 cursor-pointer hover:border-emerald-400 hover:shadow-2xl transition-all group"
      >
        <div className="relative shrink-0 mt-0.5">
          {activeToast.icon && activeToast.icon !== '/logo.svg' ? (
            <img 
              src={activeToast.icon} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border border-emerald-100 shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
            <BellRing className="w-2.5 h-2.5 text-white animate-pulse" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <h4 className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-emerald-700 transition-colors">
              {activeToast.title}
            </h4>
            {activeToast.channel && activeToast.channel !== 'semua' && (
              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md shrink-0 uppercase">
                #{activeToast.channel}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
            {activeToast.body}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 group-hover:text-emerald-700">
            <span>Buka Percakapan</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissToast();
          }}
          className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Tutup Notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
