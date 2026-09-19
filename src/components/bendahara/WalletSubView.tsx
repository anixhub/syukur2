import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ArrowLeftRight,
  QrCode,
  Copy,
  BarChart3,
  LineChart,
  CreditCard,
  Send,
  Download,
  History,
  MoreHorizontal,
  TrendingUp,
  Edit2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Home as HomeIcon,
  Palmtree,
  ShieldCheck,
  X,
  Building,
  DollarSign,
  UserCheck,
  Check,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Search,
  Receipt,
  PieChart,
  Percent,
  Coins,
  Ban,
  Wallet,
  HelpCircle,
  Info
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  accountNumber?: string;
}

interface TransactionItem {
  id: string;
  cardId?: string;
  name: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'Selesai' | 'Ditolak' | 'Menunggu';
  logoType: 'td' | 'salesforce' | 'vanguard' | 'cnx' | 'amazon' | 'avatar';
  avatarUrl?: string;
  logoColor?: string;
  logoLetter?: string;
}

export interface WalletCard {
  id: string;
  type: string;
  brand: string;
  balance: number;
  holder: string;
  gradient: string;
  cardNumber?: string;
  isLocked?: boolean;
}

export interface CardBudgetItem {
  id: string;
  cardId: string;
  name: string;
  targetType: 'transfer' | 'send'; // 'transfer' (ke rekening lain) or 'send' (kirim kas / pembayaran)
  targetDetail: string; // e.g. "BSI Syariah 7144219988 a.n Yayasan" or "Dapur Santri Putra & Putri"
  targetCardId?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  recipientCategory?: string;
  allocationType: 'percentage' | 'amount';
  percentage: number;
  amount: number;
  disbursed: boolean;
  disbursedAt?: string;
  notes?: string;
  createdAt: string;
  isInsufficient?: boolean;
}

/**
 * Format input string into Indonesian Rupiah format:
 * - Automatically separates every 3 digits with dot (.)
 * - Handles decimal with comma (,)
 * - Disallows initial '0' unless followed by comma (e.g. typing 0 then 5 replaces 0 with 5)
 */
export function formatRupiahInput(raw: string): string {
  if (!raw) return '';
  // Only allow digits and comma
  let clean = raw.replace(/[^\d,]/g, '');

  const commaIndex = clean.indexOf(',');
  let integerPart = clean;
  let decimalPart: string | null = null;

  if (commaIndex !== -1) {
    integerPart = clean.slice(0, commaIndex);
    decimalPart = clean.slice(commaIndex + 1).replace(/,/g, '');
  }

  // If user inputs '0' then another digit, '0' is replaced by the new digit(s)
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+/, '');
    if (integerPart === '') integerPart = '0';
  }

  // Format integer with dot every 3 digits
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decimalPart !== null) {
    return `${formattedInteger},${decimalPart}`;
  }
  return formattedInteger;
}

