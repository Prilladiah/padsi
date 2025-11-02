// app/laporan/stok/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { StokItem } from '@/types';

// Sample data (sama dengan data di stok management)
const initialStokData: StokItem[] = [
  {
    id: '1',
    nama: 'Botol Plastik PET',
    kategori: 'Plastik',
    jumlah: 100,
    satuan: 'kg',
    harga: 5000,
    tanggal_masuk: '2024-01-15'
  },
  {
    id: '2',
    nama: 'Kardus Bekas',
    kategori: 'Kertas',
    jumlah: 50,
    satuan: 'kg',
    harga: 3000,
    tanggal_masuk: '2024-01-16'
  },
  {
    id: '3',
    nama: 'Kaleng Aluminium',
    kategori: 'Logam',
    jumlah: 75,
    satuan: 'kg',
    harga: 8000,
    tanggal_masuk: '2024-01-17'
  },
  {
    id: '4',
    nama: 'Botol Kaca',
    kategori: 'Kaca',
    jumlah: 30,
    satuan: 'kg',
    harga: 2000,
    tanggal_masuk: '2024-01-18'
  },
  {
    id: '5',
    nama: 'Sampah Organik',
    kategori: 'Organik',
    jumlah: 200,
    satuan: 'kg',
    harga: 1500,
    tanggal_masuk: '2024-01-19'
  }
];

export default function LaporanStokPage() {
  const [stokData, setStokData] = useState<StokItem[]>(initialStokData);
  const [filterKategori, setFilterKategori] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('nama');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter data berdasarkan kategori
  const filteredData = stokData.filter(item =>
    filterKategori ? item.kategori === filterKategori : true
  );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'nama') {
      return sortOrder === 'asc' 
        ? a.nama.localeCompare(b.nama)
        : b.nama.localeCompare(a.nama);
    } else if (sortBy === 'jumlah') {
      return sortOrder === 'asc' 
        ? a.jumlah - b.jumlah
        : b.jumlah - a.jumlah;
    } else if (sortBy === 'harga') {
      return sortOrder === 'asc' 
        ? a.harga - b.harga
        : b.harga - a.harga;
    } else if (sortBy === 'tanggal_masuk') {
      return sortOrder === 'asc'
        ? new Date(a.tanggal_masuk).getTime() - new Date(b.tanggal_masuk).getTime()
        : new Date(b.tanggal_masuk).getTime() - new Date(a.tanggal_masuk).getTime();
    }
    return 0;
  });

  // Statistik stok
  const totalItems = stokData.length;
  const totalNilaiStok = stokData.reduce((sum, item) => sum + (item.jumlah * item.harga), 0);
  const totalQuantity = stokData.reduce((sum, item) => sum + item.jumlah, 0);

  // Statistik per kategori
  const kategoriStats = stokData.reduce((acc, item) => {
    if (!acc[item.kategori]) {
      acc[item.kategori] = {
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0
      };
    }
    acc[item.kategori].totalItems += 1;
    acc[item.kategori].totalQuantity += item.jumlah;
    acc[item.kategori].totalValue += (item.jumlah * item.harga);
    return acc;
  }, {} as Record<string, { totalItems: number; totalQuantity: number; totalValue: number }>);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Simulasi export CSV
    const headers = ['Nama Barang', 'Kategori', 'Jumlah', 'Satuan', 'Harga', 'Tanggal Masuk', 'Total Nilai'];
    const csvData = sortedData.map(item => [
      item.nama,
      item.kategori,
      item.jumlah.toString(),
      item.satuan,
      `Rp ${item.harga.toLocaleString('id-ID')}`,
      new Date(item.tanggal_masuk).toLocaleDateString('id-ID'),
      `Rp ${(item.jumlah * item.harga).toLocaleString('id-ID')}`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-stok-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Stok</h1>
          <p className="text-gray-600">Laporan lengkap kondisi stok barang daur ulang</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Statistik Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <span className="text-2xl">⚖️</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-800">{totalQuantity} kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Nilai Stok</p>
              <p className="text-2xl font-bold text-gray-800">
                Rp {totalNilaiStok.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter dan Sorting */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Kategori
            </label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              <option value="Plastik">Plastik</option>
              <option value="Kertas">Kertas</option>
              <option value="Logam">Logam</option>
              <option value="Kaca">Kaca</option>
              <option value="Organik">Organik</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urutkan Berdasarkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nama">Nama Barang</option>
              <option value="jumlah">Jumlah</option>
              <option value="harga">Harga</option>
              <option value="tanggal_masuk">Tanggal Masuk</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urutan
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">A-Z / Terkecil</option>
              <option value="desc">Z-A / Terbesar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Laporan Stok */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satuan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga (Rp)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Masuk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Nilai (Rp)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.nama}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.jumlah}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.satuan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.harga.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.tanggal_masuk).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {(item.jumlah * item.harga).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm font-medium text-gray-900">
                  TOTAL
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {totalQuantity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500"></td>
                <td className="px-6 py-4 text-sm text-gray-500"></td>
                <td className="px-6 py-4 text-sm text-gray-500"></td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {totalNilaiStok.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Statistik per Kategori */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Statistik per Kategori</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(kategoriStats).map(([kategori, stats]) => (
            <div key={kategori} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">{kategori}</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">Items: {stats.totalItems}</p>
                <p className="text-gray-600">Quantity: {stats.totalQuantity} kg</p>
                <p className="text-gray-600">
                  Total Nilai: Rp {stats.totalValue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .sidebar, button, select, .bg-gray-50 {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .shadow, .shadow-md {
            box-shadow: none !important;
          }
          .border {
            border: 1px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
}