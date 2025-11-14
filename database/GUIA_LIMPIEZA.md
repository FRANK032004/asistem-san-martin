# 🧹 GUÍA DE LIMPIEZA DE BASE DE DATOS - ASISTEM SAN MARTÍN

## 📊 **RESUMEN DE TABLAS ENCONTRADAS**

Basándome en tu captura de PostgreSQL, tienes aproximadamente **25-30 tablas**, pero muchas son innecesarias:

### **✅ TABLAS NECESARIAS (18 tablas)**
- **16 tablas principales** del sistema ASISTEM
- **2 tablas adicionales** útiles (reportes, configuraciones)

### **🗑️ TABLAS INNECESARIAS (7-12 tablas)**
- **Geocodificación US**: `us_gaz`, `us_lex`, `us_rules` (no sirven en Perú)
- **PostGIS no usadas**: `pointcloud_formats`, `raster_*` (funciones que no usas)
- **Tiger/Topology**: Datos geográficos de Estados Unidos

## 🚨 **ANTES DE LIMPIAR - CREAR BACKUP**

### **1. Crear respaldo completo**
```bash
# Ejecutar en terminal/cmd
pg_dump -U tu_usuario -h localhost instituto_san_martin > backup_completo_antes_limpieza.sql
```

### **2. Verificar el backup**
```bash
# Verificar que el archivo se creó y tiene contenido
ls -la backup_completo_antes_limpieza.sql
```

## 🧹 **PROCESO DE LIMPIEZA**

### **Opción 1: Ejecución Automática (RECOMENDADA)**
```bash
# Desde el directorio del proyecto
cd "c:\xampp\htdocs\ASISTEM_SAN_MARTIN\backend"
npx prisma db execute --file ../database/limpieza_base_datos.sql
```

### **Opción 2: Ejecución Manual (AVANZADA)**
```bash
# Conectar a PostgreSQL y ejecutar el script manualmente
psql -U tu_usuario -d instituto_san_martin -f limpieza_base_datos.sql
```

## 📈 **BENEFICIOS DE LA LIMPIEZA**

### **🚀 RENDIMIENTO**
- ✅ **Menor uso de memoria** (menos tablas cargadas)
- ✅ **Backups más rápidos** (menor tamaño)
- ✅ **Consultas más eficientes** (menos overhead)

### **🧹 ORGANIZACIÓN**  
- ✅ **Base de datos más limpia** y profesional
- ✅ **Easier debugging** (menos ruido en logs)
- ✅ **Deployments más rápidos** (menor transferencia)

### **📊 ESTIMACIÓN DE REDUCCIÓN**
```
ANTES:  25-30 tablas (~150MB estimado)
DESPUÉS: 18 tablas (~80MB estimado)
REDUCCIÓN: 40-50% en tamaño
```

## ⚠️ **PRECAUCIONES IMPORTANTES**

### **🔒 SEGURIDAD**
1. ✅ **SIEMPRE crear backup** antes de ejecutar
2. ✅ **Ejecutar en horario de bajo tráfico**
3. ✅ **Tener acceso de administrador** a PostgreSQL
4. ✅ **Verificar que no hay conexiones activas**

### **🧪 TESTING POST-LIMPIEZA**
1. ✅ **Verificar que el sistema inicie** correctamente
2. ✅ **Probar funcionalidades GPS** (ubicaciones)
3. ✅ **Validar autenticación** de usuarios
4. ✅ **Confirmar reportes** funcionando

## 🎯 **TABLAS FINALES ESPERADAS**

Después de la limpieza deberías tener **exactamente 21 tablas**:

### **📋 APLICACIÓN (18 tablas)**
1. `usuarios`
2. `roles` 
3. `areas`
4. `docentes`
5. `asistencias`
6. `ubicaciones_permitidas`
7. `contratos_docentes`
8. `horarios_base`
9. `horarios_especiales`
10. `horas_trabajadas`
11. `planillas_horas`
12. `evaluaciones_docentes`
13. `justificaciones`
14. `notificaciones`
15. `sesiones_usuarios`
16. `logs_actividad`
17. `reportes`
18. `configuraciones`

### **🌍 POSTGIS CORE (3 tablas)**
19. `spatial_ref_sys`
20. `geography_columns`
21. `geometry_columns`

## 🆘 **PLAN DE ROLLBACK (SI ALGO SALE MAL)**

### **Restaurar desde backup**
```bash
# Detener aplicación
# Eliminar base de datos actual
dropdb -U tu_usuario instituto_san_martin

# Recrear base de datos
createdb -U tu_usuario instituto_san_martin

# Restaurar backup
psql -U tu_usuario -d instituto_san_martin < backup_completo_antes_limpieza.sql

# Reiniciar aplicación
```

## ✅ **SIGUIENTE PASO**

¿Quieres que proceda con la limpieza? Si es así:

1. **Confirma que tienes backup** de tu base de datos
2. **Detén temporalmente** el sistema (backend/frontend)
3. **Ejecuta el script** de limpieza
4. **Inicia el sistema** y verifica funcionamiento
5. **Actualiza** el plan de trabajo con la nueva estructura limpia

La limpieza hará que tu sistema sea **más profesional, más rápido y más fácil de mantener**.