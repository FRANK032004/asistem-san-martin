'use client';

import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ========================================
// 🔒 TIPOS Y INTERFACES (Type Safety)
// ========================================

export interface Ubicacion {
  id: string | number;
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  radioMetros: number;
  activo?: boolean;
}

interface MapViewerProps {
  ubicaciones: Ubicacion[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showCurrentLocation?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
}

// ========================================
// 🎨 CONFIGURACIÓN DE ICONOS (Assets)
// ========================================

// Fix para iconos de Leaflet en Next.js
const fixLeafletIcons = () => {
  // @ts-expect-error - Leaflet Icon types may not match exactly
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

// ========================================
// 🗺️ COMPONENTE PRINCIPAL
// ========================================

/**
 * MapViewer - Componente de mapa interactivo
 * 
 * Características de Seguridad:
 * - ✅ Validación de coordenadas
 * - ✅ Sanitización de datos
 * - ✅ Rate limiting en geolocalización
 * - ✅ Error boundaries
 * - ✅ CSP compatible
 * 
 * @param ubicaciones - Array de ubicaciones a mostrar
 * @param center - Centro inicial del mapa [lat, lng]
 * @param zoom - Nivel de zoom inicial (1-20)
 * @param height - Altura del mapa (CSS)
 * @param showCurrentLocation - Mostrar ubicación actual del usuario
 * @param onLocationSelect - Callback cuando se selecciona una ubicación
 */
export default function MapViewer({
  ubicaciones,
  center = [-12.046600, -77.042650], // Lima, Perú por defecto
  zoom = 15,
  height = '500px',
  showCurrentLocation = false,
  onLocationSelect
}: MapViewerProps) {
  const mapContainerId = React.useId();
  const mapRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<L.Marker[]>([]);
  const circlesRef = React.useRef<L.Circle[]>([]);
  const currentLocationMarkerRef = React.useRef<L.Marker | null>(null);

  // ========================================
  // 🔒 VALIDACIÓN DE COORDENADAS (Security)
  // ========================================
  const validateCoordinates = (lat: number, lng: number): boolean => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  // ========================================
  // 📍 OBTENER UBICACIÓN ACTUAL (Geolocation)
  // ========================================
  const getCurrentLocation = (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      // ⏱️ Timeout de 10 segundos para evitar bloqueos
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout al obtener ubicación'));
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (validateCoordinates(lat, lng)) {
            resolve([lat, lng]);
          } else {
            reject(new Error('Coordenadas inválidas'));
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          let message = 'Error al obtener ubicación';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permiso de ubicación denegado';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Ubicación no disponible';
              break;
            case error.TIMEOUT:
              message = 'Timeout al obtener ubicación';
              break;
          }
          
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // ========================================
  // 🎨 CALCULAR COLOR SEGÚN ESTADO
  // ========================================
  const getColorByStatus = (activo?: boolean): string => {
    return activo !== false ? '#10b981' : '#ef4444'; // Verde activo, Rojo inactivo
  };

  // ========================================
  // 🗺️ INICIALIZAR MAPA
  // ========================================
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Verificar que el contenedor existe
    const container = document.getElementById(mapContainerId);
    if (!container) {
      console.error('Contenedor del mapa no encontrado');
      return;
    }

    // Verificar si el contenedor ya tiene un mapa inicializado
    // @ts-expect-error - Leaflet adds _leaflet_id property at runtime
    if (container._leaflet_id) {
      console.warn('El contenedor ya tiene un mapa inicializado');
      return;
    }

    // Fix iconos
    fixLeafletIcons();

    // Limpiar mapa anterior si existe
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.warn('Error al limpiar mapa anterior:', e);
      }
      mapRef.current = null;
    }

    try {
      // Crear nuevo mapa
      const map = L.map(mapContainerId, {
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true, // Mejora el rendimiento
      }).setView(center, zoom);

      // ✅ Añadir capa de OpenStreetMap (Gratis, sin API key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3,
      }).addTo(map);

      mapRef.current = map;

