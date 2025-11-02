'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear session
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    
    // Redirect to login
    router.push('/login')
  }, [router])

  return (
    <div className="logout-page">
      <div className="logout-container">
        <h2>Logging out...</h2>
        <p>Anda sedang keluar dari sistem</p>
      </div>
    </div>
  )
}