import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Download, Printer, Search, X, UserPlus, Users, ExternalLink,
  ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical, ArrowLeftRight, UserMinus, Eye, Pencil,
  Sparkles, Check, ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRight, Calendar
} from 'lucide-react';
import { Santri, Lembaga } from '../../types';
import { renderSantriAvatar } from '../SekretarisHelper';
import EditSantriKolomModal from './EditSantriKolomModal';
import { 
  getNismFieldKeyForLembaga,
  getSantriNismForLembaga,
  getSantriTahunMasukLembaga,
  formatTanggalMasukDMY,
  parseTanggalMasukToYear,
  generate18DigitNism,
  getNextSequenceForSantri,
  updateSantriNismAndTahunMasuk,
  batchGenerateNismForStudents
} from '../../lib/nismHelper';

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
  onExport?: () => void;
  onPrintPDF: () => void;
  onSelectStudentDetail: (s: Santri) => void;
  onUpdateSantri?: (s: Santri) => void;
  selectedGender: 'Putra' | 'Putri';
  canWriteCurrent?: boolean;
  onUpdateEmisStatus?: (studentId: string, newStatus: 'Terdaftar' | 'Belum' | 'Invalid') => void;
  onTransferStudent?: (s: Santri) => void;
  onRemoveStudent?: (s: Santri) => void;
}

