import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings as SettingsIcon, 
  User, 
  Database, 
  FileText, 
  Sun, 
  Moon, 
  Monitor, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Info,
  CheckCircle2,
  Building,
  Shield,
  Users,
  Calendar,
  MessageSquare,
  Plus,
  Pencil,
  AlertTriangle,
  Star,
  Search,
  Save,
  Clock,
  Phone,
  Mail,
  MapPin,
  Award,
  Maximize2,
  Globe,
  Volume2,
  ArrowLeftRight,
  LogOut,
  UserPlus,
  Ban,
  KeyRound,
  Copy,
  Bell,
  BellRing,
  BellOff
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendDeviceNotification, 
  playNotificationSound, 
  NotificationPermissionState 
} from '../lib/notificationHelper';
import NotificationPermissionModal from './NotificationPermissionModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import AddAccountModal from './AddAccountModal';
import { compressImage } from '../lib/utils';
import { 
  updateTableRow, 
  getSupabaseStatus, 
  fetchTableData, 
  deleteTableRow, 
  insertTableRow,
  getApiUrl,
  uploadFileToStorage,
  snakeToCamel
} from '../lib/api';
import { saveAccount, getSavedAccounts, switchAccount, logoutCurrentAccount, SavedAccount } from '../lib/accountManager';
import { AccountRole, DEFAULT_ROLES } from '../lib/permissions';
import { AppCredentials, PesantrenProfile } from '../types';

export type { PesantrenProfile };

export type SettingsTab = 
  | 'general' 
  | 'profile' 
  | 'pondok' 
  | 'akses' 
  | 'kelola_akun' 
  | 'tahun_ajaran' 
  | 'feedback' 
  | 'about';

export interface SettingsCategoryItem {
  id: SettingsTab;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SETTINGS_CATEGORIES: SettingsCategoryItem[] = [
  {
    id: 'general',
    label: 'Tampilan',
    desc: 'Tema tampilan dan format penanggalan sistem',
    icon: Sun
  },
  {
    id: 'profile',
    label: 'Profil Akun',
    desc: 'Nama tampilan, foto profil, sandi & kredensial',
    icon: User
  },
  {
    id: 'pondok',
    label: 'Profil Pondok',
    desc: 'Logo lembaga, identitas pesantren, kontak & legalitas',
    icon: Building
  },
  {
    id: 'akses',
    label: 'Hak Akses',
    desc: 'Matriks izin & wewenang modul per role pengguna',
    icon: Shield
  },
  {
    id: 'kelola_akun',
    label: 'Kelola Akun Pengguna',
    desc: 'Manajemen pengguna aktif, ganti role & reset akun',
    icon: Users
  },
  {
    id: 'tahun_ajaran',
    label: 'Tahun Ajaran',
    desc: 'Kalender pendidikan & penetapan semester aktif',
    icon: Calendar
  },
  {
    id: 'feedback',
    label: 'Masukan / Saran',
    desc: 'Tinjau dan pelajari masukan & saran dari user',
    icon: MessageSquare
  },
  {
    id: 'about',
    label: 'About',
    desc: 'Informasi versi sistem, lisensi & pengembang',
    icon: FileText
  }
];

const DEFAULT_PONDOK_PROFILE: PesantrenProfile = {
  namaPesantren: 'Pondok Pesantren Putri Attaroqqy',
  namaYayasan: 'Yayasan Pondok Pesantren Putri Attaroqqy',
  nspp: '510035250012',
  nomorNotaris: 'AHU-0012345.AH.01.04.Tahun 2018',
  alamat: 'Jl. KH. Abdul Fattah No. 09',
  desa: 'Karanganyar',
  kecamatan: 'Paiton',
  kabupaten: 'Probolinggo',
  provinsi: 'Jawa Timur',
  kodePos: '67291',
  telepon: '0812-3456-7890',
  email: 'info@attaroqqy.com',
  website: 'https://attaroqqy.com',

  // Pimpinan & Pengasuh Tunggal
  namaPengasuh: 'KH. Abdul Fattah bin Hasan',
  namaKetuaYayasan: 'H. Muhammad Thohir, M.Pd.',

  // Pengurus Wilayah Putra
  namaWakilPengasuhPutra: 'Ust. H. Nurul Huda',
  namaKetuaPondokPutra: 'Ust. Ahmad Zaini, S.Pd.I.',
  namaSekretarisPutra: 'Ust. Fathur Rozi',
  namaBendaharaPutra: 'Ust. M. Ridwan',
  namaKetuaKeamananPutra: 'Ust. M. Syukron',
  namaKetuaPendidikanPutra: 'Ust. Abdul Halim, Lc.',
  namaKetuaHumasyPutra: 'Ust. Ahmad Baihaqi',

  // Pengurus Wilayah Putri
  namaWakilPengasuhPutri: 'Nyai Hj. Nurul Hidayah',
  namaKetuaPondokPutri: 'Usth. Siti Fatimah, S.Pd.',
  namaSekretarisPutri: 'Usth. Maryam',
  namaBendaharaPutri: 'Usth. Khadijah',
  namaKetuaKeamananPutri: 'Usth. Aisyah',
  namaKetuaPendidikanPutri: 'Usth. Zahra, Lc.',
  namaKetuaHumasyPutri: 'Usth. Halimah',

  // Kolom Kompatibilitas Legacy
  namaWakilPengasuh: 'Nyai Hj. Nurul Hidayah',
  namaKetuaPondok: 'Ust. Ahmad Zaini, S.Pd.I.',
  namaSekretaris: 'Ust. Fathur Rozi',
  namaBendahara: 'Ust. M. Ridwan',
  namaKetuaKeamanan: 'Ust. M. Syukron',
  namaKetuaPendidikan: 'Ust. Abdul Halim, Lc.',
  namaKetuaHumasy: 'Ust. Ahmad Baihaqi',

  kotaTandaTangan: 'Probolinggo',
  logoStyle: 'classic',
  kopTambahan1: 'AKTA NOTARIS: No. 12 Tanggal 14 Juli 2018',
  kopTambahan2: 'SK KEMENKUMHAM RI: AHU-0012345.AH.01.04.Tahun 2018',
  logoUrl: ''
};

const MODULE_INFOS = [
  { id: 'sekretaris_putra', name: 'Sekretaris Putra', gender: 'putra', colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { id: 'sekretaris_putri', name: 'Sekretaris Putri', gender: 'putri', colorClass: 'text-rose-800 bg-rose-50 border-rose-200' },
  { id: 'bendahara_putra', name: 'Bendahara Putra', gender: 'putra', colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { id: 'bendahara_putri', name: 'Bendahara Putri', gender: 'putri', colorClass: 'text-rose-800 bg-rose-50 border-rose-200' },
  { id: 'keamanan_putra', name: 'Keamanan Putra', gender: 'putra', colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { id: 'keamanan_putri', name: 'Keamanan Putri', gender: 'putri', colorClass: 'text-rose-800 bg-rose-50 border-rose-200' },
  { id: 'humasy_putra', name: 'Humasy Putra', gender: 'putra', colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { id: 'humasy_putri', name: 'Humasy Putri', gender: 'putri', colorClass: 'text-rose-800 bg-rose-50 border-rose-200' },
  { id: 'pendidikan_putra', name: 'Pendidikan Putra', gender: 'putra', colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { id: 'pendidikan_putri', name: 'Pendidikan Putri', gender: 'putri', colorClass: 'text-rose-800 bg-rose-50 border-rose-200' }
];

const ACTIONS = [
  { id: 'view', label: 'READ' },
  { id: 'write', label: 'WRITE' }
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTab;
  onLogout?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  defaultTab = 'general',
  onLogout
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  // Account switcher & logout states
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => getSavedAccounts());
  const [showAccountSwitcherModal, setShowAccountSwitcherModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      setSavedAccounts(getSavedAccounts());
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // General Settings State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('smartsantri_theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('smartsantri_sound_enabled') !== 'false';
  });
  const [showHijriDate, setShowHijriDate] = useState<boolean>(() => {
    return localStorage.getItem('smartsantri_show_hijri') !== 'false';
  });
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [showNotifPermissionModal, setShowNotifPermissionModal] = useState<boolean>(false);

  const handleRequestNotifPermission = () => {
    setShowNotifPermissionModal(true);
  };

  const handleTestNotification = () => {
    sendDeviceNotification({
      title: 'Uji Coba Notifikasi SmartSantri',
      body: 'Sistem nada dering, getaran, dan notifikasi banner di perangkat Anda berjalan lancar!',
      icon: '/logo.svg',
    });
  };

  // Profile Settings State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [passwordModalSuccess, setPasswordModalSuccess] = useState<string | null>(null);
  const [isOldPasswordWrong, setIsOldPasswordWrong] = useState(false);
  const [isResetRequestModalOpen, setIsResetRequestModalOpen] = useState(false);
  const [resetRequestSubmitting, setResetRequestSubmitting] = useState(false);
  const [passwordAlertPopup, setPasswordAlertPopup] = useState<{
    isOpen: boolean;
    type: 'error' | 'success' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Pondok Profile State
  const [pondokProfile, setPondokProfile] = useState<PesantrenProfile>(() => {
    const local = localStorage.getItem('smartsantri_pesantren_profile');
    if (local) {
      try {
        return { ...DEFAULT_PONDOK_PROFILE, ...JSON.parse(local) };
      } catch (e) {
        return DEFAULT_PONDOK_PROFILE;
      }
    }
    return DEFAULT_PONDOK_PROFILE;
  });
  const [pondokSaving, setPondokSaving] = useState(false);
  const [pondokSuccessMsg, setPondokSuccessMsg] = useState<string | null>(null);

  // Akses & Role Matrix State
  const [roles, setRoles] = useState<AccountRole[]>(() => {
    const local = localStorage.getItem('smartsantri_roles_permissions');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        return DEFAULT_ROLES;
      }
    }
    return DEFAULT_ROLES;
  });
  const [aksesSaving, setAksesSaving] = useState(false);
  const [aksesSuccessMsg, setAksesSuccessMsg] = useState<string | null>(null);
  const aksesTableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollAksesTable = () => {
    const el = aksesTableContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  };

  const scrollAksesTable = (direction: 'left' | 'right') => {
    const el = aksesTableContainerRef.current;
    if (!el) return;
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    if (activeTab !== 'akses') return;
    const timer = setTimeout(() => {
      checkScrollAksesTable();
    }, 50);

    const el = aksesTableContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollAksesTable);
    }
    window.addEventListener('resize', checkScrollAksesTable);
    return () => {
      clearTimeout(timer);
      if (el) {
        el.removeEventListener('scroll', checkScrollAksesTable);
      }
      window.removeEventListener('resize', checkScrollAksesTable);
    };
  }, [activeTab, roles]);

