// app/laporan/pengeluaran/page.tsx
'use client';

export default function LaporanPengeluaranPage() {
  const pengeluaranData = [
    { kategori: 'Operasional', bulan: 'Januari 2024', total: 5000000 },
    { kategori: 'Gaji Karyawan', bulan: 'Januari 2024', total: 8000000 },
    { kategori: 'Peralatan', bulan: 'Januari 2024', total: 3000000 },
    { kategori: 'Lain-lain', bulan: 'Januari 2024', total: 1000000 },
  ];

  const totalPengeluaran = pengeluaranData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Pengeluaran</h1>
        <p className="text-gray-600">Laporan pengeluaran dan biaya operasional</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Ringkasan Pengeluaran</h2>
          <div className="text-2xl font-bold text-red-600">
            Rp {totalPengeluaran.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Pengeluaran
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pengeluaranData.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.kategori}
                  </td>
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