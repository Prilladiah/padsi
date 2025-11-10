// FILE: lib/auth-server.ts
import { cookies } from 'next/headers';
import { User } from '@/types';

// ✅ Helper untuk mendapatkan user dari cookies di server-side
export async function getServerUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies(); // ✅ Tambahkan await
    
    // Ambil data user dari cookies
    const userName = cookieStore.get('userName')?.value;
    const userRole = cookieStore.get('userRole')?.value;
    const isLoggedIn = cookieStore.get('isLoggedIn')?.value;

    if (isLoggedIn === 'true' && userName && userRole) {
      // Validate role
      if (userRole === 'manager' || userRole === 'staff') {
        return {
          name: userName,
          role: userRole as 'manager' | 'staff'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

// ✅ Helper untuk check apakah user adalah manager
export async function isServerManager(): Promise<boolean> {
  const user = await getServerUser();
  return user?.role === 'manager';
}

// ✅ Helper untuk check apakah user adalah staff
export async function isServerStaff(): Promise<boolean> {
  const user = await getServerUser();
  return user?.role === 'staff';
}