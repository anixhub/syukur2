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
    submenus: [
      { id: 'dashboard', label: 'Dashboard Utama' }
    ]
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
  },
  {
    id: 'group_chat',
    label: 'Group Chat',
    icon: MessageSquare,
    submenus: []
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
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState(() => localStorage.getItem('smartsantri_active_display_name') || 'Aniq M');

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

  useEffect(() => {
    const handleUpdate = () => {
      setDisplayName(localStorage.getItem('smartsantri_active_display_name') || 'Aniq M');
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
    }).slice(0, 15);
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
        <div className="flex-1 w-full overflow-y-auto px-4 py-2 space-y-4">
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
                ].map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => {
                      onChangeModule(tag.mod, tag.sub);
                      onClose();
                      handleExitSearch();
                    }}
                    className="px-3 py-2 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100 transition-colors cursor-pointer"
                  >
                    {tag.label}
                  </button>
                ))}
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
                    return (
                      <button
                        key={`${item.module}-${item.subTab || idx}`}
                        type="button"
                        onClick={() => {
                          onChangeModule(item.module, item.subTab);
                          onClose();
                          handleExitSearch();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 active:bg-blue-50 text-left transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {item.category}
                          </div>
                        </div>
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
                        onClose();
                        handleExitSearch();
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
              const isActive = activeModule === item.id;
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
                    <div className={`flex items-center space-x-3 w-full ${hasSubmenus && isExpanded ? 'flex-col' : ''}`}>
                      <div className="flex items-center space-x-3 w-full">
                        <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className={isActive ? 'text-blue-600' : 'text-gray-800'}>
                          {item.label}
                        </span>
                        {hasSubmenus ? (
                          <span 
                            className={`text-gray-400 text-sm ml-auto transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-blue-600' : ''
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </span>
                        ) : item.id === 'group_chat' && (unreadChatCount > 0 || hasMentionNotification) ? (
                          <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-xs">
                            {hasMentionNotification ? '@' : (unreadChatCount > 99 ? '99+' : unreadChatCount)}
                          </span>
                        ) : null}
                      </div>

                      {/* Submenu List when expanded */}
                      {hasSubmenus && isExpanded && (
                        <ul className="mt-2 space-y-1 w-full pl-10">
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

          {/* User Profile Bottom */}
          <div className="p-4 flex items-center justify-between mt-auto bg-white w-[80%] pt-8 relative" ref={profileMenuRef}>
            <div 
              onClick={() => {
                onChangeModule('pengaturan', 'keamanan');
                onClose();
              }}
              className="flex items-center space-x-3 cursor-pointer group"
              title="Buka Pengaturan Akun"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                {initialLetter}
              </div>
              <span className="font-medium text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
                {displayName}
              </span>
            </div>

            {/* Three dots button */}
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu Opsi Pengguna"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
              </svg>
            </button>

            {/* Popover Menu on Three Dots */}
            {showProfileMenu && (
              <div className="absolute bottom-16 right-4 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onChangeModule('pengaturan');
                    onClose();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Pengaturan Sistem</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onClose();
                    if (onOpenHelp) onOpenHelp();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left"
                >
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  <span>Pusat Bantuan</span>
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onClose();
                    localStorage.removeItem('smartsantri_is_logged_in');
                    localStorage.removeItem('smartsantri_active_role');
                    localStorage.removeItem('smartsantri_active_username');
                    localStorage.removeItem('smartsantri_active_display_name');
                    localStorage.removeItem('smartsantri_profile_avatar');
                    if (onLogout) {
                      onLogout();
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </motion.aside>
  );
}
