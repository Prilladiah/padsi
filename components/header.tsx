'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SIPS Dashboard</h1>
            <p className="text-gray-600 capitalize">{user?.role || 'Manager'}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold">{user?.username || 'Manager'} Sanguku</p>
              <p className="text-sm text-gray-600">Sistem Informasi Pengelolaan Sanguku</p>
            </div>
            <img
              src="/profile.png"
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-blue-500"
            />
            <Link 
              href="/logout"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}