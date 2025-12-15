'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/header';

interface StokData {
  id_stok: number;
  nama_stok: string;
  unit_bisnis: string;
  supplier_stok: string;
  tanggal_stok: string;
  jumlah_stok: number;
  Harga_stok: number;
  metode_pembayaran?: string;
  status_stok?: string;
}

interface ExcelDataRow {
  'No': number;
  'ID Stok': number | string;
  'Tanggal': string;
  'Nama Stok': string;
  'Unit Bisnis': string;
  'Jumlah': number;
  'Harga Satuan': number;
  'Total Pengeluaran': number;
  'Supplier': string;
  'Metode Pembayaran': string;
  'Status': string;
}

export default function LaporanPengeluaranPage() {
  const [data, setData] = useState<StokData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [filterUnitBisnis, setFilterUnitBisnis] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch data stok untuk laporan pengeluaran
  useEffect(() => {
    async function fetchStokData() {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔄 Fetching stok data for pengeluaran report...');
        
        // Ambil semua data stok dengan pagination yang lebih besar
        const response = await fetch('/api/stok?limit=1000');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Stok API Error:', errorText);
          throw new Error(`Gagal mengambil data stok: HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 Stok Data fetched:', result.data?.length || 0, 'records');
        
        if (result.success && Array.isArray(result.data)) {
          // Filter hanya stok dengan harga > 0 (stok yang memerlukan pengeluaran)
          const stokWithExpense = result.data.filter((stok: StokData) => 
            stok.Harga_stok > 0 && stok.jumlah_stok > 0
          );
          
          console.log('💰 Stok with expense:', stokWithExpense.length, 'records');
          setData(stokWithExpense);
        } else {
          throw new Error('Format data stok tidak valid');
        }
        
      } catch (err: unknown) {
        console.error('❌ Fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError('Gagal memuat data: ' + errorMessage);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStokData();
  }, []);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterUnitBisnis, filterStatus, filterSupplier, startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('Rp', 'Rp ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  // Filter data
  const filteredData = data.filter(item => {
    const unitMatch = filterUnitBisnis === 'all' || item.unit_bisnis === filterUnitBisnis;
    const statusMatch = filterStatus === 'all' || item.status_stok === filterStatus;
    const supplierMatch = filterSupplier === 'all' || item.supplier_stok === filterSupplier;
    
    // Date filter
    let dateMatch = true;
    if (startDate) {
      const itemDate = new Date(item.tanggal_stok);
      const filterStartDate = new Date(startDate);
      dateMatch = dateMatch && itemDate >= filterStartDate;
    }
    if (endDate) {
      const itemDate = new Date(item.tanggal_stok);
      const filterEndDate = new Date(endDate);
      dateMatch = dateMatch && itemDate <= filterEndDate;
    }
    
    return unitMatch && statusMatch && supplierMatch && dateMatch;
  });

  // Get unique values untuk filter
  const uniqueUnitBisnis = Array.from(new Set(data.map(item => item.unit_bisnis).filter(Boolean)));
  const uniqueSuppliers = Array.from(new Set(data.map(item => item.supplier_stok).filter(Boolean)));
  const uniqueStatus = ['Tersedia', 'Habis', 'Dalam Pesanan'];

  const totalPengeluaran = filteredData.reduce((sum, item) => 
    sum + (item.jumlah_stok * item.Harga_stok), 0
  );
  
  const totalItems = filteredData.reduce((sum, item) => sum + item.jumlah_stok, 0);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Fungsi untuk download Excel
  const downloadExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Prepare data untuk Excel
      const excelData: ExcelDataRow[] = filteredData.map((item, index) => ({
        'No': index + 1,
        'ID Stok': item.id_stok || '-',
        'Tanggal': formatDate(item.tanggal_stok),
        'Nama Stok': item.nama_stok || '-',
        'Unit Bisnis': item.unit_bisnis || '-',
        'Jumlah': item.jumlah_stok || 0,
        'Harga Satuan': item.Harga_stok || 0,
        'Total Pengeluaran': item.jumlah_stok * item.Harga_stok,
        'Supplier': item.supplier_stok || '-',
        'Metode Pembayaran': item.metode_pembayaran || 'Tunai',
        'Status': item.status_stok || 'Tersedia'
      }));

      // Tambahkan baris total
      excelData.push({
        'No': filteredData.length + 1,
        'ID Stok': '',
        'Tanggal': '',
        'Nama Stok': 'TOTAL PENGELUARAN',
        'Unit Bisnis': '',
        'Jumlah': totalItems,
        'Harga Satuan': 0,
        'Total Pengeluaran': totalPengeluaran,
        'Supplier': '',
        'Metode Pembayaran': '',
        'Status': ''
      });

      // Tambahkan baris summary
      excelData.push({
        'No': filteredData.length + 2,
        'ID Stok': '',
        'Tanggal': '',
        'Nama Stok': 'SUMMARY',
        'Unit Bisnis': '',
        'Jumlah': 0,
        'Harga Satuan': 0,
        'Total Pengeluaran': totalPengeluaran,
        'Supplier': `Total Items: ${filteredData.length}`,
        'Metode Pembayaran': `Generated: ${new Date().toLocaleString()}`,
        'Status': ''
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 5 },   // No
        { wch: 10 },  // ID Stok
        { wch: 12 },  // Tanggal
        { wch: 25 },  // Nama Stok
        { wch: 15 },  // Unit Bisnis
        { wch: 10 },  // Jumlah
        { wch: 15 },  // Harga Satuan
        { wch: 20 },  // Total Pengeluaran
        { wch: 20 },  // Supplier
        { wch: 15 },  // Metode Pembayaran
        { wch: 12 }   // Status
      ];
      worksheet['!cols'] = columnWidths;

      // Format angka
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let row = 2; row <= range.e.r; row++) {
        // Format Total Pengeluaran (kolom H)
        const totalCell = XLSX.utils.encode_cell({ r: row, c: 7 });
        if (worksheet[totalCell]) {
          worksheet[totalCell].z = '#,##0';
        }
        
        // Format Harga Satuan (kolom G)
        const hargaCell = XLSX.utils.encode_cell({ r: row, c: 6 });
        if (worksheet[hargaCell]) {
          worksheet[hargaCell].z = '#,##0';
        }
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pengeluaran');

      // Generate filename dengan timestamp
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `Laporan_Pengeluaran_Stok_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);
      
      console.log(`✅ Excel file downloaded: ${filename} with ${filteredData.length} records`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Gagal mengunduh file Excel. Silakan coba lagi.');
    }
  };

  // Reset semua filter
  const resetFilters = () => {
    setFilterUnitBisnis('all');
    setFilterStatus('all');
    setFilterSupplier('all');
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="p-8">
          <div className="bg-gradient-to-r from-blue-800 to-blue-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Laporan Pengeluaran</h1>
            <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <span className="text-gray-600 font-medium">Memuat data pengeluaran...</span>
              <span className="text-sm text-gray-500 mt-2">Menghitung pengeluaran dari data stok</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="p-8">
        {/* Header Section dengan Total Pengeluaran */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Laporan Pengeluaran</h1>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className="px-6 py-2.5 bg-white text-blue-800 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
                {(filterUnitBisnis !== 'all' || filterStatus !== 'all' || filterSupplier !== 'all' || startDate || endDate) && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {(filterUnitBisnis !== 'all' ? 1 : 0) + 
                     (filterStatus !== 'all' ? 1 : 0) + 
                     (filterSupplier !== 'all' ? 1 : 0) + 
                     (startDate ? 1 : 0) + 
                     (endDate ? 1 : 0)}
                  </span>
                )}
              </button>
              <button 
                onClick={downloadExcel}
                disabled={filteredData.length === 0}
                className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md transition-colors ${
                  filteredData.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Excel
              </button>
            </div>
          </div>

          {/* Total Pengeluaran Card */}
          <div className="bg-white rounded-lg p-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Total Pengeluaran</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {data.length} items stok
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {totalItems} total jumlah
                  </span>
                  {error && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Warning: {error}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-700">
                  {formatCurrency(totalPengeluaran)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredData.length} Data Stok
                  {filteredData.length !== data.length && ` (filtered from ${data.length})`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-blue-600 animate-slideDown">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filter Data Pengeluaran
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filter
                </button>
                <button 
                  onClick={() => setShowFilter(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tutup
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filter Unit Bisnis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Bisnis
                </label>
                <select
                  value={filterUnitBisnis}
                  onChange={(e) => setFilterUnitBisnis(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Unit</option>
                  {uniqueUnitBisnis.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Stok
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  {uniqueStatus.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Filter Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier
                </label>
                <select
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Supplier</option>
                  {uniqueSuppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>

              {/* Filter Tanggal Mulai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Tanggal Akhir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Menampilkan <span className="font-bold text-blue-600">{filteredData.length}</span> dari {data.length} data stok
                </p>
                <p className="text-sm font-medium text-blue-700">
                  {formatCurrency(totalPengeluaran)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {filterUnitBisnis !== 'all' && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Unit: {filterUnitBisnis}
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Status: {filterStatus}
                  </span>
                )}
                {filterSupplier !== 'all' && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Supplier: {filterSupplier}
                  </span>
                )}
                {startDate && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Dari: {formatDate(startDate)}
                  </span>
                )}
                {endDate && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Sampai: {formatDate(endDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kondisi jika tidak ada data */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium text-gray-600">
              {data.length === 0 ? 'Tidak ada data pengeluaran' : 'Tidak ada data sesuai filter'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {data.length === 0 
                ? 'Data pengeluaran akan muncul ketika ada stok dengan harga dan jumlah di database'
                : 'Coba ubah filter atau reset untuk melihat semua data'
              }
            </p>
            {data.length > 0 && (
              <button
                onClick={resetFilters}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tabel Pengeluaran */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-800">
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        No
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        ID Stok
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Nama Stok
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Unit Bisnis
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Jumlah
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Harga
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Supplier
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {currentData.map((item, index) => {
                      const rowNumber = startIndex + index + 1;
                      const total = item.jumlah_stok * item.Harga_stok;
                      return (
                        <tr key={item.id_stok} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {rowNumber}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            #{String(item.id_stok).padStart(3, '0')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(item.tanggal_stok)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{item.nama_stok}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="font-medium text-blue-700">{item.unit_bisnis}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.jumlah_stok?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatCurrency(item.Harga_stok || 0)}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.supplier_stok || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status_stok === 'Habis' 
                                ? 'bg-red-100 text-red-800' 
                                : item.status_stok === 'Dalam Pesanan'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.status_stok || 'Tersedia'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  
                  {/* Total Row */}
                  <tfoot>
                    <tr className="bg-blue-50">
                      <td colSpan={5} className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                        TOTAL ITEMS:
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-700">
                        {filteredData.reduce((sum, item) => sum + item.jumlah_stok, 0).toLocaleString()}
                      </td>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                        TOTAL PENGELUARAN:
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-700">
                        {formatCurrency(totalPengeluaran)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                      currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                        : 'text-blue-700 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({filteredData.length} data stok)
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                      currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                        : 'text-blue-700 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}