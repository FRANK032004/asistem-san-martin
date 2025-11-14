'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * PWA Provider - Registra Service Worker y maneja instalación
 * Características:
 * - Registro automático del service worker
 * - Detección de instalación PWA
 * - Banner de instalación (iOS y Android)
 * - Detección de actualizaciones
 * - Notificaciones de estado online/offline
 */
export function PWAProvider() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // ========== DETECTAR iOS ==========
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = ('standalone' in window.navigator && (window.navigator as any).standalone) ||
                               window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS) {
      console.log('📱 Dispositivo iOS detectado');
      console.log('🔍 Modo standalone:', isInStandaloneMode);
      
      if (isInStandaloneMode) {
        console.log('✅ PWA ejecutándose como app instalada en iOS');
      }
    }

    // ========== REGISTRAR SERVICE WORKER ==========
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registrado:', registration.scope);
            
            // Verificar actualizaciones cada hora
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);

            // Escuchar actualizaciones
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Nueva versión disponible
                    toast.info('Nueva versión disponible', {
                      description: 'Recarga la página para actualizar',
                      action: {
                        label: 'Recargar',
                        onClick: () => window.location.reload(),
                      },
                      duration: 10000,
                    });
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('❌ Error al registrar Service Worker:', error);
          });

        // Verificar si ya hay un SW activo
        navigator.serviceWorker.ready.then(() => {
          console.log('🚀 Service Worker listo');
        });
      });
    } else {
      console.warn('⚠️ Service Workers no soportados en este navegador');
    }

    // ========== DETECCIÓN DE INSTALACIÓN PWA ==========
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir el banner de instalación automático
      e.preventDefault();
      console.log('📱 PWA instalable detectado');
      
      // Guardar el evento para mostrarlo después
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // ✅ Verificar si el usuario ya descartó el banner o si ya se mostró hoy
      const lastShown = localStorage.getItem('pwa-install-banner-shown');
      const dismissed = localStorage.getItem('pwa-install-banner-dismissed');
      const now = new Date().getTime();
      
      // Si el usuario lo descartó permanentemente, no mostrar
      if (dismissed === 'true') {
        console.log('🚫 Banner de instalación descartado permanentemente');
        return;
      }
      
      // Si se mostró en las últimas 24 horas, no mostrar de nuevo
      if (lastShown) {
        const timeSinceLastShown = now - parseInt(lastShown);
        const oneDay = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        
        if (timeSinceLastShown < oneDay) {
          console.log('⏳ Banner de instalación ya mostrado recientemente');
          return;
        }
      }
      
      // Mostrar notificación de instalación solo después de 30 segundos de uso
      setTimeout(() => {
        // Guardar timestamp de cuando se mostró
        localStorage.setItem('pwa-install-banner-shown', now.toString());
        
        toast.info('Instalar ASISTEM', {
          description: '¡Instala la app en tu dispositivo para acceso rápido!',
          action: {
            label: 'Instalar',
            onClick: handleInstallClick,
          },
          cancel: {
            label: 'No mostrar más',
            onClick: () => {
              localStorage.setItem('pwa-install-banner-dismissed', 'true');
              toast.success('Entendido', {
                description: 'No volveremos a mostrar este mensaje',
              });
            },
          },
          duration: 15000, // 15 segundos
        });
      }, 30000); // ✅ Esperar 30 segundos antes de mostrar
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // ========== DETECCIÓN DE INSTALACIÓN EXITOSA ==========
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA instalada exitosamente');
      toast.success('¡App instalada!', {
        description: 'ASISTEM ahora está en tu dispositivo',
      });
      setIsInstallable(false);
      setDeferredPrompt(null);
      // ✅ Limpiar flags de localStorage
      localStorage.removeItem('pwa-install-banner-shown');
      localStorage.removeItem('pwa-install-banner-dismissed');
    });

    // ========== ESTADO DE CONEXIÓN ==========
    let wasOffline = false; // ✅ Variable para rastrear si estuvo offline
    
    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      // ✅ Solo mostrar si realmente estuvo offline antes
      if (wasOffline) {
        toast.success('Conexión restaurada', {
          description: 'Volviste a estar en línea',
          duration: 3000,
        });
        wasOffline = false;
      }
    };

    const handleOffline = () => {
      console.log('📡 Sin conexión');
      wasOffline = true; // ✅ Marcar que está offline
      toast.warning('Sin conexión', {
        description: 'Trabajando en modo offline',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ========== DETECCIÓN DE STANDALONE MODE ==========
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isStandalone) {
      console.log('📱 Ejecutando como PWA instalada');
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ========== FUNCIÓN PARA INSTALAR PWA ==========
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ No hay prompt de instalación disponible');
      return;
    }

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);

    if (outcome === 'accepted') {
      toast.success('Instalando...', {
        description: 'La app se está instalando en tu dispositivo',
      });
    }

    // Limpiar el prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Este componente no renderiza nada visible
  return null;
}