export function parseRupiahInput(formatted: string | number): number {
  if (typeof formatted === 'number') return formatted;
  if (!formatted) return 0;
  const normalized = formatted.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

interface GoalItem {
  id: string;
  title: string;
  current: number;
  target: number;
  timeLeft: string;
  type: 'this_year' | 'long_term';
  icon: 'reserve' | 'travel' | 'car' | 'real_estate';
}

const INITIAL_CARD_CONTACTS: Record<string, Contact[]> = {
  'c-1': [
    { id: '1', name: 'Davis', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', role: 'Vendor IT' },
    { id: '2', name: 'Elli', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', role: 'Konsumsi' },
    { id: '3', name: 'Leo', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', role: 'Sarpras' },
    { id: '4', name: 'Amanda', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', role: 'Akademik' },
    { id: '5', name: 'Ann', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80', role: 'Kesehatan' },
    { id: '6', name: 'Sin', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', role: 'Keamanan' },
  ],
  'c-2': [
    { id: 'c2-1', name: 'Google', avatar: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120&auto=format&fit=crop&q=80', role: 'Workspace' },
    { id: 'c2-2', name: 'AWS Cloud', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80', role: 'Server Host' },
    { id: 'c2-3', name: 'Percetakan', avatar: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=120&auto=format&fit=crop&q=80', role: 'Kitab & Modul' },
    { id: 'c2-4', name: 'TB Mitra', avatar: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&auto=format&fit=crop&q=80', role: 'Bahan Asrama' },
    { id: 'c2-5', name: 'PLN Pusat', avatar: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=120&auto=format&fit=crop&q=80', role: 'Listrik Gedung' },
    { id: 'c2-6', name: 'SPBU Mitra', avatar: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=120&auto=format&fit=crop&q=80', role: 'BBM Operasional' },
  ],
  'c-3': [
    { id: 'c3-1', name: 'Bu Siti', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', role: 'Dapur Santri' },
    { id: 'c3-2', name: 'Pak Ahmad', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80', role: 'Petani Sayur' },
    { id: 'c3-3', name: 'H. Mahmud', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80', role: 'Grosir Beras' },
    { id: 'c3-4', name: 'dr. Fatimah', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80', role: 'Poskestren' },
    { id: 'c3-5', name: 'Kang Ujang', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80', role: 'Ambulans' },
    { id: 'c3-6', name: 'Laundry', avatar: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=120&auto=format&fit=crop&q=80', role: 'Asrama Putra' },
  ]
};

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  // Card 1 (c-1: Kartu Debit Rekening Utama)
  {
    id: 'tx-1',
    cardId: 'c-1',
    name: 'Bagi Hasil Simpanan Syariah',
    date: '25 Feb 2025',
    amount: 1100000,
    type: 'income',
    status: 'Selesai',
    logoType: 'td',
    logoColor: 'bg-emerald-600',
    logoLetter: 'BS'
  },
  {
    id: 'tx-2',
    cardId: 'c-1',
    name: 'Langganan Sistem & Server',
    date: '25 Feb 2025',
    amount: -6400000,
    type: 'expense',
    status: 'Ditolak',
    logoType: 'salesforce',
    logoColor: 'bg-sky-500',
    logoLetter: 'IT'
  },
  {
    id: 'tx-3',
    cardId: 'c-1',
    name: 'Investasi Sukuk / Reksadana Syariah',
    date: '21 Feb 2025',
    amount: -900000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'vanguard',
    logoColor: 'bg-slate-900',
    logoLetter: 'SK'
  },
  {
    id: 'tx-4',
    cardId: 'c-1',
    name: 'Jasa Konsultan & Audit Keuangan',
    date: '21 Feb 2025',
    amount: -2100000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'cnx',
    logoColor: 'bg-blue-900',
    logoLetter: 'AK'
  },
  {
    id: 'tx-5',
    cardId: 'c-1',
    name: 'Pengadaan Sarana & ATK Kantor',
    date: '20 Feb 2025',
    amount: -1700000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'amazon',
    logoColor: 'bg-amber-600',
    logoLetter: 'AT'
  },
  {
    id: 'tx-6',
    cardId: 'c-1',
    name: 'Ustadzah Elli Harper (Honor)',
    date: '15 Feb 2025',
    amount: 600000,
    type: 'income',
    status: 'Selesai',
    logoType: 'avatar',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'tx-7',
    cardId: 'c-1',
    name: 'Ustadz Davis Rowen (Infaq)',
    date: '15 Feb 2025',
    amount: 800000,
    type: 'income',
    status: 'Selesai',
    logoType: 'avatar',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },

  // Card 2 (c-2: Kartu Kredit Tagihan & Pengadaan)
  {
    id: 'tx-c2-1',
    cardId: 'c-2',
    name: 'Google Workspace Pesantren',
    date: '26 Feb 2025',
    amount: -720000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'cnx',
    logoColor: 'bg-red-500',
    logoLetter: 'GW'
  },
  {
    id: 'tx-c2-2',
    cardId: 'c-2',
    name: 'Cloud Server & Database VPS',
    date: '24 Feb 2025',
    amount: -1250000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'salesforce',
    logoColor: 'bg-amber-600',
    logoLetter: 'CS'
  },
  {
    id: 'tx-c2-3',
    cardId: 'c-2',
    name: 'Percetakan Modul & Kitab Santri',
    date: '22 Feb 2025',
    amount: -1450000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'amazon',
    logoColor: 'bg-indigo-600',
    logoLetter: 'PK'
  },
  {
    id: 'tx-c2-4',
    cardId: 'c-2',
    name: 'Bahan Bangunan Renovasi Asrama',
    date: '19 Feb 2025',
    amount: -2800000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'td',
    logoColor: 'bg-emerald-700',
    logoLetter: 'TB'
  },
  {
    id: 'tx-c2-5',
    cardId: 'c-2',
    name: 'PLN Tagihan Listrik Gedung Pusat',
    date: '16 Feb 2025',
    amount: -850000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'cnx',
    logoColor: 'bg-yellow-600',
    logoLetter: 'PL'
  },
  {
    id: 'tx-c2-6',
    cardId: 'c-2',
    name: 'Cashback & Poin Reward Korporat',
    date: '15 Feb 2025',
    amount: 150000,
    type: 'income',
    status: 'Selesai',
    logoType: 'vanguard',
    logoColor: 'bg-emerald-600',
    logoLetter: 'CB'
  },

  // Card 3 (c-3: Operasional GPN Syariah Dapur & Logistik)
  {
    id: 'tx-c3-1',
    cardId: 'c-3',
    name: 'Belanja Beras Organik 500kg',
    date: '26 Feb 2025',
    amount: -3500000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'td',
    logoColor: 'bg-emerald-600',
    logoLetter: 'BR'
  },
  {
    id: 'tx-c3-2',
    cardId: 'c-3',
    name: 'Suplai Sayur & Lauk Dapur Utama',
    date: '25 Feb 2025',
    amount: -2100000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'amazon',
    logoColor: 'bg-lime-600',
    logoLetter: 'DP'
  },
  {
    id: 'tx-c3-3',
    cardId: 'c-3',
    name: 'Obat & Multivitamin Poskestren',
    date: '23 Feb 2025',
    amount: -850000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'cnx',
    logoColor: 'bg-teal-600',
    logoLetter: 'OB'
  },
  {
    id: 'tx-c3-4',
    cardId: 'c-3',
    name: 'Infaq Harian Donatur Santri',
    date: '22 Feb 2025',
    amount: 1500000,
    type: 'income',
    status: 'Selesai',
    logoType: 'avatar',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'tx-c3-5',
    cardId: 'c-3',
    name: 'BBM & Servis Ambulans Santri',
    date: '20 Feb 2025',
    amount: -750000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'salesforce',
    logoColor: 'bg-blue-700',
    logoLetter: 'AM'
  },
  {
    id: 'tx-c3-6',
    cardId: 'c-3',
    name: 'Biaya Tabung Gas Elpiji Dapur',
    date: '18 Feb 2025',
    amount: -600000,
    type: 'expense',
    status: 'Selesai',
    logoType: 'vanguard',
    logoColor: 'bg-amber-700',
    logoLetter: 'GS'
  }
];

const INITIAL_GOALS: GoalItem[] = [
  {
    id: 'g-1',
    title: 'Dana Cadangan Kas',
    current: 7000000,
    target: 10000000,
    timeLeft: 'Sisa waktu 4 bulan',
    type: 'this_year',
    icon: 'reserve'
  },
  {
    id: 'g-2',
    title: 'Rihlah & Ziarah Santri',
    current: 2500000,
    target: 4000000,
    timeLeft: 'Sisa waktu 3 bulan',
    type: 'long_term',
    icon: 'travel'
  },
  {
    id: 'g-3',
    title: 'Mobil Operasional',
    current: 16000000,
    target: 200000000,
    timeLeft: 'Sisa waktu 3 tahun 6 bulan',
    type: 'long_term',
    icon: 'car'
  },
  {
    id: 'g-4',
    title: 'Gedung & Wakaf Tanah',
    current: 83000000,
    target: 700000000,
    timeLeft: 'Sisa waktu 5 tahun 8 bulan',
    type: 'long_term',
    icon: 'real_estate'
  }
];

const INITIAL_CARD_BUDGETS: CardBudgetItem[] = [
  {
    id: 'bg-1',
    cardId: 'c-1',
    name: 'Operasional Dapur & Beras Santri',
    targetType: 'send',
    targetDetail: 'Dapur Santri Putra & Putri',
    recipientCategory: 'Dapur Pesantren',
    allocationType: 'percentage',
    percentage: 35,
    amount: 4357500, // 35% of 12.450.000
    disbursed: false,
    notes: 'Kebutuhan beras, lauk-pauk, dan bumbu dapur 2 pekan',
    createdAt: 'Hari ini'
  },
  {
    id: 'bg-2',
    cardId: 'c-1',
    name: 'Gaji Guru & Pengajar Kitab',
    targetType: 'transfer',
    targetDetail: 'BSI Syariah • 7144219988 a.n Yayasan',
    bankName: 'BSI Syariah',
    accountNumber: '7144219988',
    accountHolder: 'Yayasan Bina Santri',
    allocationType: 'percentage',
    percentage: 30,
    amount: 3735000, // 30% of 12.450.000
    disbursed: false,
    notes: 'Honorarium bulanan asatidz kitab kuning',
    createdAt: 'Hari ini'
  }
];

// Weekly chart item type
interface ChartDayItem {
  id: string;
  day: string;
  fullDay: string;
  isToday: boolean;
  closingBalance: number; // Saldo akhir (menentukan tinggi batang relatif terhadap hari-hari lain)
  saldo: number;          // Komponen Saldo (menggantikan Tabungan)
  income: number;         // Komponen Pemasukan
  expenses: number;       // Komponen Pengeluaran
  hasData: boolean;
}

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const FULL_DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Mock historic data for the 6 days prior to Today
const PAST_DAYS_MOCK: Record<number, { closingBalance: number; saldo: number; income: number; expenses: number }> = {
  6: { closingBalance: 21800000, saldo: 3200000, income: 4500000, expenses: 3100000 },
  5: { closingBalance: 23100000, saldo: 3800000, income: 5200000, expenses: 3900000 },
  4: { closingBalance: 22400000, saldo: 3000000, income: 4100000, expenses: 4800000 },
  3: { closingBalance: 24500000, saldo: 4400000, income: 6900000, expenses: 4800000 },
  2: { closingBalance: 25200000, saldo: 4100000, income: 5600000, expenses: 3900000 },
  1: { closingBalance: 25800000, saldo: 4800000, income: 6200000, expenses: 4600000 }
};

function generateWeeklyChartDays(
  todayClosingBalance: number,
  todayIncome: number,
  todaySaldo: number,
  todayExpenses: number
): ChartDayItem[] {
  const today = new Date();
  const days: ChartDayItem[] = [];

  // Generate 7 days ending with Today (i = 6 down to i = 0)
  // i = 0 is Today, ensuring Today is ALWAYS the rightmost bar (days[6])
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dayOfWeek = d.getDay();
    const isToday = i === 0;

    const data = isToday
      ? { closingBalance: todayClosingBalance, saldo: todaySaldo, income: todayIncome, expenses: todayExpenses }
      : (PAST_DAYS_MOCK[i] || { closingBalance: 0, saldo: 0, income: 0, expenses: 0 });

    const hasData = data.closingBalance > 0 || data.saldo > 0 || data.income > 0 || data.expenses > 0;

    days.push({
      id: `day-${i}-${d.getDate()}`,
      day: DAY_NAMES_ID[dayOfWeek],
      fullDay: `${FULL_DAY_NAMES_ID[dayOfWeek]}, ${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`,
      isToday,
      closingBalance: data.closingBalance,
      saldo: data.saldo,
      income: data.income,
      expenses: data.expenses,
      hasData
    });
  }

  return days;
}

/**
 * Menghasilkan skala sumbu Y yang aktual, valid, dan adaptif terhadap nominal tertinggi pada diagram
 * dengan 5 titik koordinat (100%, 75%, 50%, 25%, 0%)
 */
function getNiceChartScale(maxValue: number): { maxScale: number; ticks: number[] } {
  const safeMax = Math.max(maxValue, 100000); // Batas aman minimal
  const roughStep = safeMax / 4;

  const exponent = Math.floor(Math.log10(roughStep));
  const magnitude = Math.pow(10, exponent);
  const fraction = roughStep / magnitude;

  // Nilai kelipatan pembagian yang mudah dibaca dan bulat
  const niceCandidates = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 7.5, 8, 10];
  let chosen = 10;
  for (const c of niceCandidates) {
    if (fraction <= c) {
      chosen = c;
      break;
    }
  }

  const step = Math.round(chosen * magnitude);
  const maxScale = step * 4;
  const ticks = [maxScale, step * 3, step * 2, step, 0];
  return { maxScale, ticks };
}

/**
 * Format label nominal sumbu Y agar ringkas dan rapi (e.g. "28 jt", "14 jt", "0")
 */
function formatTickLabel(val: number): string {
  if (val === 0) return '0';
  if (val >= 1000000000) {
    const num = val / 1000000000;
    const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1).replace('.', ',');
    return `${formatted} M`;
  }
  if (val >= 1000000) {
    const num = val / 1000000;
    const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1).replace('.', ',');
    return `${formatted} jt`;
  }
  if (val >= 1000) {
    const num = val / 1000;
    const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(1).replace('.', ',');
    return `${formatted} rb`;
  }
  return val.toLocaleString('id-ID');
}

const CARD_GRADIENT_PALETTES = [
  { label: 'Biru Samudra', grad: 'from-blue-600 via-blue-700 to-indigo-800' },
  { label: 'Midnight Navy', grad: 'from-slate-800 via-slate-900 to-blue-950' },
  { label: 'Hijau Zamrud', grad: 'from-emerald-600 via-teal-700 to-slate-900' },
  { label: 'Teal Tropis', grad: 'from-teal-600 via-cyan-700 to-blue-900' },
  { label: 'Indigo Royal', grad: 'from-indigo-600 via-violet-700 to-purple-900' },
  { label: 'Ungu Elegan', grad: 'from-purple-700 via-indigo-800 to-slate-900' },
  { label: 'Mawar Rose', grad: 'from-rose-600 via-pink-700 to-slate-900' },
  { label: 'Emas Amber', grad: 'from-amber-500 via-orange-600 to-stone-900' }
];

export default function WalletSubView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChartMode, setActiveChartMode] = useState<'bar' | 'line'>('bar');
  const [chartTimeframe, setChartTimeframe] = useState('7h');
  const [costMonth, setCostMonth] = useState('Januari');
  const [healthTimeframe, setHealthTimeframe] = useState('30h');
  const [txTimeframe, setTxTimeframe] = useState('7h');

  // Interactive Hover on Chart: null by default so tooltip ONLY appears on hover!
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Cards State (with balance replacing card number)
  const [cards, setCards] = useState<WalletCard[]>([
    {
      id: 'c-1',
      type: 'Kas Utama Pesantren',
      brand: 'BSI Syariah',
      balance: 12450000,
      holder: 'BENDAHARA PESANTREN',
      gradient: 'from-blue-600 via-blue-700 to-indigo-800',
      cardNumber: '4219 •••• •••• 8821',
      isLocked: false
    },
    {
      id: 'c-2',
      type: 'Kas Sarpras & Gedung',
      brand: 'Bank Muamalat',
      balance: 5000000,
      holder: 'BENDAHARA PESANTREN',
      gradient: 'from-slate-800 via-slate-900 to-blue-950',
      cardNumber: '5321 •••• •••• 4410',
      isLocked: false
    },
    {
      id: 'c-3',
      type: 'Operasional & Dapur',
      brand: 'GPN Syariah',
      balance: 8750000,
      holder: 'BENDAHARA PESANTREN',
      gradient: 'from-emerald-700 via-teal-800 to-slate-900',
      cardNumber: '6012 •••• •••• 1920',
      isLocked: false
    }
  ]);

  // Total current balance across all cards (e.g. Rp 26.200.000)
  const totalWalletBalance = useMemo(() => {
    return cards.reduce((sum, c) => sum + c.balance, 0);
  }, [cards]);

  // Today's dynamic transaction adjustments
  const [todayIncomeAdded, setTodayIncomeAdded] = useState(0);
  const [todayExpensesAdded, setTodayExpensesAdded] = useState(0);

  const todayIncome = 5800000 + todayIncomeAdded;
  const todayExpenses = 3900000 + todayExpensesAdded;
  const todaySaldo = 5100000;

  // Compute the 7 days ending with Today as the rightmost bar
  const chartDays = useMemo(() => {
    return generateWeeklyChartDays(totalWalletBalance, todayIncome, todaySaldo, todayExpenses);
  }, [totalWalletBalance, todayIncome, todaySaldo, todayExpenses]);

  // Skala dinamis aktual dan valid mengikuti nilai nominal tertinggi pada chartDays
  const maxClosingInDays = useMemo(() => {
    return Math.max(...chartDays.map(d => d.closingBalance), 100000);
  }, [chartDays]);

  const { maxScale, ticks } = useMemo(() => {
    return getNiceChartScale(maxClosingInDays);
  }, [maxClosingInDays]);

  // Spending Limit state
  const [spendingCurrent, setSpendingCurrent] = useState(8600000);
  const [spendingLimit, setSpendingLimit] = useState(10000000);
  const [showEditLimitModal, setShowEditLimitModal] = useState(false);

  // Card contacts state mapped per card
  const [cardContacts, setCardContacts] = useState<Record<string, Contact[]>>(INITIAL_CARD_CONTACTS);

  // Smooth circular carousel state (Bidirectional, no flicker, seamless infinite cycle)
  type SlideDir = 'next' | 'prev' | null;
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<SlideDir>(null);
  const isSlidingRef = useRef(false);

  // Expanded actions state for "Lainnya" button (meluas ke bawah, bukan modal)
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  // Upward expansion of transaction history to cover the card
  const [isTxExpandedUpwards, setIsTxExpandedUpwards] = useState(false);

  // Clamped safe active index
  const safeIndex = cards.length > 0 ? ((activeCardIndex % cards.length) + cards.length) % cards.length : 0;
  const activeCard = cards[safeIndex] || cards[0];
  const activeContacts = (activeCard && cardContacts[activeCard.id]) || INITIAL_CARD_CONTACTS['c-1'] || [];

  const handleNextCard = () => {
    if (cards.length <= 1) return;
    if (isSlidingRef.current) return;
    isSlidingRef.current = true;
    setSlideDirection('next');
  };

  const handlePrevCard = () => {
    if (cards.length <= 1) return;
    if (isSlidingRef.current) return;
    isSlidingRef.current = true;
    setSlideDirection('prev');
  };

  const handleSelectCard = (targetIdx: number) => {
    if (cards.length <= 1) return;
    if (isSlidingRef.current) return;
    const cleanTarget = ((targetIdx % cards.length) + cards.length) % cards.length;
    if (cleanTarget === safeIndex) return;
    setActiveCardIndex(cleanTarget);
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget) return;
    if (slideDirection === 'next') {
      setActiveCardIndex((prev) => (prev + 1) % cards.length);
    } else if (slideDirection === 'prev') {
      setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }
    setSlideDirection(null);
    isSlidingRef.current = false;
  };

  // Safety fallback timeout to prevent any stuck animation state
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => {
        if (isSlidingRef.current) {
          if (slideDirection === 'next') {
            setActiveCardIndex((prev) => (prev + 1) % cards.length);
          } else if (slideDirection === 'prev') {
            setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
          }
          setSlideDirection(null);
          isSlidingRef.current = false;
        }
      }, 340);
      return () => clearTimeout(timer);
    }
  }, [slideDirection, cards.length]);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => (curr === msg ? null : curr));
    }, 2800);
  };

  // Card management modals
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState(false);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  const [cardLockedNoticeModal, setCardLockedNoticeModal] = useState(false);

  // Close View All modal on Escape
  useEffect(() => {
    if (!showViewAllModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowViewAllModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showViewAllModal]);

  // Add Card form state
  const [newCardType, setNewCardType] = useState('Kas Operasional');
  const [newCardBrand, setNewCardBrand] = useState('BSI Syariah');
  const [newCardHolder, setNewCardHolder] = useState('BENDAHARA PESANTREN');
  const [newCardNumber, setNewCardNumber] = useState('4219 8812 3456 7890');
  const [newCardBalance, setNewCardBalance] = useState('5000000');
  const [newCardGradient, setNewCardGradient] = useState('from-blue-600 via-blue-700 to-indigo-800');

  // Edit Card form state
  const [editCardType, setEditCardType] = useState('');
  const [editCardBrand, setEditCardBrand] = useState('');
  const [editCardHolder, setEditCardHolder] = useState('');
  const [editCardBalance, setEditCardBalance] = useState('');
  const [editCardGradient, setEditCardGradient] = useState('');

  const handleOpenEditCard = () => {
    if (!activeCard) return;
    setEditCardType(activeCard.type);
    setEditCardBrand(activeCard.brand);
    setEditCardHolder(activeCard.holder);
    setEditCardBalance(String(activeCard.balance));
    setEditCardGradient(activeCard.gradient);
    setShowEditCardModal(true);
  };

  const handleToggleLockCard = () => {
    if (!activeCard) return;
    const willLock = !activeCard.isLocked;
    setCards(prev => prev.map(c => c.id === activeCard.id ? { ...c, isLocked: willLock } : c));
    showToast(willLock ? `Kartu ${activeCard.brand} dikunci. Transaksi dinonaktifkan.` : `Kunci kartu ${activeCard.brand} telah dibuka.`);
  };

  const handleSaveEditCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    setCards(prev => prev.map(c => c.id === activeCard.id ? {
      ...c,
      type: editCardType.trim() || c.type,
      holder: (editCardHolder.trim() || c.holder).toUpperCase(),
      gradient: editCardGradient
    } : c));
    setShowEditCardModal(false);
    showToast('Perubahan data kartu berhasil disimpan.');
  };

  const handleOpenDeleteCard = () => {
    setShowDeleteCardModal(true);
  };

  const handleConfirmDeleteCard = () => {
    if (cards.length <= 1) {
      showToast('Minimal harus ada 1 kartu dalam dompet pesantren.');
      setShowDeleteCardModal(false);
      return;
    }
    const cardTitle = activeCard?.type || 'Kartu';
    setCards(prev => prev.filter(c => c.id !== activeCard?.id));
    setActiveCardIndex(0);
    setShowDeleteCardModal(false);
    showToast(`Kartu "${cardTitle}" berhasil dihapus.`);
  };

  const handleOpenAddCard = () => {
    setNewCardType('');
    setNewCardHolder('BENDAHARA PESANTREN');
    setNewCardGradient('from-blue-600 via-blue-700 to-indigo-800');
    setShowAddCardModal(true);
  };

  const handleSaveNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `c-${Date.now()}`;
    const newCardItem: WalletCard = {
      id: newId,
      type: newCardType.trim() || 'Kas Rekening',
      brand: 'BSI Syariah',
      balance: 0,
      holder: (newCardHolder.trim() || 'BENDAHARA PESANTREN').toUpperCase(),
      gradient: newCardGradient,
      cardNumber: '4219 •••• •••• ' + Math.floor(1000 + Math.random() * 9000),
      isLocked: false
    };

    setCards(prev => [...prev, newCardItem]);
    setCardContacts(prev => ({
      ...prev,
      [newId]: [
        { id: `${newId}-1`, name: 'Bendahara', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', role: 'Kas Utama' },
        { id: `${newId}-2`, name: 'Sarpras', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', role: 'Logistik' },
        { id: `${newId}-3`, name: 'Dapur', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', role: 'Konsumsi' },
        { id: `${newId}-4`, name: 'Poskestren', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80', role: 'Kesehatan' },
      ]
    }));

    // Focus immediately on the new card
    setActiveCardIndex(cards.length);
    setShowAddCardModal(false);
    showToast(`Kartu "${newCardItem.type}" berhasil ditambahkan.`);
  };

  // Modals state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form states for modals
  const [modalAmount, setModalAmount] = useState('');
  const [modalRecipient, setModalRecipient] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [topUpSource, setTopUpSource] = useState('BSI Syariah Pesantren');
  const [transferTargetCardId, setTransferTargetCardId] = useState<string>('');
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [isTransferDropdownOpen, setIsTransferDropdownOpen] = useState(false);
  const transferInputContainerRef = useRef<HTMLDivElement | null>(null);
  const transferDropdownMenuRef = useRef<HTMLDivElement | null>(null);

  // Close transfer dropdown when clicking any area besides the input box
  useEffect(() => {
    if (!isTransferDropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      // If clicking inside input container (input or chevron), let input handle its event
      if (transferInputContainerRef.current && transferInputContainerRef.current.contains(target)) {
        return;
      }
      // If clicking inside dropdown list, let item selection handle it
      if (transferDropdownMenuRef.current && transferDropdownMenuRef.current.contains(target)) {
        return;
      }
      // Clicked anywhere else -> close dropdown immediately
      setIsTransferDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isTransferDropdownOpen]);

  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Receive modal states
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveSender, setReceiveSender] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  // Goals
  const [goals, setGoals] = useState<GoalItem[]>(INITIAL_GOALS);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDuration, setNewGoalDuration] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'this_year' | 'long_term'>('this_year');

  // Transactions list
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  // ==========================================
  // ANGGARKAN DANA (BUDGETING) STATE & LOGIC
  // ==========================================
  // Toggle status per card (cardId -> boolean)
  const [cardBudgetEnabled, setCardBudgetEnabled] = useState<Record<string, boolean>>({
    'c-1': true, // Card 1 defaults to active so user can immediately experience the requested behavior
    'c-2': false,
    'c-3': false,
  });

  // List of all budgets across cards
  const [cardBudgets, setCardBudgets] = useState<CardBudgetItem[]>(INITIAL_CARD_BUDGETS);

  // Budget modals
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [expandedBudgetIds, setExpandedBudgetIds] = useState<Record<string, boolean>>({});
  const [showBudgetLockedNotice, setShowBudgetLockedNotice] = useState(false);
  const [showBudgetNoticeBanner, setShowBudgetNoticeBanner] = useState(true);
  const [disburseModalItems, setDisburseModalItems] = useState<CardBudgetItem[] | null>(null);

  const toggleExpandBudget = (id: string) => {
    setExpandedBudgetIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Form states for Tambah Anggaran
  const [budgetName, setBudgetName] = useState('');
  const [budgetTargetType, setBudgetTargetType] = useState<'transfer' | 'send'>('transfer');
  // For transfer to other card:
  const [budgetTargetCardId, setBudgetTargetCardId] = useState('');
  const [budgetCardSearchQuery, setBudgetCardSearchQuery] = useState('');
  const [isBudgetCardDropdownOpen, setIsBudgetCardDropdownOpen] = useState(false);
  const budgetCardInputContainerRef = useRef<HTMLDivElement | null>(null);
  const budgetCardDropdownMenuRef = useRef<HTMLDivElement | null>(null);

  // Close budget card dropdown when clicking any area besides the input box
  useEffect(() => {
    if (!isBudgetCardDropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (budgetCardInputContainerRef.current && budgetCardInputContainerRef.current.contains(target)) {
        return;
      }
      if (budgetCardDropdownMenuRef.current && budgetCardDropdownMenuRef.current.contains(target)) {
        return;
      }
      setIsBudgetCardDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isBudgetCardDropdownOpen]);

  // For send / operasional:
  const [budgetRecipientText, setBudgetRecipientText] = useState('');
  const [budgetNotes, setBudgetNotes] = useState('');
  // Allocation method: percentage or amount (Rp)
  const [budgetAllocationType, setBudgetAllocationType] = useState<'percentage' | 'amount'>('percentage');
  const [budgetPercentage, setBudgetPercentage] = useState<number>(25);
  const [budgetAmountInput, setBudgetAmountInput] = useState<string>('');

  // Active card's budgeting status & calculations
  const isBudgetActive = !!(activeCard && cardBudgetEnabled[activeCard.id]);

  // Sum of existing percentage budgets for the active card
  const existingPercentageTotal = useMemo(() => {
    if (!activeCard) return 0;
    return cardBudgets
      .filter(b => b.cardId === activeCard.id && b.allocationType === 'percentage')
      .reduce((sum, b) => sum + b.percentage, 0);
  }, [cardBudgets, activeCard]);

  // Check if any nominal budget exists for the active card
  const hasNominalBudget = useMemo(() => {
    if (!activeCard) return false;
    return cardBudgets.some(b => b.cardId === activeCard.id && b.allocationType === 'amount');
  }, [cardBudgets, activeCard]);

  // Max allowed percentage: if nominal budget exists, max total is 99% (reserving 1% for nominal).
  // Otherwise 100%.
  const maxAllowedPercentage = useMemo(() => {
    if (!activeCard) return 0;
    let basePct = existingPercentageTotal;
    let nominalExists = hasNominalBudget;

    if (editingBudgetId) {
      const itemBeingEdited = cardBudgets.find(b => b.id === editingBudgetId);
      if (itemBeingEdited && itemBeingEdited.allocationType === 'percentage') {
        basePct = Math.max(0, basePct - itemBeingEdited.percentage);
      }
      nominalExists = cardBudgets.some(
        b => b.cardId === activeCard.id && b.id !== editingBudgetId && b.allocationType === 'amount'
      );
    }
    const maxCap = nominalExists ? 99 : 100;
    return Math.max(0, maxCap - basePct);
  }, [existingPercentageTotal, editingBudgetId, cardBudgets, activeCard, hasNominalBudget]);

  // If budget percentage reached capacity (100% or 99% when nominal exists), cannot add new budget
  const isAddBudgetDisabled = useMemo(() => {
    if (!activeCard) return true;
    const maxCap = hasNominalBudget ? 99 : 100;
    return existingPercentageTotal >= maxCap;
  }, [activeCard, hasNominalBudget, existingPercentageTotal]);

  const {
    activeCardBudgets,
    totalAllocatedAmount,
    totalAllocatedPercent,
    unallocatedBalance,
    unallocatedPercent,
    remainingBalanceForNominal
  } = useMemo(() => {
    if (!activeCard) {
      return {
        activeCardBudgets: [],
        totalAllocatedAmount: 0,
        totalAllocatedPercent: 0,
        unallocatedBalance: 0,
        unallocatedPercent: 100,
        remainingBalanceForNominal: 0
      };
    }

    const items = cardBudgets.filter(b => b.cardId === activeCard.id);

    // 1. Percentage budgets take precedence based on active card balance
    let pctSum = 0;
    let pctAmountSum = 0;
    items.forEach(b => {
      if (b.allocationType === 'percentage') {
        pctSum += b.percentage;
        pctAmountSum += Math.round((activeCard.balance * b.percentage) / 100);
      }
    });

    // Sisa saldo setelah alokasi persentase
    const remainingForNominal = Math.max(0, activeCard.balance - pctAmountSum);

    // 2. Evaluate nominal budgets against the remaining balance
    let runningNominalSum = 0;
    let totalAllocated = pctAmountSum;

    const evaluated = items.map(b => {
      if (b.allocationType === 'amount') {
        const itemNominal = b.amount;
        runningNominalSum += itemNominal;
        totalAllocated += itemNominal;
        // If remaining balance after percentage budgets cannot cover this nominal budget
        const isInsufficient = itemNominal > remainingForNominal || runningNominalSum > remainingForNominal;
        const pct = activeCard.balance > 0 ? Math.round((itemNominal / activeCard.balance) * 100) : 0;
        return {
          ...b,
          amount: itemNominal,
          percentage: pct,
          isInsufficient
        };
      } else {
        const amt = Math.round((activeCard.balance * b.percentage) / 100);
        return {
          ...b,
          amount: amt,
          isInsufficient: false
        };
      }
    });

    const totalPct = activeCard.balance > 0 ? Math.min(100, Math.round((totalAllocated / activeCard.balance) * 100)) : 0;
    const unallocatedBal = Math.max(0, activeCard.balance - totalAllocated);
    const unallocatedPct = Math.max(0, 100 - totalPct);

    return {
      activeCardBudgets: evaluated,
      totalAllocatedAmount: totalAllocated,
      totalAllocatedPercent: totalPct,
      unallocatedBalance: unallocatedBal,
      unallocatedPercent: unallocatedPct,
      remainingBalanceForNominal: remainingForNominal
    };
  }, [cardBudgets, activeCard]);

  const activeUndisbursedBudgets = useMemo(() => {
    return activeCardBudgets.filter(b => b.amount > 0 && !b.isInsufficient);
  }, [activeCardBudgets]);

  // Filtered cards for Transfer combobox
  const filteredTransferCards = useMemo(() => {
    if (!activeCard) return [];
    const others = cards.filter(c => c.id !== activeCard.id);
    if (!transferSearchQuery.trim()) return others;
    const q = transferSearchQuery.toLowerCase();
    return others.filter(c =>
      c.type.toLowerCase().includes(q) ||
      c.brand.toLowerCase().includes(q) ||
      c.holder.toLowerCase().includes(q)
    );
  }, [cards, activeCard, transferSearchQuery]);

  // Filtered cards for Budget target combobox (Pilih Rekening)
  const filteredBudgetCards = useMemo(() => {
    if (!activeCard) return [];
    const others = cards.filter(c => c.id !== activeCard.id);
    if (!budgetCardSearchQuery.trim()) return others;
    const q = budgetCardSearchQuery.toLowerCase();
    return others.filter(c =>
      c.type.toLowerCase().includes(q) ||
      c.brand.toLowerCase().includes(q) ||
      c.holder.toLowerCase().includes(q)
    );
  }, [cards, activeCard, budgetCardSearchQuery]);

  // Toggle handler
  const handleToggleBudgetMode = () => {
    if (!activeCard) return;
    setCardBudgetEnabled(prev => {
      const nextState = !prev[activeCard.id];
      if (nextState) {
        setShowBudgetNoticeBanner(true);
        showToast(`Mode Anggarkan Dana diaktifkan untuk ${activeCard.type}. Transfer manual kartu dikunci.`);
      } else {
        showToast(`Mode Anggarkan Dana dinonaktifkan untuk ${activeCard.type}. Transfer manual kembali aktif.`);
      }
      return {
        ...prev,
        [activeCard.id]: nextState
      };
    });
  };

  // Open modal handler for adding new budget
  const handleOpenAddBudget = () => {
    if (isAddBudgetDisabled) return;
    setEditingBudgetId(null);
    setBudgetName('');
    setBudgetTargetType('transfer');
    setBudgetTargetCardId('');
    setBudgetCardSearchQuery('');
    setIsBudgetCardDropdownOpen(false);
    setBudgetRecipientText('');
    setBudgetNotes('');
    setBudgetAllocationType('percentage');
    setBudgetAmountInput('');
    // Automatically fill remaining allowed percentage
    const safeRemaining = Math.max(1, maxAllowedPercentage);
    setBudgetPercentage(safeRemaining);
    setShowAddBudgetModal(true);
  };

  // Open modal handler for adjusting / editing existing budget
  const handleOpenEditBudget = (item: CardBudgetItem) => {
    setEditingBudgetId(item.id);
    setBudgetName(item.name);
    setBudgetTargetType(item.targetType);
    if (item.targetType === 'transfer') {
      const existingTargetCard = cards.find(c => c.id === item.targetCardId);
      if (existingTargetCard) {
        setBudgetTargetCardId(existingTargetCard.id);
        setBudgetCardSearchQuery(existingTargetCard.type);
      } else {
        const fallbackCard = cards.find(c => c.id !== activeCard?.id);
        setBudgetTargetCardId(fallbackCard ? fallbackCard.id : '');
        setBudgetCardSearchQuery(fallbackCard ? fallbackCard.type : '');
      }
    } else {
      setBudgetTargetCardId('');
      setBudgetCardSearchQuery('');
    }
    setIsBudgetCardDropdownOpen(false);
    setBudgetRecipientText(item.recipientCategory || '');
    setBudgetNotes(item.notes || '');
    setBudgetAllocationType(item.allocationType);
    if (item.allocationType === 'percentage') {
      setBudgetPercentage(item.percentage);
      setBudgetAmountInput('');
    } else {
      setBudgetAmountInput(formatRupiahInput(item.amount.toString()));
      setBudgetPercentage(25);
    }
    setShowAddBudgetModal(true);
  };

  const handlePercentageChange = (pct: number) => {
    const clamped = Math.max(1, Math.min(maxAllowedPercentage, pct));
    setBudgetPercentage(clamped);
  };

  // Save budget handler (supports create & edit)
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    const cleanName = budgetName.trim();
    if (!cleanName) {
      showToast('Mohon masukkan nama anggaran');
      return;
    }

    let allocatedAmt = 0;
    let allocatedPct = 0;

    if (budgetAllocationType === 'percentage') {
      if (maxAllowedPercentage <= 0) {
        showToast('Alokasi anggaran sudah mencapai batas maksimal.');
        return;
      }
      allocatedPct = Math.max(1, Math.min(maxAllowedPercentage, budgetPercentage));
      allocatedAmt = Math.round((allocatedPct / 100) * activeCard.balance);
    } else {
      allocatedAmt = parseRupiahInput(budgetAmountInput);
      if (allocatedAmt <= 0) {
        showToast('Mohon masukkan nominal anggaran yang valid.');
        return;
      }
      allocatedPct = activeCard.balance > 0 ? Math.round((allocatedAmt / activeCard.balance) * 100) : 0;
    }

    let targetDesc = '';
    if (budgetTargetType === 'transfer') {
      if (!budgetTargetCardId) {
        showToast('Mohon pilih rekening tujuan alokasi');
        return;
      }
      const targetCard = cards.find(c => c.id === budgetTargetCardId);
      const targetName = targetCard ? `${targetCard.brand} - ${targetCard.type}` : 'Kartu Pesantren';
      targetDesc = `Transfer ke ${targetName}`;
    } else {
      targetDesc = budgetRecipientText.trim() || 'Kas Operasional';
    }

    if (editingBudgetId) {
      setCardBudgets(prev => prev.map(b => {
        if (b.id === editingBudgetId) {
          return {
            ...b,
            name: cleanName,
            targetType: budgetTargetType,
            targetDetail: targetDesc,
            targetCardId: budgetTargetType === 'transfer' ? budgetTargetCardId : undefined,
            recipientCategory: budgetTargetType === 'send' ? budgetRecipientText.trim() : undefined,
            notes: undefined,
            allocationType: budgetAllocationType,
            percentage: allocatedPct,
            amount: allocatedAmt,
          };
        }
        return b;
      }));
      setShowAddBudgetModal(false);
      setEditingBudgetId(null);
      showToast(
        budgetAllocationType === 'percentage'
          ? `Anggaran "${cleanName}" (${allocatedPct}%) berhasil disesuaikan.`
          : `Anggaran "${cleanName}" (${formatMoney(allocatedAmt)}) berhasil disesuaikan.`
      );
      return;
    }

    const newBudgetItem: CardBudgetItem = {
      id: `bg-${Date.now()}`,
      cardId: activeCard.id,
      name: cleanName,
      targetType: budgetTargetType,
      targetDetail: targetDesc,
      targetCardId: budgetTargetType === 'transfer' ? budgetTargetCardId : undefined,
      recipientCategory: budgetTargetType === 'send' ? budgetRecipientText.trim() : undefined,
      notes: undefined,
      allocationType: budgetAllocationType,
      percentage: allocatedPct,
      amount: allocatedAmt,
      disbursed: false,
      createdAt: 'Hari ini'
    };

    setCardBudgets(prev => [...prev, newBudgetItem]);
    setShowAddBudgetModal(false);
    showToast(
      budgetAllocationType === 'percentage'
        ? `Anggaran "${cleanName}" (${allocatedPct}%) berhasil disimpan.`
        : `Anggaran "${cleanName}" (${formatMoney(allocatedAmt)}) berhasil disimpan.`
    );
  };

  // Delete budget handler
  const handleDeleteBudget = (budgetId: string) => {
    setCardBudgets(prev => prev.filter(b => b.id !== budgetId));
    showToast('Pos anggaran berhasil dihapus.');
  };

  // Prompt disbursement for single item
  const handlePromptDisburse = (item: CardBudgetItem) => {
    setDisburseModalItems([item]);
  };

  // Confirm disbursement
  const handleConfirmDisburseItems = () => {
    if (!disburseModalItems || disburseModalItems.length === 0 || !activeCard) return;

    const itemsToProcess = disburseModalItems;
    const totalAmount = itemsToProcess.reduce((sum, b) => sum + b.amount, 0);
    const itemIds = new Set(itemsToProcess.map(b => b.id));

    const newBalance = Math.max(0, activeCard.balance - totalAmount);

    // Deduct from card balance
    setCards(prev => prev.map(c => {
      if (c.id === activeCard.id) {
        return {
          ...c,
          balance: newBalance
        };
      }
      return c;
    }));

    // Update budget items: recalculate nominal for percentage budgets, preserve target nominal for amount-based budgets
    setCardBudgets(prev => prev.map(b => {
      if (b.cardId === activeCard.id) {
        return {
          ...b,
          amount: b.allocationType === 'amount' ? b.amount : Math.round((newBalance * b.percentage) / 100),
          disbursed: false,
          disbursedAt: 'Hari ini'
        };
      }
      return b;
    }));

    // Record in transaction history
    const baseTime = Date.now();
    const newTxs: TransactionItem[] = itemsToProcess.map((item, idx) => ({
      id: `tx-${baseTime}-${idx}`,
      cardId: item.cardId,
      name: `Anggaran: ${item.name}`,
      date: 'Hari Ini',
      amount: -item.amount,
      type: 'expense',
      status: 'Selesai',
      logoType: item.targetType === 'transfer' ? 'td' : 'cnx',
      logoColor: item.targetType === 'transfer' ? 'bg-indigo-600' : 'bg-blue-600',
      logoLetter: item.name.substring(0, 2).toUpperCase()
    }));

    setTransactions(prev => [...newTxs, ...prev]);
    setSpendingCurrent(prev => prev + totalAmount);
    setTodayExpensesAdded(prev => prev + totalAmount);
    setDisburseModalItems(null);

    if (itemsToProcess.length === 1) {
      showToast(`Dana pos anggaran "${itemsToProcess[0].name}" sebesar ${formatMoney(totalAmount)} berhasil disalurkan.`);
    } else {
      showToast(`Sebanyak ${itemsToProcess.length} pos anggaran (${formatMoney(totalAmount)}) berhasil disalurkan.`);
    }
  };

  // Currency Formatter: Always Indonesian Rupiah (Rp)
  const formatMoney = (amount: number) => {
    const isNegative = amount < 0;
    const absVal = Math.abs(amount).toLocaleString('id-ID');
    return `${isNegative ? '-Rp ' : 'Rp '}${absVal}`;
  };

  const handleQuickSend = (contact: Contact) => {
    if (activeCard.isLocked) {
      setCardLockedNoticeModal(true);
      return;
    }
    if (cardBudgetEnabled[activeCard.id]) {
      setShowBudgetLockedNotice(true);
      return;
    }
    setSelectedContact(contact);
    setModalRecipient(contact.name);
    setShowSendModal(true);
  };

  const handleProcessSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCard.isLocked) {
      setCardLockedNoticeModal(true);
      return;
    }
    if (cardBudgetEnabled[activeCard.id]) {
      setShowBudgetLockedNotice(true);
      return;
    }
    const val = parseRupiahInput(modalAmount);
    if (!val || val <= 0) {
      showToast('Mohon masukkan nominal yang valid.');
      return;
    }
    if (val > activeCard.balance) {
      showToast(`Nominal melebihi saldo sumber dana (${formatMoney(activeCard.balance)}).`);
      return;
    }

    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      cardId: activeCard.id,
      name: modalRecipient || 'Transfer Pembayaran',
      date: 'Hari Ini',
      amount: -val,
      type: 'expense',
      status: 'Selesai',
      logoType: selectedContact ? 'avatar' : 'cnx',
      avatarUrl: selectedContact?.avatar,
      logoColor: 'bg-blue-600',
      logoLetter: modalRecipient.substring(0, 2).toUpperCase()
    };

    setTransactions([newTx, ...transactions]);
    setSpendingCurrent(prev => prev + val);
    setTodayExpensesAdded(prev => prev + val);
    setCards(prevCards =>
      prevCards.map(c => (c.id === activeCard.id ? { ...c, balance: Math.max(0, c.balance - val) } : c))
    );
    setShowSendModal(false);
    setModalAmount('');
    setModalRecipient('');
    setSelectedContact(null);
    showToast(`Berhasil mengirim ${formatMoney(val)} ke ${modalRecipient || 'Penerima'}.`);
  };

  const handleProcessTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCard.isLocked) {
      setCardLockedNoticeModal(true);
      return;
    }
    const val = parseRupiahInput(modalAmount);
    if (!val || val <= 0) {
      showToast('Mohon masukkan jumlah isi saldo yang valid.');
      return;
    }

    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      cardId: activeCard.id,
      name: `Isi Saldo via ${topUpSource}`,
      date: 'Hari Ini',
      amount: val,
      type: 'income',
      status: 'Selesai',
      logoType: 'td',
      logoColor: 'bg-emerald-600',
      logoLetter: 'IS'
    };

    setTransactions([newTx, ...transactions]);
    setTodayIncomeAdded(prev => prev + val);
    setCards(prevCards =>
      prevCards.map(c => (c.id === activeCard.id ? { ...c, balance: c.balance + val } : c))
    );
    setShowTopUpModal(false);
    setModalAmount('');
    showToast(`Berhasil mengisi saldo ${formatMoney(val)}.`);
  };

  const handleProcessTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCard.isLocked) {
      setCardLockedNoticeModal(true);
      return;
    }
    if (cardBudgetEnabled[activeCard.id]) {
      setShowBudgetLockedNotice(true);
      return;
    }
    const val = parseRupiahInput(transferAmount);
    if (!val || val <= 0) {
      showToast('Mohon masukkan nominal transfer yang valid.');
      return;
    }
    if (val > activeCard.balance) {
      showToast(`Saldo kartu tidak mencukupi (${formatMoney(activeCard.balance)}).`);
      return;
    }

    const targetCard = cards.find(c => c.id === transferTargetCardId);
    if (!targetCard) {
      showToast('Silakan pilih rekening kartu tujuan transfer.');
      return;
    }
    const targetName = targetCard.type;

    // Kurangi saldo kartu aktif dan tambahkan ke kartu tujuan
    setCards(prevCards =>
      prevCards.map(c => {
        if (c.id === activeCard.id) {
          return { ...c, balance: Math.max(0, c.balance - val) };
        }
        if (c.id === targetCard.id) {
          return { ...c, balance: c.balance + val };
        }
        return c;
      })
    );

    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      cardId: activeCard.id,
      name: `Transfer ke ${targetName}`,
      date: 'Hari Ini',
      amount: -val,
      type: 'expense',
      status: 'Selesai',
      logoType: 'cnx',
      logoColor: 'bg-indigo-600',
      logoLetter: 'TF'
    };

    setTransactions(prev => [newTx, ...prev]);
    setSpendingCurrent(prev => prev + val);
    setTodayExpensesAdded(prev => prev + val);
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferSearchQuery('');
    setTransferTargetCardId('');
    setIsTransferDropdownOpen(false);
    showToast(`Transfer sebesar ${formatMoney(val)} ke ${targetName} berhasil diproses.`);
  };

  const handleProcessReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    const val = parseRupiahInput(receiveAmount);
    if (!val || val <= 0) {
      showToast('Mohon masukkan nominal penerimaan yang valid.');
      return;
    }
    if (!receiveSender.trim()) {
      showToast('Mohon masukkan nama pengirim.');
      return;
    }

    const senderName = receiveSender.trim();
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      cardId: activeCard.id,
      name: `Penerimaan dari ${senderName}${receiveNotes.trim() ? ` (${receiveNotes.trim()})` : ''}`,
      date: 'Hari Ini',
      amount: val,
      type: 'income',
      status: 'Selesai',
      logoType: 'td',
      logoColor: 'bg-emerald-600',
      logoLetter: senderName.substring(0, 2).toUpperCase()
    };

    setTransactions(prev => [newTx, ...prev]);
    setTodayIncomeAdded(prev => prev + val);

    const newBal = activeCard.balance + val;
    setCards(prevCards =>
      prevCards.map(c => (c.id === activeCard.id ? { ...c, balance: newBal } : c))
    );

    // Recalculate percentage budgets for new increased balance
    setCardBudgets(prev => prev.map(b => {
      if (b.cardId === activeCard.id && b.allocationType === 'percentage') {
        return {
          ...b,
          amount: Math.round((newBal * b.percentage) / 100)
        };
      }
      return b;
    }));

    setShowReceiveModal(false);
    setReceiveAmount('');
    setReceiveSender('');
    setReceiveNotes('');
    showToast(`Berhasil menerima dana ${formatMoney(val)} ke ${activeCard.type}.`);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseRupiahInput(newGoalTarget);
    if (!newGoalTitle.trim() || !targetVal) return;

    const newG: GoalItem = {
      id: `g-${Date.now()}`,
      title: newGoalTitle.trim(),
      current: 0,
      target: targetVal,
      timeLeft: newGoalDuration.trim() || 'Sisa waktu 12 bulan',
      type: newGoalCategory,
      icon: 'reserve'
    };

    setGoals([...goals, newG]);
    setShowAddGoalModal(false);
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalDuration('');
  };

  // Transactions filtered by active card and search query
  const currentCardTransactions = useMemo(() => {
    return transactions.filter(t => !t.cardId || t.cardId === activeCard.id);
  }, [transactions, activeCard.id]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return currentCardTransactions;
    const q = searchQuery.toLowerCase();
    return currentCardTransactions.filter(t => t.name.toLowerCase().includes(q) || t.status.toLowerCase().includes(q));
  }, [currentCardTransactions, searchQuery]);

  // Seamless circular carousel track items:
  // Shows previous card (for reverse animation), active card, and next card
  const trackItems = useMemo(() => {
    if (cards.length === 0) return [];
    if (cards.length === 1) {
      return [
        {
          card: cards[0],
          scale: 1,
          opacity: 1,
          isClickable: false,
          key: `single-${cards[0].id}`
        }
      ];
    }

    const prevCard = cards[(safeIndex - 1 + cards.length) % cards.length];
    const currentCard = cards[safeIndex];
    const nextCard = cards[(safeIndex + 1) % cards.length];

    // Scale and opacity states:
    // Resting: Slot 0 = 0.88/0.55, Slot 1 = 1.0/1.0, Slot 2 = 0.88/0.55
    // Slide next: Slot 1 shrinks to 0.88/0.55, Slot 2 enlarges to 1.0/1.0
    // Slide prev: Slot 0 enlarges to 1.0/1.0, Slot 1 shrinks to 0.88/0.55
    const slot0Scale = slideDirection === 'prev' ? 1 : 0.88;
    const slot0Opacity = slideDirection === 'prev' ? 1 : 0.55;

    const slot1Scale = slideDirection ? 0.88 : 1;
    const slot1Opacity = slideDirection ? 0.55 : 1;

    const slot2Scale = slideDirection === 'next' ? 1 : 0.88;
    const slot2Opacity = slideDirection === 'next' ? 1 : 0.55;

    return [
      {
        card: prevCard,
        scale: slot0Scale,
        opacity: slot0Opacity,
        isClickable: false,
        key: `slot-0-${prevCard.id}`
      },
      {
        card: currentCard,
        scale: slot1Scale,
        opacity: slot1Opacity,
        isClickable: false,
        key: `slot-1-${currentCard.id}`
      },
      {
        card: nextCard,
        scale: slot2Scale,
        opacity: slot2Opacity,
        isClickable: slideDirection === null,
        onClick: handleNextCard,
        key: `slot-2-${nextCard.id}`
      }
    ];
  }, [cards, safeIndex, slideDirection]);

  // Clean, solid, no-overshoot card view renderer
  const renderCardView = (
    card: WalletCard,
    scale: number,
    opacity: number,
    isClickable: boolean,
    onClickHandler?: () => void,
    key?: string
  ) => {
    return (
      <div
        key={key}
        onClick={isClickable ? onClickHandler : undefined}
        style={{
          width: '82%',
          flexShrink: 0,
          transform: `scale(${scale})`,
          opacity: opacity,
          transformOrigin: 'left center',
          transition: slideDirection
            ? 'transform 280ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 280ms cubic-bezier(0.25, 0.1, 0.25, 1)'
            : 'none'
        }}
        className={`relative select-none overflow-hidden rounded-2xl p-4 sm:p-5 text-white origin-left ${
          isClickable ? 'cursor-pointer hover:brightness-105 active:scale-[0.87]' : ''
        } border border-white/25 shadow-md shadow-slate-900/15 will-change-[transform,opacity]`}
      >
        {/* Background Satin Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${card.gradient}`} />

        <div className="relative z-10 flex flex-col justify-between h-36 sm:h-40">
          {/* Top row: Lock Badge & Anggaran Aktif Badge & Cardholder Name (Kanan Atas) */}
          <div className="flex items-center justify-between min-h-[22px] gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {card.isLocked && (
                <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              )}
              {cardBudgetEnabled[card.id] && !card.isLocked && (
                <span className="inline-flex items-center justify-center bg-amber-500/90 text-white w-5 h-5 rounded-full shadow-xs backdrop-blur-xs" title="Anggaran Aktif (Transfer manual dikunci)">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <span
              className="text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0 truncate max-w-[160px] sm:max-w-[200px] drop-shadow-xs"
              title={card.holder}
            >
              {card.holder}
            </span>
          </div>

          {/* EMV Microchip Graphic */}
          <div className="w-8 h-5 sm:w-10 sm:h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-1 border border-amber-400/50 shadow-inner flex flex-col justify-between">
            <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
            <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
          </div>

          {/* Nominal Saldo Kartu & Nama Rekening */}
          <div className="space-y-0.5">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-blue-200/90 block">
              Saldo Kartu
            </span>
            <div className="text-base sm:text-xl font-black font-mono tracking-tight text-white drop-shadow-xs truncate">
              {formatMoney(card.balance)}
            </div>
            <div
              className="text-[11px] sm:text-xs font-semibold text-white/90 truncate tracking-wide drop-shadow-xs"
              title={card.type}
            >
              {card.type}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full text-slate-800 font-sans antialiased select-none pb-8">
      {/* MAIN BENTO GRID: Left Main Content (8 cols) + Right Card Column (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* ==================== LEFT MAIN AREA (8 COLS) ==================== */}
          <div className="xl:col-span-8 space-y-6">

            {/* ROW 1: Balance overview Chart Card + 3 Stacked Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Balance Overview Card (lg:col-span-8) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
                {/* Top Row: Saldo Utama Pesantren & Pengaturan Mode Diagram di Kanan Atas */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      {formatMoney(cards.reduce((sum, c) => sum + c.balance, 0))}
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Ringkasan Saldo
                    </p>
                  </div>

                  {/* Pengaturan Mode Diagram (Pindah ke Kanan Atas) */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveChartMode('bar')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        activeChartMode === 'bar'
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Tampilan Grafik Batang"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChartMode('line')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        activeChartMode === 'line'
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Tampilan Grafik Garis"
                    >
                      <LineChart className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-baris di bawah ringkasan saldo: Rentang Hari (Kiri) dan Keterangan Pemasukan/Pengeluaran (Kanan) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                  {/* Kiri: Pengaturan rentang hari */}
                  <div className="relative">
                    <select
                      value={chartTimeframe}
                      onChange={e => setChartTimeframe(e.target.value)}
                      className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 pr-7 hover:bg-slate-100 focus:outline-none cursor-pointer leading-tight transition-colors shadow-2xs"
                    >
                      <option value="7h">7 Hari</option>
                      <option value="30h">30 Hari</option>
                      <option value="90h">90 Hari</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Kanan: Keterangan pemasukan & pengeluaran */}
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      <span>Pemasukan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                      <span>Pengeluaran</span>
                    </div>
                  </div>
                </div>

                {/* Modern Grouped/Stacked Bar Chart Container */}
                <div className="relative pt-4 pb-1">
                  {/* Grid Lines & Dynamic Y-Axis labels (Tepat sejajar dengan batas atas dan bawah area batang) */}
                  <div
                    style={{ top: '12px', height: '136px' }}
                    className="absolute left-0 right-0 pointer-events-none flex flex-col justify-between text-[10px] font-medium text-slate-400 z-0 pr-1"
                  >
                    {ticks.map((tickVal, idx) => (
                      <div key={idx} className="relative w-full flex items-center">
                        <span className="w-8 shrink-0 text-left select-none text-slate-400 font-semibold text-[10px]">
                          {formatTickLabel(tickVal)}
                        </span>
                        <div className="flex-1 border-b border-slate-100" />
                      </div>
                    ))}
                  </div>

                  {/* 7 Columns for last 7 days ending with today's bar */}
                  <div
                    onMouseLeave={() => setHoveredDay(null)}
                    className="relative h-44 flex items-end justify-between pl-10 pr-2 pt-2 z-10"
                  >
                    {chartDays.map((item, index) => {
                      const isHovered = hoveredDay === item.id;
                      const isLastBar = index >= chartDays.length - 2;

                      // 1. Tinggi batang proporsional aktual terhadap skala sumbu Y dinamis
                      // Tinggi area batang di dalam pill track adalah 136px (144px minus padding 8px)
                      const maxAvailableHeight = 136;
                      const totalBarHeight = Math.min(
                        maxAvailableHeight,
                        Math.max(item.closingBalance > 0 ? 6 : 0, Math.round((item.closingBalance / maxScale) * maxAvailableHeight))
                      );

                      // 2. Pembagian batang menjadi HANYA 2 warna berimbang berdasarkan persentase pemasukan dan pengeluaran
                      const totalFlow = item.income + item.expenses;
                      const pctIncome = totalFlow > 0 ? item.income / totalFlow : 0.5;
                      const pctExpenses = totalFlow > 0 ? item.expenses / totalFlow : 0.5;

                      let incomeHeight = Math.round(totalBarHeight * pctIncome);
                      let expensesHeight = totalBarHeight - incomeHeight;

                      // Pastikan segmen non-nol tampak jelas (minimal 4px bila ada nilainya)
                      if (item.income > 0 && incomeHeight < 4) {
                        incomeHeight = 4;
                        expensesHeight = Math.max(0, totalBarHeight - incomeHeight);
                      }
                      if (item.expenses > 0 && expensesHeight < 4) {
                        expensesHeight = 4;
                        incomeHeight = Math.max(0, totalBarHeight - expensesHeight);
                      }

                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHoveredDay(item.id)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className="flex flex-col items-center gap-2 group cursor-pointer relative"
                        >
                          {/* Background Pill Track */}
                          <div className="w-10 sm:w-12 h-36 bg-slate-100/60 group-hover:bg-slate-100 rounded-xl flex flex-col justify-end p-1 transition-colors relative overflow-visible">
                            {item.hasData ? (
                              /* Stacked 2-Color Bar: total height is determined by saldo akhir, divided into income & expense */
                              <div
                                style={{ height: `${totalBarHeight}px` }}
                                className="w-full relative flex flex-col justify-end items-center gap-0.5"
                              >
                                {/* Income segment (Emerald) */}
                                {item.income > 0 && (
                                  <div
                                    style={{ height: `${incomeHeight}px` }}
                                    className={`w-full ${
                                      item.expenses > 0 ? 'rounded-t-md' : 'rounded-md'
                                    } transition-all ${
                                      isHovered ? 'bg-emerald-500 shadow-xs' : 'bg-emerald-400/90'
                                    }`}
                                    title={`Pemasukan: ${formatMoney(item.income)}`}
                                  />
                                )}

                                {/* Expense segment (Amber) */}
                                {item.expenses > 0 && (
                                  <div
                                    style={{ height: `${expensesHeight}px` }}
                                    className={`w-full ${
                                      item.income > 0 ? 'rounded-b-md' : 'rounded-md'
                                    } transition-all ${
                                      isHovered ? 'bg-amber-500 shadow-xs' : 'bg-amber-400/90'
                                    }`}
                                    title={`Pengeluaran: ${formatMoney(item.expenses)}`}
                                  />
                                )}

                                {/* Floating Tooltip: HANYA KELUAR SAAT DI-HOVER */}
                                {isHovered && (
                                  <div
                                    className={`absolute top-0 z-50 bg-white border border-slate-200/95 shadow-xl rounded-xl p-3 w-48 text-left pointer-events-none transition-all duration-150 ${
                                      isLastBar
                                        ? 'right-full mr-2 sm:mr-2.5'
                                        : 'left-full ml-2 sm:ml-2.5'
                                    }`}
                                  >
                                    <div className="text-[10px] font-bold text-slate-500 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                                      <span>{item.fullDay}</span>
                                    </div>

                                    {/* Informasi Saldo */}
                                    <div className="py-1.5 border-b border-slate-100 flex items-center justify-between">
                                      <span className="text-[11px] font-medium text-slate-500">Saldo</span>
                                      <span className="text-xs font-bold text-slate-900 tracking-tight">{formatMoney(item.closingBalance)}</span>
                                    </div>

                                    {/* Rincian Pemasukan & Pengeluaran tanpa persentase */}
                                    <div className="space-y-1.5 pt-2 text-[11px] font-semibold">
                                      <div className="flex items-center justify-between text-slate-700">
                                        <span className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                          Pemasukan
                                        </span>
                                        <span className="font-bold text-slate-800">{formatMoney(item.income)}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-slate-700">
                                        <span className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                          Pengeluaran
                                        </span>
                                        <span className="font-bold text-slate-800">{formatMoney(item.expenses)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Batang Kosong jika belum ada / tidak ada data */
                              <div className="w-full h-full relative flex flex-col justify-end items-center pb-1">
                                <div className="w-6 h-1 rounded-full bg-slate-200" title="Belum ada transaksi" />

                                {/* Floating Tooltip for empty bar */}
                                {isHovered && (
                                  <div
                                    className={`absolute bottom-0 z-50 bg-white border border-slate-200/90 shadow-xl rounded-xl p-3 w-48 text-left pointer-events-none transition-all duration-150 ${
                                      isLastBar
                                        ? 'right-full mr-2 sm:mr-2.5'
                                        : 'left-full ml-2 sm:ml-2.5'
                                    }`}
                                  >
                                    <div className="text-[10px] font-bold text-slate-500 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                                      <span>{item.fullDay}</span>
                                    </div>
                                    <div className="py-1">
                                      <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        Belum ada data transaksi
                                      </span>
                                    </div>
                                    <div className="py-1.5 border-b border-slate-100 flex items-center justify-between">
                                      <span className="text-[11px] font-medium text-slate-400">Saldo</span>
                                      <span className="text-xs font-bold text-slate-500 tracking-tight">{formatMoney(0)}</span>
                                    </div>
                                    <div className="space-y-1.5 pt-1.5 text-[11px] font-semibold text-slate-400">
                                      <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                                          Pemasukan
                                        </span>
                                        <span className="font-bold text-slate-500">{formatMoney(0)}</span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                                          Pengeluaran
                                        </span>
                                        <span className="font-bold text-slate-500">{formatMoney(0)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Day Label */}
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-xs font-semibold ${
                                isHovered || item.isToday ? 'text-blue-600 font-bold' : 'text-slate-400'
                              }`}
                            >
                              {item.day}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3 Stacked Stat Metrics (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-3.5">
                
                {/* Total income */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400">Total Pemasukan</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatMoney(15000000)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>5.1% dari bulan lalu</span>
                  </div>
                </div>

                {/* Total expences */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400">Total Pengeluaran</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatMoney(6700000)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>15.5% dari bulan lalu</span>
                  </div>
                </div>

                {/* Saved balance */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-400">Saldo Tersimpan</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatMoney(8300000)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>20.7% dari bulan lalu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Monthly spending limit & Quick Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Monthly spending limit */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Batas Pengeluaran Bulanan</h3>
                    <p className="text-xs text-slate-400 font-medium">Akun operasional & pengeluaran</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditLimitModal(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="my-4">
                  {/* Thick capsule progress bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (spendingCurrent / spendingLimit) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-lime-400 via-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>{formatMoney(spendingCurrent)}</span>
                  <span className="text-slate-400">{formatMoney(spendingLimit)}</span>
                </div>
              </div>

              {/* Optimize your budget with these quick tips */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between gap-4 overflow-hidden relative">
                <div className="space-y-1.5 max-w-[62%]">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    Optimalkan anggaran dengan tips cepat
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Siapkan cadangan operasional dengan menyisihkan 10–15% untuk dana tak terduga.
                  </p>
                  <button
                    type="button"
                    onClick={() => alert('Tips Keuangan: Alokasikan 10-15% dari pendapatan bulanan ke rekening dana cadangan kas untuk fleksibilitas operasional.')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 pt-1 cursor-pointer"
                  >
                    <span>Baca selengkapnya</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Decorative Geometric Mosaic Pattern on Right */}
                <div className="grid grid-cols-3 gap-1.5 p-1 shrink-0">
                  <div className="w-4 h-4 rounded-md bg-lime-300/80" />
                  <div className="w-4 h-4 rounded-md bg-emerald-400/90" />
                  <div className="w-4 h-4 rounded-md bg-emerald-500" />
                  <div className="w-4 h-4 rounded-md bg-emerald-400" />
                  <div className="w-4 h-4 rounded-md bg-blue-500" />
                  <div className="w-4 h-4 rounded-md bg-indigo-500" />
                  <div className="w-4 h-4 rounded-md bg-lime-400" />
                  <div className="w-4 h-4 rounded-md bg-teal-400" />
                  <div className="w-4 h-4 rounded-md bg-blue-600" />
                </div>
              </div>
            </div>

            {/* ROW 3: Cost analysis, Financial health, Goal tracker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Card 1: Cost analysis */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Analisis Biaya</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Rincian pengeluaran</p>
                    </div>
                    <div className="relative">
                      <select
                        value={costMonth}
                        onChange={e => setCostMonth(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-700 pr-5 cursor-pointer"
                      >
                        <option value="Januari">Januari</option>
                        <option value="Februari">Februari</option>
                        <option value="Maret">Maret</option>
                      </select>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="text-2xl font-black text-slate-900 mt-3">
                    {formatMoney(8450000)}
                  </div>

                  {/* Multi-segmented progress bar */}
                  <div className="flex items-center gap-1 h-2.5 w-full my-3.5">
                    <div style={{ width: '18%' }} className="h-full rounded-sm bg-amber-500" title="Sarana & Asrama: 18%" />
                    <div style={{ width: '7%' }} className="h-full rounded-sm bg-yellow-500" title="Kewajiban / Cicilan: 7%" />
                    <div style={{ width: '6%' }} className="h-full rounded-sm bg-amber-400" title="Konsumsi Dapur: 6%" />
                    <div style={{ width: '9%' }} className="h-full rounded-sm bg-lime-400" title="Transportasi: 9%" />
                    <div style={{ width: '10%' }} className="h-full rounded-sm bg-emerald-500" title="Kesehatan Santri: 10%" />
                    <div style={{ width: '17%' }} className="h-full rounded-sm bg-blue-600" title="Pengembangan Fasilitas: 17%" />
                    <div style={{ width: '33%' }} className="h-full rounded-sm bg-slate-300" title="Operasional Lainnya: 33%" />
                  </div>
                </div>

                {/* Category Percentages List */}
                <div className="space-y-1.5 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-amber-500" /> Sarana & Asrama</span>
                    <span className="font-bold text-slate-800">18%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-yellow-500" /> Kewajiban / Cicilan</span>
                    <span className="font-bold text-slate-800">7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-amber-400" /> Konsumsi Dapur</span>
                    <span className="font-bold text-slate-800">6%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-lime-400" /> Transportasi</span>
                    <span className="font-bold text-slate-800">9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-emerald-500" /> Kesehatan Santri</span>
                    <span className="font-bold text-slate-800">10%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-blue-600" /> Fasilitas & Aset</span>
                    <span className="font-bold text-slate-800">17%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-slate-300" /> Operasional Lainnya</span>
                    <span className="font-bold text-slate-800">33%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Financial health */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col justify-between text-center">
                <div>
                  <div className="flex items-start justify-between text-left">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Kesehatan Finansial</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Status saat ini</p>
                    </div>
                    <div className="relative">
                      <select
                        value={healthTimeframe}
                        onChange={e => setHealthTimeframe(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-700 pr-5 cursor-pointer"
                      >
                        <option value="30h">30 Hari</option>
                        <option value="90h">90 Hari</option>
                      </select>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="text-left mt-3">
                    <div className="text-2xl font-black text-slate-900">{formatMoney(15780000)}</div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>17.5% dari bulan lalu</span>
                    </div>
                  </div>
                </div>

                {/* Semicircle Gauge (75% Dari pemasukan berhasil disimpan) */}
                <div className="relative flex flex-col items-center justify-center my-3">
                  <svg className="w-36 h-20 overflow-visible" viewBox="0 0 100 50">
                    {/* Background Arc */}
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    {/* Filled Arc (75% = 135 degrees out of 180) */}
                    <path
                      d="M 10 50 A 40 40 0 0 1 78.28 21.72"
                      fill="none"
                      stroke="url(#healthGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#84cc16" />
                        <stop offset="50%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute bottom-0 text-center">
                    <div className="text-2xl font-black text-slate-900 leading-tight">75%</div>
                    <div className="text-[10px] text-slate-400 font-bold">Dari pemasukan tersimpan</div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 text-left font-medium leading-tight pt-2 border-t border-slate-100">
                  Berdasarkan agregasi metrik transaksi selama 30 hari terakhir
                </p>
              </div>

              {/* Card 3: Goal tracker */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-xs font-bold text-slate-900">Target Tabungan</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddGoalModal(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Tambah target</span>
                    </button>
                  </div>

                  {/* Section: This year */}
                  <div className="space-y-2 mt-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Ini</div>
                    {goals.filter(g => g.type === 'this_year').map(g => (
                      <div key={g.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center text-xs">🛡️</span>
                            {g.title}
                          </span>
                          <span>{formatMoney(g.current)} / {formatMoney(g.target)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (g.current / g.target) * 100)}%` }}
                            className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full"
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{g.timeLeft}</div>
                      </div>
                    ))}
                  </div>

                  {/* Section: Long term */}
                  <div className="space-y-2 mt-3 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jangka Panjang</div>
                    {goals.filter(g => g.type === 'long_term').map(g => (
                      <div key={g.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                              {g.icon === 'travel' ? '✈️' : g.icon === 'car' ? '🚗' : '🏢'}
                            </span>
                            {g.title}
                          </span>
                          <span>{formatMoney(g.current)} / {formatMoney(g.target)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (g.current / g.target) * 100)}%` }}
                            className={`h-full rounded-full ${g.icon === 'travel' ? 'bg-amber-400' : g.icon === 'car' ? 'bg-blue-500' : 'bg-indigo-600'}`}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{g.timeLeft}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== RIGHT COLUMN (4 COLS): Card, Quick Actions, Contacts, Transactions ==================== */}
          <div className="xl:col-span-4 space-y-6">

            {/* My Card Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs relative overflow-hidden">
              {/* SLIDE-UP TRANSACTION HISTORY OVERLAY (MENUTUP KARTU KE ATAS) */}
              <div
                className={`absolute inset-0 z-30 bg-white p-5 flex flex-col transition-all duration-300 ease-in-out ${
                  isTxExpandedUpwards
                    ? 'translate-y-0 opacity-100 pointer-events-auto shadow-2xl'
                    : 'translate-y-full opacity-0 pointer-events-none'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Riwayat Transaksi</h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {activeCard.brand} • {activeCard.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={txTimeframe}
                        onChange={e => setTxTimeframe(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 pr-5 cursor-pointer"
                      >
                        <option value="7h">7 Hari</option>
                        <option value="30h">30 Hari</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTxExpandedUpwards(false)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      title="Tutup riwayat dan tampilkan kartu kembali"
                    >
                      <ChevronDown className="w-4 h-4" />
                      <span>Tutup</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="py-2.5 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari transaksi pada kartu ini..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Table Header */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-100 shrink-0">
                  <span>Transaksi</span>
                  <span>Nominal</span>
                </div>

                {/* Scrollable Transaction List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-0.5 mt-1 min-h-0">
                  {filteredTransactions.map(tx => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 rounded-xl px-1.5 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {tx.logoType === 'avatar' && tx.avatarUrl ? (
                          <img src={tx.avatarUrl} alt={tx.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full ${tx.logoColor || 'bg-slate-800'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                            {tx.logoLetter || tx.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-bold text-slate-900 truncate">{tx.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{tx.date}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <div className={`text-xs font-bold ${tx.amount < 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                          {formatMoney(tx.amount)}
                        </div>
                        <div className={`text-[10px] font-semibold ${
                          tx.status === 'Selesai' ? 'text-emerald-600' : tx.status === 'Ditolak' ? 'text-rose-500' : 'text-amber-500'
                        }`}>
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium">
                      Belum ada riwayat transaksi pada {activeCard.type}.
                    </div>
                  )}
                </div>

                {/* Bottom Footer inside Expanded View */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold shrink-0">
                  <span>{filteredTransactions.length} transaksi ditampilkan</span>
                  <button
                    type="button"
                    onClick={() => setIsTxExpandedUpwards(false)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                  >
                    <span>Tutup & Tampilkan Kartu</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Rekening</h2>
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-full">
                    {cards.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddCard}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Card Carousel (Bidirectional, scale & opacity transitions, no overshoot) */}
              <div className="relative w-full overflow-hidden py-1">
                <div
                  onTransitionEnd={handleTransitionEnd}
                  style={{
                    transform:
                      cards.length <= 1
                        ? 'translateX(0%)'
                        : slideDirection === 'next'
                        ? 'translateX(-170%)'
                        : slideDirection === 'prev'
                        ? 'translateX(0%)'
                        : 'translateX(-85%)',
                    transition: slideDirection
                      ? 'transform 280ms cubic-bezier(0.25, 0.1, 0.25, 1)'
                      : 'none',
                    gap: '3%'
                  }}
                  className="flex items-center will-change-transform"
                >
                  {trackItems.map((item) =>
                    renderCardView(
                      item.card,
                      item.scale,
                      item.opacity,
                      item.isClickable,
                      item.onClick,
                      item.key
                    )
                  )}
                </div>
              </div>

              {/* Navigation below card on the left side, and View All button on the right (sejajar navigasi kartu) */}
              <div className="flex items-center justify-between mt-3 px-0.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevCard}
                    disabled={cards.length <= 1 || slideDirection !== null}
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-xs hover:border-slate-300"
                    title="Kartu Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextCard}
                    disabled={cards.length <= 1 || slideDirection !== null}
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-xs hover:border-slate-300"
                    title="Kartu Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Tombol View All sejajar navigasi kartu */}
                <button
                  type="button"
                  onClick={() => setShowViewAllModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-700 border border-blue-100 transition-all cursor-pointer shadow-2xs"
                  title="Lihat semua kartu pesantren"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>View All</span>
                </button>
              </div>

              {/* TOMBOL AKSI KARTU: Kirim, Transfer, Terima, Edit, Hapus */}
              <div className="grid grid-cols-5 gap-2 text-center mt-3.5 pt-3 border-t border-slate-100">
                {/* 1. Kirim */}
                <button
                  type="button"
                  disabled={isBudgetActive}
                  onClick={() => {
                    if (isBudgetActive) return;
                    if (activeCard.isLocked) {
                      setCardLockedNoticeModal(true);
                      return;
                    }
                    setSelectedContact(null);
                    setModalRecipient('');
                    setShowSendModal(true);
                  }}
                  className={`flex flex-col items-center gap-1.5 group transition-all ${
                    isBudgetActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={isBudgetActive ? 'Kirim dinonaktifkan saat Anggarkan Dana aktif' : 'Kirim Uang'}
                >
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-2xs ${
                      isBudgetActive
                        ? 'bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-semibold ${isBudgetActive ? 'text-slate-400' : 'text-slate-600 group-hover:text-blue-600'}`}>
                    Kirim
                  </span>
                </button>

                {/* 2. Transfer */}
                <button
                  type="button"
                  disabled={isBudgetActive}
                  onClick={() => {
                    if (isBudgetActive) return;
                    if (activeCard.isLocked) {
                      setCardLockedNoticeModal(true);
                      return;
                    }
                    setTransferTargetCardId('');
                    setTransferSearchQuery('');
                    setIsTransferDropdownOpen(false);
                    setTransferAmount('');
                    setTransferNotes('');
                    setShowTransferModal(true);
                  }}
                  className={`flex flex-col items-center gap-1.5 group transition-all ${
                    isBudgetActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={isBudgetActive ? 'Transfer dinonaktifkan saat Anggarkan Dana aktif' : 'Transfer Antar Rekening / Kartu'}
                >
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-2xs ${
                      isBudgetActive
                        ? 'bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 -rotate-45" />
                  </div>
                  <span className={`text-[11px] font-semibold ${isBudgetActive ? 'text-slate-400' : 'text-slate-600 group-hover:text-blue-600'}`}>
                    Transfer
                  </span>
                </button>

                {/* 3. Terima */}
                <button
                  type="button"
                  disabled={isBudgetActive}
                  onClick={() => {
                    if (isBudgetActive) return;
                    setShowReceiveModal(true);
                  }}
                  className={`flex flex-col items-center gap-1.5 group transition-all ${
                    isBudgetActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={isBudgetActive ? 'Terima dana dinonaktifkan saat Anggarkan Dana aktif' : 'Terima Dana / QRIS'}
                >
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-2xs ${
                      isBudgetActive
                        ? 'bg-slate-100 border-slate-200 text-slate-400'
                        : 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-semibold ${isBudgetActive ? 'text-slate-400' : 'text-slate-600 group-hover:text-blue-600'}`}>
                    Terima
                  </span>
                </button>

                {/* 4. Edit */}
                <button
                  type="button"
                  onClick={handleOpenEditCard}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  title="Edit Data Kartu"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 flex items-center justify-center transition-all shadow-2xs">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600">
                    Edit
                  </span>
                </button>

                {/* 5. Hapus */}
                <button
                  type="button"
                  onClick={handleOpenDeleteCard}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  title="Hapus Kartu Ini"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 flex items-center justify-center transition-all shadow-2xs">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600">
                    Hapus
                  </span>
                </button>
              </div>

              {/* ================================================================= */}
              {/* MODUL ANGGARKAN DANA (PENGGANTI TRANSFER CEPAT) */}
              {/* ================================================================= */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                {/* Header with Toggle Switch & Info Tooltip */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900">Anggarkan Dana</h3>
                    {/* Tooltip info kecil */}
                    <div className="relative group cursor-pointer" tabIndex={0} aria-label="Informasi Anggaran Dana">
                      <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600 transition-colors" />
                      <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block group-focus:block z-30 w-56 p-2 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg pointer-events-none leading-snug">
                        Transfer manual dinonaktifkan saat saldo dianggarkan.
                        <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900" />
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${isBudgetActive ? 'text-blue-600' : 'text-slate-400'}`}>
                      {isBudgetActive ? 'ON' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleBudgetMode}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isBudgetActive ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                      role="switch"
                      aria-checked={isBudgetActive}
                      title={isBudgetActive ? 'Matikan Anggarkan Dana (Buka kunci transfer manual)' : 'Aktifkan Anggarkan Dana (Kunci transfer manual)'}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isBudgetActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Content based on Toggle State */}
                {isBudgetActive && (
                  <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                    {/* 1. Daftar Anggaran Yang Dibuat (Tampilan Per Item dengan Tombol V Meluas ke Bawah) */}
                    {activeCardBudgets.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                          {activeCardBudgets.map(item => {
                            const isUnfulfilled = item.isInsufficient;
                            const isExpanded = !!expandedBudgetIds[item.id];

                            return (
                              <div
                                key={item.id}
                                className={`transition-colors ${
                                  isUnfulfilled ? 'bg-rose-50/70' : 'bg-white'
                                }`}
                              >
                                {/* Header Tiap Item: Nama di Kiri, Tombol v di Kanan */}
                                <div
                                  onClick={() => toggleExpandBudget(item.id)}
                                  className={`flex items-center justify-between py-2.5 px-3 text-xs cursor-pointer select-none transition-colors ${
                                    isUnfulfilled
                                      ? 'hover:bg-rose-100/60 text-rose-950'
                                      : 'hover:bg-slate-50/80 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate pr-2">
                                    <span
                                      className={`font-semibold truncate ${
                                        isUnfulfilled ? 'text-rose-900' : 'text-slate-800'
                                      }`}
                                      title={item.name}
                                    >
                                      {item.name}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpandBudget(item.id);
                                    }}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                      isUnfulfilled
                                        ? 'text-rose-400 hover:text-rose-700 hover:bg-rose-100/80'
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title={isExpanded ? 'Tutup rincian' : 'Buka rincian'}
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180 text-blue-600' : ''
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Detail Dua Baris (Buka Meluas ke Bawah) */}
                                {isExpanded && (
                                  <div
                                    className={`px-3 pb-3 pt-2 border-t space-y-2.5 animate-in fade-in duration-150 text-xs ${
                                      isUnfulfilled
                                        ? 'bg-rose-50/50 border-rose-100/90'
                                        : 'bg-slate-50/80 border-slate-100'
                                    }`}
                                  >
                                    {/* Baris 1: Kiri Anggaran (Persen atau Nominal) | Kanan Proyeksi Jumlah (plus Keterangan jika belum terpenuhi) */}
                                    <div className="flex items-start justify-between gap-2 pt-0.5">
                                      {/* Baris Kiri: Anggaran (Persen atau Nominal) */}
                                      <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                          Anggaran
                                        </span>
                                        <span className="font-bold text-slate-800 mt-0.5">
                                          {item.allocationType === 'amount'
                                            ? formatMoney(item.amount)
                                            : `${item.percentage}%`}
                                        </span>
                                      </div>

                                      {/* Baris Kanan: Proyeksi Jumlah & Keterangan bila belum terpenuhi */}
                                      <div className="flex flex-col items-end text-right">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                          Proyeksi Jumlah
                                        </span>
                                        <span
                                          className={`font-bold font-mono mt-0.5 ${
                                            isUnfulfilled ? 'text-rose-700' : 'text-slate-900'
                                          }`}
                                        >
                                          {formatMoney(item.amount)}
                                        </span>
                                        {isUnfulfilled && (
                                          <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
                                            tidak cukup
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Baris 2: Tombol Sesuaikan dan Hapus (Hanya Icon) */}
                                    <div
                                      className={`flex items-center justify-end gap-1.5 pt-2 border-t ${
                                        isUnfulfilled ? 'border-rose-200/60' : 'border-slate-200/70'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditBudget(item);
                                        }}
                                        className="w-7 h-7 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                        title="Sesuaikan anggaran ini"
                                        aria-label="Sesuaikan"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteBudget(item.id);
                                        }}
                                        className="w-7 h-7 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                                        title="Hapus pos anggaran ini"
                                        aria-label="Hapus"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Tombol Selebar Kontainer: Buat Anggaran (di bawah daftar anggaran dan di atas salurkan dana) */}
                    <button
                      type="button"
                      disabled={isAddBudgetDisabled}
                      onClick={handleOpenAddBudget}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isAddBudgetDisabled
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 shadow-2xs cursor-pointer'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Anggaran</span>
                    </button>

                    {/* 3. Tombol Selebar Kontainer: Salurkan Dana (di bawah buat anggaran) */}
                    {(() => {
                      const hasUnfulfilledBudgets = activeCardBudgets.some(b => b.isInsufficient);
                      const readyBudgets = activeCardBudgets.filter(b => b.amount > 0 && !b.isInsufficient);
                      const isDisburseDisabled = activeCardBudgets.length === 0 || hasUnfulfilledBudgets || activeCard.balance <= 0;
                      return (
                        <button
                          type="button"
                          disabled={isDisburseDisabled}
                          onClick={() => {
                            if (isDisburseDisabled) return;
                            setDisburseModalItems(readyBudgets);
                          }}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
                            isDisburseDisabled
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md cursor-pointer'
                          }`}
                          title={isDisburseDisabled ? 'Ada anggaran yang belum terpenuhi atau saldo kas kosong' : 'Salurkan Dana'}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Salurkan Dana</span>
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History Section */}
            <div id="transaction-history-section" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Riwayat Transaksi</h2>
                <div className="relative">
                  <select
                    value={txTimeframe}
                    onChange={e => setTxTimeframe(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-700 pr-5 cursor-pointer"
                  >
                    <option value="7h">7 Hari</option>
                    <option value="30h">30 Hari</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Table Column Headers */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-100">
                <span>↑↓ Nama Transaksi</span>
                <span>Nominal</span>
              </div>

              {/* Transaction Items */}
              <div
                key={`tx-list-${activeCard.id}`}
                className="divide-y divide-slate-100 mt-1"
              >
                {filteredTransactions.map(tx => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 rounded-xl px-1.5 transition-colors">
                    {/* Left: Icon / Avatar + Name + Date */}
                    <div className="flex items-center gap-3">
                      {tx.logoType === 'avatar' && tx.avatarUrl ? (
                        <img
                          src={tx.avatarUrl}
                          alt={tx.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full ${tx.logoColor || 'bg-slate-800'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                          {tx.logoLetter || tx.name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <div className="text-xs font-bold text-slate-900">{tx.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{tx.date}</div>
                      </div>
                    </div>

                    {/* Right: Amount + Status */}
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {formatMoney(tx.amount)}
                      </div>
                      <div className={`text-[10px] font-semibold ${
                        tx.status === 'Selesai' ? 'text-emerald-600' : tx.status === 'Ditolak' ? 'text-rose-500' : 'text-amber-500'
                      }`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTransactions.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    Belum ada riwayat transaksi pada {activeCard.type}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE MODALS: Send Money, Top Up, Add Goal, Edit Limit */}
      {/* ========================================================================= */}

      {/* SEND MONEY / QUICK PAYMENT MODAL */}
      {showSendModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kirim Pembayaran</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowSendModal(false); setSelectedContact(null); }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessSend} className="space-y-3.5 pt-3">
              {cardBudgetEnabled[activeCard.id] && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Mode Anggarkan Dana Aktif</div>
                    <div className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                      Kartu ini tidak bisa transfer manual karena alokasi saldo dikunci untuk pos anggaran terencana.
                    </div>
                  </div>
                </div>
              )}

              {/* Rekening Sumber (Tampilan Kartu Menyesuaikan Lebar Modal) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rekening Sumber</label>
                <div className="relative w-full overflow-hidden rounded-2xl p-4 text-white border border-white/20 shadow-md shadow-slate-900/10 select-none">
                  {/* Background Satin Gradient dari Kartu Aktif */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${activeCard.gradient}`} />

                  <div className="relative z-10 flex flex-col justify-between h-28">
                    {/* Baris Atas: Chip EMV & Nama Pemegang Kartu */}
                    <div className="flex items-center justify-between min-h-[20px] gap-2">
                      <div className="w-7 h-4.5 rounded bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-0.5 border border-amber-400/50 shadow-inner flex flex-col justify-between shrink-0">
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                      </div>
                      <span
                        className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0 truncate max-w-[200px] text-white/95 drop-shadow-xs"
                        title={activeCard.holder}
                      >
                        {activeCard.holder}
                      </span>
                    </div>

                    {/* Baris Bawah: Saldo & Nama Rekening */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-blue-100/90 block">
                        Saldo Kartu
                      </span>
                      <div className="text-base sm:text-lg font-black font-mono tracking-tight text-white drop-shadow-xs truncate">
                        {formatMoney(activeCard.balance)}
                      </div>
                      <div className="text-xs font-semibold text-white/95 truncate tracking-wide drop-shadow-xs">
                        {activeCard.type}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penerima</label>
                <input
                  type="text"
                  required
                  placeholder="Nama penerima atau kontak"
                  value={modalRecipient}
                  onChange={e => setModalRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={modalAmount}
                    onChange={e => setModalAmount(formatRupiahInput(e.target.value))}
                    className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                      parseRupiahInput(modalAmount) > activeCard.balance
                        ? 'border-rose-400 text-rose-600 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 text-slate-900 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                </div>
                {parseRupiahInput(modalAmount) > activeCard.balance && (
                  <p className="text-[10px] font-semibold text-rose-500 mt-1">
                    Nominal melebihi saldo sumber dana ({formatMoney(activeCard.balance)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembayaran konsumsi / sarpras"
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cardBudgetEnabled[activeCard.id] || parseRupiahInput(modalAmount) > activeCard.balance || parseRupiahInput(modalAmount) <= 0}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                    cardBudgetEnabled[activeCard.id] || parseRupiahInput(modalAmount) > activeCard.balance || parseRupiahInput(modalAmount) <= 0
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20'
                  }`}
                >
                  {cardBudgetEnabled[activeCard.id] ? 'Transfer Dikunci' : 'Kirim Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* TRANSFER ANTAR KARTU / REKENING MODAL */}
      {showTransferModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 -rotate-45" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Transfer Dana</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTransferModal(false);
                  setIsTransferDropdownOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessTransfer} className="space-y-3 pt-3">
              {cardBudgetEnabled[activeCard.id] && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Mode Anggarkan Dana Aktif</div>
                    <div className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                      Kartu ini sedang dalam mode Anggarkan Dana. Seluruh transaksi manual dikunci untuk menjaga alokasi pos anggaran kas.
                    </div>
                  </div>
                </div>
              )}

              {/* Rekening Sumber (Tampilan Kartu Menyesuaikan Lebar Modal) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rekening Sumber</label>
                <div className="relative w-full overflow-hidden rounded-2xl p-4 text-white border border-white/20 shadow-md shadow-slate-900/10 select-none">
                  {/* Background Satin Gradient dari Kartu Aktif */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${activeCard.gradient}`} />

                  <div className="relative z-10 flex flex-col justify-between h-28">
                    {/* Baris Atas: Chip EMV & Nama Pemegang Kartu */}
                    <div className="flex items-center justify-between min-h-[20px] gap-2">
                      <div className="w-7 h-4.5 rounded bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-0.5 border border-amber-400/50 shadow-inner flex flex-col justify-between shrink-0">
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                      </div>
                      <span
                        className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0 truncate max-w-[200px] text-white/95 drop-shadow-xs"
                        title={activeCard.holder}
                      >
                        {activeCard.holder}
                      </span>
                    </div>

                    {/* Baris Bawah: Saldo & Nama Rekening */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-blue-100/90 block">
                        Saldo Kartu
                      </span>
                      <div className="text-base sm:text-lg font-black font-mono tracking-tight text-white drop-shadow-xs truncate">
                        {formatMoney(activeCard.balance)}
                      </div>
                      <div className="text-xs font-semibold text-white/95 truncate tracking-wide drop-shadow-xs">
                        {activeCard.type}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tujuan Transfer (Searchable Dropdown Minimalis) */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan Transfer</label>
                <div ref={transferInputContainerRef} className="relative">
                  <input
                    type="text"
                    placeholder="Ketik atau pilih rekening tujuan..."
                    value={transferSearchQuery}
                    readOnly={Boolean(transferTargetCardId)}
                    onFocus={() => {
                      if (!transferTargetCardId) {
                        setIsTransferDropdownOpen(true);
                      }
                    }}
                    onChange={e => {
                      if (!transferTargetCardId) {
                        setTransferSearchQuery(e.target.value);
                        setIsTransferDropdownOpen(true);
                      }
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 pr-8 ${
                      transferTargetCardId
                        ? 'bg-slate-50 text-slate-900 font-bold cursor-default select-none'
                        : 'bg-white text-slate-900'
                    }`}
                  />
                  {transferTargetCardId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTransferTargetCardId('');
                        setTransferSearchQuery('');
                        setIsTransferDropdownOpen(true);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 rounded-md hover:bg-slate-200/60 transition-colors"
                      title="Hapus pilihan dan cari lagi"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTransferDropdownOpen(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      title="Buka pilihan tujuan"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isTransferDropdownOpen && !transferTargetCardId && (
                  <div
                    ref={transferDropdownMenuRef}
                    className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl divide-y divide-slate-100 animate-in fade-in"
                  >
                    {filteredTransferCards.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        Tidak ada rekening tujuan ditemukan
                      </div>
                    ) : (
                      filteredTransferCards.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setTransferTargetCardId(c.id);
                            setTransferSearchQuery(c.type);
                            setIsTransferDropdownOpen(false);
                          }}
                          onClick={() => {
                            setTransferTargetCardId(c.id);
                            setTransferSearchQuery(c.type);
                            setIsTransferDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs hover:bg-indigo-50/60 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-bold text-slate-800">{c.type}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{c.holder}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Transfer (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={transferAmount}
                    onChange={e => setTransferAmount(formatRupiahInput(e.target.value))}
                    className={`w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:ring-2 ${
                      parseRupiahInput(transferAmount) > activeCard.balance
                        ? 'border-rose-400 text-rose-600 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-600'
                    }`}
                  />
                </div>
                {parseRupiahInput(transferAmount) > activeCard.balance && (
                  <p className="text-[10px] font-semibold text-rose-500 mt-1">
                    Nominal melebihi saldo sumber dana ({formatMoney(activeCard.balance)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Alokasi kas konsumsi santri"
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setIsTransferDropdownOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cardBudgetEnabled[activeCard.id] || parseRupiahInput(transferAmount) > activeCard.balance || parseRupiahInput(transferAmount) <= 0 || !transferTargetCardId}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                    cardBudgetEnabled[activeCard.id] || parseRupiahInput(transferAmount) > activeCard.balance || parseRupiahInput(transferAmount) <= 0 || !transferTargetCardId
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {cardBudgetEnabled[activeCard.id] ? 'Transfer Dikunci' : 'Proses Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* RECEIVE / TERIMA DANA MODAL */}
      {showReceiveModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Terima Dana</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessReceive} className="space-y-3 pt-3">
              {/* Rekening Tujuan (Tampilan Kartu Menyesuaikan Lebar Modal) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rekening Tujuan</label>
                <div className="relative w-full overflow-hidden rounded-2xl p-4 text-white border border-white/20 shadow-md shadow-slate-900/10 select-none">
                  {/* Background Satin Gradient dari Kartu Aktif */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${activeCard.gradient}`} />

                  <div className="relative z-10 flex flex-col justify-between h-28">
                    {/* Baris Atas: Chip EMV & Nama Pemegang Kartu */}
                    <div className="flex items-center justify-between min-h-[20px] gap-2">
                      <div className="w-7 h-4.5 rounded bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-0.5 border border-amber-400/50 shadow-inner flex flex-col justify-between shrink-0">
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                      </div>
                      <span
                        className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0 truncate max-w-[200px] text-white/95 drop-shadow-xs"
                        title={activeCard.holder}
                      >
                        {activeCard.holder}
                      </span>
                    </div>

                    {/* Baris Bawah: Saldo & Nama Rekening */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-blue-100/90 block">
                        Saldo Kartu
                      </span>
                      <div className="text-base sm:text-lg font-black font-mono tracking-tight text-white drop-shadow-xs truncate">
                        {formatMoney(activeCard.balance)}
                      </div>
                      <div className="text-xs font-semibold text-white/95 truncate tracking-wide drop-shadow-xs">
                        {activeCard.type}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Dana (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={receiveAmount}
                    onChange={e => setReceiveAmount(formatRupiahInput(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pengirim</label>
                <input
                  type="text"
                  required
                  placeholder="Nama pengirim / donatur / instansi"
                  value={receiveSender}
                  onChange={e => setReceiveSender(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembayaran syahriah santri, infaq konsumsi..."
                  value={receiveNotes}
                  onChange={e => setReceiveNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={parseRupiahInput(receiveAmount) <= 0 || !receiveSender.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                    parseRupiahInput(receiveAmount) <= 0 || !receiveSender.trim()
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                  }`}
                >
                  Terima Dana
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* TOP UP MODAL */}
      {showTopUpModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Isi Saldo Kas</h3>
                  <p className="text-[10px] text-slate-400">Tambah saldo dompet kas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessTopUp} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rekening Sumber</label>
                <select
                  value={topUpSource}
                  onChange={e => setTopUpSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="BSI Syariah Pesantren">BSI Syariah Pesantren</option>
                  <option value="Bank Mandiri Sarpras">Bank Mandiri Sarpras</option>
                  <option value="Setoran Tunai Syahriah">Setoran Tunai Syahriah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Isi Saldo (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={modalAmount}
                    onChange={e => setModalAmount(formatRupiahInput(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Konfirmasi Isi Saldo
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ADD GOAL MODAL */}
      {showAddGoalModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Target Tabungan</h3>
                  <p className="text-[10px] text-slate-400">Target tabungan & investasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGoalModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Target</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Renovasi Asrama, Laptop Baru"
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="10.000.000"
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(formatRupiahInput(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Perkiraan Waktu / Durasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Sisa waktu 6 bulan"
                  value={newGoalDuration}
                  onChange={e => setNewGoalDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGoalCategory('this_year')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newGoalCategory === 'this_year'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Tahun ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGoalCategory('long_term')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newGoalCategory === 'long_term'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Jangka panjang
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT SPENDING LIMIT MODAL */}
      {showEditLimitModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pagu Pengeluaran</h3>
                  <p className="text-[10px] text-slate-400">Atur batas pengeluaran bulanan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditLimitModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batas Pengeluaran Bulanan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={spendingLimit}
                    onChange={e => setSpendingLimit(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditLimitModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}



      {/* ======================================================== */}
      {/* EDIT CARD MODAL */}
      {/* ======================================================== */}
      {showEditCardModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Kartu</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditCardModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Mini Preview */}
            <div className={`mt-3 p-3.5 rounded-xl bg-gradient-to-r ${editCardGradient || activeCard.gradient} text-white shadow-xs`}>
              <div className="flex justify-between items-center text-xs font-bold gap-2">
                <span className="text-[9px] uppercase font-bold tracking-wider text-blue-200/90 block">
                  Saldo Kartu
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[170px]" title={editCardHolder || activeCard.holder}>
                  {editCardHolder || activeCard.holder}
                </span>
              </div>
              <div className="mt-1 text-base font-black font-mono">
                {formatMoney(activeCard.balance)}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-white/90 truncate tracking-wide">
                {editCardType || activeCard.type}
              </div>
            </div>

            <form onSubmit={handleSaveEditCard} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Rekening</label>
                <input
                  type="text"
                  value={editCardType}
                  onChange={e => setEditCardType(e.target.value)}
                  placeholder="Contoh: Kas Operasional & Dapur"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik</label>
                <input
                  type="text"
                  value={editCardHolder}
                  onChange={e => setEditCardHolder(e.target.value)}
                  placeholder="BENDAHARA PESANTREN"
                  className="w-full px-3 py-2 text-xs uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Color Theme Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Warna Kartu</label>
                <div className="grid grid-cols-8 gap-1.5 sm:gap-2 w-full pt-1">
                  {CARD_GRADIENT_PALETTES.map(swatch => (
                    <button
                      key={swatch.label}
                      type="button"
                      onClick={() => setEditCardGradient(swatch.grad)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full bg-gradient-to-tr ${swatch.grad} cursor-pointer transition-all ${
                        editCardGradient === swatch.grad ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'hover:scale-105'
                      }`}
                      title={swatch.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditCardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* DELETE CARD CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {showDeleteCardModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Kartu?</h3>
                <p className="text-[10px] text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{activeCard.brand}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{activeCard.holder}</div>
              <div className="mt-2 text-xs font-black text-rose-600">
                Saldo tersisa: {formatMoney(activeCard.balance)}
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus kartu ini dari daftar dompet?
            </p>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteCardModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCard}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Ya, Hapus Kartu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* ADD CARD MODAL (Dynamic & Fully Functional) */}
      {/* ======================================================== */}
      {showAddCardModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Kartu Baru</h3>
                  <p className="text-[10px] text-slate-400">Buat kartu rekening pesantren baru</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Interactive Preview */}
            <div className={`mt-3 p-3.5 rounded-xl bg-gradient-to-r ${newCardGradient} text-white shadow-xs`}>
              <div className="flex justify-between items-center text-xs font-bold gap-2">
                <span className="text-[9px] uppercase font-bold tracking-wider text-blue-200/90 block">
                  Saldo Kartu
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[170px]" title={newCardHolder || 'BENDAHARA PESANTREN'}>
                  {newCardHolder || 'BENDAHARA PESANTREN'}
                </span>
              </div>
              <div className="mt-1 text-base font-black font-mono">
                Rp 0
              </div>
              <div className="mt-0.5 text-xs font-semibold text-white/90 truncate tracking-wide">
                {newCardType || 'Kas Rekening Baru'}
              </div>
            </div>

            <form onSubmit={handleSaveNewCard} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Rekening</label>
                <input
                  type="text"
                  value={newCardType}
                  onChange={e => setNewCardType(e.target.value)}
                  placeholder="Contoh: Kas Kegiatan Santri"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Kartu</label>
                <input
                  type="text"
                  value={newCardHolder}
                  onChange={e => setNewCardHolder(e.target.value)}
                  placeholder="BENDAHARA PESANTREN"
                  className="w-full px-3 py-2 text-xs uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Color Theme Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Warna Kartu</label>
                <div className="grid grid-cols-8 gap-1.5 sm:gap-2 w-full pt-1">
                  {CARD_GRADIENT_PALETTES.map(swatch => (
                    <button
                      key={swatch.label}
                      type="button"
                      onClick={() => setNewCardGradient(swatch.grad)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full bg-gradient-to-tr ${swatch.grad} cursor-pointer transition-all ${
                        newCardGradient === swatch.grad ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'hover:scale-105'
                      }`}
                      title={swatch.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Simpan Kartu
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* CARD LOCKED WARNING MODAL */}
      {/* ======================================================== */}
      {cardLockedNoticeModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kartu Sedang Dikunci</h3>
                <p className="text-[10px] text-slate-400">Proteksi keamanan aktif</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Kartu <span className="font-bold text-slate-900">{activeCard.type}</span> saat ini sedang dikunci. Transaksi pengiriman saldo dan top-up dinonaktifkan hingga kunci dibuka.
            </p>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCardLockedNoticeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setCards(prev => prev.map(c => c.id === activeCard.id ? { ...c, isLocked: false } : c));
                  setCardLockedNoticeModal(false);
                  showToast(`Kunci kartu "${activeCard.type}" telah dibuka.`);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Buka Kunci Sekarang
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* VIEW ALL CARDS HORIZONTAL SHOWCASE OVERLAY (PORTAL TO BODY) */}
      {/* ======================================================== */}
      {showViewAllModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col justify-between bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200 select-none w-screen h-screen overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowViewAllModal(false);
          }}
        >
          {/* Top Bar: Title, Count, & Close Button */}
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/15">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Semua Kartu Pesantren
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-black text-blue-300 bg-blue-500/20 border border-blue-400/30 rounded-full">
                    {cards.length}
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  Pilih salah satu kartu untuk menjadikannya kartu aktif
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowViewAllModal(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/15"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Horizontal Cards Showcase (Centred vertically, scrollable horizontally) */}
          <div className="flex-1 flex flex-col justify-center items-center py-6 w-full max-w-7xl mx-auto overflow-hidden">
            <div className="w-full overflow-x-auto py-10 px-4 sm:px-8 flex items-center gap-6 justify-start sm:justify-center no-scrollbar scroll-smooth">
              {cards.map((card, idx) => {
                const isCurrent = safeIndex === idx;
                const scale = isCurrent ? 1 : 0.88;
                const opacity = isCurrent ? 1 : 0.55;

                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      if (!isCurrent) {
                        setActiveCardIndex(idx);
                        showToast(`Kartu ${card.brand} dipilih sebagai kartu aktif.`);
                      } else {
                        setShowViewAllModal(false);
                      }
                    }}
                    style={{
                      width: '320px',
                      minWidth: '320px',
                      flexShrink: 0,
                      transform: `scale(${scale})`,
                      opacity: opacity,
                      transformOrigin: 'center center',
                      transition: 'transform 280ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity 280ms cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 280ms cubic-bezier(0.25, 0.1, 0.25, 1)'
                    }}
                    className={`relative select-none overflow-hidden rounded-2xl p-5 text-white cursor-pointer group ${
                      isCurrent
                        ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-slate-950 border border-white/50 shadow-2xl shadow-blue-500/30'
                        : 'border border-white/20 hover:opacity-80 hover:border-white/40 shadow-xl'
                    }`}
                  >
                    {/* Background Satin Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-tr ${card.gradient}`} />

                    <div className="relative z-10 flex flex-col justify-between h-44">
                      {/* Top row: Status Badge & Cardholder Name (Kanan Atas) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 bg-white text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                              <Check className="w-3 h-3 text-blue-600" /> Aktif
                            </span>
                          )}
                          {card.isLocked && (
                            <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              <Lock className="w-2.5 h-2.5" /> Terkunci
                            </span>
                          )}
                          {cardBudgetEnabled[card.id] && !card.isLocked && (
                            <span className="inline-flex items-center justify-center bg-amber-500/90 text-white w-5 h-5 rounded-full shadow-xs" title="Anggaran Aktif">
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider truncate max-w-[170px]" title={card.holder}>
                          {card.holder}
                        </span>
                      </div>

                      {/* EMV Microchip Graphic */}
                      <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-1 border border-amber-400/50 shadow-inner flex flex-col justify-between">
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                      </div>

                      {/* Nominal Saldo Kartu & Nama Rekening */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200/90 block">
                          Saldo Kartu
                        </span>
                        <div className="text-xl font-black font-mono tracking-tight text-white drop-shadow-xs truncate">
                          {formatMoney(card.balance)}
                        </div>
                        <div className="text-xs font-semibold text-white/90 truncate tracking-wide" title={card.type}>
                          {card.type}
                        </div>
                      </div>

                      {/* Bottom row: Brand & Card Number */}
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
                        <span className="text-[11px] opacity-80">{card.brand}</span>
                        <span className="font-mono text-[11px] tracking-wider opacity-90">{card.cardNumber}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected card action bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowViewAllModal(false);
                  showToast(`Kartu ${activeCard.brand} digunakan.`);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Kartu {activeCard.brand}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowViewAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer"
              >
                Tutup Tampilan
              </button>
            </div>
          </div>

          {/* Bottom helper text */}
          <div className="w-full max-w-7xl mx-auto flex items-center justify-center pt-2 border-t border-white/10 shrink-0">
            <p className="text-[11px] text-white/50 text-center">
              Klik kartu yang tidak aktif untuk menjadikannya aktif &bull; Klik kartu aktif atau tombol untuk menggunakan
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH ANGGARAN BARU (PORTAL AGAR SIDEBAR IKUT GELAP) */}
      {/* ======================================================== */}
      {showAddBudgetModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingBudgetId ? 'Sesuaikan Anggaran Dana' : 'Buat Anggaran Dana'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddBudgetModal(false);
                  setEditingBudgetId(null);
                  setIsBudgetCardDropdownOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-3.5">
              {/* 1. Nama Anggaran (Tanpa shortcut sugesti) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Anggaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operasional Dapur Santri, Honor Asatidz..."
                  value={budgetName}
                  onChange={e => setBudgetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                />
              </div>

              {/* Kolom Nama Kartu dan Besaran Alokasi Satu Kontainer */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3.5">
                {/* Pilihan Tujuan Alokasi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tujuan Alokasi Dana
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setBudgetTargetType('transfer');
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        budgetTargetType === 'transfer'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        budgetTargetType === 'transfer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <ArrowLeftRight className="w-3 h-3" />
                      </div>
                      <div className="text-xs font-bold leading-tight truncate">Transfer Rekening</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBudgetTargetType('send');
                        setIsBudgetCardDropdownOpen(false);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        budgetTargetType === 'send'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        budgetTargetType === 'send' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Send className="w-3 h-3" />
                      </div>
                      <div className="text-xs font-bold leading-tight truncate">Kirim Kas / Pos</div>
                    </button>
                  </div>

                  {budgetTargetType === 'transfer' ? (
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Rekening</label>
                      <div ref={budgetCardInputContainerRef} className="relative">
                        <input
                          type="text"
                          placeholder="Ketik atau pilih rekening tujuan..."
                          value={budgetCardSearchQuery}
                          readOnly={Boolean(budgetTargetCardId)}
                          onFocus={() => {
                            if (!budgetTargetCardId) {
                              setIsBudgetCardDropdownOpen(true);
                            }
                          }}
                          onChange={e => {
                            if (!budgetTargetCardId) {
                              setBudgetCardSearchQuery(e.target.value);
                              setIsBudgetCardDropdownOpen(true);
                            }
                          }}
                          className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 pr-8 ${
                            budgetTargetCardId
                              ? 'bg-slate-50 text-slate-900 font-bold cursor-default select-none'
                              : 'bg-white text-slate-900'
                          }`}
                        />
                        {budgetTargetCardId ? (
                          <button
                            type="button"
                            onClick={() => {
                              setBudgetTargetCardId('');
                              setBudgetCardSearchQuery('');
                              setIsBudgetCardDropdownOpen(true);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 rounded-md hover:bg-slate-200/60 transition-colors"
                            title="Hapus pilihan dan cari lagi"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsBudgetCardDropdownOpen(prev => !prev)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                            title="Buka pilihan rekening"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isBudgetCardDropdownOpen && !budgetTargetCardId && (
                        <div
                          ref={budgetCardDropdownMenuRef}
                          className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl divide-y divide-slate-100 animate-in fade-in"
                        >
                          {filteredBudgetCards.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              Tidak ada rekening tujuan ditemukan
                            </div>
                          ) : (
                            filteredBudgetCards.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setBudgetTargetCardId(c.id);
                                  setBudgetCardSearchQuery(c.type);
                                  setIsBudgetCardDropdownOpen(false);
                                }}
                                onClick={() => {
                                  setBudgetTargetCardId(c.id);
                                  setBudgetCardSearchQuery(c.type);
                                  setIsBudgetCardDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50/60 transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span className="font-bold text-slate-800">{c.type}</span>
                                <span className="text-[11px] text-slate-500 font-medium">{c.holder}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Penerima
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama penerima..."
                        value={budgetRecipientText}
                        onChange={e => setBudgetRecipientText(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Divider halus di dalam kontainer yang sama */}
                <div className="border-t border-slate-200/70" />

                {/* Besaran Alokasi (% atau Rp di sebelah kanan) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Besaran Alokasi
                    </label>
                    <div className="flex items-center p-0.5 rounded-lg bg-slate-200/80 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setBudgetAllocationType('percentage')}
                        className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                          budgetAllocationType === 'percentage'
                            ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        % (Persen)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudgetAllocationType('amount')}
                        className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                          budgetAllocationType === 'amount'
                            ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Rp (Nominal)
                      </button>
                    </div>
                  </div>

                  {budgetAllocationType === 'percentage' ? (
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-24 shrink-0">
                          <input
                            type="number"
                            min={1}
                            max={maxAllowedPercentage}
                            step={1}
                            value={budgetPercentage}
                            onChange={e => handlePercentageChange(parseFloat(e.target.value) || 0)}
                            className="w-full pl-3 pr-6 py-2 text-xs font-bold text-slate-900 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>

                        {/* Range slider tidak bisa melebihi sisa yang diperbolehkan */}
                        <input
                          type="range"
                          min={1}
                          max={maxAllowedPercentage}
                          step={1}
                          value={budgetPercentage}
                          onChange={e => handlePercentageChange(parseFloat(e.target.value) || 0)}
                          className="flex-1 accent-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          placeholder="0"
                          value={budgetAmountInput}
                          onChange={e => setBudgetAmountInput(formatRupiahInput(e.target.value))}
                          className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBudgetModal(false);
                    setEditingBudgetId(null);
                    setIsBudgetCardDropdownOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingBudgetId ? 'Simpan Penyesuaian' : 'Simpan Anggaran Dana'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL SALURKAN ANGGARAN (PORTAL AGAR SIDEBAR IKUT GELAP) */}
      {/* ======================================================== */}
      {disburseModalItems && disburseModalItems.length > 0 && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Salurkan Anggaran</h3>
              <button
                type="button"
                onClick={() => setDisburseModalItems(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Modal: Daftar Rincian Anggaran & Total Anggaran Disalurkan */}
            <div className="py-3.5 space-y-3">
              {/* Daftar Rincian Anggaran */}
              <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 max-h-52 overflow-y-auto space-y-1.5">
                {disburseModalItems.map(item => (
                  <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <div className="font-bold text-slate-800 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{item.targetDetail}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900">{formatMoney(item.amount)}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Anggaran Disalurkan */}
              <div className="flex items-center justify-between px-1 py-1.5 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Total Anggaran Disalurkan</span>
                <span className="text-sm font-extrabold text-blue-600">
                  {formatMoney(disburseModalItems.reduce((sum, b) => sum + b.amount, 0))}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDisburseModalItems(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDisburseItems}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salurkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL PERINGATAN KUNCI ANGGARAN (BUDGET LOCKED NOTICE) */}
      {/* ======================================================== */}
      {showBudgetLockedNotice && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Transfer Manual Dikunci</h3>
                <p className="text-[11px] text-amber-700 font-medium">Mode Anggarkan Dana Sedang Aktif</p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Kartu <strong>{activeCard.brand} ({activeCard.type})</strong> mengaktifkan fitur <strong>Anggarkan Dana</strong>. Seluruh saldo kartu dikunci untuk pos-pos anggaran terencana, sehingga tidak dapat melakukan transfer manual bebas.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Pos Anggaran Terdaftar:</span>
                  <span className="font-bold text-slate-800">{activeCardBudgets.length} Pos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Saldo Teralokasi:</span>
                  <span className="font-bold text-blue-600">{formatMoney(totalAllocatedAmount)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/80 leading-snug">
                💡 <em>Tips:</em> Untuk mengeluarkan dana, gunakan tombol <strong>Salurkan</strong> pada pos anggaran yang sudah Anda rencanakan, atau matikan toggle <strong>Anggarkan Dana</strong> jika ingin membuka kunci transfer manual.
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowBudgetLockedNotice(false);
                  handleToggleBudgetMode();
                }}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-center"
              >
                Matikan Mode Anggaran (Buka Kunci Transfer)
              </button>
              <button
                type="button"
                onClick={() => setShowBudgetLockedNotice(false)}
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer text-center shadow-xs"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* FLOATING TOAST NOTIFICATION */}
      {/* ======================================================== */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
