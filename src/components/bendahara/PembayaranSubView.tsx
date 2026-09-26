import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Trash2, 
  Plus, 
  Check, 
  Receipt, 
  Printer, 
  Banknote, 
  CreditCard, 
  Building2, 
  PiggyBank, 
  CheckCircle2, 
  X, 
  History,
  BookOpen,
  Utensils,
  Tag,
  Sparkles,
  Layers,
  AlertTriangle,
  Info,
  Edit2,
  School,
  ArrowLeftRight
} from 'lucide-react';
import { Santri, BendaharaRecord, Lembaga, Kelas } from '../../types';
import { PaymentCartItem, PaymentReceipt, SantriPaymentItem, PaymentSubPeriod, DEFAULT_PAYMENT_ITEMS } from './pembayaranTypes';
import PaymentReceiptModal from './PaymentReceiptModal';
import CreatePaymentItemModal from './CreatePaymentItemModal';
import { isCustomPasFoto } from '../SekretarisHelper';
import { getApiUrl, fetchTableData } from '../../lib/api';
import { getSantriAcademicPlacements } from '../../lib/utils';

interface PembayaranSubViewProps {
  santriList?: Santri[];
  bendaharaList?: BendaharaRecord[];
  onUpdateBendaharaStatus?: (id: string, isPaid: boolean) => void;
}

// Fallback Santri jika data masih kosong untuk demo kasir instan
const FALLBACK_SANTRI_LIST: Santri[] = [
  {
    id: 's-demo-1',
    nis: '2025001',
    nama: 'Ahmad Fauzi Rabbani',
    kelas: 'VII Tsanawiyah A',
    kamar: 'Al-Ghazali 01',
    desa: 'Jamblang',
    kabupaten: 'Cirebon',
    provinsi: 'Jawa Barat',
    asal: 'Cirebon, Jawa Barat',
    gender: 'Putra',
    tanggalMasuk: '2024-07-15',
    statusKeanggotaan: 'Aktif',
    namaWali: 'H. Abdul Rabbani',
    noHp: '081234567890'
  },
  {
    id: 's-demo-2',
    nis: '2025002',
    nama: 'Muhammad Zaki Al-Farisi',
    kelas: 'VIII Tsanawiyah B',
    kamar: 'Ibnu Rusyd 03',
    desa: 'Sokaraja',
    kabupaten: 'Banyumas',
    provinsi: 'Jawa Tengah',
    asal: 'Banyumas, Jawa Tengah',
    gender: 'Putra',
    tanggalMasuk: '2023-07-10',
    statusKeanggotaan: 'Aktif',
    namaWali: 'Mustafa Al-Farisi',
    noHp: '081398765432'
  },
  {
    id: 's-demo-3',
    nis: '2025003',
    nama: 'Fatimah Az-Zahra',
    kelas: 'IX Tsanawiyah Putri',
    kamar: 'Khadijah 02',
    desa: 'Singaparna',
    kabupaten: 'Tasikmalaya',
    provinsi: 'Jawa Barat',
    asal: 'Tasikmalaya, Jawa Barat',
    gender: 'Putri',
    tanggalMasuk: '2022-07-12',
    statusKeanggotaan: 'Aktif',
    namaWali: 'Dra. Siti Munawwaroh',
    noHp: '082155443322'
  },
  {
    id: 's-demo-4',
    nis: '2025004',
    nama: 'Rizky Pratama Al-Bantani',
    kelas: 'X Aliyah Keagamaan',
    kamar: 'Imam Syafi\'i 04',
    desa: 'Kramatwatu',
    kabupaten: 'Serang',
    provinsi: 'Banten',
    asal: 'Serang, Banten',
    gender: 'Putra',
    tanggalMasuk: '2021-07-10',
    statusKeanggotaan: 'Aktif',
    namaWali: 'Ir. Hendra Pratama',
    noHp: '081511223344'
  }
];

// Helper untuk format alamat santri: desa, kabupaten, provinsi
const formatAlamatSantri = (s: Santri): string => {
  const parts = [s.desa, s.kabupaten, s.provinsi].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }
  return s.asal || 'Alamat belum diatur';
};

