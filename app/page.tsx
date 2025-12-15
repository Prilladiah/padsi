'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bgUrl, setBgUrl] = useState('/loginsanguku.png');
  const [tempBgUrl, setTempBgUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  // Load background dari localStorage
  useEffect(() => {
    const savedBg = localStorage.getItem('loginBg');
    if (savedBg) setBgUrl(savedBg);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setPopupMessage('Username harus diisi!');
      setShowPopup(true);
      return;
    }

    if (!password.trim()) {
      setPopupMessage('Password harus diisi!');
      setShowPopup(true);
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.login(username, password);

      if (user) {
        // ✅ SIMPAN LOGIN KE COOKIE (DIBACA MIDDLEWARE)
        document.cookie = `user=${encodeURIComponent(
          JSON.stringify({
            username: user.username,
            role: user.role, // manager / staff
          })
        )}; path=/`;

        await new Promise((resolve) => setTimeout(resolve, 100));

        // ✅ SEMUA USER MASUK KE HALAMAN STOK
        window.location.href = '/stok';
      } else {
        setError('Username atau password salah!');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgUrl}
          alt="Background"
          fill
          className="object-cover"
          priority
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/loginsanguku.png';
          }}
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closePopup}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-3 text-center">Perhatian</h3>
            <p className="text-gray-600 mb-5 text-center">
              {popupMessage}
            </p>
            <button
              onClick={closePopup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Login Box */}
      <div className="relative z-20 max-w-md w-full bg-blue-600/40 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/30">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Welcome Back
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="text-white text-sm mb-1 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg bg-white/30 text-white placeholder-white/80 border border-white/40 focus:outline-none"
              placeholder="username"
            />
          </div>

          <div>
            <label className="text-white text-sm mb-1 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg bg-white/30 text-white placeholder-white/80 border border-white/40 focus:outline-none"
              placeholder="password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
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
