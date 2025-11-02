'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function UbahStokPage() {
  const [formData, setFormData] = useState({
    namaStok: '',
    hargaStok: '',
    jumlahStok: '',
    satuanStok: '',
    tanggalStok: '',
    supplierStok: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic untuk menyimpan data stok
    console.log('Data stok:', formData);
    alert('Stok berhasil diubah!');
  };

  const handleCancel = () => {
    if (confirm('Apakah Anda yakin ingin membatalkan perubahan?')) {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/stok"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Ubah Stok</h1>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Stok */}
              <div>
                <label htmlFor="namaStok" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Stok
                </label>
                <input
                  type="text"
                  id="namaStok"
                  name="namaStok"
                  value={formData.namaStok}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nama stok"
                  required
                />
              </div>

              {/* Harga Stok */}
              <div>
                <label htmlFor="hargaStok" className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Stok
                </label>
                <input
                  type="number"
                  id="hargaStok"
                  name="hargaStok"
                  value={formData.hargaStok}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan harga"
                  min="0"
                  required
                />
              </div>

              {/* Jumlah Stok */}
              <div>
                <label htmlFor="jumlahStok" className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Stok
                </label>
                <input
                  type="number"
                  id="jumlahStok"
                  name="jumlahStok"
                  value={formData.jumlahStok}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan jumlah"
                  min="0"
                  required
                />
              </div>

              {/* Satuan Stok */}
              <div>
                <label htmlFor="satuanStok" className="block text-sm font-medium text-gray-700 mb-2">
                  Satuan Stok
                </label>
                <select
                  id="satuanStok"
                  name="satuanStok"
                  value={formData.satuanStok}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Pilih Satuan</option>
                  <option value="pcs">Pcs</option>
                  <option value="kg">Kg</option>
                  <option value="gram">Gram</option>
                  <option value="liter">Liter</option>
                  <option value="ml">ML</option>
                  <option value="pack">Pack</option>
                  <option value="dus">Dus</option>
                </select>
              </div>

              {/* Tanggal Stok */}
              <div>
                <label htmlFor="tanggalStok" className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Stok
                </label>
                <input
                  type="date"
                  id="tanggalStok"
                  name="tanggalStok"
                  value={formData.tanggalStok}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Supplier Stok */}
              <div>
                <label htmlFor="supplierStok" className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Stok
                </label>
                <input
                  type="text"
                  id="supplierStok"
                  name="supplierStok"
                  value={formData.supplierStok}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nama supplier"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Catatan:</strong> Pastikan semua data yang dimasukkan sudah benar sebelum menyimpan.
          </p>
        </div>
      </div>
    </div>
  );
}