// lib/auth.ts
'use client';

export type User = {
  username: string;
  role: 'manager' | 'staff';
  name: string;
};

export const auth = {
  login: (username: string, password: string): User | null => {
    const users = [
      { 
        username: 'manager', 
        password: 'manager123', 
        role: 'manager' as const, 
        name: 'Manager Utama' 
      },
      { 
        username: 'staff', 
        password: 'staff123', 
        role: 'staff' as const, 
        name: 'Staff Operasional' 
      }
    ];

    const user = users.find(u => 
      u.username === username && u.password === password
    );

    if (user) {
      const userData = {
        username: user.username,
        role: user.role,
        name: user.name
      };
      
      localStorage.setItem('current_user', JSON.stringify(userData));
      localStorage.setItem('username', user.username);
      
      return userData;
    }

    return null;
  },

  logout: () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('username');
  },

  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('current_user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch {
      return null;
    }
  },

  // ✅ TAMBAHKAN METHOD INI
  isManager: (): boolean => {
    const user = auth.getCurrentUser();
    return user?.role === 'manager';
  }
};