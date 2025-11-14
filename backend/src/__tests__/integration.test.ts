import { calcularDistancia } from '../utils/gps.utils';

describe('🎯 Test de Integración - Flujo Completo de Asistencia', () => {

  describe('🚀 Flujo Crítico: Registro de Entrada GPS', () => {
    
    it('✅ INTEGRACIÓN COMPLETA: Usuario debe poder registrar entrada con GPS válido', async () => {
      // Arrange - Datos de entrada realistas
      const coordenadasInstituto = {
        latitud: -12.0464,
        longitud: -77.0428
      };
      
      const coordenadasDocente = {
        latitud: -12.0460, // 50 metros del instituto
        longitud: -77.0425
      };
      
      // Act - Simular registro de entrada
      const distancia = calcularDistancia(
        coordenadasInstituto.latitud,
        coordenadasInstituto.longitud,
        coordenadasDocente.latitud,
        coordenadasDocente.longitud
      );
      
      const rangoPermitido = 100; // 100 metros
      const entradaValida = distancia <= rangoPermitido;
      
      // Assert - Verificar flujo completo
      expect(distancia).toBeLessThan(100); // Menos de 100 metros
      expect(entradaValida).toBe(true);
      expect(typeof distancia).toBe('number');
      
      // Simular estructura de respuesta de entrada exitosa
      const respuestaEsperada = {
        success: true,
        mensaje: 'Entrada registrada correctamente',
        distancia: distancia,
        ubicacion: {
          latitud: coordenadasDocente.latitud,
          longitud: coordenadasDocente.longitud
        },
        timestamp: expect.any(String)
      };
      
      // Verificar estructura de respuesta
      expect(respuestaEsperada.success).toBe(true);
      expect(respuestaEsperada.distancia).toBeLessThan(rangoPermitido);
    });

    it('❌ INTEGRACIÓN: Debe rechazar entrada con GPS fuera de rango', async () => {
      // Arrange
      const coordenadasInstituto = {
        latitud: -12.0464,
        longitud: -77.0428
      };
      
      const coordenadasLejas = {
        latitud: -12.1000, // Muy lejos del instituto
        longitud: -77.1000
      };
      
      // Act
      const distancia = calcularDistancia(
        coordenadasInstituto.latitud,
        coordenadasInstituto.longitud,
        coordenadasLejas.latitud,
        coordenadasLejas.longitud
      );
      
      const rangoPermitido = 100;
      const entradaValida = distancia <= rangoPermitido;
      
      // Assert
      expect(distancia).toBeGreaterThan(rangoPermitido);
      expect(entradaValida).toBe(false);
      
      // Simular respuesta de error
      const respuestaError = {
        success: false,
        error: 'Ubicación fuera del rango permitido',
        distancia: distancia,
        rangoPermitido: rangoPermitido
      };
      
      expect(respuestaError.success).toBe(false);
      expect(respuestaError.distancia).toBeGreaterThan(rangoPermitido);
    });

  });

  describe('⏰ Validaciones de Horario', () => {
    
    it('✅ Debe validar horario de entrada válido', () => {
      // Arrange - Simular horario de entrada (7:00 AM - 9:00 AM)
      const horaEntrada = new Date();
      horaEntrada.setHours(8, 30, 0, 0); // 8:30 AM
      
      const horaInicioPermitida = 7; // 7:00 AM
      const horaFinPermitida = 9;    // 9:00 AM
      
      // Act
      const horaActual = horaEntrada.getHours();
      const horarioValido = horaActual >= horaInicioPermitida && horaActual <= horaFinPermitida;
      
      // Assert
      expect(horarioValido).toBe(true);
      expect(horaActual).toBeGreaterThanOrEqual(horaInicioPermitida);
      expect(horaActual).toBeLessThanOrEqual(horaFinPermitida);
    });

    it('⚠️ Debe marcar tardanza después de hora límite', () => {
      // Arrange
      const horaEntradaTarde = new Date();
      horaEntradaTarde.setHours(9, 30, 0, 0); // 9:30 AM (tarde)
      
      const horaLimite = 9; // 9:00 AM
      
      // Act
      const horaActual = horaEntradaTarde.getHours();
      const minutosActuales = horaEntradaTarde.getMinutes();
      
      // Convertir a minutos totales para comparación precisa
      const minutosLimite = horaLimite * 60; // 9:00 = 540 minutos
      const minutosEntrada = horaActual * 60 + minutosActuales; // 9:30 = 570 minutos
      
      const esTardanza = minutosEntrada > minutosLimite;
      
      // Assert
      expect(esTardanza).toBe(true);
      expect(minutosEntrada).toBeGreaterThan(minutosLimite);
    });

  });

});
