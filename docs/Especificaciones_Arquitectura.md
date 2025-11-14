# ESPECIFICACIONES TÉCNICAS - ARQUITECTURA DE LA APLICACIÓN
## INSTITUTO SAN MARTÍN - SISTEMA DE GESTIÓN ACADÉMICA

### 🏛️ INFORMACIÓN DEL PROYECTO

- **Sistema:** Gestión Académica y Control de Asistencias GPS
- **Arquitectura:** 3 Capas + Servicios Externos
- **Patrón Arquitectónico:** Cliente-Servidor + API REST
- **Deployment:** Monolítico con separación de responsabilidades
- **Escalabilidad:** Horizontal y Vertical

---

## 🏗️ VISTA DE ARQUITECTURA DEL SISTEMA

### PATRÓN ARQUITECTÓNICO: **ARQUITECTURA DE 3 CAPAS**

El sistema implementa una arquitectura de 3 capas que separa la presentación, lógica de negocio y acceso a datos, facilitando el mantenimiento, escalabilidad y deployment independiente.

---

## 📊 DESCRIPCIÓN DE CAPAS ARQUITECTÓNICAS

### 👤 **CAPA 1: DISPOSITIVOS CLIENTE**
**Responsabilidad:** Interfaz de usuario y experiencia del usuario

#### **Componentes de Cliente:**

**🌐 Navegadores Web**
- **Soporte:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Tecnologías:** HTML5, CSS3, JavaScript ES2022
- **APIs Utilizadas:**
  - Navigator.geolocation (GPS)
  - LocalStorage/SessionStorage
  - Service Workers (PWA)
  - Web APIs modernas
- **Características:**
  - Responsive Design (Mobile-first)
  - Progressive Web App (PWA)
  - Offline capabilities (básico)
  - Push notifications (futuro)

**📱 Dispositivos Móviles**
- **Plataformas:** Android Chrome, iOS Safari
- **Funcionalidades:**
  - Geolocalización de alta precisión
  - Instalación como app nativa (PWA)
  - Notificaciones push
  - Cámara para documentos (futuro)

### 🌐 **CAPA 2: SERVIDOR WEB (Puerto 3000)**
**Responsabilidad:** Renderizado y servicio de la aplicación web

#### **Componentes del Servidor Web:**

**⚡ Next.js 15.5 Application**
- **Framework:** Next.js 15.5 + React 19 + TypeScript
- **Características:**
  - Server Side Rendering (SSR)
  - Static Site Generation (SSG)
  - Client Side Rendering (CSR)
  - Incremental Static Regeneration (ISR)
- **Optimizaciones:**
  - Turbopack bundler (más rápido que Webpack)
  - Automatic code splitting
  - Image optimization
  - Font optimization

**📦 Static Assets**
- **Contenido:** CSS/JS bundles, imágenes, fonts, manifest PWA
- **Optimización:** Compresión gzip/brotli, cache headers
- **CDN Ready:** Preparado para integración con CDN

**🛡️ Web Middleware**
- **Autenticación:** Verificación de tokens JWT
- **Route Guards:** Protección de rutas por roles
- **Error Boundaries:** Manejo de errores React
- **Security Headers:** CSP, HSTS, X-Frame-Options

### 🔧 **CAPA 3: SERVIDOR API (Puerto 5000)**
**Responsabilidad:** Lógica de negocio y servicios del sistema

#### **Componentes del Servidor API:**

**🚀 Express.js Server**
- **Runtime:** Node.js 18+ con TypeScript
- **Arquitectura:** MVC + Middleware Pipeline
- **Características:**
  - Async/await por defecto
  - Error handling centralizado
  - Request logging
  - Performance monitoring

**📍 API Routes**
- **Endpoints Principales:**
  ```
  /api/auth/*          - Autenticación y autorización
  /api/usuarios/*      - Gestión de usuarios
  /api/docentes/*      - CRUD de docentes
  /api/asistencias/*   - Control GPS de asistencias
  /api/reportes/*      - Generación PDF/Excel
  /api/admin/*         - Funciones administrativas
  /api/health          - Health check del sistema
  ```

