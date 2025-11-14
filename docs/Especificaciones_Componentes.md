# ESPECIFICACIONES TÉCNICAS - DIAGRAMA DE COMPONENTES
## INSTITUTO SAN MARTÍN - SISTEMA DE GESTIÓN ACADÉMICA

### 🏛️ INFORMACIÓN DEL PROYECTO

- **Sistema:** Gestión Académica y Control de Asistencias
- **Arquitectura:** 4 Capas + Servicios Externos
- **Patrón:** MVC + Repository + Middleware Pipeline
- **Fecha:** Octubre 2024
- **Stack:** Full-Stack TypeScript con PostgreSQL

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### PATRÓN ARQUITECTÓNICO: **ARQUITECTURA POR CAPAS**

El sistema implementa una arquitectura por capas que separa claramente las responsabilidades y facilita el mantenimiento, escalabilidad y testing del software.

---

## 📊 DESCRIPCIÓN DE CAPAS

### 🎨 **CAPA 1: PRESENTACIÓN**
**Responsabilidad:** Interfaz de usuario y experiencia del usuario

#### **Componentes Principales:**

**🖥️ Interfaz Web (Next.js 15.5)**
- **Función:** Single Page Application principal
- **Tecnología:** React 19 + Next.js 15.5 + TypeScript
- **Características:**
  - Server Side Rendering (SSR)
  - Static Site Generation (SSG)
  - Optimización con Turbopack
  - React Server Components
- **Puertos de Entrada:** Login UI, Dashboard UI, Reports UI
- **Puertos de Salida:** API Calls hacia backend

**🎨 Componentes UI (Shadcn/ui + Tailwind)**
- **Función:** Biblioteca de componentes reutilizables
- **Tecnología:** Radix UI + Tailwind CSS + class-variance-authority
- **Componentes:** Botones, Formularios, Tablas, Modales, Cards
- **Características:**
  - Design System consistente
  - Componentes accesibles (a11y)
  - Responsive design
  - Tema claro/oscuro

**📊 Gestión de Estado (Zustand Store)**
- **Función:** Estado global de la aplicación
- **Tecnología:** Zustand + TypeScript
- **Stores:** Auth, Admin, Asistencia, Reportes
- **Características:**
  - Estado inmutable
  - Subscripciones reactivas
  - Persistencia local
  - DevTools integration

**🌐 Cliente HTTP (Axios)**
- **Función:** Comunicación con el backend
- **Tecnología:** Axios + interceptores personalizados
- **Características:**
  - Interceptores de request/response
  - Manejo automático de JWT
  - Retry automático
  - Timeout configurables

### ⚙️ **CAPA 2: SERVICIOS**
**Responsabilidad:** Lógica de negocio y orquestación de servicios

#### **Componentes Principales:**

**🚪 API Gateway (Express.js Router)**
- **Función:** Punto de entrada único para todas las solicitudes
- **Tecnología:** Express.js + TypeScript
- **Responsabilidades:**
  - Enrutamiento de solicitudes
  - Middleware pipeline
  - Control CORS
  - Rate limiting
  - Logging de requests
- **Rutas:** /api/auth, /api/docentes, /api/asistencias, /api/reportes

**🔐 Middleware de Autenticación (JWT Validator)**
- **Función:** Validación y autorización de usuarios
- **Tecnología:** jsonwebtoken + bcrypt
- **Características:**
  - Validación de tokens JWT
  - Verificación de roles y permisos
  - Renovación automática de tokens
  - Bloqueo por intentos fallidos
- **Algoritmo:** RS256 con claves asimétricas

**🎯 Controladores (Business Logic)**
- **Función:** Lógica de negocio del sistema
- **Patrón:** MVC Controller Pattern
- **Controladores:**
  - AuthController: Autenticación y autorización
  - DocenteController: Gestión de docentes
  - AsistenciaController: Control de asistencias
  - AdminController: Funciones administrativas
- **Responsabilidades:**
  - Validación de datos de entrada
  - Orquestación de servicios
  - Transformación de datos
  - Manejo de errores

**📍 Servicios GPS (Geolocation Validator)**
- **Función:** Validación de ubicación geográfica
- **Tecnología:** Algoritmos geoespaciales + PostGIS
- **Características:**
  - Cálculo de distancias (fórmula Haversine)
  - Validación de radio permitido (50m)
  - Geocoding y reverse geocoding
  - Detección de spoofing GPS

### 🗄️ **CAPA 3: ACCESO A DATOS**
**Responsabilidad:** Abstracción y acceso a datos

#### **Componentes Principales:**

**🔧 ORM Prisma (Database Abstraction)**
- **Función:** Abstracción de base de datos
- **Tecnología:** Prisma Client + TypeScript
- **Características:**
  - Type-safe database access
  - Auto-generated client
  - Connection pooling
  - Query optimization
  - Migrations automáticas

**📁 Repositorios (Data Access Layer)**
- **Función:** Patrón Repository para acceso a datos
- **Patrón:** Repository Pattern
- **Repositorios:**
  - UsuarioRepository
  - DocenteRepository
  - AsistenciaRepository
  - ReporteRepository
- **Beneficios:**
  - Abstracción de queries
  - Reutilización de código
  - Testing facilitado
  - Cambio de ORM transparente

**✅ Validaciones (Data Validation)**
- **Función:** Validación de integridad de datos
- **Tecnología:** Zod + express-validator
- **Tipos de validación:**
  - Esquemas de entrada (Input schemas)
  - Reglas de negocio
  - Constraints de base de datos
  - Sanitización de datos

