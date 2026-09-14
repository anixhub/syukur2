import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  FileText, 
  Wallet, 
  BookOpen, 
  Users, 
  Shield, 
  ChevronDown, 
  ChevronLeft,
  Settings, 
  LogOut,
  HelpCircle,
  Search,
  X,
  LifeBuoy,
  ChevronRight,
  Check,
  Plus,
  UserPlus,
  MessageCircle
} from 'lucide-react';
import { getPermissionsForRole, normalizeRoleId } from '../lib/permissions';
import { getSavedAccounts, switchAccount, logoutCurrentAccount, SavedAccount } from '../lib/accountManager';
import AddAccountModal from './AddAccountModal';
import SettingsModal, { SettingsTab } from './SettingsModal';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggleExpand?: () => void;
  activeModule: string;
  activeSubTab?: string;
  onChangeModule: (mod: string, subTab?: string) => void;
  isSelectionMode?: boolean;
  onLogout?: () => void;
  onOpenHelp?: () => void;
  santriList?: any[];
  onSelectSantri?: (santri: any) => void;
  onOpenChat?: () => void;
  isChatOpen?: boolean;
  unreadChatCount?: number;
  hasMentionNotification?: boolean;
}

export interface MenuItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  submenus?: { id: string; label: string }[];
}

const MENU_ITEMS: MenuItemDef[] = [
  { 
    id: 'home', 
    label: 'Home', 
    icon: Home,
    submenus: [
      { id: 'dashboard', label: 'Dashboard Utama' }
    ]
  },
  { 
    id: 'group_chat', 
    label: 'Group Chat', 
    icon: MessageCircle,
    submenus: []
  },
  { 
    id: 'sekretaris', 
    label: 'Sekretaris', 
    icon: FileText,
    submenus: [
      { id: 'overview', label: 'Overview' },
      { id: 'santri', label: 'Data Induk Santri' }
    ]
  },
  { 
    id: 'bendahara', 
    label: 'Bendahara', 
    icon: Wallet,
    submenus: []
  },
  { 
    id: 'pendidikan', 
    label: 'Pendidikan', 
    icon: BookOpen,
    submenus: [
      { id: 'lembaga', label: 'Aktivitas Akademik' },
      { id: 'akademik', label: 'Data Akademik' }
    ]
  },
  { 
    id: 'humasy', 
    label: 'Humasy', 
    icon: Users,
    submenus: [
      { id: 'kamar', label: 'Kelola Kamar' },
      { id: 'datakamar', label: 'Data Kamar Santri' }
    ]
  },
  { 
    id: 'keamanan', 
    label: 'Keamanan', 
    icon: Shield,
    submenus: [
      { id: 'overview', label: 'Overview' },
      { id: 'catatan', label: 'Data Pelanggaran' },
      { id: 'riwayat', label: 'Log Kasus' },
      { id: 'bukuinduk', label: 'Buku Induk Sanksi' },
      { id: 'perizinan', label: 'Perizinan' }
    ]
  }
];