**🧠 Business Logic**
- **Controllers:** Lógica de negocio por módulo
- **Services:** Servicios reutilizables
- **Validators:** Validación de datos con Zod
- **GPS Calculations:** Algoritmos geoespaciales
- **Report Generators:** PDF (jsPDF) y Excel (ExcelJS)

**🔐 Security Layer**
- **JWT Authentication:** RS256 con claves asimétricas
- **Authorization:** Role-Based Access Control (RBAC)
- **Rate Limiting:** 100 requests/min por IP
- **Input Validation:** Sanitización completa
- **CORS:** Configuración restrictiva
- **Headers:** Helmet.js para security headers

### 💾 **CAPA 4: SERVIDOR DE BASE DE DATOS (Puerto 5432)**
**Responsabilidad:** Almacenamiento y persistencia de datos

#### **Componentes de Base de Datos:**

**🐘 PostgreSQL 17**
- **Características:**
  - ACID compliance completo
  - Connection pooling (20 conexiones concurrentes)
  - Transacciones distribuidas
  - Backup automático diario
- **Configuración de Rendimiento:**
  - shared_buffers: 256MB
  - work_mem: 4MB
  - maintenance_work_mem: 64MB
  - effective_cache_size: 1GB

**🗺️ PostGIS Extension**
- **Versión:** PostGIS 3.4
- **Funcionalidades Geoespaciales:**
  - Tipos de datos geométricos
  - Índices espaciales R-tree
  - Cálculo de distancias (Haversine)
  - Funciones de proximidad
  - Geocoding/Reverse geocoding

**📋 Database Schema**
- **17 Tablas Relacionales:**
  - Entidades principales: Usuario, Docente, Asistencia
  - Tablas de configuración: Role, Area, UbicacionPermitida
  - Tablas de gestión: PlanillaHoras, Evaluacion, Reportes
  - Tablas de auditoría: LogActividad, Sesiones
- **Índices Optimizados:**
  - B-tree para búsquedas textuales
  - GIN para arrays y JSON
  - Espaciales para coordenadas GPS
- **Constraints y Triggers:**
  - Foreign key constraints
  - Check constraints para validaciones
  - Triggers para auditoría automática

---

## ☁️ SERVICIOS EXTERNOS

### **🌍 Geolocation API**
- **Proveedor:** Navigator.geolocation (W3C Standard)
- **Funcionalidad:** Obtención de coordenadas GPS del dispositivo
- **Precisión:** 5-10 metros en condiciones óptimas
- **Fallbacks:** 
  - Network location (WiFi/Cell towers)
  - IP geolocation como último recurso

### **📧 Email Service (Futuro)**
- **Protocolo:** SMTP/SendGrid/AWS SES
- **Uso:** Notificaciones, reportes, recuperación de contraseñas
- **Plantillas:** HTML templates con branding institucional

### **📁 File Storage (Futuro)**
- **Local:** Sistema de archivos local para desarrollo
- **Cloud:** AWS S3 / Google Cloud Storage para producción
- **Uso:** Almacenamiento de reportes, documentos, fotos de perfil

---

## 🔄 FLUJOS ARQUITECTÓNICOS PRINCIPALES

### **Flujo de Autenticación:**
```
1. Cliente → Navegador → Next.js App
2. Next.js → API Gateway → /api/auth/login
3. API → Security Layer → Validación credenciales
4. Security → PostgreSQL → Verificación usuario
5. PostgreSQL → API → Datos usuario + JWT token
6. API → Cliente → Token + información sesión
7. Cliente → LocalStorage → Persistencia token
```

### **Flujo de Registro de Asistencia:**
```
1. Cliente → Geolocation API → Coordenadas GPS
2. Cliente → Next.js → Datos + coordenadas
3. Next.js → API → /api/asistencias/entrada
4. API → Security → Validación JWT + permisos
5. API → Business Logic → Validación GPS + horarios
6. Business Logic → PostGIS → Cálculo distancias
7. PostGIS → PostgreSQL → Inserción asistencia
8. PostgreSQL → API → Confirmación registro
9. API → Cliente → Respuesta + estado actualizado
```

