// app/laporan/pengeluaran/page.tsx
'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';

export default function LaporanPengeluaranPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const pengeluaranData = [
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Cafe',
      stok: 'Kopi',
      jumlah: 1,
      metodePembayaran: 'QRIS',
      subTotal: 150000
    },
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Badminton',
      stok: 'Raket',
      jumlah: 10,
      metodePembayaran: 'Tunai',
      subTotal: 500000
    },
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Play Station',
      stok: 'Kabel',
      jumlah: 7,
      metodePembayaran: 'QRIS',
      subTotal: 100000
    },
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Cafe',
      stok: 'Kopi',
      jumlah: 8,
      metodePembayaran: 'QRIS',
      subTotal: 150000
    },
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Cafe',
      stok: 'Kopi',
      jumlah: 8,
      metodePembayaran: 'QRIS',
      subTotal: 150000
    },
    {
      tanggal: '01-01-2025',
      unitBisnis: 'Cafe',
      stok: 'Kopi',
      jumlah: 8,
      metodePembayaran: 'QRIS',
      subTotal: 150000
    }
  ];

  const totalPengeluaran = pengeluaranData.reduce((sum, item) => sum + item.subTotal, 0);

  // Pagination
  const totalPages = Math.ceil(pengeluaranData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = pengeluaranData.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

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
          .info {
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
            background-color: #fef2f2;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #fecaca;
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
          <h1>LAPORAN PENGELUARAN SANGUKU</h1>
          <p>Sistem Informasi Pengelolaan Keuangan</p>
        </div>

        <div class="info">
          <strong>Total Data:</strong> ${pengeluaranData.length} transaksi | 
          <strong> Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID')}
        </div>

        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Unit Bisnis</th>
              <th>Stok</th>
              <th>Jumlah</th>
              <th>Metode Pembayaran</th>
              <th>Sub Total Pengeluaran</th>
            </tr>
          </thead>
          <tbody>
            ${pengeluaranData.map(item => `
              <tr>
                <td>${item.tanggal}</td>
                <td>${item.unitBisnis}</td>
                <td>${item.stok}</td>
                <td>${item.jumlah}</td>
                <td>${item.metodePembayaran}</td>
                <td>${formatCurrency(item.subTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <h3>TOTAL PENGELUARAN: ${formatCurrency(totalPengeluaran)}</h3>
          <p>Dari ${pengeluaranData.length} transaksi pengeluaran</p>
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
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Fungsi untuk download sebagai CSV
  const downloadCSV = () => {
    const headers = ['Tanggal', 'Unit Bisnis', 'Stok', 'Jumlah', 'Metode Pembayaran', 'Sub Total Pengeluaran'];
    
    const csvData = pengeluaranData.map(item => [
      item.tanggal,
      item.unitBisnis,
      item.stok,
      item.jumlah,
      item.metodePembayaran,
      item.subTotal
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-pengeluaran-sanguku-${new Date().toISOString().split('T')[0]}.csv`);
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan Pengeluaran</h1>
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

        {/* Tabel Pengeluaran */}
        <div className="bg-white rounded-lg shadow border overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Unit Bisnis
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Stok
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Jumlah
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider border-r border-gray-600">
                    Metode Pembayaran
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    Sub Total Pengeluaran
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                      {item.tanggal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                      {item.unitBisnis}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                      {item.stok}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                      {item.jumlah}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                      {item.metodePembayaran}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-red-600">
                      {formatCurrency(item.subTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, pengeluaranData.length)} dari {pengeluaranData.length} transaksi
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

        {/* Total Pengeluaran */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Pengeluaran</h3>
              <p className="text-gray-600 text-sm">Total keseluruhan pengeluaran</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalPengeluaran)}
              </div>
              <div className="text-sm text-gray-500">
                dari {pengeluaranData.length} transaksi
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}