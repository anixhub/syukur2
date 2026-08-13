import { getApiUrl } from './api';

export interface AdminActivityLog {
  id: string;
  time: string;
  timestamp: number;
  adminName: string;
  adminRole: string;
  module: 'Sekretariat' | 'Keamanan' | 'Keuangan' | 'Pendidikan' | 'Humas' | 'Sistem';
  actionType: string;
  description: string;
  details?: string;
}

export function logAdminActivity(
  module: AdminActivityLog['module'],
  actionType: string,
  description: string,
  details?: string
) {
  const role = (localStorage.getItem('smartsantri_active_role') || '').toLowerCase();
  const username = localStorage.getItem('smartsantri_active_username') || '';
  const displayName = (localStorage.getItem('smartsantri_active_display_name') || '').trim();

  const isAdminSuper = role.includes('superadmin') || username.toLowerCase().includes('superadmin');
  const activeName = displayName || (username ? username.split('@')[0] : '') || (isAdminSuper ? 'Superadmin' : getRoleLabel(role));
  const formattedAdminName = username ? `${activeName} (${username})` : activeName;

  const now = new Date();
  const timeStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + ', ' + String(now.getHours()).padStart(2, '0') + '.' + String(now.getMinutes()).padStart(2, '0');

  const newLog: AdminActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    time: timeStr,
    timestamp: Date.now(),
    adminName: formattedAdminName,
    adminRole: isAdminSuper ? 'Superadmin' : getRoleLabel(role),
    module,
    actionType,
    description,
    details
  };

  try {
    const existing = localStorage.getItem('smartsantri_admin_activity_logs');
    const logs: AdminActivityLog[] = existing ? JSON.parse(existing) : [];
    logs.unshift(newLog);
    const now = Date.now();
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
    const trimmed = logs.filter(l => (now - l.timestamp) <= FOURTEEN_DAYS_MS).slice(0, 100);
    localStorage.setItem('smartsantri_admin_activity_logs', JSON.stringify(trimmed));
    window.dispatchEvent(new Event('smartsantri_activity_updated'));

    const getLocalFormattedTime = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${day} ${h}:${min}:${s}`;
    };

    // Kirim juga ke server backend untuk disimpan ke MySQL riwayat_aktivitas
    fetch(getApiUrl('/api/db/riwayat_aktivitas'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama_user: formattedAdminName,
        peran: isAdminSuper ? 'Superadmin' : getRoleLabel(role),
        aksi: actionType,
        deskripsi: description,
        modul: module,
        created_at: getLocalFormattedTime()
      })
    }).catch(err => {
      console.warn("Gagal mengirim riwayat_aktivitas ke server backend:", err);
    });
  } catch (e) {
    console.warn("Gagal menyimpan log aktivitas admin:", e);
  }
}

export function getRoleLabel(roleId: string): string {
  const norm = (roleId || '').toLowerCase();
  if (norm.includes('superadmin')) return 'Superadmin';
  if (norm.includes('sekretaris_putra')) return 'Sekretaris Putra';
  if (norm.includes('sekretaris_putri')) return 'Sekretaris Putri';
  if (norm.includes('bendahara_putra')) return 'Bendahara Putra';
  if (norm.includes('bendahara_putri')) return 'Bendahara Putri';
  if (norm.includes('keamanan_putra')) return 'Keamanan Putra';
  if (norm.includes('keamanan_putri')) return 'Keamanan Putri';
  if (norm.includes('pendidikan_putra')) return 'Pendidikan Putra';
  if (norm.includes('pendidikan_putri')) return 'Pendidikan Putri';
  if (norm.includes('humas_putra') || norm.includes('humasy_putra')) return 'Humas Putra';
  if (norm.includes('humas_putri') || norm.includes('humasy_putri')) return 'Humas Putri';
  return 'Pengurus';
}