### **Flujo de Generación de Reportes:**
```
1. Cliente → Dashboard Admin → Filtros reporte
2. Dashboard → API → /api/reportes/generar
3. API → Business Logic → Procesamiento filtros
4. Business Logic → PostgreSQL → Consultas complejas
5. PostgreSQL → Business Logic → Datos agregados
6. Business Logic → Report Generator → PDF/Excel
7. Report Generator → File System → Archivo temporal
8. API → Cliente → Stream de descarga
```

---

## ⚡ ESPECIFICACIONES DE RENDIMIENTO

### **Métricas de Performance:**
- **API Response Time:** <100ms promedio, <500ms p99
- **Database Query Time:** <50ms promedio, <200ms p99
- **Frontend Load Time:** <3 segundos initial load
- **Time to Interactive (TTI):** <5 segundos
- **First Contentful Paint (FCP):** <2 segundos

### **Capacidades de Concurrencia:**
- **Usuarios Simultáneos:** 50+ usuarios activos
- **Requests por Segundo:** 100 RPS sostenido
- **Database Connections:** Pool de 20 conexiones
- **Memory Usage:** 
  - Frontend: ~300MB en cliente
  - Backend: ~150MB en servidor
  - Database: ~512MB allocated

### **Disponibilidad y Confiabilidad:**
- **Uptime Target:** 99.9% (8.76 horas downtime/año)
- **Recovery Time Objective (RTO):** <30 minutos
- **Recovery Point Objective (RPO):** <1 hora
- **Backup Strategy:** 
  - Diario: Full backup PostgreSQL
  - Semanal: Backup completo del sistema
  - Mensual: Archivo a almacenamiento externo

---

## 🔒 ARQUITECTURA DE SEGURIDAD

### **Capas de Seguridad:**

**1. Network Level:**
- Firewall configurado (puertos específicos)
- VPN access para administración (futuro)
- DDoS protection (cloudflare/nginx)

**2. Application Level:**
- JWT con expiración configurable
- Rate limiting por IP y usuario
- Input sanitization completa
- SQL injection prevention (ORM)

**3. Data Level:**
- Encriptación de passwords (bcrypt)
- Datos sensibles encriptados (AES-256)
- Database access controls
- Audit logging completo

### **Compliance y Auditoría:**
- Logs de todas las operaciones críticas
- Trazabilidad completa de cambios
- Retention policy de 2 años
- GDPR compliance básico (futuro)

---

## 📈 ESTRATEGIA DE ESCALABILIDAD

### **Escalabilidad Horizontal:**
- **Load Balancing:** Nginx/HAProxy para múltiples instancias
- **Database Clustering:** PostgreSQL streaming replication
- **CDN Integration:** CloudFlare/AWS CloudFront
- **Microservices:** Separación por dominio de negocio

### **Escalabilidad Vertical:**
- **Server Resources:** CPU/RAM scaling
- **Database Tuning:** Query optimization, indexing
- **Caching Layer:** Redis para sesiones y queries frecuentes
- **Connection Pooling:** PgBouncer para database connections

### **Monitoreo y Observabilidad:**
- **Application Metrics:** Prometheus + Grafana
- **Logging:** Structured logging con Winston
- **Health Checks:** Endpoint /health con métricas
- **Alerting:** Notificaciones automáticas de errores

---

## 🚀 DEPLOYMENT Y DEVOPS

### **Entornos:**
- **Desarrollo:** Local con Docker Compose
- **Testing:** Staging environment
- **Producción:** VPS/Cloud con alta disponibilidad

### **CI/CD Pipeline (Futuro):**
- **Source Control:** Git + GitHub/GitLab
- **Build:** Automated testing + build
- **Deploy:** Blue-green deployment
- **Rollback:** Automated rollback capability

### **Containerización (Futuro):**
- **Frontend:** Docker container con Nginx
- **Backend:** Node.js container
- **Database:** PostgreSQL with persistent volumes
- **Orchestration:** Docker Compose / Kubernetes

---

*Documento de Arquitectura de la Aplicación - Instituto San Martín - Octubre 2024*