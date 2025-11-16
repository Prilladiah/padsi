'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useOfflineMode } from '@/hooks/useofflinemode';
import OfflineStorageManager from '@/app/lib/offlinestorage';
import Header from '@/components/layout/header';

export default function TambahStokPage() {
  const router = useRouter();
  const isManager = auth.isManager();

  const [formData, setFormData] = useState({
    nama: '',
    supplier: '',
    jumlah: 0,
    satuan: 'pcs',
    harga: 0,
    tanggal_masuk: new Date().toISOString().split('T')[0]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [offlineInitialized, setOfflineInitialized] = useState(false);

  const {
    isOnline,
    offlineMode,
    enableOfflineMode,
    addItemOffline
  } = useOfflineMode();

  useEffect(() => {
    if (!isOnline && !offlineMode && !offlineInitialized) {
      console.log('🔴 Offline detected - auto enabling offline mode');
      enableOfflineMode();
      setOfflineInitialized(true);
    }
    if (isOnline) {
      setOfflineInitialized(false);
    }
  }, [isOnline, offlineMode, offlineInitialized, enableOfflineMode]);

  useEffect(() => {
    if (!isManager) {
      router.push('/stok');
    }
  }, [isManager, router]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.push('/stok');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, router]);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama barang wajib diisi';
    }
    if (!formData.supplier.trim()) {
      newErrors.supplier = 'Supplier wajib diisi';
    }
    if (formData.jumlah <= 0) {
      newErrors.jumlah = 'Jumlah harus lebih dari 0';
    }
    if (!formData.satuan.trim()) {
      newErrors.satuan = 'Satuan wajib diisi';
    }
    if (formData.harga < 0) {
      newErrors.harga = 'Harga tidak boleh negatif';
    }
    if (!formData.tanggal_masuk) {
      newErrors.tanggal_masuk = 'Tanggal masuk wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jumlah' || name === 'harga' ? parseFloat(value) || 0 : value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isOnline || offlineMode) {
        console.log('💾 Saving in offline mode...');
        addItemOffline(formData);
        setSuccessMessage('Stok berhasil ditambahkan (offline). Akan tersinkron otomatis saat online.');
        setShowSuccess(true);
      } else {
        console.log('🌐 Saving to database...');
        
        const response = await fetch('/api/stok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setSuccessMessage('Stok berhasil ditambahkan');
          setShowSuccess(true);
        } else {
          throw new Error(result.error || 'Gagal menyimpan data');
        }
      }
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      
      if (isOnline && !offlineMode) {
        try {
          addItemOffline(formData);
          setSuccessMessage('Gagal menyimpan online. Data disimpan offline dan akan tersinkron otomatis.');
          setShowSuccess(true);
        } catch (offlineError) {
          console.error('❌ Offline fallback also failed:', offlineError);
          setErrorMessage('Gagal menyimpan data');
          setShowError(true);
        }
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan';
        setErrorMessage(`Gagal menyimpan: ${errorMsg}`);
        setShowError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/stok');
  };

  if (!isManager) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto p-6">
        {!isOnline && (
          <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-orange-600 text-lg">📡</span>
              <div>
                <span className="text-orange-800 text-sm font-medium">Mode Offline Aktif</span>
                <p className="text-orange-600 text-xs mt-0.5">
                  Data akan tersinkron otomatis saat online kembali
                </p>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-fade-in">
            ✅ {successMessage}
          </div>
        )}

        {showError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fade-in">
            ❌ {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Tambah Stok</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Stok */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">ID Stok</label>
                <div className="p-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                  Auto-generated
                </div>
              </div>
              
              {/* Nama Stok */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Nama Stok</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nama ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan nama stok"
                />
                {errors.nama && <p className="text-red-500 text-sm">{errors.nama}</p>}
              </div>
              
              {/* Satuan Stok */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Satuan Stok</label>
                <select
                  name="satuan"
                  value={formData.satuan}
                  onChange={handleChange}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.satuan ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="pcs">Pcs</option>
                  <option value="kg">Kg</option>
                  <option value="liter">Liter</option>
                  <option value="meter">Meter</option>
                  <option value="pack">Pack</option>
                  <option value="dus">Dus</option>
                </select>
                {errors.satuan && <p className="text-red-500 text-sm">{errors.satuan}</p>}
              </div>
              
              {/* Harga Stok */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Harga Stok</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <input
                    type="number"
                    name="harga"
                    value={formData.harga}
                    onChange={handleChange}
                    className={`w-full p-2.5 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.harga ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    min="0"
                  />
                </div>
                {errors.harga && <p className="text-red-500 text-sm">{errors.harga}</p>}
              </div>
              
              {/* Tanggal Stok */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Tanggal Stok</label>
                <input
                  type="date"
                  name="tanggal_masuk"
                  value={formData.tanggal_masuk}
                  onChange={handleChange}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.tanggal_masuk ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tanggal_masuk && <p className="text-red-500 text-sm">{errors.tanggal_masuk}</p>}
              </div>
              
              {/* Jumlah Stok */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Jumlah Stok</label>
                <input
                  type="number"
                  name="jumlah"
                  value={formData.jumlah}
                  onChange={handleChange}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.jumlah ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.jumlah && <p className="text-red-500 text-sm">{errors.jumlah}</p>}
              </div>
              
              {/* Supplier Stok */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Supplier Stok</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.supplier ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan nama supplier"
                />
                {errors.supplier && <p className="text-red-500 text-sm">{errors.supplier}</p>}
              </div>
            </div>
            
            {/* Tombol Aksi */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
        
        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.3s ease-out; }
        `}</style>
      </div>
    </div>
  );
} 