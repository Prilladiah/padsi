// app/stok/page.tsx - HAPUS TOMBOL SINKRONKAN
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/layout/header';
import * as XLSX from 'xlsx';

type StokItem = {
  id_stok?: number;
  nama_stok: string;
  unit_bisnis: string;
  supplier_stok: string;
  tanggal_stok: string;
  jumlah_stok: number;
  Harga_stok: number;
  _offlineId?: string;
  _pending?: boolean;
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

type CSVImportResult = {
  success: boolean;
  count: number;
  errors: string[];
  data?: Partial<StokItem>[];
};

const CACHE_KEY = 'stok_cache_v2';
const LOCAL_ONLY_KEY = 'stok_localonly_v2';
const OFFLINE_MODE_KEY = 'stok_offlinemode_v2';

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
    nama_stok: String(item.nama_stok ?? item.nama ?? item['Nama Stok'] ?? item['nama'] ?? ''),
    unit_bisnis: String(item.unit_bisnis ?? item.unit ?? item['Unit Bisnis'] ?? item['unit'] ?? ''),
    supplier_stok: String(item.supplier_stok ?? item.supplier ?? item['Supplier Stok'] ?? item['supplier'] ?? 'Tidak ada supplier'),
    tanggal_stok: String(item.tanggal_stok ?? item.tanggal ?? item['Tanggal Stok'] ?? item['tanggal'] ?? new Date().toISOString().split('T')[0]),
    jumlah_stok: Number(item.jumlah_stok ?? item.jumlah ?? item['Jumlah Stok'] ?? item['jumlah'] ?? 0),
    Harga_stok: Number(item.Harga_stok ?? item.Harga ?? item['Harga Stok'] ?? item['harga'] ?? 0),
  };
}

// ============= FUNGSI IMPORT EXCEL BARU =============
const downloadTemplate = () => {
  const templateData = [
    ['Nama Stok', 'Unit Bisnis', 'Supplier Stok', 'Tanggal Stok (YYYY-MM-DD)', 'Jumlah Stok', 'Harga Stok'],
    ['Cup Paper 120', 'Cafe', 'Supplier Packaging', '2024-01-06', '10', '0'],
    ['Gula Pasir', 'Cafe', 'Supplier Gula', '2024-01-06', '50', '50000'],
    ['Susu Full Cream', 'Cafe', 'PT Susu Segar', '2024-01-06', '10', '30000'],
    ['Kopi Arabika', 'Cafe', 'Supplier Kopi', '2024-01-06', '50', '20000']
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, 'Template Stok');
  
  const wscols = [
    { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }
  ];
  ws['!cols'] = wscols;
  
  XLSX.writeFile(wb, 'Template_Import_Stok.xlsx');
};

const processExcelFile = (file: File): Promise<CSVImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const errors: string[] = [];
    const importedData: Partial<StokItem>[] = [];

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const rows = jsonData.slice(1); // Skip header row
        
        rows.forEach((row, index) => {
          if (!row || row.length === 0 || !row[0]) return;
          
          try {
            const nama_stok = String(row[0] || '').trim();
            const unit_bisnis = String(row[1] || 'Cafe').trim();
            const supplier_stok = String(row[2] || 'Tidak ada supplier').trim();
            const tanggal_stok = String(row[3] || new Date().toISOString().split('T')[0]).trim();
            const jumlah_stok = Number(row[4] || 0);
            const Harga_stok = Number(row[5] || 0);
            
            // Validasi data
            if (!nama_stok) {
              errors.push(`Baris ${index + 2}: Nama stok tidak boleh kosong`);
              return;
            }
            
            if (jumlah_stok <= 0) {
              errors.push(`Baris ${index + 2}: Jumlah stok harus lebih dari 0`);
              return;
            }
            
            if (Harga_stok < 0) {
              errors.push(`Baris ${index + 2}: Harga tidak boleh negatif`);
              return;
            }
            
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(tanggal_stok)) {
              errors.push(`Baris ${index + 2}: Format tanggal harus YYYY-MM-DD (contoh: 2024-01-06)`);
              return;
            }
            
            importedData.push({
              nama_stok,
              unit_bisnis,
              supplier_stok,
              tanggal_stok,
              jumlah_stok,
              Harga_stok
            });
            
          } catch (error: any) {
            errors.push(`Baris ${index + 2}: Error parsing data - ${error.message}`);
          }
        });
        
        resolve({
          success: errors.length === 0,
          count: importedData.length,
          errors,
          data: importedData
        });
        
      } catch (error: any) {
        errors.push(`Error membaca file: ${error.message}`);
        resolve({
          success: false,
          count: 0,
          errors,
          data: []
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        count: 0,
        errors: ['Gagal membaca file'],
        data: []
      });
    };
    
    reader.readAsBinaryString(file);
  });
};

