import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Download, Printer, Search, X, Award, GraduationCap, Users, Home, ExternalLink,
  Calendar, CheckCircle2, ChevronRight, Folder, Trash2
} from 'lucide-react';
import { Santri } from '../../types';
import { renderSantriAvatar } from '../SekretarisHelper';

interface LembagaLulusanViewProps {
  selectedLembaga: any;
  activeTab: 'Formal' | 'Internal' | 'Rombel';
  students: Santri[];
  allGraduates: Santri[];
  selectedCohort: string;
  onSelectCohort: (cohort: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (st: string) => void;
  onBackToHub: () => void;
  onExport?: () => void;
  onPrintPDF: () => void;
  onSelectStudentDetail: (s: Santri) => void;
  selectedGender: 'Putra' | 'Putri';
  canWriteCurrent?: boolean;
  onClearAllGraduates?: () => void;
  onRemoveGraduate?: (s: Santri) => void;
}

export const LembagaLulusanView: React.FC<LembagaLulusanViewProps> = ({
  selectedLembaga,
  activeTab,
  students,
  allGraduates,
  selectedCohort,
  onSelectCohort,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onBackToHub,
  onExport,
  onPrintPDF,
  onSelectStudentDetail,
  selectedGender,
  canWriteCurrent,
  onClearAllGraduates,
  onRemoveGraduate,
}) => {
  const isFormal = activeTab === 'Formal';

  // Compute cohorts dynamically
  const cohortsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<string>();
    
    // Add known years
    yearsSet.add(String(currentYear));
    yearsSet.add(String(currentYear - 1));
    yearsSet.add(String(currentYear - 2));
    yearsSet.add(String(currentYear - 3));

    // Add years from student data
    allGraduates.forEach(s => {
      if (s.tahunLulus && s.tahunLulus.trim() !== '') {
        yearsSet.add(s.tahunLulus.trim());
      }
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    return ['Semua', ...sortedYears];
  }, [allGraduates]);

  return (
    <motion.div
      key="lulusan-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* 1. Header Card */}
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
              <span className="text-purple-700 font-extrabold">Lulusan & Alumni</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canWriteCurrent && allGraduates.length > 0 && onClearAllGraduates && (
              <button
                onClick={onClearAllGraduates}
                className="inline-flex items-center justify-center bg-red-50 border border-red-200 h-9 px-3.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-100 cursor-pointer shadow-3xs active:scale-95 transition-all gap-1.5"
                title="Kosongkan Seluruh Data Lulusan Lembaga Ini"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
                <span>Kosongkan Lulusan</span>
              </button>
            )}
            <button
              onClick={onExport || onPrintPDF}
              className="inline-flex items-center justify-center bg-white border border-slate-200 h-9 px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs active:scale-95 transition-all gap-1.5"
              title="Ekspor Data Lulusan & Alumni (Excel / PDF)"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                Daftar Lulusan & Alumni
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Unit {selectedLembaga.nama} ({selectedGender}) &bull; Total {allGraduates.length} santri tercatat telah lulus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 text-xs font-black border border-purple-200/80">
              Total {allGraduates.length} Lulusan
            </span>
          </div>
        </div>
      </div>

      {/* 2. DAFTAR ANGKATAN / LULUSAN CARDS GRID (FORMAT SAMA DENGAN DAFTAR KELAS) */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                Pilih Angkatan Kelulusan
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Pilih salah satu kelompok angkatan di bawah untuk melihat rincian santri yang lulus
              </p>
            </div>
          </div>
        </div>

        {/* Grid of Cohort Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {cohortsList.map((cohort) => {
            const isSelected = selectedCohort === cohort;
            const count = cohort === 'Semua'
              ? allGraduates.length
              : allGraduates.filter(s => s.tahunLulus === cohort).length;

            return (
              <div
                key={cohort}
                onClick={() => onSelectCohort(cohort)}
                className={`group border rounded-2xl p-4 sm:p-5 shadow-3xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative hover:-translate-y-0.5 select-none ${
                  isSelected
                    ? 'bg-purple-50/40 border-purple-500 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200/80 hover:border-purple-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shrink-0 shadow-3xs ${
                        isSelected 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white'
                      }`}>
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-extrabold uppercase tracking-wider">
                          {cohort === 'Semua' ? 'Rekap Total' : `Tahun ${cohort}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-base font-black text-slate-800 group-hover:text-purple-700 transition-colors uppercase tracking-tight line-clamp-1 mb-1">
                    {cohort === 'Semua' ? 'Semua Angkatan' : `Lulusan ${cohort}`}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {cohort === 'Semua' ? 'Seluruh riwayat alumni' : `Santri alumni kelulusan tahun ${cohort}`}
                  </p>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-500">
                    <span>Total: </span>
                    <span className="font-extrabold text-purple-700">{count} Santri</span>
                  </div>
                  <div className={`text-xs font-black flex items-center gap-1 ${
                    isSelected ? 'text-purple-700' : 'text-slate-400 group-hover:text-purple-600'
                  }`}>
                    <span>{isSelected ? 'Terpilih' : 'Pilih'}</span>
                    <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. DATA LULUSAN TABLE SECTION */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                Data Lulusan &bull; {selectedCohort === 'Semua' ? 'Semua Angkatan' : `Angkatan ${selectedCohort}`}
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                Menampilkan {students.length} santri alumni
              </p>
            </div>

            {/* Search in Graduates */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari nama santri, NIS, NIK, NISN..."
                className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-3xs"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="w-12 py-3.5 px-3 text-center">No</th>
                    <th className="w-28 py-3.5 px-3">NIS</th>
                    <th className="py-3.5 px-3">Nama Santri</th>
                    {isFormal && <th className="w-36 py-3.5 px-3">NIK</th>}
                    <th className="w-32 py-3.5 px-3">NISN</th>
                    <th className="w-32 py-3.5 px-3">Tahun Lulus</th>
                    <th className="w-28 py-3.5 px-3">Kamar Asal</th>
                    <th className="w-24 py-3.5 px-3 text-center">Status</th>
                    <th className="w-16 py-3.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={isFormal ? 9 : 8} className="py-16 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Award className="h-8 w-8 text-slate-300" />
                          <p className="font-bold text-slate-600">Tidak ada data kelulusan</p>
                          <p className="text-xs text-slate-400">Belum ada santri yang tercatat lulus pada angkatan ini.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((s, idx) => (
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
                                className="font-extrabold text-slate-800 hover:text-purple-700 cursor-pointer hover:underline truncate block"
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
                        <td className="py-3.5 px-3 font-bold text-purple-700">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                            <span>{s.tahunLulus || 'Alumni'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-600">
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Home className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{s.kamar || '-'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-200/60">
                            Alumni
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onSelectStudentDetail(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Lihat Detail Santri"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            {canWriteCurrent && onRemoveGraduate && (
                              <button
                                onClick={() => onRemoveGraduate(s)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Keluarkan / Hapus dari Data Lulusan"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LembagaLulusanView;
