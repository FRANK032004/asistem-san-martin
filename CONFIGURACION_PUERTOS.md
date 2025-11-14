# 🔌 CONFIGURACIÓN DE PUERTOS DEL SISTEMA

## 📊 Puertos Configurados

| Servicio | Puerto | URL | Estado |
|----------|--------|-----|--------|
| **Backend** | **5000** | http://localhost:5000 | ✅ Configurado |
| **Frontend** | **3000** | http://localhost:3000 | ✅ Configurado |
| **PostgreSQL** | 5432 | localhost:5432 | ✅ Configurado |

---

## 🎯 Backend - Puerto 5000

### Archivos configurados:

#### 1. `backend/.env`
```properties
PORT=5000
```

#### 2. `backend/ecosystem.config.js`
```javascript
env: {
  NODE_ENV: 'development',
  PORT: 5000,
}
```

#### 3. `backend/src/index.ts`
```typescript
const PORT = process.env.PORT || 5000;
```

### Endpoints disponibles:
- **Health check**: http://localhost:5000/health
- **API info**: http://localhost:5000/api
- **Auth**: http://localhost:5000/api/auth
- **Asistencias**: http://localhost:5000/api/asistencias
- **Docentes**: http://localhost:5000/api/docente
- **Admin**: http://localhost:5000/api/admin

---

## 🎨 Frontend - Puerto 3000

### Archivos configurados:

#### 1. `frontend/.env.local`
```bash
# Puerto del frontend
PORT=3000

# URL del backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### 2. `frontend/package.json`
```json
"scripts": {
  "dev": "next dev --turbopack -p 3000",
  "start": "next start -p 3000"
}
```

#### 3. `frontend/next.config.ts`
```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:5000/api/:path*',
    },
  ];
}
```

### URL de acceso:
- **Aplicación**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Admin**: http://localhost:3000/admin
- **Docente**: http://localhost:3000/docente

---

## 🚀 Cómo iniciar el sistema

### Opción 1: Script automático (RECOMENDADO)
```bash
.\iniciar_sistema_keep_alive.bat
```

Este script inicia:
1. ✅ Backend en puerto **5000** con keep-alive
2. ✅ Frontend en puerto **3000** con keep-alive
3. ✅ Ambos con protección anti-timeout

### Opción 2: Manual

#### Iniciar Backend (Puerto 5000)
```bash
cd backend
npm run build
npm run dev
```

#### Iniciar Frontend (Puerto 3000)
```bash
cd frontend
npm run dev
```

### Opción 3: Scripts individuales

#### Solo Backend
```bash
.\reiniciar_backend_mejorado.bat
```

#### Solo Frontend
```bash
.\reiniciar_frontend_mejorado.bat
```

---

## 🧪 Verificar que están ejecutándose

### Verificar Backend (Puerto 5000)
```powershell
# Opción 1: curl
curl http://localhost:5000/health

# Opción 2: netstat
netstat -ano | findstr :5000
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "message": "Sistema de Asistencia - Instituto San Martín",
  "version": "1.0.0",
  "timestamp": "2025-10-28T22:00:00.000Z",
  "environment": "development"
}
```

### Verificar Frontend (Puerto 3000)
```powershell
# Opción 1: Abrir en navegador
start http://localhost:3000

# Opción 2: netstat
netstat -ano | findstr :3000
```

**Debe abrir la página de login**

---

## 🔧 Cambiar puertos (si fuera necesario)

### Cambiar puerto del Backend

1. Editar `backend/.env`:
```properties
PORT=NUEVO_PUERTO
```

2. Editar `backend/ecosystem.config.js`:
```javascript
env: {
  PORT: NUEVO_PUERTO,
}
```

3. **IMPORTANTE**: Actualizar frontend `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:NUEVO_PUERTO/api
```

### Cambiar puerto del Frontend

1. Editar `frontend/.env.local`:
```bash
PORT=NUEVO_PUERTO
```

2. Editar `frontend/package.json`:
```json
"dev": "next dev --turbopack -p NUEVO_PUERTO"
```

---

## ⚠️ Problemas comunes

### Puerto 5000 ya en uso
```bash
# Ver qué proceso usa el puerto 5000
netstat -ano | findstr :5000

# Matar el proceso (reemplaza PID con el número que aparece)
taskkill /PID [PID] /F
```

### Puerto 3000 ya en uso
```bash
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# Matar el proceso
taskkill /PID [PID] /F
```

### Frontend no puede conectar con Backend
1. ✅ Verificar que backend esté ejecutándose en puerto 5000
2. ✅ Verificar URL en `frontend/.env.local`: debe ser `http://localhost:5000/api`
3. ✅ Verificar CORS en backend (debe permitir `http://localhost:3000`)
4. ✅ Limpiar cache del frontend: eliminar carpeta `.next`

---

## 📝 Logs importantes

### Backend (Puerto 5000):
```
✅ Conectado a PostgreSQL exitosamente
✅ Keep-alive iniciado (ping cada 5 min)
✅ Timeouts configurados: keepAlive=65s, headers=66s, timeout=120s
🚀 Servidor iniciado en puerto 5000
🏓 Keep-alive ping a PostgreSQL exitoso
```

### Frontend (Puerto 3000):
```
▲ Next.js 15.5.2 (Turbopack)
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 2.3s
✅ Keep-alive iniciado (frontend + backend check cada 5 min)
```

---

## 🎯 Resumen

| ✅ | Configuración | Valor |
|----|---------------|-------|
| ✅ | Backend puerto | **5000** |
| ✅ | Frontend puerto | **3000** |
| ✅ | API URL | http://localhost:5000/api |
| ✅ | Frontend URL | http://localhost:3000 |
| ✅ | Keep-alive backend | Activo (ping cada 5 min) |
| ✅ | Keep-alive frontend | Activo (ping cada 5 min) |
| ✅ | CORS | Frontend ↔️ Backend configurado |
| ✅ | PostgreSQL | Puerto 5432 |

---

## 📚 Archivos de configuración

### Backend (Puerto 5000)
- ✅ `backend/.env` → `PORT=5000`
- ✅ `backend/ecosystem.config.js` → `PORT: 5000`
- ✅ `backend/src/index.ts` → Keep-alive + timeouts
- ✅ `backend/src/utils/database.ts` → Keep-alive PostgreSQL

### Frontend (Puerto 3000)
- ✅ `frontend/.env.local` → `PORT=3000` + `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- ✅ `frontend/package.json` → `"dev": "next dev --turbopack -p 3000"`
- ✅ `frontend/next.config.ts` → Proxy a puerto 5000
- ✅ `frontend/src/lib/keep-alive.ts` → Keep-alive del frontend
- ✅ `frontend/src/app/layout.tsx` → KeepAliveProvider integrado

---

**Fecha**: 28 de Octubre 2025  
**Versión**: 2.0.0  
**Status**: ✅ Configurado y documentado

---

## 🚀 Inicio rápido

```bash
# 1. Iniciar todo el sistema
.\iniciar_sistema_keep_alive.bat

# 2. Abrir en navegador
start http://localhost:3000

# 3. Verificar backend
curl http://localhost:5000/health
```

**¡LISTO! El sistema está ejecutándose en los puertos correctos.** 🎉
