import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ShieldAlert, Info } from 'lucide-react';
import { SantriPaymentItem, PaymentFrequency, PaymentSubPeriod } from './pembayaranTypes';
import { Lembaga } from '../../types';
import { fetchTableData } from '../../lib/api';

interface CreatePaymentItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: SantriPaymentItem) => void;
  itemToEdit?: SantriPaymentItem | null;
  defaultTargetGender?: 'Semua' | 'Putra' | 'Putri';
  lembagasList?: Lembaga[];
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const PAYMENT_FREQUENCIES: { id: PaymentFrequency; label: string }[] = [
  { id: 'sekali', label: 'Sekali Bayar' },
  { id: 'bulanan', label: 'Bulanan' },
  { id: 'triwulan', label: 'Triwulan' },
  { id: 'caturwulan', label: 'Caturwulan' },
  { id: 'semester', label: 'Semester' }
];

const FALLBACK_LEMBAGAS: Lembaga[] = [
  { id: 'lem-mts', nama: 'Madrasah Tsanawiyah', kode: 'MTs', jenis: 'Formal', jenjang: 'Wustho' },
  { id: 'lem-ma', nama: 'Madrasah Aliyah', kode: 'MA', jenis: 'Formal', jenjang: 'Ulya' },
  { id: 'lem-madin', nama: 'Madrasah Diniyyah', kode: 'MADIN', jenis: 'Internal', jenjang: 'Wustho' },
  { id: 'lem-tahfidz', nama: 'Tahfidzul Qur\'an', kode: 'TAHFIDZ', jenis: 'Internal', jenjang: 'Pondok' },
];

/**
 * Format input rupiah per 3 digit dengan titik.
 * Aturan awalan 0:
 * - Tidak bisa awalan 0 jika setelah 0 diketik angka lain (0 langsung digantikan angka baru).
 * - Kecuali jika setelah 0 adalah koma (misal "0," atau "0,5").
 */
function formatRupiahInput(val: string): string {
  // Hanya ambil digit angka dan koma
  let clean = val.replace(/[^\d,]/g, '');
  if (!clean) return '';

  const parts = clean.split(',');
  let integerPart = parts[0] || '';
  const decimalPart = parts.length > 1 ? parts.slice(1).join('') : null;

  // Tangani penggantian angka 0 di depan
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+/, '');
    if (integerPart === '') {
      integerPart = '0';
    }
  }

  // Format ribuan dengan titik
  if (integerPart) {
    const rawNumber = parseInt(integerPart, 10);
    if (!isNaN(rawNumber)) {
      integerPart = rawNumber.toLocaleString('id-ID');
    }
  }

  if (decimalPart !== null) {
    return `${integerPart},${decimalPart}`;
  }
  return integerPart;
}

