# REQUERIMIENTOS DEL SISTEMA
## Sistema de Asistencia - Instituto San Martín

### INFORMACIÓN GENERAL

**Nombre del Sistema:** ASISTEM_SAN_MARTIN  
**Versión:** 1.0.0  
**Fecha:** Septiembre 2025  
**Institución:** Instituto San Martín  
**Tipo de Sistema:** Sistema Web de Gestión de Asistencia Docente  

---

## 1. REQUERIMIENTOS FUNCIONALES

### 1.1 MÓDULO DE AUTENTICACIÓN Y SEGURIDAD

#### RF001 - Inicio de Sesión
- **Descripción:** El sistema debe permitir el acceso mediante credenciales válidas
- **Actores:** Administradores, Docentes
- **Precondiciones:** Usuario registrado en el sistema
- **Flujo Principal:**
  1. Usuario ingresa email y contraseña
  2. Sistema valida credenciales
  3. Sistema genera token JWT de autenticación
  4. Usuario es redirigido al dashboard correspondiente
- **Postcondiciones:** Usuario autenticado con sesión activa
- **Prioridad:** Alta

#### RF002 - Control de Roles y Permisos
- **Descripción:** El sistema debe gestionar diferentes niveles de acceso
- **Roles Definidos:**
  - **Administrador:** Acceso completo al sistema
  - **Docente:** Acceso limitado a funciones de registro de asistencia
- **Prioridad:** Alta

#### RF003 - Gestión de Sesiones
- **Descripción:** El sistema debe controlar sesiones activas y expiración de tokens
- **Funcionalidades:**
  - Tiempo de expiración de sesión
  - Cierre automático por inactividad
  - Cierre manual de sesión
- **Prioridad:** Alta

### 1.2 MÓDULO DE GESTIÓN DE USUARIOS

#### RF004 - Registro de Usuarios
- **Descripción:** El administrador puede registrar nuevos usuarios en el sistema
- **Datos Requeridos:**
  - Información personal (nombres, apellidos, DNI)
  - Datos de contacto (email, teléfono)
  - Información laboral (cargo, fecha ingreso)
  - Credenciales de acceso
- **Validaciones:**
  - DNI único en el sistema
  - Email único y formato válido
  - Contraseña con políticas de seguridad
- **Prioridad:** Alta

#### RF005 - Consulta y Búsqueda de Usuarios
- **Descripción:** El sistema debe permitir buscar y filtrar usuarios
- **Funcionalidades:**
  - Búsqueda por nombre, apellido, DNI, email
  - Filtros por estado (activo/inactivo)
  - Filtros por rol
  - Paginación de resultados
- **Prioridad:** Media

#### RF006 - Actualización de Usuarios
- **Descripción:** Permitir modificar información de usuarios existentes
- **Restricciones:**
  - Solo administradores pueden modificar datos
  - Mantener trazabilidad de cambios
- **Prioridad:** Media

#### RF007 - Gestión de Estado de Usuarios
- **Descripción:** Activar/desactivar usuarios sin eliminar datos
- **Funcionalidades:**
  - Cambio de estado activo/inactivo
  - Usuarios inactivos no pueden acceder al sistema
  - Historial de cambios de estado
- **Prioridad:** Media

### 1.3 MÓDULO DE GESTIÓN ACADÉMICA

#### RF008 - Gestión de Áreas Académicas
- **Descripción:** Administrar las diferentes áreas de enseñanza
- **Funcionalidades:**
  - Crear, modificar, eliminar áreas
  - Asignar coordinadores
  - Gestionar estado activo/inactivo
- **Prioridad:** Media

#### RF009 - Gestión de Docentes
- **Descripción:** Administrar información específica de docentes
- **Funcionalidades:**
  - Registro con datos académicos
  - Asignación a áreas
  - Gestión de especialidades
  - Control de estado laboral
- **Prioridad:** Alta

