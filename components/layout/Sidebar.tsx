// components/layout/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type UserRole = 'manager' | 'staff';

type User = {
  role: UserRole;
  name?: string;
  username?: string;
};

// Helper: Get current user from localStorage based on username
function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Coba ambil dari current_user (jika sudah ada sistem login)
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user;
    }

    // Fallback: cek username dari localStorage
    const username = localStorage.getItem('username');
    if (!username) return null;

    // Mapping username ke role (hapus admin)
    const usernameLower = username.toLowerCase();
    
    if (usernameLower === 'manager' || usernameLower.includes('manager')) {
      return { role: 'manager', name: username, username };
    } else {
      return { role: 'staff', name: username, username };
    }
  } catch {
    return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userData = getCurrentUser();
    setUser(userData);
    setIsLoggedIn(!!userData);
  }, []);

  // Jangan tampilkan sidebar di halaman login
  if (pathname === '/') {
    return null;
  }

  // Jika tidak ada user yang login, jangan tampilkan sidebar
  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('username');
    router.push('/');
  };

  // Navigation berdasarkan role
  const getNavigation = () => {
    if (user?.role === 'staff') {
      // Staff hanya bisa akses Laporan
      return [
        {
          name: 'Laporan',
          href: '/laporan',
          icon: '📊',
          accessible: true,
        }
      ];
    } else {
      // Manager bisa akses semua
      return [
        {
          name: 'Stok',
          href: '/stok',
          icon: '📦',
          accessible: true,
        },
        {
          name: 'Laporan',
          href: '/laporan',
          icon: '📊',
          accessible: true,
        }
      ];
    }
  };

  const navigation = getNavigation();

  return (
    <div className="w-[250px] bg-[#1e3a8a] min-h-screen flex flex-col">
      {/* Navigation - langsung mulai dari sini tanpa profile di atas */}
      <nav className="flex-1 py-2 mt-4">
        {navigation.map((item) => {
          if (!item.accessible) return null;
          
          const isActive = pathname.startsWith(item.href);
          
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-white/10 border-l-4 border-white text-white'
                  : 'text-white/80 hover:bg-white/5 border-l-4 border-transparent'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Logout Button at Bottom */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}