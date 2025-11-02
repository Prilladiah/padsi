'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface User {
  id: string
  name: string
  role: string
  email?: string
}

interface StokData {
  id: number
  nama_stok: string
  harga_stok: string
  jumlah_stok: number
  satuan_stok: string
  supplier_stok: string
  tanggal_stok: string
}

export default function HapusStokPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stokData, setStokData] = useState<StokData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const stokId = searchParams.get('id')

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const userData = localStorage.getItem('user')
          if (!userData) {
            router.push('/login')
            return
          }
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchStokData = async () => {
      if (!stokId) {
        router.push('/stok')
        return
      }

      try {
        // Mock data - replace with actual API call
        const mockStokData: StokData = {
          id: parseInt(stokId),
          nama_stok: 'French Fries',
          harga_stok: '50000',
          jumlah_stok: 12,
          satuan_stok: 'pcs',
          supplier_stok: 'E-Commerce',
          tanggal_stok: '2025-01-01'
        }
        setStokData(mockStokData)
      } catch (error) {
        console.error('Error fetching stok data:', error)
        setShowError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchStokData()
  }, [stokId, router])

  const handleHapusStok = async () => {
    if (!stokData) return

    try {
      // Simulasi API call untuk hapus stok
      console.log('Menghapus stok ID:', stokData.id)
      
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/stok')
      }, 1500)
      
    } catch (error) {
      console.error('Gagal menghapus stok:', error)
      setShowError(true)
    }
  }

  const handleCancel = () => {
    router.push('/stok')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !stokData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Hapus Stok</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Role: {user.role}</span>
              <span className="text-sm text-gray-600">User: {user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            Stok Berhasil Dihapus!
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Stok Gagal Dihapus!
          </div>
        )}

        {/* Confirmation Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Konfirmasi Hapus Stok
            </h2>
            <p className="text-gray-600">
              Apakah Anda yakin ingin menghapus stok ini? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          {/* Stok Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Detail Stok:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nama Stok:</span>
                <p className="text-gray-900">{stokData.nama_stok}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Harga:</span>
                <p className="text-gray-900">Rp {parseInt(stokData.harga_stok).toLocaleString('id-ID')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Jumlah:</span>
                <p className="text-gray-900">{stokData.jumlah_stok} {stokData.satuan_stok}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Supplier:</span>
                <p className="text-gray-900">{stokData.supplier_stok}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tanggal:</span>
                <p className="text-gray-900">{stokData.tanggal_stok}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleHapusStok}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Hapus Stok
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}