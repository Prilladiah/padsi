// app/laporan/page.tsx
'use client';

import Link from 'next/link';
import Header from '@/components/layout/header';

export default function LaporanPage() {
  const laporanItems = [
    {
      title: 'Laporan Pendapatan',
      description: 'Laporan pemasukan dan pendapatan bulanan',
      href: '/laporan/pendapatan',
      icon: '💰',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Laporan Pengeluaran',
      description: 'Laporan pengeluaran dan biaya operasional',
      href: '/laporan/pengeluaran',
      icon: '📈',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Laporan Stok',
      description: 'Laporan pergerakan dan kondisi stok',
      href: '/laporan/stok',
      icon: '📦',
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan Profile di Kanan Atas */}
      <Header />
      
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
          <p className="text-gray-600">Akses berbagai laporan sistem</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {laporanItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}