# 🔍 DIAGNÓSTICO Y TROUBLESHOOTING DE PRODUCCIÓN
## Sistema ASISTEM San Martín

---

## 📋 CHECKLIST DE VERIFICACIÓN RÁPIDA

### ✅ Backend (Railway)
- [ ] Backend responde en: `https://asistem-san-martin-production-b195.up.railway.app/health`
- [ ] Database conectada (check en `/health`)
- [ ] Variables de entorno configuradas
- [ ] Seed data ejecutado (usuario admin existe)
- [ ] CORS configurado correctamente
- [ ] Logs sin errores críticos

### ✅ Frontend (Vercel)
- [ ] Frontend accesible en: `https://asistem-san-martin.vercel.app`
- [ ] Build exitoso (sin errores)
- [ ] `NEXT_PUBLIC_API_URL` configurada correctamente
- [ ] PWA manifest y service worker funcionando
- [ ] Puede hacer login

### ✅ Integración
- [ ] Frontend puede llamar al backend (CORS OK)
- [ ] Login funciona end-to-end
- [ ] Tokens JWT funcionan
- [ ] GPS/geolocalización funciona

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### **Problema 1: "Cannot connect to backend" / CORS Error**

**Síntomas:**
- Error en consola del navegador: `CORS policy: No 'Access-Control-Allow-Origin' header`
- Requests desde frontend fallan con error de red

**Diagnóstico:**
```bash
# Verificar CORS desde el navegador
curl -H "Origin: https://asistem-san-martin.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://asistem-san-martin-production-b195.up.railway.app/api
```

**Solución:**
1. Ir a Railway → Backend Service → Variables
2. Verificar/Agregar:
   ```env
   ALLOWED_ORIGINS=https://asistem-san-martin.vercel.app,https://asistem-san-martin-git-main-frank032004.vercel.app,https://*.vercel.app
   FRONTEND_URL=https://asistem-san-martin.vercel.app
   ```
3. Redeploy del backend

---

### **Problema 2: "Invalid credentials" al hacer login**

**Síntomas:**
- Login siempre falla con usuario admin
- Error 401 Unauthorized

**Diagnóstico:**
```bash
# Test manual de login
curl -X POST https://asistem-san-martin-production-b195.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sanmartin.edu.pe","password":"admin123"}'
```

**Posibles Causas:**
1. **Seed no ejecutado:** Usuario admin no existe en la base de datos
2. **Password hash incorrecto:** El hash en BD no coincide con "admin123"
3. **Database vacía:** No hay datos de prueba

**Solución:**

**Opción A: Verificar si usuario existe (Railway CLI)**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y conectar
railway login
railway link

# Ejecutar query
railway run npx prisma studio
# O usar Railway Dashboard → PostgreSQL → Query
```

**Opción B: Ejecutar seed manualmente**
```bash
# Desde Railway
railway run npm run prisma:seed

# O agregar a variables de Railway
# En Settings → Deploy → Custom Start Command:
npm run prisma:seed && npm start
```

**Opción C: Crear usuario manualmente (SQL)**
```sql
-- Conectar a Railway PostgreSQL (Dashboard → PostgreSQL → Query)

-- Generar hash de "admin123"
-- Ejecutar en Node.js local:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('admin123', 10).then(console.log);

-- Insertar usuario (reemplazar <HASH> con el hash generado)
INSERT INTO usuarios (id, dni, nombres, apellidos, email, password_hash, rol_id, activo)
VALUES (
  gen_random_uuid(),
  '00000000',
  'Administrador',
  'Sistema',
  'admin@sanmartin.edu.pe',
  '<HASH_DE_ADMIN123>',
  1,
  true
);

-- Verificar
SELECT * FROM usuarios WHERE email = 'admin@sanmartin.edu.pe';
```

---

### **Problema 3: "Database connection failed"**

**Síntomas:**
- `/health` devuelve status "degraded"
- Error: "Can't reach database server"

**Diagnóstico:**
```bash
# Verificar health
curl https://asistem-san-martin-production-b195.up.railway.app/health
```

**Solución:**
1. Verificar que PostgreSQL esté corriendo en Railway
2. Verificar `DATABASE_URL` en variables de entorno
3. Railway genera automáticamente esta variable al agregar PostgreSQL
4. Si no existe, copiarla del servicio PostgreSQL:
   - Railway → PostgreSQL Service → Variables → `DATABASE_URL`
   - Copiar y pegar en Backend Service → Variables

---

### **Problema 4: Frontend muestra "API not configured"**

**Síntomas:**
- Frontend carga pero no puede hacer requests
- Console error: "NEXT_PUBLIC_API_URL is not defined"

**Diagnóstico:**
```javascript
// Abrir consola del navegador (F12) y ejecutar:
console.log(process.env.NEXT_PUBLIC_API_URL);
// Si muestra "undefined", falta la variable
```

**Solución:**
1. Ir a Vercel → Proyecto → Settings → Environment Variables
2. Buscar `NEXT_PUBLIC_API_URL`
3. Si no existe o está mal, agregar/corregir:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://asistem-san-martin-production-b195.up.railway.app/api
   Environments: Production, Preview, Development (todos marcados)
   ```
