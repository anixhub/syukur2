import React from 'react';
import { X, Printer, CheckCircle2, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Building2, Calendar, FileText } from 'lucide-react';
import { WalletTransaction } from '../../types';
import { formatIDR, angkaKeTerbilang } from './walletUtils';

interface WalletReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: WalletTransaction | null;
}

export default function WalletReceiptModal({ isOpen, onClose, transaction }: WalletReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isIncome = transaction.tipe === 'terima';
  const isExpense = transaction.tipe === 'bayar';
  const isTransfer = transaction.tipe === 'transfer';

  const dateFormatted = new Date(transaction.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none print:max-w-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/70 print:hidden">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Bukti Transaksi Digital
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kuitansi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 text-slate-800 space-y-5 print:p-8">
          {/* Header Pesantren */}
          <div className="text-center border-b border-dashed border-slate-200 pb-4 space-y-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 mb-1 ring-1 ring-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
              Pondok Pesantren Go AttarOkey
            </h2>
            <p className="text-[11px] text-slate-500">
              Bagian Keuangan & Bendahara Umum Pesantren
            </p>
            <div className="pt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isIncome 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : isExpense 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isIncome && <ArrowDownLeft className="w-3 h-3" />}
                {isExpense && <ArrowUpRight className="w-3 h-3" />}
                {isTransfer && <ArrowRightLeft className="w-3 h-3" />}
                {isIncome ? 'Kuitansi Pemasukan (Terima)' : isExpense ? 'Bukti Pengeluaran (Bayar)' : 'Bukti Transfer Antar Dompet'}
              </span>
            </div>
          </div>

          {/* Transaction Summary Box */}
          <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <p className="text-[11px] font-medium text-slate-500">Total Nominal Transaksi</p>
            <p className={`text-2xl font-black ${
              isIncome ? 'text-emerald-600' : isExpense ? 'text-rose-600' : 'text-blue-600'
            }`}>
              {formatIDR(transaction.nominal)}
            </p>
            <p className="text-[11px] font-medium text-slate-600 italic px-4">
              &quot;{angkaKeTerbilang(transaction.nominal)}&quot;
            </p>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">No. Bukti / Ref</span>
              <span className="font-mono font-bold text-slate-800">
                {transaction.nomorReferensi || transaction.id}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Waktu Transaksi</span>
              <span className="font-medium text-slate-800 text-right">
                {dateFormatted}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">
                {isTransfer ? 'Dompet Sumber' : 'Dompet Keuangan'}
              </span>
              <span className="font-bold text-slate-800 text-right">
                {transaction.walletName || 'Dompet Pesantren'}
              </span>
            </div>

            {isTransfer && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Dompet Tujuan</span>
                <span className="font-bold text-blue-700 text-right">
                  {transaction.targetWalletName || 'Dompet Penerima'}
                </span>
              </div>
            )}

            {isTransfer && transaction.biayaAdmin ? (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Biaya Admin Bank</span>
                <span className="font-medium text-slate-700 text-right">
                  {formatIDR(transaction.biayaAdmin)}
                </span>
              </div>
            ) : null}

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Kategori</span>
              <span className="font-semibold text-slate-800 text-right">
                {transaction.kategori || '-'}
              </span>
            </div>

            {transaction.pihakTerkait && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">
                  {isIncome ? 'Diterima Dari' : 'Dibayarkan Kepada'}
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {transaction.pihakTerkait}
                </span>
              </div>
            )}

            {transaction.catatan && (
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Catatan / Keterangan:</span>
                <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-700 border border-slate-100 leading-relaxed">
                  {transaction.catatan}
                </div>
              </div>
            )}
          </div>

          {/* Footer Signature Block */}
          <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px]">
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px]">Tervalidasi Digital</p>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>SAH & TERCATAT</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px]">Bendahara Pesantren</p>
              <p className="font-bold text-slate-700 mt-1">Bagian Keuangan</p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
