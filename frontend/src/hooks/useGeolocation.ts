import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para geolocalización de alta precisión PWA
 * @version 2.0 - Mejorado con accuracy, watch mode y utilities
 */

interface GeolocationState {
  // Coordenadas
  latitude: number | null;
  longitude: number | null;
  
  // Precisión y detalles
  accuracy: number | null; // Precisión en metros
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  
  // Estados
  error: string | null;
  loading: boolean;
  isSupported: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean; // Modo continuo
  onSuccess?: (position: GeolocationPosition) => void;
  onError?: (error: GeolocationPositionError) => void;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 0, // No cache para máxima precisión
    watch = false,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    loading: false,
    isSupported: typeof window !== 'undefined' && 'geolocation' in navigator,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const getCurrentPosition = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocalización no soportada por este navegador',
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const successHandler = (position: GeolocationPosition) => {
      console.log('📍 Posición obtenida - Precisión:', position.coords.accuracy, 'metros');
      
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        error: null,
        loading: false,
        isSupported: true,
      });

      onSuccess?.(position);
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = 'Error obteniendo ubicación';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permisos de ubicación denegados. Habilítalos en la configuración.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Ubicación no disponible. Verifica tu GPS.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
          break;
        default:
          errorMessage = 'Error desconocido obteniendo ubicación';
          break;
      }
      
      console.error('❌ Error geolocalización:', errorMessage);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(error);
    };

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    if (watch) {
      // Modo continuo
      const id = navigator.geolocation.watchPosition(
        successHandler,
        errorHandler,
        geoOptions
      );
      setWatchId(id);
    } else {
      // Modo una vez
      navigator.geolocation.getCurrentPosition(
        successHandler,
        errorHandler,
        geoOptions
      );
    }
  }, [state.isSupported, enableHighAccuracy, timeout, maximumAge, watch, onSuccess, onError]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      console.log('📍 Tracking detenido');
    }
  }, [watchId]);

  useEffect(() => {
    if (watch) {
      getCurrentPosition();
    }

    return () => {
      stopWatching();
    };
  }, [watch, getCurrentPosition, stopWatching]);

  const isPrecisionGood = state.accuracy !== null && state.accuracy <= 50;

  return {
    ...state,
    refreshLocation: getCurrentPosition,
    stopWatching,
    isPrecisionGood,
  };
};

// ========== UTILIDADES ==========

/**
 * Calcular distancia entre dos puntos (Haversine)
 * @returns Distancia en metros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Verificar si está dentro del radio
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radius: number
): boolean {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radius;
}

/**
 * Formatear coordenadas
 */
export function formatCoordinates(lat: number, lon: number): string {
  return `${lat.toFixed(6)}°, ${lon.toFixed(6)}°`;
}

/**
 * Descripción de precisión
 */
export function getAccuracyDescription(accuracy: number | null): string {
  if (accuracy === null) return 'Desconocida';
  if (accuracy <= 10) return 'Excelente';
  if (accuracy <= 30) return 'Muy buena';
  if (accuracy <= 50) return 'Buena';
  if (accuracy <= 100) return 'Regular';
  return 'Baja';
}
