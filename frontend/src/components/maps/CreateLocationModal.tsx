'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Save, X, Info, CheckCircle2, AlertCircle, Search, Loader2, MapPinned } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import dynamic from 'next/dynamic';

// ========================================
// 🗺️ LAZY LOADING DEL MAPA
// ========================================
const MapSelector = dynamic(() => import('./MapSelector'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">Cargando mapa interactivo...</p>
      </div>
    </div>
  ),
});

// ========================================
// 📦 INTERFACES
// ========================================
interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LocationFormData) => Promise<void>;
  editingLocation?: LocationFormData | null;
  mode: 'crear' | 'editar';
}

export interface LocationFormData {
  nombre: string;
  descripcion: string;
  latitud: string;
  longitud: string;
  radioMetros: string;
  activo: boolean;
}

// ========================================
// 🎨 COMPONENTE PRINCIPAL
// ========================================
export default function CreateLocationModal({
  isOpen,
  onClose,
  onSave,
  editingLocation,
  mode = 'crear'
}: CreateLocationModalProps) {
  // Estados del formulario
  const [formData, setFormData] = useState<LocationFormData>({
    nombre: '',
    descripcion: '',
    latitud: '',
    longitud: '',
    radioMetros: '50',
    activo: true
  });

  // Estados de UI
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // Step 1: Datos básicos, Step 2: Mapa
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // 🆕 Estados para Geocoding (búsqueda de lugares)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // ========================================
  // 🔄 INICIALIZAR DATOS AL ABRIR
  // ========================================
  useEffect(() => {
    if (isOpen) {
      if (editingLocation) {
        setFormData(editingLocation);
        setCurrentStep(2); // Si edita, va directo al mapa
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          latitud: '',
          longitud: '',
          radioMetros: '50',
          activo: true
        });
        setCurrentStep(1);
      }
      setValidationErrors({});
      setLocationError(null);
    }
  }, [isOpen, editingLocation]);

  // ========================================
  // 📍 OBTENER UBICACIÓN ACTUAL CON VALIDACIÓN DE PRECISIÓN
  // ========================================
  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Tu navegador no soporta geolocalización');
      }

      console.log('🔄 Intentando obtener ubicación GPS de alta precisión...');

      // 1️⃣ Primer intento: Alta precisión con timeout largo
      let position: GeolocationPosition;
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,  // Fuerza GPS real
            timeout: 30000,            // 30 segundos
            maximumAge: 0              // No usar caché
          });
        });
      } catch (firstError) {
        console.warn('⚠️ Primer intento falló, reintentando...');
        
        // 2️⃣ Segundo intento: Con configuración más permisiva
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 5000  // Permitir caché de 5 segundos
          });
        });
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      // 🔍 Debug completo
      console.log('📍 Ubicación obtenida:');
      console.log(`   Latitud: ${lat}`);
      console.log(`   Longitud: ${lng}`);
      console.log(`   Precisión: ${accuracy.toFixed(2)} metros`);
      console.log(`   Altitud: ${position.coords.altitude || 'N/A'}`);
      console.log(`   Velocidad: ${position.coords.speed || 'N/A'}`);
      console.log(`   Timestamp: ${new Date(position.timestamp).toLocaleString()}`);
      console.log(`   Google Maps: https://www.google.com/maps?q=${lat},${lng}`);

      // 3️⃣ VALIDAR PRECISIÓN - CRÍTICO
      if (accuracy > 100) {
        // ❌ PRECISIÓN INACEPTABLE
        setLocationError(
          `❌ PRECISIÓN MUY BAJA (${accuracy.toFixed(0)}m)\n\n` +
          `⚠️ Tu dispositivo está usando WiFi/IP en lugar de GPS real.\n\n` +
          `📱 SOLUCIONES:\n` +
          `1. Sal al aire libre (lejos de edificios)\n` +
          `2. Activa el GPS en tu dispositivo\n` +
          `3. Espera 30 segundos para que el GPS se calibre\n` +
          `4. Usa un dispositivo móvil con GPS real\n\n` +
          `ℹ️ Para asistencias necesitas precisión < 100m`
        );
        setIsLoadingLocation(false);
        return;
      }

      // 4️⃣ Actualizar formulario
      setFormData(prev => ({
        ...prev,
        latitud: lat.toFixed(6),
        longitud: lng.toFixed(6)
      }));

      setShowPreview(true);

      // 5️⃣ Mensajes según precisión
      if (accuracy <= 20) {
        setLocationError(`✅ Ubicación GPS excelente (${accuracy.toFixed(1)}m)`);
      } else if (accuracy <= 50) {
        setLocationError(`✅ Ubicación GPS buena (${accuracy.toFixed(1)}m)`);
      } else if (accuracy <= 100) {
        setLocationError(
          `⚠️ Ubicación GPS aceptable (${accuracy.toFixed(1)}m)\n` +
          `Recomendación: Sal al aire libre para mejor precisión`
        );
      }

    } catch (error: any) {
      let message = 'Error al obtener ubicación';
      
      if (error.code === 1) {
        message = 
          '⚠️ PERMISO DENEGADO\n\n' +
          '📱 Pasos para permitir ubicación:\n' +
          '1. Click en el icono 🔒 en la barra de dirección\n' +
          '2. Permitir "Ubicación"\n' +
          '3. Recarga la página\n' +
          '4. Intenta nuevamente';
      } else if (error.code === 2) {
        message = 
          '⚠️ UBICACIÓN NO DISPONIBLE\n\n' +
          'Posibles causas:\n' +
          '• GPS desactivado en el dispositivo\n' +
          '• Sin señal GPS (estás en un lugar cerrado)\n' +
          '• Dispositivo sin GPS\n\n' +
          'Solución: Usa un móvil con GPS al aire libre';
      } else if (error.code === 3) {
        message = 
          '⚠️ TIEMPO AGOTADO (30 segundos)\n\n' +
          'El GPS no pudo obtener señal.\n' +
          'Sal al aire libre e intenta nuevamente.';
      }

      console.error('❌ Error de geolocalización:', error);
      setLocationError(message);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // ========================================
  // 🔍 BÚSQUEDA CON GEOCODING (Nominatim OpenStreetMap)
  // Sistema profesional para buscar lugares desde PC
  // ========================================
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setLocationError('⚠️ Escribe un lugar para buscar (ej: Tambogrande, Instituto San Martín)');
      return;
    }

    setIsSearching(true);
    setLocationError(null);
    setSearchResults([]);

    try {
      // 🌍 Nominatim API (OpenStreetMap) - GRATIS e ILIMITADO
      const query = encodeURIComponent(searchQuery.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=10&countrycodes=pe`;

      console.log('🔍 Buscando:', searchQuery);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ASISTEM_SAN_MARTIN/1.0' // Requerido por Nominatim
        }
      });

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const results = await response.json();

      console.log('📍 Resultados encontrados:', results.length);

      if (results.length === 0) {
        setLocationError(
          `ℹ️ No se encontraron resultados para "${searchQuery}"\n\n` +
          `💡 Intenta con:\n` +
          `• Nombre de ciudad: "Tambogrande"\n` +
          `• Lugar específico: "Instituto San Martín Tambogrande"\n` +
          `• Dirección: "Av. Principal, Tambogrande"`
        );
        setShowSearchResults(false);
      } else {
        setSearchResults(results);
        setShowSearchResults(true);
        setLocationError(null);
      }

    } catch (error: any) {
      console.error('❌ Error en búsqueda:', error);
      setLocationError(
        '❌ Error al buscar ubicación\n\n' +
        'Verifica tu conexión a internet e intenta nuevamente.'
      );
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // ========================================
  // 📍 SELECCIONAR RESULTADO DE BÚSQUEDA
  // ========================================
  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    console.log('✅ Ubicación seleccionada:');
    console.log(`   Nombre: ${result.display_name}`);
    console.log(`   Latitud: ${lat}`);
    console.log(`   Longitud: ${lng}`);

    // Actualizar formulario
    setFormData(prev => ({
      ...prev,
      latitud: lat.toFixed(6),
      longitud: lng.toFixed(6)
    }));

    // Cerrar resultados
    setShowSearchResults(false);
    setShowPreview(true);
    setLocationError(`✅ Ubicación encontrada: ${result.display_name}`);

    // Limpiar búsqueda
    setSearchQuery('');
    setSearchResults([]);
  };

  // ========================================
  // ✅ VALIDACIÓN DEL FORMULARIO
  // ========================================
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.latitud || !formData.longitud) {
      errors.coordinates = 'Debes seleccionar una ubicación en el mapa';
    } else {
      const lat = parseFloat(formData.latitud);
      const lng = parseFloat(formData.longitud);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitud = 'Latitud inválida';
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitud = 'Longitud inválida';
      }
    }

    const radio = parseInt(formData.radioMetros);
    if (isNaN(radio) || radio < 10 || radio > 500) {
      errors.radioMetros = 'El radio debe estar entre 10 y 500 metros';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ========================================
  // 💾 GUARDAR UBICACIÓN
  // ========================================
  const handleSave = async () => {
    if (!validateForm()) {
      setLocationError('Por favor corrige los errores antes de guardar');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error: any) {
      setLocationError(error.message || 'Error al guardar la ubicación');
    } finally {
      setIsSaving(false);
    }
  };

  // ========================================
  // 🗺️ MANEJAR CLICK EN EL MAPA
  // ========================================
  const handleMapClick = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitud: lat.toFixed(6),
      longitud: lng.toFixed(6)
    }));
    setShowPreview(true);
    setValidationErrors(prev => {
      const { coordinates, latitud, longitud, ...rest } = prev;
      return rest;
    });
  };

  // ========================================
  // 🔒 MANEJAR CIERRE
  // ========================================
  const handleClose = (open: boolean) => {
    if (!open) onClose();
  };

  // ========================================
  // 🎯 DETERMINAR SI PUEDE CONTINUAR
  // ========================================
  const canProceedToMap = formData.nombre.trim().length > 0;
  const hasValidCoordinates = formData.latitud && formData.longitud;

  // ========================================
  // 🎨 RENDER
  // ========================================
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
        
        {/* ========================================
            🎯 HEADER CON STEPS
        ======================================== */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-white/20 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              {mode === 'crear' ? 'Crear Nueva Ubicación GPS' : 'Editar Ubicación GPS'}
            </DialogTitle>
            
            <button
              onClick={() => handleClose(false)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentStep === 1 ? 'bg-white/20' : 'bg-white/10'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 1 ? 'bg-white text-blue-600' : 'bg-white/20'
              }`}>
                1
              </div>
              <span className="font-medium">Datos Básicos</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-white/20"></div>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentStep === 2 ? 'bg-white/20' : 'bg-white/10'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 2 ? 'bg-white text-blue-600' : 'bg-white/20'
              }`}>
                2
              </div>
              <span className="font-medium">Ubicación en Mapa</span>
            </div>
          </div>
        </div>

        {/* ========================================
            📝 STEP 1: DATOS BÁSICOS
        ======================================== */}
        {currentStep === 1 && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Info Card */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Completa la información básica de la ubicación. En el siguiente paso podrás seleccionarla en el mapa.
                </AlertDescription>
              </Alert>

              {/* ⚠️ ALERTA GPS - IMPORTANTE */}
              <Alert className="border-orange-300 bg-orange-50">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  <strong className="block mb-2">📱 Para obtener ubicación GPS precisa:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Usa un dispositivo móvil</strong> con GPS (no PC)</li>
                    <li><strong>Sal al aire libre</strong> (lejos de edificios altos)</li>
                    <li><strong>Activa el GPS</strong> en configuración del dispositivo</li>
                    <li><strong>Espera 30 segundos</strong> para calibración</li>
                  </ul>
                  <p className="mt-2 text-xs font-medium">
                    ⚠️ Precisión requerida: <strong>&lt; 100 metros</strong>
                  </p>
                </AlertDescription>
              </Alert>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium flex items-center gap-2">
                  Nombre de la Ubicación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Campus Principal, Sede Norte, Biblioteca Central"
                  className={validationErrors.nombre ? 'border-red-500' : ''}
                />
                {validationErrors.nombre && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.nombre}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-medium">
                  Descripción (Opcional)
                </Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Ej: Entrada principal del campus, Edificio de administración"
                />
              </div>

              {/* Radio de Cobertura */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center justify-between">
                  <span>Radio de Cobertura</span>
                  <span className="text-2xl font-bold text-blue-600">{formData.radioMetros}m</span>
                </Label>
                <Slider
                  value={[parseInt(formData.radioMetros)]}
                  onValueChange={(value: number[]) => setFormData({...formData, radioMetros: value[0].toString()})}
                  min={10}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>10m (Mínimo)</span>
                  <span>500m (Máximo)</span>
                </div>
                {validationErrors.radioMetros && (
                  <p className="text-sm text-red-600">{validationErrors.radioMetros}</p>
                )}
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="activo" className="font-medium cursor-pointer">
                    Estado de la Ubicación
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.activo 
                      ? 'Los usuarios pueden registrar asistencia desde esta ubicación'
                      : 'Esta ubicación estará deshabilitada temporalmente'
                    }
                  </p>
                </div>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({...formData, activo: checked})}
                />
              </div>

              {/* Botón Continuar */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceedToMap}
                  size="lg"
                  className="gap-2"
                >
                  Continuar al Mapa
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================
            🗺️ STEP 2: SELECCIÓN EN MAPA
        ======================================== */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* ✨ PANEL SUPERIOR FIJO (NO HACE SCROLL) */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 px-6 py-4 flex-shrink-0">
              
              {/* Título y descripción */}
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Selecciona la ubicación en el mapa</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>3 formas de seleccionar:</strong> Buscar lugar, usar GPS del móvil, o hacer click en el mapa.
                    El círculo muestra el radio de cobertura de <strong>{formData.radioMetros}m</strong>.
                  </p>
                </div>
              </div>

              {/* 🔍 BARRA DE BÚSQUEDA + BOTÓN GPS (SIEMPRE VISIBLE) */}
              <div className="flex gap-3 mb-3">
                {/* Búsqueda (PC) */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="🔍 Buscar: Tambogrande, Instituto San Martín, etc..."
                      className="pl-10 pr-24 bg-white"
                      disabled={isSearching}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Buscando...
                        </>
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>
                </div>

                {/* GPS (Móvil) */}
                <Button
                  onClick={handleGetCurrentLocation}
                  disabled={isLoadingLocation}
                  variant="outline"
                  className="gap-2 whitespace-nowrap"
                >
                  <Navigation className={`h-4 w-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
                  {isLoadingLocation ? 'GPS...' : 'Mi Ubicación'}
                </Button>
              </div>

              {/* Coordenadas Actuales */}
              {hasValidCoordinates && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">
                      <strong>Lat:</strong> {formData.latitud} | <strong>Lng:</strong> {formData.longitud}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 🆕 RESULTADOS DE BÚSQUEDA (STICKY DEBAJO DEL BUSCADOR) */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="bg-white border-b border-gray-200 shadow-md flex-shrink-0">
                <div className="max-h-60 overflow-y-auto">
                  <div className="p-3 space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">
                      📍 {searchResults.length} resultados encontrados
                    </div>
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full text-left px-3 py-2.5 rounded-md hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <MapPinned className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                              {result.name || result.display_name?.split(',')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {result.display_name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              📍 {parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🗺️ CONTENEDOR DEL MAPA (CON SCROLL INDEPENDIENTE) */}
            <div className="flex-1 relative overflow-hidden">

              {/* Error de ubicación */}
              {locationError && (
                <div className="absolute top-4 left-4 right-4 z-10">
                  <Alert 
                    variant={locationError.includes('❌') ? 'destructive' : locationError.includes('✅') ? 'default' : 'destructive'}
                    className={`${
                      locationError.includes('❌') 
                        ? 'bg-red-50 border-red-300' 
                        : locationError.includes('✅') 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-yellow-50 border-yellow-300'
                    }`}
                  >
                    <AlertCircle className={`h-5 w-5 ${
                      locationError.includes('❌') 
                        ? 'text-red-600' 
                        : locationError.includes('✅') 
                        ? 'text-green-600' 
                        : 'text-yellow-600'
                    }`} />
                    <AlertDescription className="whitespace-pre-line text-sm leading-relaxed">
                      {locationError}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {validationErrors.coordinates && (
                <div className="absolute top-4 left-4 right-4 z-10">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationErrors.coordinates}</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Mapa Interactivo - OCUPA TODO EL ESPACIO */}
              {hasValidCoordinates ? (
                <MapSelector
                  lat={parseFloat(formData.latitud)}
                  lng={parseFloat(formData.longitud)}
                  radius={parseInt(formData.radioMetros)}
                  zoom={16}
                  onMapClick={(lat: number, lng: number) => {
                    setFormData(prev => ({
                      ...prev,
                      latitud: lat.toFixed(6),
                      longitud: lng.toFixed(6)
                    }));
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                  <div className="text-center max-w-md px-6">
                    <div className="mb-6 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full animate-pulse"></div>
                      </div>
                      <MapPin className="h-16 w-16 text-blue-600 mx-auto relative z-10" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Busca o usa tu GPS
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Usa la <strong>barra de búsqueda</strong> arriba para encontrar un lugar,
                      o haz clic en <strong>"Mi Ubicación"</strong> para usar tu GPS
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleGetCurrentLocation}
                        disabled={isLoadingLocation}
                        size="lg"
                        className="gap-2"
                      >
                        <Navigation className={`h-5 w-5 ${isLoadingLocation ? 'animate-spin' : ''}`} />
                        {isLoadingLocation ? 'GPS...' : 'Mi Ubicación'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con Acciones */}
            <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={isSaving}
              >
                Volver
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasValidCoordinates}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {mode === 'crear' ? 'Crear Ubicación' : 'Guardar Cambios'}
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
