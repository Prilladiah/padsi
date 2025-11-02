'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Validasi sederhana
      if (username === 'manager_sanguku' && password === 'sanguku70945') {
        localStorage.setItem('user', JSON.stringify({
          username,
          role: 'manager',
          nama: 'Arel Lafito Dinoris'
        }))
        router.push('/dashboard')
      } else if (username === 'staff_sanguku' && password === 'sanguku70945') {
        localStorage.setItem('user', JSON.stringify({
          username,
          role: 'staff',
          nama: 'Prilla Diah Mawarni'
        }))
        router.push('/dashboard')
      } else {
        setError('Username atau password salah!')
      }
    } catch (error) {
      setError('Terjadi kesalahan saat login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#667eea', fontSize: '2.5rem', marginBottom: '5px' }}>SIPS</h1>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Sistem Informasi Pengelolaan Sanguku</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Welcome back!</h2>
          
          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#555' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '20px', 
          borderRadius: '10px',
          marginTop: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <h4 style={{ color: 'white', marginBottom: '15px', textAlign: 'center' }}>Informasi Login (Testing):</h4>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ background: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
              <strong>Manager</strong>
              <p>Username: manager_sanguku</p>
              <p>Password: sanguku70945</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #6c757d' }}>
              <strong>Staff</strong>
              <p>Username: staff_sanguku</p>
              <p>Password: sanguku70945</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}