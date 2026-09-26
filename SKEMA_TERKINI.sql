-- ==============================================================================
-- SKEMA TERKINI DATABASE SMART SANTRI (HOSTINGER / MySQL / MariaDB / phpMyAdmin)
-- Terakhir Diperbarui: 2026-09-14
-- Ringkasan Perubahan:
-- * Format 100% MySQL / MariaDB murni untuk Hostinger phpMyAdmin (bebas syntax error).
-- * Penataan rapi kolom alamat: Jalan, RT, RW, Desa/Kelurahan, Kecamatan, Kabupaten/Kota,
--   Provinsi, dan Kode Pos pada tabel profil pesantren (`pesantren_profile`).
-- * Struktur Kepengurusan Putra & Putri lengkap (Pengasuh, Ketua Pondok, Sekretaris, Bendahara,
--   Ketua Pendidikan, Ketua Keamanan, Ketua Humasy).
-- * Tabel lengkap: santri, lembaga, kelas, kompleks, kamar, rombel, akun (app_credentials),
--   profil pondok (pesantren_profile), surat, bendahara, keamanan, perizinan, chat, tugas.
-- * Idempotent: Aman dijalankan berulang kali tanpa merusak atau menghapus data yang ada.
--
-- CARA PENGGUNAAN DI HOSTINGER:
-- 1. Buka cPanel / hPanel Hostinger -> Masuk ke phpMyAdmin.
-- 2. Pilih database Smart Santri Anda di bilah kiri.
-- 3. Klik tab 'SQL' di menu atas.
-- 4. Salin SEMUA isi file ini (Ctrl+A lalu Ctrl+C).
-- 5. Tempel (Paste) ke kotak SQL phpMyAdmin, lalu klik tombol 'Kirim' (Go).
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABEL SANTRI
CREATE TABLE IF NOT EXISTS `santri` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nis` VARCHAR(20) UNIQUE,
  `nism` VARCHAR(30),
  `nama` VARCHAR(100) NOT NULL,
  `kelas` TEXT,
  `kamar` TEXT,
  `asal` VARCHAR(100),
  `gender` VARCHAR(10),
  `tanggal_masuk` DATE DEFAULT (CURRENT_DATE),
  `nisn` VARCHAR(20),
  `induk_mhd` VARCHAR(30),
  `induk_wustho` VARCHAR(30),
  `induk_ulya` VARCHAR(30),
  `kelas_mhd` VARCHAR(50),
  `semester` VARCHAR(20) DEFAULT 'Semester 1',
  `tahun_lulus` VARCHAR(20),
  `nik` CHAR(16),
  `no_kk` CHAR(16),
  `tempat_lahir` VARCHAR(50),
  `tanggal_lahir` DATE,
  `anak_ke` INT,
  `dari_bersaudara` INT,
  `nama_ayah` VARCHAR(100),
  `nik_ayah` CHAR(16),
  `pekerjaan_ayah` VARCHAR(50),
  `pendidikan_ayah` VARCHAR(50),
  `nama_ibu` VARCHAR(100),
  `nik_ibu` CHAR(16),
  `pekerjaan_ibu` VARCHAR(50),
  `pendidikan_ibu` VARCHAR(50),
  `alamat` TEXT,
  `rt` VARCHAR(10),
  `rw` VARCHAR(10),
  `desa` VARCHAR(50),
  `kecamatan` VARCHAR(50),
  `kabupaten` VARCHAR(50),
  `provinsi` VARCHAR(50),
  `jarak_rumah` VARCHAR(50),
  `no_hp` VARCHAR(20),
  `status_keanggotaan` VARCHAR(50) DEFAULT 'Aktif',
  `status_domisili` VARCHAR(50) DEFAULT 'Mukim',
  `status_emis` VARCHAR(50) DEFAULT 'Sudah Masuk',
  `status_verval` VARCHAR(50) DEFAULT 'Selesai',
  `tanggal_keluar` DATE,
  `catatan` TEXT,
  `foto` LONGTEXT,
  `nomor_lemari` VARCHAR(50),
  `pendidikan_terakhir` VARCHAR(50),
  `pendidikan_formal` VARCHAR(50),
  `pendidikan_internal` VARCHAR(50),
  `kelas_id` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL MASTER DATA AKADEMIK & ASRAMA
CREATE TABLE IF NOT EXISTS `lembaga` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `kepala_sekolah` VARCHAR(100),
  `nip` VARCHAR(50),
  `singkatan` VARCHAR(20),
  `warna_badge` VARCHAR(30) DEFAULT 'blue',
  `jenjang` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `kelas` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `lembaga_id` VARCHAR(50),
  `wali_kelas` VARCHAR(100),
  `nip_wali_kelas` VARCHAR(50),
  `tingkat` VARCHAR(20),
  `gender` VARCHAR(10) DEFAULT 'Semua',
  `lembaga` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `kompleks` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `gender` VARCHAR(10) DEFAULT 'putra',
  `kategori` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `kamar` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `kompleks_id` VARCHAR(50),
  `kapasitas` INT DEFAULT 10,
  `gender` VARCHAR(10) DEFAULT 'putra',
  `ketua_kamar` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rombel_kategori` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `deskripsi` TEXT,
  `tipe` VARCHAR(50) DEFAULT 'kegiatan',
  `gender` VARCHAR(20) DEFAULT 'campur',
  `icon` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rombel_kelompok` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `kategori_id` VARCHAR(50) NOT NULL,
  `nama` VARCHAR(100) NOT NULL,
  `wali_kelompok` VARCHAR(100),
  `nip_wali_kelompok` VARCHAR(50),
  `ruangan` VARCHAR(100),
  `keterangan` TEXT,
  `kapasitas` INT DEFAULT 30,
  `gender` VARCHAR(20) DEFAULT 'campur',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rombel_assignments` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(50) NOT NULL,
  `kategori_id` VARCHAR(50) NOT NULL,
  `kelompok_id` VARCHAR(50) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_santri_kategori` (`santri_id`, `kategori_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABEL SURAT & KORESPONDENSI (SEKRETARIS)
