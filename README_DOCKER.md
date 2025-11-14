# 🐳 GUÍA DE DOCKER Y DESPLIEGUE
## Sistema de Asistencias - Instituto San Martín

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos Previos](#-requisitos-previos)
2. [Quick Start](#-quick-start)
3. [Docker Compose](#-docker-compose)
4. [Comandos Útiles](#-comandos-útiles)
5. [Configuración](#-configuración)
6. [Troubleshooting](#-troubleshooting)
7. [Producción](#-producción)

---

## 🎯 REQUISITOS PREVIOS

### Software Necesario

```bash
# Verificar instalaciones
docker --version          # Docker 20.10+
docker-compose --version  # Docker Compose 2.0+
node --version           # Node.js 18+
npm --version            # NPM 9+
```

### Instalar Docker Desktop (Windows)

1. Descargar: https://www.docker.com/products/docker-desktop
2. Instalar y reiniciar
3. Habilitar WSL 2 (recomendado)
4. Iniciar Docker Desktop

---

## 🚀 QUICK START

### Opción 1: Con Docker Compose (Recomendado)

```bash
# 1. Clonar variables de entorno
cp .env.example .env

# 2. Configurar variables (editar .env)
# Mínimo cambiar:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - DB_PASSWORD

# 3. Iniciar stack completo
docker-compose up -d

# 4. Ver logs
docker-compose logs -f

# 5. Acceder a la aplicación
# Backend:  http://localhost:5000
# Frontend: http://localhost:3000
# Postgres: localhost:5432
```

### Opción 2: Solo Backend

```bash
# Build de imagen
cd backend
docker build -t sanmartin-backend .

# Ejecutar container
docker run -d \
  --name sanmartin-backend \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your_secret" \
  sanmartin-backend
```

---

## 🐋 DOCKER COMPOSE

### Arquitectura del Stack

```
┌─────────────────────────────────────────┐
│          NGINX (Port 80/443)            │
│       Reverse Proxy + SSL               │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼──────┐   ┌─────▼──────┐
│ Frontend │   │  Backend   │
│ Next.js  │   │  Node.js   │
│ Port 3000│   │  Port 5000 │
└──────────┘   └──────┬─────┘
                      │
            ┌─────────┴──────────┐
            │                    │
      ┌─────▼──────┐      ┌─────▼──────┐
      │ PostgreSQL │      │   Redis    │
      │  + PostGIS │      │   Cache    │
      │  Port 5432 │      │ Port 6379  │
      └────────────┘      └────────────┘
```

### Servicios Incluidos

| Servicio | Puerto | Imagen | Descripción |
|----------|--------|--------|-------------|
| **postgres** | 5432 | postgis/postgis:17-3.5 | Base de datos + GPS |
| **backend** | 5000 | node:18-alpine | API REST |
| **frontend** | 3000 | node:18-alpine | Next.js UI |
| **redis** | 6379 | redis:7-alpine | Cache (opcional) |
| **nginx** | 80/443 | nginx:alpine | Proxy (producción) |

---

## 🛠️ COMANDOS ÚTILES

### Gestión de Containers

```bash
# Iniciar todos los servicios
docker-compose up -d

# Iniciar solo backend + postgres
docker-compose up -d postgres backend

# Detener todos
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker-compose down -v

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart backend

# Ver estado de servicios
docker-compose ps

# Estadísticas de recursos
docker stats
```

### Acceso a Containers

```bash
# Shell en backend
docker-compose exec backend sh

# Shell en postgres
docker-compose exec postgres psql -U postgres -d instituto_san_martin

# Ver estructura de BD
docker-compose exec postgres psql -U postgres -d instituto_san_martin -c '\dt'

# Ejecutar comando en backend
docker-compose exec backend node -v
```

### Base de Datos

```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Generar Prisma Client
docker-compose exec backend npx prisma generate

# Backup de BD
docker-compose exec postgres pg_dump -U postgres instituto_san_martin > backup.sql

# Restaurar backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres instituto_san_martin

# Logs de PostgreSQL
docker-compose logs postgres
```

### Build y Rebuild

```bash
# Rebuild de imágenes
docker-compose build

# Rebuild sin cache
docker-compose build --no-cache

# Rebuild de un servicio específico
docker-compose build backend

# Pull de imágenes actualizadas
docker-compose pull
```

### Limpieza

```bash
# Limpiar containers detenidos
docker container prune

# Limpiar imágenes no usadas
docker image prune

# Limpiar volúmenes no usados
docker volume prune

# Limpiar todo (⚠️ cuidado)
docker system prune -a --volumes

# Ver espacio usado
docker system df
```

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno (.env)

```env
# Database
DB_PASSWORD=secure_password_123
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/instituto_san_martin

# JWT (genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
JWT_REFRESH_SECRET=q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6

# App
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.com
ALLOWED_ORIGINS=https://tu-dominio.com

# Redis
REDIS_PASSWORD=redis_secure_pass

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

### Perfiles de Docker Compose

```bash
# Solo servicios básicos (default)
docker-compose up

# Con NGINX para producción
docker-compose --profile production up

# Con Redis para cache
docker-compose up postgres backend redis
```

### Health Checks

Todos los servicios incluyen health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

Verificar salud:
```bash
docker-compose ps
# Verás: Up (healthy) o Up (unhealthy)
```

---

## 🔧 TROUBLESHOOTING

### Problema: Container no inicia

```bash
# Ver logs detallados
docker-compose logs backend

# Ver últimas 100 líneas
docker-compose logs --tail=100 backend

# Verificar configuración
docker-compose config

# Verificar network
docker network ls
docker network inspect sanmartin-network
```

### Problema: No puede conectar a PostgreSQL

```bash
# Verificar que Postgres está corriendo
docker-compose ps postgres

# Ver logs de Postgres
docker-compose logs postgres

# Test de conexión
docker-compose exec postgres pg_isready -U postgres

# Verificar red
docker-compose exec backend ping postgres
```

### Problema: Frontend no conecta con Backend

```bash
# Verificar variable NEXT_PUBLIC_API_URL
docker-compose exec frontend env | grep API_URL

# Test desde frontend
docker-compose exec frontend wget -O- http://backend:5000/health

# Verificar CORS en backend
docker-compose logs backend | grep CORS
```

### Problema: Puerto ya en uso

```bash
# Ver qué está usando el puerto
netstat -ano | findstr :5000

# Cambiar puerto en docker-compose.yml
ports:
  - "5001:5000"  # Usar 5001 externamente
```

### Problema: Disco lleno

```bash
# Ver espacio usado
docker system df

# Limpiar
docker system prune -a
docker volume prune

# Verificar volúmenes grandes
docker volume ls -q | xargs docker volume inspect | grep -A 5 Mountpoint
```

---

## 🚀 PRODUCCIÓN

### Checklist de Despliegue

- [ ] Variables de entorno configuradas (JWT_SECRET, passwords)
- [ ] PostgreSQL con password segura
- [ ] HTTPS habilitado (certificado SSL)
- [ ] Firewall configurado (solo puertos 80/443)
- [ ] Backup automático de BD
- [ ] Monitoreo con Sentry
- [ ] Logs centralizados
- [ ] Health checks configurados
- [ ] Docker en modo swarm o Kubernetes

### Configurar HTTPS con Let's Encrypt

```bash
# 1. Instalar certbot
sudo apt-get install certbot

# 2. Obtener certificado
sudo certbot certonly --standalone -d tu-dominio.com

# 3. Copiar certificados
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem nginx/ssl/

# 4. Iniciar con perfil production
docker-compose --profile production up -d
```

### Monitoreo

```bash
# Ver recursos en tiempo real
docker stats

# Exportar métricas (Prometheus)
curl http://localhost:5000/metrics

# Health check
curl http://localhost:5000/health

# Ver logs estructurados
docker-compose logs --since 1h backend | grep ERROR
```

### Backup Automático

```bash
# Crear script de backup (backup.sh)
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres instituto_san_martin | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Agregar a crontab (cada 4 horas)
0 */4 * * * /path/to/backup.sh
```

### Escalado

```bash
# Escalar backend horizontalmente
docker-compose up -d --scale backend=3

# Con load balancer
# Requiere configurar NGINX con upstream
```

---

## 📊 MÉTRICAS Y PERFORMANCE

### Optimizaciones de Imagen

```dockerfile
# Multi-stage build reduce tamaño
FROM node:18-alpine  # Alpine: ~150MB vs node:18: ~900MB

# .dockerignore reduce build time
# Resultado: 
# - Imagen backend: ~200MB
# - Imagen frontend: ~150MB
# - Build time: <2 min
```

### Recursos Recomendados

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## 🔗 RECURSOS ADICIONALES

- [Docker Docs](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)

---

**Última actualización**: 5 de noviembre de 2025  
**Versión**: 1.0.0
