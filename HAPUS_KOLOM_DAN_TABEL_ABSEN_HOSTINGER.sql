-- ==============================================================================
-- SCRIPT MIGRASI KHUSUS HOSTINGER (phpMyAdmin / MariaDB / MySQL)
-- TUJUAN:
-- 1. Hapus tabel `absen`, `absensi`, `no_absen` jika ada di database.
-- 2. Hapus kolom `no_absen` dari tabel `santri` jika ada di database.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. HAPUS TABEL TERKAIT ABSEN (Jika ada di database)
DROP TABLE IF EXISTS `absen`;
DROP TABLE IF EXISTS `absensi`;
DROP TABLE IF EXISTS `no_absen`;

-- 2. HAPUS KOLOM `no_absen` DARI TABEL `santri` SECARA AMAN (Idempotent)
SET @drop_col_santri = (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'santri' AND COLUMN_NAME = 'no_absen'
    ),
    'ALTER TABLE `santri` DROP COLUMN `no_absen`;',
    'SELECT "Kolom no_absen sudah tidak ada di tabel santri" AS status;'
  )
);

PREPARE stmt_drop_col FROM @drop_col_santri;
EXECUTE stmt_drop_col;
DEALLOCATE PREPARE stmt_drop_col;

SET FOREIGN_KEY_CHECKS = 1;

-- SELESAI: Tabel absen dan kolom no_absen berhasil dihapus sepenuhnya dari Database Hostinger.