export default function Sidebar({
  isOpen = true,
  onClose,
  onToggleExpand,
  activeModule,
  activeSubTab,
  onChangeModule,
  isSelectionMode = false,
  onLogout,
  onOpenHelp,
  santriList = [],
  onSelectSantri
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(activeModule);
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountsPanel, setShowAccountsPanel] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsTab>('general');
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => getSavedAccounts());
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState(() => localStorage.getItem('smartsantri_active_display_name') || 'Mang Daud');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('smartsantri_profile_avatar') || '');

  const userInitials = useMemo(() => {
    if (!displayName) return 'MD';
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const handleExitSearch = () => {
    setIsSearchMode(false);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!isOpen) {
      setIsSearchMode(false);
      setShowProfileMenu(false);
      setShowAccountsPanel(false);
      setHoveredModuleId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setDisplayName(localStorage.getItem('smartsantri_active_display_name') || 'Mang Daud');
      setAvatarUrl(localStorage.getItem('smartsantri_profile_avatar') || '');
      setSavedAccounts(getSavedAccounts());
    };
    window.addEventListener('smartsantri_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('smartsantri_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Close profile dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
        setShowAccountsPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync accordion when activeModule changes
  useEffect(() => {
    if (activeModule) {
      setOpenAccordion(activeModule);
    }
  }, [activeModule]);

  const activeRole = localStorage.getItem('smartsantri_active_role') || 'superadmin';
  const permissions = getPermissionsForRole(activeRole);

  const filteredMenuItems = useMemo(() => {
    if (normalizeRoleId(activeRole) === 'superadmin') return MENU_ITEMS;
    return MENU_ITEMS.filter(item => {
      if (item.id === 'home') return true;
      if (!permissions) return false;

      if (item.id === 'sekretaris') {
        return !!permissions['sekretaris_putra.view'] || 
               !!permissions['sekretaris_putra.write'] || 
               !!permissions['sekretaris_putri.view'] || 
               !!permissions['sekretaris_putri.write'];
      }
      if (item.id === 'bendahara') {
        return !!permissions['bendahara_putra.view'] || 
               !!permissions['bendahara_putra.write'] || 
               !!permissions['bendahara_putri.view'] || 
               !!permissions['bendahara_putri.write'];
      }
      if (item.id === 'pendidikan') {
        return !!permissions['pendidikan_putra.view'] || 
               !!permissions['pendidikan_putra.write'] || 
               !!permissions['pendidikan_putri.view'] || 
               !!permissions['pendidikan_putri.write'];
      }
      if (item.id === 'humasy') {
        return !!permissions['humasy_putra.view'] || 
               !!permissions['humasy_putra.write'] || 
               !!permissions['humasy_putri.view'] || 
               !!permissions['humasy_putri.write'] ||
               !!permissions['humas_putra.view'] || 
               !!permissions['humas_putra.write'] || 
               !!permissions['humas_putri.view'] || 
               !!permissions['humas_putri.write'];
      }
      if (item.id === 'keamanan') {
        return !!permissions['keamanan_putra.view'] || 
               !!permissions['keamanan_putra.write'] || 
               !!permissions['keamanan_putri.view'] || 
               !!permissions['keamanan_putri.write'];
      }
      return false;
    });
  }, [activeRole, permissions]);

  // Search filter for normal menu
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return filteredMenuItems;
    const q = searchQuery.toLowerCase().trim();
    return filteredMenuItems.filter(item => 
      item.label.toLowerCase().includes(q) ||
      item.submenus?.some(s => s.label.toLowerCase().includes(q))
    );
  }, [searchQuery, filteredMenuItems]);

  // Matched menus & submenus for full search mode
  const matchedMenus = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: { module: string; subTab?: string; title: string; category: string; icon: any }[] = [];
    filteredMenuItems.forEach(item => {
      if (item.label.toLowerCase().includes(q)) {
        results.push({
          module: item.id,
          subTab: item.submenus?.[0]?.id,
          title: item.label,
          category: 'Modul Utama',
          icon: item.icon
        });
      }
      item.submenus?.forEach(sub => {
        if (sub.label.toLowerCase().includes(q) && !results.some(r => r.module === item.id && r.subTab === sub.id)) {
          results.push({
            module: item.id,
            subTab: sub.id,
            title: sub.label,
            category: item.label,
            icon: item.icon
          });
        }
      });
    });
    return results;
  }, [searchQuery, filteredMenuItems]);

  // Matched santri list for full search mode
  const matchedSantri = useMemo(() => {
    if (!searchQuery.trim() || !santriList || santriList.length === 0) return [];
    const q = searchQuery.toLowerCase().trim();
    return santriList.filter(s => {
      const nama = (s.namaLengkap || s.nama || '').toLowerCase();
      const nis = (s.nis || '').toLowerCase();
      const nism = (s.nism || '').toLowerCase();
      const kamar = (s.kamar || s.namaKamar || '').toLowerCase();
      const asrama = (s.asrama || '').toLowerCase();
      return nama.includes(q) || nis.includes(q) || nism.includes(q) || kamar.includes(q) || asrama.includes(q);
    });
  }, [searchQuery, santriList]);

  const handleMenuClick = (item: MenuItemDef) => {
    if (isSelectionMode) return;

    if (item.submenus && item.submenus.length > 0) {
      if (openAccordion === item.id) {
        setOpenAccordion(null);
      } else {
        setOpenAccordion(item.id);
      }
    } else {
      onChangeModule(item.id, undefined);
    }
  };

  const initialLetter = (displayName || 'A').charAt(0).toUpperCase();

  return (
    <motion.aside 
      id="desktop-sidebar"
      initial={false}
      animate={{ 
        width: isOpen ? 288 : 72 
      }}
      transition={{ type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.28 }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-slate-200/80 z-30 select-none overflow-visible shrink-0"
    >
      <div className={`h-full flex flex-col shrink-0 overflow-visible transition-all duration-280 ease-[cubic-bezier(0.25,1,0.5,1)] ${isOpen ? 'w-72' : 'w-[72px]'}`}>
        {/* Header with Unified Smoothly-Shrinking Search Box */}
        <div className="p-3 border-b border-gray-100 flex items-center overflow-hidden shrink-0">
          <div className="flex items-center gap-2 w-full">
            {isSearchMode && isOpen && (
              <button
                type="button"
                onClick={handleExitSearch}
                className="p-1.5 -ml-1 text-gray-700 hover:text-gray-950 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors shrink-0 cursor-pointer"
                aria-label="Kembali"
                title="Kembali ke menu"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
            )}

            <div 
              onClick={() => {
                if (!isOpen && onToggleExpand) {
                  onToggleExpand();
                  setTimeout(() => {
                    searchInputRef.current?.focus();
                  }, 280);
                }
              }}
              className={`relative flex items-center bg-gray-100 rounded-xl transition-all duration-280 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                isOpen 
                  ? 'w-full h-11 cursor-text' 
                  : 'w-12 h-11 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
              }`}
              title={!isOpen ? "Cari menu atau data santri (Klik untuk membuka)" : undefined}
            >
              {/* Static Search Icon Container - Anchored at left=0 of pill, center=36px */}
              <div className="w-12 h-11 flex items-center justify-center shrink-0">
                <Search className={`w-5 h-5 shrink-0 transition-colors ${!isOpen ? 'text-gray-500 hover:text-blue-600' : 'text-gray-400'}`} />
              </div>

              {/* Text input container that sweeps left and fades out */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  x: isOpen ? 0 : -16,
                  width: isOpen ? 'auto' : 0,
                }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="flex-1 flex items-center overflow-hidden mr-2 whitespace-nowrap"
                style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
              >
                <input 
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    if (!isSearchMode) {
                      setIsSearchMode(true);
                    }
                  }}
                  onClick={() => {
                    if (!isSearchMode) {
                      setIsSearchMode(true);
                    }
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleExitSearch();
                    }
                  }}
                  tabIndex={isOpen ? 0 : -1}
                  className="w-full bg-transparent text-sm border-none outline-none placeholder-gray-400 text-gray-800" 
                  placeholder="Cari menu atau data santri" 
                />
                {searchQuery && isOpen && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0 cursor-pointer"
                    title="Hapus teks"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* When in Search Mode and open: Search Results */}
        {isOpen && isSearchMode ? (
          <div className="flex-1 min-h-0 w-full overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin overscroll-contain">
            {!searchQuery.trim() ? (
              <div className="space-y-4 pt-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1">
                  Pencarian Cepat
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Data Induk Santri', mod: 'sekretaris', sub: 'santri' },
                    { label: 'Syahriah & Kas', mod: 'bendahara', sub: '' },
                    { label: 'Aktivitas Akademik', mod: 'pendidikan', sub: 'lembaga' },
                    { label: 'Kelola Kamar', mod: 'humasy', sub: 'kamar' },
                    { label: 'Perizinan & Sanksi', mod: 'keamanan', sub: 'overview' },
                    { label: 'Pengaturan Akun', mod: 'pengaturan', sub: 'keamanan' },
                  ].map((tag) => {
                    const isTagActive = activeModule === tag.mod && (!tag.sub || activeSubTab === tag.sub);
                    return (
                      <button
                        key={tag.label}
                        type="button"
                        onClick={() => {
                          onChangeModule(tag.mod, tag.sub);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          isTagActive
                            ? 'bg-blue-600 text-white shadow-xs font-semibold'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-400 px-1 pt-2">
                  Ketik nama menu, fitur aplikasi, atau nama santri untuk memulai pencarian.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Menu & Halaman Results */}
                {matchedMenus.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1 mb-2">
                      Menu & Navigasi ({matchedMenus.length})
                    </div>
                    {matchedMenus.map((item, idx) => {
                      const Icon = item.icon;
                      const isItemActive = activeModule === item.module && (!item.subTab || activeSubTab === item.subTab);
                      return (
                        <button
                          key={`${item.module}-${item.subTab || idx}`}
                          type="button"
                          onClick={() => {
                            onChangeModule(item.module, item.subTab);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                            isItemActive 
                              ? 'bg-blue-50/90 text-blue-700 font-semibold ring-1 ring-blue-200/80 shadow-2xs' 
                              : 'hover:bg-gray-100 active:bg-blue-50 text-gray-800'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                            isItemActive 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm truncate ${
                              isItemActive ? 'font-bold text-blue-700' : 'font-medium text-gray-800 group-hover:text-blue-600'
                            }`}>
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {item.category}
                            </div>
                          </div>
                          {isItemActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Santri Results */}
                {matchedSantri.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1 mb-2">
                      Data Santri ({matchedSantri.length})
                    </div>
                    {matchedSantri.map((santri) => (
                      <button
                        key={santri.id || santri.nis}
                        type="button"
                        onClick={() => {
                          if (onSelectSantri) {
                            onSelectSantri(santri);
                          } else {
                            onChangeModule('sekretaris', 'santri');
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 active:bg-blue-50 text-left transition-colors cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {(santri.namaLengkap || santri.nama || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                            {santri.namaLengkap || santri.nama}
                          </div>
                          <div className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                            <span>NIS: {santri.nis || santri.nism || '-'}</span>
                            <span>•</span>
                            <span>{santri.kamar || santri.namaKamar || 'Kamar -'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                          {santri.statusSantri || 'Aktif'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {matchedMenus.length === 0 && matchedSantri.length === 0 && (
                  <div className="py-8 text-center text-gray-400 space-y-2">
                    <Search className="w-7 h-7 mx-auto text-gray-300 stroke-[1.5]" />
                    <div className="text-sm font-medium text-gray-600">
                      Tidak ada hasil untuk "{searchQuery}"
                    </div>
                    <div className="text-xs text-gray-400 max-w-xs mx-auto">
                      Pastikan ejaan kata kunci benar atau coba cari nama menu dan santri lainnya.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Unified Navigation Menu */}
            <nav className={`flex-1 px-3 py-3 space-y-1 ${isOpen ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}>
              {searchedItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                const isExpanded = (openAccordion === item.id) || (searchQuery.trim().length > 0 && item.submenus && item.submenus.length > 0);
                const hasSubmenus = item.submenus && item.submenus.length > 0;

                return (
                  <div 
                    key={item.id}
                    className={`relative ${isOpen ? 'w-full' : 'w-12'}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelectionMode) return;
                        if (isOpen) {
                          handleMenuClick(item);
                        } else {
                          onChangeModule(item.id, undefined);
                        }
                      }}
                      onMouseEnter={() => {
                        if (!isOpen && hasSubmenus) {
                          setHoveredModuleId(item.id);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOpen) {
                          const related = e.relatedTarget as HTMLElement;
                          if (!related?.closest?.(`[data-flyout="${item.id}"]`)) {
                            setHoveredModuleId(null);
                          }
                        }
                      }}
                      className={`flex items-center h-11 rounded-xl transition-all duration-280 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer ${
                        isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-800 hover:bg-gray-100'
                      } ${isOpen ? 'w-full' : 'w-12'}`}
                      title={!isOpen ? item.label : undefined}
                      aria-label={item.label}
                    >
                      {/* Icon container - FIXED AT w-12 h-11, center=36px, NEVER moves */}
                      <div className="w-12 h-11 flex items-center justify-center shrink-0">
                        <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>

                      {/* Module Label & Chevron - Sweeps left and fades out when narrowing */}
                      <motion.div
                        initial={false}
                        animate={{
                          opacity: isOpen ? 1 : 0,
                          x: isOpen ? 0 : -16,
                          width: isOpen ? 'auto' : 0,
                        }}
                        transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                        className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap min-w-0 pr-2"
                      >
                        <span className={`text-sm font-medium truncate ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-800'}`}>
                          {item.label}
                        </span>
                        {hasSubmenus && (
                          <span 
                            className={`text-gray-400 text-sm ml-2 shrink-0 transition-transform duration-200 ${
                              isExpanded && isOpen ? 'rotate-180 text-blue-600' : ''
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </span>
                        )}
                      </motion.div>
                    </button>

                    {/* Submenu Accordion when expanded in open mode - closes simultaneously when collapsing */}
                    {hasSubmenus && (
                      <motion.ul
                        initial={false}
                        animate={{
                          height: isOpen && isExpanded ? 'auto' : 0,
                          opacity: isOpen && isExpanded ? 1 : 0,
                        }}
                        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                        className="overflow-hidden space-y-1 pl-12 pr-2"
                      >
                        {item.submenus!.map((sub) => {
                          const isSubActive = isActive && (activeSubTab === sub.id || (!activeSubTab && sub.id === item.submenus![0].id));
                          return (
                            <li
                              key={sub.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onChangeModule(item.id, sub.id);
                              }}
                              className={`py-1.5 px-2 text-sm rounded-lg cursor-pointer transition-colors ${
                                isSubActive 
                                  ? 'text-blue-600 font-semibold bg-blue-50/60' 
                                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                              }`}
                            >
                              {sub.label}
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}

                    {/* Hover Flyout Box showing submodules when collapsed: title is non-clickable, no icon, no "sub modul" label */}
                    {!isOpen && hasSubmenus && hoveredModuleId === item.id && (
                      <div
                        data-flyout={item.id}
                        className={`absolute left-[44px] ${item.id === 'pengaturan' ? 'bottom-0' : 'top-0'} z-50 animate-in fade-in zoom-in-95 duration-150 pl-3 pointer-events-auto`}
                        onMouseEnter={() => setHoveredModuleId(item.id)}
                        onMouseLeave={() => setHoveredModuleId(null)}
                      >
                        <div className="w-52 bg-white rounded-xl shadow-xl border border-gray-100 p-2 backdrop-blur-sm">
                          {/* Non-clickable Module Title - no icon, no click */}
                          <div className="px-2.5 py-1.5 border-b border-gray-100 select-none">
                            <span className="text-xs font-bold text-gray-900 block truncate">
                              {item.label}
                            </span>
                          </div>

                          {/* Submodules List - directly below, only submenus are clickable */}
                          <div className="space-y-0.5 max-h-60 overflow-y-auto pt-1.5">
                            {item.submenus!.map((sub) => {
                              const isSubActive = isActive && (activeSubTab === sub.id || (!activeSubTab && sub.id === item.submenus![0].id));
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onChangeModule(item.id, sub.id);
                                    setHoveredModuleId(null);
                                  }}
                                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                    isSubActive
                                      ? 'bg-blue-50 text-blue-600 font-semibold'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                                  }`}
                                >
                                  <span className="truncate">{sub.label}</span>
                                  {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 ml-1.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Unified User Profile Bottom */}
            <div 
              className="p-3 mt-auto bg-white border-t border-gray-100 flex items-center relative shrink-0 overflow-visible" 
              ref={profileMenuRef}
            >
              <div 
                className={`relative ${isOpen ? 'w-full' : 'w-12'} flex items-center justify-center`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(prev => !prev);
                    setShowAccountsPanel(false);
                  }}
                  className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer ${
                    showProfileMenu ? 'bg-gray-100' : 'hover:bg-gray-100'
                  } ${isOpen ? 'w-full h-11 px-2 gap-2.5 text-left' : 'w-12 h-11 justify-center'}`}
                  title={`Akun: ${displayName}`}
                  aria-label="Menu Pengguna"
                  id="user-profile-button"
                >
                  {/* Fixed avatar circle - exactly matching reference image */}
                  <div className="w-8 h-8 rounded-full bg-[#9E362B] flex items-center justify-center text-white font-medium text-xs shrink-0 select-none shadow-xs uppercase overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </div>

                  {/* Expanded mode text */}
                  {isOpen && (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-xs text-gray-800 block truncate">
                          {displayName}
                        </span>
                        <span className="text-[11px] text-gray-400 block -mt-0.5 capitalize truncate">
                          {activeRole === 'superadmin' ? 'Super Admin' : (activeRole || 'Free')}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </>
                  )}
                </button>

                {/* Popover Menu positioned ABOVE (di atasnya) - triggered by click only */}
                {showProfileMenu && (
                  <div
                    data-profile-popup="true"
                    className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/90 p-2.5 w-64 select-none animate-in fade-in zoom-in-95 duration-150"
                    id="user-profile-popup"
                  >
                    {/* Header item: Avatar + Name + Subtitle/Free + ChevronRight (Clicks to show Accounts Panel) */}
                    <div
                      onClick={() => setShowAccountsPanel(prev => !prev)}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-colors cursor-pointer group/user ${
                        showAccountsPanel ? 'bg-blue-50/80 text-blue-700' : 'hover:bg-gray-50'
                      }`}
                      title="Klik untuk melihat daftar akun & ganti akun"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#9E362B] text-white font-medium text-xs flex items-center justify-center shrink-0 shadow-xs uppercase select-none overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          userInitials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate transition-colors ${
                          showAccountsPanel ? 'text-blue-700' : 'text-gray-900 group-hover/user:text-blue-600'
                        }`}>
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400 capitalize font-normal">
                          {activeRole === 'superadmin' ? 'Super Admin' : (activeRole || 'Free')}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-1 ${
                        showAccountsPanel ? 'rotate-90 text-blue-600' : 'group-hover/user:translate-x-0.5'
                      }`} />
                    </div>

                    <div className="h-px bg-gray-150 my-1.5 mx-1" />

                    {/* Options Group: Settings, Help & Keluar */}
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowAccountsPanel(false);
                          setSettingsModalTab('general');
                          setShowSettingsModal(true);
                        }}
                        className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-[13.5px] font-normal text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer text-left"
                      >
                        <Settings className="w-4.5 h-4.5 text-gray-700 shrink-0 stroke-[1.75]" />
                        <span>Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowAccountsPanel(false);
                          if (onOpenHelp) {
                            onOpenHelp();
                          } else {
                            onChangeModule('pengaturan', 'bantuan');
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-normal text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer group/help"
                      >
                        <div className="flex items-center gap-3.5">
                          <LifeBuoy className="w-4.5 h-4.5 text-gray-700 shrink-0 stroke-[1.75]" />
                          <span>Help</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover/help:translate-x-0.5 transition-transform shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowAccountsPanel(false);
                          setShowLogoutConfirmModal(true);
                        }}
                        className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl text-[13.5px] font-normal text-gray-800 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer group/logout"
                      >
                        <LogOut className="w-4.5 h-4.5 text-gray-700 group-hover/logout:text-red-600 shrink-0 stroke-[1.75]" />
                        <span>Keluar</span>
                      </button>
                    </div>

                    {/* Sub-panel: Daftar Akun yang sudah ditambahkan (Appears to the right of Mang Daud popup) */}
                    {showAccountsPanel && (
                      <div 
                        className="absolute bottom-0 left-[calc(100%+8px)] z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/90 p-2.5 w-64 select-none animate-in fade-in zoom-in-95 duration-150"
                        id="user-accounts-flyout"
                      >
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-800">Daftar Akun</span>
                          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {savedAccounts.length}
                          </span>
                        </div>

                        {/* Accounts List */}
                        <div className="space-y-1 max-h-56 overflow-y-auto py-1.5">
                          {savedAccounts.map((acc) => {
                            const activeUsername = localStorage.getItem('smartsantri_active_username') || 'superadmin@attaroqqy.com';
                            const isActive = acc.username.toLowerCase() === activeUsername.toLowerCase();
                            const accInitials = acc.displayName 
                              ? (acc.displayName.trim().split(/\s+/).length >= 2 
                                  ? (acc.displayName.trim().split(/\s+/)[0][0] + acc.displayName.trim().split(/\s+/)[1][0]).toUpperCase()
                                  : acc.displayName.slice(0, 2).toUpperCase())
                              : 'MD';

                            return (
                              <button
                                key={acc.id || acc.username}
                                type="button"
                                onClick={async () => {
                                  await switchAccount(acc);
                                  setShowAccountsPanel(false);
                                  setShowProfileMenu(false);
                                }}
                                className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer group/acc ${
                                  isActive ? 'bg-blue-50/80 text-blue-700' : 'hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-[#9E362B] text-white font-medium text-xs flex items-center justify-center shrink-0 shadow-xs uppercase overflow-hidden">
                                  {acc.avatarUrl ? (
                                    <img src={acc.avatarUrl} alt={acc.displayName} className="w-full h-full object-cover" />
                                  ) : (
                                    accInitials
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold truncate ${isActive ? 'text-blue-700' : 'text-gray-900 group-hover/acc:text-blue-600'}`}>
                                    {acc.displayName}
                                  </p>
                                  <p className="text-[10px] text-gray-400 capitalize truncate">
                                    {acc.role === 'superadmin' ? 'Super Admin' : (acc.role || 'Pengurus')}
                                  </p>
                                </div>
                                {isActive && (
                                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Add Account Button without border outline */}
                        <div className="pt-1 mt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAccountsPanel(false);
                              setShowProfileMenu(false);
                              setShowAddAccountModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-blue-600 bg-blue-50/60 hover:bg-blue-100/70 transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Akun</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Tambah Akun: Akun yang sudah ada atau Buat baru */}
            <AddAccountModal
              isOpen={showAddAccountModal}
              onClose={() => setShowAddAccountModal(false)}
              onAccountAdded={() => setSavedAccounts(getSavedAccounts())}
            />

            {/* Modal Pengaturan (Settings Dialog matching design) */}
            <SettingsModal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              defaultTab={settingsModalTab}
              onLogout={onLogout}
            />

            {/* Modal Konfirmasi Logout di Desktop */}
            {typeof document !== 'undefined' && createPortal(
              <AnimatePresence>
                {showLogoutConfirmModal && (
                  <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 8 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-center"
                      id="dialog-confirm-logout-sidebar"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                        <LogOut className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">Keluar dari Akun?</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Anda akan keluar dari sesi akun <strong className="text-slate-800">{displayName || 'ini'}</strong>. Jika masih ada akun lain yang tersimpan, Anda akan otomatis beralih ke akun tersebut.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirmModal(false)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setShowLogoutConfirmModal(false);
                            await logoutCurrentAccount(onLogout);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                        >
                          Ya, Keluar
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>,
              document.body
            )}
          </>
        )}
      </div>
    </motion.aside>
  );
}
