'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Validasi sederhana - DIUBAH
      if (username === 'manager' && password === 'manager123') {
        localStorage.setItem('user', JSON.stringify({
          username,
          role: 'manager',
          nama: 'Arel Lafito Dinoris'
        }))
        router.push('/dashboard')
      } else if (username === 'staff' && password === 'staff123') {
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
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px 30px',
        borderRadius: '15px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '450px'
      }}>
        {/* Header dengan gambar profil */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'white',
            margin: '0 auto 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid #667eea',
            overflow: 'hidden'
          }}>
            {/* Ganti URL dengan gambar sanguku Anda */}
            <img 
              src="/loginsanguku.png" 
              alt="Sanguku Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                // Fallback jika gambar tidak load
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div style="
                      width: 100%;
                      height: 100%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      background: #667eea;
                      color: white;
                      font-size: 2rem;
                      font-weight: bold;
                    ">S</div>
                  `;
                }
              }}
            />
          </div>
          <h2 style={{ 
            color: '#333', 
            marginBottom: '10px',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Welcome back!
          </h2>
        </div>
        
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          {/* Username Section */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#555',
              fontSize: '0.9rem'
            }}>
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
                padding: '15px',
                border: '2px solid #e9ecef',
                borderRadius: '10px',
                fontSize: '1rem',
                background: '#f8f9fa',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.background = 'white'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef'
                e.target.style.background = '#f8f9fa'
              }}
            />
          </div>
          
          {/* Password Section */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#555',
              fontSize: '0.9rem'
            }}>
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
                padding: '15px',
                border: '2px solid #e9ecef',
                borderRadius: '10px',
                fontSize: '1rem',
                background: '#f8f9fa',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.background = 'white'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef'
                e.target.style.background = '#f8f9fa'
              }}
            />
          </div>

          {/* Remember me dan Forgot password */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              color: '#666',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  marginRight: '8px',
                  transform: 'scale(1.2)'
                }}
              />
              Remember me
            </label>
            
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Forgot password?
            </button>
          </div>
          
          {/* Login Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '10px'
                }}></div>
                Logging in...
              </div>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* Informasi Login untuk Testing - DIUBAH */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          padding: '20px', 
          borderRadius: '10px',
          marginTop: '25px',
          color: 'white'
        }}>
          <h4 style={{ marginBottom: '15px', textAlign: 'center', fontSize: '1rem' }}>Informasi Login (Testing):</h4>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.9)', 
              padding: '15px', 
              borderRadius: '8px',
              color: '#333'
            }}>
              <strong style={{ color: '#667eea' }}>Manager</strong>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>Username: manager</p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>Password: manager123</p>
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.9)', 
              padding: '15px', 
              borderRadius: '8px',
              color: '#333'
            }}>
              <strong style={{ color: '#667eea' }}>Staff</strong>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>Username: staff</p>
              <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>Password: staff123</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}