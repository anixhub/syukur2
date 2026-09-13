import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  SlidersHorizontal, 
  Search, 
  RotateCcw, 
  Check, 
  Eye, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { ALL_COLUMNS, DEFAULT_TABLE_COLUMNS } from '../../constants/monitoringColumns';

interface ColumnVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function ColumnVisibilityModal({
  isOpen,
  onClose,
  visibleColumns,
  setVisibleColumns,
}: ColumnVisibilityModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback map of human labels for all known fields
  const labelsMap: Record<string, { label: string; description?: string }> = useMemo(() => {
    const map: Record<string, { label: string; description?: string }> = {};
    ALL_COLUMNS.forEach((col) => {
      map[col.key] = {
        label: col.label,
        description: col.description,
      };
    });
    return map;
  }, []);

  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    ALL_COLUMNS.forEach((c) => keys.add(c.key));
    Object.keys(visibleColumns).forEach((k) => keys.add(k));
    return Array.from(keys);
  }, [visibleColumns]);

  const filteredKeys = useMemo(() => {
    if (!searchQuery.trim()) return allKeys;
    const q = searchQuery.toLowerCase().trim();
    return allKeys.filter((k) => {
      const info = labelsMap[k];
      const label = info?.label || k;
      const desc = info?.description || '';
      return label.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || k.toLowerCase().includes(q);
    });
  }, [allKeys, searchQuery, labelsMap]);

  const activeCount = useMemo(() => {
    return allKeys.filter((k) => !!visibleColumns[k]).length;
  }, [allKeys, visibleColumns]);

  const allChecked = activeCount === allKeys.length;
  const isIndeterminate = activeCount > 0 && !allChecked;

  const handleToggleColumn = (colKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colKey]: !prev[colKey],
    }));
  };

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {};
    allKeys.forEach((k) => {
      next[k] = true;
    });
    setVisibleColumns(next);
  };

  const handleDeselectAll = () => {
    const next: Record<string, boolean> = {};
    allKeys.forEach((k) => {
      next[k] = false;
    });
    setVisibleColumns(next);
  };

  const handleResetDefault = () => {
    const next: Record<string, boolean> = {};
    allKeys.forEach((k) => {
      next[k] = DEFAULT_TABLE_COLUMNS.includes(k as any);
    });
    setVisibleColumns(next);
  };

  if (!isOpen) return null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div 
        id="modal-column-visibility-backdrop" 
        className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-[90%] max-w-[90vw] sm:w-full sm:max-w-[518px] max-h-[90vh] sm:max-h-[85vh] rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden text-slate-800 mb-3 sm:mb-0 mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Bottom-sheet drag indicator */}
          <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>

          {/* Modal Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Atur Visibilitas Kolom
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tampilkan atau sembunyikan kolom data pada tabel
                </p>
              </div>
            </div>

            <button
              id="btn-close-column-modal"
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search & Quick Controls Bar */}
          <div className="px-5 sm:px-6 pt-3.5 pb-2 space-y-3 shrink-0 bg-slate-50/70 border-b border-slate-100">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kolom..."
                className="w-full h-10 pl-9.5 pr-4 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded-full p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Actions & Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  {activeCount}
                </span>
                <span className="text-slate-500 text-xs">dari {allKeys.length} kolom aktif</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={allChecked ? handleDeselectAll : handleSelectAll}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  {allChecked ? 'Batal Semua' : 'Pilih Semua'}
                </button>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all shadow-2xs cursor-pointer active:scale-95"
                  title="Kembalikan ke kolom standar"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Default</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Column List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 divide-y-0 scrollbar-thin">
            {filteredKeys.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Tidak ada kolom yang cocok dengan pencarian "{searchQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredKeys.map((colKey) => {
                  const info = labelsMap[colKey];
                  const label = info?.label || colKey;
                  const isChecked = !!visibleColumns[colKey];

                  return (
                    <div
                      key={colKey}
                      onClick={() => handleToggleColumn(colKey)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none min-h-[42px] ${
                        isChecked
                          ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 shadow-2xs'
                          : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <span className={`text-xs font-bold leading-tight truncate block ${
                          isChecked ? 'text-emerald-950' : 'text-slate-700'
                        }`}>
                          {label}
                        </span>
                      </div>

                      {/* Rounded Checkbox / Toggle Indicator */}
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isChecked 
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Perubahan langsung diterapkan pada tabel
            </span>
            <button
              id="btn-apply-column-modal"
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 text-white font-display text-xs font-bold px-6 py-2.5 shadow-sm hover:bg-emerald-800 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Selesai</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
