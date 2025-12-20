'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LaporanPendapatanPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [totalPendapatan, setTotalPendapatan] = useState<number>(0);
  const [filteredPendapatan, setFilteredPendapatan] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    byPaymentMethod: {} as Record<string, number>
  });

  // State untuk filter dan modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    unitBisnis: '',
    metodePembayaran: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // State untuk pilihan filter
  const [unitBisnisOptions, setUnitBisnisOptions] = useState<string[]>([]);
  const [metodePembayaranOptions, setMetodePembayaranOptions] = useState<string[]>([]);

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    return amount.toLocaleString('id-ID');
  };

  // Fetch ALL data dari API
  const loadData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading data from API...");
      
      const res = await fetch('/api/laporan/pendapatan', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log("📡 Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error:", errorText);
        
        // Fallback untuk development
        if (process.env.NODE_ENV === 'development') {
          console.log("🔄 Using development fallback data");
          const fallbackData = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            tanggal: `2024-0${Math.floor(i/3) + 1}-${(i % 30) + 1}`.replace(/-(\d)$/, '-0$1'),
            target_date: `2024-0${Math.floor(i/3) + 1}-${(i % 30) + 1}`.replace(/-(\d)$/, '-0$1'),
            unit_bisnis: ['Badminton', 'Cafe', 'Gym'][i % 3],
            metode_pembayaran: ['QRIS', 'Tunai', 'Transfer'][i % 3],
            subtotal_pendapatan: [120000, 150000, 200000][i % 3],
            created_at: new Date().toISOString()
          }));
          
          setData(fallbackData);
          setFilteredData(fallbackData);
          setTotalPendapatan(1450000);
          setFilteredPendapatan(1450000);
          
          // Set options untuk filter
          const uniqueUnits = [...new Set(fallbackData.map(item => item.unit_bisnis))] as string[];
          const uniqueMethods = [...new Set(fallbackData.map(item => item.metode_pembayaran))] as string[];
          setUnitBisnisOptions(uniqueUnits);
          setMetodePembayaranOptions(uniqueMethods);
          
          setStats({
            totalRecords: 10,
            byPaymentMethod: { QRIS: 4, Tunai: 3, Transfer: 3 }
          });
          return;
        }
        
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const json = await res.json();
      console.log("✅ API Response received:", {
        success: json.success,
        dataLength: json.data?.length || 0,
        total: json.total,
        summary: json.summary
      });
      
      if (json.success) {
        // Pastikan semua data ditampilkan
        const allData = json.data || [];
        console.log(`📊 Setting ${allData.length} records to state`);
        
        setData(allData);
        setFilteredData(allData);
        setTotalPendapatan(json.total || 0);
        setFilteredPendapatan(json.total || 0);
        
        // Extract unique values untuk filter options
        const uniqueUnits = [...new Set(allData.map((item: any) => item.unit_bisnis).filter(Boolean))] as string[];
        const uniqueMethods = [...new Set(allData.map((item: any) => item.metode_pembayaran).filter(Boolean))] as string[];
        setUnitBisnisOptions(uniqueUnits);
        setMetodePembayaranOptions(uniqueMethods);
        
        setStats({
          totalRecords: allData.length,
          byPaymentMethod: json.summary?.byPaymentMethod || {}
        });
      } else {
        console.error("❌ API returned error:", json.error);
        setData([]);
        setFilteredData([]);
        setTotalPendapatan(0);
        setFilteredPendapatan(0);
      }
    } catch (error: any) {
      console.error("💥 Error loading data:", error.message);
      setUploadError(`Gagal memuat data: ${error.message}`);
      setData([]);
      setFilteredData([]);
      setTotalPendapatan(0);
      setFilteredPendapatan(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fungsi untuk apply filter
  const applyFilters = () => {
    let result = [...data];
    
    // Filter berdasarkan unit bisnis
    if (filters.unitBisnis) {
      result = result.filter(item => 
        item.unit_bisnis?.toLowerCase() === filters.unitBisnis.toLowerCase()
      );
    }
    
    // Filter berdasarkan metode pembayaran
    if (filters.metodePembayaran) {
      result = result.filter(item => 
        item.metode_pembayaran?.toLowerCase() === filters.metodePembayaran.toLowerCase()
      );
    }
    
    // Filter berdasarkan tanggal
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(item => {
        const itemDate = new Date(item.tanggal || item.target_date);
        return itemDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Sampai akhir hari
      result = result.filter(item => {
        const itemDate = new Date(item.tanggal || item.target_date);
        return itemDate <= endDate;
      });
    }
    
    // Filter berdasarkan pencarian
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item => 
        item.unit_bisnis?.toLowerCase().includes(searchLower) ||
        item.metode_pembayaran?.toLowerCase().includes(searchLower) ||
        item.tanggal?.toLowerCase().includes(searchLower) ||
        item.target_date?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredData(result);
    
    // Hitung total pendapatan untuk data yang difilter
    const total = result.reduce((sum, item) => {
      return sum + (Number(item.subtotal_pendapatan) || 0);
    }, 0);
    
    setFilteredPendapatan(total);
    setShowFilterModal(false);
  };

  // Reset filter
  const resetFilters = () => {
    setFilters({
      unitBisnis: '',
      metodePembayaran: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setFilteredData(data);
    setFilteredPendapatan(totalPendapatan);
    setShowFilterModal(false);
  };

  // Handle perubahan filter
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Upload Excel
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log("📤 Uploading file:", file.name);
      
      const res = await fetch('/api/laporan/pendapatan', {
        method: 'POST',
        body: formData
      });

      console.log("📡 Upload response status:", res.status);
      
      const result = await res.json();
      console.log("📡 Upload response:", result);

      if (res.ok && result.success) {
        const imported = result.data?.imported || 0;
        const updated = result.data?.updated || 0;
        setUploadSuccess(`Berhasil upload: ${imported} data baru, ${updated} diperbarui`);
        loadData(); // refresh data
      } else {
        setUploadError(result.error || 'Gagal upload file');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Download Excel
  const handleDownloadExcel = async () => {
    try {
      console.log("📥 Downloading Excel...");
      
      const res = await fetch('/api/laporan/pendapatan/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: filters,
          data: filteredData
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_pendapatan_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log("✅ Excel downloaded successfully");
    } catch (error: any) {
      console.error("❌ Error downloading Excel:", error);
      setUploadError(`Gagal download Excel: ${error.message}`);
    }
  };

  // Format tanggal
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get badge color untuk metode pembayaran
  const getPaymentMethodColor = (metode: string) => {
    const method = metode?.toLowerCase() || '';
    
    if (method.includes('qris') || method === '0815') {
      return 'bg-purple-100 text-purple-800';
    }
    if (method.includes('tunai') || method.includes('cash')) {
      return 'bg-green-100 text-green-800';
    }
    if (method.includes('transfer')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Handle back
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#123DCA] text-white p-6 rounded-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
          onClick={handleBack}
          title="Kembali"
          className="p-1 hover:opacity-80 transition-opacity"
          >
            <svg
             className="w-6 h-6 text-white"
             fill="none"
             stroke="currentColor"
             viewBox="0 0 24 24"
             >
              <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
              />
              </svg>
              </button>

          <div>
            <h1 className="text-2xl font-bold">Laporan Pendapatan</h1>
            <p className="text-blue-200 text-sm mt-1">Total: {stats.totalRecords} transaksi</p>
          </div>
        </div>

        <div className="flex gap-3">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilterModal(true)}
            className="px-6 py-2.5 bg-white text-[#123DCA] rounded-lg flex items-center gap-2 font-medium shadow-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>

          {/* Download Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="px-6 py-2.5 bg-white text-[#123DCA] rounded-lg flex items-center gap-2 font-medium shadow-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Excel
          </button>

          {/* Upload Button */}
          <label className="cursor-pointer">
            <div className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md transition-colors ${
              uploading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}>
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Excel
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-white shadow p-5 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Total Pendapatan</h3>
          <p className="text-2xl font-bold text-[#123DCA] mt-2">
            Rp {formatCurrency(filteredPendapatan)}
          </p>
          {filteredPendapatan !== totalPendapatan && (
            <p className="text-sm text-gray-500 mt-1">
              Filter: Rp {formatCurrency(totalPendapatan)}
            </p>
          )}
        </div>
        
        <div className="bg-white shadow p-5 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Total Transaksi</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {filteredData.length}
          </p>
          {filteredData.length !== data.length && (
            <p className="text-sm text-gray-500 mt-1">
              Dari {data.length} total transaksi
            </p>
          )}
        </div>
        
        <div className="bg-white shadow p-5 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Rata-rata per Transaksi</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            Rp {formatCurrency(filteredData.length > 0 ? filteredPendapatan / filteredData.length : 0)}
          </p>
        </div>
        
        <div className="bg-white shadow p-5 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Status Data</h3>
          <p className="text-lg font-semibold text-green-600 mt-2">
            {loading ? 'Memuat...' : data.length === stats.totalRecords ? 'Sinkron' : 'Tidak Sinkron'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filteredData.length} dari {stats.totalRecords} ditampilkan
          </p>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Filter Data Pendapatan</h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Filter Unit Bisnis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Bisnis
                  </label>
                  <select
                    value={filters.unitBisnis}
                    onChange={(e) => handleFilterChange('unitBisnis', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Semua Unit</option>
                    {unitBisnisOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Filter Metode Pembayaran */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metode Pembayaran
                  </label>
                  <select
                    value={filters.metodePembayaran}
                    onChange={(e) => handleFilterChange('metodePembayaran', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Semua Metode</option>
                    {metodePembayaranOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
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
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Filter Tanggal Akhir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pencarian
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Cari berdasarkan unit bisnis, metode pembayaran, atau tanggal..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={resetFilters}
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Reset Filter
              </button>
              <button
                onClick={applyFilters}
                className="px-6 py-3 bg-[#123DCA] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Stats */}
      {Object.keys(stats.byPaymentMethod).length > 0 && (
        <div className="bg-white shadow p-5 mt-4 rounded-xl border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-700">Metode Pembayaran</h3>
            {Object.keys(filters).some(key => filters[key as keyof typeof filters]) && (
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Hapus Filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.byPaymentMethod).map(([method, count]) => (
              <div key={method} className={`px-4 py-2 rounded-lg ${getPaymentMethodColor(method)}`}>
                <span className="font-semibold">{method}</span>
                <span className="ml-2 text-sm opacity-75">{count} transaksi</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {(uploadSuccess || uploadError) && (
        <div className={`mt-4 p-4 rounded-lg ${uploadSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`flex items-center gap-2 ${uploadSuccess ? 'text-green-700' : 'text-red-600'}`}>
            {uploadSuccess ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {uploadSuccess}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {uploadError}
              </>
            )}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 mt-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pendapatan...</p>
          <p className="text-sm text-gray-500 mt-2">Mengambil {stats.totalRecords} records dari database</p>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 mt-6 text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg font-medium text-gray-600">Belum ada data pendapatan</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload file Excel untuk mulai menambahkan data
          </p>
        </div>
      ) : (
        <>
          {/* Tabel - TAMPILKAN SEMUA DATA */}
          <div className="mt-6 bg-white rounded-xl shadow overflow-hidden border">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-700">
                  Daftar Transaksi ({filteredData.length} dari {data.length})
                  {filteredData.length !== data.length && ' (difilter)'}
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={loadData}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-[#123DCA] text-white sticky top-0">
                  <tr>
                    <th className="p-3 font-bold">NO</th>
                    <th className="p-3 font-bold">TANGGAL</th>
                    <th className="p-3 font-bold">UNIT BISNIS</th>
                    <th className="p-3 font-bold">METODE PEMBAYARAN</th>
                    <th className="p-3 font-bold">PENDAPATAN</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr 
                      key={row.id || idx} 
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 text-sm text-gray-900">{idx + 1}</td>
                      <td className="p-3 text-sm text-gray-900">
                        {formatDate(row.tanggal || row.target_date || '')}
                      </td>
                      <td className="p-3 text-sm font-medium text-blue-700">
                        {row.unit_bisnis || 'N/A'}
                      </td>
                      <td className="p-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentMethodColor(row.metode_pembayaran)}`}>
                          {row.metode_pembayaran || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-semibold text-gray-900">
                        Rp {formatCurrency(Number(row.subtotal_pendapatan))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Total */}
          <div className="bg-blue-50 p-4 flex justify-between items-center mt-2 rounded-lg border">
            <div>
              <p className="text-sm text-gray-600">
                Menampilkan {filteredData.length} dari {data.length} transaksi
              </p>
              {filteredData.length < data.length && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Data sedang difilter
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">
                TOTAL PENDAPATAN: &nbsp;
                <span className="text-[#123DCA]">
                  Rp {formatCurrency(filteredPendapatan)}
                </span>
                {filteredPendapatan !== totalPendapatan && (
                  <span className="text-sm text-gray-600 block mt-1">
                    (Total semua: Rp {formatCurrency(totalPendapatan)})
                  </span>
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}