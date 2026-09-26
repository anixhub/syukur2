import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, 
  X, 
  RotateCcw, 
  Check, 
  Calendar, 
  Users, 
  Home, 
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { AgeFilterConfig } from './AgeFilterModal';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  domisiliFilter: string;
  setDomisiliFilter: (val: string) => void;
  isDomisiliDisabled: boolean;
  emisFilter: string;
  setEmisFilter: (val: string) => void;
  ageFilterConfig: AgeFilterConfig;
  onOpenAgeModal: () => void;
  activeExcelFilterCount: number;
  onResetFilters: () => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  statusFilter,
  setStatusFilter,
  domisiliFilter,
  setDomisiliFilter,
  isDomisiliDisabled,
  emisFilter,
  setEmisFilter,
  ageFilterConfig,
  onOpenAgeModal,
  activeExcelFilterCount,
  onResetFilters
}) => {
  // Lock background scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Count active filters
  let activeCount = 0;
  if (statusFilter !== 'semua') activeCount++;
  if (domisiliFilter !== 'semua') activeCount++;
  if (emisFilter !== 'semua') activeCount++;
  if (ageFilterConfig.enabled) activeCount++;
  if (activeExcelFilterCount > 0) activeCount += activeExcelFilterCount;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div id="filter-bottom-sheet-container" className="fixed inset-0 z-[10000] flex flex-col justify-end sm:justify-center items-center">
          {/* Backdrop with Blur and Slight Dim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Bottom Sheet Modal Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="relative z-[10001] w-full sm:max-w-lg md:max-w-xl bg-white rounded-t-[28px] sm:rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col max-h-[88vh] sm:max-h-[85vh] overflow-hidden"
          >
            {/* Mobile Drag / Pull Handle Indicator */}
            <div 
              onClick={onClose}
              className="pt-3 pb-1 flex justify-center cursor-pointer sm:hidden select-none"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 transition-colors" />
            </div>

            {/* Header */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-slate-900 leading-tight">
                      Pengaturan Filter
                    </h3>
                    {activeCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                        {activeCount} Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Saring data santri berdasarkan kriteria
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-5">
              
              {/* 1. Status Keanggotaan */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Status Keanggotaan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'semua', label: 'Semua Status' },
                    { value: 'Aktif', label: 'Aktif' },
                    { value: 'Alumni', label: 'Alumni' },
                    { value: 'Meninggal', label: 'Meninggal' }
                  ].map((opt) => {
                    const isSelected = statusFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatusFilter(opt.value)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border select-none cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Status Domisili */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status Domisili
                  </label>
                  {isDomisiliDisabled && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      (Hanya berlaku untuk status Aktif)
                    </span>
                  )}
                </div>
                <div className={`grid grid-cols-3 gap-2 ${isDomisiliDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  {[
                    { value: 'semua', label: 'Semua' },
                    { value: 'Muqim', label: 'Muqim' },
                    { value: 'Kampung', label: 'Kampung' }
                  ].map((opt) => {
                    const isSelected = domisiliFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isDomisiliDisabled}
                        onClick={() => setDomisiliFilter(opt.value)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border select-none cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Status EMIS */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Status EMIS Kemenag
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'semua', label: 'Semua EMIS' },
                    { value: 'Terdaftar', label: 'Terdaftar' },
                    { value: 'Belum', label: 'Belum Terdaftar' },
                    { value: 'Invalid', label: 'Invalid' },
                    { value: 'Keluar', label: 'Keluar' },
                    { value: 'Lulus', label: 'Lulus' }
                  ].map((opt) => {
                    const isSelected = emisFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEmisFilter(opt.value)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border select-none cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Filter Rentang Usia */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Filter Umur Santri
                </label>
                <div
                  onClick={onOpenAgeModal}
                  className={`min-h-[50px] p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    ageFilterConfig.enabled
                      ? 'border-emerald-300 bg-emerald-50/60 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                      ageFilterConfig.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {ageFilterConfig.enabled ? (
                          ageFilterConfig.mode === 'exact'
                            ? `Tepat ${ageFilterConfig.exactAge || 0} Tahun`
                            : ageFilterConfig.mode === 'min'
                            ? `Minimal ${ageFilterConfig.minAge || 0} Tahun ke atas`
                            : ageFilterConfig.mode === 'max'
                            ? `Maksimal ${ageFilterConfig.maxAge || 0} Tahun ke bawah`
                            : `Rentang ${ageFilterConfig.minAge || 0} - ${ageFilterConfig.maxAge || '∞'} Tahun`
                        ) : (
                          'Semua Rentang Usia'
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {ageFilterConfig.enabled ? 'Filter usia aktif diterapkan' : 'Ketuk untuk mengatur batas usia santri'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      ageFilterConfig.enabled 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {ageFilterConfig.enabled ? 'Ubah' : 'Atur'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* 6. Active Excel Column Filter Notice (if any) */}
              {activeExcelFilterCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold">{activeExcelFilterCount} filter kolom tabel</span> sedang aktif diterapkan.
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onResetFilters}
                className="flex h-11 items-center gap-1.5 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Atur Ulang</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center cursor-pointer"
              >
                Terapkan Filter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FilterBottomSheet;