// Helper inisial avatar
const getSantriInitials = (name: string): string => {
  const words = (name || '').trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return '?';
  if (words.length === 1) {
    return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Helper normalisasi tanggal ke format ISO YYYY-MM-DD untuk perbandingan kronologis akurat
const normalizeDateStr = (d?: string): string | null => {
  if (!d) return null;
  const trimmed = d.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const dateObj = new Date(trimmed);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split('T')[0];
  }
  return null;
};

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

// Helper format tampilan tanggal DD/MM/YYYY
const formatDateDisplay = (d?: string): string => {
  if (!d) return '-';
  const norm = normalizeDateStr(d);
  if (!norm) return d;
  const [y, m, day] = norm.split('-');
  return `${parseInt(day, 10)}/${parseInt(m, 10)}/${y}`;
};

export default function PembayaranSubView({
  santriList = [],
  bendaharaList = [],
  onUpdateBendaharaStatus
}: PembayaranSubViewProps) {
  // Gunakan data santri nyata jika ada, atau fallback demo
  const activeSantriList = useMemo(() => {
    return santriList.length > 0 ? santriList : FALLBACK_SANTRI_LIST;
  }, [santriList]);

  // View state: 'pos' (kasir) atau 'history' (riwayat hari ini)
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Santri yang sedang dipilih (dimulai null agar kotak pencarian tampil)
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [santriSearch, setSantriSearch] = useState('');
  const [isSearchingSantri, setIsSearchingSantri] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown jika klik di luar input pencarian dan dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchingSantri(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Cart / Register State
  const [cart, setCart] = useState<PaymentCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'tabungan'>('cash');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [cashierNote, setCashierNote] = useState('');

  // Completed Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);

  // Local History of Transactions processed
  const [historyList, setHistoryList] = useState<PaymentReceipt[]>(() => {
    try {
      const saved = localStorage.getItem('smartsantri_payment_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Status sub-periode per santri ('lunas' | 'cicil' | 'belum')
  const [subPeriodStatusMap, setSubPeriodStatusMap] = useState<Record<string, 'lunas' | 'cicil' | 'belum'>>(() => {
    try {
      const saved = localStorage.getItem('smartsantri_subperiod_status');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Data rincian cicilan per sub-periode santri (nominal terbayar & total tagihan)
  const [installmentsMap, setInstallmentsMap] = useState<Record<string, { paidAmount: number; totalAmount: number; lastPaymentDate?: string }>>(() => {
    try {
      const saved = localStorage.getItem('smartsantri_subperiod_installments');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // State pilihan sub-periode dan konfigurasi pembayaran per item kasir
  const [itemSelections, setItemSelections] = useState<Record<string, {
    selectedPeriodIds: string[];
    isCicil: boolean;
    customAmount?: number;
  }>>({});

  // Peringatan saat mencoba membayar periode berikutnya sementara periode cicilan sebelumnya belum lunas
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);

  // Helper cek apakah suatu sub-periode sudah lewat jatuh tempo (menunggak)
  const isSubPeriodPastDue = (subPeriod: PaymentSubPeriod): boolean => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1 - 12 (Contoh: September = 9)

    const pYear = subPeriod.endYear || subPeriod.periodYear;
    const pMonth = subPeriod.endMonth || subPeriod.periodMonth;

    if (!pYear) return false;
    if (pYear < currentYear) return true;
    if (pYear === currentYear && pMonth !== undefined && pMonth < currentMonth) return true;
    return false;
  };

  // Helper mendapatkan info cicilan sub-periode
  const getInstallmentInfo = (
    santriId: string,
    itemId: string,
    subPeriodId: string,
    defaultTotal: number
  ) => {
    const key = `${santriId}_${itemId}_${subPeriodId}`;
    if (installmentsMap[key]) {
      return installmentsMap[key];
    }
    // Jika berstatus cicil tetapi belum pernah disimpan, sediakan nominal default 40%
    const defaultPaid = Math.round(defaultTotal * 0.4);
    return {
      paidAmount: defaultPaid,
      totalAmount: defaultTotal
    };
  };

  // Helper mendapatkan status sub-periode santri
  const getSubPeriodStatus = (
    santri: Santri,
    item: SantriPaymentItem,
    subPeriod: PaymentSubPeriod,
    index: number
  ): 'lunas' | 'cicil' | 'belum' => {
    const key = `${santri.id}_${item.id}_${subPeriod.id}`;
    if (subPeriodStatusMap[key]) {
      return subPeriodStatusMap[key];
    }

    // 1. Cek riwayat struk pembayaran kasir santri ini
    const inHistory = historyList.some(h => 
      (h.santriId === santri.id || h.santriNama?.toLowerCase() === santri.nama.toLowerCase()) &&
      h.items.some(it => it.itemId === item.id && (it.month === subPeriod.label || it.note?.includes(subPeriod.label)))
    );
    if (inHistory) return 'lunas';

    // 2. Cek data bendaharaList umum
    const matchedBendahara = bendaharaList.find(b => 
      b.namaSantri.toLowerCase() === santri.nama.toLowerCase() &&
      (subPeriod.label.toLowerCase().includes(b.bulan.toLowerCase()) || 
       b.bulan.toLowerCase().includes((subPeriod.shortLabel || '').toLowerCase()))
    );
    if (matchedBendahara) {
      if (matchedBendahara.status === 'Lunas') return 'lunas';
      if (matchedBendahara.status === 'Belum Lunas' && (matchedBendahara.nominal || 0) > 0) return 'cicil';
    }

    // 3. Simulasi status realistis santri: periode awal lunas, periode berjalan cicil, selanjutnya belum
    const seed = (santri.nama.charCodeAt(0) + santri.nama.length) % 2;
    if (index === 0) {
      return 'lunas'; // Periode awal lunas
    }
    if (index === 1) {
      return seed === 0 ? 'cicil' : 'lunas';
    }
    if (index === 2) {
      return seed === 0 ? 'belum' : 'cicil';
    }
    return 'belum';
  };

  // Cek apakah ada periode sebelum targetIndex yang masih berstatus cicilan belum lunas
  const getUnfinishedInstallmentBefore = (
    santri: Santri,
    item: SantriPaymentItem,
    targetIndex: number
  ): { period: PaymentSubPeriod; index: number; paidAmount: number; totalAmount: number } | null => {
    if (!item.subPeriods) return null;
    for (let i = 0; i < targetIndex; i++) {
      const sp = item.subPeriods[i];
      const status = getSubPeriodStatus(santri, item, sp, i);
      if (status === 'cicil') {
        const info = getInstallmentInfo(santri.id, item.id, sp.id, item.defaultAmount || 350000);
        return {
          period: sp,
          index: i,
          paidAmount: info.paidAmount,
          totalAmount: info.totalAmount
        };
      }
    }
    return null;
  };

  // Cek periode pertama yang sedang dalam status cicilan belum lunas
  const getFirstUnfinishedInstallment = (
    santri: Santri,
    item: SantriPaymentItem
  ): { period: PaymentSubPeriod; index: number; paidAmount: number; totalAmount: number } | null => {
    if (!item.subPeriods) return null;
    for (let i = 0; i < item.subPeriods.length; i++) {
      const sp = item.subPeriods[i];
      const status = getSubPeriodStatus(santri, item, sp, i);
      if (status === 'cicil') {
        const info = getInstallmentInfo(santri.id, item.id, sp.id, item.defaultAmount || 350000);
        return {
          period: sp,
          index: i,
          paidAmount: info.paidAmount,
          totalAmount: info.totalAmount
        };
      }
    }
    return null;
  };

  // Handler klik pada pill sub-periode
  const handleSubPeriodClick = (
    item: SantriPaymentItem,
    period: PaymentSubPeriod,
    index: number
  ) => {
    if (!selectedSantri) {
      setSelectSantriNotice(true);
      setTimeout(() => setSelectSantriNotice(false), 4500);
      setIsSearchingSantri(true);
      return;
    }

    const status = getSubPeriodStatus(selectedSantri, item, period, index);

    // 1. Jika sudah lunas, tidak perlu dipilih untuk dibayar
    if (status === 'lunas') {
      setBlockedNotice(`Periode ${period.label} sudah LUNAS.`);
      setTimeout(() => setBlockedNotice(null), 3000);
      return;
    }

    // 2. Jika ada periode sebelum ini yang masih dicicil (belum lunas), BLOKIR pemilihan periode ini!
    const unfinishedBefore = getUnfinishedInstallmentBefore(selectedSantri, item, index);
    if (unfinishedBefore) {
      setBlockedNotice(
        `Periode ${unfinishedBefore.period.label} masih dalam cicilan (belum lunas). Harap lunasi terlebih dahulu sebelum membayar periode berikutnya (${period.label}).`
      );
      setTimeout(() => setBlockedNotice(null), 5000);
      return;
    }

    // 3. Update pilihan periode untuk item ini
    setItemSelections(prev => {
      const current = prev[item.id] || { selectedPeriodIds: [], isCicil: false };
      const isAlreadySelected = current.selectedPeriodIds.includes(period.id);

      let nextSelectedIds: string[];
      if (isAlreadySelected) {
        nextSelectedIds = current.selectedPeriodIds.filter(id => id !== period.id);
      } else {
        nextSelectedIds = [...current.selectedPeriodIds, period.id];
      }

      let nextIsCicil = false;
      let nextAmount = item.defaultAmount || 0;

      if (nextSelectedIds.length === 1) {
        const singlePeriodId = nextSelectedIds[0];
        const singlePeriod = item.subPeriods?.find(sp => sp.id === singlePeriodId);
        const singleIdx = item.subPeriods?.findIndex(sp => sp.id === singlePeriodId) ?? -1;
        const singleStatus = singlePeriod 
          ? getSubPeriodStatus(selectedSantri, item, singlePeriod, singleIdx)
          : 'belum';

        if (singleStatus === 'cicil') {
          // Otomatis ON dan Lanjut cicilan
          nextIsCicil = true;
          const info = getInstallmentInfo(selectedSantri.id, item.id, singlePeriodId, item.defaultAmount || 350000);
          nextAmount = Math.max(0, info.totalAmount - info.paidAmount);
        } else {
          // Periode baru: jika sebelumnya user menyalakan mode cicil, pertahankan
          nextIsCicil = current.isCicil;
          nextAmount = current.isCicil && current.customAmount 
            ? current.customAmount 
            : (item.defaultAmount || 0);
        }
      } else {
        // Lebih dari 1 periode dipilih: mode cicil otomatis nonaktif
        nextIsCicil = false;
        nextAmount = (item.defaultAmount || 0) * nextSelectedIds.length;
      }

      return {
        ...prev,
        [item.id]: {
          selectedPeriodIds: nextSelectedIds,
          isCicil: nextIsCicil,
          customAmount: nextAmount
        }
      };
    });
  };

  // Toggle switch mode cicil
  const handleToggleCicilMode = (itemId: string) => {
    setItemSelections(prev => {
      const current = prev[itemId];
      if (!current || current.selectedPeriodIds.length !== 1) return prev;

      const singlePeriodId = current.selectedPeriodIds[0];
      const item = paymentItems.find(p => p.id === itemId);
      const singlePeriod = item?.subPeriods?.find(sp => sp.id === singlePeriodId);
      const singleIdx = item?.subPeriods?.findIndex(sp => sp.id === singlePeriodId) ?? -1;
      const singleStatus = (selectedSantri && item && singlePeriod)
        ? getSubPeriodStatus(selectedSantri, item, singlePeriod, singleIdx)
        : 'belum';

      // Jika periode ini memang sedang dicicil, toggle tidak bisa dimatikan (karena harus lanjut cicilan)
      if (singleStatus === 'cicil') {
        return prev;
      }

      const nextIsCicil = !current.isCicil;
      const defaultAmt = item?.defaultAmount || 0;
      const customAmt = nextIsCicil 
        ? (item?.minInstallmentAmount || Math.round(defaultAmt / 2) || 100000)
        : defaultAmt;

      return {
        ...prev,
        [itemId]: {
          ...current,
          isCicil: nextIsCicil,
          customAmount: customAmt
        }
      };
    });
  };

  // Handler saat input jumlah cicilan diubah
  const handleInstallmentAmountChange = (itemId: string, rawVal: string) => {
    const numVal = parseInt(rawVal.replace(/\D/g, ''), 10) || 0;
    setItemSelections(prev => {
      const current = prev[itemId] || { selectedPeriodIds: [], isCicil: true };
      return {
        ...prev,
        [itemId]: {
          ...current,
          customAmount: numVal
        }
      };
    });
  };

  // Tambahkan item yang telah dikonfigurasi (periode & cicilan) ke keranjang kasir
  const handleAddConfiguredItemToCart = (item: SantriPaymentItem) => {
    if (!selectedSantri) {
      setSelectSantriNotice(true);
      setTimeout(() => setSelectSantriNotice(false), 4500);
      setIsSearchingSantri(true);
      return;
    }

    const selection = itemSelections[item.id];
    let selectedPeriodIds = selection?.selectedPeriodIds || [];

    // Jika belum ada periode yang dipilih dan item memiliki subPeriods:
    if (item.subPeriods && item.subPeriods.length > 0 && selectedPeriodIds.length === 0) {
      // Prioritaskan periode yang sedang dicicil
      const unfinished = getFirstUnfinishedInstallment(selectedSantri, item);
      if (unfinished) {
        handleSubPeriodClick(item, unfinished.period, unfinished.index);
        return;
      }
      // Atau periode pertama yang belum lunas
      const firstUnpaidIdx = item.subPeriods.findIndex((sp, idx) => {
        return getSubPeriodStatus(selectedSantri, item, sp, idx) !== 'lunas';
      });
      if (firstUnpaidIdx !== -1) {
        handleSubPeriodClick(item, item.subPeriods[firstUnpaidIdx], firstUnpaidIdx);
        return;
      }
    }

    const isCicil = Boolean(selection?.isCicil);
    const isContinuing = selectedPeriodIds.length === 1 && item.subPeriods && (() => {
      const sp = item.subPeriods.find(p => p.id === selectedPeriodIds[0]);
      const idx = item.subPeriods.findIndex(p => p.id === selectedPeriodIds[0]);
      return sp ? getSubPeriodStatus(selectedSantri, item, sp, idx) === 'cicil' : false;
    })();

    const selectedPeriods = item.subPeriods
      ? item.subPeriods.filter(sp => selectedPeriodIds.includes(sp.id))
      : [];
    const selectedLabels = selectedPeriods.map(sp => sp.label);

    let amount = 0;
    if (isCicil) {
      amount = selection?.customAmount !== undefined ? selection.customAmount : (item.defaultAmount || 0);
    } else {
      amount = (item.defaultAmount || 0) * (selectedPeriodIds.length || 1);
    }

    let note = '';
    if (selectedLabels.length > 0) {
      const pStr = selectedLabels.join(', ');
      if (isContinuing) {
        note = `Periode: ${pStr} • Lanjut Cicilan`;
      } else if (isCicil) {
        note = `Periode: ${pStr} • Mode Cicil`;
      } else {
        note = `Periode: ${pStr}`;
      }
    } else {
      note = item.description || `Pembayaran ${item.name}`;
    }

    const newCartItem: PaymentCartItem = {
      id: `cart-${item.id}`,
      itemId: item.id,
      name: item.name,
      category: item.category || 'lainnya',
      amount: amount,
      quantity: 1,
      note: note,
      selectedPeriodIds: selectedPeriodIds,
      isCicil: isCicil,
      isContinuing: Boolean(isContinuing),
      subPeriodId: selectedPeriodIds.length === 1 ? selectedPeriodIds[0] : undefined,
      totalPeriodAmount: item.defaultAmount
    };

    setCart(prev => {
      const withoutThis = prev.filter(c => c.itemId !== item.id);
      return [...withoutThis, newCartItem];
    });
  };

  // Mode Pembayaran Terpisah: Putra vs Putri
  const [genderFilter, setGenderFilter] = useState<'Putra' | 'Putri'>('Putra');

  // Filter santri sesuai mode Putra / Putri yang aktif
  const genderFilteredSantriList = useMemo(() => {
    return activeSantriList.filter(s => s.gender === genderFilter);
  }, [activeSantriList, genderFilter]);

  // Filter santri untuk saran pencarian sesuai gender aktif
  const searchedSantriList = useMemo(() => {
    if (!santriSearch.trim()) return genderFilteredSantriList.slice(0, 6);
    const q = santriSearch.toLowerCase();
    return genderFilteredSantriList.filter(s => 
      (s.nama || '').toLowerCase().includes(q) ||
      (s.nis || '').toLowerCase().includes(q) ||
      (s.desa || '').toLowerCase().includes(q) ||
      (s.kabupaten || '').toLowerCase().includes(q) ||
      (s.provinsi || '').toLowerCase().includes(q) ||
      (s.asal || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [genderFilteredSantriList, santriSearch]);

  // Master Item Pembayaran yang tersimpan di aplikasi
  const [paymentItems, setPaymentItems] = useState<SantriPaymentItem[]>(() => {
    try {
      const saved = localStorage.getItem('smartsantri_payment_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PAYMENT_ITEMS;
  });

  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SantriPaymentItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SantriPaymentItem | null>(null);
  const [selectSantriNotice, setSelectSantriNotice] = useState(false);

  // Data Lembaga dan Kelas dari Modul Pendidikan
  const [lembagasList, setLembagasList] = useState<Lembaga[]>(() => {
    try {
      const local = localStorage.getItem('smartsantri_lembagas');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [kelasList, setKelasList] = useState<Kelas[]>(() => {
    try {
      const local = localStorage.getItem('smartsantri_kelas');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    fetchTableData<Lembaga>('lembaga', 'smartsantri_lembagas', lembagasList)
      .then(data => {
        if (data && data.length > 0) setLembagasList(data);
      })
      .catch(() => {});

    fetchTableData<Kelas>('kelas', 'smartsantri_kelas', kelasList)
      .then(data => {
        if (data && data.length > 0) setKelasList(data);
      })
      .catch(() => {});
  }, []);

  // Update nominal item yang ada di keranjang kasir
  const handleUpdateCartItemAmount = (cartId: string, newAmount: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartId) {
        return { ...item, amount: Math.max(0, newAmount) };
      }
      return item;
    }));
  };

  // Switch filter gender dan reset santri terpilih jika gender tidak cocok
  const handleGenderFilterChange = (newGender: 'Putra' | 'Putri') => {
    if (genderFilter === newGender) return;
    setGenderFilter(newGender);
    if (selectedSantri && selectedSantri.gender !== newGender) {
      setSelectedSantri(null);
      setSantriSearch('');
      setIsSearchingSantri(true);
      setCart([]);
    }
  };

  // Simpan jenis item pembayaran baru atau hasil edit
  const handleSavePaymentItem = (itemToSave: SantriPaymentItem) => {
    setPaymentItems(prev => {
      const exists = prev.some(it => it.id === itemToSave.id);
      let updated: SantriPaymentItem[];
      if (exists) {
        updated = prev.map(it => it.id === itemToSave.id ? itemToSave : it);
      } else {
        updated = [itemToSave, ...prev];
      }
      try {
        localStorage.setItem('smartsantri_payment_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setEditingItem(null);
  };

  // Hapus jenis item pembayaran dari aplikasi
  const handleDeletePaymentItem = (itemId: string) => {
    setPaymentItems(prev => {
      const updated = prev.filter(it => it.id !== itemId);
      try {
        localStorage.setItem('smartsantri_payment_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setCart(prev => prev.filter(c => c.itemId !== itemId));
    setDeleteConfirmItem(null);
  };

  // Logika Penyaringan Item Pembayaran:
  // - Saat BELUM ADA santri dipilih: tampilkan semua jenis pembayaran yang relevan dengan filter gender aktif (Putra/Putri)
  // - Saat MEMILIH santri: tampilkan HANYA jenis pembayaran yang relevan dengan santri tersebut (berdasarkan gender dan lembaga pendidikan)
  const displayedPaymentItems = useMemo<SantriPaymentItem[]>(() => {
    if (!selectedSantri) {
      return paymentItems.filter(item => 
        !item.targetGender || 
        item.targetGender === 'Semua' || 
        item.targetGender === genderFilter
      );
    }

    // Identifikasi lembaga tempat santri terpilih terdaftar
    const santriLembagaInfo = getSantriAcademicPlacements(selectedSantri, lembagasList, kelasList);
    const santriRegisteredLembagaIds = new Set<string>();
    santriLembagaInfo.placements.forEach(p => {
      if (p.isRegistered && p.lembagaId) {
        santriRegisteredLembagaIds.add(String(p.lembagaId));
      }
    });
    if (santriLembagaInfo.formalInfo?.lembaga?.id) {
      santriRegisteredLembagaIds.add(String(santriLembagaInfo.formalInfo.lembaga.id));
    }

    const sKelasLower = (selectedSantri.kelas || '').toLowerCase();
    const sFormalLower = (selectedSantri.pendidikanFormal || '').toLowerCase();
    const sTanggalMasuk = normalizeDateStr(selectedSantri.tanggalMasuk);
    const sTanggalKeluar = normalizeDateStr(selectedSantri.tanggalKeluar);

    return paymentItems.filter(item => {
      // 1. Filter sasaran jenis kelamin (Gender)
      if (item.targetGender && item.targetGender !== 'Semua') {
        if (selectedSantri.gender && item.targetGender !== selectedSantri.gender) {
          return false;
        }
      }

      // 2. Filter sasaran lembaga pendidikan jika dispesifikasi
      const hasSpecificLembagaTarget = 
        (item.targetLembagaIds && item.targetLembagaIds.length > 0) ||
        (item.targetLembagas && item.targetLembagas.length > 0) ||
        (item.targetLembaga && item.targetLembaga !== 'Semua');

      if (hasSpecificLembagaTarget) {
        // Cek kecocokan ID lembaga jika ada
        let matchId = false;
        if (item.targetLembagaIds && item.targetLembagaIds.length > 0) {
          matchId = item.targetLembagaIds.some(targetId => santriRegisteredLembagaIds.has(String(targetId)));
        }

        // Cek kecocokan nama / kode lembaga di kelas atau pendidikanFormal santri
        let matchName = false;
        if (!matchId) {
          const targetList = item.targetLembagas || (item.targetLembaga ? item.targetLembaga.split(',').map(s => s.trim()) : []);
          matchName = targetList.some(target => {
            const t = target.toLowerCase();
            return sKelasLower.includes(t) || sFormalLower.includes(t);
          });
        }

        if (!matchId && !matchName) return false;
      }

      // 3. Logika khusus Sekali Bayar:
      // a) Santri yang boyong sebelum periode mulai -> tidak terkena wajib bayar
      // b) Santri yang daftar setelah periode berakhir -> tidak terkena wajib bayar
      // c) Filter tanggal masuk dari dan sampai jika diatur pada item
      if (item.paymentFrequency === 'sekali') {
        // Santri yang boyong sebelum periode dimulai
        if (item.startDate) {
          const itemStart = normalizeDateStr(item.startDate);
          if (itemStart && sTanggalKeluar && sTanggalKeluar < itemStart) {
            return false;
          }
        }

        // Santri yang daftar setelah periode berakhir
        if (item.endDate) {
          const itemEnd = normalizeDateStr(item.endDate);
          if (itemEnd && sTanggalMasuk && sTanggalMasuk > itemEnd) {
            return false;
          }
        }

        // Filter spesifik tanggal masuk dari & sampai
        if (item.entryDateFrom) {
          const entryFrom = normalizeDateStr(item.entryDateFrom);
          if (entryFrom && (!sTanggalMasuk || sTanggalMasuk < entryFrom)) {
            return false;
          }
        }

        if (item.entryDateTo) {
          const entryTo = normalizeDateStr(item.entryDateTo);
          if (entryTo && (!sTanggalMasuk || sTanggalMasuk > entryTo)) {
            return false;
          }
        }
      } else {
        // Pembayaran berkala (Bulanan / Triwulan / Caturwulan / Semester):
        // 1. Jika santri sudah boyong sebelum bulan tagihan dimulai, tidak ditagihkan
        if (item.startYear && item.startMonth) {
          const periodStart = `${item.startYear}-${String(item.startMonth).padStart(2, '0')}-01`;
          if (sTanggalKeluar && sTanggalKeluar < periodStart) {
            return false;
          }
        }

        // 2. Evaluasi batas bebas tagihan tanggal masuk santri baru
        if (item.entryCutoffDay && sTanggalMasuk && item.subPeriods && item.subPeriods.length > 0) {
          const activeSubPeriods = item.subPeriods.filter(sp => sp.isActive);
          if (activeSubPeriods.length > 0) {
            const lastPeriod = activeSubPeriods[activeSubPeriods.length - 1];
            let cutoffYear = lastPeriod.periodYear;
            let cutoffMonth = lastPeriod.periodMonth || 1;

            if (item.paymentFrequency !== 'bulanan' && item.entryCutoffMonthIndex && item.entryCutoffMonthIndex > 1) {
              const offset = item.entryCutoffMonthIndex - 1;
              const rawMonth = (cutoffMonth - 1) + offset;
              cutoffYear += Math.floor(rawMonth / 12);
              cutoffMonth = (rawMonth % 12) + 1;
            }

            const cutoffDate = `${cutoffYear}-${String(cutoffMonth).padStart(2, '0')}-${String(item.entryCutoffDay).padStart(2, '0')}`;

            // Santri yang masuk setelah batas bebas tagihan dibebaskan dari tagihan
            if (sTanggalMasuk > cutoffDate) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [selectedSantri, paymentItems, genderFilter, lembagasList, kelasList]);

  // Helper tampilan kategori
  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'syahriah':
        return { label: 'Syahriah / SPP', icon: Receipt, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'makan':
        return { label: 'Uang Makan', icon: Utensils, badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'kitab':
        return { label: 'Kitab & Modul', icon: BookOpen, badge: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'infaq':
        return { label: 'Infaq & Gedung', icon: PiggyBank, badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'seragam':
        return { label: 'Seragam', icon: Tag, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'kegiatan':
        return { label: 'Kegiatan', icon: Sparkles, badge: 'bg-pink-50 text-pink-700 border-pink-200' };
      default:
        return { label: 'Lainnya', icon: Layers, badge: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Cart Calculations
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.amount * (item.quantity || 1)), 0);
  }, [cart]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    const numGiven = typeof cashGiven === 'number' ? cashGiven : 0;
    return Math.max(0, numGiven - totalAmount);
  }, [paymentMethod, cashGiven, totalAmount]);

  const isCashInsufficient = useMemo(() => {
    if (paymentMethod !== 'cash') return false;
    if (totalAmount === 0) return false;
    const numGiven = typeof cashGiven === 'number' ? cashGiven : 0;
    return numGiven < totalAmount;
  }, [paymentMethod, cashGiven, totalAmount]);

  // Tambahkan item jenis pembayaran ke keranjang/register kasir
  const handleAddPaymentItemToCart = (item: SantriPaymentItem) => {
    if (!selectedSantri) {
      setSelectSantriNotice(true);
      setTimeout(() => setSelectSantriNotice(false), 4500);
      setIsSearchingSantri(true);
      return;
    }

    if (cart.some(c => c.itemId === item.id)) return;

    const newCartItem: PaymentCartItem = {
      id: `cart-${item.id}`,
      itemId: item.id,
      name: item.name,
      category: item.category,
      amount: item.defaultAmount,
      quantity: 1,
      note: item.description || `Pembayaran ${item.name}`
    };
    setCart(prev => [...prev, newCartItem]);
  };

  // Tambahkan semua item pembayaran yang relevan ke keranjang
  const handleAddAllRelevantItems = () => {
    if (!selectedSantri) return;
    const newItems: PaymentCartItem[] = [];
    for (const item of displayedPaymentItems) {
      if (!cart.some(c => c.itemId === item.id)) {
        newItems.push({
          id: `cart-${item.id}`,
          itemId: item.id,
          name: item.name,
          category: item.category,
          amount: item.defaultAmount,
          quantity: 1,
          note: item.description || `Pembayaran ${item.name}`
        });
      }
    }
    if (newItems.length > 0) {
      setCart(prev => [...prev, ...newItems]);
    }
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(prev => prev.filter(c => c.id !== cartId));
  };

  const handleClearCart = () => {
    setCart([]);
    setCashGiven('');
    setCashierNote('');
    setItemSelections({});
    setBlockedNotice(null);
  };

  // Quick cash buttons
  const handleQuickCash = (amount: number | 'exact') => {
    if (amount === 'exact') {
      setCashGiven(totalAmount);
    } else {
      setCashGiven(prev => {
        const current = typeof prev === 'number' ? prev : 0;
        return current + amount;
      });
    }
  };

  // Eksekusi Pembayaran
  const handleProcessPayment = () => {
    if (!selectedSantri || cart.length === 0 || totalAmount <= 0) return;
    
    const receiptNum = `RCP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    
    const newReceipt: PaymentReceipt = {
      id: `receipt-${Date.now()}`,
      receiptNumber: receiptNum,
      santriId: selectedSantri.id,
      santriNama: selectedSantri.nama,
      santriNis: selectedSantri.nis,
      santriKelas: selectedSantri.kelas || '-',
      santriKamar: selectedSantri.kamar || '-',
      waliName: selectedSantri.namaWali,
      waliPhone: selectedSantri.noHp,
      paymentDate: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      paymentMethod: paymentMethod,
      items: cart,
      totalAmount: totalAmount,
      paidAmount: paymentMethod === 'cash' ? (typeof cashGiven === 'number' ? cashGiven : totalAmount) : totalAmount,
      changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
      cashierName: 'Bendahara Pesantren',
      note: cashierNote || undefined
    };

    // Update status di bendaharaList jika terhubung
    if (onUpdateBendaharaStatus) {
      cart.forEach(item => {
        if (item.bendaharaRecordId) {
          onUpdateBendaharaStatus(item.bendaharaRecordId, true);
        }
      });
    }

    // Perbarui status sub-periode dan catatan cicilan santri
    if (selectedSantri) {
      const nextSubPeriodMap = { ...subPeriodStatusMap };
      const nextInstallmentsMap = { ...installmentsMap };
      let hasChanges = false;

      cart.forEach(cartItem => {
        const matchedItem = paymentItems.find(p => p.id === cartItem.itemId);
        if (matchedItem?.subPeriods && matchedItem.subPeriods.length > 0) {
          const selPeriodIds = cartItem.selectedPeriodIds || [];
          const periodsToUpdate = selPeriodIds.length > 0
            ? matchedItem.subPeriods.filter(sp => selPeriodIds.includes(sp.id))
            : [matchedItem.subPeriods.find(sp => {
                const k = `${selectedSantri.id}_${matchedItem.id}_${sp.id}`;
                return nextSubPeriodMap[k] !== 'lunas';
              })].filter(Boolean) as PaymentSubPeriod[];

          periodsToUpdate.forEach(period => {
            const k = `${selectedSantri.id}_${matchedItem.id}_${period.id}`;
            const totalPeriodAmount = matchedItem.defaultAmount || 350000;
            const currentInst = nextInstallmentsMap[k] || {
              paidAmount: nextSubPeriodMap[k] === 'cicil' ? Math.round(totalPeriodAmount * 0.4) : 0,
              totalAmount: totalPeriodAmount
            };

            const paidThisTime = cartItem.isCicil 
              ? cartItem.amount 
              : Math.round(cartItem.amount / (periodsToUpdate.length || 1));
            const newPaid = currentInst.paidAmount + paidThisTime;

            if (newPaid >= totalPeriodAmount) {
              nextSubPeriodMap[k] = 'lunas';
              nextInstallmentsMap[k] = {
                paidAmount: totalPeriodAmount,
                totalAmount: totalPeriodAmount,
                lastPaymentDate: new Date().toISOString()
              };
            } else {
              nextSubPeriodMap[k] = 'cicil';
              nextInstallmentsMap[k] = {
                paidAmount: newPaid,
                totalAmount: totalPeriodAmount,
                lastPaymentDate: new Date().toISOString()
              };
            }
            hasChanges = true;
          });
        }
      });

      if (hasChanges) {
        setSubPeriodStatusMap(nextSubPeriodMap);
        setInstallmentsMap(nextInstallmentsMap);
        try {
          localStorage.setItem('smartsantri_subperiod_status', JSON.stringify(nextSubPeriodMap));
          localStorage.setItem('smartsantri_subperiod_installments', JSON.stringify(nextInstallmentsMap));
        } catch (e) {}
      }
    }

    // Simpan ke riwayat lokal
    setHistoryList(prev => {
      const next = [newReceipt, ...prev];
      try {
        localStorage.setItem('smartsantri_payment_history', JSON.stringify(next.slice(0, 50)));
      } catch (e) {}
      return next;
    });

    // Buka struk modal
    setActiveReceipt(newReceipt);

    // Reset keranjang kasir & pilihan item
    setCart([]);
    setCashGiven('');
    setCashierNote('');
    setItemSelections({});
    setBlockedNotice(null);
  };

  return (
    <div className="space-y-4">
      {/* Sub-Header & Switcher Kasir POS vs Riwayat */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border shadow-xs transition-all ${
        genderFilter === 'Putra' ? 'border-blue-200/80' : 'border-pink-200/80'
      }`}>
        <div>
          <h1 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
            <span>Kasir Pembayaran</span>
            <span
              onClick={() => handleGenderFilterChange(genderFilter === 'Putra' ? 'Putri' : 'Putra')}
              className={`inline-flex items-center gap-1.5 transition-all duration-200 select-none cursor-pointer active:scale-95 ${
                genderFilter === 'Putra' 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : 'text-pink-600 hover:text-pink-700'
              }`}
              title={`Klik untuk beralih ke ${genderFilter === 'Putra' ? 'Santri Putri' : 'Santri Putra'}`}
            >
              <span>{genderFilter === 'Putra' ? 'Santri Putra' : 'Santri Putri'}</span>
              <ArrowLeftRight className="w-4 h-4 mt-0.5 shrink-0" />
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {genderFilter === 'Putra' 
              ? 'Layanan kasir & tagihan asrama santri putra terpadu' 
              : 'Layanan kasir & tagihan asrama santri putri terpadu'}
          </p>
        </div>

        {/* View Switcher: POS vs Riwayat Hari Ini */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'pos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Kasir POS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Hari Ini</span>
            {historyList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                {historyList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* TAB RIWAYAT TRANSAKSI KASIR HARI INI */
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-700" />
              <h2 className="font-bold text-sm text-slate-900">Riwayat Pembayaran Terbaru</h2>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Total {historyList.length} Transaksi
            </div>
          </div>

          {historyList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-xs font-semibold">Belum ada transaksi pembayaran yang diproses hari ini</div>
              <p className="text-[11px] text-slate-400">Pilih tab Kasir POS untuk mulai memproses pembayaran santri.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">No. Bukti</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Nama Santri</th>
                    <th className="py-2.5 px-3">Item Dibayar</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.receiptNumber}</td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{item.paymentDate}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <div>{item.santriNama}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIS: {item.santriNis}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {item.items.map(i => i.name).join(', ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        Rp {item.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Lihat Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB KASIR POS (2 KOLOM RESPONSIVE) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* KOLOM KIRI: PENCARIAN SANTRI & DAFTAR TAGIHAN VALID */}
          <div className="lg:col-span-7 space-y-4">
            {/* Kotak Pencarian Santri (TIDAK di dalam kontainer, tanpa teks 'Santri Penerima' & 'Ganti Santri') */}
            {!selectedSantri ? (
              <div ref={searchContainerRef} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={genderFilter === 'Putra' ? "Cari santri putra (nama, NIS, alamat)..." : "Cari santri putri (nama, NIS, alamat)..."}
                  value={santriSearch}
                  onFocus={() => setIsSearchingSantri(true)}
                  onChange={e => {
                    setSantriSearch(e.target.value);
                    setIsSearchingSantri(true);
                  }}
                  className={`w-full pl-10 pr-9 py-3 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 font-medium shadow-xs transition-all ${
                    genderFilter === 'Putra'
                      ? 'border-slate-200 hover:border-blue-300 focus:ring-blue-500/20 focus:border-blue-500'
                      : 'border-slate-200 hover:border-pink-300 focus:ring-pink-500/20 focus:border-pink-500'
                  }`}
                />
                {santriSearch && (
                  <button
                    type="button"
                    onClick={() => setSantriSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Bersihkan pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Dropdown Suggestions saat mencari */}
                {isSearchingSantri && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {searchedSantriList.map(s => {
                      const hasPhoto = isCustomPasFoto(s.filePasFoto);
                      const alamat = formatAlamatSantri(s);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedSantri(s);
                            setIsSearchingSantri(false);
                            setSantriSearch('');
                          }}
                          className={`w-full text-left p-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors ${
                            selectedSantri?.id === s.id ? 'bg-emerald-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar lingkaran sempurna */}
                            <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 aspect-square">
                              {hasPhoto ? (
                                <img
                                  src={getApiUrl(s.filePasFoto!)}
                                  alt={s.nama}
                                  className="w-full h-full object-cover rounded-full aspect-square"
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs text-white ${s.gender === 'Putri' ? 'bg-pink-500' : 'bg-emerald-600'}`}>
                                  {getSantriInitials(s.nama)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{s.nama}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                                <span className="font-mono text-slate-400">NIS: {s.nis}</span>
                                <span>•</span>
                                <span className="truncate">{alamat}</span>
                              </div>
                            </div>
                          </div>
                          {selectedSantri?.id === s.id && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                    {searchedSantriList.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Santri {genderFilter.toLowerCase()} tidak ditemukan. Coba ketik nama, NIS, atau asal daerah lain.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Saat ada santri terpilih: isi kotak pencarian jadi profil santri dengan tombol X di kanan */
              <div className="relative flex items-center justify-between gap-3 p-3 sm:p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Foto lingkaran sempurna sama seperti data santri sekretaris */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-emerald-500/30 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 aspect-square shadow-xs">
                    {isCustomPasFoto(selectedSantri.filePasFoto) ? (
                      <img
                        src={getApiUrl(selectedSantri.filePasFoto!)}
                        alt={selectedSantri.nama}
                        className="w-full h-full object-cover rounded-full aspect-square"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-full h-full rounded-full flex items-center justify-center font-sans font-bold text-sm sm:text-base text-white ${selectedSantri.gender === 'Putri' ? 'bg-pink-500' : 'bg-emerald-600'}`}>
                        {getSantriInitials(selectedSantri.nama)}
                      </div>
                    )}
                  </div>

                  {/* Profil info: Nama, NIS, dan alamat saja "desa, kabupaten, provinsi" */}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {selectedSantri.nama}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="font-mono text-slate-400">NIS: {selectedSantri.nis}</span>
                      <span>•</span>
                      <span className="truncate text-slate-600">{formatAlamatSantri(selectedSantri)}</span>
                    </div>
                  </div>
                </div>

                {/* Tombol X di kanan untuk mengganti dengan mencari lagi */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSantri(null);
                    setSantriSearch('');
                    setIsSearchingSantri(true);
                    setCart([]);
                    setItemSelections({});
                    setBlockedNotice(null);
                  }}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
                  title="Ganti / Cari Santri Lain"
                  aria-label="Ganti santri dan cari lagi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* KOTAK DAFTAR ITEM PEMBAYARAN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-xs sm:text-sm text-slate-900">
                      Item Pembayaran
                    </h2>
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center justify-center">
                      {displayedPaymentItems.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedSantri
                      ? `Menampilkan Pembayaran yang relevan dengan ${selectedSantri.nama}`
                      : `Menampilkan item pembayaran yang relevan untuk santri ${genderFilter.toLowerCase()}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  {selectedSantri && displayedPaymentItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddAllRelevantItems}
                      className="px-2.5 py-1.5 rounded-full text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold transition-colors"
                      title="Tambahkan semua item yang relevan ke kasir"
                    >
                      Pilih Semua
                    </button>
                  )}
                  {/* Tombol Buat: text 'Buat', plus di kanan, jangan warna hitam */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsCreateItemModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Buat</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Peringatan jika klik item tanpa santri terpilih */}
              {selectSantriNotice && !selectedSantri && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Silakan cari dan <strong>pilih santri terlebih dahulu</strong> pada kotak pencarian di atas sebelum memasukkan pembayaran ke kasir.
                  </span>
                </div>
              )}

              {/* Peringatan jika periode cicilan sebelumnya belum lunas */}
              {blockedNotice && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-medium">{blockedNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockedNotice(null)}
                    className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
                    title="Tutup pemberitahuan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Tampilkan Daftar Item Pembayaran */}
              {displayedPaymentItems.length === 0 ? (
                <div className="py-12 sm:py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-slate-300" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-700">
                    Tidak ada jenis pembayaran yang relevan
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Tidak ditemukan item pembayaran yang sesuai dengan kriteria santri ini.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsCreateItemModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span>Buat</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {displayedPaymentItems.map(item => {
                    const isInCart = cart.some(c => c.itemId === item.id);

                    return (
                      <div
                        key={item.id}
                        className={`group p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isInCart
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Detail Pembayaran: Hanya nama dan nominal per periode tanpa icon */}
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                            {item.name}
                          </span>
                          <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                            {item.defaultAmount && item.defaultAmount > 0 ? (
                              <>
                                <span>Rp {item.defaultAmount.toLocaleString('id-ID')}</span>
                                <span className="text-[11px] font-sans font-medium text-slate-400">
                                  {item.paymentFrequency === 'bulanan'
                                    ? '/ bulan'
                                    : item.paymentFrequency === 'triwulan'
                                    ? '/ triwulan'
                                    : item.paymentFrequency === 'caturwulan'
                                    ? '/ caturwulan'
                                    : item.paymentFrequency === 'semester'
                                    ? '/ semester'
                                    : item.paymentFrequency === 'sekali'
                                    ? '/ sekali bayar'
                                    : ''}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-sans font-medium italic">
                                Tarif Fleksibel
                              </span>
                            )}
                          </div>

                          {/* Kotak-kotak Sub Periode (Hijau = Lunas, Kuning = Masih Dicicil, Merah = Menunggak, Outline = Belum) */}
                          {item.subPeriods && item.subPeriods.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.subPeriods.map((period, pIdx) => {
                                  const displayLabel = period.shortLabel || (
                                    item.paymentFrequency === 'bulanan'
                                      ? (period.periodMonth ? SHORT_MONTH_NAMES[period.periodMonth - 1] : period.label.slice(0, 3))
                                      : item.paymentFrequency === 'triwulan'
                                      ? `T${pIdx + 1}`
                                      : item.paymentFrequency === 'caturwulan'
                                      ? `C${pIdx + 1}`
                                      : `S${pIdx + 1}`
                                  );

                                  const status = selectedSantri 
                                    ? getSubPeriodStatus(selectedSantri, item, period, pIdx)
                                    : 'belum';

                                  const isPastDue = isSubPeriodPastDue(period);
                                  const isLunas = status === 'lunas';
                                  const isCicil = status === 'cicil';
                                  // Menunggak: Belum lunas & periode sudah lewat jatuh tempo
                                  const isMenunggak = !isLunas && !isCicil && isPastDue;
                                  // Belum bayar: Belum lunas & periode belum jatuh tempo (bulan berjalan / mendatang)
                                  const isBelum = !isLunas && !isCicil && !isPastDue;

                                  // Cek apakah terkunci karena periode cicilan sebelumnya belum lunas
                                  const unfinishedBefore = selectedSantri 
                                    ? getUnfinishedInstallmentBefore(selectedSantri, item, pIdx) 
                                    : null;
                                  const isLocked = Boolean(unfinishedBefore);

                                  const selection = itemSelections[item.id];
                                  const isSelected = Boolean(selection?.selectedPeriodIds?.includes(period.id));

                                  const statusText = isLunas 
                                    ? 'Lunas' 
                                    : isCicil 
                                    ? 'Masih Dicicil' 
                                    : isMenunggak 
                                    ? 'Menunggak (Lewat Jatuh Tempo)' 
                                    : 'Belum Bayar';

                                  return (
                                    <button
                                      key={period.id || pIdx}
                                      type="button"
                                      title={`${period.label} • ${statusText}${isLocked ? ' (Terkunci: selesaikan cicilan sebelumnya terlebih dahulu)' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSubPeriodClick(item, period, pIdx);
                                      }}
                                      className={`w-7 h-7 sm:w-8 sm:h-8 aspect-square rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center shrink-0 transition-all select-none relative ${
                                        isLocked
                                          ? 'bg-transparent border border-dashed border-slate-300 text-slate-300 cursor-not-allowed opacity-50'
                                          : isLunas
                                          ? 'bg-emerald-600 border border-emerald-600 text-white shadow-2xs hover:bg-emerald-700 cursor-pointer'
                                          : isCicil
                                          ? 'bg-amber-400 border border-amber-500 text-amber-950 font-extrabold shadow-2xs hover:bg-amber-500 cursor-pointer'
                                          : isMenunggak
                                          ? 'bg-rose-500 border border-rose-600 text-white font-bold shadow-2xs hover:bg-rose-600 cursor-pointer'
                                          : 'bg-transparent border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50/50 cursor-pointer'
                                      } ${
                                        isSelected 
                                          ? 'ring-2 ring-emerald-500 ring-offset-2 scale-105 z-10 font-black' 
                                          : ''
                                      }`}
                                    >
                                      {displayLabel}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Keterangan Indikator Status Warna saat santri dipilih */}
                              {selectedSantri && (
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    <span>Lunas</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                    <span>Dicicil</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                    <span className="text-rose-600 font-bold">Menunggak</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-transparent"></span>
                                    <span>Belum Bayar</span>
                                  </span>
                                </div>
                              )}

                              {/* Panel Konfigurasi Periode Terpilih & Mode Cicil */}
                              {selectedSantri && itemSelections[item.id] && itemSelections[item.id].selectedPeriodIds.length > 0 && (() => {
                                const selection = itemSelections[item.id];
                                const isMultiSelected = selection.selectedPeriodIds.length > 1;
                                const singlePeriodId = selection.selectedPeriodIds[0];
                                const singlePeriod = item.subPeriods?.find(sp => sp.id === singlePeriodId);
                                const singleIdx = item.subPeriods?.findIndex(sp => sp.id === singlePeriodId) ?? -1;
                                const singleStatus = singlePeriod ? getSubPeriodStatus(selectedSantri, item, singlePeriod, singleIdx) : 'belum';
                                const isContinuingCicil = !isMultiSelected && singleStatus === 'cicil';
                                const singleCicilInfo = singlePeriod ? getInstallmentInfo(selectedSantri.id, item.id, singlePeriodId, item.defaultAmount || 350000) : null;
                                const selectedPeriodsList = item.subPeriods ? item.subPeriods.filter(sp => selection.selectedPeriodIds.includes(sp.id)) : [];
                                const selectedPeriodLabelsText = selectedPeriodsList.map(sp => sp.shortLabel || sp.label).join(', ');

                                const computedAmount = selection.isCicil
                                  ? (selection.customAmount !== undefined ? selection.customAmount : (item.defaultAmount || 0))
                                  : (item.defaultAmount || 0) * selection.selectedPeriodIds.length;

                                return (
                                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5 animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                        <span>Periode:</span>
                                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-emerald-800 font-mono font-bold text-[11px]">
                                          {selectedPeriodLabelsText}
                                        </span>
                                      </div>

                                      {/* Toggle Mode Cicil */}
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${
                                          isMultiSelected 
                                            ? 'text-slate-400' 
                                            : isContinuingCicil 
                                            ? 'text-amber-800 font-extrabold' 
                                            : 'text-slate-700'
                                        }`}>
                                          {isContinuingCicil ? 'Lanjut cicilan' : 'Mode cicil'}
                                        </span>
                                        <button
                                          type="button"
                                          role="switch"
                                          aria-checked={selection.isCicil}
                                          disabled={isMultiSelected || isContinuingCicil}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleCicilMode(item.id);
                                          }}
                                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            selection.isCicil ? 'bg-amber-500' : 'bg-slate-200'
                                          } ${isMultiSelected ? 'opacity-40 cursor-not-allowed' : isContinuingCicil ? 'cursor-default' : 'cursor-pointer'}`}
                                          title={
                                            isMultiSelected 
                                              ? 'Mode cicil hanya bisa diaktifkan saat yang dipilih hanya 1 periode' 
                                              : isContinuingCicil 
                                              ? 'Periode ini sedang dalam cicilan belum lunas (otomatis Lanjut Cicilan)' 
                                              : 'Aktifkan jika ingin membayar secara bertahap / mencicil'
                                          }
                                        >
                                          <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                              selection.isCicil ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Notice jika memilih lebih dari 1 periode */}
                                    {isMultiSelected && (
                                      <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5">
                                        <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                                        <span>Mode cicil hanya bisa diaktifkan saat yang dipilih hanya 1 periode.</span>
                                      </div>
                                    )}

                                    {/* Info status cicilan berjalan */}
                                    {isContinuingCicil && singleCicilInfo && (
                                      <div className="text-[11px] text-amber-900 bg-amber-100/70 border border-amber-300/80 rounded-lg p-2 space-y-0.5">
                                        <div>
                                          Sudah dibayar sebelumnya: <strong>Rp {singleCicilInfo.paidAmount.toLocaleString('id-ID')}</strong> dari total <strong>Rp {singleCicilInfo.totalAmount.toLocaleString('id-ID')}</strong>.
                                        </div>
                                        <div className="font-bold text-amber-950 flex items-center justify-between">
                                          <span>Sisa tagihan: Rp {(singleCicilInfo.totalAmount - singleCicilInfo.paidAmount).toLocaleString('id-ID')}</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Kotak Input Jumlah yang Ingin Dibayarkan saat Mode Cicil Aktif */}
                                    {selection.isCicil && (
                                      <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[11px] font-bold text-slate-700">
                                            Jumlah yang ingin dibayarkan
                                          </label>
                                          {isContinuingCicil && singleCicilInfo && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const remaining = Math.max(0, singleCicilInfo.totalAmount - singleCicilInfo.paidAmount);
                                                handleInstallmentAmountChange(item.id, String(remaining));
                                              }}
                                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                                            >
                                              Lunasi Sisa (Rp {(singleCicilInfo.totalAmount - singleCicilInfo.paidAmount).toLocaleString('id-ID')})
                                            </button>
                                          )}
                                        </div>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                          <input
                                            type="text"
                                            value={selection.customAmount !== undefined ? selection.customAmount.toLocaleString('id-ID') : ''}
                                            onChange={(e) => handleInstallmentAmountChange(item.id, e.target.value)}
                                            placeholder="0"
                                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-bold text-slate-900 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Baris Tombol Konfirmasi ke Kasir */}
                                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80">
                                      <div className="text-xs">
                                        <span className="text-slate-500">Nominal bayar: </span>
                                        <span className="font-mono font-bold text-emerald-700">
                                          Rp {computedAmount.toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddConfiguredItemToCart(item);
                                        }}
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                      >
                                        <span>{cart.some(c => c.itemId === item.id) ? 'Perbarui di Kasir' : 'Masukkan ke Kasir'}</span>
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {/* Tombol Aksi: Hanya icon dan hanya muncul saat hover */}
                        <div className={`shrink-0 flex items-center gap-1.5 transition-opacity duration-150 ${
                          isInCart ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {!selectedSantri ? (
                            /* Saat TIDAK ADA santri yang dipilih: tombol EDIT dan HAPUS hanya icon */
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsCreateItemModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-slate-600 flex items-center justify-center transition-all shadow-xs active:scale-95"
                                title="Edit item ini"
                                aria-label="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmItem(item)}
                                className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 flex items-center justify-center transition-all shadow-xs active:scale-95"
                                title="Hapus item ini"
                                aria-label="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            </>
                          ) : isInCart ? (
                            <button
                              type="button"
                              onClick={() => {
                                const cartItem = cart.find(c => c.itemId === item.id);
                                if (cartItem) handleRemoveFromCart(cartItem.id);
                              }}
                              className="w-8 h-8 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition-colors shadow-xs"
                              title="Sudah di kasir (klik untuk membatalkan)"
                              aria-label="Di Kasir"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddConfiguredItemToCart(item)}
                              className="w-8 h-8 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center transition-all shadow-xs active:scale-95"
                              title="Tambah ke kasir"
                              aria-label="Tambah"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN (PANEL KASIR / REGISTER CHECKOUT) */}
          <div className="lg:col-span-5 sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
              {/* Header Register */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-extrabold text-sm text-slate-900">Rincian Pembayaran</h2>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 space-y-1.5">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                    <div className="text-xs font-semibold">Belum ada tagihan dipilih</div>
                    <p className="text-[10px] text-slate-400">Pilih santri dan klik tagihan di sebelah kiri.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                          {item.isContinuing ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 uppercase tracking-wider">
                              Lanjut Cicilan
                            </span>
                          ) : item.isCicil ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                              Mode Cicil
                            </span>
                          ) : null}
                        </div>
                        {item.note && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {item.note}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {item.isCicil ? 'Jumlah dibayar:' : 'Nominal:'}
                          </span>
                          <span className="text-xs font-bold text-slate-400">Rp</span>
                          <input
                            type="text"
                            value={item.amount ? item.amount.toLocaleString('id-ID') : ''}
                            onChange={e => {
                              const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                              handleUpdateCartItemAmount(item.id, val);
                            }}
                            placeholder="0"
                            className="w-28 px-2 py-0.5 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-800"
                            title="Sesuaikan tarif/nominal pembayaran"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Hapus item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Ringkasan & Form Pembayaran */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {/* Total Biaya */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Total Tagihan:</span>
                  <span className="font-mono font-black text-base sm:text-lg text-emerald-800">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Metode Pembayaran */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'Tunai', icon: Banknote },
                      { id: 'transfer', label: 'Transfer/QR', icon: Building2 },
                      { id: 'tabungan', label: 'Tabungan', icon: PiggyBank }
                    ].map(m => {
                      const IconComp = m.icon;
                      const isSel = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            isSel
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <IconComp className="w-4 h-4 shrink-0" />
                          <span className="text-center leading-tight">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jika Metode Tunai: Input Uang Diterima & Kembalian */}
                {paymentMethod === 'cash' && cart.length > 0 && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">Uang Diterima (Rp)</label>
                      <button
                        type="button"
                        onClick={() => handleQuickCash('exact')}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        Uang Pas
                      </button>
                    </div>

                    <input
                      type="number"
                      placeholder="0"
                      value={cashGiven}
                      onChange={e => setCashGiven(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />

                    {/* Quick nominal chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[50000, 100000, 200000, 500000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickCash(val)}
                          className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[10px] font-bold text-slate-700 transition-colors font-mono"
                        >
                          +{val.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>

                    {/* Kembalian Display */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Kembalian:</span>
                      <span className={`font-mono font-extrabold text-sm ${
                        isCashInsufficient ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {isCashInsufficient ? 'Uang Masih Kurang' : `Rp ${changeAmount.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Catatan Singkat Kasir */}
                <input
                  type="text"
                  placeholder="Catatan pembayaran (opsional)..."
                  value={cashierNote}
                  onChange={e => setCashierNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
                />

                {/* Tombol Eksekusi Bayar Sekarang */}
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={cart.length === 0 || !selectedSantri || (paymentMethod === 'cash' && isCashInsufficient)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {cart.length === 0
                      ? 'Pilih Tagihan Terlebih Dahulu'
                      : isCashInsufficient
                      ? 'Uang Pembayaran Belum Cukup'
                      : `Bayar Sekarang (Rp ${totalAmount.toLocaleString('id-ID')})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Receipt Modal (Struk Pembayaran) */}
      <PaymentReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        onNewTransaction={() => setActiveReceipt(null)}
      />

      {/* Modal Buat / Edit Item Pembayaran */}
      <CreatePaymentItemModal
        isOpen={isCreateItemModalOpen}
        onClose={() => {
          setIsCreateItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSavePaymentItem}
        itemToEdit={editingItem}
        defaultTargetGender={genderFilter}
        lembagasList={lembagasList}
      />

      {/* Modal Konfirmasi Hapus Item Pembayaran */}
      {deleteConfirmItem && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 p-5 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900">Hapus Item Pembayaran?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Item <strong className="text-slate-800">{deleteConfirmItem.name}</strong> akan dihapus secara permanen dari daftar tarif pembayaran pondok.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeletePaymentItem(deleteConfirmItem.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
