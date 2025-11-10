import { useState } from 'react';

export default function ItemTable({ items, onAddItem, onDeleteItem, onUpdateItem, isOnline }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    supplier: '',
    quantity: '',
    unit: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemToAdd = {
      name: newItem.name,
      supplier: newItem.supplier,
      quantity: parseInt(newItem.quantity),
      unit: newItem.unit,
      price: parseInt(newItem.price.replace(/\D/g, '')) || 0,
      date: newItem.date
    };
    
    if (onAddItem(itemToAdd)) {
      setNewItem({
        name: '',
        supplier: '',
        quantity: '',
        unit: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      supplier: item.supplier,
      quantity: item.quantity.toString(),
      unit: item.unit,
      price: item.price.toString(),
      date: item.date
    });
    setShowAddForm(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    
    const updatedData = {
      name: newItem.name,
      supplier: newItem.supplier,
      quantity: parseInt(newItem.quantity),
      unit: newItem.unit,
      price: parseInt(newItem.price.replace(/\D/g, '')) || 0,
      date: newItem.date
    };
    
    if (onUpdateItem(editingItem.id, updatedData)) {
      setEditingItem(null);
      setNewItem({
        name: '',
        supplier: '',
        quantity: '',
        unit: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setShowAddForm(false);
    setNewItem({
      name: '',
      supplier: '',
      quantity: '',
      unit: '',
      price: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div>
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Semua Barang</h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowAddForm(!showAddForm);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          {showAddForm ? 'Batal Tambah' : 'Tambah Barang'}
        </button>
      </div>

      {showAddForm && (
        <div className="p-4 border-b bg-gray-50">
          <form onSubmit={editingItem ? handleUpdate : handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <input
              type="text"
              placeholder="Nama Barang"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              className="px-3 py-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Supplier"
              value={newItem.supplier}
              onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
              className="px-3 py-2 border rounded"
              required
            />
            <input
              type="number"
              placeholder="Jumlah"
              value={newItem.quantity}
              onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
              className="px-3 py-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Satuan"
              value={newItem.unit}
              onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
              className="px-3 py-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Harga"
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: e.target.value})}
              className="px-3 py-2 border rounded"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded flex-1"
              >
                {editingItem ? 'Update' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Batal
              </button>
            </div>
          </form>
          <div className={`mt-2 text-sm ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
            ⓘ Mode: {isOnline ? 'ONLINE - Data langsung tersimpan ke server' : 'OFFLINE - Data akan disinkronkan ketika koneksi tersedia'}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAMA BARANG</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SUPPLIER</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">JUMLAH</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SATUAN</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HARGA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TANGGAL MASUK</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.displayId || item.id} className={item.isOffline ? 'bg-orange-50' : ''}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.supplier}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3">{formatPrice(item.price)}</td>
                <td className="px-4 py-3">{item.date}</td>
                <td className="px-4 py-3">
                  {item.isOffline ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      offline
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      online
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDeleteItem(item.id, item.isOffline)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}