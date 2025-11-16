'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Header from '@/components/layout/header';

type UserRole = 'manager' | 'staff';

interface User {
  role: UserRole;
  name?: string;
}

type StokItem = {
  id_stok?: number;
  nama_stok: string;
  satuan_stok: string;
  supplier_stok: string;
  tanggal_stok: string;
  jumlah_stok: number;
  Harga_stok: number;
};

type Notif = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
};

function uid(prefix = 'u_') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getCurrentUser(): User {
  try {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      return JSON.parse(userStr);
    }

    const username = localStorage.getItem('username');
    if (!username) return { role: 'staff', name: 'Guest' };

    const usernameLower = username.toLowerCase();
    
    if (usernameLower === 'manager' || usernameLower.includes('manager')) {
      return { role: 'manager', name: username };
    } else {
      return { role: 'staff', name: username };
    }
  } catch {
    return { role: 'staff', name: 'Guest' };
  }
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

export default function LaporanStokPage() {
  const [currentUser, setCurrentUser] = useState<User>({ role: 'staff' });
  const [stok, setStok] = useState<StokItem[]>([]);
  const [filtered, setFiltered] = useState<StokItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [search, setSearch] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('Semua');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showFilterModal, setShowFilterModal] = useState(false);

  const isReadOnly = true;
  const canExport = currentUser.role === 'manager';
  const canGoBack = currentUser.role === 'manager'; // Hanya manager yang bisa back

  const showNotification = useCallback((type: Notif['type'], text: string) => {
    const newNotif: Notif = { id: uid('notif_'), type, text };
    setNotifications(prev => [...prev, newNotif]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 3000);
  }, []);

  const fetchLaporanData = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const url = `/api/stok?${params.toString()}`;
      const res = await fetchWithTimeout(url, { headers: { 'Cache-Control': 'no-cache' } }, 12000);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json || !json.success || !Array.isArray(json.data)) {
        throw new Error('Invalid response');
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

      setStok(rows);
      showNotification('success', 'Data laporan dimuat');
    } catch (err) {
      showNotification('error', 'Gagal memuat data laporan');
      setStok([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, dateFrom, dateTo, showNotification]);

  const handleBack = () => {
    if (canGoBack) {
      window.history.back();
    } else {
      showNotification('info', 'Hanya manager yang dapat kembali ke halaman sebelumnya');
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    fetchLaporanData();
  }, [fetchLaporanData]);

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

    if (dateFrom) {
      result = result.filter(it => it.tanggal_stok >= dateFrom);
    }

    if (dateTo) {
      result = result.filter(it => it.tanggal_stok <= dateTo);
    }
    
    setFiltered(result);
  }, [stok, search, supplierFilter, dateFrom, dateTo]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('Rp', 'Rp ');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  const totalStok = filtered.reduce((sum, item) => sum + item.jumlah_stok, 0);
  const totalNilai = filtered.reduce((sum, item) => sum + (item.jumlah_stok * item.Harga_stok), 0);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    if (!canExport) {
      showNotification('error', '❌ Anda tidak memiliki izin untuk export');
      return;
    }

    const headers = ['ID', 'Nama Stok', 'Supplier', 'Jumlah', 'Satuan', 'Harga', 'Total Nilai', 'Tanggal'];
    const rows = filtered.map(item => [
      item.id_stok ?? '-',
      item.nama_stok,
      item.supplier_stok,
      item.jumlah_stok,
      item.satuan_stok,
      item.Harga_stok,
      item.jumlah_stok * item.Harga_stok,
      item.tanggal_stok
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-stok-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showNotification('success', '✓ Laporan berhasil diexport');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="p-8">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Laporan Stok</h1>
            <div className="bg-white rounded-lg p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <span className="ml-3 text-gray-600 font-medium">Memuat data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      {/* Notifications */}
      {notifications.map(notif => (
        <div key={notif.id} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-8 text-center">
              <div className={`text-6xl mb-4 ${
                notif.type === 'success' ? 'text-green-500' :
                notif.type === 'error' ? 'text-red-500' : 'text-blue-500'
              }`}>
                {notif.type === 'success' ? '✓' : notif.type === 'error' ? '✗' : 'ℹ'}
              </div>
              <p className="text-gray-800 mb-6 text-lg">{notif.text}</p>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className={`px-8 py-2 rounded-lg font-semibold text-white ${
                  notif.type === 'success' ? 'bg-green-500' :
                  notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="p-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              {/* Tombol Back - hanya untuk manager */}
              {canGoBack ? (
                <button 
                  onClick={handleBack}
                  className="text-white hover:bg-blue-600 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              ) : (
                // Placeholder untuk menjaga layout konsisten
                <div className="w-10 h-10"></div>
              )}
              <h1 className="text-2xl font-bold text-white">Laporan Stok</h1>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </button>
              {canExport && (
                <button 
                  onClick={handleExportCSV}
                  className="px-6 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              )}
            </div>
          </div>

          {/* Total Sisa Stok Card */}
          <div className="bg-white rounded-lg p-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Total Sisa Stok</h2>
                <p className="text-sm text-gray-600">Total keseluruhan stok</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-700">
                  {totalStok}
                </div>
                <p className="text-sm text-gray-600 mt-1">dari {filtered.length} Transaksi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kondisi jika tidak ada data */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium text-gray-600">Tidak ada data stok</p>
            <p className="text-sm text-gray-500 mt-2">
              Data stok akan muncul ketika ada transaksi di database
            </p>
          </div>
        ) : (
          <>
            {/* Tabel Stok */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-900">
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Nama Produk
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Sisa Stok
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Supplier
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Harga
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {currentData.map((item, index) => (
                      <tr key={item.id_stok ?? index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(item.tanggal_stok)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-700">
                          {item.nama_stok}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.jumlah_stok}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.supplier_stok}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(item.Harga_stok)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-700 hover:text-blue-800'
                  }`}
                >
                  &lt; Prev
                </button>
                <span className="text-sm text-gray-600">
                  {currentPage}/{totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`text-sm font-medium transition-colors ${
                    currentPage === totalPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-700 hover:text-blue-800'
                  }`}
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}