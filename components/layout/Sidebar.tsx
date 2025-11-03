// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Stok',
      href: '/stok',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
        </svg>
      ),
      roles: ['manager'] // Hanya manager
    },
    {
      name: 'Laporan',
      href: '/laporan',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['manager', 'staff'] // Manager dan staff
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="w-48 bg-blue-900 shadow-lg flex flex-col h-screen">
      {/* Header - Kosongkan kontennya */}
      <div className="p-4 border-b border-blue-800">
        {/* Hapus semua tulisan di header */}
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 mt-4">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-4 py-2 text-sm transition-colors ${
              pathname.startsWith(item.href) 
                ? 'bg-blue-800 text-white border-r-2 border-blue-300' 
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Footer dengan Logout */}
      <div className="p-4 border-t border-blue-800">
        <button 
          onClick={onLogout}
          className="flex items-center w-full text-blue-200 hover:text-white hover:bg-blue-800 px-2 py-2 rounded transition-colors text-xs"
        >
          <span className="mr-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          Logout
        </button>
      </div>
    </div>
  );
}