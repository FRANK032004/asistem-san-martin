'use client';

import React, { useState } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import dynamic from 'next/dynamic';
import type { Ubicacion } from './MapViewer';

// ========================================
// 🚀 LAZY LOADING (Performance Optimization)
// ========================================

const MapViewer = dynamic(() => import('./MapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">Cargando mapa...</p>
        <p className="text-gray-500 text-sm mt-1">Preparando visualización</p>
      </div>
    </div>
  ),
});

// ========================================
// 📦 INTERFACES
// ========================================

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  ubicaciones: Ubicacion[];
  title?: string;
  selectedUbicacion?: Ubicacion | null;
}

// ========================================
// 🗺️ COMPONENTE PRINCIPAL - DISEÑO SENIOR
// ========================================

export default function MapModal({
  isOpen,
  onClose,
  ubicaciones,
  title = 'Visualización de Ubicaciones GPS',
  selectedUbicacion,
}: MapModalProps) {
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // ========================================
  // 🔄 LIFECYCLE MANAGEMENT
  // ========================================
  React.useEffect(() => {
    if (isOpen) {
      setIsMapReady(false);
      setLocationError(null);
      const timer = setTimeout(() => setIsMapReady(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowCurrentLocation(false);
      setLocationError(null);
      setIsLoadingLocation(false);
      setIsMapReady(false);
    }
  }, [isOpen]);

  // ========================================
  // 🔒 MANEJAR CIERRE
  // ========================================
  const handleClose = (open: boolean) => {
    if (!open) onClose();
  };

  // ========================================
  // 📍 GEOLOCALIZACIÓN
  // ========================================
  const handleRequestLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocalización no soportada');
      }

      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setShowCurrentLocation(true);
            resolve();
          },
          (error) => {
            const messages: Record<number, string> = {
              [error.PERMISSION_DENIED]: 'Permiso denegado. Habilita la ubicación en tu navegador',
              [error.POSITION_UNAVAILABLE]: 'Ubicación no disponible en este momento',
              [error.TIMEOUT]: 'Tiempo de espera agotado',
            };
            reject(new Error(messages[error.code] || 'Error al obtener ubicación'));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // ========================================
  // 🎯 HELPERS
  // ========================================
  const getMapCenter = (): [number, number] => {
    if (selectedUbicacion) return [selectedUbicacion.latitud, selectedUbicacion.longitud];
    if (ubicaciones.length > 0) return [ubicaciones[0].latitud, ubicaciones[0].longitud];
    return [-12.046600, -77.042650]; // Lima, Perú
  };

  const stats = {
    total: ubicaciones.length,
    activas: ubicaciones.filter(u => u.activo !== false).length,
    inactivas: ubicaciones.filter(u => u.activo === false).length,
  };

  // ========================================
  // 🎨 RENDER - DISEÑO MODERNO Y DINÁMICO
  // ========================================
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
        
        {/* ========================================
            🎯 HEADER STICKY - INFORMACIÓN COMPACTA
        ======================================== */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
          <div className="px-6 py-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <MapPin className="h-5 w-5" />
                  </div>
                  {title}
                </DialogTitle>
                
                {/* Botón de Cerrar - Visible y accesible */}
                <button
                  onClick={() => handleClose(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 ml-4"
                  title="Cerrar mapa"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Stats Badge - Diseño minimalista */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mt-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-bold">{stats.total}</span>
                  <span className="text-blue-100 text-sm">Total</span>
                </div>
                <div className="h-4 w-px bg-white/30"></div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="font-bold">{stats.activas}</span>
                  <span className="text-blue-100 text-sm">Activas</span>
                </div>
                {stats.inactivas > 0 && (
                  <>
                    <div className="h-4 w-px bg-white/30"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-400 rounded-full"></div>
                      <span className="font-bold">{stats.inactivas}</span>
                      <span className="text-blue-100 text-sm">Inactivas</span>
                    </div>
                  </>
                )}
              </div>
            </DialogHeader>

            {/* Controles de Geolocalización */}
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={handleRequestLocation}
                disabled={isLoadingLocation || showCurrentLocation}
                size="sm"
                className="bg-white hover:bg-blue-50 text-blue-700 font-medium"
                variant="secondary"
              >
                <Navigation className={`h-4 w-4 mr-2 ${isLoadingLocation ? 'animate-spin' : ''}`} />
                {isLoadingLocation ? 'Obteniendo...' : showCurrentLocation ? '✓ Ubicación activa' : 'Mi Ubicación'}
              </Button>
              
              {showCurrentLocation && (
                <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="inline-block h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-blue-50">GPS habilitado</span>
                </div>
              )}
            </div>

            {/* Error Alert - Integrado en header */}
            {locationError && (
              <div className="mt-3">
                <Alert variant="destructive" className="border-red-300 bg-red-50/90 backdrop-blur-sm">
                  <AlertDescription className="text-sm text-red-800 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {locationError}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>

        {/* ========================================
            🗺️ MAPA - FULL HEIGHT DINÁMICO
        ======================================== */}
        <div className="flex-1 relative bg-gray-100">
          {isMapReady ? (
            <>
              <MapViewer
                ubicaciones={ubicaciones}
                center={getMapCenter()}
                zoom={selectedUbicacion ? 17 : 15}
                height="100%"
                showCurrentLocation={showCurrentLocation}
                onLocationSelect={(lat, lng) => {
                  console.log('📍 Ubicación detectada:', { lat, lng });
                }}
              />
              
              {/* Overlay Card - Ubicación Seleccionada */}
              {selectedUbicacion && (
                <div className="absolute bottom-6 left-6 right-6 z-[1000]">
                  <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 p-5 max-w-2xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <MapPin className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900">{selectedUbicacion.nombre}</h3>
                        {selectedUbicacion.descripcion && (
                          <p className="text-gray-600 mt-1">{selectedUbicacion.descripcion}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <code className="text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded">
                              {selectedUbicacion.latitud.toFixed(6)}, {selectedUbicacion.longitud.toFixed(6)}
                            </code>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Navigation className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700 font-medium">{selectedUbicacion.radioMetros}m</span>
                          </div>
                          {selectedUbicacion.activo !== false ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                              Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                              <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                              Inactiva
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <p className="text-gray-700 font-semibold text-lg">Inicializando mapa</p>
                <p className="text-gray-500 text-sm mt-2">Cargando {stats.total} ubicaciones...</p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================
            📌 FOOTER STICKY - LEYENDA COMPACTA
        ======================================== */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Ubicaciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                  <span className="text-gray-600 font-medium">Tu posición</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-2 bg-green-500 opacity-30 rounded-full"></div>
                  <span className="text-gray-600">Cobertura activa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-2 bg-red-500 opacity-30 rounded-full"></div>
                  <span className="text-gray-600">Cobertura inactiva</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Tu ubicación no se almacena • Privacidad protegida</span>
              </div>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
