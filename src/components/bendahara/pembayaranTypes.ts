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
}

export const DEFAULT_PAYMENT_ITEMS: SantriPaymentItem[] = [
  {
    id: 'pay-item-1',
    name: 'Syahriah Bulanan (SPP Pondok)',
    category: 'syahriah',
    defaultAmount: 350000,
    description: 'Iuran wajib operasional dan pendidikan santri per bulan',
    targetGender: 'Semua',
    targetLembaga: 'Semua'
  },
  {
    id: 'pay-item-2',
    name: 'Uang Makan & Dapur Asrama',
    category: 'makan',
    defaultAmount: 300000,
    description: 'Konsumsi makanan bergizi santri 3 kali sehari',
    targetGender: 'Semua',
    targetLembaga: 'Semua'
  },
  {
    id: 'pay-item-3',
    name: 'Paket Kitab Kuning Semester Ganjil',
    category: 'kitab',
    defaultAmount: 175000,
    description: 'Kitab fiqih, nahwu, shorof, dan akhlak santri',
    targetGender: 'Semua',
    targetLembaga: 'Semua'
  },
  {
    id: 'pay-item-4',
    name: 'Infaq Pembangunan Asrama Baru',
    category: 'infaq',
    defaultAmount: 100000,
    description: 'Partisipasi renovasi dan perawatan sarana prasarana pondok',
    targetGender: 'Semua',
    targetLembaga: 'Semua'
  },
  {
    id: 'pay-item-5',
    name: 'Seragam & Gamis Santri Putra',
    category: 'seragam',
    defaultAmount: 220000,
    description: 'Baju koko resmi, sarung seragam, dan peci pesantren putra',
    targetGender: 'Putra',
    targetLembaga: 'Semua'
  },
  {
    id: 'pay-item-6',
    name: 'Seragam & Jilbab Syar\'i Santri Putri',
    category: 'seragam',
    defaultAmount: 240000,
    description: 'Gamis syar\'i, kerudung seragam, dan cadar santri putri',
    targetGender: 'Putri',
    targetLembaga: 'Semua'
  },
  {
    id: 'pay-item-7',
    name: 'Iuran Kegiatan Haflah & Khotmil Quran',
    category: 'kegiatan',
    defaultAmount: 85000,
    description: 'Penyelenggaraan acara tahunan haflah santri dan wisuda',
    targetGender: 'Semua',
    targetLembaga: 'Semua'
  },
  {
    id: 'pay-item-8',
    name: 'Iuran Poskestren & Obat Santri',
    category: 'lainnya',
    defaultAmount: 30000,
    description: 'Layanan medis P3K santri dan pemeriksaan kesehatan rutin',
    targetGender: 'Semua',
    targetLembaga: 'Semua'
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
  selectedPeriodIds?: string[];
  isCicil?: boolean;
  isContinuing?: boolean;
  subPeriodId?: string;
  totalPeriodAmount?: number;
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
