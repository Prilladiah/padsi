'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';

interface Stok {
  id_stok: number;
  nama_stok: string;
  harga_stok: string;
  jumlah_stok: number;
  satuan_stok: string;
  supplier_stok: string;
  tanggal_stok: string;
}

export default function UbahStokPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [formData, setFormData] = useState<Stok>({
    id_stok: 0,
    nama_stok: '',
    harga_stok: '',
    jumlah_stok: 0,
    satuan_stok: 'pcs',
    supplier_stok: '',
    tanggal_stok: ''
  });

  useEffect(() => {
    if (id) {
      // Data contoh
      const sampleData: Stok[] = [
        {
          id_stok: 1,
          nama_stok: 'French Fries',
          harga_stok: 'Rp 50.000',
          jumlah_stok: 12,
          satuan_stok: 'pcs',
          supplier_stok: 'E-Commerce',
          tanggal_stok: '2025-10-17'
        }
      ];
      
      const stokData = sampleData.find(item => item.id_stok === parseInt(id));
      if (stokData) {
        setFormData(stokData);
      }
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_stok || !formData.harga_stok || !formData.jumlah_stok) {
      alert('Harap lengkapi semua field yang wajib diisi!');
      return;
    }

    alert('Stok berhasil diubah!');
    router.push('/dashboard/stok');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Ubah Stok</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Stok *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_stok}
                  onChange={(e) => setFormData({...formData, nama_stok: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Stok *
                </label>
                <input
                  type="text"
                  required
                  value={formData.harga_stok}
                  onChange={(e) => setFormData({...formData, harga_stok: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Stok *
                </label>
                <input
                  type="number"
                  required
                  value={formData.jumlah_stok}
                  onChange={(e) => setFormData({...formData, jumlah_stok: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satuan Stok
                </label>
                <select
                  value={formData.satuan_stok}
                  onChange={(e) => setFormData({...formData, satuan_stok: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
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
                  value={formData.supplier_stok}
                  onChange={(e) => setFormData({...formData, supplier_stok: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Stok
                </label>
                <input
                  type="date"
                  value={formData.tanggal_stok}
                  onChange={(e) => setFormData({...formData, tanggal_stok: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
                Batal
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}