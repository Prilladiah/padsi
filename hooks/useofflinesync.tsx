// hooks/useofflinesync.tsx - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import OfflineStorageManager from '@/app/lib/offlinestorage';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // ✅ Monitor pending actions
  useEffect(() => {
    const checkPending = () => {
      const pending = OfflineStorageManager.getPendingActions();
      setPendingCount(pending.length);
    };

    checkPending();
    const interval = setInterval(checkPending, 2000); // Check every 2s

    return () => clearInterval(interval);
  }, []);

  const hasPendingActions = pendingCount > 0;

  // ✅ Sync individual action
  const syncAction = async (action: any): Promise<boolean> => {
    try {
      console.log('🔄 Syncing action:', action.type, action.id);
      
      let response: Response;
      
      switch (action.type) {
        case 'CREATE':
          response = await fetch('/api/stok', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
          break;
          
        case 'UPDATE':
          response = await fetch(`/api/stok?id=${action.data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
          break;
          
        case 'DELETE':
          response = await fetch(`/api/stok?id=${action.data.id}`, {
            method: 'DELETE'
          });
          break;
          
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      console.log('✅ Action synced:', action.id);
      return true;
      
    } catch (error: any) {
      console.error('❌ Sync error for action:', action.id, error);
      return false;
    }
  };

  // ✅ Sync all pending actions
  const syncAllPendingActions = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) {
      console.log('⏸️ Already syncing, skipping...');
      return { success: false, synced: 0, failed: 0, errors: ['Already syncing'] };
    }

    // Check online status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const error = 'Tidak ada koneksi internet';
      console.log('🔴 Offline, cannot sync');
      setSyncError(error);
      return { success: false, synced: 0, failed: 0, errors: [error] };
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncError(null);

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      const pendingActions = OfflineStorageManager.getPendingActions();
      
      if (pendingActions.length === 0) {
        console.log('📭 No pending actions to sync');
        setIsSyncing(false);
        return result;
      }

      console.log(`🔄 Starting sync of ${pendingActions.length} actions...`);
      
      // Sync each action
      for (let i = 0; i < pendingActions.length; i++) {
        const action = pendingActions[i];
        
        try {
          const success = await syncAction(action);
          
          if (success) {
            // ✅ Remove from pending if successful
            OfflineStorageManager.removePendingAction(action.id);
            result.synced++;
            console.log(`✅ Synced ${i + 1}/${pendingActions.length}`);
          } else {
            result.failed++;
            result.errors.push(`Failed to sync action ${action.id}`);
          }
          
        } catch (error: any) {
          console.error(`❌ Error syncing action ${action.id}:`, error);
          result.failed++;
          result.errors.push(error.message || 'Unknown error');
        }
        
        // Update progress
        const progress = Math.round(((i + 1) / pendingActions.length) * 100);
        setSyncProgress(progress);
        
        // Small delay between requests to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // ✅ Update pending count
      const remainingPending = OfflineStorageManager.getPendingActions();
      setPendingCount(remainingPending.length);

      if (result.failed > 0) {
        result.success = false;
        const errorMsg = `Sync selesai: ${result.synced} berhasil, ${result.failed} gagal`;
        setSyncError(errorMsg);
        console.log('⚠️ ' + errorMsg);
      } else {
        console.log(`✅ All ${result.synced} actions synced successfully`);
        setSyncError(null);
      }

      return result;
      
    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      const errorMsg = error.message || 'Sync gagal';
      setSyncError(errorMsg);
      result.success = false;
      result.errors.push(errorMsg);
      return result;
      
    } finally {
      setIsSyncing(false);
      setSyncProgress(100);
      
      // Reset progress after 2s
      setTimeout(() => {
        setSyncProgress(0);
      }, 2000);
    }
  }, [isSyncing]);

  return {
    isSyncing,
    syncProgress,
    syncError,
    pendingCount,
    hasPendingActions,
    syncAllPendingActions
  };
}

export default useOfflineSync;