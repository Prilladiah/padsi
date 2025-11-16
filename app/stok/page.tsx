// app/stok/page.tsx - FIGMA DESIGN COMPLETE
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/layout/header';

type StokItem = {
  id_stok?: number;
  nama_stok: string;
  satuan_stok: string;
  supplier_stok: string;
  tanggal_stok: string;
  jumlah_stok: number;
  Harga_stok: number;
  _offlineId?: string;
  _pending?: boolean;
};

type PendingAction = {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: any;
  createdAt: string;
  attempts?: number;
  lastError?: string | null;
};

type Notif = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  date?: string;
  time?: string;
  action?: string;
};

type ConfirmDialog = {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const CACHE_KEY = 'stok_cache_v2';
const PENDING_KEY = 'stok_pending_v2';
const LOCAL_ONLY_KEY = 'stok_localonly_v2';

function uid(prefix = 'u_') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeout = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(input, { signal: controller.signal, ...init });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      const e: any = new Error('Request aborted (timeout/network)');
      e.name = 'AbortError';
      throw e;
    }
    throw err;
  }
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('writeJSON failed', key, err);
  }
}

function toApiPayload(item: Partial<StokItem> | any) {
  return {
    nama_stok: String(item.nama_stok ?? item.nama ?? ''),
    satuan_stok: String(item.satuan_stok ?? item.satuan ?? 'pcs'),
    supplier_stok: String(item.supplier_stok ?? item.supplier ?? 'Tidak ada supplier'),
    tanggal_stok: String(item.tanggal_stok ?? item.tanggal ?? new Date().toISOString().split('T')[0]),
    jumlah_stok: Number(item.jumlah_stok ?? item.jumlah ?? 0),
    Harga_stok: Number(item.Harga_stok ?? item.Harga ?? 0),
  };
}

