import React from 'react';
import { 
  Menu, 
  Bell,
  MessageCircle
} from 'lucide-react';

interface HeaderProps {
  activeModule: string;
  activeSubTab?: string;
  onOpenDrawer: () => void;
  onOpenChat?: () => void;
  isChatOpen?: boolean;
  unreadChatCount?: number;
  hasMentionNotification?: boolean;
  pendingRegistrationsCount?: number;
  onOpenPendingModal?: () => void;
  onOpenNotifications?: () => void;
  isNotificationsOpen?: boolean;
  santriList?: any[];
  onChangeModule?: (mod: string, subTab?: string) => void;
  onSelectSantri?: (santri: any) => void;
}

export default function Header({ 
  activeModule, 
  activeSubTab, 
  onOpenDrawer,
  onOpenChat,
  isChatOpen = false,
  unreadChatCount = 0,
  hasMentionNotification = false,
  pendingRegistrationsCount = 0,
  onOpenPendingModal,
  onOpenNotifications,
  isNotificationsOpen = false
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-xs">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        {/* Header Layout */}
        <div className="relative flex h-16 w-full items-center justify-between">
          
          {/* Left: Sidebar / Drawer Toggle */}
          <div className="flex items-center z-10">
            <button
              id="btn-open-drawer"
              onClick={onOpenDrawer}
              className="flex items-center justify-center w-10 h-10 p-2 text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer focus:outline-none rounded-full hover:bg-slate-100/60"
              aria-label="Buka Menu Sidebar"
              title="Buka / Tutup Menu Sidebar"
            >
              <Menu className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={2} />
            </button>
          </div>

          {/* Center: Application Title Only (Centered across the header) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight select-none">
              AttarOkey
            </h1>
          </div>

          {/* Right Action Buttons: Message / Chat & Bell Notifications */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            {/* Tombol Pesan (Chat) */}
            <button 
              id="btn-chat-header"
              onClick={onOpenChat}
              className={`relative flex items-center justify-center w-10 h-10 p-2 transition-colors cursor-pointer focus:outline-none rounded-full ${
                isChatOpen 
                  ? 'text-emerald-600 bg-emerald-50/90 ring-1 ring-emerald-300' 
                  : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100/60'
              }`}
              title={isChatOpen ? "Tutup Pesan" : "Pesan & Diskusi"}
              aria-label={isChatOpen ? "Tutup Pesan" : "Buka Pesan"}
            >
              <MessageCircle className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={2} />
              {(unreadChatCount > 0 || hasMentionNotification) ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-white font-extrabold text-[10px] shadow-xs animate-pulse">
                  {hasMentionNotification ? '@' : (unreadChatCount > 99 ? '99+' : unreadChatCount)}
                </span>
              ) : null}
            </button>

            {/* Tombol Notifikasi */}
            <button 
              id="btn-notifications-desktop"
              onClick={onOpenNotifications}
              className={`relative flex items-center justify-center w-10 h-10 p-2 transition-colors cursor-pointer focus:outline-none rounded-full ${
                isNotificationsOpen 
                  ? 'text-emerald-600 bg-emerald-50/90 ring-1 ring-emerald-300' 
                  : 'text-slate-700 hover:text-emerald-600 hover:bg-slate-100/60'
              }`}
              title={isNotificationsOpen ? "Tutup Notifikasi" : "Notifikasi Sistem"}
              aria-label={isNotificationsOpen ? "Tutup Notifikasi" : "Buka Notifikasi"}
            >
              <Bell className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={2} />
              {pendingRegistrationsCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white font-extrabold text-[10px] shadow-xs animate-pulse">
                  {pendingRegistrationsCount > 99 ? '99+' : pendingRegistrationsCount}
                </span>
              ) : null}
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
