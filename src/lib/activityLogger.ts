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
  const displayName = localStorage.getItem('smartsantri_active_display_name') || username.split('@')[0] || 'Admin';

  const isAdminSuper = role.includes('superadmin') || username.toLowerCase().includes('superadmin');
  const formattedAdminName = isAdminSuper
    ? 'Superadmin (superadmin@attaroqqy.com)'
    : `${displayName} (${username})`;

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
    const trimmed = logs.slice(0, 100);
    localStorage.setItem('smartsantri_admin_activity_logs', JSON.stringify(trimmed));
    window.dispatchEvent(new Event('smartsantri_activity_updated'));
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