export default function StokPage() {
  const [stok, setStok] = useState<StokItem[]>([]);
  const [filtered, setFiltered] = useState<StokItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [search, setSearch] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('Semua');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(100);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [localOnlyCount, setLocalOnlyCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  const [selectedStok, setSelectedStok] = useState<StokItem | null>(null);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<StokItem | null>(null);
  const [formData, setFormData] = useState<Partial<StokItem>>({
    nama_stok: '',
    satuan_stok: 'pcs',
    supplier_stok: '',
    tanggal_stok: new Date().toISOString().split('T')[0],
    jumlah_stok: 0,
    Harga_stok: 0,
  });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [offlineDialog, setOfflineDialog] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  const isMounted = useRef(true);
  const isProcessingPendingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const hasShownOfflineNotification = useRef(false);

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const showNotification = useCallback((type: Notif['type'], title: string, message: string, action?: string) => {
    const { date, time } = getCurrentDateTime();
    const newNotif: Notif = { 
      id: uid('notif_'), 
      type, 
      title,
      message,
      date,
      time,
      action
    };
    setNotifications(prev => [...prev, newNotif]);
    
    // Untuk notifikasi mode offline, tampilkan lebih lama
    const timeoutDuration = type === 'warning' && message.includes('mode offline') ? 10000 : 4000;
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, timeoutDuration);
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, show: false }));
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
      },
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      nama_stok: '',
      satuan_stok: 'pcs',
      supplier_stok: '',
      tanggal_stok: new Date().toISOString().split('T')[0],
      jumlah_stok: 0,
      Harga_stok: 0
    });
    setEditing(null);
    setShowForm(false);
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.nama_stok || String(formData.nama_stok).trim() === '') {
      showNotification('error', 'Data tidak boleh kosong!', 'Silahkan input data stok kembali');
      return false;
    }
    
    if (!formData.jumlah_stok || formData.jumlah_stok <= 0) {
      showNotification('error', 'Data tidak boleh kosong!', 'Jumlah stok harus lebih dari 0!');
      return false;
    }
    
    if (!formData.satuan_stok || String(formData.satuan_stok).trim() === '') {
      showNotification('error', 'Data tidak boleh kosong!', 'Satuan stok harus dipilih!');
      return false;
    }
    
    if (formData.Harga_stok === undefined || formData.Harga_stok < 0) {
      showNotification('error', 'Data tidak boleh kosong!', 'Harga tidak boleh negatif!');
      return false;
    }
    
    if (!formData.tanggal_stok) {
      showNotification('error', 'Data tidak boleh kosong!', 'Tanggal harus diisi!');
      return false;
    }
    
    return true;
  }, [formData, showNotification]);

  const addStokOffline = useCallback((data: Partial<StokItem>) => {
    const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
    const localEntry: StokItem = { 
      ...toApiPayload(data), 
      _offlineId: uid('local_'),
      _pending: true 
    };
    
    localOnly.unshift(localEntry);
    writeJSON(LOCAL_ONLY_KEY, localOnly);
    
    setStok(prev => [localEntry, ...prev]);
    setLocalOnlyCount(localOnly.length);
    
    resetForm();
    
    // Tampilkan notifikasi dengan opsi aktifkan mode offline
    showNotification('warning', 'Internet tidak tersedia!', 'Aktifkan mode offline untuk sinkronisasi otomatis?');
  }, [showNotification, resetForm]);

  const fetchStokData = useCallback(async (opts?: { page?: number; limit?: number; search?: string; silent?: boolean }) => {
    if (isFetching) return;
    setIsFetching(true);
    setIsLoading(true);

    const usePage = opts?.page ?? page;
    const useLimit = opts?.limit ?? limit;
    const useSearch = opts?.search ?? search;
    const silent = opts?.silent ?? false;

    try {
      const params = new URLSearchParams();
      params.set('page', String(usePage));
      params.set('limit', String(useLimit));
      if (useSearch) params.set('search', useSearch);

      const url = `/api/stok?${params.toString()}`;
      const res = await fetchWithTimeout(url, { headers: { 'Cache-Control': 'no-cache' } }, 12000);

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (!json || !json.success || !Array.isArray(json.data)) {
        throw new Error(json?.error || 'Invalid response from server');
      }

      const rows: StokItem[] = json.data.map((r: any) => ({
        id_stok: r.id_stok,
        nama_stok: r.nama_stok ?? '',
        satuan_stok: r.satuan_stok ?? 'pcs',
        supplier_stok: r.supplier_stok ?? 'Tidak ada supplier',
        tanggal_stok: r.tanggal_stok ?? new Date().toISOString().split('T')[0],
        jumlah_stok: Number(r.jumlah_stok ?? 0),
        Harga_stok: Number(r.Harga_stok ?? 0),
      }));

      const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
      const merged = [...rows, ...localOnly.map(it => ({ ...it, _offlineId: it._offlineId ?? uid('l_'), _pending: true }))];

      setStok(merged);
      writeJSON(CACHE_KEY, rows);
      setPendingCount(readJSON<PendingAction[]>(PENDING_KEY, []).length);
      setLocalOnlyCount(localOnly.length);

      if (!isInitialLoadRef.current && !silent && rows.length > 0) {
        showNotification('success', 'Data Diperbarui', 'Data stok berhasil diperbarui');
      }
    } catch (err: any) {
      const cached = readJSON<StokItem[]>(CACHE_KEY, []);
      const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
      const merged = [...cached, ...localOnly.map(it => ({ ...it, _offlineId: it._offlineId ?? uid('l_'), _pending: true }))];

      if (merged.length > 0) {
        setStok(merged);
        if (!isInitialLoadRef.current && !isOnline) {
          showNotification('warning', 'Mode Offline', 'Menggunakan data cache');
        }
      } else {
        setStok([]);
        if (!silent) {
          showNotification('error', 'Gagal Memuat', 'Tidak dapat memuat data stok');
        }
      }
      setPendingCount(readJSON<PendingAction[]>(PENDING_KEY, []).length);
      setLocalOnlyCount(localOnly.length);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    }
  }, [isFetching, page, limit, search, showNotification, isOnline]);

  function enqueueAction(action: PendingAction) {
    const list = readJSON<PendingAction[]>(PENDING_KEY, []);
    list.push(action);
    writeJSON(PENDING_KEY, list);
    setPendingCount(list.length);
  }

  function removePending(id: string) {
    const list = readJSON<PendingAction[]>(PENDING_KEY, []);
    const updated = list.filter((a) => a.id !== id);
    writeJSON(PENDING_KEY, updated);
    setPendingCount(updated.length);
  }

  async function processPendingQueue(silent = false) {
    const queue = readJSON<PendingAction[]>(PENDING_KEY, []);
    if (!queue || queue.length === 0 || !isOnline) {
      setPendingCount(0);
      return;
    }
    if (isProcessingPendingRef.current) return;

    isProcessingPendingRef.current = true;
    setIsSyncing(true);
    setSyncProgress(0);

    const total = queue.length;
    let succeeded = 0;

    for (let i = 0; i < queue.length; i++) {
      const action = queue[i];
      if (!isMounted.current) break;

      try {
        const body = action.body ? JSON.stringify(action.body) : undefined;
        const res = await fetchWithTimeout(action.url, {
          method: action.method,
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body,
        }, 15000);

        const text = await res.text().catch(() => '');
        let parsed: any = {};
        try { parsed = text ? JSON.parse(text) : {}; } catch (_) { parsed = { raw: text }; }

        if (!res.ok) {
          const q = readJSON<PendingAction[]>(PENDING_KEY, []);
          const updated = q.map(a => a.id === action.id ? { ...a, attempts: (a.attempts ?? 0) + 1, lastError: parsed?.error ?? parsed?.raw ?? res.statusText } : a);
          writeJSON(PENDING_KEY, updated);
          setPendingCount(updated.length);

          if (res.status >= 400 && res.status < 500 && !silent) {
            showNotification('error', 'Sinkronisasi Gagal', parsed?.error ?? res.statusText);
          }
          break;
        }

        removePending(action.id);
        succeeded++;
        setSyncProgress(Math.round((succeeded / total) * 100));
      } catch (err: any) {
        if (!silent) {
          showNotification('warning', 'Koneksi Terputus', 'Sinkronisasi ditunda');
        }
        break;
      }
    }

    try {
      await fetchStokData({ silent: true });
    } catch (e) {
      console.warn('fetch after pending failed', e);
    }

    if (succeeded > 0 && !silent) {
      showNotification('success', 'Sinkronisasi Berhasil', `${succeeded} item berhasil disinkronisasi`);
    }

    isProcessingPendingRef.current = false;
    setIsSyncing(false);
    setSyncProgress(0);
    setPendingCount(readJSON<PendingAction[]>(PENDING_KEY, []).length);
  }

  const handleAdd = useCallback(async (data: Partial<StokItem>) => {
    if (!data.nama_stok || String(data.nama_stok).trim() === '') {
      showNotification('error', 'Data tidak boleh kosong!', 'Silahkan input data stok kembali');
      return;
    }

    const payload = toApiPayload(data);

    if (!isOnline || offlineMode) {
      addStokOffline(data);
      return;
    }

    resetForm();
    
    try {
      const res = await fetchWithTimeout('/api/stok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 15000);

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        if (res.status >= 400 && res.status < 500) {
          const parsed = text ? JSON.parse(text) : {};
          showNotification('error', 'Gagal!', parsed?.error ?? `Gagal menyimpan: ${res.status}`);
          return;
        }
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (json.success) {
        showNotification('success', 'Berhasil!', 'Data stok berhasil ditambahkan');
        await fetchStokData({ silent: true });
      } else {
        showNotification('error', 'Gagal!', json.error || 'Data stok gagal ditambahkan');
      }
    } catch (err: any) {
      addStokOffline(data);
    }
  }, [fetchStokData, showNotification, resetForm, isOnline, offlineMode, addStokOffline]);

  const handleEditSubmit = useCallback(async (id: number | string | undefined, data: Partial<StokItem>) => {
    if (!id) {
      showNotification('error', 'Ubah Stok Gagal', 'ID stok tidak ditemukan');
      return;
    }
    const payload = toApiPayload(data);
    const url = `/api/stok?id=${encodeURIComponent(String(id))}`;

    if (!isOnline || offlineMode) {
      const cache = readJSON<StokItem[]>(CACHE_KEY, []);
      const idx = cache.findIndex(c => String(c.id_stok) === String(id));
      if (idx !== -1) {
        cache[idx] = { ...cache[idx], ...payload };
        writeJSON(CACHE_KEY, cache);
      }
      setStok(prev => prev.map(p => (String(p.id_stok) === String(id) ? { ...p, ...payload, _pending: true } : p)));
      
      const action: PendingAction = {
        id: uid('p_'),
        method: 'PUT',
        url,
        body: payload,
        createdAt: new Date().toISOString(),
        attempts: 0,
      };
      enqueueAction(action);
      showNotification('warning', 'Ubah Stok', 'Perubahan disimpan secara lokal');
      resetForm();
      return;
    }

    try {
      const res = await fetchWithTimeout(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 15000);

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        if (res.status >= 400 && res.status < 500) {
          const parsed = text ? JSON.parse(text) : {};
          showNotification('error', 'Ubah Stok Gagal', parsed?.error ?? `Gagal update: ${res.status}`);
          return;
        }
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (json.success) {
        showNotification('success', 'Berhasil!', 'Data stok berhasil diubah');
        resetForm();
        await fetchStokData({ silent: true });
      } else {
        showNotification('error', 'Gagal!', json.error || 'Data stok gagal diubah');
      }
    } catch (err: any) {
      const action: PendingAction = {
        id: uid('p_'),
        method: 'PUT',
        url,
        body: payload,
        createdAt: new Date().toISOString(),
        attempts: 0,
      };
      enqueueAction(action);
      setStok(prev => prev.map(p => (String(p.id_stok) === String(id) ? { ...p, ...payload, _pending: true } : p)));
      showNotification('warning', 'Ubah Stok', 'Perubahan disimpan secara lokal');
      resetForm();
    }
  }, [fetchStokData, showNotification, resetForm, isOnline, offlineMode]);

  const handleDelete = useCallback(async (id?: number, offlineLocalId?: string) => {
    if (!id && !offlineLocalId) {
      showNotification('error', 'Hapus Gagal', 'ID tidak tersedia');
      return;
    }

    const executeDelete = async () => {
      if (!id && offlineLocalId) {
        const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
        const updated = localOnly.filter(lo => lo._offlineId !== offlineLocalId);
        writeJSON(LOCAL_ONLY_KEY, updated);
        setStok(prev => prev.filter(p => p._offlineId !== offlineLocalId));
        setLocalOnlyCount(updated.length);
        showNotification('success', 'Berhasil!', 'Data stok berhasil dihapus');
        return;
      }

      const url = `/api/stok?id=${id}`;
      if (!isOnline || offlineMode) {
        setStok(prev => prev.filter(p => String(p.id_stok) !== String(id)));
        const action: PendingAction = {
          id: uid('p_'),
          method: 'DELETE',
          url,
          createdAt: new Date().toISOString(),
          attempts: 0,
        };
        enqueueAction(action);
        showNotification('warning', 'Hapus Stok', 'Penghapusan disimpan secara lokal');
        return;
      }

      try {
        const res = await fetchWithTimeout(url, { method: 'DELETE' }, 15000);
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          if (res.status >= 400 && res.status < 500) {
            const parsed = text ? JSON.parse(text) : {};
            showNotification('error', 'Hapus Gagal', parsed?.error ?? `Gagal menghapus: ${res.status}`);
            return;
          }
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        const json = await res.json();
        if (json.success) {
          showNotification('success', 'Berhasil!', 'Data berhasil dihapus');
          await fetchStokData({ silent: true });
        } else {
          showNotification('error', 'Gagal!', json.error || 'Data berhasil dihapus');
        }
      } catch (err: any) {
        const action: PendingAction = {
          id: uid('p_'),
          method: 'DELETE',
          url,
          createdAt: new Date().toISOString(),
          attempts: 0,
        };
        enqueueAction(action);
        setStok(prev => prev.filter(p => String(p.id_stok) !== String(id)));
        showNotification('warning', 'Hapus Stok', 'Penghapusan disimpan secara lokal');
      }
    };

    showConfirm(
      'Konfirmasi Hapus',
      'Anda yakin ingin menghapus data?',
      executeDelete
    );
  }, [fetchStokData, showNotification, showConfirm, isOnline, offlineMode]);

  async function syncLocalOnlyToServer(silent = false) {
    if (!isOnline || offlineMode) return;
    const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
    if (localOnly.length === 0) return;

    setIsSyncing(true);
    let succeeded = 0;
    const failedItems: StokItem[] = [];
    
    for (let i = 0; i < localOnly.length; i++) {
      const item = localOnly[i];
      try {
        const res = await fetchWithTimeout('/api/stok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toApiPayload(item)),
        }, 15000);

        if (!res.ok) {
          failedItems.push(item);
          break;
        }
        const json = await res.json();
        if (json.success) {
          succeeded++;
        } else {
          failedItems.push(item);
        }
      } catch (err) {
        failedItems.push(item);
        break;
      }
    }

    if (failedItems.length > 0) {
      writeJSON(LOCAL_ONLY_KEY, failedItems);
      setLocalOnlyCount(failedItems.length);
    } else {
      localStorage.removeItem(LOCAL_ONLY_KEY);
      setLocalOnlyCount(0);
    }

    if (succeeded > 0) {
      await fetchStokData({ silent: true });
      if (!silent) {
        showNotification('success', 'Sinkronisasi Berhasil', `${succeeded} item berhasil disinkronisasi`);
      }
    }
    setIsSyncing(false);
  }

  // Handle online/offline status
  useEffect(() => {
    isMounted.current = true;

    // Set initial online status
    setIsOnline(navigator.onLine);
    setPendingCount(readJSON<PendingAction[]>(PENDING_KEY, []).length);
    setLocalOnlyCount(readJSON<StokItem[]>(LOCAL_ONLY_KEY, []).length);

    const handleOnline = () => {
      setIsOnline(true);
      setOfflineDialog(false);
      hasShownOfflineNotification.current = false;
      
      if (!offlineMode) {
        showNotification('info', 'Koneksi Online', 'Sistem terhubung kembali ke jaringan');
        // Auto sync when coming back online
        setTimeout(() => {
          processPendingQueue(true)
            .then(() => syncLocalOnlyToServer(true))
            .catch(e => console.warn('auto sync error', e));
        }, 1000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      
      // Always show notification when going offline
      if (!hasShownOfflineNotification.current) {
        showNotification('warning', 'Koneksi Terputus', 'Internet tidak tersedia! Sistem akan bekerja secara offline');
        hasShownOfflineNotification.current = true;
      }
      
      // Show offline dialog only if not already in offline mode
      if (!offlineMode) {
        setOfflineDialog(true);
      }
    };

    // Show initial offline notification if starting offline
    if (!navigator.onLine && !offlineMode) {
      setTimeout(() => {
        setOfflineDialog(true);
        showNotification('warning', 'Tidak Ada Koneksi', 'Internet tidak tersedia saat ini');
      }, 1000);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchStokData().catch(e => console.warn('initial fetch failed', e));

    // Auto sync if online and there's pending data
    if (navigator.onLine && (pendingCount > 0 || localOnlyCount > 0) && !offlineMode) {
      setTimeout(() => {
        processPendingQueue(true)
          .then(() => syncLocalOnlyToServer(true))
          .catch(e => console.warn('initial auto-sync failed', e));
      }, 2000);
    }

    const interval = setInterval(() => {
      if (navigator.onLine && !offlineMode && 
          (readJSON<PendingAction[]>(PENDING_KEY, []).length > 0 || 
           readJSON<StokItem[]>(LOCAL_ONLY_KEY, []).length > 0)) {
        processPendingQueue(true).catch(() => {});
        syncLocalOnlyToServer(true).catch(() => {});
      }
    }, 60_000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      isMounted.current = false;
    };
  }, [offlineMode, showNotification]);

  // Handle offline mode changes
  useEffect(() => {
    if (offlineMode && isOnline) {
      showNotification('info', 'Mode Offline Aktif', 'Sistem sengaja bekerja secara offline');
    }
  }, [offlineMode, isOnline, showNotification]);

  useEffect(() => {
    let result = [...stok];
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      result = result.filter(it =>
        String(it.nama_stok ?? '').toLowerCase().includes(q) ||
        String(it.supplier_stok ?? '').toLowerCase().includes(q) ||
        String(it.satuan_stok ?? '').toLowerCase().includes(q)
      );
    }
    if (supplierFilter && supplierFilter !== 'Semua') {
      result = result.filter(it => it.supplier_stok === supplierFilter);
    }
    
    setFiltered(prev => {
      if (JSON.stringify(prev) === JSON.stringify(result)) return prev;
      return result;
    });
  }, [stok, search, supplierFilter]);

  const suppliers = useMemo(() => ['Semua', ...Array.from(new Set(stok.map(s => s.supplier_stok).filter(Boolean)))], [stok]);

  function openAddForm() {
    resetForm();
    setShowForm(true);
    setEditing(null);
  }
  
  function openEditForm(item: StokItem) {
    setEditing(item);
    setFormData({ ...item });
    setShowForm(true);
  }
  
  function handleFormFieldChange<K extends keyof StokItem>(key: K, value: StokItem[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function onSubmitForm(e?: React.FormEvent) {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (editing && editing.id_stok) {
      await handleEditSubmit(editing.id_stok, formData);
    } else {
      await handleAdd(formData);
    }
  }

  const generateStokId = (index: number) => {
    return `#${String(index + 1).padStart(2, '0')}STOK`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Component */}
      <Header />

      {/* POPUP OFFLINE DIALOG - SESUAI GAMBAR */}
      {offlineDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full animate-scale-in">
            {/* Header SIPS */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">SIPS</span>
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-2xl">Metode Offline Tidak Aktif</h1>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-white text-opacity-90 text-sm">
                          Status {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-white text-opacity-90 text-sm">Manager</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side - Warning Message */}
                <div className="space-y-6">
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Stok</h3>
                        <p className="text-red-600 font-medium">Laporan</p>
                      </div>
                    </div>
                    
                    <div className="text-center py-4">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Internet tidak tersedia!</h2>
                      <p className="text-xl text-gray-600">Aktifkan metode offline?</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center mt-6">
                      <button
                        onClick={() => {
                          setOfflineDialog(false);
                          setOfflineMode(false);
                        }}
                        className="px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-bold text-lg min-w-[140px] shadow-lg"
                      >
                        Tidak
                      </button>
                      <button
                        onClick={() => {
                          setOfflineDialog(false);
                          setOfflineMode(true);
                          showNotification('info', 'Mode Offline Aktif', 'Sistem bekerja secara offline');
                        }}
                        className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold text-lg min-w-[140px] shadow-lg"
                      >
                        Aktifkan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side - Statistics */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Statistik Offline</h3>
                    
                    <div className="space-y-4">
                      {[
                        { name: 'KREATENS', yes: 5000, no: 1000 },
                        { name: 'SYLVESIA', yes: 7000, no: 6000 },
                        { name: 'TURKITIZEN', yes: 10000, no: 9000 },
                      ].map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-gray-800 text-lg">{stat.name}</span>
                            <span className="text-sm text-gray-500">Votes</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-green-600 font-semibold">Yes</span>
                              <span className="font-bold text-gray-800">{stat.yes.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-red-600 font-semibold">No</span>
                              <span className="font-bold text-gray-800">{stat.no.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-bold text-blue-600">
                                {(stat.yes + stat.no).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* More Button */}
                    <div className="mt-6 text-center">
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 mx-auto">
                        MOST <span className="text-xl">››</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500">
                  Sistem akan menyimpan data secara lokal saat mode offline aktif
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION POPUP - SESUAI GAMBAR */}
      {notifications.map(notif => (
        <div key={notif.id} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              {/* Header dengan tanggal dan waktu */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">{notif.date}</span>
                <span className="text-sm text-gray-500">{notif.time}</span>
              </div>
              
              {/* Icon dan Status */}
              <div className="flex items-center justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  notif.type === 'success' ? 'bg-green-100' :
                  notif.type === 'error' ? 'bg-red-100' :
                  notif.type === 'warning' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  <span className={`text-3xl ${
                    notif.type === 'success' ? 'text-green-500' :
                    notif.type === 'error' ? 'text-red-500' :
                    notif.type === 'warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`}>
                    {notif.type === 'success' ? '✓' : notif.type === 'error' ? '✗' : notif.type === 'warning' ? '⚠' : 'ℹ'}
                  </span>
                </div>
              </div>

              {/* Title dan Action */}
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-gray-800">{notif.title}</h3>
                {notif.action && (
                  <p className="text-sm text-gray-600 mt-1">{notif.action}</p>
                )}
              </div>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6">{notif.message}</p>

              {/* Button Pilihan untuk notifikasi mode offline */}
              {notif.type === 'warning' && notif.message.includes('mode offline') ? (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.filter(n => n.id !== notif.id));
                      setOfflineMode(false);
                    }}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Tidak
                  </button>
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.filter(n => n.id !== notif.id));
                      setOfflineMode(true);
                      showNotification('info', 'Mode Offline Aktif', 'Sistem sekarang bekerja dalam mode offline');
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Aktifkan
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className={`px-8 py-2 rounded-lg font-semibold text-white transition-colors ${
                      notif.type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                      notif.type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                      notif.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                      'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* CONFIRMATION DIALOG */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-6 border-b">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-4xl">⚠️</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
                {confirmDialog.title}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-center mb-6 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={confirmDialog.onCancel}
                  className="px-8 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold min-w-[120px]"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="px-8 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold min-w-[120px]"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Title and Search Section */}
        <div className="bg-white border-b px-6 py-4">
          <h2 className="text-2xl font-bold text-[#2E5090] mb-4">Kelola Stok</h2>
          
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari stok...."
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:border-blue-500 focus:outline-none"
            />
            <svg className="w-5 h-5 text-gray-400 absolute right-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Daftar Stok */}
          <div className="flex-1 flex flex-col bg-white">
            {/* Sync Progress */}
            {isSyncing && (
              <div className="mx-6 mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-800">🔄 Sinkronisasi sedang berjalan...</span>
                  <span className="text-sm font-bold text-blue-700">{syncProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Daftar Stok</h3>
                <button
                  onClick={() => { processPendingQueue().catch(() => {}); syncLocalOnlyToServer().catch(() => {}); }}
                  disabled={pendingCount === 0 && localOnlyCount === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    (pendingCount > 0 || localOnlyCount > 0)
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  🔁 Sinkronkan
                </button>
              </div>
              
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Memuat data...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="font-medium">Belum ada data stok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((row, index) => {
                    const isSelected = selectedStok && (
                      (row.id_stok && selectedStok.id_stok && row.id_stok === selectedStok.id_stok) ||
                      (row._offlineId && selectedStok._offlineId && row._offlineId === selectedStok._offlineId)
                    );
                    
                    return (
                    <div
                      key={row.id_stok ?? row._offlineId ?? index}
                      onClick={() => setSelectedStok(row)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-bold text-gray-800">{generateStokId(index)}</h4>
                            {row._offlineId && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                Lokal
                              </span>
                            )}
                          </div>
                          
                          <p className="font-medium text-gray-900 mb-1">{row.nama_stok}</p>
                          <p className="text-sm text-blue-600 font-semibold mb-1">
                            Rp {row.Harga_stok?.toLocaleString?.('id-ID')}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{row.jumlah_stok} {row.satuan_stok}</span>
                            <span>1 Kg/ Pack</span>
                            <span>{row.tanggal_stok}</span>
                            <span>{row.supplier_stok}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="border-t p-4 flex items-center justify-center gap-4">
              <button className="px-4 py-2 text-gray-400 hover:text-gray-600">
                &lt; Prev
              </button>
              <span className="text-gray-600">1/10</span>
              <button className="px-4 py-2 text-gray-400 hover:text-gray-600">
                Next &gt;
              </button>
            </div>
          </div>

          {/* Right Panel - Detail Stok */}
          <div className="w-96 bg-white border-l flex flex-col">
            <div className="p-6 border-b">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Detail Stok</h3>
              
              <div className="flex gap-2 mb-4 flex-wrap">
                <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">
                  📥 Impor
                </button>
                <button 
                  onClick={() => selectedStok && openEditForm(selectedStok)}
                  disabled={!selectedStok}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    selectedStok ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ✏️ Ubah
                </button>
                <button 
                  onClick={openAddForm}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200"
                >
                  ➕ Tambah
                </button>
                <button 
                  onClick={() => selectedStok && handleDelete(selectedStok.id_stok, selectedStok._offlineId)}
                  disabled={!selectedStok}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    selectedStok ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedStok ? (
                <div className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">{selectedStok.nama_stok}</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedStok.jumlah_stok} {selectedStok.satuan_stok} • 1 Kg/Pack
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedStok.tanggal_stok} • {selectedStok.supplier_stok}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-medium">{selectedStok.id_stok ?? 'Lokal'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga:</span>
                      <span className="font-medium">Rp {selectedStok.Harga_stok?.toLocaleString?.('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah:</span>
                      <span className="font-medium">{selectedStok.jumlah_stok} {selectedStok.satuan_stok}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supplier:</span>
                      <span className="font-medium">{selectedStok.supplier_stok}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-medium">{selectedStok.tanggal_stok}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedStok._offlineId ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {selectedStok._offlineId ? 'Lokal' : 'Tersinkron'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium mb-2">Tidak ada stok yang dipilih</p>
                  <p className="text-sm text-gray-400">Pilih stok dari daftar untuk melihat detail</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FORM MODAL - FIGMA DESIGN */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header dengan background biru sesuai Figma */}
            <div className="bg-[#2E5090] p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={resetForm}
                  className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-white">
                  {editing ? 'Ubah Stok' : 'Tambah Stok'}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-medium">Manager</span>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Form Content dengan background biru */}
            <div className="bg-[#3B5998] p-8">
              {(!isOnline || offlineMode) && (
                <div className="mb-4 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium">
                 Mode Offline - Data akan disimpan secara lokal
                </div>
              )}

              <div className="space-y-6">
                {/* ID Stok */}
                <div>
                  <label className="block text-white font-semibold mb-2 text-lg">
                    ID Stok:
                  </label>
                  <input
                    type="text"
                    value={editing?.id_stok ? `#${String(editing.id_stok).padStart(2, '0')}STOK` : 'Auto-generated'}
                    disabled
                    className="w-full bg-white bg-opacity-20 border-b-2 border-white text-white placeholder-gray-300 px-4 py-3 focus:outline-none focus:bg-opacity-30 transition-all disabled:opacity-60"
                  />
                </div>

                {/* Row 1: Nama Stok & Satuan Stok */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2 text-lg">
                      Nama Stok
                    </label>
                    <input
                      type="text"
                      value={String(formData.nama_stok ?? '')}
                      onChange={e => handleFormFieldChange('nama_stok', e.target.value)}
                      placeholder="Masukkan nama stok"
                      className="w-full bg-white bg-opacity-20 border-b-2 border-white text-white placeholder-gray-300 px-4 py-3 focus:outline-none focus:bg-opacity-30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2 text-lg">
                      Satuan Stok
                    </label>
                    <select
                      value={String(formData.satuan_stok ?? 'pcs')}
                      onChange={e => handleFormFieldChange('satuan_stok', e.target.value)}
                      className="w-full bg-white bg-opacity-20 border-b-2 border-white text-white px-4 py-3 focus:outline-none focus:bg-opacity-30 transition-all"
                    >
                      <option value="pcs" className="text-gray-800">Pcs</option>
                      <option value="kg" className="text-gray-800">Kg</option>
                      <option value="liter" className="text-gray-800">Liter</option>
                      <option value="pack" className="text-gray-800">Pack</option>
                      <option value="box" className="text-gray-800">Box</option>
                      <option value="unit" className="text-gray-800">Unit</option>
                      <option value="meter" className="text-gray-800">Meter</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Harga Stok & Tanggal Stok */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2 text-lg">
                      Harga Stok
                    </label>
                    <input
                      type="number"
                      value={String(formData.Harga_stok ?? '')}
                      onChange={e => handleFormFieldChange('Harga_stok', Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      className="w-full bg-white bg-opacity-20 border-b-2 border-white text-white placeholder-gray-300 px-4 py-3 focus:outline-none focus:bg-opacity-30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2 text-lg">
                      Tanggal Stok
                    </label>
                    <input
                      type="date"
                      value={String(formData.tanggal_stok ?? new Date().toISOString().split('T')[0])}
                      onChange={e => handleFormFieldChange('tanggal_stok', e.target.value)}
                      className="w-full bg-white bg-opacity-20 border-b-2 border-white text-white px-4 py-3 focus:outline-none focus:bg-opacity-30 transition-all"
                    />
                  </div>
                </div>

                {/* Row 3: Jumlah Stok & Supplier Stok */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-semibold mb-2 text-lg">
                      Jumlah Stok
                    </label>
                    <input
                      type="number"
                      value={String(formData.jumlah_stok ?? '')}
                      onChange={e => handleFormFieldChange('jumlah_stok', Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      className="w-full bg-white bg-opacity-20 border-b-2 border-white text-white placeholder-gray-300 px-4 py-3 focus:outline-none focus:bg-opacity-30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2 text-lg">
                      Supplier Stok
                    </label>
                    <input
                      type="text"
                      value={String(formData.supplier_stok ?? '')}
                      onChange={e => handleFormFieldChange('supplier_stok', e.target.value)}
                      placeholder="Nama supplier"
                      className="w-full bg-white bg-opacity-20 border-b-2 border-white text-white placeholder-gray-300 px-4 py-3 focus:outline-none focus:bg-opacity-30 transition-all"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-8">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg shadow-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={onSubmitForm}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg shadow-lg"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}