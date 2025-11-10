export default function StatusIndicator({ isOnline, itemCount, offlineCount }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${
      isOnline ? 'bg-green-50 border-green-500 text-green-700' : 'bg-orange-50 border-orange-500 text-orange-700'
    }`}>
      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
      <div className="text-sm">
        <div className="font-medium">
          {isOnline ? 'Online' : 'Offline'} - {itemCount} items
        </div>
        {offlineCount > 0 && (
          <div className="text-xs text-red-600">
            {offlineCount} pending sync
          </div>
        )}
      </div>
    </div>
  );
}