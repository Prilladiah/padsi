// app/clear-sw.js - Client component untuk clear service worker
'use client';

export default function ClearServiceWorker() {
  if (typeof window !== 'undefined') {
    // Clear service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    
    // Clear cache
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Clear localStorage untuk offline mode
    localStorage.removeItem('stok_offlinemode_v2');
  }
  
  return null;
}