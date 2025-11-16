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

function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user;
    }

    const username = localStorage.getItem('username');
    if (!username) return null;

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

    if (userData?.role === 'staff' && pathname === '/laporan') {
      router.push('/laporan/stok');
    }
  }, [pathname, router]);

  if (pathname === '/') {
    return null;
  }

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('username');
    router.push('/');
  };

  const getNavigation = () => {
    if (user?.role === 'staff') {
      return [
        {
          name: 'Laporan',
          href: '/laporan/stok',
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          accessible: true,
        }
      ];
    } else {
      return [
        {
          name: 'Stok',
          href: '/stok',
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          accessible: true,
        },
        {
          name: 'Laporan',
          href: '/laporan',
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          accessible: true,
        }
      ];
    }
  };

  const navigation = getNavigation();

  return (
    <div className="w-[160px] bg-[#1e40af] min-h-screen flex flex-col shadow-xl">
      {/* Header SIPS */}
      <div className="bg-[#1e3a8a] py-7 px-5 text-center border-b-4 border-[#60a5fa]">
        <h1 className="text-white font-bold text-2xl mb-1">SIPS</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        {navigation.map((item) => {
          if (!item.accessible) return null;
          
          const isActive = pathname.startsWith(item.href);
          
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-3 py-7 transition-all duration-200 ${
                isActive
                  ? 'bg-[#60a5fa] text-white shadow-lg'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className="font-semibold text-base">{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-5">
        <button
          onClick={handleLogout}
          className="w-full flex flex-col items-center justify-center gap-2 py-5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          title="Logout"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}