// lib/auth.ts
import { User } from '@/types';

export const auth = {
  login: (username: string, password: string): User | null => {
    let user: User | null = null;
    
    if (username.toLowerCase() === 'manager' && password === 'manager123') {
      user = {
        name: 'Arel Lafito Dinoris',
        role: 'manager'
      };
    } else if (username.toLowerCase() === 'staff' && password === 'staff123') {
      user = {
        name: 'Staff User',
        role: 'staff'
      };
    }
    
    if (user) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
    }
    
    return user;
  },

  logout: () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole') as 'manager' | 'staff' | null;
    const userName = localStorage.getItem('userName');

    if (isLoggedIn && userRole && userName) {
      return {
        name: userName,
        role: userRole
      };
    }
    
    return null;
  },

  isManager: (): boolean => {
    const user = auth.getCurrentUser();
    return user?.role === 'manager';
  },

  isStaff: (): boolean => {
    const user = auth.getCurrentUser();
    return user?.role === 'staff';
  }
};