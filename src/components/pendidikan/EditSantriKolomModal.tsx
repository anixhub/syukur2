import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, User, Hash, Calendar, Heart, ShieldCheck, BookOpen, Layers, Sparkles } from 'lucide-react';
import { Santri } from '../../types';
import { getSantriTahunMasuk } from '../../lib/nismHelper';

interface EditSantriKolomModalProps {
  isOpen: boolean;
  onClose: () => void;
  santri: Santri | null;
  onSave: (updatedSantri: Santri) => void;
}

export const EditSantriKolomModal: React.FC<EditSantriKolomModalProps> = ({
  isOpen,
  onClose,
  santri,
  onSave
}) => {
  if (!isOpen || !santri) return null;

  const [formData, setFormData] = useState({
    nism: santri.nism || santri.indukWustho || santri.indukUlya || santri.indukMhd || '',
    indukWustho: santri.indukWustho || '',
    indukUlya: santri.indukUlya || '',
    indukMhd: santri.indukMhd || '',
    tanggalMasukLembaga: santri.tanggalMasukLembaga || santri.tanggalMasuk || '',
    tahunMasuk: santri.tahunMasuk || getSantriTahunMasuk(santri) || '',
    nisn: santri.nisn || '',
    nama: santri.nama || '',
    tempatLahir: santri.tempatLahir || '',
    tanggalLahir: santri.tanggalLahir || '',
    gender: (santri.gender || 'Putra') as 'Putra' | 'Putri',
    namaAyah: santri.namaAyah || '',
    namaIbu: santri.namaIbu || '',
    statusEmis: (santri.statusEmis || 'Belum') as 'Terdaftar' | 'Belum' | 'Invalid',
    statusVerval: (santri.statusVerval || (santri.nisn ? 'Sukses' : 'Proses')) as 'Sukses' | 'Proses',
    statusKeanggotaan: (santri.statusKeanggotaan || 'Aktif') as 'Aktif' | 'Alumni' | 'Meninggal' | 'Mutasi',
    kelasMhd: santri.kelasMhd || santri.pendidikanInternal || santri.indukMhd || '',
    semester: santri.semester || 'Semester 1'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const cleanNism = formData.nism.trim();
    const updated: Santri = {
      ...santri,
      nism: cleanNism,
      indukWustho: formData.indukWustho.trim() || (cleanNism.length === 18 && santri.pendidikanFormal?.toLowerCase().includes('wustho') ? cleanNism : santri.indukWustho),
      indukUlya: formData.indukUlya.trim() || (cleanNism.length === 18 && santri.pendidikanFormal?.toLowerCase().includes('ulya') ? cleanNism : santri.indukUlya),
      indukMhd: formData.indukMhd.trim() || (cleanNism.length === 18 && (santri.pendidikanInternal?.toLowerCase().includes('mhd') || santri.kelasMhd) ? cleanNism : santri.indukMhd),
      tanggalMasukLembaga: formData.tanggalMasukLembaga.trim(),
      tahunMasuk: formData.tahunMasuk.trim(),
      nisn: formData.nisn.trim(),
      nama: formData.nama.trim(),
      tempatLahir: formData.tempatLahir.trim(),
      tanggalLahir: formData.tanggalLahir.trim(),
      gender: formData.gender,
      namaAyah: formData.namaAyah.trim(),
      namaIbu: formData.namaIbu.trim(),
      statusEmis: formData.statusEmis,
      statusVerval: formData.statusVerval,
      statusKeanggotaan: formData.statusKeanggotaan,
      kelasMhd: formData.kelasMhd.trim(),
      semester: formData.semester.trim()
    };

    onSave(updated);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden my-6"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-2xs">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">
                  Edit Data Kolom Tabel
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ubah data santri <span className="font-bold text-slate-700">{santri.nama}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5 text-xs">
              
              {/* Identitas Utama */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider">
                  <Hash className="h-4 w-4 text-emerald-600" />
                  <span>Identitas & Nomor Pokok</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      NISM (18 Digit)
                    </label>
                    <input
                      type="text"
                      value={formData.nism}
                      maxLength={18}
                      onChange={(e) => setFormData({ ...formData, nism: e.target.value })}
                      placeholder="18 Digit NISM..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-mono font-semibold text-slate-800 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">NISM / No. Induk Madrasah</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Tahun Masuk (4 Digit)
                    </label>
                    <input
                      type="text"
                      value={formData.tahunMasuk}
                      onChange={(e) => setFormData({ ...formData, tahunMasuk: e.target.value })}
                      placeholder="Contoh: 2024"
                      maxLength={4}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-mono font-semibold text-slate-800 text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Pacuan 2 digit tahun pada NISM</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      NISN (Nomor Induk Siswa Nasional)
                    </label>
                    <input
                      type="text"
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      placeholder="10 Digit NISN..."
                      maxLength={15}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-semibold text-slate-800 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Nama Lengkap Santri *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Nama lengkap..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Data Kelahiran & Gender */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span>Kelahiran & Jenis Kelamin</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                      placeholder="Kota/Kabupaten Lahir"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Putra' | 'Putri' })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-slate-800 bg-white"
                    >
                      <option value="Putra">Putra (L)</option>
                      <option value="Putri">Putri (P)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider">
                  <Heart className="h-4 w-4 text-emerald-600" />
                  <span>Data Orang Tua</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Nama Ayah
                    </label>
                    <input
                      type="text"
                      value={formData.namaAyah}
                      onChange={(e) => setFormData({ ...formData, namaAyah: e.target.value })}
                      placeholder="Nama ayah kandung..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Nama Ibu
                    </label>
                    <input
                      type="text"
                      value={formData.namaIbu}
                      onChange={(e) => setFormData({ ...formData, namaIbu: e.target.value })}
                      placeholder="Nama ibu kandung..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Status EMIS, Verval, dan Keaktifan */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Status Verifikasi & Keaktifan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Status EMIS
                    </label>
                    <select
                      value={formData.statusEmis}
                      onChange={(e) => setFormData({ ...formData, statusEmis: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-slate-800 bg-white"
                    >
                      <option value="Terdaftar">Terdaftar</option>
                      <option value="Belum">Belum</option>
                      <option value="Invalid">Invalid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Status Verval
                    </label>
                    <select
                      value={formData.statusVerval}
                      onChange={(e) => setFormData({ ...formData, statusVerval: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-slate-800 bg-white"
                    >
                      <option value="Sukses">Sukses</option>
                      <option value="Proses">Proses</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Status Keaktifan
                    </label>
                    <select
                      value={formData.statusKeanggotaan}
                      onChange={(e) => setFormData({ ...formData, statusKeanggotaan: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-slate-800 bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Alumni">Alumni</option>
                      <option value="Mutasi">Mutasi</option>
                      <option value="Meninggal">Meninggal</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Akademik: Kelas MHD & Semester */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span>Akademik Lembaga (MHD & Semester)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Kelas MHD (Madrasah Diniyah)
                    </label>
                    <input
                      type="text"
                      value={formData.kelasMhd}
                      onChange={(e) => setFormData({ ...formData, kelasMhd: e.target.value })}
                      placeholder="Contoh: 1 Ula / 2 Wustho / -"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                      Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-slate-800 bg-white"
                    >
                      <option value="Semester 1">Semester 1 (Ganjil)</option>
                      <option value="Semester 2">Semester 2 (Genap)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 text-xs cursor-pointer transition-colors shadow-3xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditSantriKolomModal;
