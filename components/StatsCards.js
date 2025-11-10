export default function StatsCards({ items }) {
  const totalItems = items.length;
  const totalStock = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const suppliers = [...new Set(items.map(item => item.supplier))].length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-2xl font-bold text-gray-800">{totalItems}</div>
        <div className="text-gray-600 text-sm">Total Items</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-2xl font-bold text-gray-800">{suppliers}</div>
        <div className="text-gray-600 text-sm">Supplier</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-2xl font-bold text-gray-800">{totalStock}</div>
        <div className="text-gray-600 text-sm">Total Stok</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-2xl font-bold text-gray-800">Tersinkronisasi</div>
        <div className="text-gray-600 text-sm">Status Sinkronisasi</div>
      </div>
    </div>
  );
}