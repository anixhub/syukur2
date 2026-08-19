import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Printer, Search, X, Filter, Users, User, FileSpreadsheet, Home,
  ChevronRight, ExternalLink, Pencil, Download
} from 'lucide-react';
import { Santri } from '../../types';
import { renderSantriAvatar } from '../SekretarisHelper';
import EditSantriKolomModal from './EditSantriKolomModal';

interface LembagaDataIndukViewProps {
  selectedLembaga: any;
  activeTab: 'Formal' | 'Internal' | 'Rombel';
  subClasses: any[];
  students: Santri[];
  totalStudentsCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  classFilter: string;
  onClassFilterChange: (cls: string) => void;
  statusFilter: string;
  onStatusFilterChange: (st: string) => void;
  onBackToHub: () => void;
  onPrintPDF: () => void;
  onExport?: () => void;
  onSelectStudentDetail: (s: Santri) => void;
  onUpdateSantri?: (s: Santri) => void;
  selectedGender: 'Putra' | 'Putri';
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

export const LembagaDataIndukView: React.FC<LembagaDataIndukViewProps> = ({
  selectedLembaga,
  activeTab,
  subClasses,
  students,
  totalStudentsCount,
  searchQuery,
  onSearchChange,
  classFilter,
  onClassFilterChange,
  statusFilter,
  onStatusFilterChange,
  onBackToHub,
  onPrintPDF,
  onExport,
  onSelectStudentDetail,
  onUpdateSantri,
  selectedGender,
}) => {
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);

