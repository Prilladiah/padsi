'use client';

import { useOfflineSync } from '@/hooks/useofflinesync';
import OfflineStorageManager from '@/app/lib/offlinestorage';
import { useState, useEffect, useCallback } from 'react';

export default function SyncStatus() {
  const { 
    isSyncing, 
    syncProgress, 
    syncError, 
    pendingCount, 
    hasPendingActions,
    syncAllPendingActions 
  } = useOfflineSync();

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    stokCount: 0,
    lastSync: null as string | null
  });

  // ✅ Load storage info - Manual implementation tanpa getStorageInfo()
  const loadStorageInfo = useCallback(() => {
    try {
      // Direct access ke localStorage
      const stokData = OfflineStorageManager.getStokData();
      const lastSyncStr = typeof window !== 'undefined' 
        ? localStorage.getItem('lastSyncTime') 
        : null;
      
      setStorageInfo({
        stokCount: stokData.length,
        lastSync: lastSyncStr
      });
    } catch (error) {
      console.error('❌ Error loading storage info:', error);
      setStorageInfo({
        stokCount: 0,
        lastSync: null
      });
    }
  }, []);

  // ✅ Load storage info saat status berubah
  useEffect(() => {
    loadStorageInfo();
  }, [loadStorageInfo, isSyncing, pendingCount]);

  // ✅ Handle manual sync
  const handleManualSync = async () => {
    if (isSyncing || isManualSyncing) {
      console.log('⏸️ Sync already in progress');
      return;
    }
    
    try {
      setIsManualSyncing(true);
      console.log('🔄 Manual sync started from SyncStatus component');
      
      const result = await syncAllPendingActions();
      
      if (result?.success) {
        console.log('✅ Manual sync completed:', result.synced, 'items');
        
        // Update last sync time
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastSyncTime', new Date().toISOString());
        }
      }
      
      // Update storage info setelah sync
      setTimeout(() => {
        loadStorageInfo();
      }, 500);
      
    } catch (error) {
      console.error('❌ Manual sync error:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // ✅ Hide component jika tidak ada yang perlu ditampilkan
  if (!hasPendingActions && !isSyncing && !isManualSyncing && !syncError) {
    return null;
  }

  const isCurrentlySyncing = isSyncing || isManualSyncing;

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isCurrentlySyncing ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="font-medium">
                {isCurrentlySyncing ? 'Menyinkronkan...' : 'Perlu Sinkronisasi'}
              </span>
            </div>
            {pendingCount > 0 && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                {pendingCount} item
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Progress Bar */}
          {isCurrentlySyncing && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-blue-600">{syncProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {syncError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{syncError}</span>
              </div>
            </div>
          )}

          {/* Sync Button */}
          {!isCurrentlySyncing && hasPendingActions && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Ada <span className="font-semibold">{pendingCount}</span> perubahan yang belum disinkronkan ke server.
              </div>
              <button
                onClick={handleManualSync}
                disabled={isCurrentlySyncing}
                className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isCurrentlySyncing
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCurrentlySyncing ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyinkronkan...
                  </div>
                ) : (
                  'Sinkronkan Sekarang'
                )}
              </button>
            </div>
          )}

          {/* Warning Message */}
          {isCurrentlySyncing && (
            <div className="text-xs text-gray-500 text-center mt-2">
              Harap tunggu, jangan tutup aplikasi...
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t">
          <div className="flex justify-between items-center">
            <span>Data lokal: {storageInfo.stokCount} items</span>
            {storageInfo.lastSync && (
              <span>
                Sync: {new Date(storageInfo.lastSync).toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
          {isManualSyncing && (
            <div className="mt-1 text-center text-blue-600 font-medium">
              Manual Sync Active
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
