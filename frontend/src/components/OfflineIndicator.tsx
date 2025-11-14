/**
 * Componente para mostrar el estado de conexión (offline/online)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'offline' | 'online'>('offline');

  useEffect(() => {
    if (!isOnline) {
      // Mostrar toast de offline
      setToastType('offline');
      setShowToast(true);
    } else if (wasOffline) {
      // Mostrar toast de online (conexión restablecida)
      setToastType('online');
      setShowToast(true);
      
      // Ocultar después de 3 segundos
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {/* Banner persistente cuando está offline */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-2 px-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">
              Sin conexión - Trabajando en modo offline
            </span>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          {toastType === 'offline' ? (
            <div className="bg-yellow-500 text-white rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px]">
              <div className="shrink-0">
                <WifiOff className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Sin conexión</p>
                <p className="text-sm opacity-90">
                  Trabajando en modo offline
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-500 text-white rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px]">
              <div className="shrink-0">
                <Wifi className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Conexión restablecida</p>
                <p className="text-sm opacity-90">
                  Sincronizando datos...
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="shrink-0 text-white/80 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;
