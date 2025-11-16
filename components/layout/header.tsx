// components/Header.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'manager' | 'staff';

interface User {
  role: UserRole;
  name?: string;
  username?: string;
}

function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      return JSON.parse(userStr);
    }

    const username = localStorage.getItem('username');
    if (!username) return null;

    const usernameLower = username.toLowerCase();
    
    if (usernameLower === 'admin' || usernameLower.includes('admin')) {
      return { role: 'admin', name: username, username };
    } else if (usernameLower === 'manager' || usernameLower.includes('manager')) {
      return { role: 'manager', name: username, username };
    } else {
      return { role: 'staff', name: username, username };
    }
  } catch {
    return null;
  }
}

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    // Set isClient menjadi true setelah component mount di client
    setIsClient(true);
    
    const userData = getCurrentUser();
    setUser(userData);
    setIsOnline(navigator.onLine);

    // Fungsi untuk mengecek koneksi internet dengan ping
    const checkConnection = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Coba ping ke multiple endpoints untuk lebih reliable
        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Status: Online');
        setIsOnline(true);
      } catch (error) {
        console.log('Status: Offline - Tidak ada koneksi', error);
        setIsOnline(false);
      }
    };

    const handleOnline = () => {
      console.log('Browser: Online - Memverifikasi koneksi...');
      setIsOnline(true); // Set langsung ke true
      checkConnection(); // Lalu verifikasi
    };
    
    const handleOffline = () => {
      console.log('Browser: Offline');
      setIsOnline(false);
    };

    // Cek koneksi saat pertama kali load
    checkConnection();

    // Cek koneksi setiap 30 detik
    const intervalId = setInterval(checkConnection, 30000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('username');
    router.push('/');
  };

  if (!isClient || !user) return null;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between relative">
        {/* LEFT SECTION - Status Online/Offline */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
            {/* Icon Online */}
            {isOnline ? (
              <svg 
                className="w-4 h-4 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
                />
              </svg>
            ) : (
              /* Icon Offline */
              <svg 
                className="w-4 h-4 text-orange-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" 
                />
              </svg>
            )}
            <span className={`text-xs font-semibold ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
              Status {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* CENTER SECTION - Logo Sanguku */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
          {/* Logo Image - Ganti path sesuai lokasi logo Anda */}
          <img 
            src="/sangukulogo.png" 
            alt="Logo Sanguku" 
            className="w-12 h-12 object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.classList.remove('hidden');
                fallback.style.display = 'flex';
              }
            }}
          />
          {/* Fallback Icon - Muncul jika logo tidak ditemukan */}
          <div className="hidden w-12 h-12 bg-blue-600 rounded-lg items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
          </div>
        </div>

        {/* RIGHT SECTION - User Profile */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {/* Profile Button */}
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              {/* User Info */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 capitalize">
                  {user.role}
                </p>
                <p className="text-xs text-gray-600">
                  {user.name || user.username || 'User'}
                </p>
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>

              {/* Chevron Icon */}
              <svg 
                className="w-4 h-4 text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}