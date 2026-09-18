import { Santri, Surat, KeamananRecord, BendaharaRecord, KelasPendidikan, HumasAgenda, RombelAssignment, PerizinanRecord, Wallet, WalletTransaction } from './types';

export const INITIAL_SANTRI: Santri[] = [];
export const INITIAL_SURAT: Surat[] = [];
export const INITIAL_KEAMANAN: KeamananRecord[] = [];
export const INITIAL_BENDAHARA: BendaharaRecord[] = [];
export const INITIAL_PENDIDIKAN: KelasPendidikan[] = [];
export const INITIAL_HUMAS: HumasAgenda[] = [];
export const INITIAL_ASSIGNMENTS: RombelAssignment[] = [];
export const INITIAL_PERIZINAN: PerizinanRecord[] = [];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'w-1',
    nama: 'Kas Tunai Bendahara',
    tipe: 'cash',
    saldo: 14750000,
    warna: 'emerald',
    keterangan: 'Kas tunai fisik operasional harian di brankas bendahara pusat',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w-2',
    nama: 'Bank BSI - Rekening Utama',
    tipe: 'bank',
    nomorRekening: '7148-2930-11',
    atasNama: 'Pondok Pesantren - Rek Syahriah',
    saldo: 58450000,
    warna: 'teal',
    keterangan: 'Penerimaan syahriah santri, donasi wali, dan transfer resmi',
    createdAt: new Date().toISOString()
  },
  {
    id: 'w-3',
    nama: 'Bank Mandiri - Sarpras & Proyek',
    tipe: 'bank',
    nomorRekening: '137-00-984210-4',
    atasNama: 'Yayasan Pondok Pesantren',
    saldo: 28750000,
    warna: 'blue',
    keterangan: 'Alokasi pembangunan gedung, pemeliharaan asrama & sarana prasarana',
    createdAt: new Date().toISOString()
  },
  {
    id: 'w-4',
    nama: 'QRIS & E-Wallet Infaq',
    tipe: 'ewallet',
    nomorRekening: '0812-9876-5432',
    atasNama: 'QRIS Santri Berkah',
    saldo: 4620000,
    warna: 'indigo',
    keterangan: 'Infaq harian digital, kas kotak amal masjid, dan stand pesantren',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-1',
    walletId: 'w-2',
    walletName: 'Bank BSI - Rekening Utama',
    tipe: 'terima',
    nominal: 1200000,
    kategori: 'Syahriah Santri',
    pihakTerkait: 'Wali Santri Ahmad Fauzi (Kamar Al-Ghazali 02)',
    tanggal: new Date(Date.now() - 3600000 * 4).toISOString(),
    catatan: 'Pembayaran syahriah bulanan + uang saku tabungan santri',
    nomorReferensi: 'BSI-REF-89421',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'tx-2',
    walletId: 'w-4',
    walletName: 'QRIS & E-Wallet Infaq',
    tipe: 'terima',
    nominal: 850000,
    kategori: 'Infaq & Shadaqah',
    pihakTerkait: 'Jamaah Kajian Ahad Pagi',
    tanggal: new Date(Date.now() - 3600000 * 18).toISOString(),
    catatan: 'Perolehan infaq digital QRIS barcode pintu utama masjid',
    nomorReferensi: 'QRIS-TX-3301',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'tx-3',
    walletId: 'w-2',
    walletName: 'Bank BSI - Rekening Utama',
    targetWalletId: 'w-1',
    targetWalletName: 'Kas Tunai Bendahara',
    tipe: 'transfer',
    nominal: 5000000,
    biayaAdmin: 0,
    kategori: 'Pindah Kas Tunai',
    pihakTerkait: 'Penarikan Kas Operasional',
    tanggal: new Date(Date.now() - 86400000 * 1).toISOString(),
    catatan: 'Penarikan kas tunai BSI ke brankas untuk belanja logistik dapur santri',
    nomorReferensi: 'TRF-INT-0012',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'tx-4',
    walletId: 'w-1',
    walletName: 'Kas Tunai Bendahara',
    tipe: 'bayar',
    nominal: 3450000,
    kategori: 'Dapur & Logistik',
    pihakTerkait: 'Agen Beras & Pasar Sayur Berkah',
    tanggal: new Date(Date.now() - 86400000 * 2).toISOString(),
    catatan: 'Belanja mingguan beras 5 karung, telur, minyak goreng & bumbu dapur',
    nomorReferensi: 'NOTA-PS-771',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'tx-5',
    walletId: 'w-2',
    walletName: 'Bank BSI - Rekening Utama',
    tipe: 'bayar',
    nominal: 2480000,
    kategori: 'Listrik, Air & Internet',
    pihakTerkait: 'PLN & Provider Internet Pesantren',
    tanggal: new Date(Date.now() - 86400000 * 3).toISOString(),
    catatan: 'Pembayaran token listrik asrama putra-putri & kuota bandwidth fiber',
    nomorReferensi: 'PLN-AUT-902',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'tx-6',
    walletId: 'w-3',
    walletName: 'Bank Mandiri - Sarpras & Proyek',
    tipe: 'terima',
    nominal: 10000000,
    kategori: 'Donasi Pembangunan',
    pihakTerkait: 'Hamba Allah (Alumni Angkatan 2015)',
    tanggal: new Date(Date.now() - 86400000 * 5).toISOString(),
    catatan: 'Wakaf material keramik lantai 2 gedung tahfidz baru',
    nomorReferensi: 'MDR-DON-081',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];
