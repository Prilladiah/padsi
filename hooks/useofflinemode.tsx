// hooks/useofflinemode.tsx - FULLY FIXED VERSION
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StokItem } from '@/types';
import OfflineStorageManager from '@/app/lib/offlinestorage';

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [localData, setLocalData] = useState<StokItem[]>([]);

  // ✅ Check online status
  useEffect(() => {
    let mounted = true;

    const handleOnline = () => {
      if (mounted) {
        console.log('🌐 App is online');
        setIsOnline(true);
      }
    };
    
    const handleOffline = () => {
      if (mounted) {
        console.log('🔴 App is offline');
        setIsOnline(false);
      }
    };

    // Set initial status
    const initialStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (mounted) {
      setIsOnline(initialStatus);
      console.log(`📡 Initial online status: ${initialStatus ? 'Online' : 'Offline'}`);
    }

    // Add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // ✅ Load local data
  useEffect(() => {
    let mounted = true;

    const loadLocalData = () => {
      try {
        const data = OfflineStorageManager.getStokData();
        if (mounted) {
          setLocalData(data);
          console.log('📦 Loaded local data:', data.length, 'items');
        }
      } catch (error) {
        console.error('❌ Error loading local data:', error);
        if (mounted) {
          setLocalData([]);
        }
      }
    };

    loadLocalData();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Enable offline mode
  const enableOfflineMode = useCallback(() => {
    console.log('🔄 Enabling offline mode');
    setOfflineMode(true);
    
    try {
      const data = OfflineStorageManager.getStokData();
      setLocalData(data);
      console.log('✅ Offline mode enabled with', data.length, 'items');
    } catch (error) {
      console.error('❌ Error enabling offline mode:', error);
      setLocalData([]);
    }
  }, []);

  // ✅ Save offline data
  const saveOfflineData = useCallback(async (data: StokItem[]) => {
    try {
      OfflineStorageManager.saveStokData(data);
      setLocalData(data);
      console.log('💾 Saved data to offline storage:', data.length, 'items');
    } catch (error) {
      console.error('❌ Error saving offline data:', error);
      throw error;
    }
  }, []);

  // ✅ Add item offline - FIXED: Full manual implementation
  const addItemOffline = useCallback((data: Omit<StokItem, 'id'>) => {
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const newItem: StokItem = {
        ...data,
        id: `offline_${timestamp}_${random}`
      };
      
      console.log('➕ Adding item offline:', newItem.id);
      
      // Get current data
      const currentData = OfflineStorageManager.getStokData();
      
      // Add new item
      const updatedData = [...currentData, newItem];
      
      // Save back to storage
      OfflineStorageManager.saveStokData(updatedData);
      setLocalData(updatedData);
      console.log('✅ Item added offline, total:', updatedData.length);
      
      return updatedData;
    } catch (error) {
      console.error('❌ Error adding item offline:', error);
      throw error;
    }
  }, []);

  // ✅ Update item offline - Manual implementation
  const updateItemOffline = useCallback((id: string, data: Omit<StokItem, 'id'>) => {
    try {
      console.log('✏️ Updating item offline:', id);
      
      // Get current data from storage
      const currentData = OfflineStorageManager.getStokData();
      
      // Find and update the item
      const updatedData = currentData.map(item => 
        item.id === id ? { ...data, id } as StokItem : item
      );
      
      // Save back to storage
      OfflineStorageManager.saveStokData(updatedData);
      setLocalData(updatedData);
      console.log('✅ Item updated offline');
      
      return updatedData;
    } catch (error) {
      console.error('❌ Error updating item offline:', error);
      throw error;
    }
  }, []);

  // ✅ Delete item offline - Manual implementation
  const deleteItemOffline = useCallback((id: string) => {
    try {
      console.log('🗑️ Deleting item offline:', id);
      
      // Get current data from storage
      const currentData = OfflineStorageManager.getStokData();
      
      // Filter out the deleted item
      const updatedData = currentData.filter(item => item.id !== id);
      
      // Save back to storage
      OfflineStorageManager.saveStokData(updatedData);
      setLocalData(updatedData);
      console.log('✅ Item deleted offline, remaining:', updatedData.length);
      
      return updatedData;
    } catch (error) {
      console.error('❌ Error deleting item offline:', error);
      throw error;
    }
  }, []);

  return {
    isOnline,
    offlineMode,
    localData,
    enableOfflineMode,
    saveOfflineData,
    addItemOffline,
    updateItemOffline,
    deleteItemOffline,
    setOfflineMode
  };
}

export default useOfflineMode;