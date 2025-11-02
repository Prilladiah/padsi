// app/stok/tambah/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TambahStok() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama_stok: '',
    harga_stok: '',
    jumlah_stok: '',
    satuan_stok: '',
    supplier_stok: '',
    tanggal_stok: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    const success = Math.random() > 0.3;
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/stok');
      }, 2000);
    } else {
      setShowError(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Tambah Stok</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Stok Berhasil Ditambahkan!
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              Stok Gagal Ditambahkan!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Stok
              </label>
              <input
                type="text"
                name="nama_stok"
                value={formData.nama_stok}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Stok
              </label>
              <input
                type="number"
                name="harga_stok"
                value={formData.harga_stok}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Stok
              </label>
              <input
                type="number"
                name="jumlah_stok"
                value={formData.jumlah_stok}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satuan Stok
              </label>
              <select
                name="satuan_stok"
                value={formData.satuan_stok}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Satuan</option>
                <option value="pcs">Pcs</option>
                <option value="kg">Kg</option>
                <option value="liter">Liter</option>
                <option value="pack">Pack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Stok
              </label>
              <input
                type="text"
                name="supplier_stok"
                value={formData.supplier_stok}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Stok
              </label>
              <input
                type="date"
                name="tanggal_stok"
                value={formData.tanggal_stok}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}