### 1.4 MÓDULO DE ASISTENCIA

#### RF010 - Registro de Asistencia con GPS
- **Descripción:** Los docentes pueden registrar su asistencia con validación geográfica
- **Funcionalidades:**
  - Captura automática de coordenadas GPS
  - Validación de ubicación permitida
  - Registro de hora de entrada y salida
  - Fotografía de respaldo (opcional)
- **Restricciones:**
  - Solo dentro del radio permitido de la institución
  - Un registro por jornada laboral
- **Prioridad:** Alta

#### RF011 - Consulta de Asistencias
- **Descripción:** Visualizar registros de asistencia con filtros
- **Funcionalidades:**
  - Consulta por fechas
  - Consulta por docente
  - Consulta por área
  - Exportación de reportes
- **Prioridad:** Media

#### RF012 - Reportes de Asistencia
- **Descripción:** Generar reportes estadísticos de asistencia
- **Tipos de Reportes:**
  - Reporte diario de asistencia
  - Reporte mensual por docente
  - Reporte de tardanzas e inasistencias
  - Reporte por área académica
- **Formatos:** PDF, Excel
- **Prioridad:** Media

### 1.5 MÓDULO DE JUSTIFICACIONES Y PAPELETAS 🆕

#### RF013 - Solicitud de Justificaciones
- **Descripción:** Los docentes pueden solicitar justificaciones por faltas o tardanzas
- **Tipos de Justificaciones:**
  - Permiso médico (con certificado)
  - Permiso personal (con anticipación)
  - Capacitación institucional
  - Comisión de servicios
  - Licencias especiales
- **Flujo de Aprobación:**
  1. Docente envía solicitud
  2. Coordinador de área revisa
  3. Administrador aprueba/rechaza
  4. Notificación automática
- **Documentos:** Carga de archivos PDF/JPG
- **Prioridad:** CRÍTICA

#### RF014 - Gestión de Papeletas
- **Descripción:** Administrar papeletas de permisos y salidas
- **Funcionalidades:**
  - Papeletas de salida temprana
  - Papeletas de ingreso tardío
  - Permisos por horas
  - Compensación de tiempo
- **Estados:** Pendiente, Aprobado, Rechazado, Vencido
- **Prioridad:** CRÍTICA

#### RF015 - Justificaciones Retrospectivas
- **Descripción:** Justificar faltas o tardanzas después del evento
- **Limitaciones:**
  - Máximo 3 días calendario después
  - Requiere documentación obligatoria
  - Aprobación de nivel superior
- **Validaciones:**
  - Verificación de documentos
  - Políticas institucionales
- **Prioridad:** Alta


### 1.6 MÓDULO DE HORARIOS Y JORNADAS (AJUSTADO A LA REALIDAD)

#### RF016 - Gestión de Horarios y Jornadas Variables
- **Descripción:** Permitir definir horarios y carga horaria individual para cada docente, considerando contratos por horas.
- **Funcionalidades:**
  - Horarios configurables por docente (no solo por área)
  - Definición de carga horaria diaria y semanal (ej: 2, 4, 6 horas/día)
  - Asignación de días específicos de trabajo (ej: solo lunes y miércoles)
  - Soporte para horarios partidos (ej: 2 horas mañana, 2 tarde)
  - Horarios especiales por eventos o reemplazos
  - Tolerancias de entrada/salida configurables
- **Restricciones:**
  - No se contempla control de horas extras (a menos que la institución lo requiera)
  - No se implementarán turnos automáticos si no hay decisión institucional
- **Prioridad:** CRÍTICA

#### RF017 - Cálculo de Cumplimiento de Carga Horaria
- **Descripción:** Calcular asistencia, tardanza y faltas en función de la carga horaria real de cada docente.
- **Métricas:**
  - Horas efectivas trabajadas vs. horas contratadas
  - Porcentaje de cumplimiento de jornada
  - Reporte de inasistencias y tardanzas ajustado a la carga horaria