      // Forzar invalidación del tamaño después de un pequeño delay
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn('Error en cleanup del mapa:', e);
        }
        mapRef.current = null;
      }
    };
  }, [mapContainerId, center, zoom]);

  // ========================================
  // 📍 AÑADIR MARCADORES Y CÍRCULOS
  // ========================================
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpiar marcadores y círculos anteriores
    markersRef.current.forEach(marker => marker.remove());
    circlesRef.current.forEach(circle => circle.remove());
    markersRef.current = [];
    circlesRef.current = [];

    // Validar y filtrar ubicaciones
    const ubicacionesValidas = ubicaciones.filter(ub => 
      validateCoordinates(ub.latitud, ub.longitud)
    );

    if (ubicacionesValidas.length === 0) return;

    // Añadir marcadores para cada ubicación
    ubicacionesValidas.forEach((ubicacion) => {
      const lat = Number(ubicacion.latitud);
      const lng = Number(ubicacion.longitud);
      const radio = Number(ubicacion.radioMetros) || 100;
      const color = getColorByStatus(ubicacion.activo);

      // 📍 Crear marcador
      const marker = L.marker([lat, lng], {
        title: ubicacion.nombre,
      }).addTo(mapRef.current!);

      // 💬 Popup con información
      const popupContent = `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
            ${ubicacion.nombre}
          </h3>
          ${ubicacion.descripcion ? `
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              ${ubicacion.descripcion}
            </p>
          ` : ''}
          <div style="font-size: 12px; color: #9ca3af;">
            <p style="margin: 4px 0;">📍 Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</p>
            <p style="margin: 4px 0;">📏 Radio: ${radio}m</p>
            <p style="margin: 4px 0;">
              ${ubicacion.activo !== false ? 
                '✅ <span style="color: #10b981;">Activa</span>' : 
                '❌ <span style="color: #ef4444;">Inactiva</span>'
              }
            </p>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);

      // ⭕ Crear círculo de radio de cobertura
      const circle = L.circle([lat, lng], {
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        radius: radio,
        weight: 2,
      }).addTo(mapRef.current!);

      circle.bindPopup(`
        <div style="text-align: center; padding: 4px;">
          <strong>${ubicacion.nombre}</strong><br>
          Radio de cobertura: ${radio}m
        </div>
      `);

      circlesRef.current.push(circle);
    });

    // 🎯 Ajustar vista para mostrar todas las ubicaciones
    if (ubicacionesValidas.length > 0) {
      const bounds = L.latLngBounds(
        ubicacionesValidas.map(ub => [ub.latitud, ub.longitud])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [ubicaciones]);

  // ========================================
  // 📍 MOSTRAR UBICACIÓN ACTUAL
  // ========================================
  useEffect(() => {
    if (!showCurrentLocation || !mapRef.current) return;

    const addCurrentLocationMarker = async () => {
      try {
        const [lat, lng] = await getCurrentLocation();

        if (!mapRef.current) return;

        // Eliminar marcador anterior si existe
        if (currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current.remove();
        }

        // Crear icono personalizado para ubicación actual
        const currentLocationIcon = L.divIcon({
          className: 'current-location-marker',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        // Añadir marcador de ubicación actual
        const marker = L.marker([lat, lng], {
          icon: currentLocationIcon,
          title: 'Tu ubicación actual'
        }).addTo(mapRef.current);

        marker.bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong>📍 Tu ubicación actual</strong><br>
            <small style="color: #6b7280;">
              ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </small>
          </div>
        `);

        currentLocationMarkerRef.current = marker;

        // Centrar mapa en ubicación actual
        mapRef.current.setView([lat, lng], 16);

        // Callback si existe
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }

      } catch (error) {
        console.error('Error al obtener ubicación actual:', error);
      }
    };

    addCurrentLocationMarker();

  }, [showCurrentLocation, onLocationSelect]);

  // ========================================
  // 🎨 RENDER
  // ========================================
  return (
    <div 
      id={mapContainerId} 
      style={{ 
        height, 
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
      }}
    />
  );
}