CREATE TABLE IF NOT EXISTS `surat` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nomor_surat` VARCHAR(100) NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `tipe` VARCHAR(50) NOT NULL,
  `penerima` VARCHAR(255),
  `santri_id` VARCHAR(50),
  `santri_nama` VARCHAR(100),
  `santri_kelas` VARCHAR(50),
  `keterangan` TEXT,
  `status` VARCHAR(50) DEFAULT 'Diterbitkan',
  `konten` LONGTEXT,
  `tanggal_surat` DATE DEFAULT (CURRENT_DATE),
  `berlaku_sampai` DATE,
  `penandatangan_nama` VARCHAR(100),
  `penandatangan_jabatan` VARCHAR(100),
  `lampiran_url` TEXT,
  `file_url` TEXT,
  `keperluan` TEXT,
  `tujuan` VARCHAR(255),
  `kategori` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `surat_keluar` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nomor_surat` VARCHAR(100) NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `tipe` VARCHAR(50) NOT NULL,
  `tujuan` VARCHAR(255),
  `penerima` VARCHAR(255),
  `santri_id` VARCHAR(50),
  `santri_nama` VARCHAR(100),
  `santri_kelas` VARCHAR(50),
  `keterangan` TEXT,
  `status` VARCHAR(50) DEFAULT 'Diterbitkan',
  `konten` LONGTEXT,
  `tanggal_surat` DATE DEFAULT (CURRENT_DATE),
  `berlaku_sampai` DATE,
  `penandatangan_nama` VARCHAR(100),
  `penandatangan_jabatan` VARCHAR(100),
  `lampiran_url` TEXT,
  `file_url` TEXT,
  `keperluan` TEXT,
  `kategori` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `surat_masuk` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nomor_surat` VARCHAR(100) NOT NULL,
  `pengirim` VARCHAR(255) NOT NULL,
  `perihal` VARCHAR(255) NOT NULL,
  `tanggal_surat` DATE,
  `tanggal_terima` DATE DEFAULT (CURRENT_DATE),
  `keterangan` TEXT,
  `file_url` TEXT,
  `status` VARCHAR(50) DEFAULT 'Diterima',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABEL KEUANGAN (BENDAHARA)
CREATE TABLE IF NOT EXISTS `periode` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pos_keuangan` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `tipe` VARCHAR(20) NOT NULL,
  `deskripsi` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `transaksi_keuangan` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `pos_id` VARCHAR(50),
  `pos_nama` VARCHAR(100),
  `tipe` VARCHAR(20) NOT NULL,
  `jumlah` DECIMAL(15, 2) NOT NULL,
  `keterangan` TEXT,
  `santri_id` VARCHAR(50),
  `santri_nama` VARCHAR(100),
  `petugas` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tabungan_santri` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(50) NOT NULL,
  `tanggal` DATE NOT NULL,
  `tipe` VARCHAR(20) NOT NULL,
  `jumlah` DECIMAL(15, 2) NOT NULL,
  `saldo_setelahnya` DECIMAL(15, 2) NOT NULL,
  `keterangan` TEXT,
  `petugas` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tagihan_pembayaran` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(50) NOT NULL,
  `nama_tagihan` VARCHAR(150) NOT NULL,
  `jumlah` DECIMAL(15, 2) NOT NULL,
  `terbayar` DECIMAL(15, 2) DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'Belum Lunas',
  `jatuh_tempo` DATE,
  `kategori` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `riwayat_pembayaran` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `tagihan_id` VARCHAR(50) NOT NULL,
  `santri_id` VARCHAR(50) NOT NULL,
  `tanggal_bayar` DATE NOT NULL,
  `jumlah` DECIMAL(15, 2) NOT NULL,
  `metode` VARCHAR(50) DEFAULT 'Tunai',
  `petugas` VARCHAR(100),
  `keterangan` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABEL KEAMANAN & PELANGGARAN