- **Reportes:**
  - Reporte individual por docente
  - Reporte consolidado por área
- **Prioridad:** Alta

#### RF018 - Gestión de Feriados y Días Especiales
- **Descripción:** Configurar días no laborales y eventos especiales
- **Tipos:**
  - Feriados nacionales
  - Días institucionales
  - Días de capacitación
  - Eventos académicos
- **Efectos:** No cuenta como falta
- **Prioridad:** Media

### 1.7 MÓDULO DE REPORTES LABORALES 🆕

#### RF019 - Reportes para Planillas
- **Descripción:** Generar reportes específicos para el área de RRHH
- **Reportes Requeridos:**
  - Reporte de tardanzas mensuales
  - Reporte de faltas justificadas/injustificadas
  - Cálculo de descuentos por planilla
  - Tiempo efectivo trabajado
- **Formatos:** Excel, PDF, CSV
- **Periodicidad:** Diario, semanal, mensual, anual
- **Prioridad:** CRÍTICA

#### RF020 - Reportes Legales
- **Descripción:** Reportes requeridos por entidades gubernamentales
- **Entidades:**
  - SUNAT (para declaraciones)
  - MINTRA (inspecciones laborales)
  - Contraloría (auditorías)
- **Certificaciones:**
  - Tiempo de servicios
  - Constancias de trabajo
- **Prioridad:** Alta

#### RF021 - Dashboard Ejecutivo
- **Descripción:** Métricas y KPIs para la dirección
- **Indicadores:**
  - Porcentaje de asistencia institucional
  - Ranking de asistencia por áreas
  - Tendencias de tardanzas
  - Cumplimiento de horarios
- **Visualización:** Gráficos interactivos
- **Prioridad:** Media

### 1.8 MÓDULO DE NOTIFICACIONES 🆕

#### RF022 - Notificaciones Automáticas
- **Descripción:** Sistema de alertas y recordatorios automáticos
- **Tipos de Notificaciones:**
  - Recordatorio de marcado (15 min antes)
  - Alerta de tardanza (tiempo real)
  - Notificación de solicitud pendiente
  - Alerta de falta no justificada
- **Canales:** Email, notificación web, SMS (opcional)
- **Prioridad:** Alta

#### RF023 - Escalamiento de Alertas
- **Descripción:** Escalar alertas según niveles jerárquicos
- **Escalas:**
  - Nivel 1: Coordinador de área
  - Nivel 2: Subdirector académico
  - Nivel 3: Director general
- **Triggers:** Tardanzas repetitivas, faltas sin justificar
- **Prioridad:** Media

### 1.9 MÓDULO ADMINISTRATIVO

#### RF024 - Dashboard Administrativo
- **Descripción:** Panel de control con métricas importantes
- **Indicadores:**
  - Asistencias del día
  - Docentes activos
  - Estadísticas mensuales
  - Alertas del sistema
- **Prioridad:** Baja

#### RF025 - Configuraciones del Sistema
- **Descripción:** Gestionar parámetros operativos
- **Configuraciones:**
  - Radio GPS permitido
  - Horarios de trabajo
  - Políticas de contraseñas
  - Parámetros de notificaciones
- **Prioridad:** Media

#### RF026 - Configuraciones Laborales Avanzadas 🆕
- **Descripción:** Parámetros específicos para el manejo laboral
- **Configuraciones Críticas:**
  - Tolerancias de tardanza por área
  - Políticas de descuentos por planilla
  - Límites de justificaciones mensuales
  - Configuración de turnos especiales
- **Políticas Institucionales:**
  - Máximo tardanzas por mes sin descuento
  - Porcentaje de descuento por tardanza
  - Días máximos para justificar faltas
- **Prioridad:** CRÍTICA

