'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, LogOut, MousePointer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsLeft: number;
  onContinue: () => void;
  onLogout: () => void;
}

export default function InactivityWarningModal({
  isOpen,
  secondsLeft,
  onContinue,
  onLogout,
}: InactivityWarningModalProps) {
  const [countdown, setCountdown] = useState(secondsLeft);
  const maxSeconds = 60;
  const progress = (countdown / maxSeconds) * 100;

  // Actualizar countdown cuando cambia secondsLeft
  useEffect(() => {
    setCountdown(secondsLeft);
  }, [secondsLeft]);

  // Color según tiempo restante
  const getProgressColor = () => {
    if (countdown > 40) return 'bg-blue-600';
    if (countdown > 20) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getStatusColor = () => {
    if (countdown > 40) return 'text-blue-600';
    if (countdown > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        {/* Header con icono de alerta */}
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                ¿Sigues Ahí?
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Detectamos inactividad en tu sesión
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido */}
        <div className="space-y-6 py-4">
          
          {/* Countdown grande */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Clock className={`h-8 w-8 ${getStatusColor()}`} />
              <div className={`text-5xl font-bold ${getStatusColor()}`}>
                {countdown}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              segundos para cerrar sesión automáticamente
            </p>
          </div>

          {/* Barra de progreso simple (sin componente externo) */}
          <div className="space-y-2">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${getProgressColor()}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500">
              Tu sesión se cerrará por seguridad
            </p>
          </div>

          {/* Mensaje informativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MousePointer className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Medida de seguridad activa
                </p>
                <p className="text-xs text-blue-700">
                  Por tu seguridad, cerramos sesiones inactivas automáticamente. 
                  Si deseas continuar trabajando, haz clic en el botón de abajo.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={onContinue}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <MousePointer className="h-5 w-5 mr-2" />
              Sí, Seguir Trabajando
            </Button>
            
            <Button
              onClick={onLogout}
              size="lg"
              variant="outline"
              className="w-full border-2 border-gray-300 hover:bg-gray-100 font-semibold"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Cerrar Sesión Ahora
            </Button>
          </div>

          {/* Info adicional */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              💡 <strong>Consejo:</strong> Mueve el mouse o presiona cualquier tecla 
              para mantenerte activo y evitar este mensaje
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
