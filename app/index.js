import { useState, useEffect } from 'react';
import Head from 'next/head';
import StatusIndicator from '../components/StatusIndicator';
import StatsCards from '../components/StatsCards';
import ItemTable from '../components/ItemTable';
import SyncNotification from '../components/SyncNotification';
import OfflineModal from '../components/OfflineModal';

export default function StockManagement() {
  const [onlineItems, setOnlineItems] = useState([]);
  const [offlineItems, setOfflineItems] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineModeEnabled, setOfflineModeEnabled] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineModal(false);
      if (getOfflineItems().length > 0) {
        setTimeout(() => syncOfflineData(), 1000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Tampilkan modal offline hanya jika belum mengaktifkan mode offline
      if (!offlineModeEnabled) {
        setShowOfflineModal(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);
    setLastSync(localStorage.getItem('lastSync'));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineModeEnabled]);

  // Load data
  useEffect(() => {
    loadOnlineItems();
    loadOfflineItems();
  }, []);

  const loadOnlineItems = async () => {
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      setOnlineItems(data);
    } catch (error) {
      console.error('Error loading online items:', error);
    }
  };

  const loadOfflineItems = () => {
    const stored = getOfflineItems();
    setOfflineItems(stored);
  };

  const getOfflineItems = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('offlineItems');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  const saveOfflineItems = (items) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offlineItems', JSON.stringify(items));
      setOfflineItems(items);
    }
  };

  const enableOfflineMode = () => {
    setOfflineModeEnabled(true);
    setShowOfflineModal(false);
  };

  const disableOfflineMode = () => {
    setOfflineModeEnabled(false);
    setShowOfflineModal(false);
  };

  // Gabungkan data online dan offline untuk ditampilkan
  const getMergedItems = () => {
    const merged = [...onlineItems];
    
    offlineItems.forEach(offlineItem => {
      if (offlineItem.action === 'delete') {
        const index = merged.findIndex(item => item.id === offlineItem.originalId);
        if (index !== -1) merged.splice(index, 1);
      } else if (offlineItem.action === 'update') {
        const index = merged.findIndex(item => item.id === offlineItem.originalId);
        if (index !== -1) {
          merged[index] = { ...merged[index], ...offlineItem.data };
        }
      } else if (offlineItem.action === 'create') {
        const exists = merged.some(item => 
          item.tempId === offlineItem.tempId || 
          (item.id === offlineItem.originalId && offlineItem.originalId)
        );
        
        if (!exists) {
          merged.push({
            ...offlineItem,
            id: offlineItem.tempId,
            isOffline: true,
            displayId: offlineItem.tempId
          });
        }
      }
    });

    return merged;
  };

  const addItem = async (newItem) => {
    const itemToAdd = {
      ...newItem,
      tempId: Date.now(),
      lastModified: new Date().toISOString()
    };

    if (isOnline && !offlineModeEnabled) {
      try {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newItem.name,
            supplier: newItem.supplier,
            quantity: parseInt(newItem.quantity),
            unit: newItem.unit,
            price: parseInt(newItem.price),
            date: newItem.date
          }),
        });
        
        if (response.ok) {
          const savedItem = await response.json();
          setOnlineItems(prev => [...prev, savedItem]);
          return true;
        } else {
          throw new Error('Failed to save item');
        }
      } catch (error) {
        console.error('Error adding item online, saving offline:', error);
        saveItemOffline({ ...itemToAdd, action: 'create' });
        return true;
      }
    } else {
      saveItemOffline({ ...itemToAdd, action: 'create' });
      return true;
    }
  };

  const saveItemOffline = (item) => {
    const currentOfflineItems = getOfflineItems();
    const updatedOfflineItems = [...currentOfflineItems, item];
    saveOfflineItems(updatedOfflineItems);
  };

  const syncOfflineData = async () => {
    const offlineItemsToSync = getOfflineItems();
    if (offlineItemsToSync.length === 0 || !isOnline) return;

    setIsSyncing(true);
    
    try {
      const syncResults = { success: 0, failed: 0 };

      for (const item of offlineItemsToSync) {
        try {
          if (item.action === 'create') {
            await fetch('/api/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: item.name,
                supplier: item.supplier,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price,
                date: item.date
              }),
            });
          } else if (item.action === 'update') {
            await fetch(`/api/items?id=${item.originalId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });
          } else if (item.action === 'delete') {
            await fetch(`/api/items?id=${item.originalId}`, {
              method: 'DELETE',
            });
          }
          
          syncResults.success++;
        } catch (error) {
          console.error('Error syncing item:', item, error);
          syncResults.failed++;
        }
      }

      if (syncResults.failed === 0) {
        saveOfflineItems([]);
        localStorage.setItem('lastSync', new Date().toISOString());
        setLastSync(new Date().toISOString());
        setOfflineModeEnabled(false);
      } else {
        const failedItems = offlineItemsToSync.slice(-syncResults.failed);
        saveOfflineItems(failedItems);
      }

      await loadOnlineItems();
      
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteItem = async (id, isOffline = false) => {
    if (isOffline) {
      const currentOfflineItems = getOfflineItems();
      const updatedOfflineItems = currentOfflineItems.filter(item => 
        item.tempId !== id && item.originalId !== id
      );
      saveOfflineItems(updatedOfflineItems);
      return;
    }

    if (isOnline && !offlineModeEnabled) {
      try {
        await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
        setOnlineItems(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting item online, saving offline:', error);
        saveItemOffline({
          action: 'delete',
          originalId: id,
          tempId: Date.now(),
          lastModified: new Date().toISOString()
        });
      }
    } else {
      saveItemOffline({
        action: 'delete',
        originalId: id,
        tempId: Date.now(),
        lastModified: new Date().toISOString()
      });
    }
  };

  const updateItem = async (id, updatedData) => {
    if (isOnline && !offlineModeEnabled) {
      try {
        await fetch(`/api/items?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
        setOnlineItems(prev => prev.map(item => 
          item.id === id ? { ...item, ...updatedData } : item
        ));
      } catch (error) {
        console.error('Error updating item online, saving offline:', error);
        saveItemOffline({
          action: 'update',
          originalId: id,
          data: updatedData,
          tempId: Date.now(),
          lastModified: new Date().toISOString()
        });
      }
    } else {
      saveItemOffline({
        action: 'update',
        originalId: id,
        data: updatedData,
        tempId: Date.now(),
        lastModified: new Date().toISOString()
      });
    }
  };

  const mergedItems = getMergedItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Kelola Stok - Sistem Offline/Online</title>
        <meta name="description" content="Sistem manajemen stok dengan sinkronisasi offline" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Kelola Stok</h1>
          <StatusIndicator 
            isOnline={isOnline} 
            itemCount={mergedItems.length}
            offlineCount={offlineItems.length}
            lastSync={lastSync}
            offlineModeEnabled={offlineModeEnabled}
          />
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari barang, supplier, atau satuan..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <StatsCards items={mergedItems} />

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
          <ItemTable 
            items={mergedItems}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
            onUpdateItem={updateItem}
            isOnline={isOnline}
            offlineModeEnabled={offlineModeEnabled}
          />
        </div>

        <SyncNotification 
          isVisible={offlineItems.length > 0 && isOnline && !isSyncing}
          isSyncing={isSyncing}
          itemCount={offlineItems.length}
          onSync={syncOfflineData}
        />

        {/* Offline Modal - hanya muncul ketika tidak ada internet */}
        <OfflineModal 
          isOpen={showOfflineModal}
          onEnableOffline={enableOfflineMode}
          onCancel={disableOfflineMode}
        />

        <footer className="mt-6 text-center text-gray-600">
          Total: {mergedItems.length} items
          {offlineItems.length > 0 && (
            <span className="ml-2 text-orange-600">
              ({offlineItems.length} menunggu sinkronisasi)
            </span>
          )}
        </footer>
      </div>
    </div>
  );
}