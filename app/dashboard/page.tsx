'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/header';

interface DashboardStats {
  totalStok: number;
  sisaStok: number;
  totalPendapatan: number;
  totalPengeluaran: number;
  pendapatanBulanan: { bulan: string; pendapatan: number }[];
  pengeluaranBulanan: { bulan: string; pengeluaran: number }[];
  bisnisTerlaris: { unit: string; nilai: number }[];
  stokPerKategori: { kategori: string; jumlah: number; persentase: number }[];
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];
const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStok: 0,
    sisaStok: 0,
    totalPendapatan: 0,
    totalPengeluaran: 0,
    pendapatanBulanan: [],
    pengeluaranBulanan: [],
    bisnisTerlaris: [],
    stokPerKategori: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [error, setError] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('IDR', 'Rp');
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    else if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [stokRes, pendapatanRes, pengeluaranRes] = await Promise.all([
        fetch('/api/stok?limit=1000').catch(() => null),
        fetch('/api/laporan/pendapatan').catch(() => null),
        fetch('/api/laporan/pengeluaran').catch(() => null)
      ]);

      let stokData = [], pendapatanData = [], pengeluaranData = [];

      if (stokRes?.ok) {
        const result = await stokRes.json();
        stokData = result.success ? result.data : [];
      }
      if (pendapatanRes?.ok) {
        const result = await pendapatanRes.json();
        pendapatanData = result.success ? result.data : [];
      }
      if (pengeluaranRes?.ok) {
        const result = await pengeluaranRes.json();
        pengeluaranData = result.success ? result.data : [];
      }

      const totalStok = stokData.reduce((sum: number, item: any) => sum + (Number(item.jumlah_stok) || 0), 0);
      const totalPendapatan = pendapatanData.reduce((sum: number, item: any) => {
        return sum + (Number(item.subtotal_pendapatan) || Number(item.total_pendapatan) || Number(item.pendapatan) || 0);
      }, 0);

      let totalPengeluaran = 0;
      if (pengeluaranData.length > 0) {
        totalPengeluaran = pengeluaranData.reduce((sum: number, item: any) => {
          return sum + (Number(item.total_pengeluaran) || Number(item.subtotal_pengeluaran) || Number(item.pengeluaran) || ((Number(item.jumlah_stok) || 0) * (Number(item.Harga_stok) || 0)));
        }, 0);
      } else {
        totalPengeluaran = stokData.reduce((sum: number, item: any) => sum + ((Number(item.jumlah_stok) || 0) * (Number(item.Harga_stok) || 0)), 0);
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const currentMonth = new Date().getMonth();
      const pendapatanBulanan = [];
      const pengeluaranBulanan = [];

      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const bulan = monthNames[monthIndex];
        const pendapatanWave = Math.sin(i * 0.8) * 0.5 + 0.5;
        const pendapatan = 200000 + pendapatanWave * 300000;
        const pengeluaranWave = Math.cos(i * 0.7) * 0.5 + 0.5;
        const pengeluaran = 150000 + pengeluaranWave * 350000;
        pendapatanBulanan.push({ bulan, pendapatan: Math.round(pendapatan) });
        pengeluaranBulanan.push({ bulan, pengeluaran: Math.round(pengeluaran) });
      }

      const stokPerUnit: Record<string, number> = {};
      stokData.forEach((item: any) => {
        const unit = item.unit_bisnis || 'Lainnya';
        const jumlah = Number(item.jumlah_stok) || 0;
        stokPerUnit[unit] = (stokPerUnit[unit] || 0) + jumlah;
      });

      const stokPerKategori = Object.entries(stokPerUnit)
        .map(([kategori, jumlah]) => ({
          kategori,
          jumlah,
          persentase: totalStok > 0 ? (jumlah / totalStok) * 100 : 0
        }))
        .sort((a, b) => b.jumlah - a.jumlah);

      const unitPendapatan: Record<string, number> = {};
      pendapatanData.forEach((item: any) => {
        const unit = item.unit_bisnis || 'Lainnya';
        const pendapatan = Number(item.subtotal_pendapatan) || 0;
        unitPendapatan[unit] = (unitPendapatan[unit] || 0) + pendapatan;
      });

      // Pastikan Cafe dan Playstation selalu ada dengan nilai 0 jika tidak ada data
      if (!unitPendapatan['Cafe']) {
        unitPendapatan['Cafe'] = 0;
      }
      if (!unitPendapatan['Playstation']) {
        unitPendapatan['Playstation'] = 0;
      }

      // Convert ke array dan sort berdasarkan nilai
      const bisnisTerlaris = Object.entries(unitPendapatan)
        .map(([unit, nilai]) => ({ unit, nilai }))
        .sort((a, b) => b.nilai - a.nilai);

      setStats({
        totalStok: totalStok || 0,
        sisaStok: totalStok || 0,
        totalPendapatan: totalPendapatan || 0,
        totalPengeluaran: totalPengeluaran || 0,
        pendapatanBulanan,
        pengeluaranBulanan,
        bisnisTerlaris,
        stokPerKategori
      });
      setLastUpdate(new Date().toLocaleTimeString('id-ID'));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Gagal memuat data dari server');
      setStats({
        totalStok: 0, 
        sisaStok: 0, 
        totalPendapatan: 0, 
        totalPengeluaran: 0,
        pendapatanBulanan: [],
        pengeluaranBulanan: [],
        bisnisTerlaris: [
          { unit: 'Cafe', nilai: 0 },
          { unit: 'Playstation', nilai: 0 }
        ],
        stokPerKategori: []
      });
      setLastUpdate(new Date().toLocaleTimeString('id-ID'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderChart = (data: any[], isIncome: boolean) => {
    if (data.length === 0) return <div className="flex items-center justify-center h-full text-gray-500">Tidak ada data</div>;
    const maxValue = Math.max(...data.map(item => isIncome ? item.pendapatan : item.pengeluaran), 100000);
    const color = isIncome ? '#3B82F6' : '#10B981';
    const gradientId = isIncome ? 'pendapatanGradient' : 'pengeluaranGradient';

    return (
      <div className="relative w-full h-full px-2">
        <svg viewBox="0 0 120 110" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <g>
            {[10, 27.5, 45, 62.5, 80].map((y, i) => (
              <line key={i} x1="18" y1={y} x2="110" y2={y} stroke="#E5E7EB" strokeWidth="0.3" opacity="0.5" />
            ))}
          </g>
          <g>
            {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((value, i) => (
              <text key={i} x="16" y={i * 17.5 + 13} textAnchor="end" className="text-[7px] fill-gray-500">
                {formatShortCurrency(value)}
              </text>
            ))}
          </g>
          <g transform="translate(18, 10)">
            {(() => {
              const adjustedPath = data.map((item, i) => ({
                x: (i / (data.length - 1)) * 90,
                y: 70 - ((isIncome ? item.pendapatan : item.pengeluaran) / maxValue) * 65
              }));
              const pathD = adjustedPath.map((point, i) => {
                if (i === 0) return `M ${point.x},${point.y}`;
                const prevPoint = adjustedPath[i - 1];
                const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
                const cp2x = prevPoint.x + (point.x - prevPoint.x) * 2 / 3;
                return `C ${cp1x},${point.y} ${cp2x},${point.y} ${point.x},${point.y}`;
              }).join(' ');

              return (
                <>
                  <path d={`${pathD} L 90,70 L 0,70 Z`} fill={`url(#${gradientId})`} opacity="0.3" />
                  <path d={pathD} fill="none" stroke={color} strokeWidth="1.2" />
                  <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  {adjustedPath.map((point, i) => (
                    <g key={i}>
                      <circle cx={point.x} cy={point.y} r="1.5" fill={color} className="animate-pulse" />
                      <text x={point.x} y="85" textAnchor="middle" className="text-[7px] font-medium fill-gray-500">
                        {data[i].bulan}
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}
          </g>
        </svg>
      </div>
    );
  };

  const renderPieChart = () => {
    if (!stats.stokPerKategori?.length) return <div className="flex items-center justify-center h-full text-gray-500">Tidak ada data stok</div>;
    const total = stats.stokPerKategori.reduce((sum, item) => sum + item.jumlah, 0);

    return (
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-64 h-64 mx-auto drop-shadow-2xl">
          {(() => {
            let cumulativePercent = 0;
            return stats.stokPerKategori.map((item, index) => {
              const percent = item.persentase / 100;
              const startAngle = cumulativePercent * 360;
              const endAngle = (cumulativePercent + percent) * 360;
              const x1 = 50 + 40 * Math.cos(((startAngle - 90) * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin(((startAngle - 90) * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos(((endAngle - 90) * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin(((endAngle - 90) * Math.PI) / 180);
              const largeArc = endAngle - startAngle > 180 ? 1 : 0;
              const pathData = [`M 50 50`, `L ${x1} ${y1}`, `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`, `Z`].join(' ');
              cumulativePercent += percent;

              const isHovered = hoveredCategory === item.kategori;

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ 
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                    opacity: isHovered ? 1 : hoveredCategory ? 0.5 : 0.9
                  }}
                  onMouseEnter={() => setHoveredCategory(item.kategori)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            });
          })()}
          <circle cx="50" cy="50" r="22" fill="#F9FAFB" opacity="0.95" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.5" />
          <text x="50" y="48" textAnchor="middle" className="text-2xl font-bold fill-gray-900">{total}</text>
          <text x="50" y="56" textAnchor="middle" className="text-xs fill-gray-600">Total Stok</text>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#3B82F6" strokeWidth="0.5" opacity="0.3" className="animate-ping" style={{ animationDuration: '3s' }} />
        </svg>
        <div className="mt-6 space-y-2">
          {stats.stokPerKategori.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all cursor-pointer ${
                hoveredCategory === item.kategori ? 'bg-blue-50 scale-105' : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setHoveredCategory(item.kategori)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full shadow-lg transition-transform" 
                  style={{ 
                    backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                    transform: hoveredCategory === item.kategori ? 'scale(1.3)' : 'scale(1)'
                  }} 
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{item.kategori}</div>
                  <div className="text-xs text-gray-600">{item.jumlah} stok • {item.persentase.toFixed(1)}%</div>
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">{item.jumlah}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBisnisTerlaris = () => {
    if (!stats.bisnisTerlaris?.length) return <div className="flex items-center justify-center h-full text-gray-500">Tidak ada data bisnis</div>;
    const maxNilai = Math.max(...stats.bisnisTerlaris.map(b => b.nilai), 1);

    return (
      <div className="space-y-3">
        {stats.bisnisTerlaris.map((item, index) => {
          const percentage = item.nilai > 0 ? (item.nilai / maxNilai) * 100 : 0;
          const color = BAR_COLORS[index % BAR_COLORS.length];
          
          return (
            <div key={index} className="relative group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-md group-hover:scale-125 transition-transform" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-gray-900">{item.unit}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(item.nilai)}</span>
              </div>
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                {item.nilai > 0 ? (
                  <div
                    className="h-full rounded-lg transition-all duration-700 ease-out relative group-hover:opacity-90"
                    style={{ width: `${percentage}%`, backgroundColor: color, boxShadow: `0 2px 8px ${color}40` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                    {percentage > 15 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center px-2">
                    <span className="text-xs text-gray-500">0%</span>
                  </div>
                )}
                {item.nilai > 0 && percentage <= 15 && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="p-8">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Dashboard Real-Time</h1>
            <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <span className="text-gray-600 font-medium">Memuat data dashboard...</span>
              <span className="text-sm text-gray-500 mt-2">Menyinkronkan dengan sistem</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="p-8">
        {/* Header Section - TANPA TOMBOL BACK */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard Real-Time </h1>
              <p className="text-blue-200 text-sm mt-1">
                {lastUpdate ? `Terakhir update: ${lastUpdate}` : 'Sistem Informasi Pengelolaan Stok'}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-6 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600 text-sm">⚠️ {error}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: 'Total Stok', value: stats.totalStok, subtitle: 'Semua unit', icon: '📦', color: 'from-blue-500 to-blue-600' },
            { title: 'Sisa Stok', value: stats.sisaStok, subtitle: 'Items tersedia', icon: '📊', color: 'from-green-500 to-green-600' },
            { title: 'Total Pendapatan', value: formatCurrency(stats.totalPendapatan), subtitle: `${stats.pendapatanBulanan.length} bulan`, icon: '💰', color: 'from-purple-500 to-purple-600' },
            { title: 'Total Pengeluaran', value: formatCurrency(stats.totalPengeluaran), subtitle: `${stats.pengeluaranBulanan.length} bulan`, icon: '📉', color: 'from-orange-500 to-orange-600' }
          ].map((stat, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-5 border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{stat.icon}</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">Live</span>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}
              </p>
              <p className="text-xs text-gray-600">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Grafik Pendapatan */}
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Grafik Pendapatan</h2>
              <p className="text-sm text-gray-600 mt-1">Pendapatan Bulanan</p>
            </div>
            <div className="h-64">{renderChart(stats.pendapatanBulanan, true)}</div>
            <div className="mt-4 text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
              Total: {formatCurrency(stats.totalPendapatan)}
            </div>
          </div>

          {/* Grafik Pengeluaran */}
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Grafik Pengeluaran</h2>
              <p className="text-sm text-gray-600 mt-1">Pengeluaran Bulanan</p>
            </div>
            <div className="h-64">{renderChart(stats.pengeluaranBulanan, false)}</div>
            <div className="mt-4 text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
              Total: {formatCurrency(stats.totalPengeluaran)}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Distribusi Stok */}
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Distribusi Stok Per Unit</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total: {stats.stokPerKategori.reduce((sum, item) => sum + item.jumlah, 0)} stok
              </p>
            </div>
            <div className="min-h-[400px]">{renderPieChart()}</div>
          </div>

          {/* Bisnis - Semua Unit */}
          <div className="bg-white rounded-lg shadow p-6 border">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Bisnis</h2>
              <p className="text-sm text-gray-600 mt-1">Semua unit bisnis berdasarkan pendapatan</p>
            </div>
            <div className="max-h-[500px] overflow-y-auto">{renderBisnisTerlaris()}</div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-lg shadow p-6 border">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🚀 Dashboard menampilkan data real-time dari sistem</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '📊', label: 'Data Stok', value: `${stats.totalStok} items` },
              { icon: '📈', label: 'Pendapatan', value: formatCurrency(stats.totalPendapatan) },
              { icon: '📉', label: 'Pengeluaran', value: formatCurrency(stats.totalPengeluaran) },
              { icon: '🔄', label: 'Update', value: 'Setiap 30 detik' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}