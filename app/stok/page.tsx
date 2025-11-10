// app/stok/page.tsx - FIXED & OPTIMIZED VERSION
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  text: string;
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
  const [isOnline, setIsOnline] = useState<boolean>(false);
  
  const [lastLoadedTime, setLastLoadedTime] = useState<string>('');

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

  const isMounted = useRef(true);
  const isProcessingPendingRef = useRef(false);
  const lastNotificationRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);

  const showNotification = useCallback((type: Notif['type'], text: string) => {
    const key = `${type}-${text}`;
    if (lastNotificationRef.current === key) return;
    
    lastNotificationRef.current = key;
    setTimeout(() => {
      lastNotificationRef.current = '';
    }, 2000);

    const newNotif: Notif = { id: uid('notif_'), type, text };
    setNotifications(prev => [...prev, newNotif]);
    
    const ms = 3000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, ms);
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

  // OPTIMIZED: Fungsi untuk menambah stok di mode offline
  const addStokOffline = useCallback((data: Partial<StokItem>) => {
    const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
    const localEntry: StokItem = { 
      ...toApiPayload(data), 
      _offlineId: uid('local_'),
      _pending: true 
    };
    
    localOnly.unshift(localEntry);
    writeJSON(LOCAL_ONLY_KEY, localOnly);
    
    // Update state langsung tanpa delay
    setStok(prev => [localEntry, ...prev]);
    setLocalOnlyCount(localOnly.length);
    
    // Reset form dan tutup modal dulu sebelum notifikasi
    resetForm();
    
    // Notifikasi muncul setelah form tertutup
    setTimeout(() => {
      showNotification('warning', 'Mode Offline: Data disimpan lokal');
    }, 100);
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

      setLastLoadedTime(new Date().toLocaleString('id-ID'));

      if (!isInitialLoadRef.current && !silent && rows.length > 0) {
        showNotification('success', `Data diperbarui`);
      }
    } catch (err: any) {
      const cached = readJSON<StokItem[]>(CACHE_KEY, []);
      const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
      const merged = [...cached, ...localOnly.map(it => ({ ...it, _offlineId: it._offlineId ?? uid('l_'), _pending: true }))];

      if (merged.length > 0) {
        setStok(merged);
        if (!isInitialLoadRef.current && !isOnline) {
          showNotification('warning', '⚠ Mode Offline: Menggunakan data cache');
        }
      } else {
        setStok([]);
        if (!silent) {
          showNotification('error', '✗ Tidak dapat memuat data');
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
    let failed = false;

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
            showNotification('error', `✗ Sinkronisasi gagal: ${parsed?.error ?? res.statusText}`);
          }
          failed = true;
          break;
        }

        removePending(action.id);
        succeeded++;
        setSyncProgress(Math.round((succeeded / total) * 100));
      } catch (err: any) {
        if (!silent) {
          showNotification('warning', '⚠ Koneksi terputus saat sinkronisasi');
        }
        failed = true;
        break;
      }
    }

    try {
      await fetchStokData({ silent: true });
    } catch (e) {
      console.warn('fetch after pending failed', e);
    }

    if (succeeded > 0 && !silent) {
      showNotification('success', `✓ Sinkronisasi berhasil: ${succeeded} item`);
    }

    isProcessingPendingRef.current = false;
    setIsSyncing(false);
    setSyncProgress(0);
    setPendingCount(readJSON<PendingAction[]>(PENDING_KEY, []).length);
  }

  // OPTIMIZED: Fungsi handleAdd yang mendukung offline
  const handleAdd = useCallback(async (data: Partial<StokItem>) => {
    if (!data.nama_stok || String(data.nama_stok).trim() === '') {
      showNotification('error', '✗ Nama stok wajib diisi');
      return;
    }

    const payload = toApiPayload(data);

    // Langsung simpan ke localStorage jika offline
    if (!isOnline) {
      addStokOffline(data);
      return;
    }

    // Tutup form dulu untuk responsivitas lebih baik
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
          showNotification('error', `✗ ${parsed?.error ?? `Gagal menyimpan: ${res.status}`}`);
          return;
        }
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (json.success) {
        showNotification('success', '✓ Stok berhasil ditambahkan');
        await fetchStokData({ silent: true });
      } else {
        showNotification('error', `✗ ${json.error || 'Gagal menyimpan data'}`);
      }
    } catch (err: any) {
      // Jika gagal saat online, tetap simpan ke localStorage
      addStokOffline(data);
    }
  }, [fetchStokData, showNotification, resetForm, isOnline, addStokOffline]);

  const handleEditSubmit = useCallback(async (id: number | string | undefined, data: Partial<StokItem>) => {
    if (!id) {
      showNotification('error', 'ID stok tidak ditemukan');
      return;
    }
    const payload = toApiPayload(data);
    const url = `/api/stok?id=${encodeURIComponent(String(id))}`;

    if (!isOnline) {
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
      showNotification('warning', '⚠ Mode Offline: Perubahan disimpan lokal');
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
          showNotification('error', `✗ ${parsed?.error ?? `Gagal update: ${res.status}`}`);
          return;
        }
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (json.success) {
        showNotification('success', '✓ Perubahan berhasil disimpan');
        resetForm();
        await fetchStokData({ silent: true });
      } else {
        showNotification('error', `✗ ${json.error || 'Gagal update'}`);
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
      showNotification('warning', '⚠ Koneksi gagal: Perubahan disimpan lokal');
      resetForm();
    }
  }, [fetchStokData, showNotification, resetForm, isOnline]);

  const handleDelete = useCallback(async (id?: number, offlineLocalId?: string) => {
    if (!id && !offlineLocalId) {
      showNotification('error', 'ID tidak tersedia');
      return;
    }

    const executeDelete = async () => {
      if (!id && offlineLocalId) {
        const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
        const updated = localOnly.filter(lo => lo._offlineId !== offlineLocalId);
        writeJSON(LOCAL_ONLY_KEY, updated);
        setStok(prev => prev.filter(p => p._offlineId !== offlineLocalId));
        setLocalOnlyCount(updated.length);
        showNotification('success', '✓ Item berhasil dihapus');
        return;
      }

      const url = `/api/stok?id=${id}`;
      if (!isOnline) {
        setStok(prev => prev.filter(p => String(p.id_stok) !== String(id)));
        const action: PendingAction = {
          id: uid('p_'),
          method: 'DELETE',
          url,
          createdAt: new Date().toISOString(),
          attempts: 0,
        };
        enqueueAction(action);
        showNotification('warning', '⚠ Mode Offline: Penghapusan disimpan lokal');
        return;
      }

      try {
        const res = await fetchWithTimeout(url, { method: 'DELETE' }, 15000);
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          if (res.status >= 400 && res.status < 500) {
            const parsed = text ? JSON.parse(text) : {};
            showNotification('error', `✗ ${parsed?.error ?? `Gagal menghapus: ${res.status}`}`);
            return;
          }
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        const json = await res.json();
        if (json.success) {
          showNotification('success', 'Data berhasil dihapus');
          await fetchStokData({ silent: true });
        } else {
          showNotification('error', `✗ ${json.error || 'Gagal menghapus'}`);
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
        showNotification('warning', '⚠ Koneksi gagal: Penghapusan disimpan lokal');
      }
    };

    showConfirm(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus data stok ini? Tindakan ini tidak dapat dibatalkan.',
      executeDelete
    );
  }, [fetchStokData, showNotification, showConfirm, isOnline]);

  async function syncLocalOnlyToServer(silent = false) {
    if (!isOnline) return;
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

    // Hanya simpan item yang gagal, hapus yang berhasil
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
        showNotification('success', `✓ Sinkronisasi selesai: ${succeeded} item`);
      }
    }
    setIsSyncing(false);
  }

  useEffect(() => {
    isMounted.current = true;

    setPendingCount(readJSON<PendingAction[]>(PENDING_KEY, []).length);
    setLocalOnlyCount(readJSON<StokItem[]>(LOCAL_ONLY_KEY, []).length);

    setLastLoadedTime(new Date().toLocaleString('id-ID'));

    function onOnline() {
      setIsOnline(true);
      showNotification('info', '🌐 Koneksi online');
      setTimeout(() => {
        processPendingQueue(true).then(() => syncLocalOnlyToServer(true)).catch(e => console.warn('auto sync error', e));
      }, 1000);
    }
    
    function onOffline() {
      setIsOnline(false);
      showNotification('warning', '📡 Mode Offline');
    }

    setIsOnline(navigator.onLine);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    fetchStokData().catch(e => console.warn('initial fetch failed', e));

    if (navigator.onLine && (pendingCount > 0 || localOnlyCount > 0)) {
      setTimeout(() => {
        processPendingQueue(true).then(() => syncLocalOnlyToServer(true)).catch(e => console.warn('initial auto-sync failed', e));
      }, 1500);
    }

    const interval = setInterval(() => {
      if (navigator.onLine && (readJSON<PendingAction[]>(PENDING_KEY, []).length > 0 || readJSON<StokItem[]>(LOCAL_ONLY_KEY, []).length > 0)) {
        processPendingQueue(true).catch(() => {});
        syncLocalOnlyToServer(true).catch(() => {});
      }
    }, 60_000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      isMounted.current = false;
    };
  }, []);

  // OPTIMIZED: Filter hanya update jika benar-benar berubah
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
    
    // Update filtered hanya jika benar-benar berubah
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
    
    // Validasi form
    if (!formData.nama_stok || String(formData.nama_stok).trim() === '') {
      showNotification('error', '✗ Nama stok wajib diisi');
      return;
    }
    
    if (editing && editing.id_stok) {
      await handleEditSubmit(editing.id_stok, formData);
    } else {
      await handleAdd(formData);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Notifications */}
        {notifications.map(notif => (
          <div key={notif.id} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
              <div className="p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    notif.type === 'success' ? 'bg-green-100' :
                    notif.type === 'error' ? 'bg-red-100' :
                    notif.type === 'warning' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <span className={`text-5xl ${
                      notif.type === 'success' ? 'text-green-500' :
                      notif.type === 'error' ? 'text-red-500' :
                      notif.type === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      {notif.type === 'success' ? '✓' : notif.type === 'error' ? '✗' : notif.type === 'warning' ? '⚠' : 'ℹ'}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {notif.type === 'success' ? 'Berhasil!' : 
                   notif.type === 'error' ? 'Gagal!' : 
                   notif.type === 'warning' ? 'Peringatan!' : 
                   'Informasi'}
                </h3>
                <p className="text-gray-600 mb-8 text-lg">{notif.text}</p>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className={`px-10 py-3 rounded-lg font-semibold text-white transition-colors ${
                    notif.type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                    notif.type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                    notif.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                    'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Confirmation Dialog */}
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

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Stok</h1>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {isOnline ? '🌐 Online' : '📡 Offline'}
                </span>
                {(pendingCount > 0 || localOnlyCount > 0) && (
                  <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                    ⏳ Belum Tersinkron: {pendingCount + localOnlyCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchStokData()}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                🔄 Refresh
              </button>

              <button
                onClick={() => { processPendingQueue().catch(() => {}); syncLocalOnlyToServer().catch(() => {}); }}
                disabled={pendingCount === 0 && localOnlyCount === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  (pendingCount > 0 || localOnlyCount > 0)
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                🔁 Sinkronkan
              </button>

              <button
                onClick={openAddForm}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
              >
                + Tambah Stok
              </button>
            </div>
          </div>
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
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

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Cari nama stok, supplier, atau satuan..."
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="w-full md:w-64">
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
              >
                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
              <span className="px-4 py-2 bg-gray-100 rounded-lg">
                📊 {filtered.length} Items
              </span>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">
                  {editing ? 'Edit Stok' : 'Tambah Stok Baru'}
                </h2>
                {!isOnline && (
                  <div className="mt-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-medium inline-block">
                    📡 Mode Offline - Data akan disimpan secara lokal
                  </div>
                )}
              </div>

              <form onSubmit={onSubmitForm} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Stok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={String(formData.nama_stok ?? '')}
                    onChange={e => handleFormFieldChange('nama_stok', e.target.value)}
                    placeholder="Contoh: Beras Premium, Minyak Goreng, dll"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jumlah Stok <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={String(formData.jumlah_stok ?? '')}
                      onChange={e => handleFormFieldChange('jumlah_stok', Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Satuan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={String(formData.satuan_stok ?? 'pcs')}
                      onChange={e => handleFormFieldChange('satuan_stok', e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    >
                      <option value="pcs">Pcs (Pieces)</option>
                      <option value="kg">Kg (Kilogram)</option>
                      <option value="liter">Liter</option>
                      <option value="box">Box</option>
                      <option value="pack">Pack</option>
                      <option value="unit">Unit</option>
                      <option value="meter">Meter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={String(formData.supplier_stok ?? '')}
                    onChange={e => handleFormFieldChange('supplier_stok', e.target.value)}
                    placeholder="Nama supplier / vendor"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Harga (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={String(formData.Harga_stok ?? '')}
                      onChange={e => handleFormFieldChange('Harga_stok', Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={String(formData.tanggal_stok ?? new Date().toISOString().split('T')[0])}
                      onChange={e => handleFormFieldChange('tanggal_stok', e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors font-medium shadow-md"
                  >
                    {editing ? 'Simpan Perubahan' : 'Tambah Stok'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Memuat data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 border-b-2">ID</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 border-b-2">Nama Stok</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 border-b-2">Supplier</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700 border-b-2">Jumlah</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border-b-2">Satuan</th>
                    <th className="px-4 py-3 text-right font-bold text-gray-700 border-b-2">Harga</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border-b-2">Tanggal</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border-b-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-500">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-lg font-medium">Belum ada data stok</p>
                        <p className="text-sm mt-2">Klik "Tambah Stok" untuk menambahkan data baru</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, idx) => {
                      const isLocalOnly = !!row._offlineId && !row.id_stok;
                      const isPending = !!row._pending;
                      return (
                        <tr
                          key={row.id_stok ?? row._offlineId ?? idx}
                          className={`border-b hover:bg-gray-50 transition-colors ${
                            isLocalOnly ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-700 font-medium">
                            {row.id_stok ?? <span className="text-gray-400 italic">Lokal</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{row.nama_stok}</td>
                          <td className="px-4 py-3 text-gray-600">{row.supplier_stok}</td>
                          <td className="px-4 py-3 text-right text-gray-800 font-semibold">
                            {row.jumlah_stok?.toLocaleString?.() ?? row.jumlah_stok}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                              {row.satuan_stok}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-800 font-semibold">
                            Rp {row.Harga_stok?.toLocaleString?.('id-ID') ?? row.Harga_stok}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{row.tanggal_stok}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditForm(row)}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(row.id_stok, row._offlineId)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="flex items-center gap-6">
              <span className="text-gray-700 font-medium">
                📊 Total: <span className="font-bold text-blue-600">{stok.length}</span> items
              </span>
              <span className="text-gray-700 font-medium">
                ⏳ Pending: <span className="font-bold text-orange-600">{pendingCount}</span>
              </span>
              <span className="text-gray-700 font-medium">
                📦 Lokal: <span className="font-bold text-yellow-600">{localOnlyCount}</span>
              </span>
            </div>
            <div className="text-gray-500 text-xs">
              Terakhir dimuat: {lastLoadedTime || 'Memuat...'}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

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

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
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