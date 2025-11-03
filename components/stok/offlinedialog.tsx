// components/stok/offlinedialog.tsx
'use client';

interface OfflineDialogProps {
  onEnable: () => void;
  onCancel: () => void;
}

export default function OfflineDialog({ onEnable, onCancel }: OfflineDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Icon & Title */}
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <svg 
              className="w-6 h-6 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Internet Terputus!
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Koneksi internet Anda terdeteksi terputus
            </p>
          </div>
        </div>
        
        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-700">
            Apakah Anda ingin <strong>mengaktifkan mode offline</strong> untuk tetap menggunakan sistem?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dalam mode offline, data akan disimpan secara lokal dan disinkronisasi otomatis ketika koneksi kembali.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Batal
          </button>
          <button
            onClick={onEnable}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ya, Aktifkan Mode Offline
          </button>
        </div>
      </div>
    </div>
  );
}