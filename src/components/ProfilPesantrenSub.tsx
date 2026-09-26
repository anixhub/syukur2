import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Award, Upload, Trash2, Info, User } from 'lucide-react';
import { PesantrenProfile } from './PengaturanView';
import { compressImage } from '../lib/utils';

interface ProfilPesantrenSubProps {
  profile: PesantrenProfile;
  handleProfileChange: (key: keyof PesantrenProfile, value: string) => void;
  handleSave: () => Promise<void>;
  hasChanges: boolean;
}

export default function ProfilPesantrenSub({
  profile,
  handleProfileChange,
  handleSave,
  hasChanges,
}: ProfilPesantrenSubProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-6 font-sans text-slate-800 max-w-5xl mx-auto"
    >
      {/* Main Form Fields Container - Full Width Stack */}
      <div className="space-y-6 text-left">
        
        {/* Section 1: Identitas Yayasan & Pesantren */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#A30022] font-semibold text-sm">
            <div className="flex items-center justify-center h-4.5 w-4.5 rounded-full border border-[#A30022] text-[#A30022] font-extrabold text-xs">
              i
            </div>
            <span>Identitas Yayasan & Pesantren</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Pesantren</label>
              <input 
                type="text" 
                value={profile.namaPesantren} 
                onChange={(e) => handleProfileChange('namaPesantren', e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                placeholder="Masukkan nama pesantren"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Yayasan / Badan Hukum</label>
              <input 
                type="text" 
                value={profile.namaYayasan} 
                onChange={(e) => handleProfileChange('namaYayasan', e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                placeholder="Masukkan nama yayasan atau badan hukum"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Statistik (NSPP)</label>
                <input 
                  type="text" 
                  value={profile.nspp} 
                  onChange={(e) => handleProfileChange('nspp', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan NSPP"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Notaris</label>
                <input 
                  type="text" 
                  value={profile.nomorNotaris} 
                  onChange={(e) => handleProfileChange('nomorNotaris', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Masukkan Nomor Notaris"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Alamat & Kontak Resmi */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#A30022] font-semibold text-sm">
            <MapPin className="h-4.5 w-4.5 text-[#A30022]" />
            <span>Alamat & Kontak Resmi</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            {/* Kolom Tunggal: Alamat Lengkap */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Lengkap</label>
              <textarea 
                rows={3}
                value={profile.alamat || ''} 
                onChange={(e) => handleProfileChange('alamat', e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800 resize-none leading-relaxed"
                placeholder="Masukkan alamat lengkap pesantren (Jalan, RT/RW, Dusun, Desa/Kelurahan, Kecamatan, Kab/Kota, Provinsi, Kode Pos)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Resmi</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="info@darussalam.org"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Situs Website</label>
                <input 
                  type="text" 
                  value={profile.website} 
                  onChange={(e) => handleProfileChange('website', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="www.darussalam.org"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Telepon / WA</label>
                <input 
                  type="text" 
                  value={profile.telepon} 
                  onChange={(e) => handleProfileChange('telepon', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="081234567890"
                />
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kota Penandatangan Dokumen &amp; Surat</label>
                <input 
                  type="text" 
                  value={profile.kotaTandaTangan} 
                  onChange={(e) => handleProfileChange('kotaTandaTangan', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A30022] focus:bg-white transition-all text-slate-800"
                  placeholder="Contoh: Jombang, Kediri, Probolinggo, dll."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Struktur Kepengurusan Putra */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black">
                PA
              </div>
              <h3 className="text-base sm:text-lg font-bold text-blue-900 tracking-tight">Struktur Kepengurusan Putra</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-blue-100 p-6 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pengasuh Putra</label>
                <input 
                  type="text" 
                  value={profile.namaPengasuhPutra ?? profile.namaPengasuh ?? ''} 
                  onChange={(e) => {
                    handleProfileChange('namaPengasuhPutra', e.target.value);
                    handleProfileChange('namaPengasuh', e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Contoh: KH. Muhammad Shodiq, M.Ag."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ketua Pondok Putra</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaPondokPutra ?? profile.namaKetuaPondok ?? ''} 
                  onChange={(e) => {
                    handleProfileChange('namaKetuaPondokPutra', e.target.value);
                    handleProfileChange('namaKetuaPondok', e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama ketua pondok putra"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sekretaris Putra</label>
                <input 
                  type="text" 
                  value={profile.namaSekretarisPutra ?? profile.namaSekretaris ?? ''} 
                  onChange={(e) => {
                    handleProfileChange('namaSekretarisPutra', e.target.value);
                    handleProfileChange('namaSekretaris', e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama sekretaris putra"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bendahara Putra</label>
                <input 
                  type="text" 
                  value={profile.namaBendaharaPutra ?? profile.namaBendahara ?? ''} 
                  onChange={(e) => {
                    handleProfileChange('namaBendaharaPutra', e.target.value);
                    handleProfileChange('namaBendahara', e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama bendahara putra"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ketua Pendidikan Putra</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaPendidikanPutra ?? profile.namaKetuaPendidikan ?? ''} 
                  onChange={(e) => {
                    handleProfileChange('namaKetuaPendidikanPutra', e.target.value);
                    handleProfileChange('namaKetuaPendidikan', e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama ketua pendidikan putra"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ketua Keamanan Putra</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaKeamananPutra ?? profile.namaKetuaKeamanan ?? ''} 
                  onChange={(e) => {
                    handleProfileChange('namaKetuaKeamananPutra', e.target.value);
                    handleProfileChange('namaKetuaKeamanan', e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama ketua keamanan putra"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ketua Humasy Putra</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaHumasyPutra ?? profile.namaKetuaHumasy ?? ''} 
                  onChange={(e) => {
                    handleProfileChange('namaKetuaHumasyPutra', e.target.value);
                    handleProfileChange('namaKetuaHumasy', e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama ketua humasy putra"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Struktur Kepengurusan Putri */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-pink-100 text-pink-800 flex items-center justify-center text-xs font-black">
                PI
              </div>
              <h3 className="text-base sm:text-lg font-bold text-pink-900 tracking-tight">Struktur Kepengurusan Putri</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-pink-100 p-6 space-y-4 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pengasuh Putri</label>
                <input 
                  type="text" 
                  value={profile.namaPengasuhPutri ?? profile.namaWakilPengasuhPutri ?? ''} 
                  onChange={(e) => {
                    handleProfileChange('namaPengasuhPutri', e.target.value);
                    handleProfileChange('namaWakilPengasuhPutri', e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Contoh: Nyai Hj. Nurul Hidayah"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ketua Pondok Putri</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaPondokPutri ?? ''} 
                  onChange={(e) => handleProfileChange('namaKetuaPondokPutri', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama ketua pondok putri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sekretaris Putri</label>
                <input 
                  type="text" 
                  value={profile.namaSekretarisPutri ?? ''} 
                  onChange={(e) => handleProfileChange('namaSekretarisPutri', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama sekretaris putri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bendahara Putri</label>
                <input 
                  type="text" 
                  value={profile.namaBendaharaPutri ?? ''} 
                  onChange={(e) => handleProfileChange('namaBendaharaPutri', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama bendahara putri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ketua Pendidikan Putri</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaPendidikanPutri ?? ''} 
                  onChange={(e) => handleProfileChange('namaKetuaPendidikanPutri', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama ketua pendidikan putri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ketua Keamanan Putri</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaKeamananPutri ?? ''} 
                  onChange={(e) => handleProfileChange('namaKetuaKeamananPutri', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama ketua keamanan putri"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ketua Humasy Putri</label>
                <input 
                  type="text" 
                  value={profile.namaKetuaHumasyPutri ?? ''} 
                  onChange={(e) => handleProfileChange('namaKetuaHumasyPutri', e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-pink-600 focus:bg-white transition-all text-slate-800"
                  placeholder="Nama ketua humasy putri"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Kustomisasi Logo Institusi */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#A30022] font-semibold text-sm">
            <Award className="h-4.5 w-4.5 text-[#A30022]" />
            <span>Kustomisasi Logo Institusi</span>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-800">Logo Kustom Pesantren</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Opsional. Unggah logo institusi Anda sendiri.</p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {profile.logoUrl && (
                  <div className="h-10 w-10 overflow-hidden border border-slate-200 rounded-lg p-1 bg-white flex items-center justify-center">
                    <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
                
                <label className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 text-[10px] font-bold uppercase cursor-pointer transition-all active:scale-95 shadow-sm">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{profile.logoUrl ? "GANTI LOGO" : "UNGGAH LOGO"}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert("Ukuran file terlalu besar! Maksimum ukuran logo adalah 10MB.");
                          return;
                        }
                        try {
                          // Compress image to max 800px width/height
                          const base64 = await compressImage(file, 800, 800, 0.75);
                          handleProfileChange('logoUrl', base64);
                        } catch (err: any) {
                          console.error("Gagal mengompresi logo:", err);
                          alert("Gagal memproses gambar logo.");
                        }
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                
                {profile.logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleProfileChange('logoUrl', '')}
                    className="inline-flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 h-10 w-10 border border-rose-200 cursor-pointer transition-all active:scale-95"
                    title="Hapus Logo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Unified Save Action Block */}
      <div className="flex justify-end mt-8">
        <button 
          onClick={handleSave}
          disabled={!hasChanges}
          className={`font-sans font-semibold text-xs px-10 py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-red-900/10 active:scale-95 flex items-center justify-center gap-2 ${
            hasChanges
              ? 'bg-[#A30022] hover:bg-[#8B0018] text-white cursor-pointer'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
          }`}
        >
          Simpan Perubahan
        </button>
      </div>

    </motion.div>
  );
}
