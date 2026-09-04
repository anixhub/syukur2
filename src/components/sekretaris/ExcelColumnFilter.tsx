import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Filter, 
  Search, 
  X, 
  Check, 
  RotateCcw, 
  SlidersHorizontal,
  Layers,
  ChevronRight,
  CheckSquare,
  Square
} from 'lucide-react';
import { Santri, Lembaga, Kelas, isCalonClass } from '../../types';
import { ALL_COLUMNS, ColumnConfig } from '../../constants/monitoringColumns';
import { AgeFilterConfig, calculateAgeOnDate } from './AgeFilterModal';
import { getLembagaJenis, getSantriFormalEducationInfo, getDefaultCalonClassName } from '../../lib/utils';

export function getColumnValueString(
  s: Santri, 
  key: string, 
  ageFilterConfig?: AgeFilterConfig,
  lembagasList?: Lembaga[],
  kelasList?: Kelas[]
): string {
  if (key === 'umur') {
    if (!s.tanggalLahir) return '(Kosong)';
    const refDate = ageFilterConfig?.refType === 'custom' && ageFilterConfig?.customDate
      ? new Date(ageFilterConfig.customDate)
      : new Date();
    const age = calculateAgeOnDate(s.tanggalLahir, refDate);
    return age !== null ? `${age} Tahun` : '(Kosong)';
  }
  if (key === 'pendidikanFormal') {
    const formalInfo = getSantriFormalEducationInfo(s, lembagasList, kelasList);
    return formalInfo.filterDisplay || (formalInfo.isFormal && formalInfo.lembaga 
      ? `${(formalInfo.lembaga.kode?.trim() || formalInfo.lembaga.nama.trim())} - ${formalInfo.display}` 
      : formalInfo.display);
  }
  const raw = (s as any)[key];
  if (raw === undefined || raw === null || String(raw).trim() === '' || String(raw).trim() === '-') {
    return '(Kosong)';
  }
  return String(raw).trim();
}

export function getColumnLabel(key: string): string {
  if (key === 'umur') return 'Umur';
  if (key === 'nama') return 'Nama Lengkap';
  const found = ALL_COLUMNS.find(c => c.key === key);
  if (found) return found.label;
  if (key === 'statusKeanggotaan') return 'Status';
  if (key === 'statusEmis') return 'Emis';
  if (key === 'statusVerval') return 'Verval';
  return key;
}

interface ExcelFilterPopoverProps {
  colKey: string;
  colLabel: string;
  santriList: Santri[];
  selectedValues: string[] | undefined;
  onApplyFilter: (colKey: string, selectedValues: string[] | undefined) => void;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  onApplySort: (colKey: string, dir: 'asc' | 'desc') => void;
  onClose: () => void;
  anchorRect: { top: number; left: number; right?: number; bottom?: number; width?: number; height?: number } | null;
  ageFilterConfig?: AgeFilterConfig;
  lembagasList?: Lembaga[];
  kelasList?: Kelas[];
}

