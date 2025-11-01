'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function MetodeOfflinePage() {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggleOfflineMode = () => {
    if (isOfflineMode) {
      // Kembali ke online mode
      setIsOfflineMode(false);
      alert('Mode online diaktifkan!');
    } else {
      // Aktifkan offline mode
      setIsOfflineMode(true);
      alert('Mode offline diaktifkan! Data akan disinkronisasi saat koneksi pulih.');
    }
  };

  const handleSyncData = () => {
    setIsSyncing(true);
    // Simulasi sinkronisasi data
    setTimeout(() => {
      setIsSyncing(false);
      alert('Data berhasil disinkronisasi!');
    }, 2000);
  };

  const pendingData = [
    { id: 1, action: 'Tambah Stok', item: 'French Fries', time: '10:30' },
    { id: 2, action: 'Update Stok', item: 'Kopi', time: '11:15' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Metode Offline</h1>
        </div>

        {/* Status Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                isOfflineMode ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
              }`}>
                {isOfflineMode ? <WifiOff className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isOfflineMode ? 'Mode Offline Aktif' : 'Mode Online Aktif'}
                </h3>
                <p className="text-gray-600">
                  {isOfflineMode 
                    ? 'Sistem beroperasi tanpa koneksi internet' 
                    : 'Sistem terhubung ke internet'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleOfflineMode}
              className={`px-6 py-3 rounded-lg font-medium ${
                isOfflineMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {isOfflineMode ? 'Kembali Online' : 'Aktifkan Offline'}
            </button>
          </div>
        </div>

        {isOfflineMode && (
          <>
            {/* Pending Data Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Menunggu Sinkronisasi</h3>
                <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full">
                  {pendingData.length} items
                </span>
              </div>
              
              {pendingData.length > 0 ? (
                <div className="space-y-3">
                  {pendingData.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.action}</p>
                        <p className="text-sm text-gray-600">{item.item}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{item.time}</p>
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Menunggu
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wifi className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-gray-600">Tidak ada data yang menunggu sinkronisasi</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSyncData}
                  disabled={isSyncing || pendingData.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Menyinkronisasi...' : 'Sinkronisasi Data'}
                </button>
              </div>
            </div>

            {/* Information Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Informasi Mode Offline</h4>
              <ul className="text-blue-800 space-y-2">
                <li>• Data transaksi akan disimpan secara lokal</li>
                <li>• Stok akan diperbarui saat mode online</li>
                <li>• Laporan dapat diakses dalam mode terbatas</li>
                <li>• Sinkronisasi otomatis saat koneksi pulih</li>
              </ul>
            </div>
          </>
        )}

        {!isOfflineMode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-green-900 mb-2">Sistem Online</h4>
            <p className="text-green-800">
              Sistem terhubung ke internet. Semua fitur dapat digunakan dengan optimal.
              Data akan tersinkronisasi secara real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}