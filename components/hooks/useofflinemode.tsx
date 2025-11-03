// hooks/useOfflineMode.ts
'use client';

import { useState, useEffect } from 'react';

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    // Cek status online/offline yang lebih reliable
    const checkOnlineStatus = async () => {
      try {
        // Coba fetch ke resource yang kecil dan cepat
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
        if (!offlineMode) {
          setShowOfflineDialog(true);
        }
      }
    };

    const handleOnline = () => {
      console.log('🌐 Koneksi internet kembali');
      setIsOnline(true);
      if (offlineMode) {
        setOfflineMode(false);
        // Sync data ketika online kembali
        syncOfflineData();
      }
    };

    const handleOffline = () => {
      console.log('📴 Koneksi internet terputus');
      setIsOnline(false);
      // LANGSUNG TAMPILKAN POPUP ketika internet mati
      if (!offlineMode) {
        setShowOfflineDialog(true);
      }
    };

    // Check status awal
    if (navigator.onLine) {
      checkOnlineStatus();
    } else {
      setIsOnline(false);
      setShowOfflineDialog(true);
    }

    // Event listeners untuk online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check setiap 30 detik untuk deteksi yang lebih baik
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkOnlineStatus();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [offlineMode]);

  const syncOfflineData = () => {
    // Logika untuk sync data offline ke server
    console.log('🔄 Menyinkronkan data offline...');
    // Di sini bisa tambahkan logika untuk sync ke API
  };

  const enableOfflineMode = () => {
    console.log('✅ Mode offline diaktifkan');
    setOfflineMode(true);
    setShowOfflineDialog(false);
    // Simpan status offline mode ke localStorage
    localStorage.setItem('offlineMode', 'true');
  };

  const cancelOfflineMode = () => {
    console.log('❌ Mode offline dibatalkan');
    setShowOfflineDialog(false);
    localStorage.setItem('offlineMode', 'false');
  };

  return {
    isOnline,
    offlineMode,
    showOfflineDialog,
    enableOfflineMode,
    cancelOfflineMode
  };
}