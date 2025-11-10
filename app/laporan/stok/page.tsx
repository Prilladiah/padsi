// app/laporan/stok/page.tsx - READ ONLY VERSION
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Header from '@/components/layout/header'; // Tambahkan import Header

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

// Helper: Get current user from localStorage
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

  // ===== PERMISSION - LAPORAN ADALAH READ-ONLY =====
  const isReadOnly = true; // Semua role hanya bisa VIEW
  const canExport =  currentUser.role === 'manager';

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

  // Load user role
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

  const suppliers = ['Semua', ...Array.from(new Set(stok.map(s => s.supplier_stok).filter(Boolean)))];

  const totalStok = filtered.reduce((sum, item) => sum + item.jumlah_stok, 0);
  const totalNilai = filtered.reduce((sum, item) => sum + (item.jumlah_stok * item.Harga_stok), 0);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Tambahkan Header di sini */}
      <Header />
      
      <div className="p-4 md:p-6">
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

          {/* Header Content (yang sebelumnya di header utama) */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan Stok</h1>
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                    👤 {currentUser.role.toUpperCase()}
                  </span>
                </div>

                {/* Read-Only Info Banner */}
                <div className="mt-3 flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm font-medium">
                    Laporan ini hanya untuk melihat data.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchLaporanData()}
                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  🔄 Refresh
                </button>

                {canExport && (
                  <>
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
                    >
                      📥 Export CSV
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cari</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 Cari nama stok atau supplier..."
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier</label>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
                >
                  {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dari Tanggal</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sampai Tanggal</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Items</p>
                  <p className="text-3xl font-bold">{filtered.length}</p>
                </div>
                <div className="text-5xl opacity-50">📦</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Total Stok</p>
                  <p className="text-3xl font-bold">{totalStok.toLocaleString()}</p>
                </div>
                <div className="text-5xl opacity-50">📊</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Total Nilai</p>
                  <p className="text-2xl font-bold">Rp {totalNilai.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-5xl opacity-50">💰</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden print:shadow-none">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Memuat laporan...</p>
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
                      <th className="px-4 py-3 text-right font-bold text-gray-700 border-b-2">Total Nilai</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-700 border-b-2">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-gray-500">
                          <div className="text-6xl mb-4">📋</div>
                          <p className="text-lg font-medium">Tidak ada data laporan</p>
                          <p className="text-sm mt-2">Sesuaikan filter untuk melihat data</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row, idx) => (
                        <tr
                          key={row.id_stok ?? idx}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-700 font-medium">{row.id_stok ?? '-'}</td>
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
                          <td className="px-4 py-3 text-right text-gray-800 font-bold">
                            Rp {(row.jumlah_stok * row.Harga_stok).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{row.tanggal_stok}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-gray-800">TOTAL:</td>
                      <td className="px-4 py-3 text-right text-blue-600">{totalStok.toLocaleString()}</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right text-purple-600">
                        Rp {totalNilai.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 bg-white rounded-xl shadow-md p-4 print:hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <div className="text-gray-700 font-medium">
                📊 Menampilkan <span className="font-bold text-blue-600">{filtered.length}</span> dari {stok.length} total items
              </div>
              <div className="text-gray-500 text-xs">
                Laporan dibuat: {new Date().toLocaleString('id-ID')}
              </div>
            </div>
          </div>

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

            @media print {
              body {
                background: white;
              }
              .print\\:hidden {
                display: none !important;
              }
              .print\\:shadow-none {
                box-shadow: none !important;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}