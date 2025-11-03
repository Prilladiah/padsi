// Header dengan Logo di Tengah dan Profile di Kanan
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