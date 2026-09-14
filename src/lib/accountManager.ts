import { normalizeRoleId, fetchAndSyncPermissionsFromSupabase } from './permissions';

export interface SavedAccount {
  id: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  lastActive?: string;
}

const STORAGE_KEY = 'smartsantri_saved_accounts';

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: SavedAccount[] = raw ? JSON.parse(raw) : [];

    const isLoggedIn = localStorage.getItem('smartsantri_is_logged_in') === 'true';
    const activeUsername = localStorage.getItem('smartsantri_active_username');

    if (!isLoggedIn || !activeUsername) {
      return list;
    }

    const activeDisplayName = localStorage.getItem('smartsantri_active_display_name') || 'Mang Daud';
    const activeRole = localStorage.getItem('smartsantri_active_role') || 'superadmin';
    const activeAvatar = localStorage.getItem('smartsantri_profile_avatar') || '';

    // If empty and user is logged in, initialize with current active user
    if (list.length === 0) {
      const defaultAcc: SavedAccount = {
        id: 'acc_' + Date.now(),
        username: activeUsername,
        displayName: activeDisplayName,
        role: activeRole,
        avatarUrl: activeAvatar,
        lastActive: new Date().toISOString()
      };
      list = [defaultAcc];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } else {
      // Ensure current user is in list or updated
      const existingIdx = list.findIndex(
        a => a.username.toLowerCase() === activeUsername.toLowerCase()
      );
      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          displayName: activeDisplayName || list[existingIdx].displayName,
          role: activeRole || list[existingIdx].role,
          avatarUrl: activeAvatar || list[existingIdx].avatarUrl,
          lastActive: new Date().toISOString()
        };
      } else {
        list.unshift({
          id: 'acc_' + Date.now(),
          username: activeUsername,
          displayName: activeDisplayName,
          role: activeRole,
          avatarUrl: activeAvatar,
          lastActive: new Date().toISOString()
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    return list;
  } catch (e) {
    console.error('Error loading saved accounts:', e);
    return [];
  }
}

export function saveAccount(account: SavedAccount): SavedAccount[] {
  const current = getSavedAccounts();
  const index = current.findIndex(a => a.username.toLowerCase() === account.username.toLowerCase());
  
  if (index >= 0) {
    current[index] = { ...current[index], ...account, lastActive: new Date().toISOString() };
  } else {
    current.unshift({ ...account, lastActive: new Date().toISOString() });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
}

export async function switchAccount(account: SavedAccount) {
  localStorage.setItem('smartsantri_is_logged_in', 'true');
  localStorage.setItem('smartsantri_active_username', account.username);
  localStorage.setItem('smartsantri_active_display_name', account.displayName);
  localStorage.setItem('smartsantri_active_role', normalizeRoleId(account.role));
  
  if (account.avatarUrl) {
    localStorage.setItem('smartsantri_profile_avatar', account.avatarUrl);
  } else {
    localStorage.removeItem('smartsantri_profile_avatar');
  }

  // Update in saved list as recently active
  saveAccount(account);

  // Sync permissions
  try {
    await fetchAndSyncPermissionsFromSupabase();
  } catch (e) {
    console.warn('Sync permissions on switch failed:', e);
  }

  // Trigger profile and storage update events
  window.dispatchEvent(new Event('smartsantri_profile_updated'));
  window.dispatchEvent(new Event('storage'));
}

export function removeSavedAccount(username: string): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let current: SavedAccount[] = raw ? JSON.parse(raw) : [];
    current = current.filter(a => a.username.toLowerCase() !== username.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch (e) {
    console.error('Error removing saved account:', e);
    return [];
  }
}

export async function logoutCurrentAccount(onLogout?: () => void) {
  const currentUsername = localStorage.getItem('smartsantri_active_username') || '';
  
  // Remove current logged out account from saved list
  const remaining = removeSavedAccount(currentUsername);

  if (remaining.length > 0) {
    // If there is at least 1 other saved account, auto login to the next account
    const nextAccount = remaining[0];
    await switchAccount(nextAccount);
    window.location.reload();
  } else {
    // No other accounts left, fully logout
    localStorage.removeItem('smartsantri_is_logged_in');
    localStorage.removeItem('smartsantri_active_role');
    localStorage.removeItem('smartsantri_active_username');
    localStorage.removeItem('smartsantri_active_display_name');
    localStorage.removeItem('smartsantri_profile_avatar');
    localStorage.removeItem(STORAGE_KEY);
    
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  }
}
