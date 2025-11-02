// app/laporan/pendapatan/page.tsx
'use client';

export default function LaporanPendapatanPage() {
  const pendapatanData = [
    { bulan: 'Januari 2024', total: 15000000 },
    { bulan: 'Februari 2024', total: 18000000 },
    { bulan: 'Maret 2024', total: 16500000 },
    { bulan: 'April 2024', total: 19500000 },
  ];

  const totalPendapatan = pendapatanData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Pendapatan</h1>
        <p className="text-gray-600">Laporan pemasukan dan pendapatan bulanan</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Ringkasan Pendapatan</h2>
          <div className="text-2xl font-bold text-green-600">
            Rp {totalPendapatan.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Pendapatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendapatanData.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.bulan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {item.total.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}