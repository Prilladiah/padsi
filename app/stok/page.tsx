'use client';

import { useState, useEffect } from 'react';
import { StokItem } from '@/types';
import { auth } from '@/lib/auth';
import StokTable from '@/components/stok/stoktable';
import StokForm from '@/components/stok/stokform';
import OfflineDialog from '@/components/stok/offlinedialog';
import { useOfflineMode } from '@/components/hooks/useofflinemode';
import { useLocalStorage } from '@/components/hooks/uselocalstorage';
import Header from '@/components/layout/header'; // Import header baru

// Sample data
const initialStokData: StokItem[] = [
  {
    id: '1',
    nama: 'Botol Plastik PET',
    supplier: 'Plastik',
    jumlah: 100,
    satuan: 'kg',
    harga: 5000,
    tanggal_masuk: '2024-01-15'
  },
  {
    id: '2',
    nama: 'Kardus Bekas',
    supplier: 'Kertas',
    jumlah: 50,
    satuan: 'kg',
    harga: 3000,
    tanggal_masuk: '2024-01-16'
  }
];

export default function StokPage() {
  // Gunakan localStorage untuk persist data
  const [stokData, setStokData] = useLocalStorage<StokItem[]>('stokData', initialStokData);
  const [filteredData, setFilteredData] = useState<StokItem[]>(stokData);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StokItem | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('Semua');
  const isManager = auth.isManager();

  // Gunakan hook offline mode
  const {
    isOnline,
    offlineMode,
    showOfflineDialog,
    enableOfflineMode,
    cancelOfflineMode
  } = useOfflineMode();

  // Effect untuk filter data berdasarkan search dan kategori
  useEffect(() => {
    let result = stokData;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.nama.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query) ||
        item.satuan.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterSupplier !== 'Semua') {
      result = result.filter(item => item.supplier === filterSupplier);
    }

    setFilteredData(result);
  }, [searchQuery, filterSupplier, stokData]);

  // Get unique categories for filter
  const categories = ['Semua', ...new Set(stokData.map(item => item.supplier))];

  // Handler untuk clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setFilterSupplier('Semua');
  };

  // Handler untuk tambah stok
  const handleAdd = () => {
    if (!isOnline && !offlineMode) {
      return;
    }
    setEditingItem(undefined);
    setShowForm(true);
  };

  // Handler untuk edit stok
  const handleEdit = (item: StokItem) => {
    if (!isOnline && !offlineMode) {
      return;
    }
    setEditingItem(item);
    setShowForm(true);
  };

  // Handler untuk hapus stok
  const handleDelete = (id: string) => {
    if (!isOnline && !offlineMode) {
      return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      setStokData(prevData => prevData.filter(item => item.id !== id));
    }
  };

  // Handler submit form
  const handleSubmit = (data: Omit<StokItem, 'id'>) => {
    if (editingItem) {
      // Update item yang sudah ada
      setStokData(prevData => prevData.map(item => 
        item.id === editingItem.id 
          ? { ...data, id: editingItem.id }
          : item
      ));
    } else {
      // Tambah item baru
      const newItem: StokItem = {
        ...data,
        id: Date.now().toString()
      };
      setStokData(prevData => [...prevData, newItem]);
    }
    setShowForm(false);
    setEditingItem(undefined);
  };

  // Handler cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Baru dengan Profile di Kanan Atas */}
      <Header />
      
      <div className="p-6">
        {/* Status Indicator */}
        {!isOnline && offlineMode && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center animate-pulse">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <span className="text-yellow-800 font-medium">Mode offline aktif</span>
              <span className="text-yellow-600 text-sm ml-2">
                Data tersimpan secara lokal • {stokData.length} items
              </span>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {!isOnline && !offlineMode && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            <span className="text-red-800">
              Tidak terhubung ke internet • Aktifkan mode offline untuk melanjutkan
            </span>
          </div>
        )}

        {/* Page Title */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kelola Stok</h1>
          </div>
          
          {isManager && (
            <button
              onClick={handleAdd}
              disabled={!isOnline && !offlineMode}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                (!isOnline && !offlineMode) 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <span>+ Tambah Stok</span>
              {!isOnline && offlineMode && (
                <span className="text-xs bg-yellow-500 px-1 rounded">Offline</span>
              )}
            </button>
          )}
        </div>

        {/* SEARCH COMPONENT */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari barang, supplier, atau satuan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-48">
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            {(searchQuery || filterSupplier !== 'Semua') && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Search Results Info */}
          {(searchQuery || filterSupplier !== 'Semua') && (
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {filteredData.length} dari {stokData.length} item
                {searchQuery && (
                  <span> untuk "<span className="font-medium">{searchQuery}</span>"</span>
                )}
                {filterSupplier !== 'Semua' && (
                  <span> dalam supplier <span className="font-medium">{filterSupplier}</span></span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-gray-900">{stokData.length}</div>
            <div className="text-gray-500 text-sm">Total Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-gray-900">
              {new Set(stokData.map(item => item.supplier)).size}
            </div>
            <div className="text-gray-500 text-sm">Sisa</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-gray-900">
              {stokData.reduce((sum, item) => sum + item.jumlah, 0)}
            </div>
            <div className="text-gray-500 text-sm">Total Stok</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </div>
            <div className="text-gray-500 text-sm">Status</div>
          </div>
        </div>

        {/* Tabel Stok */}
        <StokTable 
          data={filteredData} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          isOffline={!isOnline && offlineMode}
        />

        {/* Empty State */}
        {filteredData.length === 0 && (searchQuery || filterSupplier !== 'Semua') && (
          <div className="bg-white rounded-lg shadow border p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data yang ditemukan</h3>
            <p className="text-gray-500 mb-4">
              Coba ubah kata kunci pencarian atau filter supplier Anda.
            </p>
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tampilkan Semua Data
            </button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <StokForm
            item={editingItem}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* POPUP OFFLINE DIALOG */}
        {showOfflineDialog && (
          <OfflineDialog 
            onEnable={enableOfflineMode}
            onCancel={cancelOfflineMode}
          />
        )}
      </div>
    </div>
  );
}