const calculateAge = (birthDateString?: string) => {
  if (!birthDateString) return '-';
  const birth = new Date(birthDateString);
  if (isNaN(birth.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} Thn` : '-';
};

const formatTanggal = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

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
  onExport,
  onPrintPDF,
  onSelectStudentDetail,
  onUpdateSantri,
  selectedGender,
  canWriteCurrent = true,
  onUpdateEmisStatus,
  onTransferStudent,
  onRemoveStudent,
}) => {
  const isFormal = activeTab === 'Formal';
  const [membershipFilter, setMembershipFilter] = useState<string>('Semua');
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1-Line Inline Tanggal Masuk Lembaga state
  const currentYear = new Date().getFullYear();
  const [tanggalMasukLembagaInput, setTanggalMasukLembagaInput] = useState<string>(`15/07/${currentYear}`);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sorting state
  const [sortField, setSortField] = useState<'nama' | 'nik' | 'nis' | 'nisn' | 'induk' | 'statusEmis' | 'statusVerval' | 'statusKeanggotaan'>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Action Dropdown State
  const [activeActionStudentId, setActiveActionStudentId] = useState<string | null>(null);
  const [actionDropdownPos, setActionDropdownPos] = useState<{ top: number; left: number } | null>(null);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, membershipFilter, pageSize]);

  const nismFieldKey = getNismFieldKeyForLembaga(selectedLembaga);
  const nismLabelSub = nismFieldKey === 'indukWustho' 
    ? 'Induk Wustho' 
    : nismFieldKey === 'indukUlya' 
    ? 'Induk Ulya' 
    : nismFieldKey === 'indukMhd' 
    ? 'Induk MHD' 
    : '18 Digit';

  const handleGenerateSingleNism = (targetSantri: Santri) => {
    if (!onUpdateSantri) return;
    const tglInput = tanggalMasukLembagaInput.trim() || `15/07/${currentYear}`;
    const year = parseTanggalMasukToYear(tglInput);
    const seq = getNextSequenceForSantri(targetSantri, students, selectedLembaga, year);
    const newNism = generate18DigitNism(targetSantri, selectedLembaga, seq, year);
    const updated = updateSantriNismAndTahunMasuk(targetSantri, newNism, year, selectedLembaga, tglInput);
    onUpdateSantri(updated);
    showToast(`NISM 18-Digit (${nismLabelSub}) ${targetSantri.nama} berhasil dibuat: ${newNism}`);
  };

  const handleExecuteBatchGenerate = () => {
    if (!onUpdateSantri) return;
    const tglInput = tanggalMasukLembagaInput.trim() || `15/07/${currentYear}`;
    const { updatedStudents, countGenerated } = batchGenerateNismForStudents(
      students,
      selectedLembaga,
      false,
      tglInput,
      true
    );
    updatedStudents.forEach(st => onUpdateSantri(st));
    showToast(`Berhasil men-generate ${countGenerated} NISM 18-Digit calon santri.`);
  };

  const handleUpdateNismInline = (s: Santri, val: string) => {
    if (!onUpdateSantri) return;
    const currentVal = getSantriNismForLembaga(s, selectedLembaga);
    if (val.trim() === currentVal) return;
    const updated = updateSantriNismAndTahunMasuk(s, val.trim(), s.tahunMasukLembaga, selectedLembaga);
    onUpdateSantri(updated);
    showToast(`NISM ${s.nama} diperbarui.`);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Filter by membership
    if (membershipFilter !== 'Semua') {
      result = result.filter(s => (s.statusKeanggotaan || 'Aktif') === membershipFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

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
          valA = getSantriNismForLembaga(a, selectedLembaga) || '';
          valB = getSantriNismForLembaga(b, selectedLembaga) || '';
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

      const comparison = valA.localeCompare(valB, 'id-ID', { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [students, membershipFilter, sortField, sortDirection, selectedLembaga]);

  // Pagination calculations
  const totalItems = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const displayStudents = useMemo(() => {
    return filteredAndSortedStudents.slice(startIndex, endIndex);
  }, [filteredAndSortedStudents, startIndex, endIndex]);

  // EMIS Stats calculation
  const stats = useMemo(() => {
    const terdaftar = students.filter(s => s.statusEmis === 'Terdaftar').length;
    const invalid = students.filter(s => s.statusEmis === 'Invalid').length;
    const belum = students.length - terdaftar - invalid;
    return { terdaftar, invalid, belum };
  }, [students]);

  const renderSortHeader = (label: string, field: typeof sortField, extraClass = '', align: 'left' | 'center' = 'left') => {
    const isCurrent = sortField === field;
    return (
      <div 
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1 cursor-pointer select-none group/sort ${align === 'center' ? 'justify-center' : 'justify-start'} ${extraClass}`}
      >
        <span className={isCurrent ? 'text-amber-800 font-black' : 'group-hover/sort:text-slate-900'}>{label}</span>
        <span className="text-slate-400 group-hover/sort:text-slate-600">
          {isCurrent ? (
            sortDirection === 'asc' ? <ChevronUp className="h-3 w-3 text-amber-700 stroke-[3]" /> : <ChevronDown className="h-3 w-3 text-amber-700 stroke-[3]" />
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-30 group-hover/sort:opacity-100" />
          )}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      key="calon-peserta-didik-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100/90">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onBackToHub}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-amber-800 transition-all font-bold text-xs shadow-3xs cursor-pointer active:scale-95 shrink-0"
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
              onClick={handleOpenBatchGenerate}
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3.5 rounded-xl text-xs font-bold cursor-pointer shadow-3xs active:scale-95 transition-all gap-1.5"
              title="Generate Otomatis NISM 22 Digit untuk Calon Santri"
            >
              <Sparkles className="h-4 w-4 text-emerald-100" />
              <span>Generate NISM</span>
            </button>

            <button
              onClick={onExport || onPrintPDF}
              className="inline-flex items-center justify-center bg-white border border-slate-200 h-9 px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs active:scale-95 transition-all gap-1.5"
              title="Ekspor Data Calon Peserta Didik (Excel / PDF)"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export Data</span>
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
              placeholder="Cari nama calon santri, NIS, NIK, NISN, NISM, atau Wali..."
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
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider select-none">
                  <th className="w-10 py-3.5 px-2 text-center sticky left-0 z-20 bg-slate-100 border-r border-slate-200">NO</th>
                  <th className="w-56 py-3.5 px-3 border-r border-slate-200">
                    <div className="flex items-center justify-between">
                      <span>NISM (22 DIGIT)</span>
                      <span className="text-[9px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 lowercase font-mono">
                        {nismLabelSub}
                      </span>
                    </div>
                  </th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">{renderSortHeader('NISN', 'nisn')}</th>
                  <th className="w-52 py-3.5 px-3 border-r border-slate-200">{renderSortHeader('NAMA', 'nama')}</th>
                  <th className="w-32 py-3.5 px-3 border-r border-slate-200">TEMPAT LAHIR</th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">TGL LAHIR</th>
                  <th className="w-16 py-3.5 px-2 text-center border-r border-slate-200">UMUR</th>
                  <th className="w-16 py-3.5 px-2 text-center border-r border-slate-200">L/P</th>
                  <th className="w-36 py-3.5 px-3 border-r border-slate-200">NAMA AYAH</th>
                  <th className="w-36 py-3.5 px-3 border-r border-slate-200">NAMA IBU</th>
                  <th className="w-24 py-3.5 px-2 text-center border-r border-slate-200">{renderSortHeader('EMIS', 'statusEmis', '', 'center')}</th>
                  <th className="w-24 py-3.5 px-2 text-center border-r border-slate-200">{renderSortHeader('VERVAL', 'statusVerval', '', 'center')}</th>
                  <th className="w-24 py-3.5 px-2 text-center border-r border-slate-200">{renderSortHeader('STATUS', 'statusKeanggotaan', '', 'center')}</th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">KELAS MHD</th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">SEMESTER</th>
                  <th className="sticky right-0 z-20 w-16 py-3.5 px-2 text-center bg-slate-100 border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.03)]">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayStudents.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-16 text-center text-slate-400 font-medium">
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
                    const rowNumber = startIndex + idx + 1;
                    const isNisnValid = !!(s.nisn && s.nisn.trim() !== '');
                    const ageStr = calculateAge(s.tanggalLahir);
                    const genderCode = s.gender === 'Putra' ? 'L' : s.gender === 'Putri' ? 'P' : (s.gender || '-');
                    const nismVal = getSantriNismForLembaga(s, selectedLembaga);
                    const kelasMhdVal = s.kelasMhd || s.pendidikanInternal || s.indukMhd || '-';
                    const semesterVal = s.semester || 'Semester 1';
                    const isVervalSukses = (s.statusVerval || (isNisnValid ? 'Sukses' : 'Proses')) === 'Sukses';

                    return (
                      <tr 
                        key={s.id || idx}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* 1. NO */}
                        <td className="py-3 px-2 text-center font-bold text-slate-400 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                          {rowNumber}
                        </td>

                        {/* 2. NISM (with inline edit & generate button) */}
                        <td className="py-2.5 px-2 font-mono font-bold text-slate-700 border-r border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              defaultValue={nismVal}
                              key={`nism-${s.id}-${nismVal}`}
                              onBlur={(e) => handleUpdateNismInline(s, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              placeholder="22 Digit NISM..."
                              className="flex-1 font-mono text-[11px] font-bold text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-amber-500 rounded px-1.5 py-1 outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenSingleGenerate(s)}
                              title="Generate 22-Digit NISM Otomatis"
                              className="px-1.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 text-[10px] font-black tracking-tight border border-amber-200/80 flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-3xs"
                            >
                              <Sparkles className="h-3 w-3 text-amber-600" />
                              <span>Gen</span>
                            </button>
                          </div>
                        </td>

                        {/* 3. NISN */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-600 border-r border-slate-100">
                          {s.nisn || <span className="text-slate-300">-</span>}
                        </td>

                        {/* 5. NAMA */}
                        <td className="py-3 px-3 border-r border-slate-100">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-200">
                              {renderSantriAvatar(s, 'w-full h-full object-cover')}
                            </div>
                            <div className="min-w-0">
                              <span 
                                onClick={() => onSelectStudentDetail(s)}
                                className="font-extrabold text-slate-800 hover:text-amber-800 cursor-pointer hover:underline truncate block"
                                title={s.nama}
                              >
                                {s.nama}
                              </span>
                              {(s.desa || s.kecamatan || s.kabupaten) && (
                                <span className="text-[9px] text-slate-400 font-semibold truncate block uppercase">
                                  {[s.desa, s.kecamatan].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 6. TEMPAT LAHIR */}
                        <td className="py-3 px-3 text-slate-700 font-medium border-r border-slate-100">
                          {s.tempatLahir || <span className="text-slate-300">-</span>}
                        </td>

                        {/* 7. TANGGAL LAHIR */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-600 border-r border-slate-100">
                          {formatTanggal(s.tanggalLahir)}
                        </td>

                        {/* 8. UMUR */}
                        <td className="py-3 px-2 text-center font-bold text-slate-600 border-r border-slate-100">
                          <span className={ageStr !== '-' ? "px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]" : "text-slate-300"}>
                            {ageStr}
                          </span>
                        </td>

                        {/* 9. JENIS KELAMIN */}
                        <td className="py-3 px-2 text-center font-bold border-r border-slate-100">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black ${
                            genderCode === 'L' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60' 
                              : genderCode === 'P' 
                                ? 'bg-pink-50 text-pink-700 border border-pink-200/60'
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {genderCode}
                          </span>
                        </td>

                        {/* 10. NAMA AYAH */}
                        <td className="py-3 px-3 text-slate-700 font-medium truncate max-w-[140px] border-r border-slate-100" title={s.namaAyah}>
                          {s.namaAyah || <span className="text-slate-300">-</span>}
                        </td>

                        {/* 11. NAMA IBU */}
                        <td className="py-3 px-3 text-slate-700 font-medium truncate max-w-[140px] border-r border-slate-100" title={s.namaIbu}>
                          {s.namaIbu || <span className="text-slate-300">-</span>}
                        </td>

                        {/* 12. EMIS */}
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                            s.statusEmis === 'Terdaftar'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.statusEmis === 'Invalid'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.statusEmis || 'Belum'}
                          </span>
                        </td>

                        {/* 13. VERVAL */}
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                            isVervalSukses
                              ? 'bg-[#E6F4EA] text-[#137333]'
                              : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          }`}>
                            {isVervalSukses ? 'Sukses' : 'Proses'}
                          </span>
                        </td>

                        {/* 14. STATUS KEAKTIFAN */}
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                            s.statusKeanggotaan === 'Aktif' || !s.statusKeanggotaan
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : s.statusKeanggotaan === 'Alumni'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.statusKeanggotaan || 'Aktif'}
                          </span>
                        </td>

                        {/* 15. KELAS MHD */}
                        <td className="py-3 px-3 font-semibold text-slate-700 border-r border-slate-100">
                          {kelasMhdVal}
                        </td>

                        {/* 16. SEMESTER */}
                        <td className="py-3 px-3 font-semibold text-slate-700 border-r border-slate-100">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {semesterVal}
                          </span>
                        </td>

                        {/* 17. AKSI */}
                        <td className="py-3 px-2 text-center sticky right-0 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActionDropdownPos({
                                  top: rect.bottom + 4,
                                  left: Math.max(10, rect.right - 144)
                                });
                                setActiveActionStudentId(activeActionStudentId === s.id ? null : s.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Pilihan Aksi"
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

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 font-medium gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline font-display">Baris per Halaman:</span>
              <span title="Baris per Halaman"><Eye className="h-4 w-4 text-slate-400 sm:hidden shrink-0" /></span>
              <div className="relative shrink-0">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-1.5 text-xs font-bold text-slate-700 focus:border-amber-500 focus:outline-none cursor-pointer shadow-3xs"
                >
                  {[20, 50, 100, 500].map(sz => (
                    <option key={sz} value={sz}>{sz === 500 ? 'Semua (500)' : sz}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </div>
              <span className="text-slate-600">
                Menampilkan <b>{totalItems > 0 ? startIndex + 1 : 0}</b> - <b>{endIndex}</b> dari <b>{totalItems}</b> calon santri
              </span>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1 sm:gap-1.5 select-none">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all ${
                  currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:text-slate-800 cursor-pointer active:scale-95'
                }`}
                title="Halaman Pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all ${
                  currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:text-slate-800 cursor-pointer active:scale-95'
                }`}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="px-2 font-bold text-slate-700 text-xs">
                Halaman {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all ${
                  currentPage >= totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:text-slate-800 cursor-pointer active:scale-95'
                }`}
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all ${
                  currentPage >= totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:text-slate-800 cursor-pointer active:scale-95'
                }`}
                title="Halaman Terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Fixed Action Dropdown */}
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
                  className="w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-[11px] font-bold text-slate-700 text-left overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setEditingSantri(s);
                      setActiveActionStudentId(null);
                      setActionDropdownPos(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-2 text-emerald-700 font-bold border-b border-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Edit Data</span>
                  </button>
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
                  <button
                    onClick={() => {
                      handleOpenSingleGenerate(s);
                      setActiveActionStudentId(null);
                      setActionDropdownPos(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer flex items-center gap-2 text-amber-700 font-bold"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>Generate NISM</span>
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

      {/* NISM Generate Dialog */}
      <NismGenerateDialog
        isOpen={nismModalState.isOpen}
        onClose={() => setNismModalState({ isOpen: false, targetSantri: null })}
        targetSantri={nismModalState.targetSantri}
        students={students}
        selectedLembaga={selectedLembaga}
        onConfirm={handleConfirmGenerate}
      />

      {/* Edit Santri Kolom Modal */}
      {editingSantri && (
        <EditSantriKolomModal
          isOpen={Boolean(editingSantri)}
          onClose={() => setEditingSantri(null)}
          santri={editingSantri}
          onSave={(updated) => {
            if (onUpdateSantri) {
              onUpdateSantri(updated);
              showToast(`Data santri ${updated.nama} berhasil diperbarui.`);
            }
            setEditingSantri(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default LembagaCalonView;
