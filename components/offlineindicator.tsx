'use client';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface OfflineIndicatorProps {
  isOffline: boolean;
  pendingSyncCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

export default function OfflineIndicator({ 
  isOffline, 
  pendingSyncCount = 0, 
  onSync, 
  isSyncing = false 
}: OfflineIndicatorProps) {
  if (!isOffline) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <WifiOff className="w-5 h-5 text-yellow-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">
              Mode Offline Aktif
            </h4>
            <p className="text-sm text-yellow-700 mb-2">
              Sistem beroperasi tanpa koneksi internet. Data akan disinkronisasi saat koneksi pulih.
            </p>
            
            {pendingSyncCount > 0 && (
              <div className="flex items-center space-x-2 text-sm text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{pendingSyncCount} data menunggu sinkronisasi</span>
              </div>
            )}
          </div>
        </div>
        
        {pendingSyncCount > 0 && onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sync...' : 'Sync Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
}