CREATE TABLE IF NOT EXISTS `keamanan_records` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(50) NOT NULL,
  `santri_nama` VARCHAR(100),
  `santri_kelas` VARCHAR(50),
  `santri_kamar` VARCHAR(50),
  `tipe` VARCHAR(50) NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `kategori` VARCHAR(100),
  `poin` INT DEFAULT 0,
  `tanggal` DATE NOT NULL,
  `keterangan` TEXT,
  `tindakan` TEXT,
  `status` VARCHAR(50) DEFAULT 'Diproses',
  `petugas` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABEL PERIZINAN PULANG & KELUAR
CREATE TABLE IF NOT EXISTS `perizinan` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `santri_id` VARCHAR(50) NOT NULL,
  `santri_nama` VARCHAR(100),
  `santri_kelas` VARCHAR(50),
  `santri_kamar` VARCHAR(50),
  `keperluan` TEXT NOT NULL,
  `tanggal_mulai` DATE NOT NULL,
  `tanggal_selesai` DATE NOT NULL,
  `penjemput` VARCHAR(100),
  `status` VARCHAR(50) DEFAULT 'Menunggu Persetujuan',
  `catatan` TEXT,
  `petugas` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABEL AKUN PENGGUNA (APP CREDENTIALS)
CREATE TABLE IF NOT EXISTS `app_credentials` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'viewer',
  `status` VARCHAR(50) NOT NULL DEFAULT 'approved',
  `display_name` VARCHAR(100),
  `avatar_url` TEXT,
  `nama` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `app_credentials` (`id`, `username`, `password`, `role`, `status`, `display_name`)
