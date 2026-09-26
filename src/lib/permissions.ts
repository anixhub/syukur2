export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  moduleDesc: string;
  accessLevel: 'none' | 'read' | 'write';
}

export interface AccountRole {
  id: string;
  name: string;
  category: 'superadmin' | 'sekretaris' | 'bendahara' | 'pendidikan' | 'humasy' | 'keamanan';
  gender: 'putra' | 'putri' | 'all';
  desc: string;
  badge: string;
  badgeColor: string;
  permissions: { [key: string]: boolean };
}

export function normalizeRoleId(roleId: string): string {
  if (!roleId) return 'superadmin';
  const lowered = roleId.toLowerCase().trim();
  if (lowered === 'admin') return 'superadmin';
  if (lowered === 'humas_putra') return 'humasy_putra';
  if (lowered === 'humas_putri') return 'humasy_putri';
  return lowered;
}

// Dynamic builder to construct full 20 permissions dict per role
export const buildPermissions = (activeModules: string | string[], activeActions: string[]) => {
  const perms: { [key: string]: boolean } = {};
  const modules = [
    'sekretaris_putra', 'sekretaris_putri',
    'bendahara_putra', 'bendahara_putri',
    'keamanan_putra', 'keamanan_putri',
    'humasy_putra', 'humasy_putri',
    'pendidikan_putra', 'pendidikan_putri'
  ];
  const actions = ['view', 'write'];

  const activeListRaw = typeof activeModules === 'string' ? [activeModules] : activeModules;
  const activeList = activeListRaw.map(normalizeRoleId);

  modules.forEach(m => {
    actions.forEach(a => {
      const key = `${m}.${a}`;
      const aliasKey = `${m.replace('humasy_', 'humas_')}.${a}`;
      if (activeList.includes('superadmin')) {
        perms[key] = true;
        perms[aliasKey] = true;
      } else {
        let matched = activeList.includes(m);
        if (activeList.includes('bendahara_pusat') && (m === 'bendahara_putra' || m === 'bendahara_putri')) {
          matched = true;
        }
        if (activeList.includes('kepala_keamanan') && (m === 'keamanan_putra' || m === 'keamanan_putri')) {
          matched = true;
        }

        if (matched) {
          const val = activeActions.includes(a);
          perms[key] = val;
          perms[aliasKey] = val;
        } else {
          const val = a === 'view';
          perms[key] = val;
          perms[aliasKey] = val;
        }
      }
    });
  });
  return perms;
};

