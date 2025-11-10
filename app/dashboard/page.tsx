// app/dashboard/page.tsx
import { query } from '@/lib/db';

// === AMBIL DATA DARI NEON VIA API ===
async function getLaporan() {
  try {
    const res = await fetch('http://localhost:3000/api/laporan', {
      cache: 'no-store',
    });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

// === DASHBOARD PAGE ===
export default async function DashboardPage() {
  const laporan = await getLaporan();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* === HEADER KAMU (100% TIDAK DIRUBAH) === */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center px-6 py-4">
          
          {/* Logo Sanguku di Tengah */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h2 className="text-lg font-semibold text-gray-700">Sanguku</h2>
          </div>
          
          {/* Profile di Kanan Atas */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-gray-800">Arel Laffte Dinoris</p>
              <p className="text-sm text-gray-500">Manager</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* === DASHBOARD NYATA DI BAWAH HEADER === */}
      <main className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Laporan Keuangan</h1>

        {laporan.length === 0 ? (
          <p className="text-gray-500">Belum ada data laporan.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Periode</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unit</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Pengeluaran</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Pendapatan</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {laporan.map((item: any) => (
                  <tr key={item.id_laporan_serial}>
                    <td className="px-4 py-2 text-sm">{item.id_laporan_serial}</td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(item.periode_laporan_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-sm">{item.unit_bisnis}</td>
                    <td className="px-4 py-2 text-sm text-red-600">
                      Rp {Number(item.total_pengeluaran).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-sm text-green-600">
                      Rp {Number(item.total_pendapatan).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'approved' ? 'bg-green-100 text-green-800' :
                        item.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status || 'draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}