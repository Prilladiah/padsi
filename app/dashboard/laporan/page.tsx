'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LaporanCard from '@/components/laporancard';
import LaporanStats from '@/components/laporanstats';

export default function LaporanPage() {
  const statsData = [
    {
      title: 'Total Pendapatan',
      value: 'Rp 12.4Jt',
      change: 12.5,
      icon: 'revenue' as const,
      trend: 'up' as const
    },
    {
      title: 'Total Pengeluaran',
      value: 'Rp 3.2Jt',
      change: -5.2,
      icon: 'expense' as const,
      trend: 'down' as const
    },
    {
      title: 'Stok Tersedia',
      value: '45 Items',
      change: 8.3,
      icon: 'stock' as const,
      trend: 'up' as const
    },
    {
      title: 'Transaksi',
      value: '1.2K',
      change: 15.7,
      icon: 'sales' as const,
      trend: 'up' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Laporan</h1>
        </div>

        {/* Stats */}
        <LaporanStats stats={statsData} />

        {/* Laporan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LaporanCard
            type="pendapatan"
            title="Laporan Pendapatan"
            description="Laporan detail pendapatan per unit bisnis dengan filter periode"
            value="Rp 12.4Jt"
            trend={{ value: 12.5, isPositive: true }}
            href="/dashboard/laporan/pendapatan"
          />

          <LaporanCard
            type="pengeluaran"
            title="Laporan Pengeluaran"
            description="Laporan detail pengeluaran dengan analisis per kategori"
            value="Rp 3.2Jt"
            trend={{ value: -5.2, isPositive: false }}
            href="/dashboard/laporan/pengeluaran"
          />

          <LaporanCard
            type="stok"
            title="Laporan Stok"
            description="Monitoring stok dengan analisis pergerakan dan sisa stok"
            value="45 Items"
            trend={{ value: 8.3, isPositive: true }}
            href="/dashboard/laporan/stok"
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Semua Laporan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
              <div className="w-6 h-6 text-blue-600 font-bold">DOC</div>
              <span>Microsoft Word</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
              <div className="w-6 h-6 text-green-600 font-bold">XLS</div>
              <span>Microsoft Excel</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
              <div className="w-6 h-6 text-red-600 font-bold">PDF</div>
              <span>PDF Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}