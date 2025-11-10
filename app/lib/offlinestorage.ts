// app/lib/offlinestorage.ts - CLEAN VERSION
'use client';

import { StokItem } from '@/types';

interface PendingAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  data?: Omit<StokItem, 'id'>;
  itemId?: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  STOK_DATA: 'offline_stok_data',
  PENDING_ACTIONS: 'offline_pending_actions',
  LAST_SYNC: 'offline_last_sync'
} as const;

// ✅ Get stok data from localStorage
export function getStokData(): StokItem[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const dataString = localStorage.getItem(STORAGE_KEYS.STOK_DATA);
    if (!dataString) return [];
    
    const parsedData = JSON.parse(dataString);
    console.log('📦 Retrieved offline data:', parsedData.length, 'items');
    return parsedData;
  } catch (error) {
    console.error('❌ Error getting stok data:', error);
    return [];
  }
}

// ✅ Save stok data to localStorage
export function saveStokData(items: StokItem[]): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEYS.STOK_DATA, JSON.stringify(items));
    console.log('💾 Saved offline data:', items.length, 'items');
  } catch (error) {
    console.error('❌ Error saving stok data:', error);
  }
}

// ✅ Get pending actions
export function getPendingActions(): PendingAction[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const actionsString = localStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
    if (!actionsString) return [];
    
    const parsedActions = JSON.parse(actionsString);
    console.log('📋 Retrieved pending actions:', parsedActions.length);
    return parsedActions;
  } catch (error) {
    console.error('❌ Error getting pending actions:', error);
    return [];
  }
}

// ✅ Save pending actions
export function savePendingActions(actionsList: PendingAction[]): void {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(actionsList));
    console.log('💾 Saved pending actions:', actionsList.length);
  } catch (error) {
    console.error('❌ Error saving pending actions:', error);
  }
}

// ✅ Add pending action
export function addPendingAction(actionData: Omit<PendingAction, 'id' | 'timestamp'>): void {
  try {
    const currentActions = getPendingActions();
    const newAction: PendingAction = {
      ...actionData,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    currentActions.push(newAction);
    savePendingActions(currentActions);
    
    console.log('➕ Added pending action:', newAction.type, newAction.id);
  } catch (error) {
    console.error('❌ Error adding pending action:', error);
  }
}

// ✅ Remove pending action by id
export function removePendingAction(actionId: string): void {
  try {
    const currentActions = getPendingActions();
    const filteredActions = currentActions.filter(a => a.id !== actionId);
    
    savePendingActions(filteredActions);
    console.log('🗑️ Removed pending action:', actionId);
  } catch (error) {
    console.error('❌ Error removing pending action:', error);
  }
}

// ✅ Add item (CREATE)
export function addItemOffline(itemData: Omit<StokItem, 'id'>): StokItem {
  try {
    const currentStokData = getStokData();
    
    // Generate temporary ID
    const newId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem: StokItem = {
      ...itemData,
      id: newId
    };
    
    // Add to local data
    currentStokData.unshift(newItem);
    saveStokData(currentStokData);
    
    // Add to pending actions
    addPendingAction({
      type: 'CREATE',
      data: itemData
    });
    
    console.log('✅ Item added offline:', newItem.nama);
    return newItem;
  } catch (error) {
    console.error('❌ Error adding item:', error);
    throw error;
  }
}

// ✅ Update item
export function updateItemOffline(itemId: string, itemData: Omit<StokItem, 'id'>): void {
  try {
    const currentStokData = getStokData();
    const itemIndex = currentStokData.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }
    
    // Update local data
    currentStokData[itemIndex] = { ...itemData, id: itemId };
    saveStokData(currentStokData);
    
    // Add to pending actions (hanya jika bukan temporary ID)
    if (!itemId.startsWith('temp_')) {
      addPendingAction({
        type: 'UPDATE',
        itemId: itemId,
        data: itemData
      });
    }
    
    console.log('✅ Item updated offline:', itemId);
  } catch (error) {
    console.error('❌ Error updating item:', error);
    throw error;
  }
}

// ✅ Delete item
export function deleteItemOffline(itemId: string): void {
  try {
    const currentStokData = getStokData();
    const filteredStokData = currentStokData.filter(item => item.id !== itemId);
    
    saveStokData(filteredStokData);
    
    // Add to pending actions (hanya jika bukan temporary ID)
    if (!itemId.startsWith('temp_')) {
      addPendingAction({
        type: 'DELETE',
        itemId: itemId
      });
    }
    
    console.log('✅ Item deleted offline:', itemId);
  } catch (error) {
    console.error('❌ Error deleting item:', error);
    throw error;
  }
}

// ✅ Default export sebagai object
const OfflineStorageManager = {
  getStokData,
  saveStokData,
  getPendingActions,
  savePendingActions,
  addPendingAction,
  removePendingAction,
  addItem: addItemOffline,
  updateItem: updateItemOffline,
  deleteItem: deleteItemOffline
};

export { OfflineStorageManager };
export default OfflineStorageManager;