### 💾 **CAPA 4: DATOS**
**Responsabilidad:** Almacenamiento y persistencia de datos

#### **Componentes Principales:**

**🐘 PostgreSQL 17 (Base de Datos Principal)**
- **Función:** Sistema de gestión de base de datos relacional
- **Versión:** PostgreSQL 17
- **Características:**
  - ACID compliance
  - Transacciones distribuidas
  - Índices B-tree y GIN
  - Particionamiento de tablas
  - Backup y recovery automático
- **Configuración:**
  - Connection pooling: 20 conexiones
  - Shared buffers: 256MB
  - Work memory: 4MB

**🗺️ PostGIS (Extensión Geoespacial)**
- **Función:** Extensión geoespacial para PostgreSQL
- **Versión:** PostGIS 3.4
- **Características:**
  - Tipos de datos geométricos
  - Índices espaciales (R-tree)
  - Funciones de cálculo geoespacial
  - Soporte para coordenadas GPS
- **Uso en el sistema:**
  - Almacenamiento de coordenadas
  - Cálculo de distancias
  - Validación de ubicaciones permitidas

---

## 🌐 SERVICIOS EXTERNOS

### **🌍 Navegador Web**
- **Función:** Cliente de la aplicación web
- **Soporte:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **APIs utilizadas:**
  - Navigator.geolocation
  - LocalStorage/SessionStorage
  - WebSockets (futuro)
  - Service Workers (PWA)

### **📡 API de Geolocalización**
- **Función:** Obtención de coordenadas GPS del dispositivo
- **API:** Navigator.geolocation (Web API estándar)
- **Precisión:** 5-10 metros en condiciones óptimas
- **Fallback:** IP geolocation como respaldo

### **💻 Sistema Operativo**
- **Función:** Recursos del sistema y servicios base
- **Soporte:** Windows 10+, Linux Ubuntu 20+, macOS 11+
- **Recursos utilizados:**
  - Sistema de archivos
  - Networking stack
  - Process management
  - Memory management

---

## 🔄 FLUJO DE DATOS DEL SISTEMA

### **Flujo de Registro de Asistencia:**
```
1. Usuario → Navegador → Interfaz Web
2. Interfaz Web → API Geolocalización → Coordenadas GPS
3. Interfaz Web → Cliente HTTP → API Gateway (POST /api/asistencias/entrada)
4. API Gateway → Middleware Auth → Validación JWT
5. Middleware Auth → Controlador Asistencia → Lógica de negocio
6. Controlador → Servicio GPS → Validación ubicación
7. Controlador → Repository → Validación de datos
8. Repository → ORM Prisma → Query SQL
9. ORM Prisma → PostgreSQL → Inserción de datos
10. PostgreSQL → PostGIS → Cálculo geoespacial
11. Respuesta inversa hasta la interfaz
```

### **Flujo de Generación de Reportes:**
```
1. Admin → Dashboard → Filtros de reporte
2. Dashboard → Cliente HTTP → API Gateway (GET /api/reportes)
3. API Gateway → Controlador Admin → Procesamiento de filtros
4. Controlador → Repository → Consultas complejas
5. Repository → ORM Prisma → Aggregations y JOINs
6. ORM Prisma → PostgreSQL → Ejecución de queries
7. Datos procesados → Generador PDF/Excel
8. Archivo generado → Descarga automática
```

---

## ⚡ CARACTERÍSTICAS TÉCNICAS

### **Rendimiento:**
- **API Response Time:** <100ms promedio
- **Database Query Time:** <50ms promedio
- **Frontend Load Time:** <3 segundos
- **Concurrent Users:** 50+ usuarios simultáneos

### **Seguridad:**
- **Autenticación:** JWT con expiración de 24h
- **Autorización:** RBAC (Role-Based Access Control)
- **Encriptación:** bcrypt para passwords, AES para datos sensibles
- **Headers de seguridad:** Helmet.js implementado
- **Validación de entrada:** Sanitización completa

### **Escalabilidad:**
- **Horizontal:** Load balancing con nginx
- **Vertical:** Optimización de queries y caching
- **Database:** Particionamiento por fechas
- **CDN:** Archivos estáticos optimizados

### **Monitoreo:**
- **Logs:** Winston + formateo estructurado
- **Métricas:** Prometheus + Grafana (futuro)
- **Alertas:** Notificaciones automáticas por email
- **Health checks:** /health endpoint

---

## 🏆 PATRONES DE DISEÑO IMPLEMENTADOS

### **1. Model-View-Controller (MVC)**
- **Modelo:** Entidades Prisma + Repositorios
- **Vista:** Componentes React + UI Library
- **Controlador:** Express Controllers + Business Logic

### **2. Repository Pattern**
- **Abstracción:** Capa entre lógica de negocio y datos
- **Beneficios:** Testability, Flexibility, Maintainability
- **Implementación:** Interfaces TypeScript + Prisma

### **3. Middleware Pattern**
- **Pipeline:** Procesamiento secuencial de requests
- **Implementación:** Express middleware chain
- **Uso:** Auth, Validation, Logging, Error handling

### **4. Factory Pattern**
- **Uso:** Creación de servicios y repositorios
- **Beneficios:** Dependency Injection facilitada
- **Implementación:** Service container personalizado

---

*Documento técnico del Diagrama de Componentes - Instituto San Martín - Octubre 2024*