VALUES ('superadmin', 'superadmin@attaroqqy.com', '1234', 'superadmin', 'approved', 'Super Admin')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- 8. TABEL PROFIL PESANTREN (STRUKTUR KEPENGURUSAN PUTRA & PUTRI & ALAMAT LENGKAP)
CREATE TABLE IF NOT EXISTS `pesantren_profile` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'main',
  `nama_pesantren` VARCHAR(100),
  `nama_yayasan` VARCHAR(100),
  `nspp` VARCHAR(50) DEFAULT '121235070001',
  `nomor_notaris` VARCHAR(150),
  
  -- Alamat Rapi & Terstruktur
  `alamat` TEXT,
  `rt` VARCHAR(10),
  `rw` VARCHAR(10),
  `desa` VARCHAR(50),
  `kecamatan` VARCHAR(50),
  `kabupaten` VARCHAR(50),
  `provinsi` VARCHAR(50),
  `kode_pos` VARCHAR(10),
  `telepon` VARCHAR(20),
  `email` VARCHAR(100),
  `website` VARCHAR(100),
  
  -- Struktur Kepengurusan Putra
  `nama_pengasuh_putra` VARCHAR(100),
  `nama_wakil_pengasuh_putra` VARCHAR(100),
  `nama_ketua_pondok_putra` VARCHAR(100),
  `nama_sekretaris_putra` VARCHAR(100),
  `nama_bendahara_putra` VARCHAR(100),
  `nama_ketua_pendidikan_putra` VARCHAR(100),
  `nama_ketua_keamanan_putra` VARCHAR(100),
  `nama_ketua_humasy_putra` VARCHAR(100),

  -- Struktur Kepengurusan Putri
  `nama_pengasuh_putri` VARCHAR(100),
  `nama_wakil_pengasuh_putri` VARCHAR(100),
  `nama_ketua_pondok_putri` VARCHAR(100),
  `nama_sekretaris_putri` VARCHAR(100),
  `nama_bendahara_putri` VARCHAR(100),
  `nama_ketua_pendidikan_putri` VARCHAR(100),
  `nama_ketua_keamanan_putri` VARCHAR(100),
  `nama_ketua_humasy_putri` VARCHAR(100),

  -- Kolom Legacy & Tambahan
  `nama_pengasuh` VARCHAR(100),
  `nama_ketua_yayasan` VARCHAR(100),
  `nama_wakil_pengasuh` VARCHAR(100),
  `nama_ketua_pondok` VARCHAR(100),
  `nama_sekretaris` VARCHAR(100),
  `nama_bendahara` VARCHAR(100),
  `nama_ketua_keamanan` VARCHAR(100),
  `nama_ketua_pendidikan` VARCHAR(100),
  `nama_ketua_humasy` VARCHAR(100),

  `kota_tanda_tangan` VARCHAR(50),
  `logo_style` VARCHAR(50) DEFAULT 'classic',
  `logo_url` LONGTEXT,
  `kop_tambahan_1` VARCHAR(150),
  `kop_tambahan_2` VARCHAR(150),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `pesantren_profile` (`id`, `nama_pesantren`, `nama_yayasan`) 
VALUES ('main', 'Pondok Pesantren Darussalam Al-Azhar', 'Yayasan Pendidikan Islam Darussalam')
ON DUPLICATE KEY UPDATE `id`=`id`;

-- 9. TABEL FEEDBACK
CREATE TABLE IF NOT EXISTS `feedback` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `sender_username` VARCHAR(255) NOT NULL,
  `sender_role` VARCHAR(50),
  `sender_email` VARCHAR(255) DEFAULT '',
  `message` TEXT NOT NULL,
  `is_starred` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. TABEL PERMISSIONS & ROLES
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `guard_name` VARCHAR(255) NOT NULL DEFAULT 'web',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `permissions_name_guard` (`name`, `guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `guard_name` VARCHAR(255) NOT NULL DEFAULT 'web',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `roles_name_guard` (`name`, `guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `role_has_permissions` (
  `permission_id` BIGINT NOT NULL,
  `role_id` BIGINT NOT NULL,
  PRIMARY KEY (`permission_id`, `role_id`),
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. TABEL ADMIN CHAT
CREATE TABLE IF NOT EXISTS `admin_chat` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `sender_username` VARCHAR(100),
  `sender_name` VARCHAR(100),
  `sender_role` VARCHAR(50),
  `recipient_role` VARCHAR(50),
  `message` LONGTEXT,
  `sender` VARCHAR(100),
  `senderRole` VARCHAR(50),
  `senderAvatar` TEXT,
  `text` TEXT,
  `timestamp` VARCHAR(100),
  `channel` VARCHAR(50) DEFAULT 'semua',
  `mentions` LONGTEXT,
  `attachment` LONGTEXT,
  `reply_to` LONGTEXT,
  `replyTo` LONGTEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. TABEL TUGAS & TASKS
CREATE TABLE IF NOT EXISTS `tugas` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(100),
  `username` VARCHAR(100),
  `judul` VARCHAR(255) NOT NULL,
  `deskripsi` TEXT,
  `status` VARCHAR(50) DEFAULT 'Belum Selesai',
  `prioritas` VARCHAR(20) DEFAULT 'Sedang',
  `tenggat_waktu` DATE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(100),
  `username` VARCHAR(100),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) DEFAULT 'pending',
  `priority` VARCHAR(20) DEFAULT 'medium',
  `due_date` DATE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SEED PERIODE DEFAULT
INSERT INTO `periode` (`id`, `nama`, `is_active`) VALUES ('Semua', 'Semua Periode', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

SET FOREIGN_KEY_CHECKS = 1;
