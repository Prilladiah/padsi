import { TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: number;
  icon: 'revenue' | 'expense' | 'stock' | 'sales';
  trend: 'up' | 'down';
}

interface LaporanStatsProps {
  stats: StatCard[];
}

export default function LaporanStats({ stats }: LaporanStatsProps) {
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'revenue':
        return <TrendingUp className="w-6 h-6 text-green-600" />;
      case 'expense':
        return <TrendingDown className="w-6 h-6 text-red-600" />;
      case 'stock':
        return <Package className="w-6 h-6 text-blue-600" />;
      case 'sales':
        return <DollarSign className="w-6 h-6 text-purple-600" />;
      default:
        return <DollarSign className="w-6 h-6 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down') => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4" /> : 
      <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            {getIcon(stat.icon)}
            <span className={`flex items-center text-sm font-medium ${getTrendColor(stat.trend)}`}>
              {stat.change > 0 ? '+' : ''}{stat.change}%
              {getTrendIcon(stat.trend)}
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
          <p className="text-sm text-gray-600">{stat.title}</p>
        </div>
      ))}
    </div>
  );
}