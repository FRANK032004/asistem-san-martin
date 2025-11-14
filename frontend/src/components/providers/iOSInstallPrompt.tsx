'use client';

import { useEffect, useState } from 'react';
import { X, Share, Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente para mostrar instrucciones de instalación en iOS
 * Ya que iOS no soporta el evento beforeinstallprompt
 */
export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Detectar si es iOS
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Detectar si ya está instalada (modo standalone)
    const checkIsStandalone = () => {
      return ('standalone' in window.navigator && (window.navigator as any).standalone) ||
             window.matchMedia('(display-mode: standalone)').matches;
    };

    const isiOS = checkIsIOS();
    const isStandalone = checkIsStandalone();
    
    setIsIOS(isiOS);
    setIsInStandaloneMode(isStandalone);

    // Solo mostrar el prompt si:
    // 1. Es iOS
    // 2. No está en modo standalone
    // 3. No se ha cerrado antes (en esta sesión)
    // 4. Ha pasado 1 minuto de uso
    if (isiOS && !isStandalone) {
      const hasSeenPrompt = sessionStorage.getItem('ios-install-prompt-seen');
      const hasDismissed = localStorage.getItem('ios-install-prompt-dismissed');
      
      // Si el usuario lo cerró permanentemente, no mostrar
      if (hasDismissed === 'true') {
        return;
      }

      // Si ya lo vio en esta sesión, no mostrar
      if (hasSeenPrompt === 'true') {
        return;
      }

      // Mostrar después de 1 minuto
      const timer = setTimeout(() => {
        setShowPrompt(true);
        sessionStorage.setItem('ios-install-prompt-seen', 'true');
      }, 60000); // 60 segundos

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowPrompt(false);
  };

  const handleDismissPermanently = () => {
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  // No mostrar nada si no es iOS, ya está instalada, o no debe mostrarse
  if (!isIOS || isInStandaloneMode || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Instalar ASISTEM
              </h3>
              <p className="text-sm text-gray-500">
                Acceso rápido desde tu iPhone
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descripción */}
        <p className="text-gray-600 text-sm">
          Instala ASISTEM en tu iPhone para tener acceso rápido, funcionar sin conexión y recibir notificaciones importantes.
        </p>

        {/* Instrucciones paso a paso */}
        <div className="bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-blue-900 text-sm">
            📱 Cómo instalar:
          </p>
          
          <div className="space-y-2">
            {/* Paso 1 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Toca el botón <strong>Compartir</strong> 
                  <Share className="w-4 h-4 inline-block mx-1 text-blue-600" />
                  en la barra inferior de Safari
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Desplázate hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong>
                  <Plus className="w-4 h-4 inline-block mx-1 text-blue-600" />
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Toca <strong>"Añadir"</strong> en la esquina superior derecha
                </p>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                ✓
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700">
                  ¡Listo! ASISTEM aparecerá en tu pantalla de inicio
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            ✨ Beneficios:
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Icono en tu pantalla de inicio</li>
            <li>• Funciona sin conexión a internet</li>
            <li>• Pantalla completa sin barras del navegador</li>
            <li>• Notificaciones de horarios y avisos</li>
            <li>• Carga más rápida que la web</li>
          </ul>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Entendido, lo haré ahora
          </Button>
          <Button
            onClick={handleDismissPermanently}
            variant="ghost"
            className="w-full text-gray-500 hover:text-gray-700 text-sm"
          >
            No mostrar de nuevo
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center pt-2">
          Solo disponible en Safari de iOS
        </p>
      </div>
    </div>
  );
}
