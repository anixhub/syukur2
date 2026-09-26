import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  CreditCard, 
  AlertCircle, 
  Layers, 
  Plus, 
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Coins
} from 'lucide-react';
import { Santri } from '../../types';
import { 
  SantriPaymentItem, 
  PaymentSubPeriod, 
  PaymentCartItem, 
  SubPeriodRecordDetail, 
  SubPeriodPaymentStatus,
  SHORT_MONTH_NAMES
} from './pembayaranTypes';
import { isCustomPasFoto } from '../SekretarisHelper';
import { getApiUrl } from '../../lib/api';

interface PeriodPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  santri: Santri;
  item: SantriPaymentItem;
  targetPeriodId?: string;
  subPeriodStatusMap: Record<string, any>;
  onAddToCart: (cartItem: PaymentCartItem, updatedStatuses: Record<string, SubPeriodRecordDetail>) => void;
  onDirectPay?: (cartItem: PaymentCartItem, updatedStatuses: Record<string, SubPeriodRecordDetail>) => void;
}

function formatRupiah(num: number): string {
  return num.toLocaleString('id-ID');
}

function parseRupiahInput(val: string): number {
  if (!val) return 0;
  const normalized = val.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function formatRupiahInput(val: string): string {
  const digitsOnly = val.replace(/\D/g, '');
  if (!digitsOnly) return '';
  const num = parseInt(digitsOnly, 10);
  return num.toLocaleString('id-ID');
}

export default function PeriodPaymentModal({
  isOpen,
  onClose,
  santri,
  item,
  targetPeriodId,
  subPeriodStatusMap,
  onAddToCart,
  onDirectPay
}: PeriodPaymentModalProps) {
  if (!isOpen) return null;

  const defaultTarif = item.defaultAmount || 0;
  const minInstallment = item.minInstallmentAmount || 50000;
  const maxInstallmentCount = item.maxInstallmentCount || 3;
  const allowInstallment = Boolean(item.allowInstallment);

  // Daftar sub-periode aktif yang ditagihkan
  const activeSubPeriods = useMemo<PaymentSubPeriod[]>(() => {
    return (item.subPeriods || []).filter(sp => sp.isActive);
  }, [item.subPeriods]);

  // Evaluasi detail status masing-masing sub-periode santri
  const periodDetails = useMemo(() => {
    return activeSubPeriods.map((period, idx) => {
      const key = `${santri.id}_${item.id}_${period.id}`;
      const saved = subPeriodStatusMap[key];

      let status: SubPeriodPaymentStatus = 'menunggak';
      let totalTarif = defaultTarif;
      let paidAmount = 0;
      let installmentCount = 0;

      if (saved) {
        if (typeof saved === 'string') {
          if (saved === 'lunas') {
            status = 'lunas';
            paidAmount = totalTarif;
          } else if (saved === 'cicil') {
            status = 'cicil';
            paidAmount = Math.round(totalTarif / 2);
            installmentCount = 1;
          } else {
            status = 'menunggak';
            paidAmount = 0;
          }
        } else if (typeof saved === 'object') {
          status = saved.status || 'menunggak';
          totalTarif = saved.totalTarif || defaultTarif;
          paidAmount = saved.paidAmount || 0;
          installmentCount = saved.installmentCount || 0;
        }
      } else {
        // Seed realistis jika belum ada riwayat tersimpan:
        // Periode awal lunas, periode ke-2 dicicil 50%, selanjutnya menunggak
        const seed = (santri.nama.charCodeAt(0) + santri.nama.length) % 2;
        if (idx === 0) {
          status = 'lunas';
          paidAmount = totalTarif;
        } else if (idx === 1 && seed === 0) {
          status = 'cicil';
          paidAmount = Math.round(totalTarif / 2);
          installmentCount = 1;
        } else {
          status = 'menunggak';
          paidAmount = 0;
        }
      }

      const remainingAmount = Math.max(0, totalTarif - paidAmount);

      return {
        period,
        idx,
        key,
        status,
        totalTarif,
        paidAmount,
        remainingAmount,
        installmentCount
      };
    });
  }, [activeSubPeriods, santri.id, santri.nama, item.id, defaultTarif, subPeriodStatusMap]);

  // Cari periode pertama yang belum lunas (earliest payable period)
  const firstPayableIdx = useMemo(() => {
    return periodDetails.findIndex(p => p.status !== 'lunas');
  }, [periodDetails]);

  // Index periode akhir yang dipilih (semua periode dari firstPayableIdx s/d selectedEndIdx akan dibayar)
  const [selectedEndIdx, setSelectedEndIdx] = useState<number>(() => {
    if (firstPayableIdx === -1) return -1;
    if (targetPeriodId) {
      const targetedIdx = periodDetails.findIndex(p => p.period.id === targetPeriodId);
      if (targetedIdx >= firstPayableIdx) {
        return targetedIdx;
      }
    }
    return firstPayableIdx;
  });

  // State Toggle Cicilan
  const [isCicilMode, setIsCicilMode] = useState(false);
  const [cicilAmountInput, setCicilAmountInput] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Periode-periode yang terpilih secara terurut (firstPayableIdx s/d selectedEndIdx)
  const selectedPeriods = useMemo(() => {
    if (firstPayableIdx === -1 || selectedEndIdx === -1 || selectedEndIdx < firstPayableIdx) {
      return [];
    }
    return periodDetails.slice(firstPayableIdx, selectedEndIdx + 1);
  }, [periodDetails, firstPayableIdx, selectedEndIdx]);

  // Total tagihan sisa untuk semua periode yang dipilih
  const totalBillForSelection = useMemo(() => {
    return selectedPeriods.reduce((sum, p) => sum + p.remainingAmount, 0);
  }, [selectedPeriods]);

  // Saat pilihan periode berubah, reset nominal cicilan jika melebihi total tagihan
  useEffect(() => {
    if (!isCicilMode) {
      setCicilAmountInput(formatRupiah(totalBillForSelection));
    } else {
      const currentParsed = parseRupiahInput(cicilAmountInput);
      if (currentParsed > totalBillForSelection || currentParsed <= 0) {
        const initialCicil = Math.min(
          totalBillForSelection,
          Math.max(minInstallment, Math.round(totalBillForSelection / 2))
        );
        setCicilAmountInput(formatRupiah(initialCicil));
      }
    }
  }, [totalBillForSelection, isCicilMode]);

  // Toggle cicil mode
  const handleToggleCicilMode = () => {
    if (!allowInstallment) return;
    const nextMode = !isCicilMode;
    setIsCicilMode(nextMode);
    if (nextMode) {
      const initialCicil = Math.min(
        totalBillForSelection,
        Math.max(minInstallment, Math.round(totalBillForSelection / 2))
      );
      setCicilAmountInput(formatRupiah(initialCicil));
    } else {
      setCicilAmountInput(formatRupiah(totalBillForSelection));
    }
  };

  // Nominal pembayaran yang valid
  const currentPayAmount = useMemo(() => {
    if (!isCicilMode) return totalBillForSelection;
    return parseRupiahInput(cicilAmountInput);
  }, [isCicilMode, totalBillForSelection, cicilAmountInput]);

  // Validasi cicilan
  const isBelowMinInstallment = isCicilMode && currentPayAmount < minInstallment && totalBillForSelection >= minInstallment;
  const isExceedingTotal = isCicilMode && currentPayAmount > totalBillForSelection;
  const isPayAmountZero = currentPayAmount <= 0;
  const isSubmitDisabled = selectedPeriods.length === 0 || isPayAmountZero || isBelowMinInstallment || isExceedingTotal;

  // Sisa tagihan setelah pembayaran
  const remainingDebtAfterPay = Math.max(0, totalBillForSelection - currentPayAmount);

  // Penanganan klik pada kotak periode
  const handlePeriodClick = (idx: number) => {
    setNoticeMessage(null);
    const targetPeriod = periodDetails[idx];
    if (!targetPeriod) return;

    // Jika periode sudah lunas, tidak bisa dipilih untuk bayar ulang
    if (targetPeriod.status === 'lunas') {
      setNoticeMessage(`Periode ${targetPeriod.period.label} sudah lunas dibayar.`);
      setTimeout(() => setNoticeMessage(null), 3000);
      return;
    }

    if (firstPayableIdx === -1) return;

    // Sesuai aturan: harus terurut dari periode belum lunas pertama
    // Jika user mengklik idx >= firstPayableIdx, maka otomatis pilih dari firstPayableIdx s/d idx
    if (idx >= firstPayableIdx) {
      if (idx === selectedEndIdx && selectedEndIdx > firstPayableIdx) {
        // Jika klik periode akhir yang sedang aktif, perpendek pilihan satu periode ke belakang
        setSelectedEndIdx(idx - 1);
      } else {
        // Pilih dari firstPayableIdx s/d idx
        setSelectedEndIdx(idx);
      }
    }
  };

  // Kalkulasi distribusi pembayaran & status baru per periode
  const calculateResultingStatuses = (): Record<string, SubPeriodRecordDetail> => {
    const updatedMap: Record<string, SubPeriodRecordDetail> = {};
    let remainingPaymentBudget = currentPayAmount;

    for (const p of selectedPeriods) {
      const key = p.key;
      const needToPay = p.remainingAmount;

      if (remainingPaymentBudget >= needToPay) {
        // Periode ini terbayar lunas
        remainingPaymentBudget -= needToPay;
        updatedMap[key] = {
          status: 'lunas',
          totalTarif: p.totalTarif,
          paidAmount: p.totalTarif,
          remainingAmount: 0,
          installmentCount: p.installmentCount + (p.status === 'cicil' ? 1 : 0),
          lastPaymentDate: new Date().toISOString()
        };
      } else if (remainingPaymentBudget > 0) {
        // Periode ini terbayar sebagian (cicil)
        const newlyPaid = remainingPaymentBudget;
        remainingPaymentBudget = 0;
        const totalPaid = p.paidAmount + newlyPaid;
        const remain = Math.max(0, p.totalTarif - totalPaid);

        updatedMap[key] = {
          status: remain === 0 ? 'lunas' : 'cicil',
          totalTarif: p.totalTarif,
          paidAmount: totalPaid,
          remainingAmount: remain,
          installmentCount: p.installmentCount + 1,
          lastPaymentDate: new Date().toISOString()
        };
      } else {
        // Pembayaran tidak cukup mencakup periode ini, tetap dengan status lamanya
        updatedMap[key] = {
          status: p.status,
          totalTarif: p.totalTarif,
          paidAmount: p.paidAmount,
          remainingAmount: p.remainingAmount,
          installmentCount: p.installmentCount
        };
      }
    }

    return updatedMap;
  };

  // Buat objek PaymentCartItem dengan metadata lengkap
  const buildCartItem = (): PaymentCartItem => {
    const periodLabels = selectedPeriods.map(p => p.period.shortLabel || p.period.label);
    const periodIds = selectedPeriods.map(p => p.period.id);

    const isFullSettlement = !isCicilMode || remainingDebtAfterPay === 0;
    const noteText = isFullSettlement
      ? `Pelunasan ${item.name} (${selectedPeriods.length} Periode: ${periodLabels.join(', ')})`
      : `Cicilan ${item.name} (${selectedPeriods.length} Periode: ${periodLabels.join(', ')} - Sisa: Rp ${formatRupiah(remainingDebtAfterPay)})`;

    return {
      id: `cart-${item.id}-${Date.now()}`,
      itemId: item.id,
      name: item.name,
      category: item.category || 'lainnya',
      amount: currentPayAmount,
      quantity: 1,
      month: periodLabels.join(', '),
      note: noteText,
      periodIds,
      periodLabels,
      isInstallment: isCicilMode && remainingDebtAfterPay > 0,
      remainingDebt: remainingDebtAfterPay,
      targetAccountId: item.targetAccountId || 'c-1'
    };
  };

  // Aksi Masukkan ke Kasir
  const handleConfirmAddToCart = () => {
    if (isSubmitDisabled) return;
    const cartItem = buildCartItem();
    const updatedStatuses = calculateResultingStatuses();
    onAddToCart(cartItem, updatedStatuses);
    onClose();
  };

  // Aksi Bayar Langsung (Bypass kasir jika diinginkan)
  const handleConfirmDirectPay = () => {
    if (isSubmitDisabled) return;
    const cartItem = buildCartItem();
    const updatedStatuses = calculateResultingStatuses();
    if (onDirectPay) {
      onDirectPay(cartItem, updatedStatuses);
    } else {
      onAddToCart(cartItem, updatedStatuses);
    }
    onClose();
  };

  const hasPhoto = isCustomPasFoto(santri.filePasFoto);

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Input Pembayaran Berperiode
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
              {item.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Modal (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Ringkasan Santri Terpilih */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-11 h-11 rounded-full border-2 border-emerald-500/30 overflow-hidden shrink-0 flex items-center justify-center bg-slate-200 aspect-square shadow-2xs">
              {hasPhoto ? (
                <img
                  src={getApiUrl(santri.filePasFoto!)}
                  alt={santri.nama}
                  className="w-full h-full object-cover rounded-full aspect-square"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs text-white ${santri.gender === 'Putri' ? 'bg-pink-500' : 'bg-emerald-600'}`}>
                  {santri.nama.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                {santri.nama}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <span className="font-mono text-slate-400">NIS: {santri.nis}</span>
                <span>•</span>
                <span className="truncate">{santri.kelas || 'Santri'}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{santri.gender || 'Semua'}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-medium block">Tarif Pokok</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                Rp {formatRupiah(defaultTarif)}
              </span>
            </div>
          </div>

          {/* Kotak-kotak Periode dengan Warna Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs sm:text-sm">
                Pilih Periode Pembayaran
              </label>
              <span className="text-[11px] text-slate-500">
                Pilih terurut dari periode terawal
              </span>
            </div>

            {/* Kotak Sub Periode Grid */}
            <div className="p-3.5 rounded-3xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {periodDetails.map(p => {
                  const isPaidLunas = p.status === 'lunas';
                  const isDicicil = p.status === 'cicil';
                  const isMenunggak = p.status === 'menunggak';

                  // Apakah periode ini terpilih untuk dibayar sekarang
                  const isSelectedToPay = selectedPeriods.some(sp => sp.idx === p.idx);

                  // Label display
                  const displayLabel = p.period.shortLabel || (
                    item.paymentFrequency === 'bulanan'
                      ? (p.period.periodMonth ? SHORT_MONTH_NAMES[p.period.periodMonth - 1] : p.period.label.slice(0, 3))
                      : p.period.label.slice(0, 3)
                  );

                  return (
                    <button
                      key={p.period.id}
                      type="button"
                      onClick={() => handlePeriodClick(p.idx)}
                      disabled={isPaidLunas}
                      title={`${p.period.label} • ${
                        isPaidLunas
                          ? 'Sudah Lunas'
                          : isDicicil
                          ? `Dicicil (Sisa: Rp ${formatRupiah(p.remainingAmount)})`
                          : 'Menunggak (Belum Bayar)'
                      }`}
                      className={`relative w-11 h-11 sm:w-12 sm:h-12 aspect-square rounded-2xl border text-xs font-bold flex flex-col items-center justify-center shrink-0 transition-all select-none ${
                        isPaidLunas
                          ? 'bg-emerald-600 border-emerald-600 text-white opacity-90 cursor-not-allowed shadow-2xs'
                          : isSelectedToPay
                          ? 'bg-emerald-600 border-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-2 scale-105 shadow-md cursor-pointer font-extrabold'
                          : isDicicil
                          ? 'bg-amber-400 border-amber-500 text-amber-950 font-extrabold hover:bg-amber-500 shadow-2xs cursor-pointer'
                          : 'bg-rose-500 border-rose-600 text-white font-bold hover:bg-rose-600 shadow-2xs cursor-pointer'
                      }`}
                    >
                      <span>{displayLabel}</span>
                      {isPaidLunas && (
                        <Check className="w-3 h-3 text-white absolute bottom-1 right-1" />
                      )}
                      {isDicicil && !isSelectedToPay && (
                        <span className="text-[8px] font-black text-amber-950 tracking-tighter leading-none mt-0.5">
                          Cicil
                        </span>
                      )}
                      {isSelectedToPay && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 right-1 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend Status Warna Sesuai Permintaan User */}
              <div className="flex items-center gap-4 text-[11px] text-slate-600 font-medium pt-1 border-t border-slate-200/60 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
                  <span>Sudah Dibayar (Lunas)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 shrink-0"></span>
                  <span>Sudah Dicicil</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Menunggak (Belum Bayar)</span>
                </span>
              </div>
            </div>

            {noticeMessage && (
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{noticeMessage}</span>
              </div>
            )}
          </div>

          {/* Rincian Periode yang Dipilih */}
          {selectedPeriods.length > 0 ? (
            <div className="p-3.5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Periode yang dipilih:</span>
                <span className="font-bold text-slate-900">
                  {selectedPeriods.length} Periode (
                  {selectedPeriods.map(p => p.period.shortLabel || p.period.label).join(', ')}
                  )
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total tagihan pokok terpilih:</span>
                <span className="font-mono font-bold text-slate-900">
                  Rp {formatRupiah(totalBillForSelection)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              {firstPayableIdx === -1 
                ? '🎉 Luar biasa! Semua periode tagihan untuk santri ini sudah lunas dibayar.'
                : 'Silakan klik salah satu kotak periode di atas untuk menentukan tagihan yang akan dibayar.'}
            </div>
          )}

          {/* Fitur Toggle Cicilan (Jika item mengizinkan cicilan) */}
          {allowInstallment && selectedPeriods.length > 0 && (
            <div className={`w-full border border-slate-200 rounded-3xl transition-all ${
              !isCicilMode
                ? 'px-4 py-2 min-h-[42px] bg-white flex flex-col justify-center'
                : 'p-4 bg-slate-50/70 space-y-3'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label
                    htmlFor="modal-toggle-cicil"
                    className="font-bold text-xs sm:text-sm text-slate-800 cursor-pointer select-none"
                  >
                    Bayar Bertahap / Cicilan
                  </label>
                  <div className="relative group inline-flex items-center">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-help"
                      aria-label="Keterangan cicilan"
                      title="Aktifkan bila santri membayar tagihan ini secara bertahap"
                    >
                      <Info className="w-3 h-3 text-slate-500" />
                    </button>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:flex z-50 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex-col gap-1">
                      <span>
                        Aktifkan bila santri diperbolehkan membayar tagihan ini secara bertahap/mencicil
                      </span>
                    </div>
                  </div>
                </div>

                {/* Switch Button */}
                <button
                  id="modal-toggle-cicil"
                  type="button"
                  role="switch"
                  aria-checked={isCicilMode}
                  onClick={handleToggleCicilMode}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer ${
                    isCicilMode ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isCicilMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Tampilan saat Mode Cicil ON */}
              {isCicilMode && (
                <div className="space-y-3 pt-2.5 border-t border-slate-200/80 animate-in fade-in duration-150">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Nominal Pembayaran Sekarang
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Min. Rp {formatRupiah(minInstallment)}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-xs font-bold text-slate-400 select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cicilAmountInput}
                        onChange={e => {
                          const formatted = formatRupiahInput(e.target.value);
                          setCicilAmountInput(formatted);
                        }}
                        className={`w-full pl-11 pr-4 py-2 rounded-full border bg-white font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                          isBelowMinInstallment || isExceedingTotal
                            ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                            : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Tombol Preset Cepat Cicilan */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-500">Preset:</span>
                    {[
                      minInstallment,
                      100000,
                      200000,
                      Math.round(totalBillForSelection / 2)
                    ]
                      .filter((val, i, arr) => val > 0 && val <= totalBillForSelection && arr.indexOf(val) === i)
                      .map((val, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCicilAmountInput(formatRupiah(val))}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          Rp {formatRupiah(val)}
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => setCicilAmountInput(formatRupiah(totalBillForSelection))}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Lunasi Semua
                    </button>
                  </div>

                  {/* Peringatan jika di bawah batas minimal atau melebihi total */}
                  {isBelowMinInstallment && (
                    <div className="p-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Nominal cicilan minimal adalah Rp {formatRupiah(minInstallment)} sesuai pengaturan.</span>
                    </div>
                  )}

                  {isExceedingTotal && (
                    <div className="p-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Nominal melebihi total tagihan (Rp {formatRupiah(totalBillForSelection)}).</span>
                    </div>
                  )}

                  {/* Info Cicilan Maksimal & Sisa */}
                  <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Sisa tagihan setelah transaksi ini:</span>
                      <span className="font-mono font-bold text-amber-900">
                        Rp {formatRupiah(remainingDebtAfterPay)}
                      </span>
                    </div>
                    {maxInstallmentCount && (
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>Aturan batas cicilan:</span>
                        <span>Maksimal {maxInstallmentCount}x cicilan</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rincian Total Bayar & Rekening Tujuan */}
          <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-emerald-800 font-semibold block">
                Total Yang Harus Dibayar Sekarang:
              </span>
              <div className="text-base sm:text-lg font-mono font-black text-emerald-900">
                Rp {formatRupiah(currentPayAmount)}
              </div>
              {item.targetAccountName && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-0.5">
                  <CreditCard className="w-3 h-3 shrink-0" />
                  <span>Masuk ke: <strong>{item.targetAccountName}</strong></span>
                </div>
              )}
            </div>

            {isCicilMode && remainingDebtAfterPay > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] shrink-0">
                Sisa Dicicil
              </span>
            )}
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={handleConfirmAddToCart}
            className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ${
              isSubmitDisabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Masukkan ke Kasir</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
