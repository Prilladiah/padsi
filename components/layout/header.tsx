// components/layout/header.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const [user] = useState({
    name: 'Arel Laffte Dinoris',
    role: 'Manager'
  });

  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex justify-between items-center px-6 py-3 relative">
        {/* Logo SIPS di Kiri */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-800"></h1>
        </div>
        
        {/* Logo Sanguku di Tengah */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/sangukulogo.png"
                alt="Sanguku Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* Profile di Kanan Atas */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </div>
      </div>
    </header>
  );
}