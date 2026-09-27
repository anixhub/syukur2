import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  CreditCard, 
  Calendar, 
  Coins, 
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Santri, BendaharaRecord } from '../../types';
import { SantriPaymentItem, PaymentSubPeriod, PaymentCartItem, PaymentReceipt } from './pembayaranTypes';

interface ConfigurePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SantriPaymentItem | null;
  santri: Santri;
  currentCartItem?: PaymentCartItem;
  initialSelection?: {
    selectedPeriodIds: string[];
    isCicil: boolean;
    customAmount?: number;
  };
  onSaveToCart: (configured: {
    selectedPeriodIds: string[];
    isCicil: boolean;
    isContinuing: boolean;
    amount: number;
    subPeriodId?: string;
    note: string;
  }) => void;
  isSubPeriodPastDue: (subPeriod: PaymentSubPeriod) => boolean;
  getSubPeriodStatus: (santri: Santri, item: SantriPaymentItem, subPeriod: PaymentSubPeriod, index: number) => 'lunas' | 'cicil' | 'belum';
  getInstallmentInfo: (santriId: string, itemId: string, subPeriodId: string, defaultTotal: number) => { paidAmount: number; totalAmount: number };
  getUnfinishedInstallmentBefore: (santri: Santri, item: SantriPaymentItem, targetIndex: number) => { period: PaymentSubPeriod; index: number; paidAmount: number; totalAmount: number } | null;
}

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function ConfigurePaymentModal({
  isOpen,
  onClose,
  item,
  santri,
  currentCartItem,
  initialSelection,
  onSaveToCart,
  isSubPeriodPastDue,
  getSubPeriodStatus,
  getInstallmentInfo,
  getUnfinishedInstallmentBefore,
}: ConfigurePaymentModalProps) {
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);
  const [isCicil, setIsCicil] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [warningNotice, setWarningNotice] = useState<string | null>(null);

  // Initialize form state when item changes or modal opens
  useEffect(() => {
    if (!isOpen || !item) {
      setSelectedPeriodIds([]);
      setIsCicil(false);
      setCustomAmount(0);
      setWarningNotice(null);
      return;
    }

    // 1. If currently already in cart, use cart data
    if (currentCartItem) {
      const pIds = currentCartItem.selectedPeriodIds || (currentCartItem.subPeriodId ? [currentCartItem.subPeriodId] : []);
      setSelectedPeriodIds(pIds);
      setIsCicil(Boolean(currentCartItem.isCicil));
      setCustomAmount(currentCartItem.amount || item.defaultAmount || 0);
      return;
    }

    // 2. If initial selection exists
    if (initialSelection && initialSelection.selectedPeriodIds.length > 0) {
      setSelectedPeriodIds(initialSelection.selectedPeriodIds);
      setIsCicil(initialSelection.isCicil);
      setCustomAmount(initialSelection.customAmount ?? (item.defaultAmount || 0));
      return;
    }

    // 3. Default initialization:
    if (item.subPeriods && item.subPeriods.length > 0) {
      // Prioritaskan periode yang sedang dicicil belum lunas
      let targetPeriod: PaymentSubPeriod | null = null;
      let targetIdx = -1;

      for (let i = 0; i < item.subPeriods.length; i++) {
        const sp = item.subPeriods[i];
        const st = getSubPeriodStatus(santri, item, sp, i);
        if (st === 'cicil') {
          targetPeriod = sp;
          targetIdx = i;
          break;
        }
      }

      // Jika tidak ada cicilan berjalan, ambil periode pertama yang belum lunas
      if (!targetPeriod) {
        for (let i = 0; i < item.subPeriods.length; i++) {
          const sp = item.subPeriods[i];
          const st = getSubPeriodStatus(santri, item, sp, i);
          if (st !== 'lunas') {
            targetPeriod = sp;
            targetIdx = i;
            break;
          }
        }
      }

      if (targetPeriod && targetIdx !== -1) {
        const st = getSubPeriodStatus(santri, item, targetPeriod, targetIdx);
        setSelectedPeriodIds([targetPeriod.id]);
        if (st === 'cicil') {
          setIsCicil(true);
          const info = getInstallmentInfo(santri.id, item.id, targetPeriod.id, item.defaultAmount || 350000);
          setCustomAmount(Math.max(0, info.totalAmount - info.paidAmount));
        } else {
          setIsCicil(false);
          setCustomAmount(item.defaultAmount || 0);
        }
      } else {
        setSelectedPeriodIds([]);
        setIsCicil(false);
        setCustomAmount(item.defaultAmount || 0);
      }
    } else {
      setSelectedPeriodIds([]);
      setIsCicil(false);
      setCustomAmount(item.defaultAmount || 0);
    }
  }, [isOpen, item, santri, currentCartItem, initialSelection]);

  if (!isOpen || !item) return null;

  const isMultiPeriod = selectedPeriodIds.length > 1;
  const singlePeriodId = selectedPeriodIds.length === 1 ? selectedPeriodIds[0] : null;
  const singlePeriod = singlePeriodId ? item.subPeriods?.find(sp => sp.id === singlePeriodId) : null;
  const singleIdx = singlePeriodId ? (item.subPeriods?.findIndex(sp => sp.id === singlePeriodId) ?? -1) : -1;
  const singleStatus = (singlePeriod && singleIdx !== -1) ? getSubPeriodStatus(santri, item, singlePeriod, singleIdx) : 'belum';
  const isContinuingCicil = !isMultiPeriod && singleStatus === 'cicil';
  const singleCicilInfo = singlePeriod ? getInstallmentInfo(santri.id, item.id, singlePeriod.id, item.defaultAmount || 350000) : null;

  // Handler klik periode di dalam modal
  const handlePeriodToggle = (period: PaymentSubPeriod, pIdx: number) => {
    const status = getSubPeriodStatus(santri, item, period, pIdx);

    // 1. Jika sudah lunas
    if (status === 'lunas') {
      setWarningNotice(`Periode ${period.label} sudah LUNAS.`);
      setTimeout(() => setWarningNotice(null), 3500);
      return;
    }

    // 2. Jika ada cicilan sebelumnya yang belum selesai
    const unfinishedBefore = getUnfinishedInstallmentBefore(santri, item, pIdx);
    if (unfinishedBefore) {
      setWarningNotice(
        `Periode ${unfinishedBefore.period.label} masih dalam cicilan (belum lunas). Harap lunasi terlebih dahulu sebelum memilih periode ${period.label}.`
      );
      setTimeout(() => setWarningNotice(null), 4500);
      return;
    }

    setWarningNotice(null);

    let nextIds: string[];
    if (selectedPeriodIds.includes(period.id)) {
      nextIds = selectedPeriodIds.filter(id => id !== period.id);
    } else {
      nextIds = [...selectedPeriodIds, period.id];
    }

    setSelectedPeriodIds(nextIds);

    if (nextIds.length === 1) {
      const spId = nextIds[0];
      const spObj = item.subPeriods?.find(p => p.id === spId);
      const spIndex = item.subPeriods?.findIndex(p => p.id === spId) ?? -1;
      const spSt = spObj ? getSubPeriodStatus(santri, item, spObj, spIndex) : 'belum';

      if (spSt === 'cicil') {
        setIsCicil(true);
        const info = getInstallmentInfo(santri.id, item.id, spId, item.defaultAmount || 350000);
        setCustomAmount(Math.max(0, info.totalAmount - info.paidAmount));
      } else {
        if (isCicil) {
          setCustomAmount(customAmount > 0 ? customAmount : (item.defaultAmount || 0));
        } else {
          setCustomAmount(item.defaultAmount || 0);
        }
      }
    } else {
      // Lebih dari 1 periode: cicil otomatis nonaktif
      setIsCicil(false);
      setCustomAmount((item.defaultAmount || 0) * nextIds.length);
    }
  };

  // Toggle Mode Cicil
  const handleToggleCicil = () => {
    if (isMultiPeriod || isContinuingCicil) return;

    const nextIsCicil = !isCicil;
    setIsCicil(nextIsCicil);
    if (nextIsCicil) {
      const defaultAmt = item.defaultAmount || 0;
      const half = item.minInstallmentAmount || Math.round(defaultAmt / 2) || 100000;
      setCustomAmount(half);
    } else {
      setCustomAmount(item.defaultAmount || 0);
    }
  };

  // Submit to Cart
  const handleConfirm = () => {
    // Validasi
    if (item.subPeriods && item.subPeriods.length > 0 && selectedPeriodIds.length === 0) {
      setWarningNotice('Harap pilih minimal satu periode pembayaran.');
      return;
    }

    let finalAmount = 0;
    if (isCicil) {
      finalAmount = customAmount > 0 ? customAmount : (item.defaultAmount || 0);
    } else if (item.subPeriods && item.subPeriods.length > 0) {
      finalAmount = (item.defaultAmount || 0) * selectedPeriodIds.length;
    } else {
      finalAmount = customAmount > 0 ? customAmount : (item.defaultAmount || 0);
    }

    const selectedPeriods = item.subPeriods
      ? item.subPeriods.filter(sp => selectedPeriodIds.includes(sp.id))
      : [];
    const selectedLabels = selectedPeriods.map(sp => sp.label);

    let note = '';
    if (selectedLabels.length > 0) {
      const pStr = selectedLabels.join(', ');
      if (isContinuingCicil) {
        note = `Periode: ${pStr} • Lanjut Cicilan`;
      } else if (isCicil) {
        note = `Periode: ${pStr} • Mode Cicil`;
      } else {
        note = `Periode: ${pStr}`;
      }
    } else {
      note = item.description || `Pembayaran ${item.name}`;
    }

    onSaveToCart({
      selectedPeriodIds,
      isCicil,
      isContinuing: Boolean(isContinuingCicil),
      amount: finalAmount,
      subPeriodId: selectedPeriodIds.length === 1 ? selectedPeriodIds[0] : undefined,
      note,
    });

    onClose();
  };

  const calculatedTotalAmount = isCicil
    ? customAmount
    : item.subPeriods && item.subPeriods.length > 0
    ? (item.defaultAmount || 0) * selectedPeriodIds.length
    : (customAmount > 0 ? customAmount : (item.defaultAmount || 0));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <CreditCard className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {item.name}
              </h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Santri: <strong className="text-slate-800">{santri.nama}</strong> ({santri.kamar || 'Kamar -'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Warning Banner */}
          {warningNotice && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{warningNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setWarningNotice(null)}
                className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Info Tarif & Kategori */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Tarif Satuan</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                Rp {(item.defaultAmount || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-medium block text-[11px]">Frekuensi</span>
              <span className="font-bold text-slate-700 capitalize">
                {item.paymentFrequency || 'Sekali Bayar'}
              </span>
            </div>
          </div>

          {/* Bagian Pemilihan Sub-Periode jika item memiliki periode berkala */}
          {item.subPeriods && item.subPeriods.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pilih Periode yang Ingin Dibayarkan</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedPeriodIds.length} dipilih
                </span>
              </div>

              {/* Grid Kotak-kotak Periode */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-200/60">
                {item.subPeriods.map((period, pIdx) => {
                  const displayLabel = period.shortLabel || (
                    item.paymentFrequency === 'bulanan'
                      ? (period.periodMonth ? SHORT_MONTH_NAMES[period.periodMonth - 1] : period.label.slice(0, 3))
                      : item.paymentFrequency === 'triwulan'
                      ? `T${pIdx + 1}`
                      : item.paymentFrequency === 'caturwulan'
                      ? `C${pIdx + 1}`
                      : `S${pIdx + 1}`
                  );

                  const status = getSubPeriodStatus(santri, item, period, pIdx);
                  const isPastDue = isSubPeriodPastDue(period);
                  const isLunas = status === 'lunas';
                  const isCicilStatus = status === 'cicil';
                  const isMenunggak = !isLunas && !isCicilStatus && isPastDue;

                  const unfinishedBefore = getUnfinishedInstallmentBefore(santri, item, pIdx);
                  const isLocked = Boolean(unfinishedBefore);
                  const isSelected = selectedPeriodIds.includes(period.id);

                  const statusText = isLunas 
                    ? 'Lunas' 
                    : isCicilStatus 
                    ? 'Masih Dicicil' 
                    : isMenunggak 
                    ? 'Menunggak' 
                    : 'Belum Bayar';

                  return (
                    <button
                      key={period.id || pIdx}
                      type="button"
                      title={`${period.label} • ${statusText}${isLocked ? ' (Terkunci: selesaikan cicilan sebelumnya terlebih dahulu)' : ''}`}
                      onClick={() => handlePeriodToggle(period, pIdx)}
                      className={`h-9 min-w-9 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all select-none relative cursor-pointer ${
                        isLocked
                          ? 'bg-transparent border border-dashed border-slate-300 text-slate-300 cursor-not-allowed opacity-50'
                          : isLunas
                          ? 'bg-emerald-600 border border-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                          : isCicilStatus
                          ? 'bg-amber-400 border border-amber-500 text-amber-950 font-extrabold shadow-2xs hover:bg-amber-500'
                          : isMenunggak
                          ? 'bg-rose-500 border border-rose-600 text-white font-bold shadow-2xs hover:bg-rose-600'
                          : 'bg-transparent border border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-100/60'
                      } ${
                        isSelected 
                          ? 'ring-2 ring-emerald-500 ring-offset-2 scale-105 z-10 font-black shadow-xs' 
                          : ''
                      }`}
                    >
                      <span>{displayLabel}</span>
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Keterangan Warna Indikator */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium px-1 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Lunas</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>Dicicil</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-rose-600 font-bold">Menunggak</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-transparent"></span>
                  <span>Belum Bayar</span>
                </span>
              </div>
            </div>
          )}

          {/* Konfigurasi Mode Cicil */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className={`text-xs font-bold ${
                  isMultiPeriod 
                    ? 'text-slate-400' 
                    : isContinuingCicil 
                    ? 'text-amber-800 font-extrabold' 
                    : 'text-slate-800'
                }`}>
                  {isContinuingCicil ? 'Lanjut cicilan' : 'Mode cicil'}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isContinuingCicil 
                    ? 'Periode ini dalam cicilan belum lunas (otomatis aktif)' 
                    : isMultiPeriod 
                    ? 'Hanya bisa aktif saat memilih tepat 1 periode' 
                    : 'Bayar sebagian / bertahap'}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isCicil}
                disabled={isMultiPeriod || isContinuingCicil}
                onClick={handleToggleCicil}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isCicil ? 'bg-amber-500' : 'bg-slate-200'
                } ${isMultiPeriod ? 'opacity-40 cursor-not-allowed' : isContinuingCicil ? 'cursor-default' : 'cursor-pointer'}`}
                title={
                  isMultiPeriod 
                    ? 'Mode cicil hanya bisa diaktifkan saat yang dipilih hanya 1 periode' 
                    : isContinuingCicil 
                    ? 'Periode ini sedang dalam cicilan belum lunas' 
                    : 'Aktifkan jika ingin mencicil'
                }
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isCicil ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notice jika memilih lebih dari 1 periode */}
            {isMultiPeriod && (
              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Mode cicil hanya bisa diaktifkan saat yang dipilih hanya 1 periode.</span>
              </div>
            )}

            {/* Status Cicilan Berjalan */}
            {isContinuingCicil && singleCicilInfo && (
              <div className="text-[11px] text-amber-900 bg-amber-100/70 border border-amber-300/80 rounded-xl p-3 space-y-1">
                <div>
                  Sudah dibayar sebelumnya: <strong>Rp {singleCicilInfo.paidAmount.toLocaleString('id-ID')}</strong> dari total <strong>Rp {singleCicilInfo.totalAmount.toLocaleString('id-ID')}</strong>.
                </div>
                <div className="font-bold text-amber-950 flex items-center justify-between pt-0.5">
                  <span>Sisa tagihan: Rp {(singleCicilInfo.totalAmount - singleCicilInfo.paidAmount).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* Kotak Input Jumlah yang Ingin Dibayarkan saat Mode Cicil Aktif */}
            {isCicil && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Jumlah yang ingin dibayarkan
                  </label>
                  {isContinuingCicil && singleCicilInfo && (
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = Math.max(0, singleCicilInfo.totalAmount - singleCicilInfo.paidAmount);
                        setCustomAmount(remaining);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      Lunasi Sisa (Rp {(singleCicilInfo.totalAmount - singleCicilInfo.paidAmount).toLocaleString('id-ID')})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={customAmount ? customAmount.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const numVal = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                      setCustomAmount(numVal);
                    }}
                    placeholder="0"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal: Ringkasan & Konfirmasi */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Total Nominal</span>
            <span className="font-mono font-bold text-base sm:text-lg text-emerald-700">
              Rp {calculatedTotalAmount.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>{currentCartItem ? 'Perbarui Rincian' : 'Tambahkan ke Rincian'}</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
