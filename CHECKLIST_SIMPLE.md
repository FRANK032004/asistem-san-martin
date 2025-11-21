# ✅ CHECKLIST SIMPLE - QUÉ HACER AHORA

## 🎯 ESTADO ACTUAL: Sistema Funcionando ✅

**Buenas noticias:** Tu backend y frontend están activos y respondiendo correctamente.

---

## 🚀 PASOS PARA COMPLETAR EL TESTING (En Orden)

### ✅ PASO 1: Verificar que tienes datos en la base de datos (10 min)

**¿Por qué?** Sin datos, no podrás hacer login ni probar nada.

**Cómo hacerlo:**

**Opción A - Rápida (Railway CLI):**
```bash
# 1. Instalar Railway CLI (solo la primera vez)
npm install -g @railway/cli

# 2. Login
railway login

# 3. Vincular proyecto
railway link
# Seleccionar: asistem-san-martin

# 4. Ejecutar seed (crear datos iniciales)
railway run npm run prisma:seed
```

**Opción B - Manual (Railway Dashboard):**
1. Ir a: https://railway.app/dashboard
2. Abrir tu proyecto
3. Click en servicio PostgreSQL
4. Click en "Query"
5. Ejecutar:
   ```sql
   SELECT * FROM usuarios WHERE email = 'admin@sanmartin.edu.pe';
   ```
6. Si devuelve resultados → ✅ Tienes datos
7. Si está vacío → Necesitas ejecutar seed (Opción A arriba)

**Resultado Esperado:**
```
✅ Usuario admin creado
✅ 6 áreas académicas creadas
✅ 5 docentes de prueba creados
✅ 2 ubicaciones GPS creadas
```

---

### ✅ PASO 2: Probar Login en el Navegador (5 min)

**¿Por qué?** Es la funcionalidad más crítica.

**Cómo hacerlo:**
1. Abrir navegador
2. Ir a: `https://asistem-san-martin.vercel.app`
3. Abrir consola (F12)
4. Intentar login:
   - **Email:** `admin@sanmartin.edu.pe`
   - **Password:** `admin123`

**Resultados Posibles:**

✅ **SI FUNCIONA:**
- Te redirige al dashboard
- Ves el menú de navegación
- No hay errores en consola
→ **¡Perfecto! Continúa al Paso 3**

❌ **SI FALLA con "Credenciales inválidas":**
- El usuario no existe en la BD
→ **Vuelve al Paso 1 y ejecuta el seed**

❌ **SI FALLA con error de red/CORS:**
- Revisar consola (F12) → pestaña "Network"
- Error "CORS policy"?
→ **Ver: SOLUCIÓN CORS abajo**

---

### ✅ PASO 3: Verificar Variables de Entorno (10 min)

**¿Por qué?** Errores comunes vienen de variables mal configuradas.

**Cómo hacerlo:**
```bash
# Ejecutar script de verificación
.\check-env-vars.ps1
```

**O manualmente:**

**Railway (Backend):**
1. Ir a: https://railway.app/dashboard
2. Tu proyecto → Backend service → Variables
3. Verificar que existen:
   - ✅ `DATABASE_URL` (generada automáticamente)
   - ✅ `JWT_SECRET` (mínimo 32 caracteres)
   - ✅ `JWT_REFRESH_SECRET` (diferente del anterior)
   - ✅ `FRONTEND_URL` = `https://asistem-san-martin.vercel.app`
   - ✅ `ALLOWED_ORIGINS` = `https://asistem-san-martin.vercel.app,https://*.vercel.app`
   - ✅ `NODE_ENV` = `production`

**Vercel (Frontend):**
1. Ir a: https://vercel.com/dashboard
2. Tu proyecto → Settings → Environment Variables
3. Verificar:
   - ✅ `NEXT_PUBLIC_API_URL` = `https://asistem-san-martin-production-b195.up.railway.app/api`

**Si falta alguna variable:**
- Railway → Agregar y esperar redeploy automático
- Vercel → Agregar y hacer Redeploy manual (Deployments → ⋯ → Redeploy)

---

### ✅ PASO 4: Probar Funcionalidad GPS (15 min)

**¿Por qué?** Es la característica principal del sistema.

**Requisitos Previos:**
- [ ] Login funcionando (Paso 2)
- [ ] Ubicaciones GPS en la BD (Paso 1 - seed)

**Cómo hacerlo:**
1. Login exitoso
2. Ir a: Docente → Registro de Asistencia
3. El navegador pedirá permiso de ubicación → **Permitir**
4. Debería mostrarse un mapa
5. Verificar en consola (F12):
   ```javascript
   // Debe aparecer algo como:
   {lat: -12.xxxx, lng: -77.xxxx}
   ```
6. Click en "Registrar Entrada"

**Resultados Posibles:**

✅ **Si está cerca de ubicación permitida:**
- Registro exitoso
- Muestra confirmación
- Aparece en lista de asistencias

⚠️ **Si está lejos de ubicación permitida:**
- Error: "Fuera del rango permitido" (esperado)
- Distancia mostrada > 50 metros

