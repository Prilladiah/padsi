// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { User } from '@/types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Kelola Stok',
      href: '/stok',
      icon: '📦',
      roles: ['manager', 'staff']
    },
    {
      name: 'Laporan',
      href: '/laporan',
      icon: '📊',
      roles: ['manager'] // Hanya manager yang bisa akses
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">SIPS</h1>
        <p className="text-sm text-gray-600">Sanguku</p>
        <div className="mt-2 text-xs text-gray-500">
          Login sebagai: <span className="font-semibold capitalize">{user.role}</span>
        </div>
      </div>
      
      <nav className="flex-1 mt-6">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
              pathname.startsWith(item.href) ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
            }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center w-full text-gray-700 hover:text-red-600 transition-colors text-sm"
        >
          <span className="mr-3">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}