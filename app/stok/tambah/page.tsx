'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useOfflineMode } from '@/hooks/useofflinemode';
import OfflineStorageManager from '@/app/lib/offlinestorage'; // ✅ TAMBAHKAN INI
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

        {/* Rest of the form - copy from original file */}
        
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