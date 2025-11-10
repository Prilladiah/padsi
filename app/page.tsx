// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bgUrl, setBgUrl] = useState('/loginsanguku.png'); // default background
  const [tempBgUrl, setTempBgUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simpan dan ambil background dari localStorage
  useEffect(() => {
    const savedBg = localStorage.getItem('loginBg');
    if (savedBg) setBgUrl(savedBg);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = auth.login(username, password);
      if (user) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (user.role === 'manager') {
          window.location.href = '/stok';
        } else {
          window.location.href = '/laporan/stok';
        }
      } else {
        setError('Username atau password salah!');
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      setError('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  // Ubah background image via link
  const handleChangeBackground = () => {
    if (tempBgUrl.trim() !== '') {
      setBgUrl(tempBgUrl);
      localStorage.setItem('loginBg', tempBgUrl);
    } else {
      setBgUrl('/loginsanguku.png');
      localStorage.removeItem('loginBg');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Gambar */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgUrl}
          alt="Background"
          fill
          className="object-cover transition-all duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/loginsanguku.png';
          }}
          priority
        />
      </div>

      {/* Overlay gelap transparan */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Kotak login dengan efek kaca biru */}
      <div className="relative z-20 max-w-md w-full bg-blue-600/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/30">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back!</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-white/30 text-white placeholder-white/80 border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white/30 text-white placeholder-white/80 border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-between items-center text-sm text-blue-100">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-blue-300" />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all ${
              isLoading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-white text-blue-700 hover:bg-blue-100'
            }`}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
