'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2, X } from 'lucide-react';

interface Stok {
  id_stok: number;
  nama_stok: string;
  harga_stok: string;
  jumlah_stok: number;
  satuan_stok: string;
  supplier_stok: string;
  tanggal_stok: string;
}

export default function HapusStokPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [stokData, setStokData] = useState<Stok | null>(null);

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
          tanggal_stok: '17/10/2025'
        }
      ];
      
      const data = sampleData.find(item => item.id_stok === parseInt(id));
      setStokData(data || null);
    }
  }, [id]);

  const handleHapus = () => {
    if (stokData) {
      alert(`Stok "${stokData.nama_stok}" berhasil dihapus!`);
      router.push('/dashboard/stok');
    }
  };

  if (!stokData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Data stok tidak ditemukan.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Hapus Stok</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Konfirmasi Hapus Stok
            </h2>
            <p className="text-gray-600">
              Apakah Anda yakin ingin menghapus stok ini?
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Detail Stok:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nama Stok:</span>
                <span className="font-medium">{stokData.nama_stok}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Harga:</span>
                <span className="font-medium">{stokData.harga_stok}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jumlah:</span>
                <span className="font-medium">{stokData.jumlah_stok} {stokData.satuan_stok}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Supplier:</span>
                <span className="font-medium">{stokData.supplier_stok}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              <X className="w-4 h-4" />
              Batal
            </button>
            <button
              onClick={handleHapus}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}