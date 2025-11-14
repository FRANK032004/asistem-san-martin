'use client';

import { useEffect, useState } from 'react';
import { checkBackendHealth, waitForBackend } from '@/lib/api';

interface ConnectionStatus {
  isConnected: boolean;
  lastCheck: Date | null;
  attemptingReconnect: boolean;
}

export default function ConnectionMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: true,
    lastCheck: null,
    attemptingReconnect: false,
  });

  // Verificar conexión cada 30 segundos
  useEffect(() => {
    const checkConnection = async () => {
      const isHealthy = await checkBackendHealth();
      setStatus(prev => ({
        ...prev,
        isConnected: isHealthy,
        lastCheck: new Date(),
      }));

      // Si no está conectado, intentar reconectar
      if (!isHealthy && !status.attemptingReconnect) {
        setStatus(prev => ({ ...prev, attemptingReconnect: true }));
        console.warn('⚠️ Conexión perdida, intentando reconectar...');

        // Intentar reconectar (5 intentos cada 5 segundos)
        const reconnected = await waitForBackend(5, 5000);
        
        setStatus(prev => ({
          ...prev,
          isConnected: reconnected,
          attemptingReconnect: false,
          lastCheck: new Date(),
        }));

        if (reconnected) {
          console.log('✅ Reconexión exitosa');
        } else {
          console.error('❌ No se pudo reconectar al backend');
        }
      }
    };

    // Verificar inmediatamente al montar
    checkConnection();

    // Verificar cada 30 segundos
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [status.attemptingReconnect]);

  // No mostrar nada si está conectado (sin interferir con UX)
  if (status.isConnected && !status.attemptingReconnect) {
    return null;
  }

  // Mostrar banner de error/reconexión
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 p-3 text-center text-white ${
        status.attemptingReconnect
          ? 'bg-yellow-600 animate-pulse'
          : 'bg-red-600'
      }`}
      role="alert"
    >
      {status.attemptingReconnect ? (
        <>
          <span className="font-semibold">🔄 Reconectando al servidor...</span>
          <p className="text-sm mt-1">Por favor espera mientras restablecemos la conexión</p>
        </>
      ) : (
        <>
          <span className="font-semibold">⚠️ Sin conexión con el servidor</span>
          <p className="text-sm mt-1">
            Verifica que el backend esté corriendo en{' '}
            <code className="bg-red-700 px-2 py-1 rounded">http://localhost:5000</code>
          </p>
        </>
      )}
    </div>
  );
}