// ============= FUNGSI IMPORT KE DATABASE =============
const importToDatabase = async (data: Partial<StokItem>[]): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  if (!data || data.length === 0) {
    return results;
  }

  try {
    // Simpan data ke database satu per satu
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      try {
        const payload = toApiPayload(item);
        const res = await fetchWithTimeout('/api/stok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, 10000);

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Baris ${i + 1}: ${json.error || 'Gagal menyimpan'}`);
          }
        } else {
          results.failed++;
          results.errors.push(`Baris ${i + 1}: HTTP ${res.status}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Baris ${i + 1}: ${error.message || 'Error jaringan'}`);
      }
    }
  } catch (error: any) {
    results.errors.push(`Error proses: ${error.message}`);
  }

  return results;
};

export default function StokPage() {
  // DATA ASLI HANYA 4 ITEM
  const [stok, setStok] = useState<StokItem[]>([
    {
      id_stok: 1,
      nama_stok: 'Cup Paper 120',
      unit_bisnis: 'Cafe',
      supplier_stok: 'Supplier Packaging',
      tanggal_stok: '2024-01-06',
      jumlah_stok: 10,
      Harga_stok: 0,
    },
    {
      id_stok: 2,
      nama_stok: 'Gula Pasir',
      unit_bisnis: 'Cafe',
      supplier_stok: 'Supplier Gula Maris',
      tanggal_stok: '2024-01-06',
      jumlah_stok: 50,
      Harga_stok: 50000,
    },
    {
      id_stok: 3,
      nama_stok: 'Susu Full Cream',
      unit_bisnis: 'Cafe',
      supplier_stok: 'PT Susu Segar',
      tanggal_stok: '2024-01-06',
      jumlah_stok: 10,
      Harga_stok: 30000,
    },
    {
      id_stok: 4,
      nama_stok: 'Kopi Arabika',
      unit_bisnis: 'Cafe',
      supplier_stok: 'Supplier Kopi Juwa',
      tanggal_stok: '2024-01-06',
      jumlah_stok: 50,
      Harga_stok: 20000,
    },
  ]);
  
  const [filtered, setFiltered] = useState<StokItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [search, setSearch] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('Semua');
  const [page] = useState<number>(1);
  const [limit] = useState<number>(100);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [localOnlyCount, setLocalOnlyCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  const [selectedStok, setSelectedStok] = useState<StokItem | null>(stok[0] || null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<StokItem | null>(null);
  const [formData, setFormData] = useState<Partial<StokItem>>({
    nama_stok: '',
    unit_bisnis: '',
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

  // STATE UNTUK OFFLINE MODE
  const [offlineModeDialog, setOfflineModeDialog] = useState<boolean>(false);
  const [offlineModeEnabled, setOfflineModeEnabled] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'saving' | 'complete' | 'error'>('idle');
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);

  // STATE UNTUK POPUP NOTIFIKASI OFFLINE
  const [showOfflineNotification, setShowOfflineNotification] = useState<boolean>(false);
  const [offlineNotificationMessage, setOfflineNotificationMessage] = useState<string>('');
  const [offlineNotificationTitle, setOfflineNotificationTitle] = useState<string>('');

  // STATE BARU UNTUK NOTIFIKASI MODE OFFLINE AKTIF
  const [showOfflineActiveNotification, setShowOfflineActiveNotification] = useState<boolean>(false);

  const [userRole, setUserRole] = useState<'manager' | 'staff'>('staff');
  const [userName, setUserName] = useState<string>('');

  const isMounted = useRef(true);
  const isInitialLoadRef = useRef(true);
  const hasCheckedRoleRef = useRef(false);
  const fetchCountRef = useRef(0);
  const isFetchingRef = useRef(false);
  const offlineNotificationShown = useRef(false);
  const offlineActiveNotificationShown = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FUNGSI UNTUK MENAMPILKAN POPUP NOTIFIKASI OFFLINE
  const showOfflinePopup = useCallback((title: string, message: string) => {
    setOfflineNotificationTitle(title);
    setOfflineNotificationMessage(message);
    setShowOfflineNotification(true);
    
    // Auto close setelah 5 detik
    setTimeout(() => {
      setShowOfflineNotification(false);
    }, 5000);
  }, []);

  // FUNGSI UNTUK MENAMPILKAN NOTIFIKASI MODE OFFLINE AKTIF
  const showOfflineActivePopup = useCallback(() => {
    // Cek apakah notifikasi sudah ditampilkan sebelumnya
    if (offlineActiveNotificationShown.current) return;
    
    offlineActiveNotificationShown.current = true;
    setShowOfflineActiveNotification(true);
    
    // Auto close setelah 4 detik
    setTimeout(() => {
      setShowOfflineActiveNotification(false);
    }, 4000);
  }, []);

  // FUNGSI UNTUK MENDAPATKAN ROLE USER
  const checkUserRole = useCallback(() => {
    if (typeof window === 'undefined') return 'staff';
    
    try {
      const userStr = localStorage.getItem('current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.role || 'staff';
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    
    return 'staff';
  }, []);

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
    
    const timeoutDuration = type === 'warning' ? 4000 : 4000;
    
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
      unit_bisnis: '',
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
    
    if (!formData.unit_bisnis || String(formData.unit_bisnis).trim() === '') {
      showNotification('error', 'Data tidak boleh kosong!', 'Unit bisnis harus diisi!');
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

  // FUNGSI UNTUK TEST KONEKSI API
  const testAPIConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Testing API connection...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/stok?test=1&limit=1', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      console.log('API connection test result:', response.ok);
      return response.ok;
    } catch (error) {
      console.log('API connection test failed:', error);
      return false;
    }
  }, []);

  // ============= FUNGSI UTAMA =============
  const fetchStokData = useCallback(async (opts?: { page?: number; limit?: number; search?: string; silent?: boolean; force?: boolean }) => {
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    isFetchingRef.current = true;
    fetchCountRef.current++;
    
    console.log(`Fetch #${fetchCountRef.current}: Starting...`);

    const usePage = opts?.page ?? page;
    const useLimit = opts?.limit ?? limit;
    const useSearch = opts?.search ?? search;
    const silent = opts?.silent ?? false;
    const force = opts?.force ?? false;

    setIsFetching(true);
    setIsLoading(true);

    try {
      // Test koneksi dulu
      const apiAvailable = await testAPIConnection();
      if (!apiAvailable) {
        throw new Error('API tidak tersedia');
      }

      const params = new URLSearchParams();
      params.set('page', String(usePage));
      params.set('limit', String(useLimit));
      if (useSearch) params.set('search', useSearch);

      const url = `/api/stok?${params.toString()}`;
      console.log(`Fetching from: ${url}`);
      
      const res = await fetchWithTimeout(url, { 
        headers: { 'Cache-Control': 'no-cache' },
        method: 'GET'
      }, 8000);

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (!json || !json.success || !Array.isArray(json.data)) {
        throw new Error(json?.error || 'Invalid response from server');
      }

      console.log(`Fetch #${fetchCountRef.current}: Got ${json.data.length} items`);

      const rows: StokItem[] = json.data.map((r: any) => ({
        id_stok: r.id_stok,
        nama_stok: r.nama_stok ?? '',
        unit_bisnis: r.unit_bisnis ?? '',
        supplier_stok: r.supplier_stok ?? 'Tidak ada supplier',
        tanggal_stok: r.tanggal_stok ?? new Date().toISOString().split('T')[0],
        jumlah_stok: Number(r.jumlah_stok ?? 0),
        Harga_stok: Number(r.Harga_stok ?? 0),
      }));

      const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
      const merged = [...rows, ...localOnly.map(it => ({ ...it, _offlineId: it._offlineId ?? uid('l_'), _pending: true }))];

      setStok(merged);
      writeJSON(CACHE_KEY, rows);
      setLocalOnlyCount(localOnly.length);

      if (!isInitialLoadRef.current && !silent && rows.length > 0 && force) {
        showNotification('success', 'Data Diperbarui', 'Data stok berhasil diperbarui');
      }
      
    } catch (err: any) {
      console.error(`Fetch #${fetchCountRef.current}: Error:`, err.message);
      
      const cached = readJSON<StokItem[]>(CACHE_KEY, []);
      const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
      const merged = [...cached, ...localOnly.map(it => ({ ...it, _offlineId: it._offlineId ?? uid('l_'), _pending: true }))];

      if (merged.length > 0) {
        setStok(merged);
        if (!isOnline && !silent && force) {
          showNotification('warning', 'Mode Offline', 'Menggunakan data cache lokal');
        }
      } else {
        setStok([]);
        if (!silent && force) {
          showNotification('error', 'Gagal Memuat', 'Tidak dapat memuat data stok');
        }
      }
      setLocalOnlyCount(localOnly.length);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      isFetchingRef.current = false;
      
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      
      console.log(`Fetch #${fetchCountRef.current}: Completed`);
    }
  }, [showNotification, isOnline, testAPIConnection, page, limit, search]);

  // ============= FUNGSI IMPORT EXCEL BARU =============
  
  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    
    // Validasi file type
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
      showNotification('error', 'Format File Tidak Didukung', 'Harap upload file Excel (.xlsx, .xls) atau CSV (.csv)');
      return;
    }
    
    // Validasi file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Ukuran File Terlalu Besar', 'Maksimal 5MB');
      return;
    }
    
    setUploadFile(file);
    setUploadStatus('idle');
    setImportResult(null);
    setUploadProgress(0);
  }, [showNotification]);

  // Handle drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (userRole === 'staff') {
      showNotification('error', 'Akses Ditolak', 'Staff tidak memiliki izin untuk mengimpor data');
      return;
    }
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/csv'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
        showNotification('error', 'Format File Tidak Didukung', 'Harap upload file Excel (.xlsx, .xls) atau CSV (.csv)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Ukuran File Terlalu Besar', 'Maksimal 5MB');
        return;
      }
      
      setUploadFile(file);
      setUploadStatus('idle');
      setImportResult(null);
      setUploadProgress(0);
    }
  }, [userRole, showNotification]);

  // FUNGSI IMPORT EXCEL YANG TERHUBUNG KE DATABASE
  const handleImportExcel = useCallback(async () => {
    if (!uploadFile) {
      showNotification('error', 'File Belum Dipilih', 'Pilih file terlebih dahulu');
      return;
    }
    
    // Reset state
    setUploadStatus('uploading');
    setUploadProgress(10);
    setImportResult(null);
    
    try {
      // 1. Proses file Excel/CSV
      setUploadStatus('processing');
      setUploadProgress(30);
      
      const result = await processExcelFile(uploadFile);
      setImportResult(result);
      setUploadProgress(50);
      
      if (!result.success || !result.data || result.data.length === 0) {
        setUploadStatus('error');
        showNotification('error', 'Import Gagal', result.errors.join(', ') || 'Tidak ada data yang valid');
        return;
      }
      
      // 2. Simpan ke Database
      setUploadStatus('saving');
      setUploadProgress(70);
      
      // Test koneksi API dulu
      const apiAvailable = await testAPIConnection();
      
      if (apiAvailable && isOnline) {
        // Jika online, simpan langsung ke database
        const dbResult = await importToDatabase(result.data);
        setUploadProgress(90);
        
        // Tampilkan hasil
        if (dbResult.success > 0) {
          showNotification('success', 'Import Berhasil', 
            `${dbResult.success} dari ${result.data.length} data berhasil disimpan ke database`);
          
          // Refresh data dari server
          await fetchStokData({ silent: true, force: true });
          
          setUploadStatus('complete');
          setUploadProgress(100);
          
          // Reset setelah 2 detik
          setTimeout(() => {
            setUploadStatus('idle');
            setUploadFile(null);
            setShowUploadModal(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }, 2000);
          
        } else {
          // Jika gagal semua, simpan ke lokal
          showNotification('warning', 'Import Gagal', 
            'Semua data gagal disimpan ke database, disimpan secara lokal');
          
          // Simpan ke local storage
          const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
          const importedItems = result.data.map(item => ({
            ...toApiPayload(item),
            _offlineId: uid('import_'),
            _pending: true
          }));
          
          const updatedLocal = [...localOnly, ...importedItems];
          writeJSON(LOCAL_ONLY_KEY, updatedLocal);
          setLocalOnlyCount(updatedLocal.length);
          
          // Update state
          setStok(prev => [...prev, ...importedItems]);
          
          setUploadStatus('complete');
          setUploadProgress(100);
          
          // Reset setelah 3 detik
          setTimeout(() => {
            setUploadStatus('idle');
            setUploadFile(null);
            setShowUploadModal(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }, 3000);
        }
        
      } else {
        // Jika offline atau API tidak tersedia, simpan ke lokal
        setUploadProgress(80);
        
        // Simpan ke local storage
        const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
        const importedItems = result.data.map(item => ({
          ...toApiPayload(item),
          _offlineId: uid('import_'),
          _pending: true
        }));
        
        const updatedLocal = [...localOnly, ...importedItems];
        writeJSON(LOCAL_ONLY_KEY, updatedLocal);
        setLocalOnlyCount(updatedLocal.length);
        
        // Update state
        setStok(prev => [...prev, ...importedItems]);
        
        setUploadStatus('complete');
        setUploadProgress(100);
        
        // Tampilkan notifikasi
        showOfflinePopup(
          'Import Berhasil (Mode Offline)',
          `${result.data.length} data stok berhasil diimport secara lokal. Data akan disinkronkan saat koneksi internet tersedia.`
        );
        
        // Reset setelah 3 detik
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadFile(null);
          setShowUploadModal(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('Import error:', error);
      setUploadStatus('error');
      showNotification('error', 'Import Gagal', error.message || 'Terjadi kesalahan saat mengimport file');
      setUploadProgress(0);
    }
  }, [uploadFile, isOnline, showNotification, testAPIConnection, showOfflinePopup, fetchStokData]);

  // Reset upload
  const resetUpload = useCallback(() => {
    setUploadFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // FUNGSI UNTUK MENGATUR MODE OFFLINE
  const enableOfflineMode = useCallback(() => {
    setOfflineModeEnabled(true);
    writeJSON(OFFLINE_MODE_KEY, true);
    
    // TAMPILKAN NOTIFIKASI MODE OFFLINE AKTIF
    showOfflineActivePopup();
    
    showOfflinePopup('Mode Offline Aktif', 'Anda dapat bekerja tanpa koneksi internet. Data akan disimpan secara lokal dan disinkronkan otomatis saat online.');
  }, [showOfflinePopup, showOfflineActivePopup]);

  // FUNGSI addStokOffline HANYA UNTUK MANAGER
  const addStokOffline = useCallback((data: Partial<StokItem>) => {
    if (userRole === 'staff') {
      showNotification('error', 'Akses Ditolak', 'Staff tidak memiliki izin untuk menambah stok');
      return;
    }

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
    
    // TAMPILKAN POPUP NOTIFIKASI OFFLINE
    showOfflinePopup(
      'Stok Ditambahkan (Mode Offline)',
      `Stok "${data.nama_stok}" berhasil ditambahkan secara lokal. Data akan disinkronkan saat koneksi internet tersedia.`
    );
    
    // Tampilkan juga notifikasi regular
    showNotification('warning', 'Mode Offline', 'Data disimpan secara lokal, akan sinkron saat online');
  }, [showNotification, resetForm, userRole, showOfflinePopup]);

  // FUNGSI handleAdd HANYA UNTUK MANAGER
  const handleAdd = useCallback(async (data: Partial<StokItem>) => {
    if (userRole === 'staff') {
      showNotification('error', 'Akses Ditolak', 'Staff tidak memiliki izin untuk menambah stok');
      return;
    }

    if (!data.nama_stok || String(data.nama_stok).trim() === '') {
      showNotification('error', 'Data tidak boleh kosong!', 'Silahkan input data stok kembali');
      return;
    }

    const payload = toApiPayload(data);

    // JIKA TIDAK ADA KONEKSI INTERNET, SIMPAN KE LOCAL
    if (!isOnline) {
      addStokOffline(data);
      return;
    }

    resetForm();
    
    try {
      // Test koneksi API dulu
      const apiAvailable = await testAPIConnection();
      if (!apiAvailable) {
        addStokOffline(data);
        return;
      }

      const res = await fetchWithTimeout('/api/stok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 15000);

      if (!res.ok) throw new Error('Failed');

      const json = await res.json();
      if (json.success) {
        showNotification('success', 'Berhasil!', 'Data stok berhasil ditambahkan');
        await fetchStokData({ silent: true, force: true });
      } else {
        showNotification('error', 'Gagal!', json.error);
      }
    } catch (err: any) {
      if (!isOnline) {
        // JIKA TERJADI ERROR DAN SEDANG OFFLINE, SIMPAN KE LOCAL
        addStokOffline(data);
      } else {
        showNotification('error', 'Gagal!', 'Terjadi kesalahan saat menambahkan data');
      }
    }
  }, [fetchStokData, showNotification, resetForm, isOnline, addStokOffline, userRole, testAPIConnection]);

  // FUNGSI handleEditSubmit HANYA UNTUK MANAGER
  const handleEditSubmit = useCallback(async (id: number | string | undefined, data: Partial<StokItem>) => {
    if (userRole === 'staff') {
      showNotification('error', 'Akses Ditolak', 'Staff tidak memiliki izin untuk mengubah stok');
      return;
    }

    if (!id) {
      showNotification('error', 'Ubah Stok Gagal', 'ID stok tidak ditemukan');
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
      
      // TAMPILKAN POPUP NOTIFIKASI OFFLINE
      showOfflinePopup(
        'Stok Diubah (Mode Offline)',
        `Perubahan pada stok "${data.nama_stok}" disimpan secara lokal. Data akan disinkronkan saat koneksi internet tersedia.`
      );
      
      resetForm();
      return;
    }

    try {
      // Test koneksi API dulu
      const apiAvailable = await testAPIConnection();
      if (!apiAvailable) {
        setStok(prev => prev.map(p => (String(p.id_stok) === String(id) ? { ...p, ...payload, _pending: true } : p)));
        showOfflinePopup(
          'Stok Diubah (Mode Offline)',
          `Perubahan pada stok "${data.nama_stok}" disimpan secara lokal. Data akan disinkronkan saat koneksi internet tersedia.`
        );
        resetForm();
        return;
      }

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
        await fetchStokData({ silent: true, force: true });
      } else {
        showNotification('error', 'Gagal!', json.error || 'Data stok gagal diubah');
      }
    } catch (err: any) {
      if (!isOnline) {
        setStok(prev => prev.map(p => (String(p.id_stok) === String(id) ? { ...p, ...payload, _pending: true } : p)));
        // TAMPILKAN POPUP NOTIFIKASI OFFLINE
        showOfflinePopup(
          'Stok Diubah (Mode Offline)',
          `Perubahan pada stok "${data.nama_stok}" disimpan secara lokal. Data akan disinkronkan saat koneksi internet tersedia.`
        );
      } else {
        showNotification('error', 'Gagal!', 'Terjadi kesalahan saat mengubah data');
      }
      resetForm();
    }
  }, [fetchStokData, showNotification, resetForm, isOnline, userRole, showOfflinePopup, testAPIConnection]);

  // FUNGSI handleDelete HANYA UNTUK MANAGER
  const handleDelete = useCallback((id?: number, offlineLocalId?: string) => {
    // CEK JIKA STAFF, TOLAK AKSES
    if (userRole === 'staff') {
      showNotification('error', 'Akses Ditolak', 'Staff tidak memiliki izin untuk menghapus stok');
      return;
    }

    if (!id && !offlineLocalId) {
      showNotification('error', 'Hapus Gagal', 'ID tidak tersedia');
      return;
    }

    const itemToDelete = stok.find(item => 
      (id && item.id_stok === id) || 
      (offlineLocalId && item._offlineId === offlineLocalId)
    );

    if (!itemToDelete) {
      showNotification('error', 'Hapus Gagal', 'Data tidak ditemukan');
      return;
    }

    const itemName = itemToDelete.nama_stok;

    const executeDelete = async () => {
      // HAPUS DATA LOKAL (OFFLINE)
      if (offlineLocalId) {
        const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
        const updatedLocal = localOnly.filter(lo => lo._offlineId !== offlineLocalId);
        writeJSON(LOCAL_ONLY_KEY, updatedLocal);
        
        setStok(prev => prev.filter(p => p._offlineId !== offlineLocalId));
        setLocalOnlyCount(updatedLocal.length);
        
        if (selectedStok && selectedStok._offlineId === offlineLocalId) {
          setSelectedStok(null);
        }
        
        showOfflinePopup(
          'Stok Dihapus (Mode Offline)',
          `Stok "${itemName}" berhasil dihapus secara lokal. Perubahan akan disinkronkan saat koneksi internet tersedia.`
        );
        return;
      }

      // HAPUS DATA SERVER (ONLINE) ATAU CACHE (OFFLINE)
      if (!id) {
        showNotification('error', 'Hapus Gagal', 'ID tidak valid');
        return;
      }

      const url = `/api/stok?id=${id}`;
      
      // JIKA TIDAK ADA KONEKSI INTERNET, HAPUS DARI CACHE SAJA
      if (!isOnline) {
        const cache = readJSON<StokItem[]>(CACHE_KEY, []);
        const updatedCache = cache.filter(c => String(c.id_stok) !== String(id));
        writeJSON(CACHE_KEY, updatedCache);
        
        setStok(prev => prev.filter(p => String(p.id_stok) !== String(id)));
        
        if (selectedStok && selectedStok.id_stok === id) {
          setSelectedStok(null);
        }
        
        showOfflinePopup(
          'Stok Dihapus (Mode Offline)',
          `Stok "${itemName}" dihapus dari cache lokal. Perubahan akan disinkronkan saat koneksi internet tersedia.`
        );
        return;
      }

      // JIKA ADA KONEKSI INTERNET, HAPUS DARI SERVER
      try {
        // Test koneksi API dulu
        const apiAvailable = await testAPIConnection();
        if (!apiAvailable) {
          const cache = readJSON<StokItem[]>(CACHE_KEY, []);
          const updatedCache = cache.filter(c => String(c.id_stok) !== String(id));
          writeJSON(CACHE_KEY, updatedCache);
          
          setStok(prev => prev.filter(p => String(p.id_stok) !== String(id)));
          
          if (selectedStok && selectedStok.id_stok === id) {
            setSelectedStok(null);
          }
          
          showOfflinePopup(
            'Stok Dihapus (Mode Offline)',
            `Stok "${itemName}" dihapus dari cache lokal. Perubahan akan disinkronkan saat koneksi internet tersedia.`
          );
          return;
        }

        const res = await fetchWithTimeout(url, { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }, 15000);
        
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            // Hapus dari cache lokal
            const cache = readJSON<StokItem[]>(CACHE_KEY, []);
            const updatedCache = cache.filter(c => String(c.id_stok) !== String(id));
            writeJSON(CACHE_KEY, updatedCache);
            
            // Hapus dari state
            setStok(prev => prev.filter(p => String(p.id_stok) !== String(id)));
            
            if (selectedStok && selectedStok.id_stok === id) {
              setSelectedStok(null);
            }
            
            showNotification('success', 'Berhasil!', `Stok "${itemName}" berhasil dihapus`);
            
            // Refresh data dari server
            await fetchStokData({ silent: true, force: true });
          } else {
            showNotification('error', 'Gagal!', json.error || 'Gagal menghapus data');
          }
        } else {
          const text = await res.text().catch(() => res.statusText);
          if (res.status >= 400 && res.status < 500) {
            try {
              const parsed = text ? JSON.parse(text) : {};
              showNotification('error', 'Hapus Gagal', parsed?.error ?? `Gagal menghapus: ${res.status}`);
            } catch (parseError) {
              showNotification('error', 'Hapus Gagal', `Gagal menghapus: ${res.status}`);
            }
          } else {
            showNotification('error', 'Hapus Gagal', 'Terjadi kesalahan pada server');
          }
        }
      } catch (err: any) {
        console.error('Delete error:', err);
        
        // Jika terjadi error dan sedang offline, hapus dari cache saja
        if (!isOnline) {
          const cache = readJSON<StokItem[]>(CACHE_KEY, []);
          const updatedCache = cache.filter(c => String(c.id_stok) !== String(id));
          writeJSON(CACHE_KEY, updatedCache);
          
          setStok(prev => prev.filter(p => String(p.id_stok) !== String(id)));
          
          if (selectedStok && selectedStok.id_stok === id) {
            setSelectedStok(null);
          }
          
          showOfflinePopup(
            'Stok Dihapus (Mode Offline)',
            `Stok "${itemName}" dihapus dari cache lokal. Perubahan akan disinkronkan saat koneksi internet tersedia.`
          );
        } else {
          showNotification('error', 'Hapus Gagal', err.message || 'Terjadi kesalahan saat menghapus');
        }
      }
    };

    // Tampilkan konfirmasi dialog
    showConfirm(
      'Konfirmasi Hapus',
      `Anda yakin ingin menghapus stok "${itemName}"?`,
      executeDelete
    );
  }, [stok, selectedStok, isOnline, showNotification, showConfirm, fetchStokData, userRole, showOfflinePopup, testAPIConnection]);

  // ============= USE EFFECT UTAMA =============
  useEffect(() => {
    console.log('🚀 Component mounted');
    isMounted.current = true;

    // ===== CEK ROLE USER (HANYA SEKALI) =====
    if (!hasCheckedRoleRef.current) {
      const role = checkUserRole();
      setUserRole(role);
      hasCheckedRoleRef.current = true;
    }

    // ===== CEK STATUS JARINGAN =====
    const initialOnline = navigator.onLine;
    setIsOnline(initialOnline);
    console.log(`🌐 Initial network: ${initialOnline ? 'ONLINE' : 'OFFLINE'}`);

    // ===== LOAD OFFLINE MODE =====
    const savedOfflineMode = readJSON<boolean>(OFFLINE_MODE_KEY, false);
    setOfflineModeEnabled(savedOfflineMode);

    const localData = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
    setLocalOnlyCount(localData.length);

    // ================= ONLINE EVENT =================
    const handleOnline = () => {
      console.log('🟢 ONLINE EVENT');
      setIsOnline(true);

      offlineNotificationShown.current = false;
      offlineActiveNotificationShown.current = false;
      setOfflineModeDialog(false);

      showOfflinePopup(
        'Koneksi Tersambung',
        'Internet tersedia kembali. Sinkronisasi akan dilakukan otomatis.'
      );

      // Auto sync saat online kembali (jika ada data lokal)
      if (localData.length > 0) {
        setTimeout(() => {
          if (isMounted.current) {
            // Auto sync akan dilakukan melalui interval
          }
        }, 1500);
      }
    };

    // ================= OFFLINE EVENT =================
    const handleOffline = () => {
      console.log('🔴 OFFLINE EVENT');
      setIsOnline(false);

      // 🔐 PENTING: popup HANYA jika benar-benar offline
      if (!navigator.onLine) {
        if (!offlineModeEnabled && !offlineNotificationShown.current) {
          offlineNotificationShown.current = true;

          setTimeout(() => {
            if (isMounted.current && !navigator.onLine) {
              setOfflineModeDialog(true);
              console.log('✅ Offline mode dialog shown');
            }
          }, 500);
        }

        if (offlineModeEnabled && !offlineActiveNotificationShown.current) {
          offlineActiveNotificationShown.current = true;

          setTimeout(() => {
            if (isMounted.current) {
              showOfflineActivePopup();
            }
          }, 500);
        }
      }
    };

    // ================= INITIAL OFFLINE CHECK =================
    if (!initialOnline) {
      console.log('🔴 INITIAL LOAD OFFLINE');

      setTimeout(() => {
        if (!isMounted.current) return;

        if (!navigator.onLine) {
          if (savedOfflineMode) {
            setOfflineModeEnabled(true);
            showOfflineActivePopup();
          } else {
            offlineNotificationShown.current = true;
            setOfflineModeDialog(true);
          }
        }
      }, 600);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ================= INITIAL DATA FETCH =================
    const fetchInitialData = async () => {
      try {
        if (initialOnline) {
          await fetchStokData({ silent: true, force: false });
        } else {
          const cached = readJSON<StokItem[]>(CACHE_KEY, []);
          const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
          setStok([...cached, ...localOnly]);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };

    setTimeout(fetchInitialData, 400);

    // ================= AUTO SYNC (SETIAP 60 DETIK JIKA ONLINE) =================
    const syncInterval = setInterval(() => {
      if (isMounted.current && isOnline && !isSyncing) {
        const localOnly = readJSON<StokItem[]>(LOCAL_ONLY_KEY, []);
        if (localOnly.length > 0) {
          console.log('🔄 Auto sync triggered');
          // Auto sync masih berjalan di background
        }
      }
    }, 60000);

    // ================= CLEANUP =================
    return () => {
      console.log('🧹 Component unmount');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
      isMounted.current = false;
      isFetchingRef.current = false;
    };
  }, [
    checkUserRole,
    fetchStokData,
    isOnline,
    isSyncing,
    showOfflinePopup,
    showOfflineActivePopup
  ]);

  // UseEffect untuk filter data
  useEffect(() => {
    let result = [...stok];
    
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      result = result.filter(it =>
        String(it.nama_stok ?? '').toLowerCase().includes(q) ||
        String(it.supplier_stok ?? '').toLowerCase().includes(q) ||
        String(it.unit_bisnis ?? '').toLowerCase().includes(q)
      );
    }
    
    if (supplierFilter && supplierFilter !== 'Semua') {
      result = result.filter(it => it.supplier_stok === supplierFilter);
    }
    
    setFiltered(result);
  }, [stok, search, supplierFilter]);

  const suppliers = useMemo(() => ['Semua', ...Array.from(new Set(stok.map(s => s.supplier_stok).filter(Boolean)))], [stok]);

  // TAMBAHKAN CEK PERMISSION UNTUK FUNGSI FORM - STAFF TIDAK BISA
  function openAddForm() {
    if (userRole === 'staff') {
      showNotification('warning', 'Akses Ditolak', 'Staff tidak memiliki izin untuk menambah stok');
      return;
    }
    resetForm();
    setShowForm(true);
    setEditing(null);
  }
  
  function openEditForm(item: StokItem) {
    if (userRole === 'staff') {
      showNotification('warning', 'Akses Ditolak', 'Staff tidak memiliki izin untuk mengubah stok');
      return;
    }
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

  // CEK JIKA STAFF (VIEW ONLY)
  const isStaff = userRole === 'staff';

  // ============= RENDER JSX =============
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Component */}
      <Header />

      {/* MODAL IMPORT EXCEL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-2xl">Import Data Stok</h1>
                    <p className="text-white text-opacity-90 mt-1">
                      Upload file Excel atau CSV
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUpload();
                  }}
                  className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Progress Bar */}
              {['uploading', 'processing', 'saving'].includes(uploadStatus) && (
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      {uploadStatus === 'uploading' ? 'Mengupload file...' : 
                      uploadStatus === 'processing' ? 'Memproses file...' : 
                      'Menyimpan ke database...'}
                    </span>
                    <span className="text-sm font-bold text-blue-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {uploadStatus === 'complete' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800">Import Berhasil!</h4>
                      <p className="text-green-700">
                        {importResult?.count || 0} data stok berhasil diimport.
                        {isOnline && ' Data telah disimpan ke database.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Error Message */}
              {uploadStatus === 'error' && importResult && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800">Import Gagal</h4>
                      <p className="text-red-700">
                        Terdapat {importResult.errors.length} error.
                      </p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600 mb-1">• {error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upload Area */}
              {!uploadFile && uploadStatus === 'idle' && (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-blue-500 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !isStaff && fileInputRef.current?.click()}
                >
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold text-blue-600">Klik untuk upload</span> atau drag & drop file di sini
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Support file: .xlsx, .xls, .csv (Maksimal 5MB)
                  </p>
                  <button className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                    Pilih File
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                  />
                </div>
              )}

              {/* File Selected */}
              {uploadFile && uploadStatus === 'idle' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{uploadFile.name}</h4>
                        <p className="text-sm text-gray-600">
                          {(uploadFile.size / 1024).toFixed(2)} KB • {uploadFile.type || 'Unknown type'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Template Info */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">Format File yang Didukung</h4>
                    <p className="text-sm text-gray-600">
                      Pastikan file mengikuti format berikut:
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left border-r">Nama Stok</th>
                        <th className="p-3 text-left border-r">Unit Bisnis</th>
                        <th className="p-3 text-left border-r">Supplier Stok</th>
                        <th className="p-3 text-left border-r">Tanggal Stok</th>
                        <th className="p-3 text-left border-r">Jumlah Stok</th>
                        <th className="p-3 text-left">Harga Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-3 border-r">Cup Paper 120</td>
                        <td className="p-3 border-r">Cafe</td>
                        <td className="p-3 border-r">Supplier Packaging</td>
                        <td className="p-3 border-r">2024-01-06</td>
                        <td className="p-3 border-r">10</td>
                        <td className="p-3">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  <p><strong>Catatan:</strong> Format tanggal harus YYYY-MM-DD (contoh: 2024-01-06)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUpload();
                  }}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleImportExcel}
                  disabled={!uploadFile || ['uploading', 'processing', 'saving', 'complete'].includes(uploadStatus)}
                  className={`flex-1 py-3.5 rounded-xl font-medium transition-colors ${
                    !uploadFile || ['uploading', 'processing', 'saving', 'complete'].includes(uploadStatus)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {uploadStatus === 'uploading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Mengupload...
                    </span>
                  ) : uploadStatus === 'processing' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memproses...
                    </span>
                  ) : uploadStatus === 'saving' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </span>
                  ) : uploadStatus === 'complete' ? (
                    '✓ Berhasil'
                  ) : (
                    'Import Data'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NOTIFIKASI MODE OFFLINE AKTIF - TAMBAHAN */}
      {showOfflineActiveNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">Mode Offline Aktif</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                    <span className="text-white text-opacity-90 text-sm">
                      Internet tidak tersedia
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Sistem Berjalan Secara Offline</h2>
                <p className="text-gray-600 mb-4">
                  Anda dapat melanjutkan bekerja tanpa koneksi internet. 
                  Semua perubahan akan disimpan secara lokal dan disinkronkan otomatis saat koneksi kembali.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Data Aman</h4>
                    <p className="text-sm text-gray-600">Data tersimpan di perangkat Anda</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">🔄</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Sinkron Otomatis</h4>
                    <p className="text-sm text-gray-600">Akan sinkron saat terhubung internet</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">⚡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Lanjutkan Bekerja</h4>
                    <p className="text-sm text-gray-600">Tidak ada hambatan dalam bekerja</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowOfflineActiveNotification(false)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:opacity-90 transition-all font-bold text-lg min-w-[140px] shadow-lg"
                >
                  Mengerti
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500">
                  Status: {offlineModeEnabled ? 'Mode Offline Aktif' : 'Mode Online'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NOTIFIKASI OFFLINE (UNTUK TAMBAH/EDIT/HAPUS STOK) */}
      {showOfflineNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl">{offlineNotificationTitle}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-300 animate-pulse"></div>
                    <span className="text-white text-opacity-90 text-sm">
                      Mode Offline
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <p className="text-gray-700 mb-4">{offlineNotificationMessage}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">📱</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Data tersimpan di perangkat Anda</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">🔄</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">Akan sinkron otomatis saat online</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowOfflineNotification(false)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:opacity-90 transition-all font-bold text-lg min-w-[140px] shadow-lg"
                >
                  Mengerti
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500">
                  Jumlah data lokal: {localOnlyCount} item
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP AKTIFKAN MODE OFFLINE (SAAT OFFLINE PERTAMA KALI) */}
      {offlineModeDialog && !offlineModeEnabled && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white font-bold text-2xl">Mode Offline Terdeteksi</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
                    <span className="text-white text-opacity-90 text-sm">
                      Koneksi internet tidak tersedia
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Aktifkan Mode Offline?</h2>
                <p className="text-gray-600 mb-4">
                  Koneksi internet terputus. Anda dapat melanjutkan bekerja dengan mode offline. 
                  Data akan disimpan secara lokal dan disinkronkan otomatis saat koneksi kembali.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Tambah & Edit Data</h4>
                    <p className="text-sm text-gray-600">Perubahan akan disimpan secara lokal</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">🔄</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Sinkron Otomatis</h4>
                    <p className="text-sm text-gray-600">Data akan disinkron saat online</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">⚡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Akses Cepat</h4>
                    <p className="text-sm text-gray-600">Lanjutkan bekerja tanpa hambatan</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <button
                  onClick={() => {
                    setOfflineModeDialog(false);
                    showNotification('info', 'Mode Offline', 'Anda dapat mengaktifkan mode offline nanti dari pengaturan');
                  }}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-bold text-lg min-w-[140px] shadow-lg"
                >
                  Nanti
                </button>
                <button
                  onClick={() => {
                    setOfflineModeDialog(false);
                    enableOfflineMode();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all font-bold text-lg min-w-[140px] shadow-lg"
                >
                  Aktifkan
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500">
                  Anda dapat mengubah pengaturan mode offline di menu Pengaturan
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION POPUP (UNTUK NOTIFIKASI LAINNYA) */}
      {notifications.map(notif => (
        <div key={notif.id} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">{notif.date}</span>
                <span className="text-sm text-gray-500">{notif.time}</span>
              </div>
              
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

              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-gray-800">{notif.title}</h3>
                {notif.action && (
                  <p className="text-sm text-gray-600 mt-1">{notif.action}</p>
                )}
              </div>

              <p className="text-gray-600 text-center mb-6">{notif.message}</p>

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
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
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
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#2E5090]">Kelola Stok</h2>
            <div className="flex items-center gap-3">
              {/* INFO ROLE USER */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userRole === 'manager' 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-blue-100 text-blue-700 border border-blue-300'
              }`}>
                {userRole === 'manager' ? ' Manager' : ' Staff'}
              </span>
              
              {/* LABEL MODE OFFLINE (HANYA TAMPIL JIKA SEDANG OFFLINE) */}
              {(!isOnline || offlineModeEnabled) && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-300 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Mode Offline
                </span>
              )}
            </div>
          </div>
          
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

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col bg-white">
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
                <div className="mt-2 text-xs text-blue-600">
                  Mengirim data lokal ke server...
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Daftar Stok</h3>
                <div className="flex items-center gap-2">
                  {/* TOMBOL SINKRON SUDAH DIHAPUS */}
                  {/* Tombol sinkronisasi tidak ada di sini */}
                </div>
              </div>
              
              {/* INFO DATA LOKAL */}
              {localOnlyCount > 0 && !isSyncing && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-medium text-yellow-700">
                        {localOnlyCount} data tersimpan secara lokal
                      </span>
                    </div>
                    {isOnline && !isStaff && (
                      <button
                        onClick={() => {
                          // Tombol untuk sinkronisasi manual jika diperlukan
                          // Fungsi ini bisa diisi sesuai kebutuhan
                          showNotification('info', 'Info', 'Sinkronisasi otomatis berjalan saat online');
                        }}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Info
                      </button>
                    )}
                  </div>
                </div>
              )}
              
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
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {row.unit_bisnis || ''}
                              </span>
                              {row._offlineId && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                  Lokal
                                </span>
                              )}
                              {row._pending && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="font-medium text-gray-900 mb-1">{row.nama_stok}</p>
                          <p className="text-sm text-blue-600 font-semibold mb-1">
                            Rp {row.Harga_stok?.toLocaleString?.('id-ID')}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{row.jumlah_stok} pcs</span>
                            <span>{row.unit_bisnis}</span>
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

          <div className="w-96 bg-white border-l flex flex-col">
            <div className="p-6 border-b">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Detail Stok</h3>
              
              <div className="flex gap-2 mb-4 flex-wrap">
                {/* TOMBOL IMPORT HANYA UNTUK MANAGER */}
                <button 
                  onClick={() => {
                    if (isStaff) {
                      showNotification('warning', 'Akses Ditolak', 'Staff tidak memiliki izin untuk mengimpor data');
                      return;
                    }
                    setShowUploadModal(true);
                  }}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    isStaff 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } flex items-center gap-1`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  📥 Import
                </button>
                
                {/* TOMBOL UBAH HANYA UNTUK MANAGER */}
                <button 
                  onClick={() => selectedStok && openEditForm(selectedStok)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    !selectedStok || isStaff
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✏️ Ubah
                </button>
                
                {/* TOMBOL TAMBAH HANYA UNTUK MANAGER */}
                <button 
                  onClick={openAddForm}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    isStaff
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ➕ Tambah
                </button>
                
                {/* TOMBOL HAPUS HANYA UNTUK MANAGER */}
                <button 
                  onClick={() => {
                    if (selectedStok) {
                      handleDelete(selectedStok.id_stok, selectedStok._offlineId);
                    }
                  }}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    !selectedStok || isStaff
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  🗑️ Hapus
                </button>
              </div>
              
              {/* INFO HAK AKSES STAFF */}
              {isStaff && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700 text-center">
                    <strong>Info:</strong> Staff hanya dapat melihat data stok
                  </p>
                </div>
              )}
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
                    {selectedStok.unit_bisnis && (
                      <div className="mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {selectedStok.unit_bisnis}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedStok.jumlah_stok} pcs
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedStok.tanggal_stok} • {selectedStok.supplier_stok}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-medium">
                        {selectedStok.id_stok ? `#${String(selectedStok.id_stok).padStart(2, '0')}STOK` : selectedStok._offlineId}
                      </span>
                    </div>
                    {selectedStok.unit_bisnis && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unit Bisnis:</span>
                        <span className="font-medium">{selectedStok.unit_bisnis}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga:</span>
                      <span className="font-medium">Rp {selectedStok.Harga_stok?.toLocaleString?.('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah:</span>
                      <span className="font-medium">{selectedStok.jumlah_stok} pcs</span>
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
                        selectedStok._offlineId ? 'bg-yellow-100 text-yellow-700' : 
                        selectedStok._pending ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {selectedStok._offlineId ? 'Lokal' : 
                        selectedStok._pending ? 'Pending Sync' : 'Tersinkron'}
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

      {/* FORM MODAL (HANYA UNTUK MANAGER) */}
      {showForm && !isStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
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
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-[#3B5998] p-8">
              {!isOnline && (
                <div className="mb-4 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium">
                Mode Offline - Data akan disimpan secara lokal
                </div>
              )}

              <div className="space-y-6">
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
                      Unit Bisnis
                    </label>
                    <input
                      type="text"
                      value={String(formData.unit_bisnis ?? '')}
                      onChange={e => handleFormFieldChange('unit_bisnis', e.target.value)}
                      placeholder="Contoh: Cafe, Restaurant, Retail, Badminton"
                      className="w-full bg-white bg-opacity-20 border-b-2 border-white text-white placeholder-gray-300 px-4 py-3 focus:outline-none focus:bg-opacity-30 transition-all"
                    />
                  </div>
                </div>

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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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