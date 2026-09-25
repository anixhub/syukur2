import React, { useState, useEffect } from 'react';
import { X, Wallet as WalletIcon, Building2, Smartphone, PiggyBank, CircleDollarSign, Check, HelpCircle } from 'lucide-react';
import { Wallet, WalletType } from '../../types';
import { WALLET_COLORS, formatIDR } from './walletUtils';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (walletData: Partial<Wallet>) => void;
  initialData?: Wallet | null;
}

export default function WalletModal({ isOpen, onClose, onSave, initialData }: WalletModalProps) {
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<WalletType>('bank');
  const [nomorRekening, setNomorRekening] = useState('');
  const [atasNama, setAtasNama] = useState('');
  const [saldo, setSaldo] = useState<number | ''>(0);
  const [warna, setWarna] = useState('emerald');
  const [keterangan, setKeterangan] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama);
      setTipe(initialData.tipe);
      setNomorRekening(initialData.nomorRekening || '');
      setAtasNama(initialData.atasNama || '');
      setSaldo(initialData.saldo);
      setWarna(initialData.warna || 'emerald');
      setKeterangan(initialData.keterangan || '');
      setIsDefault(!!initialData.isDefault);
    } else {
      setNama('');
      setTipe('bank');
      setNomorRekening('');
      setAtasNama('Pondok Pesantren');
      setSaldo(0);
      setWarna('emerald');
      setKeterangan('');
      setIsDefault(false);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!nama.trim()) {
      newErrors.nama = 'Nama dompet wajib diisi';
    }
    if (saldo === '' || Number.isNaN(Number(saldo))) {
      newErrors.saldo = 'Saldo wajib diisi angka valid';
    } else if (Number(saldo) < 0) {
      newErrors.saldo = 'Saldo tidak boleh negatif';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      nama: nama.trim(),
      tipe,
      nomorRekening: nomorRekening.trim() || undefined,
      atasNama: atasNama.trim() || undefined,
      saldo: Number(saldo) || 0,
      warna,
      keterangan: keterangan.trim() || undefined,
      isDefault
    });
    onClose();
  };

  const typeOptions: { type: WalletType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { type: 'cash', label: 'Kas Tunai / Brankas', icon: CircleDollarSign },
    { type: 'bank', label: 'Rekening Bank', icon: Building2 },
    { type: 'ewallet', label: 'E-Wallet / QRIS', icon: Smartphone },
    { type: 'saving', label: 'Tabungan Santri', icon: PiggyBank },
    { type: 'other', label: 'Lainnya', icon: WalletIcon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-500/20">
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Dompet Keuangan' : 'Buat Dompet Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                {initialData ? 'Perbarui informasi dan rincian dompet ini' : 'Tambahkan rekening bank, kas tunai, atau dompet digital'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Tipe Dompet */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipe Dompet <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = tipe === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setTipe(opt.type)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold ring-1 ring-blue-500/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nama Dompet */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Dompet <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Bank BSI - Rekening Syahriah / Kas Tunai Pusat"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-800 text-xs focus:outline-none focus:ring-2 ${
                errors.nama ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
            />
            {errors.nama && <p className="text-rose-500 text-[11px] mt-1">{errors.nama}</p>}
          </div>

          {/* Nomor Rekening & Atas Nama */}
          {tipe !== 'cash' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Rekening / No. Akun
                </label>
                <input
                  type="text"
                  value={nomorRekening}
                  onChange={(e) => setNomorRekening(e.target.value)}
                  placeholder="Contoh: 7148-2930-11"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Atas Nama (A/N)
                </label>
                <input
                  type="text"
                  value={atasNama}
                  onChange={(e) => setAtasNama(e.target.value)}
                  placeholder="Contoh: Yayasan Pondok Pesantren"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Saldo Awal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              {initialData ? 'Penyesuaian Saldo' : 'Saldo Awal'} (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 ${
                  errors.saldo ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
            </div>
            {saldo !== '' && (
              <p className="text-[11px] text-slate-500 mt-1">
                Format: <span className="font-bold text-slate-700">{formatIDR(Number(saldo) || 0)}</span>
              </p>
            )}
            {errors.saldo && <p className="text-rose-500 text-[11px] mt-1">{errors.saldo}</p>}
          </div>

          {/* Pilihan Warna Kartu */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Warna Tema Kartu
            </label>
            <div className="flex flex-wrap gap-2.5">
              {WALLET_COLORS.map((col) => {
                const isSelected = warna === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setWarna(col.id)}
                    className={`w-8 h-8 rounded-full ${col.bgClass} flex items-center justify-center transition-all cursor-pointer ${
                      isSelected ? 'ring-3 ring-blue-500 ring-offset-2 scale-110 shadow-sm' : 'opacity-85 hover:opacity-100'
                    }`}
                    title={col.name}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keterangan / Fungsi Dompet (Opsional)
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Digunakan untuk alokasi belanja logistik dapur dan harian..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Jadikan Dompet Utama */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultWallet"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="isDefaultWallet" className="text-xs text-slate-700 cursor-pointer select-none">
              Jadikan dompet utama (default untuk transaksi kas)
            </label>
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {initialData ? 'Simpan Perubahan' : 'Buat Dompet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
