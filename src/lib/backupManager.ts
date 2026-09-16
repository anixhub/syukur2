// src/lib/backupManager.ts
// Manajemen Pencadangan (Backup), Pemulihan (Restore), dan Pencadangan Otomatis SmartSantri

import { logAdminActivity } from './activityLogger';

export interface BackupSnapshot {
  id: string;
  name: string;
  timestamp: number;
  createdAt: string; // ISO string
  formattedDate: string;
  type: 'manual' | 'auto' | 'imported';
  sizeBytes: number;
  formattedSize: string;
  summary: {
    totalSantri: number;
    totalKeys: number;
    academicYear?: string;
  };
  data: Record<string, string>;
}

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'every_3_days' | 'weekly' | 'session';
  maxBackups: number; // 5, 10, 15, 20
  lastBackupTime?: number;
}

export const STORAGE_KEY_BACKUPS = 'smartsantri_backups_list';
export const STORAGE_KEY_AUTOBACKUP_CONFIG = 'smartsantri_autobackup_config';

export const DEFAULT_AUTOBACKUP_CONFIG: AutoBackupConfig = {
  enabled: true,
  frequency: 'daily',
  maxBackups: 10,
  lastBackupTime: undefined
};

// Format bytes ke satuan terbaca
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format waktu lokal Indonesia
export function formatIndonesianDateTime(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

// Ambil riwayat cadangan dari localStorage
export function getStoredBackups(): BackupSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKUPS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Gagal membaca daftar backup dari localStorage:', err);
    return [];
  }
}

// Simpan daftar cadangan ke localStorage dengan proteksi quota
export function saveBackupsList(list: BackupSnapshot[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY_BACKUPS, JSON.stringify(list));
    return true;
  } catch (err: any) {
    // Jika localStorage penuh (QuotaExceededError), kurangi cadangan otomatis terlama
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.warn('LocalStorage penuh saat menyimpan backup. Memangkas cadangan lama...');
      // Cari cadangan otomatis tertua dan hapus
      const autoIdx = [...list].reverse().findIndex(b => b.type === 'auto');
      if (autoIdx !== -1) {
        const targetIndex = list.length - 1 - autoIdx;
        const pruned = list.filter((_, idx) => idx !== targetIndex);
        return saveBackupsList(pruned);
      }
    }
    console.error('Gagal menyimpan daftar cadangan:', err);
    return false;
  }
}

// Ambil konfigurasi backup otomatis
export function getAutoBackupConfig(): AutoBackupConfig {
  if (typeof window === 'undefined') return DEFAULT_AUTOBACKUP_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTOBACKUP_CONFIG);
    if (!raw) return DEFAULT_AUTOBACKUP_CONFIG;
    return { ...DEFAULT_AUTOBACKUP_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUTOBACKUP_CONFIG;
  }
}

// Simpan konfigurasi backup otomatis
export function saveAutoBackupConfig(config: AutoBackupConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_AUTOBACKUP_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new Event('smartsantri_autobackup_config_updated'));
  } catch (e) {
    console.error('Gagal menyimpan konfigurasi auto backup:', e);
  }
}

// Kumpulkan seluruh data sistem dari localStorage
export function collectSystemData(): {
  data: Record<string, string>;
  summary: { totalSantri: number; totalKeys: number; academicYear?: string };
  sizeBytes: number;
} {
  const data: Record<string, string> = {};
  let totalSantri = 0;
  let academicYear = '';
  let totalBytes = 0;

  if (typeof window === 'undefined') {
    return { data, summary: { totalSantri: 0, totalKeys: 0 }, sizeBytes: 0 };
  }

  // Kunci-kunci internal yang tidak perlu dicadangkan
  const excludedKeys = new Set([
    STORAGE_KEY_BACKUPS,
    STORAGE_KEY_AUTOBACKUP_CONFIG,
    'smartsantri_offline_queue'
  ]);

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Hanya ambil kunci smartsantri_ dan hindari cache / temporary keys
    if (
      key.startsWith('smartsantri_') &&
      !excludedKeys.has(key) &&
      !key.startsWith('smartsantri_cache_') &&
      !key.startsWith('smartsantri_temp_')
    ) {
      const val = localStorage.getItem(key) || '';
      data[key] = val;
      totalBytes += key.length * 2 + val.length * 2; // estimasi UTF-16 bytes

      if (key === 'smartsantri_santriList') {
        try {
          const list = JSON.parse(val);
          if (Array.isArray(list)) totalSantri = list.length;
        } catch {
          // ignore
        }
      }

      if (key === 'smartsantri_active_tahun_ajaran') {
        academicYear = val;
      }
    }
  }

  return {
    data,
    summary: {
      totalSantri,
      totalKeys: Object.keys(data).length,
      academicYear: academicYear || undefined
    },
    sizeBytes: totalBytes
  };
}

