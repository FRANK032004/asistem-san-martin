-- ========================================
-- SCRIPT PARA REACTIVAR CUENTA DE ADMINISTRADOR
-- ========================================
-- Ejecutar este script cuando un admin se desactive accidentalmente
-- y no pueda acceder al sistema

-- Opción 1: Reactivar TODOS los administradores desactivados
UPDATE "Usuario" 
SET activo = true 
WHERE "rolId" = (SELECT id FROM "Rol" WHERE nombre = 'ADMIN')
AND activo = false;

-- Opción 2: Reactivar un admin específico por email (comentado)
-- UPDATE "Usuario" 
-- SET activo = true 
-- WHERE email = 'tu-email@ejemplo.com' 
-- AND "rolId" = (SELECT id FROM "Rol" WHERE nombre = 'ADMIN');

-- Verificar administradores activos
SELECT 
    u.id,
    u.nombres,
    u.apellidos,
    u.email,
    u.activo,
    r.nombre as rol
FROM "Usuario" u
INNER JOIN "Rol" r ON u."rolId" = r.id
WHERE r.nombre = 'ADMIN'
ORDER BY u.activo DESC, u.nombres ASC;