export function ExcelFilterPopover({
  colKey,
  colLabel,
  santriList,
  selectedValues,
  onApplyFilter,
  sortKey,
  sortDirection,
  onApplySort,
  onClose,
  anchorRect,
  ageFilterConfig,
  lembagasList,
  kelasList
}: ExcelFilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all distinct values and item counts for this column
  const distinctStats = useMemo(() => {
    const counts: Record<string, number> = {};

    // Special synchronized handling for Pendidikan Formal
    if (colKey === 'pendidikanFormal') {
      // 1. Resolve lembaga & kelas lists
      let lems = lembagasList;
      if (!lems || lems.length === 0) {
        try {
          const lStr = typeof window !== 'undefined' ? localStorage.getItem('smartsantri_lembagas') : null;
          if (lStr) lems = JSON.parse(lStr);
        } catch {}
      }
      let kls = kelasList;
      if (!kls || kls.length === 0) {
        try {
          const kStr = typeof window !== 'undefined' ? localStorage.getItem('smartsantri_kelas') : null;
          if (kStr) kls = JSON.parse(kStr);
        } catch {}
      }
      lems = lems || [];
      kls = kls || [];

      // 2. Count actual formal education distribution across santri
      santriList.forEach(s => {
        const val = getColumnValueString(s, colKey, ageFilterConfig, lems, kls);
        if (val) {
          counts[val] = (counts[val] || 0) + 1;
        }
      });

      // ONLY keep values that have at least 1 santri in the current list (count > 0).
      // This prevents inflating the filter to 48 items with empty/useless 0-count dummy entries.
      const sortedVals = Object.keys(counts)
        .filter(val => counts[val] > 0)
        .sort((a, b) => {
          if (a === 'TIDAK TERDAFTAR' || a === '(Kosong)') return 1;
          if (b === 'TIDAK TERDAFTAR' || b === '(Kosong)') return -1;
          const aIsCalon = isCalonClass(a);
          const bIsCalon = isCalonClass(b);
          if (aIsCalon && !bIsCalon) return 1;
          if (!aIsCalon && bIsCalon) return -1;
          return a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' });
        });

      return sortedVals.map(val => ({
        value: val,
        count: counts[val]
      }));
    }

    // Default for all other columns
    santriList.forEach(s => {
      const val = getColumnValueString(s, colKey, ageFilterConfig, lembagasList, kelasList);
      if (val) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });

    const sortedVals = Object.keys(counts)
      .filter(val => counts[val] > 0)
      .sort((a, b) => {
        if (a === '(Kosong)') return 1;
        if (b === '(Kosong)') return -1;
        return a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' });
      });

    return sortedVals.map(val => ({
      value: val,
      count: counts[val]
    }));
  }, [santriList, colKey, ageFilterConfig, lembagasList, kelasList]);

  const allPossibleValues = useMemo(() => distinctStats.map(s => s.value), [distinctStats]);

  // Local state for checkboxes
  const [checkedValues, setCheckedValues] = useState<Set<string>>(() => {
    if (!selectedValues || selectedValues.length === 0) {
      return new Set(allPossibleValues);
    }
    return new Set(selectedValues);
  });

  // Filter distinct values based on search inside popover
  const filteredStats = useMemo(() => {
    if (!searchTerm.trim()) return distinctStats;
    const term = searchTerm.toLowerCase();
    return distinctStats.filter(s => s.value.toLowerCase().includes(term));
  }, [distinctStats, searchTerm]);

  // Sync click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && target.closest('.excel-filter-popover')) return;
      onClose();
    };

    window.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  // Calculate coordinates to keep popover within viewport
  const popoverWidth = 280;
  let top = anchorRect.bottom ? anchorRect.bottom + 6 : anchorRect.top + 32;
  let left = anchorRect.left;

  if (left + popoverWidth > window.innerWidth - 16) {
    left = window.innerWidth - popoverWidth - 16;
  }
  if (left < 16) left = 16;

  // Adjust top if near bottom of screen
  if (top + 380 > window.innerHeight && anchorRect.top > 380) {
    top = anchorRect.top - 380 - 6;
  }

  const isAllChecked = filteredStats.every(s => checkedValues.has(s.value));
  const isSomeChecked = filteredStats.some(s => checkedValues.has(s.value)) && !isAllChecked;

  const handleToggleAll = () => {
    const next = new Set(checkedValues);
    if (isAllChecked) {
      filteredStats.forEach(s => next.delete(s.value));
    } else {
      filteredStats.forEach(s => next.add(s.value));
    }
    setCheckedValues(next);
  };

  const handleToggleValue = (val: string) => {
    const next = new Set(checkedValues);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    setCheckedValues(next);
  };

  const handleApply = () => {
    if (checkedValues.size === 0 || checkedValues.size === allPossibleValues.length) {
      // If all or none checked, reset filter for this column
      onApplyFilter(colKey, undefined);
    } else {
      onApplyFilter(colKey, Array.from(checkedValues));
    }
    onClose();
  };

  const handleClear = () => {
    onApplyFilter(colKey, undefined);
    onClose();
  };

  const isCurrentSortedAsc = sortKey === colKey && sortDirection === 'asc';
  const isCurrentSortedDesc = sortKey === colKey && sortDirection === 'desc';
  const isFilterActive = selectedValues !== undefined && selectedValues.length < allPossibleValues.length;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ top: `${top}px`, left: `${left}px` }}
      className="excel-filter-popover fixed z-[9999] w-[280px] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl animate-in fade-in zoom-in-95"
      onClick={e => e.stopPropagation()}
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Filter className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate">{colLabel}</h4>
            <p className="text-[10px] text-slate-400 font-medium">Filter Nilai Unik</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filter Section */}
      <div className="mt-2.5 space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari item di list..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-7 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Select All Toggle */}
        <div className="flex items-center justify-between px-1 py-1 text-xs">
          <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllChecked}
              ref={el => {
                if (el) el.indeterminate = isSomeChecked;
              }}
              onChange={handleToggleAll}
              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>(Pilih Semua)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            {checkedValues.size} / {allPossibleValues.length}
          </span>
        </div>

        {/* Value List */}
        <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-lg border border-slate-100 bg-slate-50/30 p-1 scrollbar-thin">
          {filteredStats.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 italic">
              Tidak ada data cocok
            </div>
          ) : (
            filteredStats.map(item => {
              const checked = checkedValues.has(item.value);
              return (
                <label
                  key={item.value}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs cursor-pointer select-none transition-colors ${
                    checked ? 'bg-emerald-50/50 text-slate-800 font-medium' : 'text-slate-600 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleValue(item.value)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                    />
                    <span className={`truncate ${item.value === '(Kosong)' ? 'italic text-slate-400' : ''}`}>
                      {item.value}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0 bg-white border border-slate-100 px-1.5 py-0.5 rounded-full">
                    {item.count}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* Popover Footer Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 gap-2">
        {isFilterActive ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        ) : (
          <span className="text-[10px] text-slate-400">Semua Pilihan</span>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Modal component allowing filtering and sorting on ANY column whether shown in table or hidden
interface ExcelColumnFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  excelColumnFilters: Record<string, string[]>;
  onApplyFilter: (colKey: string, selectedValues: string[] | undefined) => void;
  onResetAllFilters: () => void;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  onApplySort: (colKey: string, dir: 'asc' | 'desc') => void;
  ageFilterConfig?: AgeFilterConfig;
  lembagasList?: Lembaga[];
  kelasList?: Kelas[];
}

export function ExcelColumnFilterModal({
  isOpen,
  onClose,
  santriList,
  excelColumnFilters,
  onApplyFilter,
  onResetAllFilters,
  sortKey,
  sortDirection,
  onApplySort,
  ageFilterConfig,
  lembagasList,
  kelasList
}: ExcelColumnFilterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeColKey, setActiveColKey] = useState<string | null>(null);
  const [colAnchorRect, setColAnchorRect] = useState<{ top: number; left: number; right?: number; bottom?: number } | null>(null);

  if (!isOpen) return null;

  const allFilterableColumns = [
    ...(ageFilterConfig?.enabled ? [{ key: 'umur', label: 'Umur', description: 'Umur berdasarkan Tanggal Lahir' }] : []),
    ...ALL_COLUMNS
  ];

  const filteredColumns = allFilterableColumns.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  const activeFilterKeys = Object.keys(excelColumnFilters).filter(
    k => excelColumnFilters[k] && excelColumnFilters[k].length > 0
  );

  const handleOpenColPopover = (e: React.MouseEvent, key: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveColKey(key);
    setColAnchorRect({
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div 
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Filter Per Kolom (Excel)</h3>
              <p className="text-xs text-slate-500">
                Atur filter nilai unik untuk seluruh kolom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Active Filters Summary */}
          {activeFilterKeys.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  {activeFilterKeys.length} Kolom Memiliki Filter Aktif
                </span>
              </div>
              <button
                type="button"
                onClick={onResetAllFilters}
                className="flex items-center gap-1 font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 rounded-lg px-2.5 py-1 shadow-2xs cursor-pointer transition-all hover:bg-rose-50"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Semua</span>
              </button>
            </div>
          )}

          {/* Search Column Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kolom (mis. NIS, NIK, Desa, Pekerjaan Ayah, Status)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Column List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {filteredColumns.map(col => {
              const activeValues = excelColumnFilters[col.key];
              const hasFilter = activeValues && activeValues.length > 0;
              const isSorted = sortKey === col.key;

              return (
                <div
                  key={col.key}
                  onClick={(e) => handleOpenColPopover(e, col.key)}
                  className={`group relative flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                    hasFilter
                      ? 'border-emerald-400 bg-emerald-50/40 shadow-2xs hover:border-emerald-500'
                      : isSorted
                      ? 'border-blue-300 bg-blue-50/30 hover:border-blue-400'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {col.label}
                      </span>
                      {isSorted && (
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {col.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasFilter ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                        <Filter className="h-2.5 w-2.5" />
                        <span>{activeValues.length} nilai</span>
                      </span>
                    ) : (
                      <div className="h-7 w-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-600 group-hover:border-slate-300 bg-white">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Total {allFilterableColumns.length} Kolom Tersedia
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-900 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Render Popover if active column selected */}
      {activeColKey && colAnchorRect && (
        <ExcelFilterPopover
          colKey={activeColKey}
          colLabel={getColumnLabel(activeColKey)}
          santriList={santriList}
          selectedValues={excelColumnFilters[activeColKey]}
          onApplyFilter={onApplyFilter}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onApplySort={onApplySort}
          onClose={() => {
            setActiveColKey(null);
            setColAnchorRect(null);
          }}
          anchorRect={colAnchorRect}
          ageFilterConfig={ageFilterConfig}
          lembagasList={lembagasList}
          kelasList={kelasList}
        />
      )}
    </div>,
    document.body
  );
}