// Default roles aligned with Spatie Laravel-Permission seeds
export const DEFAULT_ROLES: AccountRole[] = [
  {
    id: 'superadmin',
    name: 'Superadmin',
    category: 'superadmin',
    gender: 'all',
    desc: 'Pemegang kendali penuh seluruh modul sistem.',
    badge: 'AKSES PENUH',
    badgeColor: 'bg-slate-100 text-slate-600 border border-slate-200/50',
    permissions: buildPermissions('superadmin', [])
  },
  {
    id: 'sekretaris_putra',
    name: 'Sekretaris Putra',
    category: 'sekretaris',
    gender: 'putra',
    desc: 'Pengelola data induk santri & berkas administrasi asrama putra.',
    badge: 'PUTRA',
    badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100/50',
    permissions: buildPermissions('sekretaris_putra', ['view', 'write'])
  },
  {
    id: 'sekretaris_putri',
    name: 'Sekretaris Putri',
    category: 'sekretaris',
    gender: 'putri',
    desc: 'Pengelola data induk santri & berkas administrasi asrama putri.',
    badge: 'PUTRI',
    badgeColor: 'bg-pink-50 text-pink-600 border border-pink-100/50',
    permissions: buildPermissions('sekretaris_putri', ['view', 'write'])
  },
  {
    id: 'bendahara_putra',
    name: 'Bendahara Putra',
    category: 'bendahara',
    gender: 'putra',
    desc: 'Kasir dan pengelola syahriah iuran santri putra.',
    badge: 'PUTRA',
    badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100/50',
    permissions: buildPermissions('bendahara_putra', ['view', 'write'])
  },
  {
    id: 'bendahara_putri',
    name: 'Bendahara Putri',
    category: 'bendahara',
    gender: 'putri',
    desc: 'Kasir dan pengelola syahriah iuran santri putri.',
    badge: 'PUTRI',
    badgeColor: 'bg-pink-50 text-pink-600 border border-pink-100/50',
    permissions: buildPermissions('bendahara_putri', ['view', 'write'])
  },
  {
    id: 'kepala_keamanan',
    name: 'Kepala Keamanan',
    category: 'keamanan',
    gender: 'all',
    desc: 'Pengawas ketertiban, catatan ta\'zir, dan sanksi santri.',
    badge: 'KEAMANAN',
    badgeColor: 'bg-rose-50 text-rose-600 border border-rose-100/50',
    permissions: buildPermissions('kepala_keamanan', ['view', 'write'])
  },
  {
    id: 'keamanan_putra',
    name: 'Keamanan Putra',
    category: 'keamanan',
    gender: 'putra',
    desc: 'Pengawas ketertiban, catatan ta\'zir, dan sanksi santri putra.',
    badge: 'PUTRA',
    badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100/50',
    permissions: buildPermissions('keamanan_putra', ['view'])
  },
  {
    id: 'keamanan_putri',
    name: 'Keamanan Putri',
    category: 'keamanan',
    gender: 'putri',
    desc: 'Pengawas ketertiban, catatan ta\'zir, dan sanksi santri putri.',
    badge: 'PUTRI',
    badgeColor: 'bg-pink-50 text-pink-600 border border-pink-100/50',
    permissions: buildPermissions('keamanan_putri', ['view'])
  },
  {
    id: 'humasy_putra',
    name: 'Humas/Kamar Putra',
    category: 'humasy',
    gender: 'putra',
    desc: 'Pengelola asrama, penempatan kamar, dan relasi wali santri putra.',
    badge: 'HUMAS',
    badgeColor: 'bg-teal-50 text-teal-600 border border-teal-100/50',
    permissions: buildPermissions('humasy_putra', ['view', 'write'])
  },
  {
    id: 'humasy_putri',
    name: 'Humas/Kamar Putri',
    category: 'humasy',
    gender: 'putri',
    desc: 'Pengelola asrama, penempatan kamar, dan relasi wali santri putri.',
    badge: 'HUMAS',
    badgeColor: 'bg-teal-50 text-teal-600 border border-teal-100/50',
    permissions: buildPermissions('humasy_putri', ['view', 'write'])
  },
  {
    id: 'pendidikan_putra',
    name: 'Pendidikan Putra',
    category: 'pendidikan',
    gender: 'putra',
    desc: 'Pengurus kurikulum, jadwal madrasah, dan rapor putra.',
    badge: 'PENDIDIKAN',
    badgeColor: 'bg-amber-50 text-amber-600 border border-amber-100/50',
    permissions: buildPermissions('pendidikan_putra', ['view', 'write'])
  },
  {
    id: 'pendidikan_putri',
    name: 'Pendidikan Putri',
    category: 'pendidikan',
    gender: 'putri',
    desc: 'Pengurus kurikulum, jadwal madrasah, dan rapor putri.',
    badge: 'PENDIDIKAN',
    badgeColor: 'bg-amber-50 text-amber-600 border border-amber-100/50',
    permissions: buildPermissions('pendidikan_putri', ['view', 'write'])
  }
];

