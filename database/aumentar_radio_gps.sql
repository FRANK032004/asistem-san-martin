-- ========================================
-- AUMENTAR RADIO GPS PARA PRUEBAS
-- ========================================
-- Cambia el radio de 50m a 500m para permitir
-- pruebas desde ubicaciones más lejanas

UPDATE ubicaciones_permitidas
SET radio_metros = 500
WHERE nombre = 'IESTP SAN MARTIN DE PORRES';

-- Verificar el cambio
SELECT 
    id,
    nombre,
    latitud,
    longitud,
    radio_metros,
    activo
FROM ubicaciones_permitidas;

-- NOTA: Para producción, usa radios realistas:
-- - Institución pequeña: 50-100m
-- - Institución mediana: 100-200m  
-- - Institución grande: 200-500m
-- Para pruebas de desarrollo: 500-1000m