❌ **Si GPS no funciona:**
- No obtiene coordenadas
- Error en consola
→ **GPS solo funciona con HTTPS ✅** (Vercel ya lo tiene)
→ Verificar permisos del navegador

---

### ✅ PASO 5: Probar CRUD de Docentes (10 min)

**¿Por qué?** Verificar que las operaciones básicas funcionan.

**Cómo hacerlo:**
1. Login como admin
2. Ir a: Admin → Docentes
3. **Crear:**
   - Click "Nuevo Docente"
   - Llenar formulario
   - Guardar
   - ✅ Debe aparecer en la lista
4. **Editar:**
   - Click en un docente
   - Modificar datos
   - Guardar
   - ✅ Cambios reflejados
5. **Buscar/Filtrar:**
   - Usar barra de búsqueda
   - ✅ Filtra correctamente

---

### ✅ PASO 6: Generar un Reporte (10 min)

**¿Por qué?** Los reportes son críticos para RRHH.

**Cómo hacerlo:**
1. Admin → Reportes
2. Seleccionar tipo: "Asistencias"
3. Filtrar por fecha (hoy o este mes)
4. Generar
5. Exportar a Excel

**Resultado Esperado:**
- ✅ Reporte se genera
- ✅ Muestra datos correctos
- ✅ Excel descarga

---

## 🔧 SOLUCIONES RÁPIDAS A PROBLEMAS COMUNES

### 🔴 PROBLEMA: Login falla con "Credenciales inválidas"

**Causa:** Usuario admin no existe en BD

**Solución:**
```bash
railway login
railway link
railway run npm run prisma:seed
```

---

### 🔴 PROBLEMA: Error de CORS en consola

**Causa:** ALLOWED_ORIGINS mal configurada

**Solución:**
1. Railway → Backend → Variables
2. Buscar `ALLOWED_ORIGINS`
3. Debe ser: `https://asistem-san-martin.vercel.app,https://*.vercel.app`
4. Guardar y esperar redeploy

---

### 🔴 PROBLEMA: Frontend no puede conectar con Backend

**Causa:** NEXT_PUBLIC_API_URL incorrecta

**Solución:**
1. Vercel → Proyecto → Settings → Environment Variables
2. Buscar `NEXT_PUBLIC_API_URL`
3. Debe ser: `https://asistem-san-martin-production-b195.up.railway.app/api`
4. Guardar
5. Deployments → Latest → ⋯ → Redeploy

---

### 🔴 PROBLEMA: GPS no funciona

**Causas Posibles:**
1. ❌ No diste permiso de ubicación → Permitir en el navegador
2. ❌ No hay ubicaciones en la BD → Ejecutar seed
3. ❌ Navegador no soporta geolocalización → Usar Chrome/Firefox/Safari

**Solución:**
- Limpiar permisos del sitio
- Recargar página
- Dar permiso de ubicación nuevamente

---

## 📊 CÓMO SABER SI TODO ESTÁ BIEN

### ✅ Checklist Final:

- [ ] Login funciona
- [ ] Dashboard carga sin errores
- [ ] Puedes crear un docente
- [ ] GPS obtiene tu ubicación
- [ ] Puedes registrar una asistencia (si estás cerca)
- [ ] Los reportes se generan
- [ ] No hay errores en consola (F12)

**Si todas están marcadas → ✅ SISTEMA LISTO PARA USAR**

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE TESTING

### Si todo funciona:
1. Capacitar a usuarios
2. Documentar credenciales
3. Configurar backup de BD
4. Monitorear primeros días

### Si hay errores:
1. Revisar `DIAGNOSTICO_PRODUCCION.md`
2. Ejecutar `.\test-production.ps1` para más detalles
3. Ver logs:
   ```bash
   railway logs --tail 100  # Backend
   ```

---

## 🆘 SI NECESITAS AYUDA

**Documentación Completa:**
- `GUIA_TESTING_PRODUCCION.md` - Testing detallado
- `DIAGNOSTICO_PRODUCCION.md` - Solución de problemas
- `REPORTE_TESTING_INICIAL.md` - Estado actual del sistema

**Scripts Útiles:**
```bash
# Testing completo
.\test-production.ps1

# Verificar variables
.\check-env-vars.ps1

# Testing de API
cd backend
npm run test:api
```

**Logs:**
```bash
# Backend (Railway)
railway logs --tail 100

# Frontend (Vercel)
# Ver en: https://vercel.com → Proyecto → Deployments → Logs
```

---

## 💡 TIPS IMPORTANTES

1. **Siempre revisa la consola del navegador (F12)** - La mayoría de errores se ven ahí
2. **Los logs de Railway son tu amigo** - Si algo falla en backend, mira los logs
3. **Redeploy si cambias variables** - Railway auto-redeploy, Vercel necesita manual
4. **Seed solo una vez** - Ejecutar múltiples veces duplicará datos
5. **HTTPS es obligatorio para GPS** - Vercel ya lo tiene ✅

---

**¡ÉXITO! 🎉**

Tu sistema está funcionando. Solo necesitas completar estos pasos y estará 100% listo.

**Tiempo estimado total:** 1-2 horas

---

**Creado:** 2025-11-20
**Sistema:** ASISTEM San Martín
**Versión:** 1.0.0
