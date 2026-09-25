// Offline Sync Queue & Network Status Manager for Pesantren Go AttarOkey
import { camelToSnake, getApiUrl } from './utils';

export interface OfflineMutation {
  id: string;
  table: string;
  localKey: string;
  type: 'insert' | 'insert_batch' | 'update' | 'delete';
  recordId?: string | number;
  payload?: any;
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  lastError: string | null;
}

const QUEUE_STORAGE_KEY = 'smartsantri_offline_queue';
const LAST_SYNC_KEY = 'smartsantri_last_sync_time';

type StatusListener = (status: SyncStatus) => void;
const listeners = new Set<StatusListener>();

let currentStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  lastError: null,
};

// Initialize last sync time from localStorage
if (typeof window !== 'undefined') {
  const savedLastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (savedLastSync) {
    currentStatus.lastSyncTime = parseInt(savedLastSync, 10) || null;
  }
}

function notifyListeners() {
  const statusCopy = { ...currentStatus, pendingCount: getPendingMutationCount() };
  listeners.forEach((fn) => {
    try {
      fn(statusCopy);
    } catch (e) {
      console.error('Error notifying sync listener:', e);
    }
  });
}

/**
 * Retrieve current pending mutations in queue
 */
export function getOfflineQueue(): OfflineMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Failed to parse offline queue:', e);
    return [];
  }
}

/**
 * Save offline queue to localStorage
 */
function saveOfflineQueue(queue: OfflineMutation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to save offline queue to localStorage:', e);
  }
  currentStatus.pendingCount = queue.length;
  notifyListeners();
}

/**
 * Count how many items are waiting in offline queue
 */
export function getPendingMutationCount(): number {
  return getOfflineQueue().length;
}

/**
 * Add a failed remote mutation to the offline sync queue
 */
export function enqueueOfflineMutation(mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) {
  const queue = getOfflineQueue();

  // If there's an existing update for the same record & table, consolidate if possible
  if (mutation.type === 'update' && mutation.recordId) {
    const existingIdx = queue.findIndex(
      (m) => m.table === mutation.table && m.recordId === mutation.recordId && m.type === 'update'
    );
    if (existingIdx !== -1) {
      queue[existingIdx].payload = {
        ...queue[existingIdx].payload,
        ...mutation.payload,
      };
      queue[existingIdx].timestamp = Date.now();
      saveOfflineQueue(queue);
      console.log(`[Offline Sync] Consolidated update for ${mutation.table}/${mutation.recordId} into queue.`);
      return;
    }
  }

  // If a delete is enqueued for a record that was newly inserted while offline (never made it to server),
  // we can simply remove the insert from the queue without sending to server.
  if (mutation.type === 'delete' && mutation.recordId) {
    const existingInsertIdx = queue.findIndex(
      (m) => m.table === mutation.table && m.recordId === mutation.recordId && m.type === 'insert'
    );
    if (existingInsertIdx !== -1) {
      queue.splice(existingInsertIdx, 1);
      saveOfflineQueue(queue);
      console.log(`[Offline Sync] Cancelled offline insert for ${mutation.table}/${mutation.recordId} via offline delete.`);
      return;
    }
  }

  const item: OfflineMutation = {
    ...mutation,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };

  queue.push(item);
  saveOfflineQueue(queue);
  console.log(`[Offline Sync] Enqueued offline mutation for '${mutation.table}' (${mutation.type}). Total pending: ${queue.length}`);
}

/**
 * Process and flush all pending mutations to the server
 */
export async function processOfflineQueue(): Promise<{ success: boolean; processed: number; remaining: number }> {
  if (currentStatus.isSyncing) {
    return { success: false, processed: 0, remaining: getPendingMutationCount() };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    currentStatus.lastSyncTime = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_SYNC_KEY, String(currentStatus.lastSyncTime));
    }
    notifyListeners();
    return { success: true, processed: 0, remaining: 0 };
  }

  currentStatus.isSyncing = true;
  currentStatus.lastError = null;
  notifyListeners();

  let processedCount = 0;
  const remainingQueue: OfflineMutation[] = [...queue];

  try {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];

      try {
        let res: Response | null = null;

        if (item.type === 'insert') {
          const body = camelToSnake(item.payload);
          res = await fetch(getApiUrl(`/api/db/${item.table}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        } else if (item.type === 'insert_batch') {
          const body = camelToSnake(item.payload);
          res = await fetch(getApiUrl(`/api/db/${item.table}`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        } else if (item.type === 'update' && item.recordId) {
          const body = camelToSnake(item.payload);
          res = await fetch(getApiUrl(`/api/db/${item.table}/${item.recordId}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        } else if (item.type === 'delete' && item.recordId) {
          res = await fetch(getApiUrl(`/api/db/${item.table}/${item.recordId}`), {
            method: 'DELETE',
          });
        }

        if (res && (res.ok || res.status === 404)) {
          // If successful or 404 (already deleted remotely), mark as processed
          processedCount++;
          remainingQueue.shift();
          saveOfflineQueue([...remainingQueue]);
        } else {
          // Server returned error (like 500 or timeout), pause queue processing
          console.warn(`[Offline Sync] Server error syncing item ${item.id} (${res?.status}). Pausing queue.`);
          break;
        }
      } catch (err: any) {
        // Network connection dropped mid-sync
        console.warn(`[Offline Sync] Network dropped while syncing item ${item.id}:`, err);
        currentStatus.isOnline = false;
        currentStatus.lastError = 'Koneksi terputus saat proses sinkronisasi.';
        break;
      }
    }
  } finally {
    currentStatus.isSyncing = false;
    currentStatus.pendingCount = remainingQueue.length;
    if (remainingQueue.length === 0) {
      currentStatus.lastSyncTime = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_SYNC_KEY, String(currentStatus.lastSyncTime));
      }
    }
    notifyListeners();
  }

  return {
    success: remainingQueue.length === 0,
    processed: processedCount,
    remaining: remainingQueue.length,
  };
}

/**
 * Subscribe to status updates (isOnline, isSyncing, pendingCount)
 */
export function subscribeSyncStatus(callback: StatusListener): () => void {
  listeners.add(callback);
  callback({ ...currentStatus, pendingCount: getPendingMutationCount() });
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Get current sync status snapshot
 */
export function getSyncStatus(): SyncStatus {
  return { ...currentStatus, pendingCount: getPendingMutationCount() };
}

// Global browser listeners for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 [Network] Komputer terhubung kembali ke internet.');
    currentStatus.isOnline = true;
    currentStatus.lastError = null;
    notifyListeners();

    // Auto-process offline queue after a brief settling delay
    setTimeout(() => {
      processOfflineQueue();
    }, 1500);
  });

  window.addEventListener('offline', () => {
    console.log('🔌 [Network] Komputer kehilangan koneksi internet. Mode offline aktif.');
    currentStatus.isOnline = false;
    notifyListeners();
  });

  // Also check whenever tab/window gains focus
  window.addEventListener('focus', () => {
    const online = navigator.onLine;
    if (online !== currentStatus.isOnline) {
      currentStatus.isOnline = online;
      notifyListeners();
    }
    if (online && getPendingMutationCount() > 0 && !currentStatus.isSyncing) {
      processOfflineQueue();
    }
  });
}