4. Hacer Redeploy:
   - Vercel → Deployments → Latest → ⋯ → Redeploy

---

### **Problema 5: "Prisma Client not generated"**

**Síntomas:**
- Backend no inicia
- Error: `@prisma/client did not initialize yet`

**Solución:**
1. Verificar Build Command en Railway:
   ```bash
   npm install --legacy-peer-deps && npx prisma generate && npm run build
   ```
2. Si el error persiste, agregar a `package.json`:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```
3. Redeploy

---

### **Problema 6: Tokens JWT expiran muy rápido**

**Síntomas:**
- Usuario debe hacer login constantemente
- Error 401 después de pocos minutos

**Solución:**
Ajustar variables en Railway:
```env
JWT_EXPIRES_IN=24h          # Token principal
JWT_REFRESH_EXPIRES_IN=7d   # Refresh token
```

---

### **Problema 7: GPS no funciona en producción**

**Síntomas:**
- Geolocalización no se obtiene
- Browser pide permisos pero falla

**Diagnóstico:**
- GPS solo funciona con HTTPS ✅ (Vercel ya tiene HTTPS)
- Verificar permisos del navegador
- Verificar que el usuario dio permiso de ubicación

**Solución:**
1. Verificar que frontend use HTTPS (ya lo tiene con Vercel)
2. Limpiar permisos del sitio en el navegador
3. Recargar y dar permiso de ubicación nuevamente

---

### **Problema 8: "Rate limit exceeded"**

**Síntomas:**
- Error 429 Too Many Requests
- Backend rechaza requests

**Solución:**
Ajustar rate limiting en Railway:
```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100      # Aumentar si es necesario
```

---

## 🔧 HERRAMIENTAS DE DIAGNÓSTICO

### **1. Script de Testing Automatizado**

```bash
# PowerShell
.\test-production.ps1

# Node.js (desde backend/)
npm run test:api
```

### **2. Verificar Logs en Tiempo Real**

**Railway:**
```bash
railway logs --tail 100
```

**Vercel:**
```bash
vercel logs [deployment-url] --follow
```

### **3. Verificar Variables de Entorno**

**Railway:**
```bash
railway variables
```

**Vercel:**
```bash
vercel env ls
```

---

## 📊 MONITOREO Y SALUD DEL SISTEMA

### **Endpoints de Salud**

```bash
# Health check completo
curl https://asistem-san-martin-production-b195.up.railway.app/health

# Respuesta esperada:
{
  "status": "healthy",
  "uptime": 12345,
  "database": {
    "status": "connected",
    "latency": "25ms"
  }
}
```

### **Métricas Importantes**

| Métrica | Valor Esperado | Crítico Si |
|---------|----------------|------------|
| Response Time | < 2 segundos | > 5 segundos |
| Database Latency | < 100ms | > 500ms |
| Uptime | > 99% | < 95% |
| Error Rate | < 1% | > 5% |

---

## 🚀 COMANDOS DE EMERGENCIA

### **Redeploy Rápido**

```bash
# Frontend (Vercel)
vercel --prod

# Backend (Railway)
railway up
```

### **Rollback a Versión Anterior**

**Vercel:**
1. Dashboard → Deployments
2. Encontrar deployment anterior funcional
3. ⋯ → Promote to Production

**Railway:**
1. Dashboard → Deployments
2. Click en deployment anterior
3. Redeploy

### **Reiniciar Servicios**

**Railway:**
- No hay comando directo, pero puedes hacer un nuevo deploy
- O cambiar una variable de entorno (trigger redeploy)

---

## 📞 CONTACTOS DE EMERGENCIA

| Servicio | Soporte |
|----------|---------|
| Railway | https://railway.app/help |
| Vercel | https://vercel.com/support |
| PostgreSQL | Logs en Railway Dashboard |

---

## 📝 REGISTRO DE INCIDENTES

### Plantilla de Incidente

```markdown
**Fecha:** YYYY-MM-DD HH:MM
**Severidad:** Crítica / Alta / Media / Baja
**Componente:** Backend / Frontend / Database / Integración
**Descripción:** [Descripción del problema]
**Causa Raíz:** [Causa identificada]
**Solución Aplicada:** [Pasos realizados]
**Tiempo de Resolución:** [Minutos/horas]
**Prevención:** [Cómo evitar en el futuro]
```

---

**Última actualización:** 2025-11-20
**Versión del documento:** 1.0.0
