// app/stok/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { StokItem } from '@/types';
import { auth } from '@/lib/auth';
import StokTable from '@/components/stok/stoktable';
import StokForm from '@/components/stok/stokform';

// Sample data
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
  }
];

export default function StokPage() {
  const [stokData, setStokData] = useState<StokItem[]>(initialStokData);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StokItem | undefined>();
  const isManager = auth.isManager();

  const handleAdd = () => {
    setEditingItem(undefined);
    setShowForm(true);
  };

  const handleEdit = (item: StokItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
      setStokData(stokData.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (data: Omit<StokItem, 'id'>) => {
    if (editingItem) {
      // Update existing item
      setStokData(stokData.map(item => 
        item.id === editingItem.id 
          ? { ...data, id: editingItem.id }
          : item
      ));
    } else {
      // Add new item
      const newItem: StokItem = {
        ...data,
        id: Date.now().toString()
      };
      setStokData([...stokData, newItem]);
    }
    setShowForm(false);
    setEditingItem(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(undefined);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Stok</h1>
          <p className="text-gray-600">Manajemen stok barang daur ulang</p>
        </div>
        
        {isManager && (
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Tambah Stok
          </button>
        )}
      </div>

      <StokTable 
        data={stokData} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showForm && (
        <StokForm
          item={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}