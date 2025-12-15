'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LaporanPendapatanPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [totalPendapatan, setTotalPendapatan] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    byPaymentMethod: {} as Record<string, number>
  });

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
            unit_bisnis: 'Badminton',
            metode_pembayaran: ['QRIS', 'Tunai', 'Transfer'][i % 3],
            subtotal_pendapatan: 120000,
            created_at: new Date().toISOString()
          }));
          
          setData(fallbackData);
          setTotalPendapatan(1200000);
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
        setTotalPendapatan(json.total || 0);
        setStats({
          totalRecords: allData.length,
          byPaymentMethod: json.summary?.byPaymentMethod || {}
        });
      } else {
        console.error("❌ API returned error:", json.error);
        setData([]);
        setTotalPendapatan(0);
      }
    } catch (error: any) {
      console.error("💥 Error loading data:", error.message);
      setUploadError(`Gagal memuat data: ${error.message}`);
      setData([]);
      setTotalPendapatan(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
            Rp {formatCurrency(totalPendapatan)}
          </p>
        </div>
        
        <div className="bg-white shadow p-5 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Total Transaksi</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {stats.totalRecords}
          </p>
        </div>
        
        <div className="bg-white shadow p-5 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Rata-rata per Transaksi</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            Rp {formatCurrency(stats.totalRecords > 0 ? totalPendapatan / stats.totalRecords : 0)}
          </p>
        </div>
        
        <div className="bg-white shadow p-5 rounded-xl border">
          <h3 className="text-sm font-medium text-gray-500">Status Data</h3>
          <p className="text-lg font-semibold text-green-600 mt-2">
            {loading ? 'Memuat...' : data.length === stats.totalRecords ? 'Sinkron' : 'Tidak Sinkron'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {data.length} dari {stats.totalRecords} ditampilkan
          </p>
        </div>
      </div>

      {/* Payment Method Stats */}
      {Object.keys(stats.byPaymentMethod).length > 0 && (
        <div className="bg-white shadow p-5 mt-4 rounded-xl border">
          <h3 className="font-medium text-gray-700 mb-3">Metode Pembayaran</h3>
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
                  Daftar Transaksi ({data.length} dari {stats.totalRecords})
                </h3>
                <button 
                  onClick={loadData}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Refresh Data
                </button>
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
                  {data.map((row, idx) => (
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
                Menampilkan {data.length} dari {stats.totalRecords} transaksi
              </p>
              {data.length < stats.totalRecords && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Beberapa data mungkin tidak ditampilkan
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">
                TOTAL PENDAPATAN: &nbsp;
                <span className="text-[#123DCA]">
                  Rp {formatCurrency(totalPendapatan)}
                </span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}