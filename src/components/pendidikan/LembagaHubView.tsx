import React from 'react';
import { motion } from 'motion/react';
import { 
  School, Award, ArrowLeft, Printer, Pencil, Trash2, 
  FileSpreadsheet, UserPlus, BookOpen, ChevronRight, Users, Sparkles
} from 'lucide-react';

interface LembagaHubViewProps {
  selectedLembaga: any;
  activeTab: 'Formal' | 'Internal' | 'Rombel';
  subClasses: any[];
  allStudentsCount: number;
  calonCount: number;
  graduatesCount: number;
  canWriteCurrent: boolean;
  isSelectionMode?: boolean;
  onBack: () => void;
  onSelectView: (view: 'data_induk' | 'calon_peserta_didik' | 'kelas' | 'lulusan') => void;
  onPrint: () => void;
  onEdit: () => void;
  onDelete: () => void;
  generate4LetterKode: (name: string) => string;
  getLogoUrl: (url?: string) => string;
}

export const LembagaHubView: React.FC<LembagaHubViewProps> = ({
  selectedLembaga,
  activeTab,
  subClasses,
  allStudentsCount,
  calonCount,
  graduatesCount,
  canWriteCurrent,
  isSelectionMode,
  onBack,
  onSelectView,
  onPrint,
  onEdit,
  onDelete,
  generate4LetterKode,
  getLogoUrl,
}) => {
  const realClassesCount = subClasses.filter(c => !c.isDefault && c.nama !== 'Calon Peserta Didik').length;

  return (
    <motion.div
      key="lembaga-hub-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* Lembaga Profile Header Card */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xs relative">
        
        {/* Header Bar: Back to Lembaga button, Category Tag, and Action Buttons */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100/90">
          <div className="flex items-center gap-3">
            <button
              disabled={isSelectionMode}
              onClick={onBack}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#00693E] transition-all font-bold text-xs shadow-3xs shrink-0 ${
                isSelectionMode ? 'opacity-40 cursor-not-allowed text-slate-300' : 'active:scale-95 cursor-pointer'
              }`}
              title="Kembali ke Daftar Lembaga"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Daftar {activeTab === 'Rombel' ? 'Kategori Rombel' : 'Lembaga'}</span>
            </button>

            <span className="hidden sm:inline-block text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
              {activeTab === 'Formal'
                ? 'Pendidikan Formal'
                : activeTab === 'Rombel'
                ? 'Rombongan Belajar'
                : 'Pendidikan Internal Pondok'}
            </span>
          </div>

          {/* Lembaga Action Buttons (Cetak, Edit, Hapus) */}
          <div className="flex items-center gap-2">
            <button
              disabled={isSelectionMode}
              onClick={onPrint}
              className="inline-flex items-center justify-center bg-white border border-slate-200 h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs active:scale-95 transition-all disabled:opacity-40 gap-1.5"
              title="Cetak Data Lembaga"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              <span className="hidden sm:inline">Cetak Unit</span>
            </button>
            {canWriteCurrent && (
              <>
                <button
                  disabled={isSelectionMode}
                  onClick={onEdit}
                  className="inline-flex items-center justify-center bg-white border border-slate-200 h-9 px-3 sm:px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs active:scale-95 transition-all disabled:opacity-40 gap-1.5"
                  title="Edit Lembaga"
                >
                  <Pencil className="h-4 w-4 text-slate-600" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  disabled={isSelectionMode}
                  onClick={onDelete}
                  className={`inline-flex items-center justify-center border h-9 px-3 rounded-xl text-xs font-bold transition-all shrink-0 gap-1.5 ${
                    isSelectionMode 
                      ? 'bg-rose-50/50 border-rose-50/50 opacity-40 cursor-not-allowed text-rose-350' 
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 cursor-pointer shadow-3xs active:scale-95'
                  }`}
                  title={activeTab === 'Rombel' ? 'Hapus Kategori Rombel' : 'Hapus Lembaga'}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Hapus</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lembaga Info Row (Logo, Nama, Kode, Stats) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shadow-2xs shrink-0">
              {selectedLembaga.logo ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <img 
                    src={getLogoUrl(selectedLembaga.logo)} 
                    alt={selectedLembaga.nama} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const sibling = e.currentTarget.nextElementSibling;
                      if (sibling) (sibling as HTMLElement).classList.remove('hidden');
                    }}
                  />
                  <div className="hidden flex items-center justify-center w-full h-full">
                    {activeTab === 'Rombel' ? (
                      <Award className="h-9 w-9 text-emerald-600" />
                    ) : (
                      <School className="h-9 w-9 text-emerald-600" />
                    )}
                  </div>
                </div>
              ) : activeTab === 'Rombel' ? (
                <Award className="h-9 w-9 text-emerald-600" />
              ) : (
                <School className="h-9 w-9 text-emerald-600" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                  {selectedLembaga.nama}
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200/80 shrink-0 shadow-2xs">
                  {(selectedLembaga.kode || generate4LetterKode(selectedLembaga.nama)).toUpperCase().slice(0, 4)}
                </span>
              </div>
              {selectedLembaga.deskripsi && (
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {selectedLembaga.deskripsi}
                </p>
              )}
            </div>
          </div>

          {/* Lembaga Stat Badges */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-center min-w-[100px]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                TOTAL {activeTab === 'Rombel' ? 'ROMBEL' : 'KELAS'}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-800">
                {realClassesCount}
              </span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl px-4 py-3 text-center min-w-[100px]">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-0.5">
                TOTAL SANTRI
              </span>
              <span className="text-base sm:text-lg font-black text-[#00693E]">
                {allStudentsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 MENU UTAMA / HUB CARDS */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="mb-6">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            Menu Manajemen {activeTab === 'Rombel' ? 'Rombongan Belajar' : 'Lembaga'}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Pilih modul di bawah untuk mengelola data santri, calon peserta didik, kelas, atau riwayat lulusan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* 1. DATA INDUK */}
          <div
            onClick={() => onSelectView('data_induk')}
            className="group relative bg-white border border-slate-200/80 hover:border-emerald-500/80 rounded-2xl p-5 shadow-3xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:bg-[#00693E] group-hover:text-white transition-colors shrink-0 shadow-2xs">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-[#00693E] text-xs font-black border border-emerald-100/80">
                  {allStudentsCount} Santri
                </span>
              </div>
              <h4 className="text-base font-black text-slate-800 group-hover:text-[#00693E] transition-colors uppercase tracking-tight mb-1">
                Data Induk
              </h4>
              <p className="text-xs text-slate-500 font-medium line-clamp-2">
                Buku data induk lengkap seluruh santri yang tercatat di unit {selectedLembaga.nama}, termasuk status aktif, mutasi, dan pencarian cepat.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#00693E]">
              <span>Buka Data Induk</span>
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. CALON PESERTA DIDIK */}
          <div
            onClick={() => onSelectView('calon_peserta_didik')}
            className="group relative bg-white border border-slate-200/80 hover:border-amber-500/80 rounded-2xl p-5 shadow-3xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0 shadow-2xs">
                  <UserPlus className="h-6 w-6" />
                </div>
                <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-black border border-amber-200/80">
                  {calonCount} Calon
                </span>
              </div>
              <h4 className="text-base font-black text-slate-800 group-hover:text-amber-700 transition-colors uppercase tracking-tight mb-1">
                Calon Peserta Didik
              </h4>
              <p className="text-xs text-slate-500 font-medium line-clamp-2">
                Daftar calon santri baru atau santri yang belum ditempatkan ke kelas definitif, beserta status sinkronisasi EMIS.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-amber-700">
              <span>Buka Calon Peserta Didik</span>
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. KELAS */}
          <div
            onClick={() => onSelectView('kelas')}
            className="group relative bg-white border border-slate-200/80 hover:border-blue-500/80 rounded-2xl p-5 shadow-3xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 shadow-2xs">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-black border border-blue-200/80">
                  {realClassesCount} {activeTab === 'Rombel' ? 'Rombel' : 'Kelas'}
                </span>
              </div>
              <h4 className="text-base font-black text-slate-800 group-hover:text-blue-700 transition-colors uppercase tracking-tight mb-1">
                {activeTab === 'Rombel' ? 'Rombongan Belajar' : 'Daftar Kelas'}
              </h4>
              <p className="text-xs text-slate-500 font-medium line-clamp-2">
                Manajemen rombel dan ruang kelas, penugasan wali kelas, kapasitas rombel, dan tabel daftar santri tiap kelas.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-blue-700">
              <span>Buka Manajemen Kelas</span>
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. LULUSAN */}
          <div
            onClick={() => onSelectView('lulusan')}
            className="group relative bg-white border border-slate-200/80 hover:border-purple-500/80 rounded-2xl p-5 shadow-3xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 select-none"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0 shadow-2xs">
                  <Award className="h-6 w-6" />
                </div>
                <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 text-xs font-black border border-purple-200/80">
                  {graduatesCount} Lulusan
                </span>
              </div>
              <h4 className="text-base font-black text-slate-800 group-hover:text-purple-700 transition-colors uppercase tracking-tight mb-1">
                Lulusan & Alumni
              </h4>
              <p className="text-xs text-slate-500 font-medium line-clamp-2">
                Data rekapitulasi kelulusan santri per angkatan/tahun, riwayat alumni lembaga, dan cetak dokumen lulusan.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-purple-700">
              <span>Buka Data Lulusan</span>
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LembagaHubView;
