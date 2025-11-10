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
}

export default function LaporanPengeluaranPage() {
  const [data, setData] = useState<LaporanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        
        console.log('🔄 Fetching data from laporan API...');
        
        // Single API call dengan timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch('/api/laporan?jenis=Pengeluaran&limit=100', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 API Response:', result);
        
        if (result.success && Array.isArray(result.data)) {
          setData(result.data);
          console.log(`✅ Loaded ${result.data.length} records`);
        } else {
          throw new Error('Invalid response format');
        }
        
      } catch (err: any) {
        console.error('❌ Fetch error:', err);
        
        if (err.name === 'AbortError') {
          setError('Request timeout - server membutuhkan waktu terlalu lama');
        } else {
          setError('Gagal memuat data: ' + (err.message || 'Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Laporan Pengeluaran</h1>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Memuat data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Laporan Pengeluaran</h1>
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
    );
  }

  const totalPengeluaran = data.reduce((sum, item) => sum + (item.total_pengeluaran || 0), 0);
  const totalPendapatan = data.reduce((sum, item) => sum + (item.total_pendapatan || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Laporan Pengeluaran</h1>
          <div className="text-sm text-gray-600">
            Total: {data.length} transaksi
          </div>
        </div>
        
        {data.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium text-gray-600">Tidak ada data pengeluaran</p>
            <p className="text-sm text-gray-500 mt-2">
              Data pengeluaran akan muncul ketika ada transaksi pengeluaran di database
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-red-100 text-sm">Total Pengeluaran</p>
                    <p className="text-2xl font-bold">Rp {totalPengeluaran.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-4xl opacity-80">💸</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-green-100 text-sm">Total Pendapatan</p>
                    <p className="text-2xl font-bold">Rp {totalPendapatan.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-4xl opacity-80">💰</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Jenis Laporan</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Periode</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit Bisnis</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Pengeluaran</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id_laporan} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{item.id_laporan}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.jenis_laporan || 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(item.periode_laporan).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.unit_bisnis}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        Rp {item.total_pengeluaran?.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        Rp {item.total_pendapatan?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-gray-800">TOTAL:</td>
                    <td className="px-4 py-3 text-right text-red-600">
                      Rp {totalPengeluaran.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      Rp {totalPendapatan.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}