import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Share2, CheckCircle, X, ArrowRight, Wallet, User, Calendar, Receipt } from 'lucide-react';
import { PaymentReceipt } from './pembayaranTypes';

interface PaymentReceiptModalProps {
  receipt: PaymentReceipt | null;
  onClose: () => void;
  onNewTransaction: () => void;
}

export default function PaymentReceiptModal({
  receipt,
  onClose,
  onNewTransaction
}: PaymentReceiptModalProps) {
  // Lock body scroll when receipt modal is open
  useEffect(() => {
    if (receipt) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [receipt]);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = (receipt.waliPhone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;

    const itemsText = receipt.items
      .map((item, idx) => `${idx + 1}. ${item.name} : Rp ${item.amount.toLocaleString('id-ID')}`)
      .join('%0A');

    const message = `*BUKTI PEMBAYARAN PESANTREN*%0A` +
      `No. Bukti: ${receipt.receiptNumber}%0A` +
      `Tanggal: ${receipt.paymentDate}%0A` +
      `Santri: ${receipt.santriNama} (NIS: ${receipt.santriNis})%0A` +
      `Kelas / Kamar: ${receipt.santriKelas || '-'} / ${receipt.santriKamar || '-'}%0A%0A` +
      `*Rincian Pembayaran:*%0A${itemsText}%0A%0A` +
      `*Total: Rp ${receipt.totalAmount.toLocaleString('id-ID')}*%0A` +
      `Metode: ${receipt.paymentMethod.toUpperCase()}%0A` +
      (receipt.paymentMethod === 'cash' ? `Diterima: Rp ${receipt.paidAmount.toLocaleString('id-ID')}%0AKembali: Rp ${receipt.changeAmount.toLocaleString('id-ID')}%0A` : '') +
      `Kasir: ${receipt.cashierName}%0A%0A` +
      `_Jazakumullah Khairan Katsiran_`;

    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      {/* Printable Styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pos-receipt-print-area, #pos-receipt-print-area * {
            visibility: visible;
          }
          #pos-receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 16px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-emerald-600 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-sm tracking-tight">Pembayaran Berhasil Diproses</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-700/60 text-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <div
            id="pos-receipt-print-area"
            className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 font-sans text-xs text-slate-800 space-y-4"
          >
            {/* Header Pesantren */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                PONDOK PESANTREN
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Sistem Layanan Kasir & Pembayaran Santri
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1">
                No: {receipt.receiptNumber}
              </div>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-slate-300 pb-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Nama Santri:</span>
                <span className="font-bold text-slate-900">{receipt.santriNama}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">NIS:</span>
                <span className="font-semibold text-slate-700 font-mono">{receipt.santriNis}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Kelas / Kamar:</span>
                <span className="font-medium text-slate-700">{receipt.santriKelas || '-'} / {receipt.santriKamar || '-'}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Waktu:</span>
                <span className="font-medium text-slate-700">{receipt.paymentDate}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rincian Pembayaran</div>
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    {item.note && <div className="text-[10px] text-slate-400">{item.note}</div>}
                  </div>
                  <div className="font-mono font-bold text-slate-900 shrink-0">
                    Rp {item.amount.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Total */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">TOTAL:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  Rp {receipt.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600">
                <span>Metode Bayar:</span>
                <span className="font-bold uppercase text-slate-800">
                  {receipt.paymentMethod === 'cash' ? 'Tunai' : receipt.paymentMethod === 'transfer' ? 'Transfer / QRIS' : 'Tabungan Santri'}
                </span>
              </div>
              {receipt.paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between items-center text-[11px] text-slate-600">
                    <span>Uang Diterima:</span>
                    <span className="font-medium text-slate-800">
                      Rp {receipt.paidAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold text-emerald-700">
                    <span>Kembalian:</span>
                    <span>
                      Rp {receipt.changeAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-1 space-y-1">
              <p className="text-[11px] font-medium text-slate-600">
                Jazakumullah Khairan Katsiran
              </p>
              <p className="text-[10px] text-slate-400">
                Simpan struk ini sebagai bukti pembayaran yang sah.
              </p>
              <div className="text-[10px] text-slate-400 pt-1">
                Kasir: <span className="font-semibold text-slate-600">{receipt.cashierName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            onClick={handleWhatsApp}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim WA</span>
          </button>
          <button
            onClick={onNewTransaction}
            className="py-2.5 px-3 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Transaksi Baru</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
