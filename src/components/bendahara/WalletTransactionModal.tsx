import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  AlertCircle, 
  Calendar, 
  Tag, 
  FileText, 
  User, 
  CheckCircle2, 
  Wallet as WalletIcon 
} from 'lucide-react';
import { Wallet, WalletTransaction, WalletTransactionType } from '../../types';
import { CATEGORIES_BAYAR, CATEGORIES_TERIMA, formatIDR } from './walletUtils';

interface WalletTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  initialWalletId?: string;
  initialType?: WalletTransactionType;
  onSaveTransaction: (tx: {
    tipe: WalletTransactionType;
    walletId: string;
    targetWalletId?: string;
    nominal: number;
    biayaAdmin?: number;
    kategori: string;
    pihakTerkait?: string;
    tanggal: string;
    catatan?: string;
    nomorReferensi?: string;
  }) => void;
}

export default function WalletTransactionModal({
  isOpen,
  onClose,
  wallets,
  initialWalletId,
  initialType = 'terima',
  onSaveTransaction
}: WalletTransactionModalProps) {
  const [activeType, setActiveType] = useState<WalletTransactionType>(initialType);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [targetWalletId, setTargetWalletId] = useState<string>('');
  const [nominal, setNominal] = useState<number | ''>('');
  const [biayaAdmin, setBiayaAdmin] = useState<number | ''>(0);
  const [kategori, setKategori] = useState<string>('');
  const [pihakTerkait, setPihakTerkait] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [catatan, setCatatan] = useState<string>('');
  const [nomorReferensi, setNomorReferensi] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      const defaultWallet = initialWalletId 
        ? initialWalletId 
        : (wallets.find(w => w.isDefault)?.id || wallets[0]?.id || '');
      setSelectedWalletId(defaultWallet);

      // default destination for transfer
      const otherWallet = wallets.find(w => w.id !== defaultWallet);
      setTargetWalletId(otherWallet?.id || '');

      setNominal('');
      setBiayaAdmin(0);
      setKategori(initialType === 'bayar' ? CATEGORIES_BAYAR[0] : initialType === 'terima' ? CATEGORIES_TERIMA[0] : 'Pindah Saldo Kas');
      setPihakTerkait('');
      setTanggal(new Date().toISOString().slice(0, 16));
      setCatatan('');
      setNomorReferensi('');
      setError('');
    }
  }, [isOpen, initialWalletId, initialType, wallets]);

  // When activeType changes, adjust category preset
  const handleTypeChange = (type: WalletTransactionType) => {
    setActiveType(type);
    setError('');
    if (type === 'bayar') {
      setKategori(CATEGORIES_BAYAR[0]);
    } else if (type === 'terima') {
      setKategori(CATEGORIES_TERIMA[0]);
    } else {
      setKategori('Pindah Saldo Kas');
    }
  };

  if (!isOpen) return null;

  const currentSourceWallet = wallets.find(w => w.id === selectedWalletId);
  const currentTargetWallet = wallets.find(w => w.id === targetWalletId);

  const quickNominals = [50000, 100000, 250000, 500000, 1000000, 2500000, 5000000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numNominal = Number(nominal);
    if (!numNominal || numNominal <= 0) {
      setError('Masukkan jumlah nominal yang valid (lebih dari 0).');
      return;
    }

    if (!selectedWalletId) {
      setError('Pilih dompet yang bersangkutan.');
      return;
    }

    const numBiayaAdmin = Number(biayaAdmin) || 0;

    // Validation for Bayar: check balance
    if (activeType === 'bayar') {
      if (currentSourceWallet && currentSourceWallet.saldo < numNominal) {
        setError(`Saldo dompet "${currentSourceWallet.nama}" tidak mencukupi. Saldo saat ini: ${formatIDR(currentSourceWallet.saldo)}.`);
        return;
      }
    }

    // Validation for Transfer: check destination & balance
    if (activeType === 'transfer') {
      if (!targetWalletId) {
        setError('Pilih dompet tujuan transfer.');
        return;
      }
      if (targetWalletId === selectedWalletId) {
        setError('Dompet tujuan tidak boleh sama dengan dompet sumber.');
        return;
      }
      const totalOut = numNominal + numBiayaAdmin;
      if (currentSourceWallet && currentSourceWallet.saldo < totalOut) {
        setError(`Saldo dompet asal "${currentSourceWallet.nama}" tidak cukup (${formatIDR(currentSourceWallet.saldo)}). Dibutuhkan: ${formatIDR(totalOut)}.`);
        return;
      }
    }

    onSaveTransaction({
      tipe: activeType,
      walletId: selectedWalletId,
      targetWalletId: activeType === 'transfer' ? targetWalletId : undefined,
      nominal: numNominal,
      biayaAdmin: activeType === 'transfer' ? numBiayaAdmin : undefined,
      kategori: kategori.trim() || (activeType === 'transfer' ? 'Transfer Antar Dompet' : 'Umum'),
      pihakTerkait: pihakTerkait.trim() || undefined,
      tanggal: new Date(tanggal).toISOString(),
      catatan: catatan.trim() || undefined,
      nomorReferensi: nomorReferensi.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Type Selector */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kelola Transaksi Dompet
              </h3>
              <p className="text-xs text-slate-500">
                Catat penerimaan uang, pengeluaran operasional, atau mutasi dana antar dompet
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Main Action Tabs: Terima, Bayar, Transfer */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('terima')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'terima'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Terima (Masuk)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('bayar')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'bayar'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Bayar (Keluar)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'transfer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer (Pindah)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Wallet Selection */}
          {activeType === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-blue-50/40 border border-blue-100">
              {/* Dompet Asal */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Dari Dompet (Sumber)
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nama} ({formatIDR(w.saldo)})
                    </option>
                  ))}
                </select>
                {currentSourceWallet && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Sisa Saldo: <span className="font-semibold text-slate-700">{formatIDR(currentSourceWallet.saldo)}</span>
                  </p>
                )}
              </div>

              {/* Dompet Tujuan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Ke Dompet (Tujuan)
                </label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Pilih Dompet Tujuan --</option>
                  {wallets
                    .filter((w) => w.id !== selectedWalletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama} ({formatIDR(w.saldo)})
                      </option>
                    ))}
                </select>
                {currentTargetWallet && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Saldo Tujuan: <span className="font-semibold text-slate-700">{formatIDR(currentTargetWallet.saldo)}</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {activeType === 'bayar' ? 'Pilih Dompet Sumber Pembayaran' : 'Pilih Dompet Penerima Dana'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nama} - Saldo: {formatIDR(w.saldo)} {w.nomorRekening ? `(${w.nomorRekening})` : ''}
                  </option>
                ))}
              </select>
              {currentSourceWallet && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 px-1">
                  <span>Tipe: <strong className="capitalize">{currentSourceWallet.tipe}</strong></span>
                  <span>Saldo Saat Ini: <strong className={activeType === 'bayar' ? 'text-rose-600' : 'text-emerald-600'}>{formatIDR(currentSourceWallet.saldo)}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Nominal Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
              </label>
              {nominal !== '' && (
                <span className="text-xs font-bold text-blue-600">
                  {formatIDR(Number(nominal) || 0)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                Rp
              </span>
              <input
                type="number"
                min="100"
                step="1000"
                value={nominal}
                onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Quick Nominal Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNominals.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setNominal(q)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  +{q >= 1000000 ? `${q / 1000000}jt` : `${q / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Biaya Admin for Transfer */}
          {activeType === 'transfer' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Biaya Admin / Transfer Bank (Opsional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={biayaAdmin}
                  onChange={(e) => setBiayaAdmin(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Biaya admin dipotong dari dompet asal bersamaan dengan nominal transfer.
              </p>
            </div>
          )}

          {/* Kategori & Pihak Terkait (Bayar & Terima) */}
          {activeType !== 'transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori {activeType === 'bayar' ? 'Pengeluaran' : 'Pemasukan'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {(activeType === 'bayar' ? CATEGORIES_BAYAR : CATEGORIES_TERIMA).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {activeType === 'bayar' ? 'Dibayarkan Kepada' : 'Diterima Dari'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pihakTerkait}
                    onChange={(e) => setPihakTerkait(e.target.value)}
                    placeholder={activeType === 'bayar' ? 'Nama toko / vendor / guru' : 'Nama penyetor / donatur / wali santri'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tanggal & No Referensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal & Waktu Transaksi
              </label>
              <input
                type="datetime-local"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                No. Referensi / Nota (Opsional)
              </label>
              <input
                type="text"
                value={nomorReferensi}
                onChange={(e) => setNomorReferensi(e.target.value)}
                placeholder="Contoh: INV-2026-001 / BSI-TRF"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan / Deskripsi Transaksi
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder={
                activeType === 'transfer'
                  ? 'Contoh: Penarikan kas operasional dapur santri dari rekening utama BSI...'
                  : activeType === 'bayar'
                  ? 'Contoh: Pembelian sembako 5 karung beras & minyak goreng...'
                  : 'Contoh: Infaq jamaah pengajian selapanan...'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer active:scale-98 flex items-center gap-1.5 ${
                activeType === 'terima'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : activeType === 'bayar'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {activeType === 'terima' && <ArrowDownLeft className="w-3.5 h-3.5" />}
              {activeType === 'bayar' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {activeType === 'transfer' && <ArrowRightLeft className="w-3.5 h-3.5" />}
              <span>
                {activeType === 'terima'
                  ? 'Simpan Penerimaan'
                  : activeType === 'bayar'
                  ? 'Konfirmasi Pembayaran'
                  : 'Proses Transfer Saldo'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
