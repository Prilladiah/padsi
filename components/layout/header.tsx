'use client'
import { useRouter } from 'next/navigation'

interface User {
  username: string
  role: string
  nama: string
}

interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    router.push('/login')
  }

  return (
    <header className="header">
      <div>
        <h1>SIPS - Sistem Informasi Pengelolaan Sanguku</h1>
      </div>
      <div className="user-info">
        <span>Welcome, {user.nama} ({user.role})</span>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>
    </header>
  )
}