// Buat snapshot cadangan baru
export function createBackup(
  type: 'manual' | 'auto' | 'imported' = 'manual',
  customName?: string,
  providedData?: Record<string, string>
): BackupSnapshot {
  const now = new Date();
  const timestamp = now.getTime();
  const formattedDate = formatIndonesianDateTime(now);

  let dataRecord: Record<string, string>;
  let sizeBytes = 0;
  let summary: { totalSantri: number; totalKeys: number; academicYear?: string } = { totalSantri: 0, totalKeys: 0 };

  if (providedData) {
    dataRecord = providedData;
    let totalSantri = 0;
    let totalBytes = 0;
    Object.entries(providedData).forEach(([k, v]) => {
      totalBytes += k.length * 2 + v.length * 2;
      if (k === 'smartsantri_santriList') {
        try {
          const parsed = JSON.parse(v);
          if (Array.isArray(parsed)) totalSantri = parsed.length;
        } catch {}
      }
    });
    sizeBytes = totalBytes;
    summary = {
      totalSantri,
      totalKeys: Object.keys(providedData).length,
      academicYear: providedData['smartsantri_active_tahun_ajaran'] || undefined
    };
  } else {
    const collected = collectSystemData();
    dataRecord = collected.data;
    sizeBytes = collected.sizeBytes;
    summary = collected.summary;
  }

  const defaultName =
    type === 'auto'
      ? `Backup Otomatis - ${formattedDate}`
      : type === 'imported'
      ? `Impor Cadangan - ${formattedDate}`
      : `Backup Manual - ${formattedDate}`;

  const snapshot: BackupSnapshot = {
    id: `backup_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
    name: customName?.trim() || defaultName,
    timestamp,
    createdAt: now.toISOString(),
    formattedDate,
    type,
    sizeBytes,
    formattedSize: formatBytes(sizeBytes),
    summary,
    data: dataRecord
  };

  // Simpan ke daftar backup
  const existingBackups = getStoredBackups();
  let updatedList = [snapshot, ...existingBackups];

  // Batasi jumlah cadangan otomatis sesuai config
  const config = getAutoBackupConfig();
  const autoBackups = updatedList.filter(b => b.type === 'auto');
  if (autoBackups.length > config.maxBackups) {
    const allowedAutoIds = new Set(autoBackups.slice(0, config.maxBackups).map(b => b.id));
    updatedList = updatedList.filter(b => b.type !== 'auto' || allowedAutoIds.has(b.id));
  }

  // Jaga total maksimum cadangan tidak lebih dari 25 snapshot
  if (updatedList.length > 25) {
    updatedList = updatedList.slice(0, 25);
  }

  saveBackupsList(updatedList);

  if (type === 'manual') {
    logAdminActivity('Sistem', 'MEMBUAT_BACKUP', `Membuat cadangan data manual: ${snapshot.name}`);
  }

  return snapshot;
}

// Hapus cadangan dari daftar
export function deleteBackup(id: string): boolean {
  const current = getStoredBackups();
  const target = current.find(b => b.id === id);
  const updated = current.filter(b => b.id !== id);
  const success = saveBackupsList(updated);
  if (success && target) {
    logAdminActivity('Sistem', 'MENGHAPUS_BACKUP', `Menghapus arsip cadangan data: ${target.name}`);
  }
  return success;
}

// Pulihkan (Restore) data dari snapshot cadangan
// "yang mana restore akan menimpa file yang ada sekarang dan menggantinya dengan data backup yang di restore itu"
export function restoreBackup(snapshot: BackupSnapshot): { success: boolean; message: string; error?: string } {
  if (typeof window === 'undefined' || !snapshot || !snapshot.data) {
    return { success: false, message: 'Data cadangan tidak valid atau kosong.' };
  }

  try {
    // 1. Simpan sesi pengguna aktif agar tidak logout paksa setelah pemulihan
    const activeSession = {
      isLoggedIn: localStorage.getItem('smartsantri_is_logged_in'),
      role: localStorage.getItem('smartsantri_active_role'),
      username: localStorage.getItem('smartsantri_active_username'),
      displayName: localStorage.getItem('smartsantri_active_display_name'),
      avatar: localStorage.getItem('smartsantri_profile_avatar')
    };

    // 2. Simpan daftar riwayat backup & config auto-backup agar tidak hilang saat restore
    const preservedBackupsList = localStorage.getItem(STORAGE_KEY_BACKUPS);
    const preservedAutoConfig = localStorage.getItem(STORAGE_KEY_AUTOBACKUP_CONFIG);

    // 3. Hapus seluruh data sistem saat ini (menimpa file yang ada sekarang)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith('smartsantri_') &&
        key !== STORAGE_KEY_BACKUPS &&
        key !== STORAGE_KEY_AUTOBACKUP_CONFIG
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 4. Masukkan seluruh data dari snapshot cadangan
    Object.entries(snapshot.data).forEach(([k, v]) => {
      // Jangan timpa daftar backup dengan data lama di dalam snapshot
      if (k !== STORAGE_KEY_BACKUPS && k !== STORAGE_KEY_AUTOBACKUP_CONFIG) {
        localStorage.setItem(k, v);
      }
    });

    // 5. Kembalikan daftar cadangan & konfigurasi auto backup
    if (preservedBackupsList) {
      localStorage.setItem(STORAGE_KEY_BACKUPS, preservedBackupsList);
    }
    if (preservedAutoConfig) {
      localStorage.setItem(STORAGE_KEY_AUTOBACKUP_CONFIG, preservedAutoConfig);
    }

    // 6. Pastikan sesi login aktif tetap terjaga jika backup tidak menyediakannya
    if (activeSession.isLoggedIn === 'true' && !localStorage.getItem('smartsantri_is_logged_in')) {
      localStorage.setItem('smartsantri_is_logged_in', 'true');
      if (activeSession.role) localStorage.setItem('smartsantri_active_role', activeSession.role);
      if (activeSession.username) localStorage.setItem('smartsantri_active_username', activeSession.username);
      if (activeSession.displayName) localStorage.setItem('smartsantri_active_display_name', activeSession.displayName);
      if (activeSession.avatar) localStorage.setItem('smartsantri_profile_avatar', activeSession.avatar);
    }

    // 7. Catat log admin
    logAdminActivity(
      'Sistem',
      'MEMULIHKAN_DATA',
      `Memulihkan seluruh data sistem dari cadangan: ${snapshot.name} (${snapshot.formattedDate})`
    );

    // 8. Picu custom events agar UI komponen memperbarui datanya
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('smartsantri_education_updated'));
    window.dispatchEvent(new Event('smartsantri_profile_updated'));
    window.dispatchEvent(new Event('smartsantri_activity_updated'));
    window.dispatchEvent(new CustomEvent('smartsantri_data_restored', { detail: { snapshotId: snapshot.id } }));

    return {
      success: true,
      message: `Seluruh data berhasil dipulihkan dari cadangan "${snapshot.name}"!`
    };
  } catch (err: any) {
    console.error('Gagal memulihkan data backup:', err);
    return {
      success: false,
      message: 'Gagal memulihkan data: ' + (err?.message || 'Kesalahan internal'),
      error: err?.message
    };
  }
}

// Unduh file snapshot cadangan ke format file .json
export function exportBackupToJsonFile(snapshot: BackupSnapshot): void {
  try {
    const exportPayload = {
      app: 'SmartSantri',
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      snapshot: {
        id: snapshot.id,
        name: snapshot.name,
        timestamp: snapshot.timestamp,
        formattedDate: snapshot.formattedDate,
        type: snapshot.type,
        summary: snapshot.summary
      },
      data: snapshot.data
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const safeName = snapshot.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smartsantri_${safeName}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (e: any) {
    console.error('Gagal mengunduh berkas cadangan JSON:', e);
    throw new Error('Gagal mengunduh berkas: ' + e.message);
  }
}

// Impor file JSON cadangan dari komputer
export async function importBackupFromJsonFile(file: File): Promise<BackupSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('Berkas kosong.');
        }

        const parsed = JSON.parse(text);
        let dataMap: Record<string, string> = {};
        let name = file.name.replace(/\.json$/i, '');

        // Format 1: Dikemas oleh exportBackupToJsonFile
        if (parsed && parsed.data && typeof parsed.data === 'object') {
          dataMap = parsed.data;
          if (parsed.snapshot?.name) {
            name = parsed.snapshot.name;
          }
        } 
        // Format 2: Raw dictionary key-value { "smartsantri_...": "..." }
        else if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([k, v]) => {
            if (typeof v === 'string') {
              dataMap[k] = v;
            } else {
              dataMap[k] = JSON.stringify(v);
            }
          });
        }

        // Validasi apakah ada kunci data smartsantri
        const smartSantriKeys = Object.keys(dataMap).filter(k => k.startsWith('smartsantri_'));
        if (smartSantriKeys.length === 0) {
          throw new Error('Berkas ini tidak berisi data sistem SmartSantri yang valid.');
        }

        const snapshot = createBackup('imported', `Impor: ${name}`, dataMap);
        resolve(snapshot);
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal memproses berkas JSON cadangan.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas dari perangkat.'));
    };

    reader.readAsText(file);
  });
}

// Cek dan eksekusi pencadangan otomatis jika jadwal terpenuhi
export async function checkAndRunAutoBackup(): Promise<BackupSnapshot | null> {
  if (typeof window === 'undefined') return null;

  const config = getAutoBackupConfig();
  if (!config.enabled) return null;

  const now = Date.now();
  const lastTime = config.lastBackupTime || 0;
  const elapsed = now - lastTime;

  let shouldRun = false;

  switch (config.frequency) {
    case 'session':
      // Dijalankan jika sesi terakhir lebih dari 3 jam yang lalu atau belum pernah
      shouldRun = elapsed >= 3 * 60 * 60 * 1000;
      break;
    case 'daily':
      // Setiap 24 jam
      shouldRun = elapsed >= 24 * 60 * 60 * 1000;
      break;
    case 'every_3_days':
      // Setiap 3 hari (72 jam)
      shouldRun = elapsed >= 3 * 24 * 60 * 60 * 1000;
      break;
    case 'weekly':
      // Setiap 7 hari (168 jam)
      shouldRun = elapsed >= 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      shouldRun = elapsed >= 24 * 60 * 60 * 1000;
  }

  if (shouldRun) {
    try {
      const snapshot = createBackup('auto');
      config.lastBackupTime = now;
      saveAutoBackupConfig(config);
      console.log(`[AutoBackup] Berhasil mencadangkan otomatis: ${snapshot.name}`);
      window.dispatchEvent(new CustomEvent('smartsantri_autobackup_completed', { detail: { snapshot } }));
      return snapshot;
    } catch (err) {
      console.error('[AutoBackup] Gagal melakukan backup otomatis:', err);
      return null;
    }
  }

  return null;
}

// Inisialisasi scheduler otomatis di aplikasi
export function initAutoBackupScheduler(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Jalankan pemeriksaan awal
  checkAndRunAutoBackup();

  // Periksa secara berkala setiap 30 menit saat aplikasi aktif
  const intervalId = setInterval(() => {
    checkAndRunAutoBackup();
  }, 30 * 60 * 1000);

  return () => clearInterval(intervalId);
}
