'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ========================================
// 📦 INTERFACES
// ========================================
interface MapSelectorProps {
  lat: number;
  lng: number;
  radius: number;
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
}

// ========================================
// 🗺️ COMPONENTE MAP SELECTOR
// ========================================
export default function MapSelector({
  lat,
  lng,
  radius,
  zoom = 16,
  onMapClick
}: MapSelectorProps) {
  const mapContainerId = React.useId();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // ========================================
  // 🔧 FIX ICONOS LEAFLET
  // ========================================
  useEffect(() => {
    // @ts-expect-error - Leaflet Icon types may not match exactly
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  // ========================================
  // 🗺️ INICIALIZAR MAPA
  // ========================================
  useEffect(() => {
    if (!mapRef.current) {
      // Crear mapa
      const map = L.map(mapContainerId, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Añadir capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Añadir marcador inicial
      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }).addTo(map);

      // Añadir círculo de radio
      const circle = L.circle([lat, lng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: radius,
        weight: 2,
      }).addTo(map);

      // Handler para drag del marcador
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        circle.setLatLng(position);
        if (onMapClick) {
          onMapClick(position.lat, position.lng);
        }
      });

      // Handler para click en el mapa
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        if (onMapClick) {
          onMapClick(newLat, newLng);
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []); // Solo inicializar una vez

  // ========================================
  // 🔄 ACTUALIZAR POSICIÓN Y RADIO
  // ========================================
  useEffect(() => {
    if (mapRef.current && markerRef.current && circleRef.current) {
      const newLatLng = L.latLng(lat, lng);
      
      // Actualizar marcador
      markerRef.current.setLatLng(newLatLng);
      
      // Actualizar círculo
      circleRef.current.setLatLng(newLatLng);
      circleRef.current.setRadius(radius);
      
      // Centrar mapa suavemente
      mapRef.current.setView(newLatLng, zoom, {
        animate: true,
        duration: 0.5
      });
    }
  }, [lat, lng, radius, zoom]);

  // ========================================
  // 🎨 RENDER
  // ========================================
  return (
    <div className="relative w-full h-full">
      <div 
        id={mapContainerId} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Instrucciones flotantes */}
      <div className="absolute top-4 left-4 z-1000 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 max-w-xs">
        <p className="text-sm font-medium text-gray-900 mb-1">
          💡 Cómo seleccionar ubicación:
        </p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <strong>Click</strong> en el mapa para mover el marcador</li>
          <li>• <strong>Arrastra</strong> el marcador a la posición exacta</li>
          <li>• El círculo muestra el área de cobertura</li>
        </ul>
      </div>

      {/* Info del radio */}
      <div className="absolute bottom-4 right-4 z-1000 bg-blue-600 text-white rounded-lg shadow-lg px-4 py-2">
        <p className="text-sm font-semibold">
          Radio: {radius}m
        </p>
      </div>
    </div>
  );
}
