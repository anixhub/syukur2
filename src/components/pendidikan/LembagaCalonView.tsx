import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Printer, Search, X, UserPlus, Users, Home, ExternalLink,
  CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { Santri } from '../../types';
import { renderSantriAvatar } from '../SekretarisHelper';

interface LembagaCalonViewProps {
  selectedLembaga: any;
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
  canWriteCurrent: boolean;
  onUpdateEmisStatus?: (studentId: string, newStatus: 'Terdaftar' | 'Belum' | 'Invalid') => void;
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
  canWriteCurrent,
  onUpdateEmisStatus,
}) => {
  const isFormal = activeTab === 'Formal';

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
              <span className="font-bold text-slate-700 uppercase">{selectedLembaga.nama}</span>
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
                Unit {selectedLembaga.nama} ({selectedGender}) &bull; Santri baru atau belum memiliki rombel definitif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-black border border-amber-200/80">
              Total {totalCalonCount} Calon Santri
            </span>
          </div>
        </div>
      </div>

      {/* Table & Filters */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xs relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama calon santri, NIS, NIK, atau NISN..."
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
          {isFormal && (
            <div className="min-w-[160px]">
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
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-3xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="w-12 py-3.5 px-3 text-center">No</th>
                  <th className="w-28 py-3.5 px-3">NIS</th>
                  <th className="py-3.5 px-3">Nama Calon Santri</th>
                  {isFormal && <th className="w-36 py-3.5 px-3">NIK</th>}
                  <th className="w-32 py-3.5 px-3">NISN</th>
                  {isFormal && <th className="w-32 py-3.5 px-3 text-center">Status EMIS</th>}
                  <th className="w-28 py-3.5 px-3">Kamar</th>
                  <th className="w-16 py-3.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={isFormal ? 8 : 6} className="py-16 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UserPlus className="h-8 w-8 text-slate-300" />
                        <p className="font-bold text-slate-600">Tidak ada calon santri</p>
                        <p className="text-xs text-slate-400">Semua santri di lembaga ini telah memiliki kelas definitif.</p>
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
                      {isFormal && (
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            s.statusEmis === 'Terdaftar'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.statusEmis === 'Invalid'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.statusEmis || 'Belum'}
                          </span>
                        </td>
                      )}
                      <td className="py-3.5 px-3 font-bold text-slate-600">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Home className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{s.kamar || '-'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => onSelectStudentDetail(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Lihat Detail Santri"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LembagaCalonView;
