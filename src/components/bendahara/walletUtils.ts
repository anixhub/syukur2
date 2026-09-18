export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

export const angkaKeTerbilang = (n: number): string => {
  if (n === 0) return 'Nol Rupiah';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  const konversi = (num: number): string => {
    num = Math.floor(num);
    if (num < 12) return ' ' + satuan[num];
    if (num < 20) return konversi(num - 10) + ' Belas';
    if (num < 100) return konversi(Math.floor(num / 10)) + ' Puluh' + konversi(num % 10);
    if (num < 200) return ' Seratus' + konversi(num - 100);
    if (num < 1000) return konversi(Math.floor(num / 100)) + ' Ratus' + konversi(num % 100);
    if (num < 2000) return ' Seribu' + konversi(num - 1000);
    if (num < 1000000) return konversi(Math.floor(num / 1000)) + ' Ribu' + konversi(num % 1000);
    if (num < 1000000000) return konversi(Math.floor(num / 1000000)) + ' Juta' + konversi(num % 1000000);
    if (num < 1000000000000) return konversi(Math.floor(num / 1000000000)) + ' Milyar' + konversi(num % 1000000000);
    return konversi(Math.floor(num / 1000000000000)) + ' Triliun' + konversi(num % 1000000000000);
  };

  return (konversi(Math.abs(n)).trim() + ' Rupiah').replace(/\s+/g, ' ');
};

export const WALLET_COLORS = [
  { id: 'emerald', name: 'Emerald Hijau', bgClass: 'bg-emerald-600', textClass: 'text-emerald-700', borderClass: 'border-emerald-200', gradient: 'from-emerald-700 to-teal-800' },
  { id: 'teal', name: 'Teal Toska', bgClass: 'bg-teal-600', textClass: 'text-teal-700', borderClass: 'border-teal-200', gradient: 'from-teal-700 to-cyan-800' },
  { id: 'blue', name: 'Royal Blue', bgClass: 'bg-blue-600', textClass: 'text-blue-700', borderClass: 'border-blue-200', gradient: 'from-blue-700 to-indigo-800' },
  { id: 'indigo', name: 'Indigo Ungu', bgClass: 'bg-indigo-600', textClass: 'text-indigo-700', borderClass: 'border-indigo-200', gradient: 'from-indigo-700 to-purple-800' },
  { id: 'purple', name: 'Deep Purple', bgClass: 'bg-purple-600', textClass: 'text-purple-700', borderClass: 'border-purple-200', gradient: 'from-purple-700 to-violet-800' },
  { id: 'rose', name: 'Rose Merah', bgClass: 'bg-rose-600', textClass: 'text-rose-700', borderClass: 'border-rose-200', gradient: 'from-rose-700 to-pink-800' },
  { id: 'amber', name: 'Amber Emas', bgClass: 'bg-amber-600', textClass: 'text-amber-700', borderClass: 'border-amber-200', gradient: 'from-amber-600 to-orange-700' },
  { id: 'slate', name: 'Slate Abu Gelap', bgClass: 'bg-slate-700', textClass: 'text-slate-700', borderClass: 'border-slate-300', gradient: 'from-slate-800 to-slate-900' },
];

export const CATEGORIES_BAYAR = [
  'Dapur & Logistik Santri',
  'Honor Asatidz & Karyawan',
  'Listrik, Air & Internet',
  'Pemeliharaan & Sarana Prasarana',
  'ATK & Perlengkapan Kantor',
  'Kegiatan Santri & PHBI',
  'Konsumsi & Tamu Pesantren',
  'Kesehatan & Pengobatan Santri',
  'Transportasi & Operasional',
  'Lain-lain'
];

export const CATEGORIES_TERIMA = [
  'Syahriah Santri',
  'Infaq & Shadaqah',
  'Donasi Pembangunan',
  'Wakaf Tunai',
  'Penjualan Koperasi & Kantin',
  'Pendaftaran Santri Baru',
  'Hibah & Bantuan Pemerintah',
  'Bagi Hasil Simpanan',
  'Lain-lain'
];
