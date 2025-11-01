'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';

interface LaporanPengeluaran {
  tanggal: string;
  unit_bisnis: string;
  stok: string;
  jumlah: number;
  metode_pembayaran: string;
  sub_total: string;
}

export default function LaporanPengeluaranPage() {
  const [filterPeriode, setFilterPeriode] = useState('harian');

  const dataPengeluaran: LaporanPengeluaran[] = [
    {
      tanggal: '01-01-2025',
      unit_bisnis: 'Cafe',
      stok: 'Kopi',
      jumlah: 1,
      metode_pembayaran: 'QRIS',
      sub_total: 'Rp 150.000'
    },
    {
      tanggal: '01-01-2025',
      unit_bisnis: 'Badminton',
      stok: 'Raket',
      jumlah: 10,
      metode_pembayaran: 'Tunai',
      sub_total: 'Rp 500.000'
    },
    {
      tanggal: '01-01-2025',
      unit_bisnis: 'Play Station',
      stok: 'Kabel',
      jumlah: 7,
      metode_pembayaran: 'QRIS',
      sub_total: 'Rp 100.000'
    }
  ];

  const totalPengeluaran = dataPengeluaran.reduce((total, item) => {
    return total + parseInt(item.sub_total.replace(/[^\d]/g, ''));
  }, 0);

  const handleDownload = (format: string) => {
    alert(`Mendownload laporan pengeluaran dalam format ${format.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <Link
              href="/dashboard/laporan"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Laporan Pengeluaran</h1>
              <p className="text-gray-600">Manager - Periode Januari 2025</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="harian">Harian</option>
              <option value="mingguan">Mingguan</option>
              <option value="bulanan">Bulanan</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Bisnis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metode Pembayaran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sub Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dataPengeluaran.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.tanggal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.unit_bisnis}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.stok}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.jumlah}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.metode_pembayaran === 'QRIS' ? 'bg-green-100 text-green-800' :
                        item.metode_pembayaran === 'Tunai' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.metode_pembayaran}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.sub_total}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    Total Pengeluaran:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    Rp {totalPengeluaran.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Laporan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleDownload('word')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <div className="w-6 h-6 text-blue-600 font-bold">DOC</div>
              <span>Microsoft Word</span>
            </button>
            <button
              onClick={() => handleDownload('excel')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <div className="w-6 h-6 text-green-600 font-bold">XLS</div>
              <span>Microsoft Excel</span>
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <div className="w-6 h-6 text-red-600 font-bold">PDF</div>
              <span>PDF Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}