  // Kelola Akun State
  const [credentials, setCredentials] = useState<AppCredentials[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [credSearch, setCredSearch] = useState('');

  // Tahun Ajaran State
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; name: string; isActive: boolean }>>(() => {
    const local = localStorage.getItem('smartsantri_academic_years');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 'ta-1', name: '2025/2026', isActive: false },
      { id: 'ta-2', name: '2026/2027', isActive: true },
      { id: 'ta-3', name: '2027/2028', isActive: false }
    ];
  });
  const [isTaModalOpen, setIsTaModalOpen] = useState(false);
  const [taNameInput, setTaNameInput] = useState('');
  const [editingTa, setEditingTa] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  // Feedback State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Fullscreen Photo Viewer State
  const [previewPhoto, setPreviewPhoto] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    subtitle?: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
    subtitle: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (defaultTab) {
        setActiveTab(defaultTab);
      }
      // On mobile view: start with category list unless specifically opened to a non-general tab
      setMobileView('list');
      loadProfileData();
      loadCredentials();
      loadFeedbacks();
    }
  }, [isOpen, defaultTab]);

  const loadProfileData = () => {
    const dName = localStorage.getItem('smartsantri_active_display_name') || 'Mang Daud';
    const uName = localStorage.getItem('smartsantri_active_username') || 'superadmin@attaroqqy.com';
    const rName = localStorage.getItem('smartsantri_active_role') || 'superadmin';
    const av = localStorage.getItem('smartsantri_profile_avatar') || '';

    setDisplayName(dName);
    setUsername(uName);
    setRole(rName);
    setAvatarUrl(av);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
  };

  const isSuperadminAccount = (c?: { id?: string; username?: string; role?: string } | null) => {
    if (!c) return false;
    const u = (c.username || '').toLowerCase();
    const r = (c.role || '').toLowerCase();
    return c.id === 'superadmin' || r === 'superadmin' || u === 'superadmin@attaroqqy.com' || u === 'superadmin';
  };

  const loadCredentials = async () => {
    setLoadingCreds(true);
    try {
      let data = await fetchTableData<AppCredentials>('app_credentials', 'smartsantri_app_credentials');
      if (!data || !Array.isArray(data)) {
        data = [];
      }
      const hasSuper = data.some(c => isSuperadminAccount(c));
      if (!hasSuper) {
        data = [
          {
            id: 'superadmin',
            username: 'superadmin@attaroqqy.com',
            displayName: 'Super Admin',
            role: 'superadmin',
            status: 'approved',
            createdAt: '2026-01-01T00:00:00.000Z'
          },
          ...data
        ];
      }
      setCredentials(data);
    } catch (e) {
      console.warn('Could not load credentials:', e);
    } finally {
      setLoadingCreds(false);
    }
  };

  const loadFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const data = await fetchTableData<any>('feedback', 'smartsantri_local_feedback');
      if (data && Array.isArray(data)) {
        setFeedbacks(data);
      }
    } catch (e) {
      console.warn('Could not load feedbacks:', e);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleToggleStarFeedback = async (id: string, currentStarred: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = feedbacks.map(f => {
      const fId = f.id || f.message || String(f.createdAt);
      if (fId === id || f.id === id) {
        return { ...f, isStarred: !currentStarred, is_starred: !currentStarred };
      }
      return f;
    });
    setFeedbacks(updated);
    try {
      localStorage.setItem('smartsantri_local_feedback', JSON.stringify(updated));
      await updateTableRow('feedback', 'smartsantri_local_feedback', id, { is_starred: !currentStarred } as any);
    } catch (err) {
      console.warn('Error toggling star on feedback:', err);
    }
    if (selectedFeedback) {
      const selId = selectedFeedback.id || selectedFeedback.message || String(selectedFeedback.createdAt);
      if (selId === id || selectedFeedback.id === id) {
        setSelectedFeedback((prev: any) => prev ? { ...prev, isStarred: !currentStarred, is_starred: !currentStarred } : null);
      }
    }
  };

  const handleDeleteFeedback = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Hapus pesan masukan ini?')) return;
    const updated = feedbacks.filter(f => {
      const fId = f.id || f.message || String(f.createdAt);
      return fId !== id && f.id !== id;
    });
    setFeedbacks(updated);
    try {
      localStorage.setItem('smartsantri_local_feedback', JSON.stringify(updated));
      await deleteTableRow('feedback', 'smartsantri_local_feedback', id);
    } catch (err) {
      console.warn('Error deleting feedback:', err);
    }
    if (selectedFeedback) {
      const selId = selectedFeedback.id || selectedFeedback.message || String(selectedFeedback.createdAt);
      if (selId === id || selectedFeedback.id === id) {
        setSelectedFeedback(null);
      }
    }
  };

  // General theme handler
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('smartsantri_theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Save User Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      localStorage.setItem('smartsantri_active_display_name', displayName.trim());
      if (avatarUrl) {
        localStorage.setItem('smartsantri_profile_avatar', avatarUrl);
      } else {
        localStorage.removeItem('smartsantri_profile_avatar');
      }

      saveAccount({
        id: 'acc_' + Date.now(),
        username: username,
        displayName: displayName.trim(),
        role: role,
        avatarUrl: avatarUrl
      });

      try {
        const updatePayload: any = {
          displayName: displayName.trim(),
          avatarUrl: avatarUrl
        };
        await updateTableRow<any>('app_credentials', 'smartsantri_app_credentials', username, updatePayload);
      } catch (e) {
        console.warn('Could not sync profile to remote DB:', e);
      }

      window.dispatchEvent(new Event('smartsantri_profile_updated'));
      window.dispatchEvent(new Event('storage'));

      setProfileSuccessMsg('Profil berhasil diperbarui.');
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Gagal menyimpan profil.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Change Password Modal Handler
  const handleSavePasswordModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordModalError(null);
    setPasswordModalSuccess(null);

    // 1. Validasi input kata sandi lama kosong
    if (!currentPassword.trim()) {
      setPasswordAlertPopup({
        isOpen: true,
        type: 'error',
        title: 'Kata Sandi Lama Kosong',
        message: 'Silakan masukkan kata sandi lama Anda saat ini untuk verifikasi keamanan.'
      });
      return;
    }

    // 2. Validasi input kata sandi baru kosong
    if (!newPassword) {
      setPasswordAlertPopup({
        isOpen: true,
        type: 'error',
        title: 'Kata Sandi Baru Kosong',
        message: 'Silakan masukkan kata sandi baru yang ingin Anda gunakan.'
      });
      return;
    }

    // 3. Validasi panjang minimal kata sandi baru
    if (newPassword.length < 4) {
      setPasswordAlertPopup({
        isOpen: true,
        type: 'error',
        title: 'Kata Sandi Terlalu Pendek',
        message: 'Kata sandi baru minimal harus terdiri dari 4 karakter.'
      });
      return;
    }

    // 4. Validasi kesamaan kata sandi baru dengan konfirmasi kata sandi baru
    if (newPassword !== confirmPassword) {
      setPasswordAlertPopup({
        isOpen: true,
        type: 'error',
        title: 'Konfirmasi Sandi Tidak Cocok',
        message: 'Kata sandi baru yang diinput harus sama persis dengan ulangi kata sandi baru. Silakan periksa kembali ketikan Anda.'
      });
      return;
    }

    setPasswordSaving(true);
    try {
      // 5. Verifikasi kata sandi lama terhadap akun saat ini di database / credentials
      const credData = await fetchTableData<AppCredentials>('app_credentials', 'smartsantri_app_credentials');
      const activeUserCred = (credData || []).find(
        c => c.username && c.username.toLowerCase() === username.toLowerCase()
      );

      const defaultPass = '1234';
      const expectedPassword = activeUserCred?.password || (
        (activeUserCred?.id === 'superadmin' || username.toLowerCase() === 'superadmin@attaroqqy.com') 
          ? defaultPass 
          : ''
      );

      // Jika kata sandi lama salah
      if (currentPassword !== expectedPassword) {
        setIsOldPasswordWrong(true);
        return;
      }

      // Jika kata sandi lama benar
      setIsOldPasswordWrong(false);

      const targetId = activeUserCred?.id || username;
      const updatePayload: any = {
        password: newPassword,
        status: 'approved'
      };

      await updateTableRow<any>('app_credentials', 'smartsantri_app_credentials', targetId, updatePayload);

      // Update in state
      setCredentials(prev => prev.map(c => (c.username.toLowerCase() === username.toLowerCase() ? { ...c, password: newPassword } : c)));

      // Update in localStorage
      const localCredsStr = localStorage.getItem('smartsantri_app_credentials');
      if (localCredsStr) {
        try {
          const parsed = JSON.parse(localCredsStr);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((c: any) => c.username && c.username.toLowerCase() === username.toLowerCase() ? { ...c, password: newPassword } : c);
            localStorage.setItem('smartsantri_app_credentials', JSON.stringify(updated));
          }
        } catch (e) {}
      }

      window.dispatchEvent(new Event('smartsantri_activity_updated'));
      window.dispatchEvent(new Event('storage'));

      // Tampilkan popup sukses
      setPasswordAlertPopup({
        isOpen: true,
        type: 'success',
        title: 'Kata Sandi Berhasil Diubah',
        message: 'Kata sandi akun Anda telah berhasil diperbarui. Silakan gunakan kata sandi baru untuk login berikutnya.',
        onConfirm: () => {
          setIsPasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setIsOldPasswordWrong(false);
          setProfileSuccessMsg('Kata sandi berhasil diperbarui.');
        }
      });
    } catch (err: any) {
      setPasswordAlertPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mengubah Kata Sandi',
        message: err.message || 'Terjadi kesalahan sistem saat memperbarui kata sandi. Silakan coba lagi.'
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Minta Akses Reset Sandi Langsung Handler (Dipicu saat klik "Lupa Sandi? Minta Akses Reset")
  const handleDirectResetRequest = async () => {
    setResetRequestSubmitting(true);
    try {
      if (role === 'superadmin' || username.toLowerCase() === 'superadmin@attaroqqy.com') {
        setPasswordAlertPopup({
          isOpen: true,
          type: 'warning',
          title: 'Akun Super Admin',
          message: 'Akun Super Admin adalah akun utama sistem dan tidak memerlukan pengajuan reset sandi.'
        });
        return;
      }

      const credData = await fetchTableData<AppCredentials>('app_credentials', 'smartsantri_app_credentials');
      const activeUserCred = (credData || []).find(
        c => c.username && c.username.toLowerCase() === username.toLowerCase()
      );

      const targetId = activeUserCred?.id || username;
      const updatePayload: any = {
        status: 'minta_reset'
      };

      await updateTableRow<any>('app_credentials', 'smartsantri_app_credentials', targetId, updatePayload);

      setCredentials(prev => prev.map(c => (c.username.toLowerCase() === username.toLowerCase() ? { ...c, status: 'minta_reset' } : c)));

      const localCredsStr = localStorage.getItem('smartsantri_app_credentials');
      if (localCredsStr) {
        try {
          const parsed = JSON.parse(localCredsStr);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((c: any) => c.username && c.username.toLowerCase() === username.toLowerCase() ? { ...c, status: 'minta_reset' } : c);
            localStorage.setItem('smartsantri_app_credentials', JSON.stringify(updated));
          }
        } catch (e) {}
      }

      window.dispatchEvent(new Event('smartsantri_activity_updated'));
      window.dispatchEvent(new Event('storage'));

      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsOldPasswordWrong(false);

      setPasswordAlertPopup({
        isOpen: true,
        type: 'success',
        title: 'Permintaan Akses Reset Sandi Telah Dikirim',
        message: 'Permintaan akses reset sandi telah dikirim ke Admin. Silakan hubungi Admin untuk mendapatkan kata sandi sementara akun Anda.'
      });
    } catch (err: any) {
      setPasswordAlertPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mengirim Permintaan',
        message: err.message || 'Gagal mengajukan permintaan reset kata sandi. Silakan coba kembali.'
      });
    } finally {
      setResetRequestSubmitting(false);
    }
  };

  // Minta Akses Reset Sandi Handler
  const handleSendResetRequest = async () => {
    await handleDirectResetRequest();
  };

  // Save Pondok Profile
  const handleSavePondokProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPondokSaving(true);
    setPondokSuccessMsg(null);
    try {
      localStorage.setItem('smartsantri_pesantren_profile', JSON.stringify(pondokProfile));
      try {
        await updateTableRow<any>('pesantren_profile', 'smartsantri_pesantren_profile', 'main', pondokProfile);
      } catch (err) {
        console.warn('Saved pondok profile locally:', err);
      }
      setPondokSuccessMsg('Profil Pesantren & Lembaga berhasil disimpan.');
      window.dispatchEvent(new Event('storage'));
    } catch (e: any) {
      console.error(e);
    } finally {
      setPondokSaving(false);
    }
  };

  // Save Role Matrix Permissions
  const handleTogglePermission = (roleId: string, key: string) => {
    if (roleId === 'superadmin') return;
    const parts = key.split('.');
    const mod = parts[0];
    const act = parts[1];

    setRoles(prev => 
      prev.map(r => {
        if (r.id === roleId) {
          const nextVal = !r.permissions[key];
          const newPermissions = {
            ...r.permissions,
            [key]: nextVal
          };
          if (act === 'view' && !nextVal) {
            newPermissions[`${mod}.write`] = false;
          }
          if (act === 'write' && nextVal) {
            newPermissions[`${mod}.view`] = true;
          }
          return { ...r, permissions: newPermissions };
        }
        return r;
      })
    );
  };

  const handleSaveAkses = async () => {
    setAksesSaving(true);
    setAksesSuccessMsg(null);
    try {
      localStorage.setItem('smartsantri_roles_permissions', JSON.stringify(roles));
      
      for (const r of roles) {
        const enabledPermissions = Object.entries(r.permissions)
          .filter(([_, enabled]) => enabled === true)
          .map(([name]) => name);

        try {
          await fetch(getApiUrl('/api/sync-role-permissions'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roleName: r.id,
              permissions: enabledPermissions
            })
          });
        } catch (e) {
          console.warn('Sync role error:', e);
        }
      }

      setAksesSuccessMsg('Matriks hak akses peran berhasil diperbarui.');
    } catch (e: any) {
      console.error(e);
    } finally {
      setAksesSaving(false);
    }
  };

  // Kelola Akun Confirmation Modals
  const [credDeleteConfirm, setCredDeleteConfirm] = useState<{ isOpen: boolean; user: AppCredentials | null }>({
    isOpen: false,
    user: null
  });
  const [credResetConfirm, setCredResetConfirm] = useState<{ 
    isOpen: boolean; 
    user: AppCredentials | null;
    tempPassword: string;
    showTempPassword: boolean;
  }>({
    isOpen: false,
    user: null,
    tempPassword: '1234',
    showTempPassword: false
  });
  const [tempPasswordSuccessModal, setTempPasswordSuccessModal] = useState<{
    isOpen: boolean;
    user: AppCredentials | null;
    tempPassword: string;
    copied: boolean;
  }>({
    isOpen: false,
    user: null,
    tempPassword: '',
    copied: false
  });

  // Approve / Reject / Block Credential
  const handleUpdateCredStatus = async (user: AppCredentials, newStatus: 'approved' | 'rejected' | 'pending') => {
    if (isSuperadminAccount(user)) return;
    try {
      const updated = { ...user, status: newStatus };
      await updateTableRow('app_credentials', 'smartsantri_app_credentials', user.id || user.username, updated);
      setCredentials(prev => prev.map(c => (c.username === user.username ? updated : c)));
      window.dispatchEvent(new Event('smartsantri_activity_updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCred = async (user: AppCredentials) => {
    if (isSuperadminAccount(user)) return;
    try {
      await deleteTableRow('app_credentials', 'smartsantri_app_credentials', user.id || user.username);
      setCredentials(prev => prev.filter(c => (c.id ? c.id !== user.id : c.username !== user.username)));
      window.dispatchEvent(new Event('smartsantri_activity_updated'));
    } catch (e) {
      console.error(e);
    } finally {
      setCredDeleteConfirm({ isOpen: false, user: null });
    }
  };

  const handleGrantResetAccess = async (user: AppCredentials, customTempPass?: string) => {
    if (isSuperadminAccount(user)) return;
    const finalPassword = (customTempPass !== undefined ? customTempPass.trim() : credResetConfirm.tempPassword.trim()) || '1234';
    try {
      const updated: AppCredentials = {
        ...user,
        password: finalPassword,
        status: 'approved'
      };
      await updateTableRow('app_credentials', 'smartsantri_app_credentials', user.id || user.username, updated);
      setCredentials(prev => prev.map(c => (c.username === user.username ? updated : c)));

      const localCredsStr = localStorage.getItem('smartsantri_app_credentials');
      if (localCredsStr) {
        try {
          const parsed = JSON.parse(localCredsStr);
          if (Array.isArray(parsed)) {
            const updatedList = parsed.map((c: any) => c.username && c.username.toLowerCase() === user.username.toLowerCase() ? { ...c, password: finalPassword, status: 'approved' } : c);
            localStorage.setItem('smartsantri_app_credentials', JSON.stringify(updatedList));
          }
        } catch (e) {}
      }

      window.dispatchEvent(new Event('smartsantri_activity_updated'));
      window.dispatchEvent(new Event('storage'));

      setCredResetConfirm({ isOpen: false, user: null, tempPassword: '1234', showTempPassword: false });
      setTempPasswordSuccessModal({
        isOpen: true,
        user: user,
        tempPassword: finalPassword,
        copied: false
      });
    } catch (e: any) {
      console.error(e);
      setPasswordAlertPopup({
        isOpen: true,
        type: 'error',
        title: 'Gagal Memberikan Akses',
        message: e.message || 'Terjadi kesalahan saat menyetel kata sandi sementara.'
      });
    }
  };

  // Academic Year Save
  const handleSaveAcademicYear = () => {
    if (!taNameInput.trim()) return;
    if (editingTa) {
      const updated = academicYears.map(y => y.id === editingTa.id ? { ...y, name: taNameInput.trim() } : y);
      setAcademicYears(updated);
      localStorage.setItem('smartsantri_academic_years', JSON.stringify(updated));
    } else {
      const newTa = {
        id: `ta-${Date.now()}`,
        name: taNameInput.trim(),
        isActive: academicYears.length === 0
      };
      const updated = [...academicYears, newTa];
      setAcademicYears(updated);
      localStorage.setItem('smartsantri_academic_years', JSON.stringify(updated));
    }
    setIsTaModalOpen(false);
    setEditingTa(null);
    setTaNameInput('');
  };

  const handleSetActiveAcademicYear = (id: string) => {
    const updated = academicYears.map(y => ({
      ...y,
      isActive: y.id === id
    }));
    setAcademicYears(updated);
    localStorage.setItem('smartsantri_academic_years', JSON.stringify(updated));
    const active = updated.find(y => y.isActive);
    if (active) {
      localStorage.setItem('smartsantri_active_tahun_ajaran', active.name);
    }
  };

  if (!isOpen) return null;

  const mobileGroups = [
    {
      title: 'Profil',
      items: [
        {
          id: 'profile' as SettingsTab,
          label: 'Pengaturan Akun',
          value: displayName || 'Akun Aktif',
          icon: User,
        },
      ],
    },
    {
      title: 'Aplikasi',
      items: [
        {
          id: 'general' as SettingsTab,
          label: 'Tampilan',
          value: theme === 'dark' ? 'Gelap' : theme === 'light' ? 'Terang' : 'Sistem',
          icon: theme === 'dark' ? Moon : Sun,
        },
        {
          id: 'akses' as SettingsTab,
          label: 'Hak Akses & Role',
          value: role === 'superadmin' ? 'Superadmin' : (role || 'User'),
          icon: Shield,
        },
        {
          id: 'kelola_akun' as SettingsTab,
          label: 'Kelola Akun Pengguna',
          value: `${credentials.length || 1} Pengguna`,
          icon: Users,
        },
      ],
    },
    {
      title: 'Lembaga & Akademik',
      items: [
        {
          id: 'pondok' as SettingsTab,
          label: 'Profil Pondok',
          value: pondokProfile.namaPesantren ? (pondokProfile.namaPesantren.length > 16 ? pondokProfile.namaPesantren.slice(0, 16) + '...' : pondokProfile.namaPesantren) : '',
          icon: Building,
        },
        {
          id: 'tahun_ajaran' as SettingsTab,
          label: 'Tahun Ajaran',
          value: academicYears.find(y => y.isActive)?.name || '2026/2027',
          icon: Calendar,
        },
      ],
    },
    {
      title: 'Audio & Notifikasi',
      caption: 'Pilih status suara notifikasi aplikasi untuk umpan balik interaksi yang lebih baik.',
      items: [
        {
          id: 'general' as SettingsTab,
          label: 'Suara Notifikasi',
          icon: Volume2,
          isToggle: true,
          checked: soundEnabled,
          onToggle: () => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            localStorage.setItem('smartsantri_sound_enabled', String(next));
            if (next) playNotificationSound();
          },
        },
        {
          id: 'general' as SettingsTab,
          label: 'Notifikasi Perangkat',
          icon: notifPermission === 'granted' ? Bell : notifPermission === 'denied' ? BellOff : BellRing,
          value: notifPermission === 'granted' ? 'Diizinkan' : notifPermission === 'denied' ? 'Diblokir' : 'Minta Izin',
          onClick: () => {
            if (notifPermission === 'granted') {
              handleTestNotification();
            } else {
              handleRequestNotifPermission();
            }
          },
        },
      ],
    },
    {
      title: 'Masukan & Saran',
      caption: 'Tinjau dan pelajari masukan, saran, serta laporan dari pengguna aplikasi.',
      items: [
        {
          id: 'feedback' as SettingsTab,
          label: 'Masukan / Saran',
          value: feedbacks.length > 0 ? `${feedbacks.length} Pesan` : '',
          icon: MessageSquare,
        },
      ],
    },
    {
      title: 'Tentang',
      items: [
        {
          id: 'about' as SettingsTab,
          label: 'Periksa pembaruan',
          value: '2.5.1(272)',
          icon: Info,
        },
        {
          id: 'about' as SettingsTab,
          label: 'Perjanjian Layanan & Lisensi',
          value: '',
          icon: FileText,
        },
      ],
    },
  ];

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-0 sm:p-5 bg-white sm:bg-slate-900/60 sm:backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      style={{
        width: '100vw',
        height: '100dvh',
        maxWidth: '100vw',
        maxHeight: '100dvh',
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full h-full sm:w-[95vw] sm:max-w-5xl sm:h-[86vh] sm:max-h-[820px] sm:min-h-[560px] bg-white sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200/90 overflow-hidden flex flex-col relative z-10"
        id="settings-modal-dialog"
      >
        {/* Desktop Header Bar */}
        <div className="hidden sm:flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0 bg-white z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-bold">
              <SettingsIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Pengaturan
              </h2>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
            title="Tutup Pengaturan"
            id="btn-close-settings-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Header Bar (Matches user reference screenshot) */}
        <div className="flex sm:hidden items-center justify-between px-4 py-3.5 border-b border-slate-100/80 bg-white z-20 shrink-0">
          {mobileView === 'detail' ? (
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Kembali ke Daftar Pengaturan"
              id="btn-settings-mobile-back"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Tutup Pengaturan"
              id="btn-settings-mobile-close-top"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          <h2 className="text-base font-bold text-slate-900 tracking-tight truncate max-w-[200px] text-center">
            {mobileView === 'list' ? 'Pengaturan' : (SETTINGS_CATEGORIES.find(c => c.id === activeTab)?.label || 'Pengaturan')}
          </h2>

          {/* Empty spacer on right to keep title centered */}
          <div className="w-9 shrink-0" />
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          
          {/* Desktop Left Navigation Tabs Sidebar */}
          <div className="hidden sm:flex w-48 sm:w-56 shrink-0 p-3 sm:p-4 flex-col justify-between border-r border-slate-100 bg-slate-50/50 overflow-y-auto scrollbar-thin select-none">
            <div className="flex flex-col gap-1">
              {SETTINGS_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveTab(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-[13px] border cursor-pointer text-left transition-colors duration-100 ${
                      isActive
                        ? 'bg-white text-slate-900 font-bold shadow-2xs border-slate-200/90'
                        : 'border-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Category List (Level 1: Exact layout matching the screenshot) */}
          <div className={`sm:hidden flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA] ${mobileView === 'list' ? 'block' : 'hidden'}`}>
            {mobileGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <h3 className="text-[13px] font-medium text-slate-500 px-1">
                  {group.title}
                </h3>
                <div className="bg-white rounded-2xl border border-slate-100/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                  {group.items.map((item, iIdx) => {
                    const ItemIcon = item.icon;
                    if (item.isToggle) {
                      return (
                        <div
                          key={iIdx}
                          onClick={item.onToggle}
                          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer select-none"
                          id={`setting-toggle-${item.id}-${iIdx}`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <ItemIcon className="w-5 h-5 text-slate-800 stroke-[1.75] shrink-0" />
                            <span className="text-[14px] font-medium text-slate-900 truncate">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[13px] text-slate-400 font-normal">
                              {item.checked ? 'Aktif' : 'Senyap'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                item.onToggle?.();
                              }}
                              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                                item.checked ? 'bg-emerald-600' : 'bg-slate-200'
                              }`}
                              aria-label={item.label}
                            >
                              <div
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  item.checked ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={iIdx}
                        type="button"
                        onClick={() => {
                          if (item.onClick) {
                            item.onClick();
                            return;
                          }
                          setActiveTab(item.id);
                          setMobileView('detail');
                        }}
                        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
                        id={`setting-btn-${item.id}-${iIdx}`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <ItemIcon className="w-5 h-5 text-slate-800 stroke-[1.75] shrink-0" />
                          <span className="text-[14px] font-medium text-slate-900 truncate">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.value && (
                            <span className="text-[13px] text-slate-400 font-normal max-w-[130px] truncate">
                              {item.value}
                            </span>
                          )}
                          <ChevronRight className="w-4.5 h-4.5 text-slate-400 stroke-[2] shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {group.caption && (
                  <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
                    {group.caption}
                  </p>
                )}
              </div>
            ))}

            {/* Mobile Bottom Group: Ganti Akun & Logout */}
            <div className="space-y-1.5 pt-1">
              <h3 className="text-[13px] font-medium text-slate-500 px-1">
                Akun &amp; Sesi
              </h3>
              <div className="bg-white rounded-2xl border border-slate-100/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAccountSwitcherModal(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
                  id="btn-settings-switch-account-mobile"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ArrowLeftRight className="w-5 h-5 text-slate-800 stroke-[1.75] shrink-0" />
                    <span className="text-[14px] font-medium text-slate-900 truncate">
                      Ganti Akun
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[13px] text-slate-400 font-normal max-w-[130px] truncate">
                      {displayName || 'Mang Daud'}
                    </span>
                    <ChevronRight className="w-4.5 h-4.5 text-slate-400 stroke-[2] shrink-0" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirmModal(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-rose-50/60 active:bg-rose-100/80 transition-colors cursor-pointer"
                  id="btn-settings-logout-mobile"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <LogOut className="w-5 h-5 text-rose-600 stroke-[1.75] shrink-0" />
                    <span className="text-[14px] font-medium text-rose-600 truncate">
                      Keluar
                    </span>
                  </div>
                  <ChevronRight className="w-4.5 h-4.5 text-rose-300 stroke-[2] shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content Panel (Level 2: Detail view on mobile, always active on desktop) */}
          <div className={`flex-1 p-4 sm:p-8 overflow-y-auto bg-white scrollbar-thin ${mobileView === 'detail' ? 'block' : 'hidden sm:block'}`}>
            
            {/* 1. GENERAL / TAMPILAN TAB */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-150 max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    Tema Tampilan
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer gap-2 ${
                        theme === 'light'
                          ? 'bg-slate-100/90 border-slate-300/90 text-slate-900 shadow-2xs font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 font-medium'
                      }`}
                    >
                      <Sun className="w-5 h-5 stroke-[1.75]" />
                      <span className="text-xs sm:text-sm">Terang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer gap-2 ${
                        theme === 'dark'
                          ? 'bg-slate-100/90 border-slate-300/90 text-slate-900 shadow-2xs font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 font-medium'
                      }`}
                    >
                      <Moon className="w-5 h-5 stroke-[1.75]" />
                      <span className="text-xs sm:text-sm">Gelap</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeChange('system')}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer gap-2 ${
                        theme === 'system'
                          ? 'bg-slate-100/90 border-slate-300/90 text-slate-900 shadow-2xs font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 font-medium'
                      }`}
                    >
                      <Monitor className="w-5 h-5 stroke-[1.75]" />
                      <span className="text-xs sm:text-sm">Sistem</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Format Tanggal Hijriah</p>
                      <p className="text-xs text-slate-500">Tampilkan kalender Hijriah di samping penanggalan Masehi</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !showHijriDate;
                        setShowHijriDate(next);
                        localStorage.setItem('smartsantri_show_hijri', String(next));
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        showHijriDate ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          showHijriDate ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Audio & Notifikasi Perangkat */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Suara &amp; Notifikasi Perangkat</h4>
                      <p className="text-xs text-slate-500">Dapatkan nada dering dan pemberitahuan langsung di layar saat ada pesan masuk.</p>
                    </div>

                    {/* Suara Notifikasi */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900">Suara Dering Notifikasi</p>
                          <p className="text-[11px] text-slate-500">Bunyikan nada dering khas setiap ada obrolan baru</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !soundEnabled;
                          setSoundEnabled(next);
                          localStorage.setItem('smartsantri_sound_enabled', String(next));
                          if (next) playNotificationSound();
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          soundEnabled ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            soundEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Izin Notifikasi Perangkat */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                          notifPermission === 'granted'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : notifPermission === 'denied'
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-semibold text-slate-900">Notifikasi Sistem Perangkat (HP/PC)</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              notifPermission === 'granted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : notifPermission === 'denied'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {notifPermission === 'granted' ? 'Diizinkan' : notifPermission === 'denied' ? 'Diblokir' : 'Perlu Izin'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {notifPermission === 'granted'
                              ? 'Notifikasi aktif. Anda akan menerima banner & getaran saat layar aktif maupun latar belakang.'
                              : notifPermission === 'denied'
                              ? 'Izin notifikasi diblokir di browser. Harap izinkan melalui pengaturan situs di bilah URL.'
                              : 'Klik Izinkan agar ponsel atau komputer dapat menampilkan notifikasi pesan masuk.'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {notifPermission !== 'granted' ? (
                          <button
                            type="button"
                            onClick={handleRequestNotifPermission}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Izinkan Notifikasi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleTestNotification}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Uji Coba Notifikasi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PROFIL AKUN TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in duration-150 max-w-3xl">
                {profileSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}
                {profileErrorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
                    <Info className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                {/* Foto Profil Akun */}
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => {
                      if (avatarUrl) {
                        setPreviewPhoto({
                          isOpen: true,
                          url: avatarUrl,
                          title: `Foto Profil: ${displayName}`,
                          subtitle: username
                        });
                      }
                    }}
                    className={`relative w-16 h-16 rounded-full bg-[#9E362B] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden uppercase transition-all group ${
                      avatarUrl ? 'cursor-pointer hover:ring-2 hover:ring-[#9E362B]/60 hover:shadow-md' : ''
                    }`}
                    title={avatarUrl ? 'Klik lingkaran untuk melihat foto ukuran penuh' : undefined}
                  >
                    {avatarUrl ? (
                      <>
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      </>
                    ) : (
                      displayName.slice(0, 2).toUpperCase() || 'MD'
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span>{avatarUrl ? 'Ubah Foto Profil' : 'Upload Foto Profil'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const comp = await compressImage(file, 400, 400, 0.85);
                            setAvatarUrl(comp);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Informasi Akun */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                      <User className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Informasi Pengguna</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nama Tampilan</label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nama Pengguna"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Email Akun Kredensial</label>
                      <input
                        type="text"
                        disabled
                        value={username}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">Hak Akses</label>
                      <input
                        type="text"
                        disabled
                        value={role === 'superadmin' ? 'Super Admin' : (role || 'Pengurus')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold capitalize cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Tombol Ganti Kata Sandi */}
                <div className="pt-2">
                  <div className="flex items-center gap-2.5 pb-2 mb-3 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/80">
                      <KeyRound className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Keamanan &amp; Kata Sandi</h4>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">Ubah Sandi Akun</span>
                      <p className="text-[11px] text-slate-500 font-medium">Klik tombol untuk mengganti kata sandi login saat ini</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setIsOldPasswordWrong(false);
                        setPasswordModalError(null);
                        setPasswordModalSuccess(null);
                        setIsPasswordModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-2xs active:scale-95 shrink-0"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Ganti Kata Sandi</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {profileSaving ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            )}

            {/* 3. PROFIL PONDOK TAB */}
            {activeTab === 'pondok' && (
              <form onSubmit={handleSavePondokProfile} className="space-y-6 animate-in fade-in duration-150 max-w-3xl">
                {pondokSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span>{pondokSuccessMsg}</span>
                  </div>
                )}

                {/* Kotak Logo Pondok: dibuat sama persis dengan kotak foto profil akun */}
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => {
                      if (pondokProfile.logoUrl) {
                        setPreviewPhoto({
                          isOpen: true,
                          url: pondokProfile.logoUrl,
                          title: `Logo Lembaga: ${pondokProfile.namaPesantren || 'Pesantren'}`,
                          subtitle: pondokProfile.namaYayasan
                        });
                      }
                    }}
                    className={`relative w-16 h-16 rounded-full bg-[#9E362B] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden uppercase transition-all group ${
                      pondokProfile.logoUrl ? 'cursor-pointer hover:ring-2 hover:ring-[#9E362B]/60 hover:shadow-md' : ''
                    }`}
                    title={pondokProfile.logoUrl ? 'Klik lingkaran untuk melihat foto ukuran penuh' : undefined}
                  >
                    {pondokProfile.logoUrl ? (
                      <>
                        <img src={pondokProfile.logoUrl} alt={pondokProfile.namaPesantren || 'Logo'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      </>
                    ) : (
                      (pondokProfile.namaPesantren?.slice(0, 2) || 'AT').toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span>{pondokProfile.logoUrl ? 'Ubah Logo Lembaga' : 'Upload Logo Lembaga'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const comp = await compressImage(file, 600, 600, 0.9);
                            setPondokProfile({ ...pondokProfile, logoUrl: comp });
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {pondokProfile.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setPondokProfile({ ...pondokProfile, logoUrl: '' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Hapus Logo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. Identitas & Legalitas Lembaga */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80">
                      <Building className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Identitas &amp; Legalitas Lembaga</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nama Pesantren</label>
                      <input
                        type="text"
                        value={pondokProfile.namaPesantren || ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, namaPesantren: e.target.value })}
                        placeholder="Nama Pesantren"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nama Yayasan / Badan Hukum</label>
                      <input
                        type="text"
                        value={pondokProfile.namaYayasan || ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, namaYayasan: e.target.value })}
                        placeholder="Nama Yayasan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nomor Statistik Pesantren (NSPP)</label>
                      <input
                        type="text"
                        value={pondokProfile.nspp || ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, nspp: e.target.value })}
                        placeholder="NSPP Pesantren"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Nomor Akta Notaris / Kemenkumham</label>
                      <input
                        type="text"
                        value={pondokProfile.nomorNotaris || ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, nomorNotaris: e.target.value })}
                        placeholder="Nomor Akta Notaris"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">Kota Penandatangan Dokumen &amp; Surat</label>
                      <input
                        type="text"
                        value={pondokProfile.kotaTandaTangan || ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, kotaTandaTangan: e.target.value })}
                        placeholder="Contoh: Jombang, Kediri, Probolinggo, dll."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Struktur Kepengurusan Putra */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-extrabold text-xs">
                        PA
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-blue-900 tracking-tight">Struktur Kepengurusan Putra</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">Pengasuh Putra</label>
                      <input
                        type="text"
                        value={pondokProfile.namaPengasuhPutra ?? pondokProfile.namaPengasuh ?? ''}
                        onChange={(e) => {
                          setPondokProfile({ 
                            ...pondokProfile, 
                            namaPengasuhPutra: e.target.value,
                            namaPengasuh: e.target.value 
                          });
                        }}
                        placeholder="Contoh: KH. Muhammad Shodiq, M.Ag."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Ketua Pondok Putra</label>
                      <input
                        type="text"
                        value={pondokProfile.namaKetuaPondokPutra ?? pondokProfile.namaKetuaPondok ?? ''}
                        onChange={(e) => {
                          setPondokProfile({ 
                            ...pondokProfile, 
                            namaKetuaPondokPutra: e.target.value,
                            namaKetuaPondok: e.target.value 
                          });
                        }}
                        placeholder="Nama Ketua Pondok Putra"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Sekretaris Putra</label>
                      <input
                        type="text"
                        value={pondokProfile.namaSekretarisPutra ?? pondokProfile.namaSekretaris ?? ''}
                        onChange={(e) => {
                          setPondokProfile({ 
                            ...pondokProfile, 
                            namaSekretarisPutra: e.target.value,
                            namaSekretaris: e.target.value 
                          });
                        }}
                        placeholder="Nama Sekretaris Putra"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Bendahara Putra</label>
                      <input
                        type="text"
                        value={pondokProfile.namaBendaharaPutra ?? pondokProfile.namaBendahara ?? ''}
                        onChange={(e) => {
                          setPondokProfile({ 
                            ...pondokProfile, 
                            namaBendaharaPutra: e.target.value,
                            namaBendahara: e.target.value 
                          });
                        }}
                        placeholder="Nama Bendahara Putra"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Ketua Pendidikan Putra</label>
                      <input
                        type="text"
                        value={pondokProfile.namaKetuaPendidikanPutra ?? pondokProfile.namaKetuaPendidikan ?? ''}
                        onChange={(e) => {
                          setPondokProfile({ 
                            ...pondokProfile, 
                            namaKetuaPendidikanPutra: e.target.value,
                            namaKetuaPendidikan: e.target.value 
                          });
                        }}
                        placeholder="Nama Ketua Pendidikan Putra"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Ketua Keamanan Putra</label>
                      <input
                        type="text"
                        value={pondokProfile.namaKetuaKeamananPutra ?? pondokProfile.namaKetuaKeamanan ?? ''}
                        onChange={(e) => {
                          setPondokProfile({ 
                            ...pondokProfile, 
                            namaKetuaKeamananPutra: e.target.value,
                            namaKetuaKeamanan: e.target.value 
                          });
                        }}
                        placeholder="Nama Ketua Keamanan Putra"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Ketua Humasy Putra</label>
                      <input
                        type="text"
                        value={pondokProfile.namaKetuaHumasyPutra ?? pondokProfile.namaKetuaHumasy ?? ''}
                        onChange={(e) => {
                          setPondokProfile({ 
                            ...pondokProfile, 
                            namaKetuaHumasyPutra: e.target.value,
                            namaKetuaHumasy: e.target.value 
                          });
                        }}
                        placeholder="Nama Ketua Humasy Putra"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Struktur Kepengurusan Putri */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-pink-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-800 flex items-center justify-center shrink-0 font-extrabold text-xs">
                        PI
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-pink-900 tracking-tight">Struktur Kepengurusan Putri</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">Pengasuh Putri</label>
                      <input
                        type="text"
                        value={pondokProfile.namaPengasuhPutri ?? pondokProfile.namaWakilPengasuhPutri ?? ''}
                        onChange={(e) => {
                          setPondokProfile({ 
                            ...pondokProfile, 
                            namaPengasuhPutri: e.target.value,
                            namaWakilPengasuhPutri: e.target.value 
                          });
                        }}
                        placeholder="Contoh: Nyai Hj. Nurul Hidayah"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Ketua Pondok Putri</label>
                      <input
                        type="text"
                        value={pondokProfile.namaKetuaPondokPutri ?? ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, namaKetuaPondokPutri: e.target.value })}
                        placeholder="Nama Ketua Pondok Putri"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Sekretaris Putri</label>
                      <input
                        type="text"
                        value={pondokProfile.namaSekretarisPutri ?? ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, namaSekretarisPutri: e.target.value })}
                        placeholder="Nama Sekretaris Putri"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Bendahara Putri</label>
                      <input
                        type="text"
                        value={pondokProfile.namaBendaharaPutri ?? ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, namaBendaharaPutri: e.target.value })}
                        placeholder="Nama Bendahara Putri"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Ketua Pendidikan Putri</label>
                      <input
                        type="text"
                        value={pondokProfile.namaKetuaPendidikanPutri ?? ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, namaKetuaPendidikanPutri: e.target.value })}
                        placeholder="Nama Ketua Pendidikan Putri"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Ketua Keamanan Putri</label>
                      <input
                        type="text"
                        value={pondokProfile.namaKetuaKeamananPutri ?? ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, namaKetuaKeamananPutri: e.target.value })}
                        placeholder="Nama Ketua Keamanan Putri"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Ketua Humasy Putri</label>
                      <input
                        type="text"
                        value={pondokProfile.namaKetuaHumasyPutri ?? ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, namaKetuaHumasyPutri: e.target.value })}
                        placeholder="Nama Ketua Humasy Putri"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-pink-600 focus:ring-1 focus:ring-pink-600 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Kontak & Alamat Lembaga */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                      <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Kontak &amp; Alamat Lembaga</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Alamat Lengkap</label>
                      <textarea
                        rows={3}
                        value={pondokProfile.alamat || ''}
                        onChange={(e) => setPondokProfile({ ...pondokProfile, alamat: e.target.value })}
                        placeholder="Masukkan alamat lengkap pesantren (Jalan, RT/RW, Dusun, Desa/Kelurahan, Kecamatan, Kab/Kota, Provinsi, Kode Pos)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white resize-none leading-relaxed"
                      />
                    </div>

                    {/* Telepon & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Telepon / WhatsApp</label>
                        <input
                          type="text"
                          value={pondokProfile.telepon || ''}
                          onChange={(e) => setPondokProfile({ ...pondokProfile, telepon: e.target.value })}
                          placeholder="Nomor Telepon / WhatsApp"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Email Resmi</label>
                        <input
                          type="text"
                          value={pondokProfile.email || ''}
                          onChange={(e) => setPondokProfile({ ...pondokProfile, email: e.target.value })}
                          placeholder="Email Resmi"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Simpan di Paling Bawah */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={pondokSaving}
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {pondokSaving ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            )}

            {/* 4. HAK AKSES TAB */}
            {activeTab === 'akses' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {aksesSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span>{aksesSuccessMsg}</span>
                  </div>
                )}

                <div className="pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Kelola Hak Akses</h3>
                  <p className="text-xs text-slate-500 font-medium">Atur izin baca (READ) dan tulis (WRITE) untuk tiap jabatan pengurus</p>
                </div>

                <div className="relative group bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Floating Scroll Left Button (Desktop: tepat di antara kolom HAK AKSES dan Sekretaris Putra, sejajar baris HAK AKSES) */}
                  {canScrollLeft && (
                    <button
                      type="button"
                      onClick={() => scrollAksesTable('left')}
                      className="hidden sm:flex absolute left-[170px] -translate-x-1/2 top-[20px] -translate-y-1/2 w-6.5 h-6.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 shadow-md border border-slate-200 items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 z-30"
                      title="Geser ke Kiri"
                      aria-label="Geser ke Kiri"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Floating Scroll Right Button (Desktop: di sisi kanan tabel, sejajar baris HAK AKSES) */}
                  {canScrollRight && (
                    <button
                      type="button"
                      onClick={() => scrollAksesTable('right')}
                      className="hidden sm:flex absolute right-2 top-[20px] -translate-y-1/2 w-6.5 h-6.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 shadow-md border border-slate-200 items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 z-30"
                      title="Geser ke Kanan"
                      aria-label="Geser ke Kanan"
                    >
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  )}

                  <div 
                    ref={aksesTableContainerRef}
                    className="w-full overflow-x-auto scrollbar-thin scroll-smooth"
                  >
                    <table className="w-full border-collapse text-left bg-white">
                      <thead>
                        <tr className="bg-[#f8fafc] text-[11px] font-bold text-slate-700 border-b border-slate-200 h-10">
                          <th rowSpan={2} className="sticky left-0 z-20 bg-[#f8fafc] py-2.5 px-4 border-r border-slate-200 w-[170px] min-w-[170px] max-w-[170px] uppercase tracking-wider text-slate-800 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                            HAK AKSES
                          </th>
                          {MODULE_INFOS.map((m) => {
                            const isPutra = m.gender === 'putra';
                            return (
                              <th 
                                key={m.id} 
                                colSpan={2} 
                                className={`py-2 px-2 text-center text-[10px] font-bold border-r last:border-r-0 border-b border-slate-200 ${
                                  isPutra 
                                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                                    : 'text-rose-800 bg-rose-50 border-rose-200'
                                }`}
                              >
                                {m.name}
                              </th>
                            );
                          })}
                        </tr>
                        <tr className="bg-white border-b border-slate-200">
                          {MODULE_INFOS.map((m) => {
                            const isPutra = m.gender === 'putra';
                            return (
                              <React.Fragment key={m.id}>
                                {ACTIONS.map((a) => (
                                  <th 
                                    key={`${m.id}-${a.id}`} 
                                    className={`text-[9px] font-bold text-center py-1 px-1 border-r last:border-r-0 border-slate-200 ${
                                      isPutra ? 'text-emerald-700 bg-emerald-50/40' : 'text-rose-700 bg-rose-50/40'
                                    }`}
                                    style={{ minWidth: '38px', width: '38px' }}
                                  >
                                    {a.label}
                                  </th>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {roles.map((r) => (
                          <tr key={r.id} className="group/tr transition-colors">
                            <td className="sticky left-0 z-10 bg-white group-hover/tr:bg-slate-50 py-2 px-4 font-bold text-slate-800 border-r border-slate-200 w-[170px] min-w-[170px] max-w-[170px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                              {r.name}
                            </td>
                            {MODULE_INFOS.map((m) => {
                              const isPutra = m.gender === 'putra';
                              return (
                                <React.Fragment key={m.id}>
                                  {ACTIONS.map((a) => {
                                    const key = `${m.id}.${a.id}`;
                                    const isChecked = r.permissions?.[key];
                                    return (
                                      <td 
                                        key={key} 
                                        className={`py-1 px-1 text-center border-r last:border-r-0 border-slate-100 ${
                                          isPutra ? 'hover:bg-emerald-50/30' : 'hover:bg-rose-50/30'
                                        }`}
                                      >
                                        {r.id === 'superadmin' ? (
                                          <div className={`mx-auto w-4 h-4 rounded flex items-center justify-center ${
                                            isPutra 
                                              ? 'bg-emerald-100 text-emerald-700' 
                                              : 'bg-rose-100 text-rose-700'
                                          }`}>
                                            <Check className="w-3 h-3 stroke-[3]" />
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleTogglePermission(r.id, key)}
                                            className={`mx-auto w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all ${
                                              isChecked
                                                ? isPutra
                                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                                  : 'bg-rose-600 text-white shadow-2xs'
                                                : isPutra
                                                  ? 'border border-emerald-300 hover:border-emerald-500 bg-white'
                                                  : 'border border-rose-300 hover:border-rose-500 bg-white'
                                            }`}
                                          >
                                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                          </button>
                                        )}
                                      </td>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tombol Simpan di Paling Bawah Kanan */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAkses}
                    disabled={aksesSaving}
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                  >
                    {aksesSaving ? 'Menyimpan...' : 'Simpan Hak Akses'}
                  </button>
                </div>
              </div>
            )}

            {/* 5. KELOLA AKUN TAB */}
            {activeTab === 'kelola_akun' && (() => {
              const hasSuper = credentials.some(c => isSuperadminAccount(c));
              const allList = hasSuper 
                ? credentials 
                : [
                    {
                      id: 'superadmin',
                      username: 'superadmin@attaroqqy.com',
                      displayName: 'Super Admin',
                      role: 'superadmin' as const,
                      status: 'approved' as const,
                      createdAt: '2026-01-01T00:00:00.000Z'
                    } as AppCredentials,
                    ...credentials
                  ];

              const sortedList = [...allList].sort((a, b) => {
                const isSuperA = isSuperadminAccount(a);
                const isSuperB = isSuperadminAccount(b);
                if (isSuperA) return -1;
                if (isSuperB) return 1;
                return 0;
              });

              const displayList = sortedList.filter(c => !credSearch || (c.displayName || c.username).toLowerCase().includes(credSearch.toLowerCase()));

              return (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Kelola Akun Pengguna</h3>
                      <p className="text-xs text-slate-500 font-medium">Verifikasi dan kelola status akun terdaftar domain @attaroqqy.com</p>
                    </div>
                    <div className="relative w-full sm:w-56">
                      <input
                        type="text"
                        placeholder="Cari pengguna..."
                        value={credSearch}
                        onChange={(e) => setCredSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-600 bg-slate-50/50 sm:bg-white"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Mobile View: Card List (khusus layar HP) */}
                  <div className="block sm:hidden space-y-3">
                    {displayList.map((c) => {
                      const isSuper = isSuperadminAccount(c);
                      const displayName = isSuper ? (c.displayName || 'Super Admin') : (c.displayName || 'Pengguna');
                      const initial = displayName.charAt(0).toUpperCase() || 'P';
                      return (
                        <div 
                          key={c.id || c.username} 
                          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                        >
                          {/* Header: Avatar + Nama + Email + Status */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate leading-tight">
                                  {displayName}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                  {c.username}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {isSuper ? (
                                <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Aktif
                                </span>
                              ) : (
                                <>
                                  {c.status === 'approved' && (
                                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      Aktif
                                    </span>
                                  )}
                                  {c.status === 'minta_reset' && (
                                    <>
                                      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        Aktif
                                      </span>
                                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        Lupa Sandi
                                      </span>
                                    </>
                                  )}
                                  {c.status === 'rejected' && (
                                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                      Diblokir
                                    </span>
                                  )}
                                  {c.status === 'pending' && (
                                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                                      Menunggu
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Hak Akses / Role Badge */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <span className="text-slate-400 font-medium">Hak Akses:</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold capitalize">
                              <Shield className="w-3 h-3 text-slate-500" />
                              {isSuper ? 'Superadmin' : c.role}
                            </span>
                          </div>

                          {/* Action Buttons for Mobile (Touch-Friendly) */}
                          {isSuper ? (
                            <div className="pt-2 flex items-center justify-end">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold select-none cursor-default">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Akun Utama (Permanen)</span>
                              </span>
                            </div>
                          ) : (
                            <div className="pt-2 flex items-center gap-2 flex-wrap">
                              {/* Status Approved: Blokir & Hapus */}
                              {c.status === 'approved' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCredStatus(c, 'rejected')}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200/80 transition-colors"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Blokir Akun</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCredDeleteConfirm({ isOpen: true, user: c })}
                                    className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200/80 transition-colors"
                                    title="Hapus Akun"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}

                              {/* Status Minta Reset: Beri Akses, Blokir, Hapus */}
                              {c.status === 'minta_reset' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setCredResetConfirm({ isOpen: true, user: c, tempPassword: '1234', showTempPassword: false })}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    <span>Beri Akses</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCredStatus(c, 'rejected')}
                                    className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200/80 transition-colors"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Blokir</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCredDeleteConfirm({ isOpen: true, user: c })}
                                    className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200/80 transition-colors"
                                    title="Hapus Akun"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}

                              {/* Status Diblokir: Unblock & Hapus */}
                              {c.status === 'rejected' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCredStatus(c, 'approved')}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Unblock</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCredDeleteConfirm({ isOpen: true, user: c })}
                                    className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200/80 transition-colors"
                                    title="Hapus Akun"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}

                              {/* Status Pending: Setujui, Blokir, Hapus */}
                              {c.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCredStatus(c, 'approved')}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Setujui</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCredStatus(c, 'rejected')}
                                    className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200/80 transition-colors"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Blokir</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCredDeleteConfirm({ isOpen: true, user: c })}
                                    className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200/80 transition-colors"
                                    title="Hapus Akun"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {displayList.length === 0 && (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">Tidak ada data pengguna ditemukan</p>
                      </div>
                    )}
                  </div>

                  {/* Desktop View: Table Layout */}
                  <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Nama &amp; Email</th>
                            <th className="py-3 px-4">Hak Akses / Role</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayList.map((c) => {
                            const isSuper = isSuperadminAccount(c);
                            const displayName = isSuper ? (c.displayName || 'Super Admin') : (c.displayName || 'Pengguna');
                            return (
                              <tr key={c.id || c.username} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900 block">{displayName}</span>
                                  <span className="text-[11px] text-slate-500">{c.username}</span>
                                </td>
                                <td className="py-3 px-4 capitalize font-semibold text-slate-700">
                                  {isSuper ? 'Superadmin' : c.role}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    {isSuper ? (
                                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        Aktif
                                      </span>
                                    ) : (
                                      <>
                                        {c.status === 'approved' && (
                                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                            Aktif
                                          </span>
                                        )}
                                        {c.status === 'minta_reset' && (
                                          <>
                                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                              Aktif
                                            </span>
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                              Lupa Sandi
                                            </span>
                                          </>
                                        )}
                                        {c.status === 'rejected' && (
                                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                            Diblokir
                                          </span>
                                        )}
                                        {c.status === 'pending' && (
                                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                                            Menunggu
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {isSuper ? (
                                    <div className="inline-flex items-center justify-end">
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold select-none cursor-default">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Akun Utama (Permanen)</span>
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center justify-end gap-1.5">
                                      {/* Status Approved: Blokir & Hapus */}
                                      {c.status === 'approved' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateCredStatus(c, 'rejected')}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200/70 transition-colors cursor-pointer active:scale-95"
                                            title="Blokir Akun"
                                          >
                                            <Ban className="w-3.5 h-3.5 text-amber-700" />
                                            <span>Blokir</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCredDeleteConfirm({ isOpen: true, user: c })}
                                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 transition-colors cursor-pointer active:scale-95"
                                            title="Hapus Akun"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}

                                      {/* Status Minta Reset: Beri Akses, Blokir, Hapus */}
                                      {c.status === 'minta_reset' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => setCredResetConfirm({ isOpen: true, user: c, tempPassword: '1234', showTempPassword: false })}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
                                            title="Beri Akses / Setel Kata Sandi Sementara"
                                          >
                                            <KeyRound className="w-3.5 h-3.5" />
                                            <span>Beri Akses</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateCredStatus(c, 'rejected')}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200/70 transition-colors cursor-pointer active:scale-95"
                                            title="Blokir Akun"
                                          >
                                            <Ban className="w-3.5 h-3.5 text-amber-700" />
                                            <span>Blokir</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCredDeleteConfirm({ isOpen: true, user: c })}
                                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 transition-colors cursor-pointer active:scale-95"
                                            title="Hapus Akun"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}

                                      {/* Status Diblokir: Unblock & Hapus */}
                                      {c.status === 'rejected' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateCredStatus(c, 'approved')}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
                                            title="Buka Blokir Akun"
                                          >
                                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>Unblock</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCredDeleteConfirm({ isOpen: true, user: c })}
                                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 transition-colors cursor-pointer active:scale-95"
                                            title="Hapus Akun"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}

                                      {/* Status Pending: Setujui, Blokir, Hapus */}
                                      {c.status === 'pending' && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateCredStatus(c, 'approved')}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
                                          >
                                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>Setujui</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateCredStatus(c, 'rejected')}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200/70 transition-colors cursor-pointer active:scale-95"
                                          >
                                            <Ban className="w-3.5 h-3.5 text-amber-700" />
                                            <span>Blokir</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCredDeleteConfirm({ isOpen: true, user: c })}
                                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 transition-colors cursor-pointer active:scale-95"
                                            title="Hapus Akun"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 6. TAHUN AJARAN TAB */}
            {activeTab === 'tahun_ajaran' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Tahun Ajaran &amp; Akademik</h3>
                    <p className="text-xs text-slate-500 font-medium">Hanya 1 tahun ajaran yang berstatus aktif dalam satu periode</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTa(null);
                      setTaNameInput('');
                      setIsTaModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Tahun Ajaran</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {academicYears.map((ta) => (
                    <div
                      key={ta.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        ta.isActive
                          ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-bold text-slate-900 block">{ta.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Periode Akademik</span>
                        </div>
                        {ta.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            Aktif
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetActiveAcademicYear(ta.id)}
                            className="text-[11px] text-emerald-700 hover:underline font-bold cursor-pointer"
                          >
                            Set Aktif
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isTaModalOpen && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">Tambah Tahun Ajaran Baru</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: 2028/2029"
                        value={taNameInput}
                        onChange={(e) => setTaNameInput(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAcademicYear}
                        className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTaModalOpen(false)}
                        className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. FEEDBACK TAB */}
            {activeTab === 'feedback' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Sticky Header Container */}
                <div className="sticky -top-6 sm:-top-8 -mt-2 pt-2 pb-3 bg-white/95 backdrop-blur-xs z-10 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Masukan / Saran</h3>
                    <p className="text-xs text-slate-500 font-medium">Tinjau dan pelajari masukan &amp; saran dari user</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFilterStarredOnly(!filterStarredOnly)}
                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                        filterStarredOnly
                          ? 'bg-amber-100/90 text-amber-800 border border-amber-300 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                      }`}
                      title={filterStarredOnly ? 'Tampilkan Semua Pesan' : 'Tampilkan Hanya Berbintang'}
                    >
                      <Star className={`w-4 h-4 ${filterStarredOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span className="hidden sm:inline">{filterStarredOnly ? 'Berbintang' : 'Semua'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={loadFeedbacks}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      title="Muat Ulang Masukan"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(() => {
                    const displayedFeedbacks = filterStarredOnly
                      ? feedbacks.filter(f => Boolean(f.isStarred || f.is_starred))
                      : feedbacks;

                    if (displayedFeedbacks.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                          {filterStarredOnly 
                            ? 'Belum ada pesan masukan berbintang.'
                            : 'Belum ada pesan masukan yang masuk.'}
                        </div>
                      );
                    }

                    return displayedFeedbacks.map((f, i) => {
                      const fId = f.id || f.message || String(f.createdAt || i);
                      const isStarred = Boolean(f.isStarred || f.is_starred);
                      const rawTime = f.createdAt || f.created_at || f.timestamp || Date.now();
                      const dateObj = new Date(rawTime);
                      const validTime = !isNaN(dateObj.getTime()) ? dateObj : new Date();
                      const dateStr = validTime.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div 
                          key={fId} 
                          onClick={() => setSelectedFeedback(f)}
                          className="group relative p-3.5 sm:p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all duration-150 space-y-1.5 select-none"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isStarred && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                              )}
                              <span className="font-bold text-slate-900 truncate">{f.senderEmail || f.sender || 'Pengurus'}</span>
                              {(f.role || f.senderRole) && (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[10px] font-semibold shrink-0">
                                  {f.role || f.senderRole}
                                </span>
                              )}
                            </div>

                            {/* Normal State: Date + Time / Hover State: Star & Delete Action Buttons */}
                            <div className="relative h-6 flex items-center justify-end shrink-0">
                              {/* Default View: Date and Time */}
                              <span className="text-slate-400 group-hover:hidden text-[11px] font-medium">
                                {dateStr}
                              </span>

                              {/* Hover View: Star and Delete Actions */}
                              <div className="hidden group-hover:flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleStarFeedback(fId, isStarred, e)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isStarred 
                                      ? 'text-amber-500 hover:bg-amber-50' 
                                      : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50/60'
                                  }`}
                                  title={isStarred ? 'Hapus Bintang' : 'Beri Bintang'}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteFeedback(fId, e)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Hapus Pesan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
                            {f.message || f.content}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* 9. ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="space-y-5 animate-in fade-in duration-150 max-w-2xl">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    SS
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      SmartSantri 4.0
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Sistem Manajemen Terpadu Madrasah &amp; Pesantren Attaroqqy
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">Versi Rilis</span>
                    <span className="font-mono text-slate-900 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">v1.2.0 Stable</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">Lembaga</span>
                    <span className="text-slate-900 font-medium">Pondok Pesantren Putri Attaroqqy</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">Status Platform</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Aktif &amp; Terlindungi Supabase Auth &amp; RLS
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-700">Hak Cipta</span>
                    <span>© 2026 Pengurus Madrasah &amp; Pesantren Attaroqqy</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </motion.div>

      {/* Feedback Detail Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Detail Masukan &amp; Saran</h3>
                    <p className="text-[11px] text-slate-500">
                      {(() => {
                        const rawTime = selectedFeedback.createdAt || selectedFeedback.created_at || selectedFeedback.timestamp || Date.now();
                        const dateObj = new Date(rawTime);
                        const validTime = !isNaN(dateObj.getTime()) ? dateObj : new Date();
                        return validTime.toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      })()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pengirim</span>
                    <span className="text-xs font-bold text-slate-800 block">{selectedFeedback.senderEmail || selectedFeedback.sender || 'Pengurus'}</span>
                  </div>
                  {(selectedFeedback.role || selectedFeedback.senderRole) && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                      {selectedFeedback.role || selectedFeedback.senderRole}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Isi Pesan Masukan</span>
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto scrollbar-thin">
                    {selectedFeedback.message || selectedFeedback.content}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStarFeedback(
                      selectedFeedback.id || selectedFeedback.message || String(selectedFeedback.createdAt),
                      Boolean(selectedFeedback.isStarred || selectedFeedback.is_starred)
                    )}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedFeedback.isStarred || selectedFeedback.is_starred
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${selectedFeedback.isStarred || selectedFeedback.is_starred ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{selectedFeedback.isStarred || selectedFeedback.is_starred ? 'Berbintang' : 'Beri Bintang'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteFeedback(
                      selectedFeedback.id || selectedFeedback.message || String(selectedFeedback.createdAt)
                    )}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ganti Kata Sandi */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Ganti Kata Sandi</h3>
                    <p className="text-[11px] text-slate-500">Perbarui kata sandi akun @attaroqqy.com</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setIsOldPasswordWrong(false);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePasswordModal} className="space-y-4">
                {/* Kotak Kata Sandi Lama */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Kata Sandi Lama</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (isOldPasswordWrong) setIsOldPasswordWrong(false);
                      }}
                      placeholder="Masukkan kata sandi lama saat ini"
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none transition-colors ${
                        isOldPasswordWrong 
                          ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500' 
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      title={showCurrentPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Tombol Lupa Sandi Rata Kiri Tepat di Bawah Kotak Input Sandi Lama */}
                  <div className="flex flex-col items-start gap-1 pt-0.5 text-[11px]">
                    {isOldPasswordWrong && (
                      <span className="font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Kata sandi lama salah
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={resetRequestSubmitting}
                      onClick={handleDirectResetRequest}
                      className="font-bold text-rose-600 hover:text-rose-700 active:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 text-left"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{resetRequestSubmitting ? 'Mengirim Permintaan...' : 'Lupa kata sandi? Minta akses'}</span>
                    </button>
                  </div>
                </div>

                {/* Kotak Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Kata Sandi Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none transition-colors ${
                        newPassword.length > 0 && newPassword.length < 4
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      title={showNewPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Peringatan Realtime Hanya Muncul Saat Ada Kesalahan */}
                  {newPassword.length > 0 && newPassword.length < 4 && (
                    <div className="text-[11px] pt-0.5">
                      <span className="font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Kata sandi kurang dari 4 digit / karakter
                      </span>
                    </div>
                  )}
                </div>

                {/* Kotak Ulangi Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Ulangi Kata Sandi Baru</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none transition-colors ${
                        confirmPassword.length > 0 && !newPassword.startsWith(confirmPassword)
                          ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      title={showConfirmPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Peringatan Realtime: Hanya Muncul Jika Ada Karakter yang Tidak Cocok / Menyimpang Sejak Awal Input */}
                  {confirmPassword.length > 0 && !newPassword.startsWith(confirmPassword) && (
                    <div className="text-[11px] pt-0.5 animate-in fade-in duration-150">
                      <span className="font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Kata sandi baru tidak sesuai / tidak cocok
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordModalOpen(false);
                      setIsOldPasswordWrong(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      passwordSaving ||
                      newPassword.length < 4 ||
                      confirmPassword !== newPassword ||
                      !currentPassword
                    }
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordSaving ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Minta Akses Reset Sandi */}
      <AnimatePresence>
        {isResetRequestModalOpen && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
              id="dialog-minta-reset-sandi"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <KeyRound className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Minta Akses Reset Sandi</h3>
                    <p className="text-[11px] text-slate-500">Ajukan permohonan reset ke Superadmin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetRequestModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Akun Pengguna</span>
                  <span className="font-bold text-slate-900">{displayName}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Email / Username</span>
                  <span className="font-mono font-medium text-slate-800">{username}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Peran / Hak Akses</span>
                  <span className="font-bold text-slate-800 capitalize">{role === 'superadmin' ? 'Super Admin' : (role || 'Pengurus')}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900 text-xs leading-relaxed">
                Dengan mengajukan permohonan ini, akun Anda akan berstatus <strong className="font-bold text-blue-800">"Minta Reset Sandi"</strong>. Superadmin akan memberikan izin reset dengan menyetel kata sandi sementara (<span className="font-mono font-bold">1234</span>).
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={resetRequestSubmitting}
                  onClick={handleSendResetRequest}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {resetRequestSubmitting ? 'Mengirim...' : 'Kirim Permintaan Reset'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Popup Alert Kata Sandi (Sukses / Gagal / Validasi) */}
      <AnimatePresence>
        {passwordAlertPopup.isOpen && (
          <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-center"
              id="dialog-password-alert-popup"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                passwordAlertPopup.type === 'success' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : passwordAlertPopup.type === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-rose-100 text-rose-600'
              }`}>
                {passwordAlertPopup.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                ) : passwordAlertPopup.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <Info className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">{passwordAlertPopup.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {passwordAlertPopup.message}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const cb = passwordAlertPopup.onConfirm;
                    setPasswordAlertPopup(prev => ({ ...prev, isOpen: false }));
                    if (cb) cb();
                  }}
                  className={`w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer ${
                    passwordAlertPopup.type === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : passwordAlertPopup.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  {passwordAlertPopup.type === 'success' ? 'Selesai' : 'Mengerti'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Photo Viewer Modal */}
      <PhotoPreviewModal
        isOpen={previewPhoto.isOpen}
        imageUrl={previewPhoto.url}
        title={previewPhoto.title}
        subtitle={previewPhoto.subtitle}
        onClose={() => setPreviewPhoto(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Modal Ganti Akun */}
      <AnimatePresence>
        {showAccountSwitcherModal && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
              id="dialog-ganti-akun"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ArrowLeftRight className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Ganti Akun</h3>
                    <p className="text-[11px] text-slate-500">Pilih akun aktif atau beralih tugas</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAccountSwitcherModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List of saved accounts */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto py-1 scrollbar-thin">
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
                        setShowAccountSwitcherModal(false);
                        setSavedAccounts(getSavedAccounts());
                        setDisplayName(acc.displayName);
                        setUsername(acc.username);
                        setRole(acc.role);
                        setAvatarUrl(acc.avatarUrl || '');
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                        isActive 
                          ? 'bg-blue-50/80 border-blue-200 text-blue-900 shadow-2xs font-semibold' 
                          : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#9E362B] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs uppercase overflow-hidden">
                        {acc.avatarUrl ? (
                          <img src={acc.avatarUrl} alt={acc.displayName} className="w-full h-full object-cover" />
                        ) : (
                          accInitials
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                            {acc.displayName}
                          </p>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {acc.username}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize font-medium">
                          {acc.role === 'superadmin' ? 'Super Admin' : (acc.role || 'Pengurus')}
                        </p>
                      </div>
                      {isActive && (
                        <Check className="w-5 h-5 text-blue-600 shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountSwitcherModal(false);
                    setShowAddAccountModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Akun</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAccountSwitcherModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Hapus Akun Pengurus */}
      <AnimatePresence>
        {credDeleteConfirm.isOpen && credDeleteConfirm.user && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-center"
              id="dialog-confirm-delete-cred"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Hapus Akun Pengurus?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun <strong className="text-slate-800">{credDeleteConfirm.user.displayName || credDeleteConfirm.user.username}</strong> ({credDeleteConfirm.user.username})? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCredDeleteConfirm({ isOpen: false, user: null })}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (credDeleteConfirm.user) {
                      handleDeleteCred(credDeleteConfirm.user);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Beri Akses & Kata Sandi Sementara (Sisi Admin) */}
      <AnimatePresence>
        {credResetConfirm.isOpen && credResetConfirm.user && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-left"
              id="dialog-beri-akses-sandi-sementara"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Beri Akses &amp; Sandi Sementara</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCredResetConfirm({ isOpen: false, user: null, tempPassword: '1234', showTempPassword: false })}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Box Info Pengguna */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Nama Pengguna</span>
                  <span className="font-bold text-slate-900">{credResetConfirm.user.displayName || credResetConfirm.user.username}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Username / Email</span>
                  <span className="font-mono text-slate-800">{credResetConfirm.user.username}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">Peran / Role</span>
                  <span className="font-semibold text-slate-800 capitalize">{credResetConfirm.user.role}</span>
                </div>
              </div>

              {/* Form Input Sandi Sementara */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Kata Sandi Sementara</label>
                <div className="relative">
                  <input
                    type={credResetConfirm.showTempPassword ? 'text' : 'password'}
                    required
                    value={credResetConfirm.tempPassword}
                    onChange={(e) => setCredResetConfirm(prev => ({ ...prev, tempPassword: e.target.value }))}
                    placeholder="Contoh: 1234"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-xs sm:text-sm font-mono font-bold focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setCredResetConfirm(prev => ({ ...prev, showTempPassword: !prev.showTempPassword }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={credResetConfirm.showTempPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {credResetConfirm.showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setCredResetConfirm(prev => ({ ...prev, tempPassword: '1234' }))}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Gunakan 1234
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const pin = String(Math.floor(100000 + Math.random() * 900000));
                      setCredResetConfirm(prev => ({ ...prev, tempPassword: pin, showTempPassword: true }));
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                  >
                    Acak PIN 6-Digit
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCredResetConfirm({ isOpen: false, user: null, tempPassword: '1234', showTempPassword: false })}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (credResetConfirm.user) {
                      handleGrantResetAccess(credResetConfirm.user, credResetConfirm.tempPassword);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan &amp; Beri Akses</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Sukses Beri Sandi Sementara (Siap Disalin & Diberikan ke Pengguna) */}
      <AnimatePresence>
        {tempPasswordSuccessModal.isOpen && tempPasswordSuccessModal.user && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-center"
              id="dialog-sukses-sandi-sementara"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Akses &amp; Sandi Sementara Diberikan</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Akun <strong className="text-slate-800">{tempPasswordSuccessModal.user.displayName || tempPasswordSuccessModal.user.username}</strong> telah aktif kembali dengan kata sandi sementara:
                </p>
              </div>

              {/* Tampilan Sandi Sementara Bersih: Karakter Besar dengan Garis Bawah per Karakter */}
              <div className="py-2 flex items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
                {tempPasswordSuccessModal.tempPassword.split('').map((char, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center min-w-[32px] sm:min-w-[40px] pb-1 border-b-2 sm:border-b-3 border-slate-900 font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 select-all"
                  >
                    {char}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-600 text-left leading-relaxed bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                Silakan beritahukan kata sandi sementara di atas kepada pengguna agar dapat digunakan untuk login dan mengganti kata sandinya ke yang baru.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setTempPasswordSuccessModal({ isOpen: false, user: null, tempPassword: '', copied: false })}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Logout */}
      <AnimatePresence>
        {showLogoutConfirmModal && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 text-center"
              id="dialog-confirm-logout"
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
      </AnimatePresence>

      {/* Modal Tambah Akun (Login / Register) */}
      <AddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onAccountAdded={() => {
          setSavedAccounts(getSavedAccounts());
          const activeUsername = localStorage.getItem('smartsantri_active_username') || '';
          const activeDisplayName = localStorage.getItem('smartsantri_active_display_name') || '';
          const activeRole = localStorage.getItem('smartsantri_active_role') || '';
          const activeAvatar = localStorage.getItem('smartsantri_profile_avatar') || '';
          setDisplayName(activeDisplayName);
          setUsername(activeUsername);
          setRole(activeRole);
          setAvatarUrl(activeAvatar);
        }}
      />

      {/* Pop-up Modal Perizinan Notifikasi */}
      <NotificationPermissionModal
        isOpen={showNotifPermissionModal}
        onClose={() => setShowNotifPermissionModal(false)}
        onPermissionGranted={() => setNotifPermission('granted')}
      />
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