function parseRupiahNumber(val: string): number {
  if (!val) return 0;
  const normalized = val.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Generator sub-periode dinamis berdasarkan frekuensi, bulan mulai, dan tahun mulai.
 */
function generateSubPeriods(
  frequency: PaymentFrequency,
  startMonth: number,
  startYear: number,
  existingSubPeriods?: PaymentSubPeriod[]
): PaymentSubPeriod[] {
  if (frequency === 'sekali') return [];

  const existingMap = new Map<string, boolean>();
  if (existingSubPeriods) {
    existingSubPeriods.forEach(sp => {
      existingMap.set(sp.id, sp.isActive);
    });
  }

  const result: PaymentSubPeriod[] = [];

  if (frequency === 'bulanan') {
    // 12 bulan berturut-turut dari startMonth & startYear
    for (let i = 0; i < 12; i++) {
      const monthIdx = (startMonth - 1 + i) % 12;
      const yearOffset = Math.floor((startMonth - 1 + i) / 12);
      const currentYear = startYear + yearOffset;
      const currentMonth = monthIdx + 1;
      const id = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[monthIdx]} ${currentYear}`;
      const shortLabel = SHORT_MONTH_NAMES[monthIdx];
      const isActive = existingMap.has(id) ? existingMap.get(id)! : true;

      result.push({
        id,
        label,
        shortLabel,
        periodYear: currentYear,
        periodMonth: currentMonth,
        isActive
      });
    }
  } else if (frequency === 'triwulan') {
    // 4 triwulan (masing-masing 3 bulan)
    for (let i = 0; i < 4; i++) {
      const startOffset = i * 3;
      const m1Idx = (startMonth - 1 + startOffset) % 12;
      const y1 = startYear + Math.floor((startMonth - 1 + startOffset) / 12);

      const endOffset = startOffset + 2;
      const m2Idx = (startMonth - 1 + endOffset) % 12;
      const y2 = startYear + Math.floor((startMonth - 1 + endOffset) / 12);

      const id = `${y1}-TW${i + 1}`;
      const rangeText = y1 === y2 
        ? `${SHORT_MONTH_NAMES[m1Idx]} - ${SHORT_MONTH_NAMES[m2Idx]} ${y2}`
        : `${SHORT_MONTH_NAMES[m1Idx]} ${y1} - ${SHORT_MONTH_NAMES[m2Idx]} ${y2}`;
      const label = `Triwulan ${i + 1} (${rangeText})`;
      const shortLabel = `T${i + 1}`;
      const isActive = existingMap.has(id) ? existingMap.get(id)! : true;

      result.push({
        id,
        label,
        shortLabel,
        periodYear: y1,
        periodMonth: m1Idx + 1,
        endYear: y2,
        endMonth: m2Idx + 1,
        isActive
      });
    }
  } else if (frequency === 'caturwulan') {
    // 3 caturwulan (masing-masing 4 bulan)
    for (let i = 0; i < 3; i++) {
      const startOffset = i * 4;
      const m1Idx = (startMonth - 1 + startOffset) % 12;
      const y1 = startYear + Math.floor((startMonth - 1 + startOffset) / 12);

      const endOffset = startOffset + 3;
      const m2Idx = (startMonth - 1 + endOffset) % 12;
      const y2 = startYear + Math.floor((startMonth - 1 + endOffset) / 12);

      const id = `${y1}-CW${i + 1}`;
      const rangeText = y1 === y2 
        ? `${SHORT_MONTH_NAMES[m1Idx]} - ${SHORT_MONTH_NAMES[m2Idx]} ${y2}`
        : `${SHORT_MONTH_NAMES[m1Idx]} ${y1} - ${SHORT_MONTH_NAMES[m2Idx]} ${y2}`;
      const label = `Caturwulan ${i + 1} (${rangeText})`;
      const shortLabel = `C${i + 1}`;
      const isActive = existingMap.has(id) ? existingMap.get(id)! : true;

      result.push({
        id,
        label,
        shortLabel,
        periodYear: y1,
        periodMonth: m1Idx + 1,
        endYear: y2,
        endMonth: m2Idx + 1,
        isActive
      });
    }
  } else if (frequency === 'semester') {
    // 2 semester (masing-masing 6 bulan)
    for (let i = 0; i < 2; i++) {
      const startOffset = i * 6;
      const m1Idx = (startMonth - 1 + startOffset) % 12;
      const y1 = startYear + Math.floor((startMonth - 1 + startOffset) / 12);

      const endOffset = startOffset + 5;
      const m2Idx = (startMonth - 1 + endOffset) % 12;
      const y2 = startYear + Math.floor((startMonth - 1 + endOffset) / 12);

      const id = `${y1}-SM${i + 1}`;
      const title = i === 0 ? 'Semester Ganjil' : 'Semester Genap';
      const rangeText = y1 === y2 
        ? `${SHORT_MONTH_NAMES[m1Idx]} - ${SHORT_MONTH_NAMES[m2Idx]} ${y2}`
        : `${SHORT_MONTH_NAMES[m1Idx]} ${y1} - ${SHORT_MONTH_NAMES[m2Idx]} ${y2}`;
      const label = `${title} (${rangeText})`;
      const shortLabel = `S${i + 1}`;
      const isActive = existingMap.has(id) ? existingMap.get(id)! : true;

      result.push({
        id,
        label,
        shortLabel,
        periodYear: y1,
        periodMonth: m1Idx + 1,
        endYear: y2,
        endMonth: m2Idx + 1,
        isActive
      });
    }
  }

  return result;
}

// Default batas bebas tagihan: bulanan tgl 25, jenis pembayaran lain bulan terakhir tgl 15
export const getDefaultCutoff = (freq: PaymentFrequency) => {
  if (freq === 'bulanan') {
    return { day: 25, monthIndex: 1 };
  }
  if (freq === 'triwulan') {
    return { day: 15, monthIndex: 3 };
  }
  if (freq === 'caturwulan') {
    return { day: 15, monthIndex: 4 };
  }
  if (freq === 'semester') {
    return { day: 15, monthIndex: 6 };
  }
  return { day: 25, monthIndex: 1 };
};

export default function CreatePaymentItemModal({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  defaultTargetGender = 'Semua',
  lembagasList: propLembagas
}: CreatePaymentItemModalProps) {
  const [name, setName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('bulanan');
  const [startMonth, setStartMonth] = useState<number>(7); // Default Juli (Tahun Ajaran Baru)
  const [startYear, setStartYear] = useState<number>(() => new Date().getFullYear());
  const [subPeriods, setSubPeriods] = useState<PaymentSubPeriod[]>([]);

  // State khusus jenis sekali bayar: rentang tanggal periode & filter tanggal masuk
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entryDateFrom, setEntryDateFrom] = useState('');
  const [entryDateTo, setEntryDateTo] = useState('');

  // State fitur cicilan pembayaran (di bawah jumlah pembayaran)
  const [allowInstallment, setAllowInstallment] = useState<boolean>(false);
  const [minInstallmentInput, setMinInstallmentInput] = useState<string>('');
  const [maxInstallmentCount, setMaxInstallmentCount] = useState<number>(3);

  // State khusus pembayaran selain sekali bayar: batas bebas tagihan tanggal masuk santri baru
  const [isEntryCutoffActive, setIsEntryCutoffActive] = useState<boolean>(false);
  const [entryCutoffDay, setEntryCutoffDay] = useState<number | undefined>(25);
  const [entryCutoffMonthIndex, setEntryCutoffMonthIndex] = useState<number>(1);

  const [selectedLembagaIds, setSelectedLembagaIds] = useState<string[]>([]);
  const [isLembagaDropdownOpen, setIsLembagaDropdownOpen] = useState(false);
  const [lembagaSearch, setLembagaSearch] = useState('');
  const [availableLembagas, setAvailableLembagas] = useState<Lembaga[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  // Daftar opsi tahun dinamis (misal tahun lalu sampai 5 tahun ke depan)
  const currentRealYear = new Date().getFullYear();
  const yearOptions = [
    currentRealYear - 1,
    currentRealYear,
    currentRealYear + 1,
    currentRealYear + 2,
    currentRealYear + 3
  ];

  // Muat daftar lembaga pendidikan dari modul pendidikan
  useEffect(() => {
    let list: Lembaga[] = [];
    if (propLembagas && propLembagas.length > 0) {
      list = propLembagas;
    } else {
      try {
        const local = localStorage.getItem('smartsantri_lembagas');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        }
      } catch (e) {
        console.error('Gagal membaca smartsantri_lembagas:', e);
      }
    }

    if (list.length === 0) {
      list = FALLBACK_LEMBAGAS;
    }

    setAvailableLembagas(list);

    fetchTableData<Lembaga>('lembaga', 'smartsantri_lembagas', list)
      .then(data => {
        if (data && data.length > 0) {
          setAvailableLembagas(data);
        }
      })
      .catch(() => {});
  }, [propLembagas, isOpen]);

  // Kunci scroll halaman utama saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Hitung posisi dropdown mengambang agar tidak terpotong container modal
  useEffect(() => {
    if (!isLembagaDropdownOpen) return;

    const calculatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;

      // Jika ruang di bawah kurang dari 240px dan ruang di atas lebih besar, buka ke atas
      const placeAbove = spaceBelow < 240 && spaceAbove > spaceBelow;

      if (placeAbove) {
        setDropdownPosition({
          bottom: viewportHeight - rect.top + 6,
          left: rect.left,
          width: rect.width,
          maxHeight: Math.min(360, Math.max(180, spaceAbove))
        });
      } else {
        setDropdownPosition({
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width,
          maxHeight: Math.min(360, Math.max(180, spaceBelow))
        });
      }
    };

    calculatePosition();

    const handleScrollOrResize = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isLembagaDropdownOpen]);

  // Listener tutup dropdown saat klik di luar area atau tekan Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideButton = buttonRef.current && buttonRef.current.contains(target);
      const isInsideMenu = dropdownMenuRef.current && dropdownMenuRef.current.contains(target);

      if (!isInsideButton && !isInsideMenu) {
        setIsLembagaDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLembagaDropdownOpen(false);
      }
    };

    if (isLembagaDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLembagaDropdownOpen]);

  // Saring otomatis lembaga berdasarkan filter halaman aktif (Putra / Putri)
  const genderFilteredLembagas = availableLembagas.filter(l => {
    const lGender = l.gender || '';
    const lName = `${l.nama || ''} ${l.kode || ''}`.toLowerCase();

    if (defaultTargetGender === 'Putra') {
      if (lGender === 'Putri') return false;
      if (lName.includes('putri')) return false;
      return true;
    }

    if (defaultTargetGender === 'Putri') {
      if (lGender === 'Putra') return false;
      if (lName.includes('putra')) return false;
      return true;
    }

    return true;
  });

  // Populate data saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setName(itemToEdit.name || '');
        setAmountInput(
          itemToEdit.defaultAmount && itemToEdit.defaultAmount > 0
            ? formatRupiahInput(String(itemToEdit.defaultAmount))
            : ''
        );

        const freq = itemToEdit.paymentFrequency || 'sekali';
        setPaymentFrequency(freq);

        const sM = itemToEdit.startMonth || 7;
        const sY = itemToEdit.startYear || new Date().getFullYear();
        setStartMonth(sM);
        setStartYear(sY);

        setStartDate(itemToEdit.startDate || '');
        setEndDate(itemToEdit.endDate || '');
        setEntryDateFrom(itemToEdit.entryDateFrom || '');
        setEntryDateTo(itemToEdit.entryDateTo || '');

        const cutoffOn = itemToEdit.isEntryCutoffActive ?? (itemToEdit.entryCutoffDay !== undefined && itemToEdit.entryCutoffDay !== null);
        setIsEntryCutoffActive(Boolean(cutoffOn));
        const defCutoff = getDefaultCutoff(freq);
        setEntryCutoffDay(itemToEdit.entryCutoffDay !== undefined ? itemToEdit.entryCutoffDay : defCutoff.day);
        setEntryCutoffMonthIndex(itemToEdit.entryCutoffMonthIndex || defCutoff.monthIndex);

        setAllowInstallment(Boolean(itemToEdit.allowInstallment));
        setMinInstallmentInput(
          itemToEdit.minInstallmentAmount && itemToEdit.minInstallmentAmount > 0
            ? formatRupiahInput(String(itemToEdit.minInstallmentAmount))
            : ''
        );
        setMaxInstallmentCount(
          itemToEdit.maxInstallmentCount && itemToEdit.maxInstallmentCount >= 2
            ? itemToEdit.maxInstallmentCount
            : 3
        );

        if (freq !== 'sekali') {
          const generated = generateSubPeriods(freq, sM, sY, itemToEdit.subPeriods);
          setSubPeriods(generated);
        } else {
          setSubPeriods([]);
        }

        if (itemToEdit.targetLembagaIds && Array.isArray(itemToEdit.targetLembagaIds)) {
          setSelectedLembagaIds(itemToEdit.targetLembagaIds);
        } else if (itemToEdit.targetLembaga && itemToEdit.targetLembaga !== 'Semua') {
          const matched = availableLembagas.filter(l => 
            itemToEdit.targetLembaga?.toLowerCase().includes((l.kode || '').toLowerCase()) ||
            itemToEdit.targetLembaga?.toLowerCase().includes((l.nama || '').toLowerCase())
          ).map(l => l.id);
          setSelectedLembagaIds(matched);
        } else {
          setSelectedLembagaIds([]);
        }
      } else {
        setName('');
        setAmountInput('');
        setPaymentFrequency('bulanan');
        const defaultMonth = 7; // Juli
        const defaultYear = new Date().getFullYear();
        setStartMonth(defaultMonth);
        setStartYear(defaultYear);
        setStartDate('');
        setEndDate('');
        setEntryDateFrom('');
        setEntryDateTo('');
        setIsEntryCutoffActive(false); // Default OFF
        const defCutoff = getDefaultCutoff('bulanan');
        setEntryCutoffDay(defCutoff.day); // Default bulanan: tgl 25
        setEntryCutoffMonthIndex(defCutoff.monthIndex);
        setAllowInstallment(false); // Default OFF
        setMinInstallmentInput('');
        setMaxInstallmentCount(3);
        setSubPeriods(generateSubPeriods('bulanan', defaultMonth, defaultYear));
        setSelectedLembagaIds([]);
      }
      setIsLembagaDropdownOpen(false);
      setLembagaSearch('');
      setErrorMsg('');
    }
  }, [isOpen, itemToEdit, defaultTargetGender, availableLembagas.length]);

  // Handler toggle cicilan
  const handleToggleAllowInstallment = () => {
    const currentTotal = parseRupiahNumber(amountInput);
    if (currentTotal <= 0) {
      setErrorMsg('Jumlah pembayaran harus diisi terlebih dahulu sebelum mengaktifkan fitur cicilan.');
      return;
    }
    setAllowInstallment(prev => {
      const next = !prev;
      if (next) {
        if (!minInstallmentInput) {
          const defCount = maxInstallmentCount || 3;
          const suggested = Math.max(10000, Math.floor(currentTotal / defCount));
          setMinInstallmentInput(formatRupiahInput(String(suggested)));
        }
      }
      return next;
    });
  };

  // Handler toggle batas bebas tagihan
  const handleToggleCutoffActive = () => {
    setIsEntryCutoffActive(prev => {
      const next = !prev;
      if (next && !entryCutoffDay) {
        const def = getDefaultCutoff(paymentFrequency);
        setEntryCutoffDay(def.day);
        setEntryCutoffMonthIndex(def.monthIndex);
      }
      return next;
    });
  };

  // Update sub-periode saat frekuensi, bulan mulai, atau tahun mulai diubah
  const handleFrequencyChange = (newFreq: PaymentFrequency) => {
    setPaymentFrequency(newFreq);
    // Atur default batas bebas tagihan: bulanan tgl 25, yang lain bulan terakhir tgl 15
    const def = getDefaultCutoff(newFreq);
    setEntryCutoffDay(def.day);
    setEntryCutoffMonthIndex(def.monthIndex);

    if (newFreq === 'sekali') {
      setSubPeriods([]);
    } else {
      setSubPeriods(prev => generateSubPeriods(newFreq, startMonth, startYear, prev));
    }
  };

  const handleStartMonthChange = (newMonth: number) => {
    setStartMonth(newMonth);
    if (paymentFrequency !== 'sekali') {
      setSubPeriods(prev => generateSubPeriods(paymentFrequency, newMonth, startYear, prev));
    }
  };

  const handleStartYearChange = (newYear: number) => {
    setStartYear(newYear);
    if (paymentFrequency !== 'sekali') {
      setSubPeriods(prev => generateSubPeriods(paymentFrequency, startMonth, newYear, prev));
    }
  };

  // Toggle satu sub-periode on/off
  const handleToggleSubPeriod = (periodId: string) => {
    setSubPeriods(prev => prev.map(sp => {
      if (sp.id === periodId) {
        return { ...sp, isActive: !sp.isActive };
      }
      return sp;
    }));
  };

  // Aktifkan / matikan semua sub periode
  const handleToggleAllSubPeriods = (activate: boolean) => {
    setSubPeriods(prev => prev.map(sp => ({ ...sp, isActive: activate })));
  };

  if (!isOpen) return null;

  const handleToggleLembaga = (lembagaId: string) => {
    setSelectedLembagaIds(prev => {
      if (prev.includes(lembagaId)) {
        return prev.filter(id => id !== lembagaId);
      } else {
        return [...prev, lembagaId];
      }
    });
  };

  // Filter lembaga berdasarkan input pencarian
  const displayedLembagas = genderFilteredLembagas.filter(l => {
    if (!lembagaSearch.trim()) return true;
    const query = lembagaSearch.toLowerCase();
    return (
      (l.nama || '').toLowerCase().includes(query) ||
      (l.kode || '').toLowerCase().includes(query) ||
      (l.jenjang || '').toLowerCase().includes(query) ||
      (l.jenis || '').toLowerCase().includes(query)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama item pembayaran wajib diisi.');
      return;
    }

    // Validasi tanggal jika frekuensi sekali bayar
    if (paymentFrequency === 'sekali') {
      if (startDate && endDate && startDate > endDate) {
        setErrorMsg('Tanggal selesai periode pembayaran tidak boleh lebih awal dari tanggal mulai.');
        return;
      }
      if (entryDateFrom && entryDateTo && entryDateFrom > entryDateTo) {
        setErrorMsg('Tanggal masuk sampai tidak boleh lebih awal dari tanggal masuk dari.');
        return;
      }
    }

    const selectedNames = availableLembagas
      .filter(l => selectedLembagaIds.includes(l.id))
      .map(l => l.kode || l.nama);

    const isAllLembagas = selectedLembagaIds.length === 0 || selectedLembagaIds.length === genderFilteredLembagas.length;

    // Kategori gender otomatis mengikuti halaman aktif (Putra / Putri)
    const finalGender = defaultTargetGender === 'Putra' ? 'Putra' : defaultTargetGender === 'Putri' ? 'Putri' : 'Semua';

    const parsedAmount = parseRupiahNumber(amountInput);

    // Validasi fitur cicilan jika diaktifkan
    let finalAllowInstallment = false;
    let finalMinInstallment: number | undefined = undefined;
    let finalMaxCount: number | undefined = undefined;

    if (allowInstallment) {
      if (!parsedAmount || parsedAmount <= 0) {
        setErrorMsg('Jumlah pembayaran wajib diisi lebih dari 0 jika opsi cicilan diaktifkan.');
        return;
      }
      const minVal = parseRupiahNumber(minInstallmentInput);
      if (!minVal || minVal <= 0) {
        setErrorMsg('Minimal nominal cicilan wajib diisi.');
        return;
      }
      if (minVal > parsedAmount) {
        setErrorMsg(`Minimal cicilan (Rp ${minVal.toLocaleString('id-ID')}) tidak boleh lebih besar dari total tagihan (Rp ${parsedAmount.toLocaleString('id-ID')}).`);
        return;
      }
      if (minVal * 2 > parsedAmount) {
        setErrorMsg(`Minimal cicilan (Rp ${minVal.toLocaleString('id-ID')}) terlalu besar. Tagihan Rp ${parsedAmount.toLocaleString('id-ID')} tidak dapat dibagi minimal 2 kali cicilan.`);
        return;
      }
      if (!maxInstallmentCount || maxInstallmentCount < 2) {
        setErrorMsg('Maksimal cicilan minimal 2 kali.');
        return;
      }

      finalAllowInstallment = true;
      finalMinInstallment = minVal;
      finalMaxCount = maxInstallmentCount;
    }

    // Validasi batas bebas tagihan (jika frekuensi bukan sekali bayar)
    const isCutoffApplicable = paymentFrequency !== 'sekali';
    const finalCutoffActive = isCutoffApplicable && isEntryCutoffActive;
    let finalCutoffDay: number | undefined = undefined;
    let finalCutoffMonth: number | undefined = undefined;

    if (finalCutoffActive) {
      if (!entryCutoffDay || entryCutoffDay < 1 || entryCutoffDay > 31) {
        setErrorMsg('Tanggal batas bebas tagihan harus antara 1 sampai 31.');
        return;
      }
      finalCutoffDay = entryCutoffDay;
      if (paymentFrequency !== 'bulanan') {
        finalCutoffMonth = entryCutoffMonthIndex || 1;
      }
    }

    const finalItem: SantriPaymentItem = {
      id: itemToEdit ? itemToEdit.id : `pay-item-${Date.now()}`,
      name: name.trim(),
      category: itemToEdit?.category || (paymentFrequency === 'bulanan' ? 'syahriah' : 'lainnya'),
      defaultAmount: parsedAmount,
      targetGender: finalGender,
      targetLembagaIds: isAllLembagas ? [] : selectedLembagaIds,
      targetLembagas: isAllLembagas ? [] : selectedNames,
      targetLembaga: isAllLembagas ? 'Semua' : selectedNames.join(', '),
      paymentFrequency,
      startMonth: paymentFrequency !== 'sekali' ? startMonth : undefined,
      startYear: paymentFrequency !== 'sekali' ? startYear : undefined,
      subPeriods: paymentFrequency !== 'sekali' ? subPeriods : undefined,

      // Cicilan
      allowInstallment: finalAllowInstallment,
      minInstallmentAmount: finalMinInstallment,
      maxInstallmentCount: finalMaxCount,

      // Batas bebas tagihan
      isEntryCutoffActive: finalCutoffActive,
      entryCutoffDay: finalCutoffDay,
      entryCutoffMonthIndex: finalCutoffMonth,

      startDate: paymentFrequency === 'sekali' ? (startDate || undefined) : undefined,
      endDate: paymentFrequency === 'sekali' ? (endDate || undefined) : undefined,
      entryDateFrom: paymentFrequency === 'sekali' ? (entryDateFrom || undefined) : undefined,
      entryDateTo: paymentFrequency === 'sekali' ? (entryDateTo || undefined) : undefined,
      createdAt: itemToEdit?.createdAt || new Date().toISOString()
    };

    onSave(finalItem);
    onClose();
  };

  // Teks ringkasan seleksi di dalam kotak input
  const getLembagaSelectionLabel = () => {
    if (selectedLembagaIds.length === 0) {
      return 'Semua Lembaga';
    }
    return `${selectedLembagaIds.length} lembaga terpilih`;
  };

  const parsedCurrentAmount = parseRupiahNumber(amountInput);
  const isAmountFilled = parsedCurrentAmount > 0;
  const minInstallmentVal = parseRupiahNumber(minInstallmentInput);

  // Status validasi nominal cicilan bermasalah
  const isMinInstallmentProblematic = allowInstallment && (
    parsedCurrentAmount <= 0 ||
    minInstallmentVal <= 0 ||
    minInstallmentVal > parsedCurrentAmount ||
    minInstallmentVal * 2 > parsedCurrentAmount
  );

  const isInstallmentCountProblematic = allowInstallment && (!maxInstallmentCount || maxInstallmentCount < 2);

  // Tombol buat/simpan mati jika nominal minimal cicilan masih bermasalah atau nama kosong
  const isSubmitDisabled = !name.trim() || isMinInstallmentProblematic || isInstallmentCountProblematic;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal - Bersih tanpa icon dan tanpa keterangan di bawah judul */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            {itemToEdit ? 'Edit Item Pembayaran' : 'Buat Item Pembayaran'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nama Pembayaran - Tanpa bintang merah */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Nama Item Pembayaran
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Syahriah 2026/2027, Seragam, Uang Makan..."
              value={name}
              onChange={e => {
                setName(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-4 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Kolom Jumlah Pembayaran dengan penulisan otomatis pemisah 3 digit titik & aturan 0 */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Jumlah Pembayaran
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xs font-bold text-slate-400 select-none">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountInput}
                onChange={e => {
                  const formatted = formatRupiahInput(e.target.value);
                  setAmountInput(formatted);
                  const parsed = parseRupiahNumber(formatted);
                  // Saat jumlah pembayaran dihapus / 0, otomatis cicilan off
                  if (parsed <= 0) {
                    setAllowInstallment(false);
                  }
                  setErrorMsg('');
                }}
                className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Fitur Cicilan: Toggle di bawah Jumlah Pembayaran & Logika Cicilan */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <label
                  htmlFor="toggle-cicilan"
                  className={`font-bold text-xs sm:text-sm select-none ${
                    isAmountFilled ? 'text-slate-800 cursor-pointer' : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Izinkan Cicilan
                </label>
                {!isAmountFilled && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Isi jumlah pembayaran dahulu)
                  </span>
                )}
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-help"
                    aria-label="Keterangan cicilan pembayaran"
                  >
                    <Info className="w-3 h-3 text-slate-500" />
                  </button>
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:flex z-50 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex-col gap-1">
                    <span>
                      Aktifkan bila santri diperbolehkan membayar tagihan ini secara bertahap / mencicil dengan batas minimal per pembayaran dan batas maksimal kali transaksi.
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Switch Cicilan: Hanya boleh diaktifkan saat jumlah pembayaran sudah diisi */}
              <button
                id="toggle-cicilan"
                type="button"
                role="switch"
                aria-checked={allowInstallment}
                onClick={handleToggleAllowInstallment}
                disabled={!isAmountFilled}
                title={!isAmountFilled ? 'Isi jumlah pembayaran terlebih dahulu' : undefined}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !isAmountFilled
                    ? 'bg-slate-200 opacity-50 cursor-not-allowed'
                    : allowInstallment
                    ? 'bg-emerald-600 cursor-pointer'
                    : 'bg-slate-300 cursor-pointer'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    allowInstallment ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Saat ON: Menampilkan minimal nominal cicilan & maksimal berapa kalinya */}
            {allowInstallment && (
              <div className="space-y-3 pt-2.5 border-t border-slate-200/80 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Minimal Nominal Cicilan */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Minimal Nominal Cicilan
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-xs font-bold text-slate-400 select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Contoh: 50.000"
                        value={minInstallmentInput}
                        onChange={e => {
                          const formatted = formatRupiahInput(e.target.value);
                          setMinInstallmentInput(formatted);
                          setErrorMsg('');
                        }}
                        className={`w-full pl-11 pr-4 py-2 rounded-full border bg-white font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                          isMinInstallmentProblematic
                            ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Maksimal Berapa Kalinya */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Maksimal Berapa Kali
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={2}
                        max={36}
                        value={maxInstallmentCount || ''}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setMaxInstallmentCount(isNaN(val) ? 2 : Math.max(2, Math.min(val, 36)));
                          setErrorMsg('');
                        }}
                        className="w-full pl-4 pr-12 py-2 rounded-full border border-slate-200 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="absolute right-4 text-xs font-semibold text-slate-500 pointer-events-none select-none">
                        Kali
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preset Tombol Cepat Kali Cicilan */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-500">Preset kali:</span>
                  {[2, 3, 4, 6, 10, 12].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxInstallmentCount(num)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        maxInstallmentCount === num
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {num}x
                    </button>
                  ))}
                </div>

                {/* Logika & Simulasi Perhitungan Cicilan */}
                {(() => {
                  const totalAmount = parsedCurrentAmount;
                  const minVal = minInstallmentVal;
                  const count = maxInstallmentCount || 2;

                  if (totalAmount <= 0) {
                    return (
                      <p className="text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200 rounded-xl p-2 font-medium">
                        💡 Tentukan jumlah pembayaran di atas terlebih dahulu untuk melihat simulasi kalkulasi cicilan.
                      </p>
                    );
                  }

                  if (!minInstallmentInput || minVal <= 0) {
                    return (
                      <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2 font-medium">
                        ⚠️ Minimal nominal cicilan wajib diisi. Tombol simpan dinonaktifkan sampai nominal valid.
                      </p>
                    );
                  }

                  if (minVal > totalAmount) {
                    return (
                      <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2 font-medium">
                        ⚠️ Nominal minimal cicilan (Rp {minVal.toLocaleString('id-ID')}) melebihi total pembayaran (Rp {totalAmount.toLocaleString('id-ID')}). Tombol simpan dinonaktifkan.
                      </p>
                    );
                  }

                  if (minVal > 0 && minVal * 2 > totalAmount) {
                    return (
                      <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2 font-medium">
                        ⚠️ Minimal cicilan (Rp {minVal.toLocaleString('id-ID')}) melebihi 50% total tagihan (Rp {totalAmount.toLocaleString('id-ID')}), sehingga tidak dapat dicicil 2 kali atau lebih. Tombol simpan dinonaktifkan.
                      </p>
                    );
                  }

                  const avgPerPayment = Math.round(totalAmount / count);
                  const maxPossibleWithMin = minVal > 0 ? Math.floor(totalAmount / minVal) : null;

                  return (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200/60 pb-1">
                        <span>Simulasi Skema Cicilan</span>
                        <span className="font-mono text-emerald-700">Maks. {count}x cicilan</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Perkiraan rata-rata per kali bayar:</span>
                        <span className="font-mono font-bold text-slate-900">
                          Rp {avgPerPayment.toLocaleString('id-ID')}
                        </span>
                      </div>
                      {minVal > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Minimal per transaksi bayar:</span>
                          <span className="font-mono font-bold text-emerald-800">
                            Rp {minVal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      {maxPossibleWithMin !== null && maxPossibleWithMin < count && (
                        <p className="text-[10px] text-amber-700 pt-0.5">
                          *Catatan: Dengan batas minimal Rp {minVal.toLocaleString('id-ID')}, tagihan ini optimal dicicil maks. {maxPossibleWithMin} kali.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Jenis Pembayaran: Sekali Bayar, Bulanan, Triwulan, Caturwulan, Semester */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Jenis Pembayaran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl sm:rounded-full border border-slate-200/80">
              {PAYMENT_FREQUENCIES.map(freq => {
                const isSelected = paymentFrequency === freq.id;
                return (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => handleFrequencyChange(freq.id)}
                    className={`py-2 px-2.5 rounded-full text-xs font-bold text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {freq.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jika Sekali Bayar: Periode Pembayaran (Rentang Tanggal). Jika Selain Sekali Bayar: Mulai Pembayaran (Bulan & Tahun) */}
          {paymentFrequency === 'sekali' ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="block font-semibold text-slate-800">
                  Periode Pembayaran
                </label>
                <div className="relative group inline-flex items-center">
                  <button
                    type="button"
                    className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-help"
                    aria-label="Keterangan periode pembayaran"
                  >
                    <Info className="w-3 h-3 text-slate-500" />
                  </button>
                  {/* Tooltip on hover */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:flex z-50 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex-col gap-1">
                    <span>
                      Santri yang boyong sebelum periode ini atau mendaftar setelah periode ini berakhir tidak dikenakan kewajiban bayar.
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      setStartDate(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => {
                      setEndDate(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-800">
                Mulai Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Pilihan Bulan */}
                <div>
                  <select
                    value={startMonth}
                    onChange={e => handleStartMonthChange(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {MONTH_NAMES.map((mName, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {mName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilihan Tahun */}
                <div>
                  <select
                    value={startYear}
                    onChange={e => handleStartYearChange(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {yearOptions.map(yr => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Kotak-kotak Sub Periode (Hanya muncul jika BUKAN sekali bayar) */}
          {paymentFrequency !== 'sekali' && (
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-xs">
                  Sub Periode Tagihan
                </span>

                {/* Tombol Cepat Nyalakan / Matikan Semua */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleToggleAllSubPeriods(true)}
                    className="px-2.5 py-1 rounded-full text-emerald-700 hover:bg-emerald-100/70 font-semibold transition-colors"
                  >
                    Aktifkan Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAllSubPeriods(false)}
                    className="px-2.5 py-1 rounded-full text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                  >
                    Matikan Semua
                  </button>
                </div>
              </div>

              {/* Kotak-kotak Periode Persegi Sempurna & Rata Kiri di Semua Jenis Pembayaran */}
              <div className="flex flex-wrap items-center justify-start gap-2">
                {subPeriods.map((period, idx) => {
                  const isActive = period.isActive;
                  const displayLabel = period.shortLabel || (
                    paymentFrequency === 'bulanan'
                      ? (period.periodMonth ? SHORT_MONTH_NAMES[period.periodMonth - 1] : period.label.slice(0, 3))
                      : paymentFrequency === 'triwulan'
                      ? `T${idx + 1}`
                      : paymentFrequency === 'caturwulan'
                      ? `C${idx + 1}`
                      : `S${idx + 1}`
                  );

                  return (
                    <button
                      key={period.id}
                      type="button"
                      title={period.label}
                      onClick={() => handleToggleSubPeriod(period.id)}
                      className={`w-9.5 h-9.5 sm:w-10 sm:h-10 aspect-square rounded-xl border text-xs font-bold flex items-center justify-center shrink-0 transition-all select-none ${
                        isActive
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Batas Bebas Tagihan (Khusus pembayaran selain sekali bayar) */}
          {paymentFrequency !== 'sekali' && (
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="toggle-cutoff"
                    className="font-bold text-slate-800 text-xs sm:text-sm cursor-pointer select-none"
                  >
                    Batas Bebas Tagihan
                  </label>
                  <div className="relative group inline-flex items-center">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-help"
                      aria-label="Keterangan batas bebas tagihan"
                    >
                      <Info className="w-3 h-3 text-slate-500" />
                    </button>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:flex z-50 w-72 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex-col gap-1">
                      <span>
                        Santri baru yang terdaftar masuk mulai tanggal batas ini ke atas dibebaskan dari kewajiban bayar sub-periode tersebut (mulai ditagih pada sub-periode berikutnya).
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toggle Batas Bebas Tagihan (Default OFF) */}
                <button
                  id="toggle-cutoff"
                  type="button"
                  role="switch"
                  aria-checked={isEntryCutoffActive}
                  onClick={handleToggleCutoffActive}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEntryCutoffActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isEntryCutoffActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Keterangan di bawah batas bebas tagihan */}
              <p className="text-[11px] text-slate-500 leading-normal">
                Khusus untuk santri yang baru masuk di pertengahan periode pembayaran yang sedang berjalan
              </p>

              {/* Saat Toggle ON: Bisa isi tanggalnya */}
              {isEntryCutoffActive && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                  {/* Tampilan input: jika Bulanan hanya Tgl, jika Triwulan/Caturwulan/Semester ada Bulan ke dan Tgl */}
                  {paymentFrequency === 'bulanan' ? (
                    <div className="relative flex items-center max-w-xs">
                      <span className="absolute left-4 text-xs font-semibold text-slate-400 select-none">
                        Tgl
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="25"
                        value={entryCutoffDay !== undefined ? entryCutoffDay : ''}
                        onChange={e => {
                          const valStr = e.target.value;
                          if (!valStr) {
                            setEntryCutoffDay(undefined);
                            return;
                          }
                          const val = parseInt(valStr, 10);
                          if (!isNaN(val) && val >= 1 && val <= 31) {
                            setEntryCutoffDay(val);
                          }
                        }}
                        className="w-full pl-14 pr-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Pilihan Bulan ke- */}
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-xs font-semibold text-slate-400 select-none">
                          Bulan ke
                        </span>
                        <select
                          value={entryCutoffMonthIndex}
                          onChange={e => setEntryCutoffMonthIndex(Number(e.target.value))}
                          className="w-full pl-22 pr-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          {Array.from(
                            {
                              length:
                                paymentFrequency === 'triwulan'
                                  ? 3
                                  : paymentFrequency === 'caturwulan'
                                  ? 4
                                  : 6
                            },
                            (_, i) => i + 1
                          ).map(num => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Input Tgl */}
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-xs font-semibold text-slate-400 select-none">
                          Tgl
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="15"
                          value={entryCutoffDay !== undefined ? entryCutoffDay : ''}
                          onChange={e => {
                            const valStr = e.target.value;
                            if (!valStr) {
                              setEntryCutoffDay(undefined);
                              return;
                            }
                            const val = parseInt(valStr, 10);
                            if (!isNaN(val) && val >= 1 && val <= 31) {
                              setEntryCutoffDay(val);
                            }
                          }}
                          className="w-full pl-14 pr-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-xl p-2 font-medium">
                    {entryCutoffDay
                      ? paymentFrequency === 'bulanan'
                        ? `Santri baru yang masuk mulai tanggal ${entryCutoffDay} ke atas dibebaskan dari tagihan bulan tersebut (mulai ditagih pada bulan berikutnya).`
                        : `Santri baru yang masuk mulai Bulan ke-${entryCutoffMonthIndex} tanggal ${entryCutoffDay} ke atas dibebaskan dari tagihan periode tersebut (mulai ditagih pada periode berikutnya).`
                      : 'Isi tanggal batas bebas tagihan di atas.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Khususkan pembayaran santri untuk: */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {/* Lembaga - Tanpa icon */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-800 text-xs">
                Khususkan pembayaran santri untuk:
              </label>

              {/* Kotak Input / Tombol Dropdown - Menampilkan 'x lembaga terpilih' */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => setIsLembagaDropdownOpen(prev => !prev)}
                  className={`w-full px-4 py-2.5 rounded-full border text-left flex items-center justify-between gap-2 transition-all bg-white ${
                    isLembagaDropdownOpen
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <span className={`text-xs font-medium truncate ${
                    selectedLembagaIds.length > 0 ? 'text-emerald-700 font-bold' : 'text-slate-800'
                  }`}>
                    {getLembagaSelectionLabel()}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isLembagaDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Panel (Dipindah ke Portal agar tidak terbatas oleh kotak kontainer modal) */}
                {typeof document !== 'undefined' && isLembagaDropdownOpen && dropdownPosition && createPortal(
                  <div
                    ref={dropdownMenuRef}
                    style={{
                      position: 'fixed',
                      top: dropdownPosition.top !== undefined ? `${dropdownPosition.top}px` : undefined,
                      bottom: dropdownPosition.bottom !== undefined ? `${dropdownPosition.bottom}px` : undefined,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`,
                      maxHeight: `${dropdownPosition.maxHeight}px`,
                      zIndex: 999999
                    }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 space-y-2 flex flex-col animate-in fade-in zoom-in-95 duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    <div>
                      <input
                        type="text"
                        placeholder="Cari lembaga..."
                        value={lembagaSearch}
                        onChange={e => setLembagaSearch(e.target.value)}
                        className="w-full px-3.5 py-1.5 text-xs rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>

                    {/* Ringkasan & Tombol Cepat */}
                    <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                      <span>{selectedLembagaIds.length > 0 ? `${selectedLembagaIds.length} dipilih` : 'Semua lembaga'}</span>
                      <div className="flex items-center gap-1.5 font-semibold text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedLembagaIds(displayedLembagas.map(l => l.id))}
                          className="px-2 py-0.5 rounded-full text-emerald-700 hover:bg-emerald-50"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedLembagaIds([])}
                          className="px-2 py-0.5 rounded-full text-rose-600 hover:bg-rose-50"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    <div className="overflow-y-auto space-y-1 pr-0.5 flex-1 max-h-[260px]">
                      {displayedLembagas.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          Tidak ada lembaga ditemukan.
                        </div>
                      ) : (
                        displayedLembagas.map(lembaga => {
                          const isChecked = selectedLembagaIds.includes(lembaga.id);
                          return (
                            <label
                              key={lembaga.id}
                              className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-50/80 text-emerald-950 font-medium'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleLembaga(lembaga.id)}
                                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs truncate flex items-center gap-1.5">
                                    <span className="font-bold">{lembaga.kode || lembaga.nama}</span>
                                    {lembaga.nama !== lembaga.kode && (
                                      <span className="text-[11px] text-slate-500 truncate">- {lembaga.nama}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {lembaga.jenis && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                  lembaga.jenis === 'Formal'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {lembaga.jenis}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>

            {/* Khusus Sekali Bayar: Masuk dari dan sampai */}
            {paymentFrequency === 'sekali' && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Masuk dari
                    </label>
                    <input
                      type="date"
                      value={entryDateFrom}
                      onChange={e => {
                        setEntryDateFrom(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-600">
                        sampai
                      </label>
                      {(entryDateFrom || entryDateTo) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEntryDateFrom('');
                            setEntryDateTo('');
                          }}
                          className="px-2 py-0.5 rounded-full text-[10px] text-rose-500 hover:bg-rose-50 hover:text-rose-700 font-semibold transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <input
                      type="date"
                      value={entryDateTo}
                      min={entryDateFrom || undefined}
                      onChange={e => {
                        setEntryDateTo(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Tombol Simpan */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              title={
                isMinInstallmentProblematic
                  ? 'Tombol tidak aktif: nominal minimal cicilan masih bermasalah'
                  : !name.trim()
                  ? 'Nama item pembayaran wajib diisi'
                  : undefined
              }
              className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-xs transition-all ${
                isSubmitDisabled
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {itemToEdit ? 'Simpan Perubahan' : 'Buat Item Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
