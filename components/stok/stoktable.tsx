// components/stok/StokTable.tsx
'use client';

import { useState, useEffect } from 'react';
import { StokItem } from '@/types';

type UserRole = 'admin' | 'manager' | 'staff';

interface User {
  role: UserRole;
  name?: string;
}

interface StokTableProps {
  data: StokItem[];
  onEdit: (item: StokItem) => void;
  onDelete: (id: string) => void;
  isOffline?: boolean;
}

// Helper: Get current user from localStorage based on username
function getCurrentUser(): User {
  if (typeof window === 'undefined') return { role: 'staff', name: 'Guest' };
  
  try {
    // Coba ambil dari current_user (jika sudah ada sistem login)
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user;
    }

    // Fallback: cek username dari localStorage
    const username = localStorage.getItem('username');
    if (!username) return { role: 'staff', name: 'Guest' };

    // Mapping username ke role
    const usernameLower = username.toLowerCase();
    
    if (usernameLower === 'admin' || usernameLower.includes('admin')) {
      return { role: 'admin', name: username };
    } else if (usernameLower === 'manager' || usernameLower.includes('manager')) {
      return { role: 'manager', name: username };
    } else {
      return { role: 'staff', name: username };
    }
  } catch {
    return { role: 'staff', name: 'Guest' };
  }
}

export default function StokTable({ data, onEdit, onDelete, isOffline = false }: StokTableProps) {
  const [currentUser, setCurrentUser] = useState<User>({ role: 'staff' });

  // Load user role
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // ===== PERMISSION CHECKS =====
  const canEdit = currentUser.role === 'admin' || currentUser.role === 'manager';
  const canDelete = currentUser.role === 'admin' || currentUser.role === 'manager';
  const isStaffOnly = currentUser.role === 'staff';

  // ✅ FIX: Handle delete dengan konfirmasi dan logging
  const handleDelete = (id: string) => {
    if (!canDelete) {
      alert('❌ Anda tidak memiliki izin untuk menghapus data.\nHubungi Admin atau Manager.');
      return;
    }

    console.log('🗑️ StokTable - Delete button clicked, ID:', id, 'Type:', typeof id);
    
    // Validasi ID sebelum melanjutkan
    if (!id || id === '0' || id === 'undefined') {
      console.error('❌ StokTable - Invalid ID:', id);
      return;
    }
    
    onDelete(id);
  };

  // ✅ FIX: Handle edit dengan logging
  const handleEdit = (item: StokItem) => {
    if (!canEdit) {
      alert('❌ Anda tidak memiliki izin untuk mengedit data.\nHubungi Admin atau Manager.');
      return;
    }

    console.log('✏️ StokTable - Edit button clicked:', item.id, item.nama);
    onEdit(item);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isOffline && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="flex items-center text-yellow-800 text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Mode Offline - Data akan disinkronisasi ketika koneksi kembali
            </div>
          </div>
        )}
        
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data stok</h3>
          <p className="text-gray-500">
            {canEdit ? 'Mulai dengan menambahkan item stok baru.' : 'Belum ada data stok tersedia.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Offline Mode Indicator */}
      {isOffline && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center text-yellow-800 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Mode Offline - Data akan disinkronisasi ketika koneksi kembali
          </div>
        </div>
      )}

      {/* Staff Read-Only Warning */}
      {isStaffOnly && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center text-blue-800 text-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            Mode Hanya Lihat - Anda tidak dapat mengedit atau menghapus data
          </div>
        </div>
      )}

      {/* Table Info */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Menampilkan {data.length} item
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              👤 {currentUser.role.toUpperCase()}
            </span>
          </div>
          {isOffline && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              📦 Offline Mode
            </span>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Barang
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jumlah
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satuan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Masuk
              </th>
              
              {/* Kolom Aksi - HIDDEN untuk staff */}
              {!isStaffOnly && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr 
                key={`${item.id}-${index}`} 
                className={`hover:bg-gray-50 transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {item.nama}
                    {isOffline && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                        offline
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 max-w-[120px] truncate">
                    {item.supplier}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.jumlah.toLocaleString('id-ID')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    {item.satuan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">
                    Rp {item.harga.toLocaleString('id-ID')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {new Date(item.tanggal_masuk).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                </td>
                
                {/* Kolom Aksi - HIDDEN untuk staff */}
                {!isStaffOnly && (
                  <td className="px-6 py-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
                        title={`Edit ${item.nama}`}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors duration-150"
                        title={`Hapus ${item.nama}`}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total: {data.length} items</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 rounded-full mr-1"></div>
              Supplier
            </span>
            <span className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded-full mr-1"></div>
              Satuan
            </span>
            {isOffline && (
              <span className="flex items-center text-yellow-600">
                <div className="w-3 h-3 bg-yellow-100 rounded-full mr-1"></div>
                Offline
              </span>
            )}
            {isStaffOnly && (
              <span className="flex items-center text-blue-600">
                <div className="w-3 h-3 bg-blue-100 rounded-full mr-1"></div>
                Read-Only
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}