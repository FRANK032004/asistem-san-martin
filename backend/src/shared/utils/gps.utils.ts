/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param lat1 Latitud del primer punto
 * @param lon1 Longitud del primer punto
 * @param lat2 Latitud del segundo punto
 * @param lon2 Longitud del segundo punto
 * @returns Distancia en metros
 */
export function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ en radianes
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * Valida si unas coordenadas están dentro del radio permitido de una ubicación
 * @param lat Latitud a validar
 * @param lon Longitud a validar
 * @param latBase Latitud de la ubicación base
 * @param lonBase Longitud de la ubicación base
 * @param radioPermitido Radio permitido en metros
 * @returns true si está dentro del radio, false si no
 */
export function validarUbicacion(
  lat: number,
  lon: number,
  latBase: number,
  lonBase: number,
  radioPermitido: number
): boolean {
  const distancia = calcularDistancia(lat, lon, latBase, lonBase);
  return distancia <= radioPermitido;
}

/**
 * Convierte grados decimales a coordenadas DMS (Grados, Minutos, Segundos)
 * @param decimal Coordenada en grados decimales
 * @param isLatitude true si es latitud, false si es longitud
 * @returns String con formato DMS
 */
export function decimalToDMS(decimal: number, isLatitude: boolean): string {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutes = Math.floor((abs - degrees) * 60);
  const seconds = ((abs - degrees) * 60 - minutes) * 60;
  
  const direction = isLatitude 
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');
    
  return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
}

/**
 * Valida que las coordenadas estén en rangos válidos
 * @param lat Latitud
 * @param lon Longitud
 * @returns true si son válidas, false si no
 */
export function validarCoordenadas(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
