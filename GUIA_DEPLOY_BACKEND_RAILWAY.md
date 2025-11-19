# 🚀 Guía Completa: Desplegar Backend en Railway

## 📋 Pre-requisitos
- ✅ Cuenta de GitHub (ya tienes)
- ✅ Repositorio en GitHub (ya está subido)
- ✅ Frontend desplegado en Vercel (✅ Completado)

---

## 🎯 PASO 1: Crear Cuenta en Railway

1. Ve a: **https://railway.app**
2. Haz clic en **"Start a New Project"** o **"Login"**
3. Selecciona **"Login with GitHub"**
4. Autoriza a Railway para acceder a tus repositorios

---

## 🎯 PASO 2: Crear Nuevo Proyecto

1. En el Dashboard de Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona: **`FRANK032004/asistem-san-martin`**
4. Railway detectará automáticamente que es un proyecto Node.js

---

## 🎯 PASO 3: Configurar el Servicio Backend

### 3.1. Configurar Root Directory
1. Una vez creado el proyecto, haz clic en el servicio
2. Ve a **Settings** (⚙️)
3. Busca **"Root Directory"**
4. Configura: `backend`
5. Guarda los cambios

### 3.2. Verificar Build & Start Commands
Railway debería detectar automáticamente:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

Si no lo detecta:
1. Ve a **Settings** → **Deploy**
2. **Build Command**: `npm install && npm run prisma:generate && npm run build`
3. **Start Command**: `npm start`

---

## 🎯 PASO 4: Agregar PostgreSQL

1. En tu proyecto de Railway, haz clic en **"+ New"**
2. Selecciona **"Database"**
3. Selecciona **"PostgreSQL"**
4. Railway creará automáticamente una base de datos PostgreSQL

### 4.1. Obtener la DATABASE_URL
1. Haz clic en el servicio de **PostgreSQL**
2. Ve a la pestaña **"Variables"**
3. Copia el valor de **`DATABASE_URL`**

---

## 🎯 PASO 5: Configurar Variables de Entorno

1. Haz clic en tu servicio **backend** (no en PostgreSQL)
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"+ New Variable"** y agrega las siguientes:

### Variables OBLIGATORIAS:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/railway
```
**IMPORTANTE**: Railway ya creó esta variable automáticamente cuando agregaste PostgreSQL. Si no, cópiala del servicio PostgreSQL.

```env
PORT=5000
```

```env
NODE_ENV=production
```

```env
JWT_SECRET=GENERA_UNO_NUEVO_AQUI
```
**⚠️ IMPORTANTE**: Genera un secreto seguro. Usa el comando de abajo.

```env
JWT_EXPIRES_IN=24h
```

```env
JWT_REFRESH_SECRET=GENERA_OTRO_DIFERENTE_AQUI
```
**⚠️ IMPORTANTE**: Debe ser diferente del JWT_SECRET.

```env
JWT_REFRESH_EXPIRES_IN=7d
```

```env
FRONTEND_URL=https://asistem-san-martin.vercel.app
```
**⚠️ Reemplaza con tu URL real de Vercel**

```env
ALLOWED_ORIGINS=https://asistem-san-martin.vercel.app,https://asistem-san-martin-git-main-frank032004.vercel.app
```
**⚠️ Incluye todas las URLs de Vercel (producción y preview)**

### Variables OPCIONALES (pero recomendadas):

```env
GPS_PRECISION_METERS=50
```

```env
GPS_TIMEOUT_SECONDS=30
```

```env
RATE_LIMIT_WINDOW_MS=900000
```

```env
RATE_LIMIT_MAX_REQUESTS=100
```

```env
LOG_LEVEL=info
```

```env
DEBUG=false
```

```env
ENABLE_SWAGGER=false
```

---

## 🔐 Generar Secretos JWT Seguros

Ejecuta esto en PowerShell (en tu computadora local):

```powershell
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET:', require('crypto').randomBytes(64).toString('hex'))"
```

Copia los valores generados y úsalos en Railway.

---

## 🎯 PASO 6: Ejecutar Migraciones de Prisma

### Opción A: Agregar Script de Build (RECOMENDADO)

Railway ejecutará automáticamente las migraciones si agregas esto al build command:

1. Ve a **Settings** → **Deploy**
2. **Build Command**: 
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Opción B: Ejecutar Manualmente (si es necesario)

1. En Railway, ve a tu servicio backend
2. Haz clic en **"Deployments"**
3. Espera a que termine el deploy
4. Ve a la pestaña **"Settings"** → **"Deploy Logs"**
5. Verifica que las migraciones se ejecutaron correctamente

---

## 🎯 PASO 7: Verificar el Despliegue

### 7.1. Obtener la URL del Backend
1. En Railway, haz clic en tu servicio backend
2. Ve a **"Settings"**
3. Busca la sección **"Domains"**
4. Haz clic en **"Generate Domain"**
5. Railway generará una URL como: `https://asistem-backend-production-XXXX.up.railway.app`

