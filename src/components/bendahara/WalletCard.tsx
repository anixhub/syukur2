import React, { useState } from 'react';
import { 
  Building2, 
  CircleDollarSign, 
  Smartphone, 
  PiggyBank, 
  Wallet as WalletIcon, 
  Copy, 
  Check, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Star,
  Edit2,
  Trash2,
  Filter
} from 'lucide-react';
import { Wallet, WalletTransactionType } from '../../types';
import { WALLET_COLORS, formatIDR } from './walletUtils';

interface WalletCardProps {
  wallet: Wallet;
  isSelected?: boolean;
  onSelect: (walletId: string) => void;
  onAction: (walletId: string, action: WalletTransactionType) => void;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
  onSetDefault?: (walletId: string) => void;
}

export default function WalletCard({
  wallet,
  isSelected,
  onSelect,
  onAction,
  onEdit,
  onDelete,
  onSetDefault
}: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const colorConfig = WALLET_COLORS.find(c => c.id === wallet.warna) || WALLET_COLORS[0];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wallet.nomorRekening) {
      navigator.clipboard.writeText(wallet.nomorRekening);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTypeIcon = () => {
    switch (wallet.tipe) {
      case 'cash':
        return <CircleDollarSign className="w-4 h-4" />;
      case 'bank':
        return <Building2 className="w-4 h-4" />;
      case 'ewallet':
        return <Smartphone className="w-4 h-4" />;
      case 'saving':
        return <PiggyBank className="w-4 h-4" />;
      default:
        return <WalletIcon className="w-4 h-4" />;
    }
  };

  const getTypeName = () => {
    switch (wallet.tipe) {
      case 'cash':
        return 'Kas Tunai';
      case 'bank':
        return 'Rekening Bank';
      case 'ewallet':
        return 'E-Wallet / QRIS';
      case 'saving':
        return 'Tabungan Santri';
      default:
        return 'Dompet Keuangan';
    }
  };

  return (
    <div 
      onClick={() => onSelect(wallet.id)}
      className={`relative group rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden border ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-md border-blue-300 bg-white'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Top Banner Accent */}
      <div className={`h-2.5 w-full bg-gradient-to-r ${colorConfig.gradient}`} />

      <div className="p-4 space-y-3">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${colorConfig.bgClass} text-white shadow-xs shrink-0`}>
              {getTypeIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {getTypeName()}
                </span>
                {wallet.isDefault && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    Utama
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate" title={wallet.nama}>
                {wallet.nama}
              </h4>
            </div>
          </div>

          {/* 3-Dots Menu */}
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 text-xs animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onSelect(wallet.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>Filter Riwayat Ini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(wallet);
                    }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Dompet</span>
                  </button>

                  {onSetDefault && !wallet.isDefault && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onSetDefault(wallet.id);
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>Jadikan Default</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(wallet);
                    }}
                    className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Hapus Dompet</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Account Number & Atas Nama */}
        {wallet.nomorRekening ? (
          <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
            <div className="truncate">
              <span className="font-mono font-semibold text-slate-800">{wallet.nomorRekening}</span>
              {wallet.atasNama && (
                <span className="text-slate-400 text-[10px] block truncate">a/n {wallet.atasNama}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors shrink-0 ml-1 cursor-pointer"
              title="Salin Nomor Rekening"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 truncate">
            {wallet.keterangan || 'Uang kas fisik di kantor bendahara'}
          </div>
        )}

        {/* Saldo Display */}
        <div className="pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Saldo Tersedia
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formatIDR(wallet.saldo)}
          </span>
        </div>

        {/* Action Buttons: Bayar, Transfer, Terima */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
          {/* Terima */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction(wallet.id, 'terima');
            }}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer border border-emerald-200/60"
            title="Terima / Masukkan Uang ke Dompet Ini"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Terima</span>
          </button>

          {/* Bayar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction(wallet.id, 'bayar');
            }}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer border border-rose-200/60"
            title="Bayar / Keluarkan Uang dari Dompet Ini"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Bayar</span>
          </button>

          {/* Transfer */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction(wallet.id, 'transfer');
            }}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer border border-blue-200/60"
            title="Transfer ke Dompet Lain"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
            <span>Transfer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
