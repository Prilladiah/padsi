// app/laporan/page.tsx
'use client';

import Link from 'next/link';
import Header from '@/components/layout/header';

export default function LaporanPage() {
  // Daftar menu laporan
  const laporanItems = [
    {
      title: 'Laporan Pendapatan',
      description: '',
      href: '/laporan/pendapatan',
    },
    {
      title: 'Laporan Pengeluaran', 
      description: '',
      href: '/laporan/pengeluaran',
    },
    {
      title: 'Laporan Stok',
      description: '',
      href: '/laporan/stok',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header dengan profil di kanan atas */}
      <Header />

      {/* Konten utama */}
      <main className="p-6 max-w-4xl mx-auto">
        {/* Judul halaman */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan</h1>
        </header>

        {/* Grid daftar laporan */}
        <section className="space-y-4">
          {laporanItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block bg-blue-800 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <div className="w-full h-px bg-blue-500 mb-4"></div>
              <p className="text-blue-100 text-sm">{item.description}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}