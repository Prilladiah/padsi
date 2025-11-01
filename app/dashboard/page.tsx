'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react';

interface Stok {
  id_stok: number;
  nama_stok: string;
  harga_stok: string;
  jumlah_stok: number;
  satuan_stok: string;
  supplier_stok: string;
  tanggal_stok: string;
}

export default function StokPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stokList, setStokList] = useState<Stok[]>([]);

  useEffect(() => {
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
      },
      {
        id_stok: 2,
        nama_stok: 'Kopi',
        harga_stok: 'Rp 50.000',
        jumlah_stok: 15,
        satuan_stok: 'pcs',
        supplier_stok: 'Alfamart',
        tanggal_stok: '18/10/2025'
      }
    ];
    setStokList(sampleData);
  }, []);

  const filteredStok = stokList.filter(stok =>
    stok.nama_stok.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stok.supplier_stok.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleHapusStok = (id: number, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus stok "${nama}"?`)) {
      setStokList(stokList.filter(stok => stok.id_stok !== id));
      alert('Stok berhasil dihapus!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kelola Stok</h1>
            <p className="text-gray-600">Manajemen data stok barang</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari stok..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Link
            href="/dashboard/stok/tambah"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Stok
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredStok.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Stok tidak tersedia!</p>
              {searchTerm && (
                <p className="text-gray-400 mt-2">
                  Hasil pencarian untuk "{searchTerm}" tidak ditemukan.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStok.map((stok) => (
                    <tr key={stok.id_stok} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stok.nama_stok}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stok.harga_stok}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          stok.jumlah_stok < 10 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {stok.jumlah_stok} {stok.satuan_stok}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stok.supplier_stok}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/dashboard/stok/ubah?id=${stok.id_stok}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Ubah
                          </Link>
                          <button
                            onClick={() => handleHapusStok(stok.id_stok, stok.nama_stok)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}