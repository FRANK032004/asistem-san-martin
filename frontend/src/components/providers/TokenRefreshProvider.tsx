'use client';

import { useEffect } from 'react';
import { startTokenRefresh, stopTokenRefresh } from '@/lib/token-refresh';

/**
 * Provider que mantiene los tokens JWT actualizados automáticamente
 * Renueva el access token cada 15 minutos para evitar errores 401
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Iniciar auto-refresh cuando el componente se monta
    startTokenRefresh();

    // Limpiar cuando el componente se desmonta
    return () => {
      stopTokenRefresh();
    };
  }, []);

  return <>{children}</>;
}

export default TokenRefreshProvider;
