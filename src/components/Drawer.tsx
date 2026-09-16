import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  FileText, 
  Wallet, 
  BookOpen, 
  Users, 
  Shield, 
  MessageSquare,
  MessageCircle,
  ChevronDown,
  ChevronLeft,
  Search,
  MoreHorizontal,
  Settings,
  HelpCircle,
  LogOut,
  X,
  User,
  ExternalLink
} from 'lucide-react';
import { getPermissionsForRole, normalizeRoleId } from '../lib/permissions';
import SettingsModal, { SettingsTab } from './SettingsModal';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: string;
  activeSubTab?: string;
  onChangeModule: (mod: string, subTab?: string) => void;
  isSelectionMode?: boolean;
  onLogout?: () => void;
  onOpenHelp?: () => void;
  onOpenChat?: () => void;
  isChatOpen?: boolean;
  unreadChatCount?: number;
  hasMentionNotification?: boolean;
  onSearchModeChange?: (isSearching: boolean) => void;
  santriList?: any[];
  onSelectSantri?: (santri: any) => void;
}

interface MenuItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  submenus?: { id: string; label: string }[];
}

const MENU_ITEMS: MenuItemDef[] = [
  { 
    id: 'home', 
    label: 'Home', 
    icon: Home,
    submenus: []
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

export default function Drawer({ 
  isOpen, 
  onClose, 
  activeModule, 
  activeSubTab, 
  onChangeModule, 
  isSelectionMode = false,
  onLogout,
  onOpenHelp,
  onOpenChat,
  isChatOpen = false,
  unreadChatCount = 0,
  hasMentionNotification = false,
  onSearchModeChange,
  santriList = [],
  onSelectSantri
}: DrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(activeModule);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsTab>('general');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState(() => localStorage.getItem('smartsantri_active_display_name') || 'Mang Daud');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('smartsantri_profile_avatar') || '');
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem('smartsantri_active_role') || 'superadmin');

  useEffect(() => {
    const handleUpdate = () => {
      setDisplayName(localStorage.getItem('smartsantri_active_display_name') || 'Mang Daud');
      setAvatarUrl(localStorage.getItem('smartsantri_profile_avatar') || '');
      setActiveRole(localStorage.getItem('smartsantri_active_role') || 'superadmin');
    };
    window.addEventListener('smartsantri_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('smartsantri_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Reset search when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsSearchMode(false);
      setSearchQuery('');
      if (onSearchModeChange) onSearchModeChange(false);
    }
  }, [isOpen]);

  const handleExitSearch = () => {
    setIsSearchMode(false);
    setSearchQuery('');
    if (onSearchModeChange) onSearchModeChange(false);
  };

  // Close profile dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
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

  const permissions = getPermissionsForRole(activeRole);

  const filteredMenuItems = useMemo(() => {
    if (normalizeRoleId(activeRole) === 'superadmin') return MENU_ITEMS;
    return MENU_ITEMS.filter(item => {
      if (item.id === 'home' || item.id === 'group_chat') return true;
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
      if (item.id === 'group_chat') return;
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

    if (item.id === 'group_chat') {
      onClose();
      if (onOpenChat) onOpenChat();
      return;
    }

    if (item.submenus && item.submenus.length > 0) {
      if (openAccordion === item.id) {
        setOpenAccordion(null);
      } else {
        setOpenAccordion(item.id);
      }
    } else {
      onChangeModule(item.id, undefined);
      onClose();
    }
  };

  const initialLetter = (displayName || 'A').charAt(0).toUpperCase();

  return (
    <motion.aside 
      id="mobile-sidebar-drawer"
      initial={false}
      animate={
        isOpen
          ? { x: '0%', opacity: 1 }
          : { x: '-100%', opacity: 0 }
      }
      transition={{ type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.32 }}
      className={`w-full h-full bg-white flex flex-col z-0 absolute left-0 top-0 select-none md:hidden ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Header with Search */}
      <div className={`p-4 pt-8 transition-all duration-300 ease-out ${
        isSearchMode ? 'w-full pr-4' : 'w-[80%]'
      }`}>
        <div className="flex items-center gap-2.5 w-full mt-4">
          {isSearchMode && (
            <button
              type="button"
              onClick={handleExitSearch}
              className="p-2 -ml-2 text-gray-700 hover:text-gray-950 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors shrink-0 cursor-pointer"
              aria-label="Kembali"
              title="Kembali ke menu"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
          )}

          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input 
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (!isSearchMode) {
                  setIsSearchMode(true);
                  if (onSearchModeChange) onSearchModeChange(true);
                }
              }}
              onClick={() => {
                if (!isSearchMode) {
                  setIsSearchMode(true);
                  if (onSearchModeChange) onSearchModeChange(true);
                }
              }}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleExitSearch();
                }
              }}
              className="w-full bg-gray-100 rounded-full py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white text-sm border-none placeholder-gray-400 text-gray-800 transition-all" 
              placeholder="Cari menu atau data santri" 
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                title="Hapus teks"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* When in Search Mode: Full-screen Search Results (Sidebar is hidden) */}
      {isSearchMode ? (
        <div className="flex-1 min-h-0 w-full overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin overscroll-contain">
          {!searchQuery.trim() ? (
            <div className="space-y-4 pt-2">
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
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        isTagActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                          isItemActive 
                            ? 'bg-blue-50/90 text-blue-700 font-semibold ring-1 ring-blue-200/80 shadow-2xs' 
                            : 'hover:bg-gray-100 active:bg-blue-50 text-gray-800'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          isItemActive 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600'
                        }`}>
                          <Icon className="w-4 h-4" />
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 active:bg-blue-50 text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {(santri.namaLengkap || santri.nama || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                          {santri.namaLengkap || santri.nama}
                        </div>
                        <div className="text-xs text-gray-400 truncate flex items-center gap-2">
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
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Search className="w-8 h-8 mx-auto text-gray-300 stroke-[1.5]" />
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
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 w-[80%]">
            {searchedItems.map((item) => {
              const Icon = item.icon;
              const isChat = item.id === 'group_chat';
              const isActive = isChatOpen ? isChat : (!isChat && activeModule === item.id);
              const isExpanded = (openAccordion === item.id) || (searchQuery.trim().length > 0 && item.submenus && item.submenus.length > 0);
              const hasSubmenus = item.submenus && item.submenus.length > 0;

              return (
                <div key={item.id}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMenuClick(item);
                    }}
                    className={`block px-3 py-3 rounded-lg hover:bg-gray-100 text-base font-medium transition-colors ${
                      isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex items-center gap-3 w-full">
                        <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                          <Icon className="w-5 h-5 shrink-0" />
                        </span>
                        <span className={isActive ? 'text-blue-600' : 'text-gray-800'}>
                          {item.label}
                        </span>
                        {item.id === 'group_chat' && (unreadChatCount > 0 || hasMentionNotification) && (
                          <span className="ml-auto flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs shadow-xs animate-pulse">
                            {hasMentionNotification ? '@' : (unreadChatCount > 99 ? '99+' : unreadChatCount)}
                          </span>
                        )}
                        {hasSubmenus && (
                          <span 
                            className={`text-gray-400 text-sm ml-auto transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-blue-600' : ''
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      {/* Submenu List when expanded */}
                      {hasSubmenus && isExpanded && (
                        <ul className="mt-2 space-y-1 w-full pl-8">
                          {item.submenus!.map((sub) => {
                            const isSubActive = isActive && (activeSubTab === sub.id || (!activeSubTab && sub.id === item.submenus![0].id));
                            return (
                              <li
                                key={sub.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onChangeModule(item.id, sub.id);
                                  onClose();
                                }}
                                className={`py-2 text-sm cursor-pointer transition-colors ${
                                  isSubActive 
                                    ? 'text-blue-600 font-semibold' 
                                    : 'text-gray-500 hover:text-gray-800'
                                }`}
                              >
                                {sub.label}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </a>
                </div>
              );
            })}
          </nav>

          {/* User Profile Bottom Container */}
          <div className="p-3 w-[85%] mt-auto pb-4">
            <div 
              onClick={() => {
                setShowSettingsModal(true);
                onClose();
              }}
              className="p-2.5 flex items-center justify-between bg-transparent hover:bg-slate-100 active:bg-slate-200 rounded-2xl cursor-pointer transition-colors"
              title="Buka Pengaturan"
              id="mobile-drawer-profile-container"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#9E362B] text-white font-medium text-xs flex items-center justify-center shrink-0 shadow-xs uppercase overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    (displayName.trim().slice(0, 2) || 'MD').toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs text-slate-900 block truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize block -mt-0.5 truncate">
                    {activeRole === 'superadmin' ? 'Super Admin' : (activeRole || 'Pengurus')}
                  </span>
                </div>
              </div>

              {/* Three dots button */}
              <div 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg shrink-0"
                aria-label="Pengaturan"
              >
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>
          </div>

          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            defaultTab={settingsModalTab}
            onLogout={onLogout}
          />
        </>
      )}
    </motion.aside>
  );
}