export function getPermissionsForRole(roleId: string): { [key: string]: boolean } {
  const normRole = normalizeRoleId(roleId);
  if (normRole === 'superadmin') {
    return buildPermissions('superadmin', []);
  }

  let roleObj: AccountRole | undefined;

  const rolesPermissionsStr = localStorage.getItem('smartsantri_roles_permissions');
  if (rolesPermissionsStr) {
    try {
      const rolesList = JSON.parse(rolesPermissionsStr);
      if (Array.isArray(rolesList)) {
        roleObj = rolesList.find((r: any) => normalizeRoleId(r.id) === normRole);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!roleObj) {
    roleObj = DEFAULT_ROLES.find((r: any) => normalizeRoleId(r.id) === normRole);
  }

  const perms = roleObj ? { ...(roleObj.permissions || {}) } : {};

  // Ensure both humasy_ and humas_ key formats are present in returned object
  Object.keys(perms).forEach(key => {
    if (key.startsWith('humasy_')) {
      const aliasKey = key.replace('humasy_', 'humas_');
      perms[aliasKey] = perms[key];
    } else if (key.startsWith('humas_')) {
      const aliasKey = key.replace('humas_', 'humasy_');
      perms[aliasKey] = perms[key];
    }
  });

  return perms;
}

import { getApiUrl } from './api';

export async function fetchAndSyncPermissionsFromDatabase(): Promise<AccountRole[]> {
  const getLocalRoles = (): AccountRole[] | null => {
    try {
      const local = localStorage.getItem('smartsantri_roles_permissions');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as AccountRole[];
        }
      }
    } catch (e) {}
    return null;
  };

  const localRoles = getLocalRoles();

  try {
    const [rolesRes, permsRes, rolePermsRes] = await Promise.all([
      fetch(getApiUrl("/api/db/roles")).catch(() => null),
      fetch(getApiUrl("/api/db/permissions")).catch(() => null),
      fetch(getApiUrl("/api/db/role_has_permissions")).catch(() => null)
    ]);

    if (!rolesRes || !permsRes || !rolePermsRes || !rolesRes.ok || !permsRes.ok || !rolePermsRes.ok) {
      return localRoles || DEFAULT_ROLES;
    }

    let rolesData, permsData, rolePermsData;
    try {
      rolesData = await rolesRes.json();
      permsData = await permsRes.json();
      rolePermsData = await rolePermsRes.json();
    } catch (e) {
      return localRoles || DEFAULT_ROLES;
    }

    if (!rolesData?.success || !permsData?.success || !rolePermsData?.success) {
      return localRoles || DEFAULT_ROLES;
    }

    const dbRoles = rolesData.data || [];
    const dbPerms = permsData.data || [];
    const dbRolePerms = rolePermsData.data || [];

    if (!Array.isArray(dbRoles) || dbRoles.length === 0 || !Array.isArray(dbPerms) || dbPerms.length === 0) {
      return localRoles || DEFAULT_ROLES;
    }

    const updatedRoles: AccountRole[] = DEFAULT_ROLES.map(defaultRole => {
      const localRole = localRoles?.find(r => normalizeRoleId(r.id) === defaultRole.id) || defaultRole;
      const matchedDbRole = dbRoles.find((r: any) => normalizeRoleId(r.name) === defaultRole.id);

      const assignedPermIds = matchedDbRole ? dbRolePerms
        .filter((rp: any) => String(rp.role_id) === String(matchedDbRole.id))
        .map((rp: any) => rp.permission_id) : [];

      const permissionsMap: { [key: string]: boolean } = {};
      
      const modules = [
        'sekretaris_putra', 'sekretaris_putri',
        'bendahara_putra', 'bendahara_putri',
        'keamanan_putra', 'keamanan_putri',
        'humasy_putra', 'humasy_putri',
        'pendidikan_putra', 'pendidikan_putri'
      ];
      const actions = ['view', 'write'];

      modules.forEach(m => {
        actions.forEach(a => {
          const permKey = `${m}.${a}`;
          const val = localRole.permissions?.[permKey] ?? defaultRole.permissions[permKey] ?? (a === 'view');
          permissionsMap[permKey] = val;
          permissionsMap[`${m.replace('humasy_', 'humas_')}.${a}`] = val;
        });
      });

      if (assignedPermIds.length > 0) {
        dbPerms.forEach((p: any) => {
          if (assignedPermIds.includes(p.id)) {
            const normName = p.name.replace('humas_', 'humasy_');
            permissionsMap[normName] = true;
            permissionsMap[p.name] = true;
          }
        });
      }

      return {
        ...defaultRole,
        permissions: permissionsMap
      };
    });

    localStorage.setItem('smartsantri_roles_permissions', JSON.stringify(updatedRoles));
    return updatedRoles;
  } catch (error) {
    console.warn("Sinkronisasi hak akses menggunakan konfigurasi lokal/default:", error);
    return localRoles || DEFAULT_ROLES;
  }
}

export const fetchAndSyncPermissionsFromSupabase = fetchAndSyncPermissionsFromDatabase;
