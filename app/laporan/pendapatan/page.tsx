// app/laporan/pendapatan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/header';

export default function LaporanPendapatanPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [filterMetode, setFilterMetode] = useState<string>('all');
  const [filterUnitBisnis, setFilterUnitBisnis] = useState<string>('all');

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMetode, filterUnitBisnis]);

  const pendapatanData = [
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Cafe',
      metodePembayaran: 'Qris',
      subTotal: 50000
    },
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Badminton',
      metodePembayaran: 'Tunai',
      subTotal: 50000
    },
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Play Station',
      metodePembayaran: 'Qris',
      subTotal: 50000
    },
    {
      tanggal: '02-01-2025',
      unitBisnis: 'Cafe',
      metodePembayaran: 'Tunai',
      subTotal: 50000
    },
    {
      tanggal: '02-01-2025',
      unitBisnis: 'Badminton',
      metodePembayaran: 'Qris',
      subTotal: 50000
    },
    {
      tanggal: '02-01-2025',
      unitBisnis: 'Play Station',
      metodePembayaran: 'Tunai',
      subTotal: 50000
    },
    {
      tanggal: '03-01-2025',
      unitBisnis: 'Cafe',
      metodePembayaran: 'Qris',
      subTotal: 50000
    },
    {
      tanggal: '03-01-2025',
      unitBisnis: 'Badminton',
      metodePembayaran: 'Tunai',
      subTotal: 50000
    }
  ];

  // Filter data
  const filteredData = pendapatanData.filter(item => {
    const metodeMatch = filterMetode === 'all' || item.metodePembayaran === filterMetode;
    const unitMatch = filterUnitBisnis === 'all' || item.unitBisnis === filterUnitBisnis;
    return metodeMatch && unitMatch;
  });

  // Get unique values for filter options
  const uniqueMetode = Array.from(new Set(pendapatanData.map(item => item.metodePembayaran)));
  const uniqueUnitBisnis = Array.from(new Set(pendapatanData.map(item => item.unitBisnis)));

  const totalPendapatan = filteredData.reduce((sum, item) => sum + item.subTotal, 0);

  // Pagination (menggunakan filteredData)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('Rp', 'Rp ');
  };

  // Fungsi untuk download Excel (CSV format yang kompatibel dengan Excel)
  const downloadExcel = () => {
    // Header
    const headers = ['Tanggal', 'Unit Bisnis', 'Metode Pembayaran', 'Sub Total Pendapatan'];
    
    // Data rows
    const rows = filteredData.map(item => [
      item.tanggal,
      item.unitBisnis,
      item.metodePembayaran,
      item.subTotal
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['', '', 'TOTAL PENDAPATAN:', totalPendapatan]);
    rows.push(['', '', 'Total Transaksi:', filteredData.length]);

    // Create CSV content with BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      ['LAPORAN PENDAPATAN SANGUKU'].join(','),
      ['Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID')].join(','),
      [],
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan-Pendapatan-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="p-8">
        {/* Header Section dengan Total Pendapatan */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="text-white hover:bg-blue-600 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">Laporan Pendapatan</h1>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className="px-6 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-md"
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
                Download Excel
              </button>
            </div>
          </div>

          {/* Total Pendapatan Card */}
          <div className="bg-white rounded-lg p-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Total Pendapatan</h2>
                <p className="text-sm text-gray-600">Total keseluruhan pendapatan</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-700">
                  {formatCurrency(totalPendapatan)}
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
                Menampilkan <span className="font-bold text-blue-600">{filteredData.length}</span> dari {pendapatanData.length} transaksi
              </p>
            </div>
          </div>
        )}

        {/* Kondisi jika tidak ada data sesuai filter */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium text-gray-600">Tidak ada data sesuai filter</p>
            <p className="text-sm text-gray-500 mt-2">
              Coba ubah filter atau reset untuk melihat semua data
            </p>
            <button
              onClick={() => {
                setFilterMetode('all');
                setFilterUnitBisnis('all');
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <>
            {/* Tabel Pendapatan */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-900">
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wide">
                        Unit Bisnis
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
                    {currentData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.tanggal}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-700">
                          {item.unitBisnis}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.metodePembayaran === 'Qris' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.metodePembayaran}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(item.subTotal)}
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