#### RF027 - Auditoría y Trazabilidad 🆕
- **Descripción:** Registrar todas las operaciones del sistema
- **Logs de Auditoría:**
  - Cambios en horarios
  - Aprobaciones/rechazos de justificaciones
  - Modificaciones de asistencias
  - Accesos al sistema
- **Reportes de Auditoría:**
  - Actividad por usuario
  - Cambios en configuraciones
  - Historial de decisiones
- **Retención:** Mínimo 3 años
- **Prioridad:** Alta

---

## 2. REQUERIMIENTOS NO FUNCIONALES

### 2.1 RENDIMIENTO

#### RNF001 - Tiempo de Respuesta
- **Descripción:** Las operaciones principales deben completarse en tiempos aceptables
- **Métricas:**
  - Login: ≤ 2 segundos
  - Consultas: ≤ 3 segundos
  - Reportes: ≤ 10 segundos
- **Prioridad:** Alta

#### RNF002 - Capacidad
- **Descripción:** El sistema debe soportar la carga esperada
- **Métricas:**
  - Hasta 100 usuarios concurrentes
  - Hasta 500 registros de asistencia diarios
  - Base de datos hasta 10GB
- **Prioridad:** Media

### 2.2 SEGURIDAD

#### RNF003 - Autenticación Segura
- **Descripción:** Implementar medidas de seguridad robustas
- **Características:**
  - Tokens JWT con expiración
  - Encriptación de contraseñas (bcrypt)
  - Validación de permisos por rol
- **Prioridad:** Alta

#### RNF004 - Protección de Datos
- **Descripción:** Garantizar confidencialidad de información
- **Medidas:**
  - HTTPS obligatorio
  - Sanitización de inputs
  - Logs de auditoría
- **Prioridad:** Alta

### 2.3 USABILIDAD

#### RNF005 - Interfaz Intuitiva
- **Descripción:** El sistema debe ser fácil de usar
- **Características:**
  - Diseño responsive
  - Navegación clara
  - Mensajes de error comprensibles
- **Prioridad:** Media

#### RNF006 - Accesibilidad
- **Descripción:** Compatible con diferentes dispositivos
- **Características:**
  - Funcional en móviles
  - Compatible con navegadores modernos
  - Tiempo de aprendizaje mínimo
- **Prioridad:** Media

### 2.4 DISPONIBILIDAD

#### RNF007 - Disponibilidad del Sistema
- **Descripción:** El sistema debe estar disponible durante horarios laborales
- **Métricas:**
  - Disponibilidad: 99% en horario laboral
  - Tiempo de recuperación: ≤ 30 minutos
- **Prioridad:** Alta

### 2.5 COMPATIBILIDAD

#### RNF008 - Compatibilidad Tecnológica
- **Descripción:** Especificaciones técnicas mínimas
- **Navegadores Soportados:**
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+
- **Dispositivos Móviles:**
  - Android 8.0+
  - iOS 12.0+
- **Prioridad:** Media

---

## 3. REQUERIMIENTOS TÉCNICOS

### 3.1 ARQUITECTURA DEL SISTEMA

#### RT001 - Arquitectura de Aplicación
- **Frontend:** Next.js 15.5.2 con TypeScript
- **Backend:** Node.js con Express y TypeScript
- **Base de Datos:** PostgreSQL 13+ con PostGIS
- **Autenticación:** JWT (JSON Web Tokens)
- **ORM:** Prisma

#### RT002 - Infraestructura
- **Servidor Web:** Compatible con Node.js
- **Base de Datos:** PostgreSQL con extensión PostGIS
- **Almacenamiento:** Mínimo 50GB
- **Memoria RAM:** Mínimo 4GB
- **Conectividad:** Acceso a internet para servicios GPS

### 3.2 INTEGRACIONES

#### RT003 - Servicios Externos
- **Geolocalización:** API de Geolocation del navegador
- **Mapas:** Integración opcional con servicios de mapas
- **Notificaciones:** Sistema de notificaciones web

---

## 4. CASOS DE USO PRINCIPALES