### 7.2. Probar el Backend
Abre en tu navegador o Postman:
```
https://tu-backend-url.railway.app/api/health
```

Deberías ver una respuesta JSON como:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T..."
}
```

---

## 🎯 PASO 8: Conectar Frontend con Backend

### 8.1. Actualizar Variables en Vercel
1. Ve a tu proyecto en Vercel: https://vercel.com/frank032004s-projects/asistem-san-martin
2. Ve a **Settings** → **Environment Variables**
3. Encuentra `NEXT_PUBLIC_API_URL`
4. Haz clic en el botón de editar (lápiz)
5. Cambia el valor de `http://localhost:5000/api` a:
```
https://tu-backend-url.railway.app/api
```
6. Guarda los cambios

### 8.2. Redeploy del Frontend
1. Ve a la pestaña **"Deployments"** en Vercel
2. Encuentra el último deployment
3. Haz clic en los tres puntos (⋯)
4. Selecciona **"Redeploy"**
5. Confirma el redeploy

---

## 🎯 PASO 9: Poblar la Base de Datos (IMPORTANTE)

Necesitas crear el usuario administrador y datos iniciales:

### Opción A: Usando Railway CLI (RECOMENDADO)

1. Instala Railway CLI:
```powershell
npm install -g @railway/cli
```

2. Login en Railway:
```powershell
railway login
```

3. Conecta al proyecto:
```powershell
railway link
```

4. Ejecuta el seed:
```powershell
railway run npm run prisma:seed
```

### Opción B: Ejecutar SQL directamente

1. En Railway, ve al servicio **PostgreSQL**
2. Haz clic en **"Data"** o **"Query"**
3. Copia y pega el contenido del archivo: `database/datos_prueba_completos.sql`
4. Ejecuta el SQL

---

## 🎯 PASO 10: Verificación Final

### ✅ Checklist de Verificación:

- [ ] Backend desplegado en Railway
- [ ] PostgreSQL funcionando
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas
- [ ] Dominio generado
- [ ] Frontend actualizado con nueva API URL
- [ ] Frontend redeployado
- [ ] Datos iniciales cargados (seed)
- [ ] Login funciona en producción

### Prueba Completa:
1. Abre: `https://asistem-san-martin.vercel.app/login`
2. Ingresa:
   - Email: `admin@sanmartin.edu.pe`
   - Password: `admin123`
3. Deberías poder iniciar sesión correctamente

---

## 🔧 Troubleshooting (Solución de Problemas)

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo en Railway
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que el servicio backend tenga acceso al servicio PostgreSQL

### Error: "CORS policy error"
- Verifica `ALLOWED_ORIGINS` incluya todas las URLs de Vercel
- Verifica `FRONTEND_URL` esté correctamente configurada

### Error: "Invalid JWT"
- Verifica que `JWT_SECRET` y `JWT_REFRESH_SECRET` estén configurados
- Asegúrate de que sean strings largos y seguros

### Error 500 en el backend
- Ve a Railway → Backend Service → Logs
- Revisa los logs para ver el error específico
- Verifica que todas las variables de entorno estén configuradas

### Las migraciones no se ejecutan
- Verifica el Build Command en Railway
- Revisa los logs de deploy
- Ejecuta manualmente: `railway run npx prisma migrate deploy`

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real:
1. Ve a Railway → Tu servicio backend
2. Haz clic en **"Deployments"**
3. Selecciona el deployment activo
4. Los logs aparecerán automáticamente

### Métricas:
1. Railway muestra CPU, Memoria y Network usage
2. Monitorea el rendimiento en el Dashboard

---

## 💰 Costos de Railway

### Plan Hobby (Gratuito):
- $5 de crédito gratis por mes
- Suficiente para proyectos pequeños/medianos
- PostgreSQL incluido

### Si necesitas más:
- Plan Developer: $20/mes
- Créditos adicionales disponibles

---

## 🎯 Resumen de URLs

Después de completar todos los pasos:

```
Frontend (Vercel):
https://asistem-san-martin.vercel.app

Backend (Railway):
https://asistem-backend-production-XXXX.up.railway.app

API Endpoint:
https://asistem-backend-production-XXXX.up.railway.app/api

PostgreSQL:
Manejado internamente por Railway
```

---

## 🎉 ¡Listo!

Si completaste todos los pasos, tu aplicación completa debería estar funcionando en producción.

**¿Necesitas ayuda?** Revisa la sección de Troubleshooting o contacta al soporte de Railway.

---

**Documentación creada para**: Sistema ASISTEM San Martín
**Fecha**: 18 de Noviembre, 2025
**Versión**: 1.0.0
