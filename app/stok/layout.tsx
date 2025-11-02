// app/stok/layout.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@/types';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    
    if (!currentUser) {
      router.push('/');
    } else {
      setUser(currentUser);
    }
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}