### CU001 - Registrar Asistencia Docente
**Actor Principal:** Docente  
**Objetivo:** Registrar asistencia diaria con validación GPS  
**Precondiciones:** Docente autenticado, GPS activado  
**Flujo Principal:**
1. Docente accede al módulo de asistencia
2. Sistema solicita permisos de geolocalización
3. Sistema obtiene coordenadas GPS
4. Sistema valida ubicación dentro del radio permitido
5. Docente confirma registro de asistencia
6. Sistema registra asistencia con timestamp y coordenadas

### CU002 - Consultar Reportes de Asistencia
**Actor Principal:** Administrador  
**Objetivo:** Generar reporte de asistencias por período  
**Precondiciones:** Administrador autenticado  
**Flujo Principal:**
1. Administrador accede al módulo de reportes
2. Selecciona filtros (fecha, docente, área)
3. Sistema genera reporte
4. Administrador puede visualizar o exportar

### CU003 - Gestionar Usuarios
**Actor Principal:** Administrador  
**Objetivo:** Administrar usuarios del sistema  
**Precondiciones:** Administrador autenticado  
**Flujo Principal:**
1. Administrador accede al módulo de usuarios
2. Puede crear, consultar, modificar o desactivar usuarios
3. Sistema valida datos y permisos
4. Cambios se reflejan inmediatamente

---

## 5. PRIORIZACIÓN Y CRONOGRAMA

### FASE 1 - NÚCLEO BÁSICO (Completado)
✅ Autenticación y seguridad  
✅ Gestión básica de usuarios  
✅ Arquitectura base del sistema  

### FASE 2 - FUNCIONALIDAD PRINCIPAL (AJUSTADA A LA REALIDAD)
🔄 Registro de asistencia con GPS  
🔄 Gestión completa de docentes  
🔄 Módulo de áreas académicas  
🔄 Módulo de horarios y jornadas variables (con carga horaria configurable)
🔄 Módulo de justificaciones (solo si la institución lo va a operar)

### FASE 3 - REPORTES Y CUMPLIMIENTO LABORAL
🔄 Reportes para planillas (ajustados a la carga horaria real)
🔄 Reportes legales (SUNAT, MINTRA) solo si se requiere
🔄 Configuraciones laborales avanzadas (solo si se van a usar)
🔄 Sistema de notificaciones automáticas (si hay recursos para operarlo)

### FASE 4 - REPORTES Y ANÁLISIS
⏳ Dashboard ejecutivo  
⏳ Métricas avanzadas
⏳ Exportación de datos  
⏳ Auditoría y trazabilidad

### FASE 5 - OPTIMIZACIÓN
⏳ Mejoras de rendimiento  
⏳ Funcionalidades avanzadas  
⏳ Integraciones adicionales

---


### 6. RIESGOS Y CONSIDERACIONES

### RIESGOS TÉCNICOS
- **Precisión GPS:** Variabilidad en la precisión de geolocalización
- **Conectividad:** Dependencia de conexión a internet
- **Escalabilidad:** Crecimiento futuro de usuarios
- **Complejidad de horarios variables:** Requiere parametrización cuidadosa y pruebas reales

### RIESGOS OPERATIVOS
- **Adopción:** Resistencia al cambio por parte de usuarios
- **Capacitación:** Necesidad de entrenamiento
- **Soporte:** Requerimientos de mantenimiento
- **Alcance realista:** Riesgo de incluir módulos que no se implementarán

### MITIGACIONES
- Implementar tolerancia a errores GPS
- Funcionalidad offline limitada
- Arquitectura escalable desde el diseño
- Plan de capacitación integral
- Validar requerimientos con usuarios finales y RRHH antes de desarrollo
- Documentar claramente los límites y alcances del sistema

---

**Documento preparado por:** GitHub Copilot  
**Fecha de elaboración:** Septiembre 17, 2025  
**Estado:** Borrador para revisión