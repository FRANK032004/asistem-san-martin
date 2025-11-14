'use client';

import { useEffect } from 'react';
import { startKeepAlive, stopKeepAlive } from '@/lib/keep-alive';

/**
 * Componente que mantiene el frontend y backend activos
 * Coloca este componente en el layout raíz
 */
export function KeepAliveProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Iniciar keep-alive cuando el componente se monta
    startKeepAlive();

    // Limpiar cuando el componente se desmonta
    return () => {
      stopKeepAlive();
    };
  }, []);

  return <>{children}</>;
}

export default KeepAliveProvider;
