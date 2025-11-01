import Link from 'next/link';
import { TrendingUp, TrendingDown, Package, Download } from 'lucide-react';

interface LaporanCardProps {
  type: 'pendapatan' | 'pengeluaran' | 'stok';
  title: string;
  description: string;
  value?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  href: string;
}

export default function LaporanCard({ 
  type, 
  title, 
  description, 
  value, 
  trend, 
  href 
}: LaporanCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'pendapatan':
        return <TrendingUp className="w-8 h-8 text-green-600" />;
      case 'pengeluaran':
        return <TrendingDown className="w-8 h-8 text-red-600" />;
      case 'stok':
        return <Package className="w-8 h-8 text-blue-600" />;
      default:
        return <TrendingUp className="w-8 h-8 text-gray-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'pendapatan':
        return 'bg-green-50 border-green-200';
      case 'pengeluaran':
        return 'bg-red-50 border-red-200';
      case 'stok':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Link
      href={href}
      className={`block p-6 rounded-lg border-2 ${getBgColor()} hover:shadow-md transition-all duration-200 hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-4">
        {getIcon()}
        <Download className="w-6 h-6 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      
      {value && (
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {trend && (
            <span className={`flex items-center text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 ml-1" />
              ) : (
                <TrendingDown className="w-4 h-4 ml-1" />
              )}
            </span>
          )}
        </div>
      )}
      
      <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
        <Download className="w-4 h-4 mr-1" />
        Download Laporan
      </div>
    </Link>
  );
}