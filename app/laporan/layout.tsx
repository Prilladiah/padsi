// app/laporan/layout.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type User = {
  role: 'manager' | 'staff';
  name?: string;
};

export default function LaporanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userStr = localStorage.getItem('current_user');
        
        if (!userStr) {
          router.push('/');
          return;
        }

        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsLoading(false);
        
      } catch (error) {
        localStorage.removeItem('current_user');
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-600 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar dan header akan dihandle oleh root layout */}
      {children}
    </div>
  );
}