  return (
    <motion.div
      key="data-induk-view"
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
              <span className="font-bold text-slate-700 uppercase">{selectedLembaga.nama}</span>
              <span>/</span>
              <span className="text-[#00693E] font-extrabold">Data Induk Santri</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExport || onPrintPDF}
              className="inline-flex items-center justify-center bg-white border border-slate-200 h-9 px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs active:scale-95 transition-all gap-1.5"
              title="Ekspor Data Induk Santri (Excel / PDF)"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00693E] flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <FileSpreadsheet className="h-6 w-6 text-[#00693E]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                Data Induk Santri
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Unit {selectedLembaga.nama} ({selectedGender}) &bull; Total {totalStudentsCount} santri terdaftar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-[#00693E] text-xs font-black border border-emerald-200/80">
              Total {totalStudentsCount} Santri
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Table Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama, NIS, NISM, NISN, Tempat Lahir, Wali..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10.5 pl-10 pr-9 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-3xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Class Filter */}
          <div className="min-w-[170px]">
            <select
              value={classFilter}
              onChange={(e) => onClassFilterChange(e.target.value)}
              className="w-full h-10.5 px-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-3xs"
            >
              <option value="Semua">Semua Kelas / Rombel</option>
              {subClasses.map((c) => (
                <option key={c.id} value={c.id || c.nama}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full h-10.5 px-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-3xs"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Status Aktif</option>
              <option value="Alumni">Status Alumni</option>
              <option value="Mutasi">Status Mutasi</option>
            </select>
          </div>
        </div>

        {/* Data Induk Table with all requested columns: NO, NISM, NISN, NAMA, TEMPAT LAHIR, TANGGAL LAHIR, UMUR, JENIS KELAMIN, NAMA AYAH, NAMA IBU, EMIS, VERVAL, STATUS KEAKTIFAN, KELAS MHD, SEMESTER */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-3xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider select-none">
                  <th className="w-10 py-3.5 px-2 text-center sticky left-0 z-20 bg-slate-100 border-r border-slate-200">NO</th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">NISM</th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">NISN</th>
                  <th className="w-52 py-3.5 px-3 border-r border-slate-200">NAMA</th>
                  <th className="w-32 py-3.5 px-3 border-r border-slate-200">TEMPAT LAHIR</th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">TGL LAHIR</th>
                  <th className="w-16 py-3.5 px-2 text-center border-r border-slate-200">UMUR</th>
                  <th className="w-16 py-3.5 px-2 text-center border-r border-slate-200">L/P</th>
                  <th className="w-36 py-3.5 px-3 border-r border-slate-200">NAMA AYAH</th>
                  <th className="w-36 py-3.5 px-3 border-r border-slate-200">NAMA IBU</th>
                  <th className="w-24 py-3.5 px-2 text-center border-r border-slate-200">EMIS</th>
                  <th className="w-24 py-3.5 px-2 text-center border-r border-slate-200">VERVAL</th>
                  <th className="w-24 py-3.5 px-2 text-center border-r border-slate-200">STATUS</th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">KELAS MHD</th>
                  <th className="w-28 py-3.5 px-3 border-r border-slate-200">SEMESTER</th>
                  <th className="w-16 py-3.5 px-2 text-center sticky right-0 z-20 bg-slate-100 border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.03)]">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-16 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSpreadsheet className="h-8 w-8 text-slate-300" />
                        <p className="font-bold text-slate-600">Tidak ada data santri yang cocok</p>
                        <p className="text-xs text-slate-400">Silakan sesuaikan kata kunci pencarian atau filter status Anda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((s, idx) => {
                    const ageStr = calculateAge(s.tanggalLahir);
                    const genderCode = s.gender === 'Putra' ? 'L' : s.gender === 'Putri' ? 'P' : (s.gender || '-');
                    const nismVal = s.nism || '-';
                    const kelasMhdVal = s.kelasMhd || s.pendidikanInternal || s.indukMhd || '-';
                    const semesterVal = s.semester || 'Semester 1';
                    const isVervalSukses = (s.statusVerval || (s.nisn ? 'Sukses' : 'Proses')) === 'Sukses';

                    return (
                      <tr 
                        key={s.id || idx}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* 1. NO */}
                        <td className="py-3 px-2 text-center font-bold text-slate-400 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                          {idx + 1}
                        </td>

                        {/* 2. NISM */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-700 border-r border-slate-100">
                          {s.nism ? nismVal : <span className="text-slate-300">-</span>}
                        </td>

                        {/* 3. NISN */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-600 border-r border-slate-100">
                          {s.nisn || <span className="text-slate-300">-</span>}
                        </td>

                        {/* 4. NAMA */}
                        <td className="py-3 px-3 border-r border-slate-100">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-200">
                              {renderSantriAvatar(s, 'w-full h-full object-cover')}
                            </div>
                            <div className="min-w-0">
                              <span 
                                onClick={() => onSelectStudentDetail(s)}
                                className="font-extrabold text-slate-800 hover:text-[#00693E] cursor-pointer hover:underline truncate block"
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

                        {/* 5. TEMPAT LAHIR */}
                        <td className="py-3 px-3 text-slate-700 font-medium border-r border-slate-100">
                          {s.tempatLahir || <span className="text-slate-300">-</span>}
                        </td>

                        {/* 6. TANGGAL LAHIR */}
                        <td className="py-3 px-3 font-mono font-medium text-slate-600 border-r border-slate-100">
                          {formatTanggal(s.tanggalLahir)}
                        </td>

                        {/* 7. UMUR */}
                        <td className="py-3 px-2 text-center font-bold text-slate-600 border-r border-slate-100">
                          <span className={ageStr !== '-' ? "px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]" : "text-slate-300"}>
                            {ageStr}
                          </span>
                        </td>

                        {/* 8. JENIS KELAMIN */}
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

                        {/* 9. NAMA AYAH */}
                        <td className="py-3 px-3 text-slate-700 font-medium truncate max-w-[140px] border-r border-slate-100" title={s.namaAyah}>
                          {s.namaAyah || <span className="text-slate-300">-</span>}
                        </td>

                        {/* 10. NAMA IBU */}
                        <td className="py-3 px-3 text-slate-700 font-medium truncate max-w-[140px] border-r border-slate-100" title={s.namaIbu}>
                          {s.namaIbu || <span className="text-slate-300">-</span>}
                        </td>

                        {/* 11. EMIS */}
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

                        {/* 12. VERVAL */}
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                            isVervalSukses
                              ? 'bg-[#E6F4EA] text-[#137333]'
                              : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          }`}>
                            {isVervalSukses ? 'Sukses' : 'Proses'}
                          </span>
                        </td>

                        {/* 13. STATUS KEAKTIFAN */}
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

                        {/* 14. KELAS MHD */}
                        <td className="py-3 px-3 font-semibold text-slate-700 border-r border-slate-100">
                          {kelasMhdVal}
                        </td>

                        {/* 15. SEMESTER */}
                        <td className="py-3 px-3 font-semibold text-slate-700 border-r border-slate-100">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {semesterVal}
                          </span>
                        </td>

                        {/* 16. AKSI */}
                        <td className="py-3 px-2 text-center sticky right-0 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingSantri(s)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Edit Kolom Data Santri"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onSelectStudentDetail(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#00693E] hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Lihat Detail Santri"
                            >
                              <ExternalLink className="h-4 w-4" />
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

      {/* Edit Santri Kolom Modal */}
      {editingSantri && (
        <EditSantriKolomModal
          isOpen={Boolean(editingSantri)}
          onClose={() => setEditingSantri(null)}
          santri={editingSantri}
          onSave={(updated) => {
            onUpdateSantri?.(updated);
            setEditingSantri(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default LembagaDataIndukView;
