-- ==============================================================================
-- QUERY MIGRASI PEMBARUAN NOMOR INDUK MADRASAH (MySQL / phpMyAdmin)
-- Memperbarui struktur tabel `santri` untuk mendukung 3 Jenjang Madrasah:
-- 1. Induk MHD (`induk_mhd`)
-- 2. Induk Wustho (`induk_wustho`)
-- 3. Induk Ulya (`induk_ulya`)
-- ==============================================================================

-- CARA PENGGUNAAN DI phpMyAdmin:
-- 1. Buka cPanel / phpMyAdmin Hostinger Anda.
-- 2. Pilih database Smart Santri Anda di panel sebelah kiri.
-- 3. Klik tab "SQL" di menu atas.
-- 4. Salin (copy) dan tempel (paste) query di bawah ini, lalu klik "Kirim" (Go).

-- ------------------------------------------------------------------------------
-- 1. TAMBAH KOLOM RESMI (SNAKE_CASE) KE TABEL SANTRI
-- ------------------------------------------------------------------------------
ALTER TABLE `santri` 
  ADD COLUMN `induk_mhd` VARCHAR(30) NULL AFTER `nisn`,
  ADD COLUMN `induk_wustho` VARCHAR(30) NULL AFTER `induk_mhd`,
  ADD COLUMN `induk_ulya` VARCHAR(30) NULL AFTER `induk_wustho`;

-- ------------------------------------------------------------------------------
-- 2. HAPUS KOLOM DUPLIKAT (indukMhd, indukWustho, indukUlya) JIKA SEBELUMNYA SUDAH DIBUAT
-- ------------------------------------------------------------------------------
-- ALTER TABLE `santri` 
--   DROP COLUMN `indukMhd`, 
--   DROP COLUMN `indukWustho`, 
--   DROP COLUMN `indukUlya`;

-- ------------------------------------------------------------------------------
-- 3. (OPSIONAL) MIGRASI DATA DARI KOLOM LAMA `nism` JIKA ADA
-- Jika sebelumnya ada data pada kolom `nism` dan ingin disalin ke `induk_mhd`:
-- ------------------------------------------------------------------------------
-- UPDATE `santri` 
-- SET `induk_mhd` = `nism` 
-- WHERE (`induk_mhd` IS NULL OR `induk_mhd` = '') AND `nism` IS NOT NULL AND `nism` != '';

-- ------------------------------------------------------------------------------
-- 4. (OPSIONAL) HAPUS KOLOM LAMA `nism` JIKA SUDAH TIDAK DIGUNAKAN
-- ------------------------------------------------------------------------------
-- ALTER TABLE `santri` DROP COLUMN `nism`;

