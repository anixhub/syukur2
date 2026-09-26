export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export type SubPeriodPaymentStatus = 'lunas' | 'cicil' | 'menunggak';

export interface SubPeriodRecordDetail {
  status: SubPeriodPaymentStatus;
  totalTarif: number;
  paidAmount: number;
  remainingAmount: number;
  installmentCount: number;
  lastPaymentDate?: string;
  history?: Array<{
    date: string;
    amount: number;
    receiptNumber?: string;
  }>;
}

/**
 * Generator sub-periode dinamis berdasarkan frekuensi, bulan mulai, dan tahun mulai.
 */
export function generateSubPeriods(
  frequency: PaymentFrequency,
  startMonth: number = 7,
  startYear: number = 2026,
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

export type PaymentCategory = 
  | 'syahriah' 
  | 'makan' 
  | 'kitab' 
  | 'infaq' 
  | 'tabungan' 
  | 'seragam' 
  | 'kegiatan' 
  | 'lainnya';

export type PaymentFrequency = 'sekali' | 'bulanan' | 'triwulan' | 'caturwulan' | 'semester';
export type EntryCutoffRule = 'next_period' | 'current_period';

export interface PaymentSubPeriod {
  id: string; // misal "2026-07" atau "2026-TW1"
  label: string; // misal "Juli 2026" atau "Triwulan 1 (Jul - Sep 2026)"
  shortLabel?: string; // misal "Jul" untuk bulanan, "T1" triwulan, "C1" caturwulan, "S1" semester
  periodYear: number;
  periodMonth?: number; // 1 - 12
  endMonth?: number; // 1 - 12 untuk periode rentang
  endYear?: number;
  isActive: boolean; // Dinyalakan atau dimatikan oleh bendahara
}

export interface SantriPaymentItem {
  id: string;
  name: string;
  category?: PaymentCategory;
  defaultAmount?: number;
  description?: string;
  isCustomAmount?: boolean;
  targetGender?: 'Semua' | 'Putra' | 'Putri';
  targetLembaga?: string;
  targetLembagaIds?: string[];
  targetLembagas?: string[];
  targetKelas?: string;
  createdAt?: string;

  // Konfigurasi frekuensi & sub-periode pembayaran
  paymentFrequency?: PaymentFrequency;
  startMonth?: number; // 1 - 12
  startYear?: number; // misal 2026
  subPeriods?: PaymentSubPeriod[];

  // Batas bebas tagihan tanggal masuk santri baru (khusus pembayaran selain sekali bayar)
  isEntryCutoffActive?: boolean;
  entryCutoffDay?: number; // Tanggal 1 - 31 (misal 15)
  entryCutoffMonthIndex?: number; // Bulan ke- (1..3 triwulan, 1..4 caturwulan, 1..6 semester)
  entryCutoffRule?: EntryCutoffRule;

  // Fitur Cicilan Pembayaran
  allowInstallment?: boolean; // Apakah pembayaran ini dapat dicicil
  minInstallmentAmount?: number; // Minimal nominal cicilan per pembayaran (Rp)
  maxInstallmentCount?: number; // Maksimal berapa kali cicilan (misal 2, 3, 4, 6 kali)

  // Periode pembayaran rentang tanggal (khusus jenis 'sekali')
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD

  // Filter sasaran tanggal masuk santri (khusus jenis 'sekali')
  entryDateFrom?: string; // YYYY-MM-DD
  entryDateTo?: string;   // YYYY-MM-DD

  // Rekening tujuan penyimpanan saldo dari sub-modul Wallet (wajib diisi)
  targetAccountId?: string;
  targetAccountName?: string;
}

export const DEFAULT_PAYMENT_ITEMS: SantriPaymentItem[] = [
  {
    id: 'pay-item-1',
    name: 'Syahriah Bulanan (SPP Pondok)',
    category: 'syahriah',
    defaultAmount: 350000,
    description: 'Iuran wajib operasional dan pendidikan santri per bulan',
    targetGender: 'Semua',
    targetLembaga: 'Semua',
    targetAccountId: 'c-1',
    targetAccountName: 'Kas Utama Pesantren',
    paymentFrequency: 'bulanan',
    startMonth: 7,
    startYear: 2026,
    subPeriods: generateSubPeriods('bulanan', 7, 2026),
    allowInstallment: true,
    minInstallmentAmount: 50000,
    maxInstallmentCount: 3
  },
  {
    id: 'pay-item-2',
    name: 'Uang Makan & Dapur Asrama',
    category: 'makan',
    defaultAmount: 300000,
    description: 'Konsumsi makanan bergizi santri 3 kali sehari',
    targetGender: 'Semua',
    targetLembaga: 'Semua',
    targetAccountId: 'c-3',
    targetAccountName: 'Operasional & Dapur',
    paymentFrequency: 'bulanan',
    startMonth: 7,
    startYear: 2026,
    subPeriods: generateSubPeriods('bulanan', 7, 2026),
    allowInstallment: true,
    minInstallmentAmount: 100000,
    maxInstallmentCount: 3
  },
  {
    id: 'pay-item-3',
    name: 'Paket Kitab Kuning Semester Ganjil',
    category: 'kitab',
    defaultAmount: 175000,
    description: 'Kitab fiqih, nahwu, shorof, dan akhlak santri',
    targetGender: 'Semua',
    targetLembaga: 'Semua',
    targetAccountId: 'c-1',
    targetAccountName: 'Kas Utama Pesantren',
    paymentFrequency: 'semester',
    startMonth: 7,
    startYear: 2026,
    subPeriods: generateSubPeriods('semester', 7, 2026),
    allowInstallment: true,
    minInstallmentAmount: 50000,
    maxInstallmentCount: 2
  },
  {
    id: 'pay-item-4',
    name: 'Infaq Pembangunan Asrama Baru',
    category: 'infaq',
    defaultAmount: 100000,
    description: 'Partisipasi renovasi dan perawatan sarana prasarana pondok',
    targetGender: 'Semua',
    targetLembaga: 'Semua',
    targetAccountId: 'c-2',
    targetAccountName: 'Kas Sarpras & Gedung',
    paymentFrequency: 'sekali',
    allowInstallment: true,
    minInstallmentAmount: 25000,
    maxInstallmentCount: 4
  },
  {
    id: 'pay-item-5',
    name: 'Seragam & Gamis Santri Putra',
    category: 'seragam',
    defaultAmount: 220000,
    description: 'Baju koko resmi, sarung seragam, dan peci pesantren putra',
    targetGender: 'Putra',
    targetLembaga: 'Semua',
    targetAccountId: 'c-1',
    targetAccountName: 'Kas Utama Pesantren',
    paymentFrequency: 'sekali',
    allowInstallment: true,
    minInstallmentAmount: 50000,
    maxInstallmentCount: 3
  },
  {
    id: 'pay-item-6',
    name: 'Seragam & Jilbab Syar\'i Santri Putri',
    category: 'seragam',
    defaultAmount: 240000,
    description: 'Gamis syar\'i, kerudung seragam, dan cadar santri putri',
    targetGender: 'Putri',
    targetLembaga: 'Semua',
    targetAccountId: 'c-1',
    targetAccountName: 'Kas Utama Pesantren',
    paymentFrequency: 'sekali',
    allowInstallment: true,
    minInstallmentAmount: 50000,
    maxInstallmentCount: 3
  },
  {
    id: 'pay-item-7',
    name: 'Iuran Kegiatan Haflah & Khotmil Quran',
    category: 'kegiatan',
    defaultAmount: 85000,
    description: 'Penyelenggaraan acara tahunan haflah santri dan wisuda',
    targetGender: 'Semua',
    targetLembaga: 'Semua',
    targetAccountId: 'c-1',
    targetAccountName: 'Kas Utama Pesantren',
    paymentFrequency: 'sekali',
    allowInstallment: false
  },
  {
    id: 'pay-item-8',
    name: 'Iuran Poskestren & Obat Santri',
    category: 'lainnya',
    defaultAmount: 30000,
    description: 'Layanan medis P3K santri dan pemeriksaan kesehatan rutin',
    targetGender: 'Semua',
    targetLembaga: 'Semua',
    targetAccountId: 'c-3',
    targetAccountName: 'Operasional & Dapur',
    paymentFrequency: 'bulanan',
    startMonth: 7,
    startYear: 2026,
    subPeriods: generateSubPeriods('bulanan', 7, 2026),
    allowInstallment: false
  }
];

export interface PaymentCartItem {
  id: string;
  itemId: string;
  name: string;
  category: string;
  amount: number;
  quantity?: number;
  month?: string;
  note?: string;
  bendaharaRecordId?: string;
  // Metadata pembayaran berperiode & cicilan
  periodIds?: string[];
  periodLabels?: string[];
  isInstallment?: boolean;
  remainingDebt?: number;
  installmentCount?: number;
  targetAccountId?: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  santriKelas: string;
  santriKamar: string;
  waliName?: string;
  waliPhone?: string;
  items: PaymentCartItem[];
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'tabungan';
  paymentDate: string;
  cashierName: string;
  note?: string;
}
