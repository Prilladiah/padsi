// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const user = auth.login(username, password);
    
    if (user) {
      router.push('/stok');
    } else {
      setError('Username atau password salah!');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'url("/loginsanguku.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay untuk membuat konten lebih mudah dibaca */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      <div className="max-w-md w-full bg-blue-700 bg-opacity-20 backdrop-blur-md rounded-lg shadow-xl p-8 relative z-10 border border-blue-200 border-opacity-30">
        {/* Header dengan Welcome back */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
          <p className="text-blue-100 text-sm">Please enter your details to sign in</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* Username Section */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-blue-300 border-opacity-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-white placeholder-blue-200"
              placeholder="Enter your username"
              required
            />
          </div>
          
          {/* Password Section */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white bg-opacity-20 border border-blue-300 border-opacity-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-white placeholder-blue-200"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Remember me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label className="ml-2 text-sm font-medium text-white">
              Remember me
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full bg-white text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium text-lg"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}