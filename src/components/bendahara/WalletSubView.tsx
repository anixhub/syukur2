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
  HelpCircle
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
    const cleanBalance = Math.max(0, parseInt(editCardBalance.replace(/\D/g, '') || '0', 10));
    setCards(prev => prev.map(c => c.id === activeCard.id ? {
      ...c,
      type: editCardType.trim() || c.type,
      brand: editCardBrand,
      holder: (editCardHolder.trim() || c.holder).toUpperCase(),
      balance: cleanBalance,
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

  const handleSaveNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = Math.max(0, parseInt(newCardBalance.replace(/\D/g, '') || '0', 10));
    const newId = `c-${Date.now()}`;
    const newCardItem: WalletCard = {
      id: newId,
      type: newCardType.trim() || 'Kas Operasional',
      brand: newCardBrand,
      balance: parsedBalance,
      holder: (newCardHolder.trim() || 'BENDAHARA PESANTREN').toUpperCase(),
      gradient: newCardGradient,
      cardNumber: newCardNumber.trim() || '4219 •••• •••• 8899',
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
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        cardId: newId,
        name: `Saldo Awal ${newCardItem.type}`,
        date: 'Hari Ini',
        amount: parsedBalance,
        type: 'income',
        status: 'Selesai',
        logoType: 'td',
        logoColor: 'bg-emerald-600',
        logoLetter: newCardItem.brand.slice(0, 2).toUpperCase()
      },
      ...prev
    ]);

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
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

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
  const [showBudgetLockedNotice, setShowBudgetLockedNotice] = useState(false);
  const [showBudgetNoticeBanner, setShowBudgetNoticeBanner] = useState(true);
  const [disburseConfirmItem, setDisburseConfirmItem] = useState<CardBudgetItem | null>(null);

  // Form states for Tambah Anggaran
  const [budgetName, setBudgetName] = useState('');
  const [budgetTargetType, setBudgetTargetType] = useState<'transfer' | 'send'>('transfer');
  // For transfer to other bank account:
  const [budgetBankName, setBudgetBankName] = useState('BSI Syariah');
  const [budgetAccountNumber, setBudgetAccountNumber] = useState('');
  const [budgetAccountHolder, setBudgetAccountHolder] = useState('');
  // For send / operasional:
  const [budgetRecipient, setBudgetRecipient] = useState('Dapur Pesantren');
  const [budgetNotes, setBudgetNotes] = useState('');
  // Allocation method: percentage or amount
  const [budgetAllocType, setBudgetAllocType] = useState<'percentage' | 'amount'>('percentage');
  const [budgetPercentage, setBudgetPercentage] = useState<number>(25);
  const [budgetAmountInput, setBudgetAmountInput] = useState<string>('');

  // Active card's budgeting status & calculations
  const isBudgetActive = !!(activeCard && cardBudgetEnabled[activeCard.id]);

  const activeCardBudgets = useMemo(() => {
    if (!activeCard) return [];
    return cardBudgets.filter(b => b.cardId === activeCard.id);
  }, [cardBudgets, activeCard]);

  const activeUndisbursedBudgets = useMemo(() => {
    return activeCardBudgets.filter(b => !b.disbursed);
  }, [activeCardBudgets]);

  const totalAllocatedAmount = useMemo(() => {
    return activeUndisbursedBudgets.reduce((sum, b) => sum + b.amount, 0);
  }, [activeUndisbursedBudgets]);

  const totalAllocatedPercent = useMemo(() => {
    if (!activeCard || activeCard.balance <= 0) return 0;
    return Math.min(100, (totalAllocatedAmount / activeCard.balance) * 100);
  }, [totalAllocatedAmount, activeCard]);

  const unallocatedBalance = Math.max(0, (activeCard?.balance || 0) - totalAllocatedAmount);
  const unallocatedPercent = Math.max(0, 100 - totalAllocatedPercent);

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

  // Open modal handler
  const handleOpenAddBudget = () => {
    setBudgetName('');
    setBudgetTargetType('transfer');
    setBudgetBankName('BSI Syariah');
    setBudgetAccountNumber('');
    setBudgetAccountHolder('');
    setBudgetRecipient('Dapur Pesantren');
    setBudgetNotes('');
    setBudgetAllocType('percentage');
    const safeDefaultPercent = Math.max(5, Math.min(25, Math.floor(unallocatedPercent) || 10));
    setBudgetPercentage(safeDefaultPercent);
    setBudgetAmountInput(activeCard ? Math.round((safeDefaultPercent / 100) * activeCard.balance).toString() : '');
    setShowAddBudgetModal(true);
  };

  const handlePercentageChange = (pct: number) => {
    const clamped = Math.max(1, Math.min(100, pct));
    setBudgetPercentage(clamped);
    if (activeCard && activeCard.balance > 0) {
      const calculatedAmt = Math.round((clamped / 100) * activeCard.balance);
      setBudgetAmountInput(calculatedAmt.toString());
    }
  };

  const handleAmountChange = (valStr: string) => {
    setBudgetAmountInput(valStr);
    const num = parseFloat(valStr) || 0;
    if (activeCard && activeCard.balance > 0) {
      const pct = Math.min(100, Math.max(0, (num / activeCard.balance) * 100));
      setBudgetPercentage(Math.round(pct * 10) / 10);
    }
  };

  // Save budget handler
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

    if (budgetAllocType === 'percentage') {
      const pct = Math.max(1, Math.min(100, budgetPercentage));
      allocatedPct = pct;
      allocatedAmt = Math.round((pct / 100) * activeCard.balance);
    } else {
      const amt = Math.max(0, parseInt(budgetAmountInput.replace(/\D/g, '') || '0', 10));
      if (amt <= 0) {
        showToast('Mohon masukkan nominal saldo anggaran yang valid');
        return;
      }
      allocatedAmt = amt;
      allocatedPct = activeCard.balance > 0 ? Math.round((amt / activeCard.balance) * 1000) / 10 : 0;
    }

    if (allocatedAmt > unallocatedBalance && unallocatedBalance > 0) {
      showToast(`Alokasi melebihi sisa saldo bebas (${formatMoney(unallocatedBalance)})`);
      return;
    }

    let targetDesc = '';
    if (budgetTargetType === 'transfer') {
      targetDesc = `${budgetBankName} • ${budgetAccountNumber || 'Rekening'} a.n ${budgetAccountHolder || 'Penerima'}`;
    } else {
      targetDesc = `${budgetRecipient}${budgetNotes ? ` (${budgetNotes})` : ''}`;
    }

    const newBudgetItem: CardBudgetItem = {
      id: `bg-${Date.now()}`,
      cardId: activeCard.id,
      name: cleanName,
      targetType: budgetTargetType,
      targetDetail: targetDesc,
      bankName: budgetTargetType === 'transfer' ? budgetBankName : undefined,
      accountNumber: budgetTargetType === 'transfer' ? budgetAccountNumber : undefined,
      accountHolder: budgetTargetType === 'transfer' ? budgetAccountHolder : undefined,
      recipientCategory: budgetTargetType === 'send' ? budgetRecipient : undefined,
      notes: budgetNotes,
      allocationType: budgetAllocType,
      percentage: allocatedPct,
      amount: allocatedAmt,
      disbursed: false,
      createdAt: 'Hari ini'
    };

    setCardBudgets(prev => [...prev, newBudgetItem]);
    setShowAddBudgetModal(false);
    showToast(`Pos anggaran "${cleanName}" (${formatMoney(allocatedAmt)}) berhasil ditambahkan.`);
  };

  // Delete budget handler
  const handleDeleteBudget = (budgetId: string) => {
    setCardBudgets(prev => prev.filter(b => b.id !== budgetId));
    showToast('Pos anggaran berhasil dihapus.');
  };

  // Prompt disbursement
  const handlePromptDisburse = (item: CardBudgetItem) => {
    setDisburseConfirmItem(item);
  };

  // Confirm disbursement
  const handleConfirmDisburse = () => {
    if (!disburseConfirmItem) return;
    const item = disburseConfirmItem;

    // Deduct from card balance
    setCards(prev => prev.map(c => {
      if (c.id === item.cardId) {
        return {
          ...c,
          balance: Math.max(0, c.balance - item.amount)
        };
      }
      return c;
    }));

    // Mark budget as disbursed
    setCardBudgets(prev => prev.map(b => {
      if (b.id === item.id) {
        return {
          ...b,
          disbursed: true,
          disbursedAt: 'Hari ini'
        };
      }
      return b;
    }));

    // Record in transaction history
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      cardId: item.cardId,
      name: `Anggaran: ${item.name}`,
      date: 'Hari Ini',
      amount: -item.amount,
      type: 'expense',
      status: 'Selesai',
      logoType: item.targetType === 'transfer' ? 'td' : 'cnx',
      logoColor: item.targetType === 'transfer' ? 'bg-indigo-600' : 'bg-blue-600',
      logoLetter: item.name.substring(0, 2).toUpperCase()
    };

    setTransactions(prev => [newTx, ...prev]);
    setSpendingCurrent(prev => prev + item.amount);
    setTodayExpensesAdded(prev => prev + item.amount);
    setDisburseConfirmItem(null);
    showToast(`Dana pos anggaran "${item.name}" sebesar ${formatMoney(item.amount)} berhasil disalurkan.`);
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
    const val = parseFloat(modalAmount);
    if (!val || val <= 0) return;

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
  };

  const handleProcessTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCard.isLocked) {
      setCardLockedNoticeModal(true);
      return;
    }
    const val = parseFloat(modalAmount);
    if (!val || val <= 0) return;

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
    const val = parseFloat(transferAmount);
    if (!val || val <= 0) return;
    if (val > activeCard.balance) {
      showToast('Saldo kartu tidak mencukupi untuk transfer ini.');
      return;
    }

    const targetCard = cards.find(c => c.id === transferTargetCardId);
    const targetName = targetCard ? `${targetCard.brand} (${targetCard.type})` : 'Rekening Bank Penerima';

    // Kurangi saldo kartu aktif dan tambahkan ke kartu tujuan bila sesama kartu pesantren
    setCards(prevCards =>
      prevCards.map(c => {
        if (c.id === activeCard.id) {
          return { ...c, balance: Math.max(0, c.balance - val) };
        }
        if (targetCard && c.id === targetCard.id) {
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
    setTransferNotes('');
    showToast(`Transfer ke ${targetName} sebesar ${formatMoney(val)} berhasil.`);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(newGoalTarget);
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
          {/* Top row: Lock Badge & Anggaran Aktif Badge & Brand */}
          <div className="flex items-center justify-between min-h-[22px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {card.isLocked && (
                <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  <Lock className="w-2.5 h-2.5" /> Terkunci
                </span>
              )}
              {cardBudgetEnabled[card.id] && (
                <span className="inline-flex items-center gap-1 bg-amber-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                  <PieChart className="w-2.5 h-2.5" /> Anggaran Aktif
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-black italic tracking-wider shrink-0">
              {card.brand}
            </span>
          </div>

          {/* EMV Microchip Graphic */}
          <div className="w-8 h-5 sm:w-10 sm:h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-1 border border-amber-400/50 shadow-inner flex flex-col justify-between">
            <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
            <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
          </div>

          {/* Nominal Saldo Kartu */}
          <div className="space-y-0.5">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-blue-200/90 block">
              Saldo Kartu
            </span>
            <div className="text-base sm:text-xl font-black font-mono tracking-tight text-white drop-shadow-xs truncate">
              {formatMoney(card.balance)}
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
                  <h2 className="text-sm font-bold text-slate-900">Kartu Saya</h2>
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-full">
                    {cards.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddCardModal(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah kartu</span>
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
                <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60">
                  <button
                    type="button"
                    onClick={handlePrevCard}
                    disabled={cards.length <= 1 || slideDirection !== null}
                    className="w-7 h-7 rounded-md hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    title="Kartu Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextCard}
                    disabled={cards.length <= 1 || slideDirection !== null}
                    className="w-7 h-7 rounded-md hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-2xs"
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

              {/* Expanded Services & Card Management (Shown when Lainnya is clicked, meluas ke bawah, NO modal) */}
              <div
                className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                  isMoreExpanded
                    ? 'grid-rows-[1fr] opacity-100 mt-4 pt-3.5 border-t border-slate-100'
                    : 'grid-rows-[0fr] opacity-0 mt-0 pt-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between mb-3 px-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Layanan & Pengaturan Kartu
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMoreExpanded(false)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-0.5"
                    >
                      <span>Tutup</span>
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {/* 1. Isi Saldo */}
                    <button
                      type="button"
                      onClick={() => setShowTopUpModal(true)}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-emerald-600">
                        Isi Saldo
                      </span>
                    </button>

                    {/* 2. Kunci / Buka Kunci */}
                    <button
                      type="button"
                      onClick={handleToggleLockCard}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                          activeCard.isLocked
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                            : 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
                        }`}
                      >
                        {activeCard.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-amber-600">
                        {activeCard.isLocked ? 'Buka Kunci' : 'Kunci'}
                      </span>
                    </button>

                    {/* 3. Atur Limit */}
                    <button
                      type="button"
                      onClick={() => showToast(`Limit harian kartu ${activeCard.brand}: Rp 25.000.000`)}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-indigo-600">
                        Atur Limit
                      </span>
                    </button>

                    {/* 4. Hapus Kartu */}
                    <button
                      type="button"
                      onClick={handleOpenDeleteCard}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-rose-600">
                        Hapus
                      </span>
                    </button>

                    {/* 5. Rekening Bank */}
                    <button
                      type="button"
                      onClick={() => showToast(`Rekening terdaftar pada ${activeCard.brand}`)}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center transition-colors">
                        <Building className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-800">
                        Rekening
                      </span>
                    </button>

                    {/* 6. Unduh Mutasi */}
                    <button
                      type="button"
                      onClick={() => showToast('Mengunduh mutasi rekening PDF...')}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <Download className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-emerald-600">
                        Mutasi PDF
                      </span>
                    </button>

                    {/* 7. Statistik */}
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('transaction-history-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-purple-600">
                        Statistik
                      </span>
                    </button>

                    {/* 8. Transfer Manual */}
                    <button
                      type="button"
                      onClick={() => {
                        if (cardBudgetEnabled[activeCard.id]) {
                          setShowBudgetLockedNotice(true);
                        } else {
                          setShowTransferModal(true);
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      title={cardBudgetEnabled[activeCard.id] ? 'Transfer manual dikunci karena mode Anggarkan Dana aktif' : 'Transfer manual ke rekening atau kartu lain'}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                          cardBudgetEnabled[activeCard.id]
                            ? 'bg-amber-50 border-amber-200 text-amber-600'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                        }`}
                      >
                        {cardBudgetEnabled[activeCard.id] ? <Lock className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
                      </div>
                      <span className={`text-[11px] font-semibold ${
                        cardBudgetEnabled[activeCard.id] ? 'text-amber-700' : 'text-slate-600 group-hover:text-indigo-600'
                      }`}>
                        {cardBudgetEnabled[activeCard.id] ? 'Transfer (Kunci)' : 'Transfer'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* MODUL ANGGARKAN DANA (PENGGANTI TRANSFER CEPAT) */}
              {/* ================================================================= */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                {/* Header with Toggle Switch */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">Anggarkan Dana</h3>
                    {isBudgetActive ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200/80">
                        Terkunci
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        Nonaktif
                      </span>
                    )}
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
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isBudgetActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Content based on Toggle State */}
                {isBudgetActive ? (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    {/* Notice Info Banner (Simple & Dismissible) */}
                    {showBudgetNoticeBanner && (
                      <div className="px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-amber-900 leading-snug">
                          Transfer manual dinonaktifkan saat saldo dianggarkan.
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowBudgetNoticeBanner(false)}
                          className="text-amber-600 hover:text-amber-900 p-0.5 rounded-md hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
                          title="Tutup pemberitahuan"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Allocation Breakdown Bar & Stats */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Teralokasi</span>
                          <span className="font-bold text-slate-800">{formatMoney(totalAllocatedAmount)}</span>
                          <span className="text-[10px] text-blue-600 font-bold ml-1">({totalAllocatedPercent.toFixed(1)}%)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Sisa Bebas</span>
                          <span className="font-bold text-slate-600">{formatMoney(unallocatedBalance)}</span>
                          <span className="text-[10px] text-slate-400 font-bold ml-1">({unallocatedPercent.toFixed(1)}%)</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${Math.min(100, totalAllocatedPercent)}%` }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Action Header for Pos Anggaran */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-xs font-bold text-slate-800">
                        Daftar Pos Anggaran ({activeCardBudgets.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenAddBudget}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Anggaran</span>
                      </button>
                    </div>

                    {/* List of Budgets */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                      {activeCardBudgets.map(item => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border transition-all ${
                            item.disbursed
                              ? 'bg-emerald-50/40 border-emerald-200/60'
                              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">{item.name}</span>
                                {item.targetType === 'transfer' ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md">
                                    <ArrowLeftRight className="w-2.5 h-2.5" /> Transfer Rekening
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded-md">
                                    <Send className="w-2.5 h-2.5" /> Kirim Kas
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                {item.targetDetail}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-extrabold text-blue-600">
                                  {formatMoney(item.amount)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {item.percentage}%
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              {item.disbursed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg">
                                  <CheckCircle2 className="w-3 h-3" /> Tersalurkan
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handlePromptDisburse(item)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
                                    title="Salurkan dana pos anggaran ini"
                                  >
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>Salurkan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBudget(item.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus pos anggaran"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {activeCardBudgets.length === 0 && (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                          <p className="text-xs text-slate-400 font-medium">Belum ada pos anggaran pada kartu ini.</p>
                          <button
                            type="button"
                            onClick={handleOpenAddBudget}
                            className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Buat Pos Anggaran Pertama
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* State when Anggarkan Dana is OFF */
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2.5 animate-in fade-in duration-200">
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Transfer Manual Diizinkan
                    </div>
                    <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                      Aktifkan <strong>Anggarkan Dana</strong> untuk mengunci saldo ke pos-pos pengeluaran tertentu (seperti operasional dapur, gaji, atau kas pembangunan) agar kartu tidak bisa ditransfer manual tanpa rencana.
                    </p>
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleBudgetMode}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <PieChart className="w-3.5 h-3.5" />
                        <span>Aktifkan Anggarkan Dana</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTransferModal(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/80 bg-slate-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Uji Transfer Manual saat mode anggaran OFF"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Transfer Manual</span>
                      </button>
                    </div>
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
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kirim Pembayaran</h3>
                  <p className="text-[10px] text-slate-400">Transfer dana kas keluar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowSendModal(false); setSelectedContact(null); }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessSend} className="space-y-4 pt-4">
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
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={modalAmount}
                    onChange={e => setModalAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cardBudgetEnabled[activeCard.id]}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                    cardBudgetEnabled[activeCard.id]
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20'
                  }`}
                >
                  {cardBudgetEnabled[activeCard.id] ? 'Transfer Dikunci' : 'Kirim Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER ANTAR KARTU / REKENING MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Transfer Dana</h3>
                  <p className="text-[10px] text-slate-400">Transfer antar kartu kas atau rekening bank</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessTransfer} className="space-y-3.5 pt-3">
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

              {/* Kartu Asal Info */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dari Kartu</div>
                  <div className="text-xs font-bold text-slate-800">{activeCard.type}</div>
                  <div className="text-[10px] text-slate-500">{activeCard.brand} • {activeCard.cardNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold text-slate-400">Saldo Tersedia</div>
                  <div className="text-xs font-bold text-blue-600">{formatMoney(activeCard.balance)}</div>
                </div>
              </div>

              {/* Pilih Rekening / Kartu Tujuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan Transfer</label>
                <select
                  value={transferTargetCardId}
                  onChange={e => setTransferTargetCardId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  required
                >
                  <option value="">-- Pilih Rekening / Kartu Tujuan --</option>
                  {cards
                    .filter(c => c.id !== activeCard.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.brand} - {c.type} ({formatMoney(c.balance)})
                      </option>
                    ))}
                  <option value="external">Rekening Bank Eksternal / Mitra</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Transfer (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan</label>
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
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cardBudgetEnabled[activeCard.id]}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                    cardBudgetEnabled[activeCard.id]
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer'
                  }`}
                >
                  {cardBudgetEnabled[activeCard.id] ? 'Transfer Dikunci' : 'Proses Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE / TERIMA DANA MODAL */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Terima Dana & Pembayaran</h3>
                  <p className="text-[10px] text-slate-400">QRIS dan Info Rekening Kas</p>
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

            <div className="pt-4 flex flex-col items-center text-center">
              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-xs mb-3 flex flex-col items-center">
                <div className="w-40 h-40 bg-slate-950 rounded-xl p-2.5 flex items-center justify-center text-white relative group">
                  <QrCode className="w-32 h-32 text-white" />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-emerald-400">QRIS STANDAR BI</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  NMID: ID1020304050607
                </div>
              </div>

              {/* Rekening Details */}
              <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-left mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{activeCard.brand}</span>
                  <span className="text-[10px] font-bold text-blue-600">{activeCard.type}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-black font-mono text-slate-800">{activeCard.cardNumber}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(activeCard.cardNumber.replace(/\s/g, ''));
                      }
                      showToast('Nomor rekening berhasil disalin ke clipboard.');
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Salin Nomor Rekening"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                  A.N. {activeCard.holder}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(
                        `Bank: ${activeCard.brand}\nRekening: ${activeCard.cardNumber}\nAtas Nama: ${activeCard.holder}`
                      );
                    }
                    showToast('Info rekening lengkap berhasil disalin.');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin Info
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Gambar QRIS berhasil diunduh.');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh QRIS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP UP MODAL */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
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
                className="text-slate-400 hover:text-slate-700 p-1"
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
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={modalAmount}
                    onChange={e => setModalAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Konfirmasi Isi Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
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
                className="text-slate-400 hover:text-slate-700 p-1"
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
                    type="number"
                    required
                    placeholder="10000000"
                    value={newGoalTarget}
                    onChange={e => setNewGoalTarget(e.target.value)}
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
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
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
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SPENDING LIMIT MODAL */}
      {showEditLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
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
                className="text-slate-400 hover:text-slate-700 p-1"
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
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ======================================================== */}
      {/* EDIT CARD MODAL */}
      {/* ======================================================== */}
      {showEditCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Kartu</h3>
                  <p className="text-[10px] text-slate-400">Perbarui rincian kartu pesantren</p>
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
              <div className="flex justify-end items-center text-xs font-bold">
                <span className="italic">{editCardBrand || activeCard.brand}</span>
              </div>
              <div className="mt-2 text-base font-black font-mono">
                {formatMoney(parseInt(editCardBalance.replace(/\D/g, '') || '0', 10))}
              </div>
              <div className="mt-1 text-[10px] opacity-80 uppercase tracking-wider">
                {editCardHolder || activeCard.holder}
              </div>
            </div>

            <form onSubmit={handleSaveEditCard} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama / Tipe Rekening</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank / Penerbit</label>
                <select
                  value={editCardBrand}
                  onChange={e => setEditCardBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                >
                  <option value="BSI Syariah">BSI Syariah</option>
                  <option value="Bank Muamalat">Bank Muamalat</option>
                  <option value="BCA Syariah">BCA Syariah</option>
                  <option value="Mandiri Syariah">Mandiri Syariah</option>
                  <option value="GPN Syariah">GPN Syariah</option>
                  <option value="VISA">VISA</option>
                  <option value="Mastercard">Mastercard</option>
                </select>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Rekening (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={editCardBalance}
                    onChange={e => setEditCardBalance(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Color Theme Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Warna Kartu</label>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Blue', grad: 'from-blue-600 via-blue-700 to-indigo-800' },
                    { label: 'Dark Navy', grad: 'from-slate-800 via-slate-900 to-blue-950' },
                    { label: 'Emerald', grad: 'from-emerald-700 via-teal-800 to-slate-900' },
                    { label: 'Purple', grad: 'from-purple-700 via-indigo-800 to-slate-900' },
                    { label: 'Rose', grad: 'from-rose-600 via-pink-700 to-slate-900' },
                    { label: 'Amber', grad: 'from-amber-600 via-orange-700 to-stone-900' }
                  ].map(swatch => (
                    <button
                      key={swatch.label}
                      type="button"
                      onClick={() => setEditCardGradient(swatch.grad)}
                      className={`w-7 h-7 rounded-full bg-gradient-to-tr ${swatch.grad} cursor-pointer transition-transform ${
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
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CARD CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {showDeleteCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
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
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD CARD MODAL (Dynamic & Fully Functional) */}
      {/* ======================================================== */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
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
              <div className="flex justify-end items-center text-xs font-bold">
                <span className="italic">{newCardBrand}</span>
              </div>
              <div className="mt-2 text-base font-black font-mono">
                {formatMoney(parseInt(newCardBalance.replace(/\D/g, '') || '0', 10))}
              </div>
              <div className="mt-1 text-[10px] opacity-80 uppercase tracking-wider">
                {newCardHolder || 'BENDAHARA PESANTREN'}
              </div>
            </div>

            <form onSubmit={handleSaveNewCard} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama / Tipe Rekening</label>
                <input
                  type="text"
                  value={newCardType}
                  onChange={e => setNewCardType(e.target.value)}
                  placeholder="Contoh: Kas Kegiatan Santri"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Penerbit</label>
                  <select
                    value={newCardBrand}
                    onChange={e => setNewCardBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value="BSI Syariah">BSI Syariah</option>
                    <option value="Bank Muamalat">Bank Muamalat</option>
                    <option value="BCA Syariah">BCA Syariah</option>
                    <option value="Mandiri Syariah">Mandiri Syariah</option>
                    <option value="GPN Syariah">GPN Syariah</option>
                    <option value="VISA">VISA</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    value={newCardBalance}
                    onChange={e => setNewCardBalance(e.target.value)}
                    placeholder="5000000"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    required
                  />
                </div>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kartu (Opsional)</label>
                <input
                  type="text"
                  value={newCardNumber}
                  onChange={e => setNewCardNumber(e.target.value)}
                  placeholder="4219 8812 3456 7890"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Color Theme Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Warna Kartu</label>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Blue', grad: 'from-blue-600 via-blue-700 to-indigo-800' },
                    { label: 'Dark Navy', grad: 'from-slate-800 via-slate-900 to-blue-950' },
                    { label: 'Emerald', grad: 'from-emerald-700 via-teal-800 to-slate-900' },
                    { label: 'Purple', grad: 'from-purple-700 via-indigo-800 to-slate-900' },
                    { label: 'Rose', grad: 'from-rose-600 via-pink-700 to-slate-900' },
                    { label: 'Amber', grad: 'from-amber-600 via-orange-700 to-stone-900' }
                  ].map(swatch => (
                    <button
                      key={swatch.label}
                      type="button"
                      onClick={() => setNewCardGradient(swatch.grad)}
                      className={`w-7 h-7 rounded-full bg-gradient-to-tr ${swatch.grad} cursor-pointer transition-transform ${
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
        </div>
      )}

      {/* ======================================================== */}
      {/* CARD LOCKED WARNING MODAL */}
      {/* ======================================================== */}
      {cardLockedNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
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
        </div>
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
                      {/* Top row: Status Badge & Brand */}
                      <div className="flex items-center justify-between">
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
                          {cardBudgetEnabled[card.id] && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              <PieChart className="w-2.5 h-2.5" /> Anggaran
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-black italic tracking-wider">
                          {card.brand}
                        </span>
                      </div>

                      {/* EMV Microchip Graphic */}
                      <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 p-1 border border-amber-400/50 shadow-inner flex flex-col justify-between">
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                        <div className="w-full h-0.5 bg-amber-600/40 rounded-full" />
                      </div>

                      {/* Nominal Saldo Kartu */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200/90 block">
                          Saldo Kartu
                        </span>
                        <div className="text-xl font-black font-mono tracking-tight text-white drop-shadow-xs truncate">
                          {formatMoney(card.balance)}
                        </div>
                      </div>

                      {/* Bottom row: Cardholder only */}
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
                        <span className="uppercase tracking-wider truncate">{card.holder}</span>
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
      {/* MODAL TAMBAH ANGGARAN BARU */}
      {/* ======================================================== */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Pos Anggaran</h3>
                  <p className="text-[11px] text-slate-500">
                    Kartu {activeCard.brand} ({activeCard.type})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBudgetModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sisa Saldo Kartu Info Banner */}
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-blue-100/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Saldo Kartu</span>
                <span className="text-xs font-bold text-slate-800">{formatMoney(activeCard.balance)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">Sisa Saldo Bebas</span>
                <span className="text-xs font-black text-blue-700">
                  {formatMoney(unallocatedBalance)} <span className="text-[10px] font-bold text-slate-500">({unallocatedPercent.toFixed(1)}%)</span>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-3.5">
              {/* 1. Nama Anggaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pos Anggaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operasional Dapur Santri, Honor Asatidz..."
                  value={budgetName}
                  onChange={e => setBudgetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                />
                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Dapur & Konsumsi',
                    'Gaji / Honor Asatidz',
                    'Renovasi Asrama',
                    'Listrik & Air',
                    'Kesehatan & Poskestren',
                    'Sarpras Belajar'
                  ].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBudgetName(chip)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Tujuan Anggaran (Transfer ke Rekening Lain ATAU Kirim Kas) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tujuan Alokasi Dana <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBudgetTargetType('transfer')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      budgetTargetType === 'transfer'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      budgetTargetType === 'transfer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Transfer ke Rekening Lain</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Kirim ke nomor rekening bank</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBudgetTargetType('send')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      budgetTargetType === 'send'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      budgetTargetType === 'send' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Kirim Kas / Pos</div>
                      <div className="text-[10px] text-slate-500 leading-tight">Alokasi divisi atau pengurus</div>
                    </div>
                  </button>
                </div>

                {/* Form fields based on Target Type */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2.5">
                  {budgetTargetType === 'transfer' ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Tujuan</label>
                          <select
                            value={budgetBankName}
                            onChange={e => setBudgetBankName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                            <option value="Bank Muamalat">Bank Muamalat</option>
                            <option value="BCA Syariah">BCA Syariah</option>
                            <option value="Bank Mandiri">Bank Mandiri</option>
                            <option value="Bank BRI">Bank BRI</option>
                            <option value="Bank BNI">Bank BNI</option>
                            <option value="Bank Jatim Syariah">Bank Jatim Syariah</option>
                            <option value="Rekening Bank Lainnya">Rekening Bank Lainnya</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Rekening</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: 7129381928"
                            value={budgetAccountNumber}
                            onChange={e => setBudgetAccountNumber(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Atas Nama Penerima Rekening</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Yayasan Pesantren / CV Mitra Niaga"
                          value={budgetAccountHolder}
                          onChange={e => setBudgetAccountHolder(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Divisi / Penanggung Jawab Penerima</label>
                        <select
                          value={budgetRecipient}
                          onChange={e => setBudgetRecipient(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Pengurus Dapur & Konsumsi">Pengurus Dapur & Konsumsi</option>
                          <option value="Majelis Asatidz & Guru Kitab">Majelis Asatidz & Guru Kitab</option>
                          <option value="Tim Sarana & Prasarana">Tim Sarana & Prasarana</option>
                          <option value="Poskestren & Medis Santri">Poskestren & Medis Santri</option>
                          <option value="Sekretariat Pesantren">Sekretariat Pesantren</option>
                          <option value="Bendahara Operasional Harian">Bendahara Operasional Harian</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Keterangan / Keperluan Penerima</label>
                        <input
                          type="text"
                          placeholder="Contoh: Kas belanja sayur harian & lauk santri"
                          value={budgetNotes}
                          onChange={e => setBudgetNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 3. Jumlah Saldo / Persentase Input Mode */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Besaran Alokasi Saldo <span className="text-rose-500">*</span>
                  </label>
                  {/* Toggle Input Mode */}
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setBudgetAllocType('percentage')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        budgetAllocType === 'percentage'
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Percent className="w-3 h-3" />
                      <span>Persentase (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudgetAllocType('amount')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        budgetAllocType === 'amount'
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Coins className="w-3 h-3" />
                      <span>Nominal (Rp)</span>
                    </button>
                  </div>
                </div>

                {/* Input Fields depending on Mode */}
                {budgetAllocType === 'percentage' ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="relative w-32 shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          step={1}
                          value={budgetPercentage}
                          onChange={e => handlePercentageChange(parseFloat(e.target.value) || 0)}
                          className="w-full pl-3 pr-8 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>

                      {/* Range slider */}
                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={budgetPercentage}
                        onChange={e => handlePercentageChange(parseFloat(e.target.value) || 0)}
                        className="flex-1 accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Quick Percentage Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[10, 20, 25, 35, 50].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handlePercentageChange(pct)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                            budgetPercentage === pct
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                      {unallocatedPercent > 0 && (
                        <button
                          type="button"
                          onClick={() => handlePercentageChange(Math.min(100, Math.round(unallocatedPercent)))}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Sisa Bebas ({Math.min(100, Math.round(unallocatedPercent))}%)
                        </button>
                      )}
                    </div>

                    {/* Calculation Preview */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Nominal Ekuivalen:</span>
                      <span className="font-extrabold text-blue-700">
                        {formatMoney(Math.round((budgetPercentage / 100) * activeCard.balance))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        min={1}
                        max={activeCard.balance}
                        step={50000}
                        required
                        placeholder="0"
                        value={budgetAmountInput}
                        onChange={e => handleAmountChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                      />
                    </div>

                    {/* Quick Amount Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[500000, 1000000, 2500000, 5000000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleAmountChange(amt.toString())}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {amt >= 1000000 ? `${amt / 1000000} Jt` : `${amt / 1000} Rb`}
                        </button>
                      ))}
                      {unallocatedBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => handleAmountChange(unallocatedBalance.toString())}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          Maksimal Bebas
                        </button>
                      )}
                    </div>

                    {/* Calculation Preview */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Persentase Ekuivalen:</span>
                      <span className="font-extrabold text-blue-700">
                        {activeCard.balance > 0
                          ? ((parseFloat(budgetAmountInput) || 0) / activeCard.balance * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Pos Anggaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL KONFIRMASI PENYALURAN DANA ANGGARAN */}
      {/* ======================================================== */}
      {disburseConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Salurkan Pos Anggaran</h3>
                <p className="text-[11px] text-slate-500">Pencairan resmi dari saldo kartu</p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pos Anggaran</span>
                  <span className="text-xs font-bold text-slate-800">{disburseConfirmItem.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tujuan Penyaluran</span>
                  <span className="text-xs font-semibold text-slate-700">{disburseConfirmItem.targetDetail}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Nominal Penyaluran</span>
                  <span className="text-sm font-extrabold text-blue-600">
                    {formatMoney(disburseConfirmItem.amount)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-[11px] text-blue-900 leading-snug">
                Setelah disalurkan, saldo kartu <strong>{activeCard.brand}</strong> akan terpotong dan transaksi akan dicatat pada riwayat transaksi pengeluaran.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDisburseConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDisburse}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Konfirmasi & Salurkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PERINGATAN KUNCI ANGGARAN (BUDGET LOCKED NOTICE) */}
      {/* ======================================================== */}
      {showBudgetLockedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
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
        </div>
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
