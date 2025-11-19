# 🚀 Configuración de Vercel para ASISTEM San Martín

## 📋 Checklist de Configuración

### 1️⃣ Root Directory
```
frontend
```
**⚠️ IMPORTANTE**: Haz clic en "Edit" y cambia de `./` a `frontend`

---

### 2️⃣ Build and Output Settings

Haz clic en "Build and Output Settings" para expandir y configura:

- **Framework Preset**: Next.js (Vercel debería detectarlo automáticamente)
- **Build Command**: `npm run build` (o dejar default)
- **Output Directory**: `.next` (default de Next.js)
- **Install Command**: `npm install` (o dejar default)

---

### 3️⃣ Environment Variables

Haz clic en "Environment Variables" para expandir y agrega estas variables:

#### Variables Obligatorias:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.com/api
```
**Nota**: Reemplaza con la URL real de tu backend cuando lo tengas desplegado

```env
NEXT_PUBLIC_APP_NAME=ASISTEM San Martín
```

```env
NEXT_PUBLIC_APP_VERSION=1.0.0
```

```env
NODE_ENV=production
```

#### Variables Opcionales (Recomendadas):

```env
NEXT_PUBLIC_PWA_ENABLED=true
```

```env
NEXT_TELEMETRY_DISABLED=1
```

---

## 🎯 Cómo Agregar Variables de Entorno

Para cada variable:

1. Haz clic en el botón "Add" o "Add Another"
2. En el campo "Name" escribe el nombre de la variable (ej: `NEXT_PUBLIC_API_URL`)
3. En el campo "Value" escribe el valor (ej: `https://tu-backend.com/api`)
4. Selecciona los ambientes: **Production**, **Preview**, **Development** (todos marcados)
5. Haz clic en "Add" para confirmar
6. Repite para cada variable

---

## ⚙️ Configuración por Pasos

### Paso 1: Root Directory
1. Busca "Root Directory" en la pantalla
2. Haz clic en el botón "Edit" a la derecha
3. Cambia `./` por `frontend`
4. Confirma el cambio

### Paso 2: Build and Output Settings
1. Haz clic en la flecha "▶ Build and Output Settings" para expandir
2. Verifica o cambia el Framework Preset a "Next.js"
3. Deja los comandos por defecto o personalízalos si es necesario

### Paso 3: Environment Variables
1. Haz clic en la flecha "▶ Environment Variables" para expandir
2. Agrega cada variable una por una siguiendo el formato de arriba
3. Asegúrate de marcar todos los ambientes (Production, Preview, Development)

### Paso 4: Deploy
1. Una vez configurado todo, haz clic en el botón "Deploy" al final de la página
2. Espera a que Vercel clone el repositorio y ejecute el build
3. El primer despliegue puede tardar 2-5 minutos

---

## 📝 Notas Importantes

### Sobre el Backend:
- Por ahora, el frontend se desplegará sin un backend funcional
- Necesitarás desplegar el backend por separado (puede ser en Railway, Render, o Vercel con plan Pro)
- Una vez tengas la URL del backend, actualiza la variable `NEXT_PUBLIC_API_URL`

### URLs de Ejemplo:
- Frontend desplegado: `https://asistem-san-martin.vercel.app`
- Backend (a desplegar): `https://asistem-backend.railway.app` (o similar)

### Después del Primer Deploy:
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Actualiza `NEXT_PUBLIC_API_URL` con la URL real de tu backend
4. Redeploy la aplicación

---

## 🔄 Próximos Pasos (Después del Deploy)

1. ✅ Verificar que el deploy fue exitoso
2. ✅ Visitar la URL de producción
3. ⚠️ Desplegar el backend (PostgreSQL + Node.js)
4. ⚠️ Actualizar `NEXT_PUBLIC_API_URL` en Vercel
5. ✅ Hacer redeploy del frontend
6. ✅ Probar la aplicación completa

---

## 🆘 Troubleshooting

### Si el build falla:
1. Revisa los logs de Vercel
2. Verifica que el Root Directory sea `frontend`
3. Asegúrate de que el package.json esté en la carpeta frontend
4. Verifica que todas las dependencias estén instaladas

### Si la aplicación no carga:
1. Verifica las variables de entorno en Vercel Dashboard
2. Asegúrate de que NEXT_PUBLIC_API_URL esté configurada
3. Revisa la consola del navegador para errores

---

## 📞 Soporte

Si tienes problemas, revisa:
- Los logs de deployment en Vercel
- La documentación de Next.js en Vercel
- Los archivos README.md en tu proyecto

