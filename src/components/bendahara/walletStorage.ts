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

export interface TransactionItem {
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

export const DEFAULT_WALLET_CARDS: WalletCard[] = [
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
];

export const INITIAL_TRANSACTIONS: TransactionItem[] = [
  // Card 1 (c-1: Rekening Utama)
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

  // Card 2 (c-2: Rekening Tagihan & Pengadaan)
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

const STORAGE_KEY_CARDS = 'smartsantri_wallet_cards';
const STORAGE_KEY_TXS = 'smartsantri_wallet_transactions';
const STORAGE_KEY_TODAY_INCOME = 'smartsantri_wallet_today_income';

export function getStoredWalletCards(): WalletCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CARDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse wallet cards from localStorage', e);
  }
  // Simpan default jika belum ada
  saveStoredWalletCards(DEFAULT_WALLET_CARDS);
  return DEFAULT_WALLET_CARDS;
}

export function saveStoredWalletCards(cards: WalletCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save wallet cards to localStorage', e);
  }
}

export function getStoredWalletTransactions(): TransactionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TXS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse wallet transactions from localStorage', e);
  }
  saveStoredWalletTransactions(INITIAL_TRANSACTIONS);
  return INITIAL_TRANSACTIONS;
}

export function saveStoredWalletTransactions(txs: TransactionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save wallet transactions to localStorage', e);
  }
}

export interface WalletPaymentIncomePayload {
  cardId: string;
  amount: number;
  itemName: string;
  santriName: string;
  receiptNumber: string;
  paymentMethod?: string;
}

export function addWalletPaymentIncome(payload: WalletPaymentIncomePayload): void {
  const cards = getStoredWalletCards();
  const cardIndex = cards.findIndex(c => c.id === payload.cardId);
  
  if (cardIndex !== -1) {
    cards[cardIndex].balance += payload.amount;
    saveStoredWalletCards(cards);
  } else if (cards.length > 0) {
    // Fallback ke kartu pertama jika id kartu tidak ditemukan
    cards[0].balance += payload.amount;
    saveStoredWalletCards(cards);
  }

  const txs = getStoredWalletTransactions();
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const targetCardId = cardIndex !== -1 ? payload.cardId : cards[0]?.id || 'c-1';
  const cleanMethod = payload.paymentMethod || 'Kasir Pondok';

  const newTx: TransactionItem = {
    id: `tx-pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    cardId: targetCardId,
    name: `Pembayaran: ${payload.itemName} - ${payload.santriName} (${cleanMethod})`,
    date: dateStr,
    amount: payload.amount,
    type: 'income',
    status: 'Selesai',
    logoType: 'td',
    logoColor: 'bg-emerald-600',
    logoLetter: payload.itemName ? payload.itemName.trim().slice(0, 2).toUpperCase() : 'SP'
  };

  const updatedTxs = [newTx, ...txs];
  saveStoredWalletTransactions(updatedTxs);

  // Update akumulasi pemasukan hari ini
  try {
    const currIncome = parseInt(localStorage.getItem(STORAGE_KEY_TODAY_INCOME) || '0', 10);
    localStorage.setItem(STORAGE_KEY_TODAY_INCOME, (currIncome + payload.amount).toString());
  } catch (e) {}

  // Broadcast event agar sub-modul Wallet langsung ter-update secara real-time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartsantri_wallet_updated', {
      detail: {
        cardId: targetCardId,
        amount: payload.amount,
        itemName: payload.itemName
      }
    }));
  }
}
