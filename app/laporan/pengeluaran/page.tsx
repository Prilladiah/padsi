// app/laporan/pengeluaran/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/header';

interface LaporanData {
  id_laporan: number;
  jenis_laporan: string;
  periode_laporan: string;
  unit_bisnis: string;
  total_pengeluaran: number;
  total_pendapatan: number;
  id_stok: number;
  metode_pembayaran?: string;
}

interface ExcelDataRow {
  'No'?: number | string;
  'ID Laporan': number | string;
  'Jenis Laporan': string;
  'Periode': string;
  'Unit Bisnis': string;
  'ID Stok': number | string;
  'Metode Pembayaran': string;
  'Total Pengeluaran': number | string;
  'Total Pendapatan': number | string;
}

export default function LaporanPengeluaranPage() {
  const [data, setData] = useState<LaporanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [filterMetode, setFilterMetode] = useState<string>('all');
  const [filterUnitBisnis, setFilterUnitBisnis] = useState<string>('all');

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔄 Fetching data from laporan API...');
        
        const response = await fetch('/api/laporan?jenis=Pengeluaran&limit=100');
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('📦 API Response:', result);
        
        if (result.success && Array.isArray(result.data)) {
          setData(result.data);
          console.log(`✅ Loaded ${result.data.length} records`);
          console.log('Metode Pembayaran:', result.data.map((d: LaporanData) => ({
            id: d.id_laporan,
            metode: d.metode_pembayaran
          })));
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (err: unknown) {
        console.error('❌ Fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError('Gagal memuat data: ' + errorMessage);
        
        // Set empty data instead of leaving it undefined
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMetode, filterUnitBisnis]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('Rp', 'Rp ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Filter data
  const filteredData = data.filter(item => {
    const metodeMatch = filterMetode === 'all' || item.metode_pembayaran === filterMetode;
    const unitMatch = filterUnitBisnis === 'all' || item.unit_bisnis === filterUnitBisnis;
    return metodeMatch && unitMatch;
  });

  // Get unique values for filter options
  const uniqueMetode = Array.from(new Set(data.map(item => item.metode_pembayaran || 'Tunai')));
  const uniqueUnitBisnis = Array.from(new Set(data.map(item => item.unit_bisnis)));

  const totalPengeluaran = filteredData.reduce((sum, item) => sum + (item.total_pengeluaran || 0), 0);

  // Pagination (menggunakan filteredData)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Fungsi untuk download laporan sebagai PDF
  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Pengeluaran - Sanguku</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px;
            color: #1f2937;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #173b9eff;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 10px;
            border: 1px solid #d1d5db;
          }
          .total-section {
            background-color: #fef2f2;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAPORAN PENGELUARAN SANGUKU</h1>
          <p>Sistem Informasi Pengelolaan Keuangan</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Jenis Laporan</th>
              <th>Periode</th>
              <th>Unit Bisnis</th>
              <th>Metode Pembayaran</th>
              <th>Total Pengeluaran</th>
              <th>Total Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(item => `
              <tr>
                <td>${item.id_laporan}</td>
                <td>${item.jenis_laporan || 'Pengeluaran'}</td>
                <td>${formatDate(item.periode_laporan)}</td>
                <td>${item.unit_bisnis}</td>
                <td>${item.metode_pembayaran || 'Tunai'}</td>
                <td>Rp ${item.total_pengeluaran?.toLocaleString('id-ID')}</td>
                <td>Rp ${item.total_pendapatan?.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-section">
          <h3>TOTAL PENGELUARAN: Rp ${totalPengeluaran.toLocaleString('id-ID')}</h3>
          <p>Dari ${filteredData.length} transaksi pengeluaran</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // Fungsi untuk download laporan sebagai Excel
  const downloadExcel = async () => {
    try {
      // Import XLSX dynamically
      // @ts-ignore - XLSX types will be loaded at runtime
      const XLSX = await import('xlsx');
      
      // Prepare data untuk Excel
      const excelData: ExcelDataRow[] = filteredData.map((item, index) => ({
        'No': index + 1,
        'ID Laporan': item.id_laporan,
        'Jenis Laporan': item.jenis_laporan || 'Pengeluaran',
        'Periode': formatDate(item.periode_laporan),
        'Unit Bisnis': item.unit_bisnis,
        'ID Stok': item.id_stok,
        'Metode Pembayaran': item.metode_pembayaran || 'Tunai',
        'Total Pengeluaran': item.total_pengeluaran,
        'Total Pendapatan': item.total_pendapatan
      }));

      // Tambahkan baris total di akhir
      excelData.push({
        'No': '',
        'ID Laporan': '',
        'Jenis Laporan': '',
        'Periode': '',
        'Unit Bisnis': '',
        'ID Stok': '',
        'Metode Pembayaran': 'TOTAL',
        'Total Pengeluaran': totalPengeluaran,
        'Total Pendapatan': filteredData.reduce((sum, item) => sum + (item.total_pendapatan || 0), 0)
      });

      // Create worksheet
      // @ts-ignore
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 5 },  // No
        { wch: 12 }, // ID Laporan
        { wch: 15 }, // Jenis Laporan
        { wch: 15 }, // Periode
        { wch: 20 }, // Unit Bisnis
        { wch: 10 }, // ID Stok
        { wch: 20 }, // Metode Pembayaran
        { wch: 20 }, // Total Pengeluaran
        { wch: 20 }  // Total Pendapatan
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      // @ts-ignore
      const workbook = XLSX.utils.book_new();
      // @ts-ignore
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pengeluaran');

      // Generate filename dengan timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Laporan_Pengeluaran_Sanguku_${timestamp}.xlsx`;

      // Download file
      // @ts-ignore
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Gagal mengunduh file Excel. Silakan coba lagi.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="p-8">
          <div className="bg-gradient-to-r from-blue-800 to-blue-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Laporan Pengeluaran</h1>
            <div className="bg-white rounded-lg p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <span className="ml-3 text-gray-600 font-medium">Memuat data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="p-8">
          <div className="bg-gradient-to-r from-blue-800 to-blue-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Laporan Pengeluaran</h1>
            <div className="bg-white rounded-lg p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-500 text-6xl mb-4">❌</div>
                <p className="text-red-700 font-medium mb-2">Gagal memuat data</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
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
              <h1 className="text-2xl font-bold text-white">Laporan Pengeluaran</h1>
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
                {(filterMetode !== 'all' || filterUnitBisnis !== 'all') && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {(filterMetode !== 'all' ? 1 : 0) + (filterUnitBisnis !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
              <button 
                onClick={downloadExcel}
                className="px-6 py-2.5 bg-white text-blue-600 rounded-lg flex items-center gap-2 font-medium shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
          </div>

          {/* Total Pengeluaran Card */}
          <div className="bg-white rounded-lg p-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Total Pengeluaran</h2>
                <p className="text-sm text-gray-600">Total keseluruhan pengeluaran</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-700">
                  {formatCurrency(totalPengeluaran)}
                </div>
                <p className="text-sm text-gray-600 mt-1">dari {filteredData.length} Transaksi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filter Data
              </h3>
              <button 
                onClick={() => {
                  setFilterMetode('all');
                  setFilterUnitBisnis('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset Filter
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filter Metode Pembayaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={filterMetode}
                  onChange={(e) => setFilterMetode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Metode</option>
                  {uniqueMetode.map(metode => (
                    <option key={metode} value={metode}>{metode}</option>
                  ))}
                </select>
              </div>

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
            </div>

            {/* Filter Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-bold text-blue-600">{filteredData.length}</span> dari {data.length} transaksi
              </p>
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
                ? 'Data pengeluaran akan muncul ketika ada transaksi pengeluaran di database'
                : 'Coba ubah filter atau reset untuk melihat semua data'
              }
            </p>
            {data.length > 0 && (
              <button
                onClick={() => {
                  setFilterMetode('all');
                  setFilterUnitBisnis('all');
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Unit Bisnis
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Stok
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Metode Pembayaran
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Sub Total Pendapatan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {currentData.map((item) => (
                      <tr key={item.id_laporan} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(item.periode_laporan)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-700">
                          {item.unit_bisnis}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.id_stok}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.metode_pembayaran === 'Qris' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.metode_pembayaran || 'Tunai'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(item.total_pengeluaran)}
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
                  {currentPage}/{totalPages}
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