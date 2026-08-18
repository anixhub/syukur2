import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Printer, Search, X, UserPlus, Users, ExternalLink,
  ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical, ArrowLeftRight, UserMinus, Eye
} from 'lucide-react';
import { Santri, Lembaga } from '../../types';
import { renderSantriAvatar } from '../SekretarisHelper';

interface LembagaCalonViewProps {
  selectedLembaga: Lembaga;
  activeTab: 'Formal' | 'Internal' | 'Rombel';
  students: Santri[];
  totalCalonCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (st: string) => void;
  onBackToHub: () => void;
  onPrintPDF: () => void;
  onSelectStudentDetail: (s: Santri) => void;
  selectedGender: 'Putra' | 'Putri';
  canWriteCurrent?: boolean;
  onUpdateEmisStatus?: (studentId: string, newStatus: 'Terdaftar' | 'Belum' | 'Invalid') => void;
  onTransferStudent?: (s: Santri) => void;
  onRemoveStudent?: (s: Santri) => void;
}

export const LembagaCalonView: React.FC<LembagaCalonViewProps> = ({
  selectedLembaga,
  activeTab,
  students,
  totalCalonCount,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onBackToHub,
  onPrintPDF,
  onSelectStudentDetail,
  selectedGender,
  canWriteCurrent = true,
  onUpdateEmisStatus,
  onTransferStudent,
  onRemoveStudent,
}) => {
  const isFormal = activeTab === 'Formal';
  const [membershipFilter, setMembershipFilter] = useState<string>('Semua');

  // Sorting state
  const [sortField, setSortField] = useState<'nama' | 'nik' | 'nis' | 'nisn' | 'induk' | 'statusEmis' | 'statusVerval' | 'statusKeanggotaan'>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Action Dropdown State (Matching LembagaKelasSub)
  const [activeActionStudentId, setActiveActionStudentId] = useState<string | null>(null);
  const [actionDropdownPos, setActionDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const getIndukNumber = (s: Santri) => {
    const lemNama = (selectedLembaga?.nama || '').toLowerCase();
    const lemKode = (selectedLembaga?.kode || '').toLowerCase();

    if (lemNama.includes('wustho') || lemKode.includes('wustho') || lemKode === 'spmw') {
      return s.indukWustho || s.indukMhd || s.indukUlya || '';
    }
    if (lemNama.includes('ulya') || lemKode.includes('ulya') || lemKode === 'spmu') {
      return s.indukUlya || s.indukWustho || s.indukMhd || '';
    }
    return s.indukMhd || s.indukWustho || s.indukUlya || '';
  };

  const getIndukLabel = () => {
    const lemNama = (selectedLembaga?.nama || '').toLowerCase();
    const lemKode = (selectedLembaga?.kode || '').toLowerCase();

    if (lemNama.includes('wustho') || lemKode.includes('wustho') || lemKode === 'spmw') {
      return 'Induk Wustho';
    }
    if (lemNama.includes('ulya') || lemKode.includes('ulya') || lemKode === 'spmu') {
      return 'Induk Ulya';
    }
    if (lemNama.includes('mhd') || lemNama.includes('madin') || lemNama.includes('diniyyah')) {
      return 'Induk MHD';
    }
    return 'No. Induk';
  };

  const handleSort = (field: 'nama' | 'nik' | 'nis' | 'nisn' | 'induk' | 'statusEmis' | 'statusVerval' | 'statusKeanggotaan') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    let terdaftar = 0;
    let belum = 0;
    let invalid = 0;

    students.forEach(s => {
      if (s.statusEmis === 'Terdaftar') terdaftar++;
      else if (s.statusEmis === 'Invalid') invalid++;
      else belum++;
    });

    return { terdaftar, belum, invalid };
  }, [students]);

  // Filtered and sorted students
  const displayStudents = useMemo(() => {
    let result = [...students];

    if (membershipFilter !== 'Semua') {
      result = result.filter(s => (s.statusKeanggotaan || 'Aktif') === membershipFilter);
    }

    result.sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      switch (sortField) {
        case 'nama':
          valA = a.nama || '';
          valB = b.nama || '';
          break;
        case 'nik':
          valA = a.nik || '';
          valB = b.nik || '';
          break;
        case 'nis':
          valA = a.nis || '';
          valB = b.nis || '';
          break;
        case 'nisn':
          valA = a.nisn || '';
          valB = b.nisn || '';
          break;
        case 'induk':
          valA = getIndukNumber(a);
          valB = getIndukNumber(b);
          break;
        case 'statusEmis':
          valA = a.statusEmis || 'Belum';
          valB = b.statusEmis || 'Belum';
          break;
        case 'statusVerval':
          valA = a.statusVerval || (a.nisn ? 'Sukses' : 'Proses');
          valB = b.statusVerval || (b.nisn ? 'Sukses' : 'Proses');
          break;
        case 'statusKeanggotaan':
          valA = a.statusKeanggotaan || 'Aktif';
          valB = b.statusKeanggotaan || 'Aktif';
          break;
      }

      return sortDirection === 'asc'
        ? valA.localeCompare(valB, 'id', { sensitivity: 'base', numeric: true })
        : valB.localeCompare(valA, 'id', { sensitivity: 'base', numeric: true });
    });

    return result;
  }, [students, membershipFilter, sortField, sortDirection, selectedLembaga]);

  const renderSortHeader = (
    label: string, 
    field: 'nama' | 'nik' | 'nis' | 'nisn' | 'induk' | 'statusEmis' | 'statusVerval' | 'statusKeanggotaan',
    className: string = '',
    align: 'left' | 'center' | 'right' = 'left'
  ) => {
    const isCurrent = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        className={`py-3.5 px-3 select-none cursor-pointer hover:bg-slate-100 transition-colors ${className}`}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span className="truncate">{label}</span>
          <span className="shrink-0 text-slate-400">
            {isCurrent ? (
              sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-amber-700" /> : <ChevronDown className="h-3.5 w-3.5 text-amber-700" />
            ) : (
              <ChevronsUpDown className="h-3 w-3 opacity-40" />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <motion.div
      key="calon-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* Header Card */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100/90">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBackToHub}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#00693E] transition-all font-bold text-xs shadow-3xs cursor-pointer active:scale-95 shrink-0"
              title="Kembali ke Menu Lembaga"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Menu Lembaga</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="font-bold text-slate-700 uppercase">{selectedLembaga?.nama}</span>
              <span>/</span>
              <span className="text-amber-700 font-extrabold">Calon Peserta Didik</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrintPDF}
              className="inline-flex items-center justify-center bg-white border border-slate-200 h-9 px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs active:scale-95 transition-all gap-1.5"
              title="Cetak Calon Peserta Didik"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              <span>Cetak Calon Santri</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <UserPlus className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                Calon Peserta Didik
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Unit {selectedLembaga?.nama} ({selectedGender}) &bull; Santri baru atau belum memiliki rombel definitif
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-black border border-amber-200/80">
              Total {totalCalonCount} Calon Santri
            </span>
          </div>
        </div>

        {/* EMIS Stats Bar for Formal */}
        {isFormal && totalCalonCount > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800">EMIS Terdaftar</span>
              <span className="text-sm font-black text-emerald-700">{stats.terdaftar}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-bold text-slate-600">Belum Terdaftar</span>
              <span className="text-sm font-black text-slate-700">{stats.belum}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
              <span className="text-xs font-bold text-rose-800">Data Invalid</span>
              <span className="text-sm font-black text-rose-700">{stats.invalid}</span>
            </div>
          </div>
        )}
      </div>

      {/* Table & Filters */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xs relative">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama calon santri, NIS, NIK, NISN, atau no. induk..."
              className="w-full h-10.5 pl-10 pr-10 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all shadow-3xs"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isFormal && (
              <div className="min-w-[150px]">
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  className="w-full h-10.5 px-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-3xs"
                >
                  <option value="Semua">Semua Status EMIS</option>
                  <option value="Terdaftar">Terdaftar</option>
                  <option value="Belum">Belum Terdaftar</option>
                  <option value="Invalid">Invalid</option>
                </select>
              </div>
            )}

            <div className="min-w-[140px]">
              <select
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value)}
                className="w-full h-10.5 px-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-3xs"
              >
                <option value="Semua">Semua Keanggotaan</option>
                <option value="Aktif">Status Aktif</option>
                <option value="Alumni">Status Alumni</option>
                <option value="Mutasi">Status Mutasi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-3xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="w-12 py-3.5 px-3 text-center">No</th>
                  {renderSortHeader('NIS', 'nis', 'w-28')}
                  {renderSortHeader('Nama Calon Santri', 'nama')}
                  {isFormal && renderSortHeader('NIK', 'nik', 'w-36')}
                  {renderSortHeader('NISN', 'nisn', 'w-32')}
                  {renderSortHeader(getIndukLabel(), 'induk', 'w-32')}
                  {isFormal && (
                    <>
                      {renderSortHeader('EMIS', 'statusEmis', 'w-28 text-center', 'center')}
                      {renderSortHeader('Verval', 'statusVerval', 'w-24 text-center', 'center')}
                    </>
                  )}
                  {renderSortHeader('Status', 'statusKeanggotaan', 'w-24 text-center', 'center')}
                  <th className="sticky right-0 z-10 w-[56px] min-w-[56px] max-w-[56px] py-3.5 px-2 text-center bg-slate-50 border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.03)]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayStudents.length === 0 ? (
                  <tr>
                    <td colSpan={isFormal ? 10 : 7} className="py-16 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UserPlus className="h-8 w-8 text-slate-300" />
                        <p className="font-bold text-slate-600">Tidak ada calon santri</p>
                        <p className="text-xs text-slate-400">
                          {searchQuery || statusFilter !== 'Semua' || membershipFilter !== 'Semua'
                            ? 'Tidak ada data calon santri yang cocok dengan filter.'
                            : 'Semua santri di unit ini telah memiliki kelas definitif.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayStudents.map((s, idx) => {
                    const indukVal = getIndukNumber(s);
                    const isNisnValid = !!(s.nisn && s.nisn.trim() !== '');

                    return (
                      <tr 
                        key={s.id || idx}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-600">
                          {s.nis || '-'}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
                              {renderSantriAvatar(s, 'w-full h-full object-cover')}
                            </div>
                            <div className="min-w-0">
                              <span 
                                onClick={() => onSelectStudentDetail(s)}
                                className="font-extrabold text-slate-800 hover:text-amber-700 cursor-pointer hover:underline truncate block"
                                title={s.nama}
                              >
                                {s.nama}
                              </span>
                              {(s.desa || s.kecamatan || s.kabupaten) && (
                                <span className="text-[10px] text-slate-400 font-semibold truncate block">
                                  {[s.desa, s.kecamatan, s.kabupaten].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {isFormal && (
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-600">
                            {s.nik || <span className="text-slate-300">-</span>}
                          </td>
                        )}
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-600">
                          {s.nisn || <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-500">
                          {indukVal || <span className="text-slate-300">-</span>}
                        </td>
                        {isFormal && (
                          <>
                            <td className="py-3.5 px-3 text-center">
                              {onUpdateEmisStatus && canWriteCurrent ? (
                                <select
                                  value={s.statusEmis || 'Belum'}
                                  onChange={(e) => onUpdateEmisStatus(s.id, e.target.value as any)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border cursor-pointer ${
                                    s.statusEmis === 'Terdaftar'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : s.statusEmis === 'Invalid'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  <option value="Terdaftar">Terdaftar</option>
                                  <option value="Belum">Belum</option>
                                  <option value="Invalid">Invalid</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                  s.statusEmis === 'Terdaftar'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : s.statusEmis === 'Invalid'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {s.statusEmis || 'Belum'}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                                (s.statusVerval || (isNisnValid ? 'Sukses' : 'Proses')) === 'Sukses'
                                  ? 'bg-[#E6F4EA] text-[#137333]'
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {s.statusVerval || (isNisnValid ? 'Sukses' : 'Proses')}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            s.statusKeanggotaan === 'Aktif' || !s.statusKeanggotaan
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : s.statusKeanggotaan === 'Alumni'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.statusKeanggotaan || 'Aktif'}
                          </span>
                        </td>

                        {/* Standardized Aksi Column matching LembagaKelasSub */}
                        <td className="sticky right-0 z-10 w-[56px] min-w-[56px] max-w-[56px] text-center px-2 py-3.5 transition-colors border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.03)] bg-white group-hover:bg-slate-50">
                          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const dropdownWidth = 140;
                                const dropdownHeight = 140;
                                let top = rect.bottom;
                                if (top + dropdownHeight > window.innerHeight) {
                                  top = rect.top - dropdownHeight;
                                }
                                let left = rect.right - dropdownWidth;
                                if (left < 8) left = 8;
                                if (left + dropdownWidth > window.innerWidth - 8) {
                                  left = window.innerWidth - dropdownWidth - 8;
                                }

                                if (activeActionStudentId === s.id) {
                                  setActiveActionStudentId(null);
                                  setActionDropdownPos(null);
                                } else {
                                  setActiveActionStudentId(s.id);
                                  setActionDropdownPos({ top, left });
                                }
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Menu Aksi"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Fixed Action Dropdown (Matching LembagaKelasSub) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeActionStudentId && actionDropdownPos && (() => {
            const s = displayStudents.find(x => x.id === activeActionStudentId) || students.find(x => x.id === activeActionStudentId);
            if (!s) return null;
            return (
              <>
                <div 
                  className="fixed inset-0 z-[9990]" 
                  onClick={() => { setActiveActionStudentId(null); setActionDropdownPos(null); }} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    position: 'fixed',
                    top: `${actionDropdownPos.top}px`,
                    left: `${actionDropdownPos.left}px`,
                    zIndex: 9999
                  }}
                  className="w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-[11px] font-bold text-slate-700 text-left overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onSelectStudentDetail(s);
                      setActiveActionStudentId(null);
                      setActionDropdownPos(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>Detail</span>
                  </button>
                  {onTransferStudent && (
                    <button
                      onClick={() => {
                        onTransferStudent(s);
                        setActiveActionStudentId(null);
                        setActionDropdownPos(null);
                      }}
                      className="w-full text-left px-3 py-2 transition-colors cursor-pointer hover:bg-slate-50 hover:text-blue-700 flex items-center gap-2"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
                      <span>Pindah Kelas</span>
                    </button>
                  )}
                  {onRemoveStudent && (
                    <button
                      onClick={() => {
                        setActiveActionStudentId(null);
                        setActionDropdownPos(null);
                        onRemoveStudent(s);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer text-rose-600 border-t border-slate-100 flex items-center gap-2"
                    >
                      <UserMinus className="h-3.5 w-3.5 text-rose-500" />
                      <span>Keluarkan</span>
                    </button>
                  )}
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

export default LembagaCalonView;
