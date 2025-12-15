// components/layout/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type User = {
  name?: string;
  username?: string;
  role?: 'manager' | 'staff';
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);
  const [userRole, setUserRole] = useState<'manager' | 'staff' | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Cek apakah di halaman login
    if (pathname === '/') {
      setShowSidebar(false);
      return;
    }

    // Cek login
    try {
      const userStr = localStorage.getItem('current_user');
      if (!userStr) {
        setShowSidebar(false);
        return;
      }

      const user = JSON.parse(userStr);
      setUserRole(user.role || 'staff');
      setUserName(user.name || user.username || '');
      setShowSidebar(true);

      // PERBAIKAN: Staff hanya bisa akses STOK (view-only), tidak bisa akses LAPORAN
      if (user.role === 'staff' && pathname === '/laporan') {
        router.push('/stok'); // Redirect staff ke halaman stok
      }
    } catch {
      setShowSidebar(false);
    }
  }, [pathname, router]);

  if (!showSidebar || !userRole) {
    return null;
  }

  const isManager = userRole === 'manager';

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('username');
    localStorage.removeItem('user_role');
    router.push('/');
  };

  // Navigation menu untuk MANAGER
  const managerNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: 'Stok',
      href: '/stok',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Laporan',
      href: '/laporan',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    }
  ];

  // Navigation menu untuk STAFF - HANYA bisa akses STOK (view-only), TIDAK bisa akses LAPORAN
  const staffNavigation = [
    {
      name: 'Stok',
      href: '/stok',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    }
  ];

  const navigation = isManager ? managerNavigation : staffNavigation;

  return (
    <div className="w-48 bg-[#1e40af] min-h-screen flex flex-col shadow-xl">
      {/* Header SIPS saja - tanpa teks Manager Utama atau Manager */}
      <div className="py-8 px-4">
        <div className="flex flex-col items-center justify-center">
          {/* Logo/Icon SIPS */}
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <span className="text-[#1e40af] font-bold text-2xl">SIPS</span>
          </div>
          
          {/* Nama Sistem */}
          <h1 className="text-white font-bold text-2xl mb-1"></h1>
          <p className="text-blue-200 text-xs text-center">
            Sistem Informasi<br />Pengelolaan Stok
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 py-4 px-6 transition-all duration-200 ${
                isActive
                  ? 'bg-[#60a5fa] text-white shadow-lg'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className="font-semibold text-sm">{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-600">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}