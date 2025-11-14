import { calcularDistancia } from '../utils/gps.utils';

describe('🗺️ Utilidades GPS - Tests Básicos', () => {
  
  describe('calcularDistancia', () => {
    
    it('✅ Debe calcular distancia entre dos puntos correctamente', () => {
      // Arrange - Coordenadas de prueba (Lima Centro)
      const lat1 = -12.0464; // Plaza de Armas
      const lon1 = -77.0428;
      const lat2 = -12.0470; // Muy cerca
      const lon2 = -77.0430;
      
      // Act
      const distance = calcularDistancia(lat1, lon1, lat2, lon2);
      
      // Assert
      expect(distance).toBeDefined();
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(100); // Menos de 100 metros
    });

    it('✅ Debe retornar 0 para coordenadas idénticas', () => {
      // Arrange
      const lat = -12.0464;
      const lon = -77.0428;
      
      // Act
      const distance = calcularDistancia(lat, lon, lat, lon);
      
      // Assert
      expect(distance).toBe(0);
    });

    it('✅ Debe manejar coordenadas válidas del Instituto', () => {
      // Arrange - Coordenadas típicas del Instituto San Martín (ejemplo)
      const institutoLat = -12.0464;
      const institutoLon = -77.0428;
      
      // Coordenadas de un docente cerca del instituto
      const docenteLat = -12.0460;
      const docenteLon = -77.0425;
      
      // Act
      const distance = calcularDistancia(institutoLat, institutoLon, docenteLat, docenteLon);
      
      // Assert
      expect(distance).toBeDefined();
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(500); // Menos de 500 metros
    });

    it('⚠️ Debe manejar parámetros inválidos', () => {
      // Act & Assert
      expect(() => {
        calcularDistancia(NaN, 0, 0, 0);
      }).not.toThrow(); // La función debe ser robusta
      
      expect(() => {
        calcularDistancia(0, NaN, 0, 0);
      }).not.toThrow();
    });

  });

  describe('🎯 Validación de Zona Permitida', () => {
    
    it('✅ Debe identificar ubicación dentro del rango permitido', () => {
      // Arrange
      const institutoLat = -12.0464;
      const institutoLon = -77.0428;
      const rangoPermitido = 100; // 100 metros
      
      // Coordenadas dentro del rango (50 metros)
      const docenteLat = -12.0460;
      const docenteLon = -77.0425;
      
      // Act
      const distance = calcularDistancia(institutoLat, institutoLon, docenteLat, docenteLon);
      const estaEnRango = distance <= rangoPermitido;
      
      // Assert
      expect(estaEnRango).toBe(true);
      expect(distance).toBeLessThanOrEqual(rangoPermitido);
    });

    it('❌ Debe identificar ubicación fuera del rango permitido', () => {
      // Arrange
      const institutoLat = -12.0464;
      const institutoLon = -77.0428;
      const rangoPermitido = 50; // 50 metros
      
      // Coordenadas fuera del rango (muy lejos)
      const docenteLat = -12.0500; // Mucho más lejos
      const docenteLon = -77.0500;
      
      // Act
      const distance = calcularDistancia(institutoLat, institutoLon, docenteLat, docenteLon);
      const estaEnRango = distance <= rangoPermitido;
      
      // Assert
      expect(estaEnRango).toBe(false);
      expect(distance).toBeGreaterThan(rangoPermitido);
    });

  });

});
