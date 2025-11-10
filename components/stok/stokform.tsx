import { useState, useEffect } from 'react';
import { StokItem } from '@/types';

interface StokFormProps {
  item?: StokItem;
  onSubmit: (data: Omit<StokItem, 'id'>) => void;
  onCancel: () => void;
}

export default function StokForm({ item, onSubmit, onCancel }: StokFormProps) {
  const [formData, setFormData] = useState({
    nama: item?.nama || '',
    supplier: item?.supplier || '',
    jumlah: item?.jumlah || 0,
    satuan: item?.satuan || '',
    harga: item?.harga || 0,
    tanggal_masuk: item?.tanggal_masuk || new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Format number dengan pemisah ribuan untuk display
  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString('id-ID');
  };

  // Parse input currency (hapus pemisah ribuan)
  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/\D/g, ''); // Hapus semua non-digit
    return parseInt(cleaned) || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'harga') {
      // Parse dan update harga
      const numericValue = parseCurrency(value);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'jumlah') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error saat user mengetik
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama stok wajib diisi';
    }
    if (!formData.supplier.trim()) {
      newErrors.supplier = 'Supplier wajib diisi';
    }
    if (!formData.satuan || formData.satuan === 'Pilih Satuan') {
      newErrors.satuan = 'Satuan wajib dipilih';
    }
    if (formData.jumlah < 0) {
      newErrors.jumlah = 'Jumlah tidak boleh negatif';
    }
    if (formData.harga < 0) {
      newErrors.harga = 'Harga tidak boleh negatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {item ? 'Edit Stok' : 'Tambah Stok'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Stok */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Stok <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Contoh: Kopi Arabika"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nama ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.nama && (
                <p className="text-red-500 text-sm mt-1">{errors.nama}</p>
              )}
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Contoh: Supplier Kopi Java"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.supplier ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.supplier && (
                <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>
              )}
            </div>

            {/* Jumlah & Satuan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="jumlah"
                  value={formData.jumlah}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.jumlah ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.jumlah && (
                  <p className="text-red-500 text-sm mt-1">{errors.jumlah}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satuan <span className="text-red-500">*</span>
                </label>
                <select
                  name="satuan"
                  value={formData.satuan}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.satuan ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih Satuan</option>
                  <option value="kg">kg (Kilogram)</option>
                  <option value="L">L (Liter)</option>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="box">box (Box)</option>
                  <option value="pack">pack (Pack)</option>
                  <option value="unit">unit (Unit)</option>
                </select>
                {errors.satuan && (
                  <p className="text-red-500 text-sm mt-1">{errors.satuan}</p>
                )}
              </div>
            </div>

            {/* Harga */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                <input
                  type="text"
                  name="harga"
                  value={formatCurrency(formData.harga)}
                  onChange={handleChange}
                  placeholder="0"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.harga ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Harga satuan dalam Rupiah
              </p>
              {errors.harga && (
                <p className="text-red-500 text-sm mt-1">{errors.harga}</p>
              )}
            </div>

            {/* Tanggal Masuk */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Masuk <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_masuk"
                value={formData.tanggal_masuk}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Nama:</span> {formData.nama || '-'}</p>
                <p><span className="font-medium">Supplier:</span> {formData.supplier || '-'}</p>
                <p><span className="font-medium">Jumlah:</span> {formData.jumlah} {formData.satuan || '-'}</p>
                <p><span className="font-medium">Harga:</span> Rp {formatCurrency(formData.harga)}</p>
                <p><span className="font-medium">Tanggal:</span> {new Date(formData.tanggal_masuk).toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {item ? 'Update' : 'Tambah'} Stok
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}