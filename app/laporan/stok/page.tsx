// app/laporan/stok/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { LaporanItem } from '@/types';
import Header from '@/components/layout/header';
import { useLocalStorage } from '@/components/hooks/uselocalstorage';

export default function LaporanStokPage() {
  const [laporanData, setLaporanData] = useLocalStorage<LaporanItem[]>('laporanData', []);
  const [filteredData, setFilteredData] = useState<LaporanItem[]>(laporanData);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let result = laporanData;

    // Filter berdasarkan tanggal
    if (startDate && endDate) {
      result = result.filter(item => 
        item.tanggal >= startDate && item.tanggal <= endDate
      );
    }

    setFilteredData(result);
    setCurrentPage(1); // Reset ke halaman 1 ketika filter berubah
  }, [startDate, endDate, laporanData]);

  // Hitung total sisa stok
  const totalSisaStok = filteredData.reduce((sum, item) => sum + item.sisa_stok, 0);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format tanggal dari YYYY-MM-DD ke DD-MM-YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fungsi untuk download laporan sebagai PDF
  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Stok - Sanguku</title>
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
          .filter-info {
            margin-bottom: 20px;
            font-size: 14px;
            color: #6b7280;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #1f2937;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #374151;
          }
          td {
            padding: 10px;
            border: 1px solid #d1d5db;
          }
          .total-section {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .signature {
            margin-top: 50px;
            text-align: right;
          }
          .signature-line {
            border-top: 1px solid #9ca3af;
            padding-top: 60px;
            width: 200px;
            margin-left: auto;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAPORAN STOK SANGUKU</h1>
          <p>Sistem Informasi Pengelolaan Stok</p>
        </div>

        <div class="filter-info">
          <strong>Periode:</strong> 
          ${startDate && endDate 
            ? `${formatDate(startDate)} - ${formatDate(endDate)}` 
            : 'Semua Data'
          } | 
          <strong>Total Data:</strong> ${filteredData.length} item
        </div>

        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Produk</th>
              <th>Harga</th>
              <th>Supplier</th>
              <th>Sisa Stok</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(item => `
              <tr>
                <td>${formatDate(item.tanggal)}</td>
                <td>${item.nama_barang}</td>
                <td>${formatCurrency(item.harga_satuan)}</td>
                <td>${item.supplier}</td>
                <td>${item.sisa_stok} ${item.satuan}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <h3>TOTAL SISA STOK: ${totalSisaStok} ITEMS</h3>
          <p>Dari ${filteredData.length} produk yang tercatat</p>
        </div>

        <div class="signature">
          <div class="signature-line">
            <strong>Manager</strong><br>
            Sanguku Management
          </div>
        </div>

        <div class="footer">
          Laporan dihasilkan pada: ${new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}<br>
          SIPS - Sanguku Inventory Management System
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    
    // Tunggu sebentar sebelum print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Fungsi untuk download sebagai CSV
  const downloadCSV = () => {
    const headers = ['Tanggal', 'Nama Produk', 'Harga', 'Supplier', 'Sisa Stok', 'Satuan'];
    
    const csvData = filteredData.map(item => [
      formatDate(item.tanggal),
      item.nama_barang,
      item.harga_satuan,
      item.supplier,
      item.sisa_stok,
      item.satuan
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-stok-sanguku-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="p-6">
        {/* Header dengan Tombol Download */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan Stok</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download CSV</span>
            </button>
            <button
              onClick={downloadPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabel Laporan */}
        <div ref={tableRef} className="bg-white rounded-lg shadow border overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Nama Produk
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Harga
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    Sisa Stok
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.length > 0 ? (
                  currentData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                        {formatDate(item.tanggal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                        {item.nama_barang}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                        {formatCurrency(item.harga_satuan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {item.sisa_stok} {item.satuan}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                        </svg>
                        Tidak ada data laporan stok
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} item stok
            {(startDate || endDate) && (
              <span className="ml-2">
                (difilter berdasarkan tanggal)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {/* Total Sisa Stok */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Sisa Stok</h3>
              <p className="text-gray-600 text-sm">Total keseluruhan stok yang tersisa</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {totalSisaStok} Items
              </div>
              <div className="text-sm text-gray-500">
                dari {filteredData.length} produk
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}