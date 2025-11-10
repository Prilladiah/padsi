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
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  // Simpan dan ambil background dari localStorage
  useEffect(() => {
    const savedBg = localStorage.getItem('loginBg');
    if (savedBg) setBgUrl(savedBg);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi username
    if (!username.trim()) {
      setPopupMessage('Username harus diisi!');
      setShowPopup(true);
      return;
    }

    // Validasi password
    if (!password.trim()) {
      setPopupMessage('Password harus diisi!');
      setShowPopup(true);
      return;
    }

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

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
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

      {/* Pop-up Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closePopup}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="text-center">
              {/* Icon Warning */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg 
                  className="h-10 w-10 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Message */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Perhatian!
              </h3>
              <p className="text-gray-600 mb-6 text-base">
                {popupMessage}
              </p>

              {/* Button */}
              <button
                onClick={closePopup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                OK, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

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