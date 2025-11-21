# 🧪 GUÍA COMPLETA DE TESTING EN PRODUCCIÓN
## Sistema ASISTEM San Martín - Primera Vez en Producción

---

## 📋 ÍNDICE

1. [Antes de Empezar](#antes-de-empezar)
2. [Fase 1: Verificación Rápida](#fase-1-verificación-rápida)
3. [Fase 2: Testing Automatizado](#fase-2-testing-automatizado)
4. [Fase 3: Testing Manual](#fase-3-testing-manual)
5. [Fase 4: Testing de Usuario Final](#fase-4-testing-de-usuario-final)
6. [Interpretación de Resultados](#interpretación-de-resultados)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 ANTES DE EMPEZAR

### ¿Qué vas a probar?

Este sistema en producción tiene 3 componentes principales:

1. **Backend (Railway):** API REST con Node.js + PostgreSQL
2. **Frontend (Vercel):** Aplicación web con Next.js
3. **Integración:** Comunicación entre ambos + GPS

### Herramientas de Testing Creadas

✅ `test-production.ps1` - Testing completo automatizado (PowerShell)
✅ `npm run test:api` - Testing de API con Node.js
✅ `check-env-vars.ps1` - Verificación de variables de entorno
✅ `DIAGNOSTICO_PRODUCCION.md` - Guía de troubleshooting

---

## 🚀 FASE 1: VERIFICACIÓN RÁPIDA (5 minutos)

### Paso 1: Verificar que los servicios estén activos

**Backend (Railway):**
```bash
# Abrir en navegador:
https://asistem-san-martin-production-b195.up.railway.app/health

# Respuesta esperada:
{
  "status": "healthy",
  "uptime": 12345,
  "database": {
    "status": "connected"
  }
}
```

✅ **Si funciona:** Backend está activo
❌ **Si falla:** Ver [Problema: Backend no responde](#problema-backend-no-responde)

**Frontend (Vercel):**
```bash
# Abrir en navegador:
https://asistem-san-martin.vercel.app

# Debe mostrar:
- Página de login
- Sin errores en consola (F12)
```

✅ **Si funciona:** Frontend está activo
❌ **Si falla:** Ver [Problema: Frontend no carga](#problema-frontend-no-carga)

---

## 🧪 FASE 2: TESTING AUTOMATIZADO (15 minutos)

### Opción A: PowerShell (Recomendado para Windows)

```powershell
# Desde la raíz del proyecto
.\test-production.ps1
```

**Qué hace este script:**
- ✅ Verifica health del backend
- ✅ Verifica endpoints de API
- ✅ Prueba CORS
- ✅ Verifica autenticación
- ✅ Prueba endpoints protegidos
- ✅ Verifica frontend y PWA
- ✅ Mide tiempos de respuesta

**Resultados esperados:**
```
✅ Health Check
✅ API Info
✅ CORS Configuration
✅ Login Endpoint
✅ Protección de Endpoints
✅ Frontend Disponible
✅ PWA Manifest
```

**Interpretación:**
- **80-100% exitosos:** ✅ Sistema funcionando correctamente
- **60-80% exitosos:** ⚠️ Problemas menores, revisar warnings
- **< 60% exitosos:** ❌ Problemas críticos, revisar errores

### Opción B: Node.js (Testing de API detallado)

```bash
# Desde la carpeta backend
cd backend
npm run test:api
```

**Qué hace este script:**
- ✅ Todos los tests de PowerShell
- ✅ Login con credenciales reales
- ✅ Obtener perfil de usuario
- ✅ Listar docentes
- ✅ Listar asistencias
- ✅ Validar GPS
- ✅ Tests de seguridad

**Resultados esperados:**
```
✅ Test 1: Health Check
✅ Test 2: API Info
✅ Test 3: Login (credenciales incorrectas)
✅ Test 4: Login (credenciales correctas)
✅ Test 5: Obtener Perfil
✅ Test 6: Listar Docentes
...
📊 Tasa de Éxito: 92.3%
```

---

## 🔍 FASE 3: TESTING MANUAL (20 minutos)

### Test 1: Login y Autenticación

**Pasos:**
1. Ir a: `https://asistem-san-martin.vercel.app`
2. Abrir consola del navegador (F12)
3. Intentar login con credenciales incorrectas:
   - Email: `test@test.com`
   - Password: `wrongpass`
   - **Esperado:** Error "Credenciales inválidas"

4. Login con credenciales correctas:
   - Email: `admin@sanmartin.edu.pe`
   - Password: `admin123`
   - **Esperado:** Redirección a dashboard

**Verificar:**
- [ ] No hay errores de CORS en consola
- [ ] Token JWT se almacena correctamente
- [ ] Redirección automática funciona

**Posibles errores:**
- ❌ "CORS policy error" → Ver [Solución CORS](#problema-cors)
- ❌ "Invalid credentials" siempre → Ver [Solución Login](#problema-login)
- ❌ "Network error" → Ver [Solución Conexión](#problema-conexión)

### Test 2: Dashboard y Navegación

**Pasos:**
1. Después de login exitoso, verificar:
   - [ ] Dashboard carga correctamente
   - [ ] Menú de navegación funciona
   - [ ] No hay errores en consola

2. Navegar a diferentes módulos:
   - [ ] Admin → Docentes
   - [ ] Admin → Áreas
   - [ ] Admin → Ubicaciones GPS
   - [ ] Docente → Registro de Asistencia

**Verificar:**
- [ ] Todas las páginas cargan sin errores
- [ ] Los datos se muestran correctamente
- [ ] Las tablas tienen información

### Test 3: Funcionalidad GPS (Crítico)

**Pasos:**
1. Ir a: Docente → Registro de Asistencia
2. El navegador debe pedir permiso de ubicación
3. Dar permiso
4. Verificar en consola (F12):
   ```javascript
   // Debe mostrar coordenadas
   {lat: -12.0464, lng: -77.0428}
   ```

5. Intentar registrar entrada:
   - **Esperado:** Si estás cerca de ubicación permitida → Registro exitoso
   - **Esperado:** Si estás lejos → Error "Fuera del rango permitido"

**Verificar:**
- [ ] Geolocalización funciona
- [ ] Mapa se muestra correctamente
- [ ] Validación de distancia funciona
- [ ] Registro se guarda en base de datos

**Nota:** GPS solo funciona con HTTPS ✅ (Vercel ya lo tiene)

### Test 4: CRUD de Docentes

**Pasos:**
1. Ir a: Admin → Docentes
2. Crear nuevo docente:
   - Llenar todos los campos
   - Guardar
   - **Esperado:** Docente aparece en lista

3. Editar docente:
   - Click en editar
   - Modificar datos
   - Guardar
   - **Esperado:** Cambios reflejados

4. Eliminar docente:
   - Click en eliminar
   - Confirmar
   - **Esperado:** Docente removido de lista

**Verificar:**
- [ ] Crear funciona
- [ ] Editar funciona
- [ ] Eliminar funciona
- [ ] Validaciones de campos funcionan

### Test 5: Reportes

**Pasos:**
1. Ir a: Admin → Reportes
2. Generar reporte de asistencias
3. Aplicar filtros (fecha, docente, área)
4. Exportar a Excel/PDF

**Verificar:**
- [ ] Reportes se generan
- [ ] Filtros funcionan
- [ ] Exportación funciona
- [ ] Datos son correctos

---

## 👥 FASE 4: TESTING DE USUARIO FINAL (30 minutos)

### Escenario 1: Docente registra su asistencia

**Historia de usuario:**
*"Como docente, quiero registrar mi entrada al llegar a la institución"*

**Pasos:**
1. Login como docente
2. Ir a "Registrar Asistencia"
3. Permitir geolocalización
4. Verificar que está en ubicación permitida
5. Click en "Registrar Entrada"
6. Verificar confirmación

**Criterios de éxito:**
- [ ] Login exitoso
- [ ] GPS obtiene ubicación
- [ ] Sistema valida distancia
- [ ] Registro se guarda
- [ ] Muestra confirmación visual
- [ ] Hora de entrada correcta

### Escenario 2: Admin consulta asistencias del día

**Historia de usuario:**
*"Como admin, quiero ver quiénes han llegado hoy"*

**Pasos:**
1. Login como admin
2. Ir a "Asistencias" → "Hoy"
3. Ver lista de asistencias
4. Filtrar por área
5. Ver detalles de un registro

**Criterios de éxito:**
- [ ] Lista carga correctamente
- [ ] Muestra información completa
- [ ] Filtros funcionan
- [ ] Detalles muestran GPS
- [ ] Tiempos son correctos

### Escenario 3: Admin genera reporte mensual

**Historia de usuario:**
*"Como admin, quiero generar el reporte de asistencias del mes para RRHH"*

**Pasos:**
1. Login como admin
2. Ir a "Reportes"
3. Seleccionar período (mes actual)
4. Generar reporte
5. Exportar a Excel

**Criterios de éxito:**
- [ ] Reporte se genera
- [ ] Incluye todos los docentes
- [ ] Cálculos son correctos
- [ ] Excel descarga correctamente
- [ ] Formato es legible

---

## 📊 INTERPRETACIÓN DE RESULTADOS

### Matriz de Severidad de Errores

| Tipo de Error | Severidad | Acción Requerida |
|---------------|-----------|------------------|
| Backend no responde | 🔴 CRÍTICA | Inmediata - Sistema inoperable |
| CORS error | 🔴 CRÍTICA | Inmediata - Frontend no funciona |
| Login falla | 🔴 CRÍTICA | Inmediata - No se puede usar |
| GPS no funciona | 🟡 ALTA | Urgente - Funcionalidad principal |
| Reportes fallan | 🟡 ALTA | Urgente - Necesario para RRHH |
| Lentitud (>5s) | 🟠 MEDIA | Prioridad - Afecta UX |
| Errores menores UI | 🟢 BAJA | Puede esperar - No bloquea uso |

### Checklist de Aprobación para Producción

#### ✅ MÍNIMO REQUERIDO (Sistema OPERABLE):
- [x] Backend responde (health check)
- [x] Database conectada
- [x] Frontend carga
- [ ] Login funciona
- [ ] CORS configurado
- [ ] Variables de entorno correctas

#### ✅ RECOMENDADO (Sistema FUNCIONAL):
- [ ] GPS funciona
- [ ] CRUD básico funciona
- [ ] Asistencias se registran
- [ ] Reportes básicos funcionan
- [ ] Sin errores críticos en logs

#### ✅ IDEAL (Sistema COMPLETO):
- [ ] Todas las funcionalidades testeadas
- [ ] Performance < 3s response time
- [ ] PWA instalable
- [ ] Notificaciones funcionan
- [ ] 0 errores en producción

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Problema: Backend no responde

**Síntomas:**
```
❌ Health Check falló: timeout
```

**Diagnóstico:**
```bash
# 1. Verificar que Railway esté activo
# Ir a: https://railway.app/dashboard

# 2. Ver logs
railway logs

# 3. Verificar database
curl https://asistem-san-martin-production-b195.up.railway.app/health
```

**Soluciones:**
1. Verificar que el servicio esté desplegado en Railway
2. Verificar que PostgreSQL esté corriendo
3. Revisar logs para errores de startup
4. Verificar variables de entorno (DATABASE_URL)

### Problema: CORS Error

**Síntomas:**
```
Access to fetch has been blocked by CORS policy
```

**Solución:**
```bash
# En Railway → Backend → Variables
# Agregar/Verificar:
ALLOWED_ORIGINS=https://asistem-san-martin.vercel.app,https://*.vercel.app
FRONTEND_URL=https://asistem-san-martin.vercel.app

# Redeploy
```

### Problema: Login siempre falla

**Diagnóstico:**
```bash
# Verificar si usuario admin existe
railway run npx prisma studio

# O ejecutar seed:
railway run npm run prisma:seed
```

**Solución:** Ver `DIAGNOSTICO_PRODUCCION.md` sección "Problema 2"

---

## 📝 REGISTRO DE TESTING

### Template de Reporte

```markdown
## REPORTE DE TESTING - [FECHA]

### Ambiente
- Backend: https://asistem-san-martin-production-b195.up.railway.app
- Frontend: https://asistem-san-martin.vercel.app
- Tester: [Nombre]

### Resultados Tests Automatizados
- Script PowerShell: [X/Y tests pasados]
- Script Node.js: [X/Y tests pasados]
- Tasa de éxito: [%]

### Tests Manuales
- [ ] Login funciona
- [ ] GPS funciona
- [ ] CRUD funciona
- [ ] Reportes funcionan

### Errores Encontrados
1. [Descripción del error]
   - Severidad: [Crítica/Alta/Media/Baja]
   - Pasos para reproducir: [...]
   - Solución aplicada: [...]

### Recomendaciones
- [Lista de mejoras sugeridas]

### Estado Final
- [ ] ✅ Aprobado para producción
- [ ] ⚠️ Aprobado con observaciones
- [ ] ❌ Requiere correcciones antes de aprobar
```

---

## 🎯 PRÓXIMOS PASOS

### Si Todo Funciona (>90% tests OK):
1. ✅ Documentar credenciales de producción
2. ✅ Capacitar a usuarios finales
3. ✅ Monitorear los primeros días
4. ✅ Recopilar feedback

### Si Hay Problemas (60-90% tests OK):
1. ⚠️ Priorizar errores críticos
2. ⚠️ Aplicar soluciones del diagnóstico
3. ⚠️ Re-testear
4. ⚠️ Documentar cambios

### Si Hay Fallas Críticas (<60% tests OK):
1. ❌ No lanzar a usuarios finales
2. ❌ Resolver todos los errores críticos
3. ❌ Re-ejecutar todos los tests
4. ❌ Validar con usuarios beta

---

**Última actualización:** 2025-11-20
**Versión:** 1.0.0
**Autor:** Sistema de Testing Automatizado
