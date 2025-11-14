/**
 * Hook para detectar el estado online/offline
 * Muestra notificaciones cuando cambia el estado de conexión
 */

'use client';

import { useEffect, useState } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useOnlineStatus = (): OnlineStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    // Establecer estado inicial
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      
      // Si estuvo offline, marcar para mostrar mensaje
      if (wasOffline) {
        console.log('✅ Conexión restablecida');
        
        // Opcional: Mostrar toast o notificación
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({
              type: 'ONLINE_STATUS',
              status: 'online',
            });
          });
        }
      }
      
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      
      console.log('⚠️ Sin conexión - Modo offline activado');
      
      // Opcional: Mostrar toast o notificación
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.active?.postMessage({
            type: 'ONLINE_STATUS',
            status: 'offline',
          });
        });
      }
    };

    // Agregar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

export default useOnlineStatus;
