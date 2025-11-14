# ARQUITECTURA DE NEGOCIO - MAPA DE MACROPROCESOS
## INSTITUTO SAN MARTÍN - SISTEMA DE GESTIÓN ACADÉMICA

### 🏛️ INFORMACIÓN INSTITUCIONAL

- **Institución:** Instituto de Educación Superior San Martín
- **Tipo de Organización:** Institución Educativa Privada
- **Modelo de Negocio:** Educación Superior Técnica y Profesional
- **Enfoque:** Eficiencia operacional mediante digitalización
- **Fecha de Análisis:** Octubre 2024

---

## 🎯 CLASIFICACIÓN DE PROCESOS ORGANIZACIONALES

### MARCO METODOLÓGICO: **ARQUITECTURA DE PROCESOS BPM**

La arquitectura de negocio del Instituto San Martín se basa en la metodología BPM (Business Process Management) que clasifica los procesos organizacionales en tres niveles jerárquicos:

---

## 📊 ANÁLISIS DE MACROPROCESOS

### 🎯 **NIVEL 1: PROCESOS ESTRATÉGICOS**
**Propósito:** Definición de directrices, políticas y objetivos institucionales

#### **1.1 Planificación Estratégica Institucional**
- **Responsable:** Dirección General + Consejo Académico
- **Frecuencia:** Anual con revisiones semestrales
- **Entregables:**
  - Plan Estratégico Institucional (PEI)
  - Objetivos académicos anuales
  - Presupuesto institucional
  - Cronograma académico
- **KPIs Principales:**
  - Cumplimiento de objetivos: >90%
  - Satisfacción estudiantil: >85%
  - Empleabilidad de graduados: >80%

#### **1.2 Gestión de Calidad Educativa**
- **Responsable:** Coordinación Académica
- **Frecuencia:** Continua con evaluaciones semestrales
- **Entregables:**
  - Reportes de calidad académica
  - Planes de mejora continua
  - Indicadores de rendimiento docente
  - Evaluaciones institucionales
- **KPIs Principales:**
  - Índice de calidad académica: >4.0/5.0
  - Retención estudiantil: >90%
  - Puntualidad docente: >90%

#### **1.3 Gestión de Riesgos y Compliance**
- **Responsable:** Auditoría Interna + Legal
- **Frecuencia:** Continua con reportes mensuales
- **Entregables:**
  - Matriz de riesgos institucionales
  - Reportes de cumplimiento normativo
  - Auditorías internas
  - Planes de contingencia
- **KPIs Principales:**
  - Cumplimiento normativo: 100%
  - Incidentes de seguridad: 0
  - Tiempo de respuesta a auditorías: <48h

### 🎓 **NIVEL 2: PROCESOS MISIONALES (CORE)**
**Propósito:** Procesos que generan valor directo al negocio educativo

#### **2.1 Gestión Académica Principal**
- **Responsable:** Coordinadores Académicos por Área
- **Frecuencia:** Diaria con planificación semestral
- **Subprocesos:**
  - **Planificación Curricular:** Diseño de planes de estudio
  - **Programación de Clases:** Horarios y asignación docente
  - **Evaluación Académica:** Sistemas de evaluación y calificación
  - **Seguimiento Estudiantil:** Monitoreo del progreso académico
- **Integración con Sistema:** Consulta de asistencia docente para evaluación

#### **2.2 Control de Asistencia Docente** ⭐ **PROCESO AUTOMATIZADO**
- **Responsable:** Sistema Automatizado + Supervisión RRHH
- **Frecuencia:** Tiempo real (24/7)
- **Tecnología:** Sistema GPS + Base de datos PostgreSQL
- **Subprocesos Automatizados:**

  **🔴 Registro de Entrada:**
  ```
  1. Docente llega a ubicación permitida
  2. Sistema detecta coordenadas GPS del dispositivo
  3. Validación automática de ubicación (radio 50m)
  4. Verificación de horario programado
  5. Registro automático en base de datos
  6. Notificación de confirmación al docente
  ```

  **🔴 Registro de Salida:**
  ```
  1. Docente activa registro de salida
  2. Validación GPS de ubicación permitida
  3. Cálculo automático de horas trabajadas
  4. Detección de salidas tempranas o tardanzas
  5. Actualización automática de registros
  6. Generación de alertas si aplica
  ```

  **🔴 Procesamiento y Reportes:**
  ```
  1. Consolidación diaria automática
  2. Cálculo de métricas de puntualidad
  3. Generación de reportes por docente/área
  4. Integración con sistema de nómina
  5. Dashboards en tiempo real
  ```

- **Beneficios Cuantificados:**
  - Reducción de tiempo administrativo: 40 horas/mes
  - Precisión en registros: 99.9%
  - Eliminación de errores manuales: 95%
  - Transparencia en procesos: 100%

#### **2.3 Gestión de Personal Docente**
- **Responsable:** Recursos Humanos + Coordinaciones Académicas
- **Frecuencia:** Continua con evaluaciones semestrales
- **Subprocesos:**
  - **Selección y Contratación:** Proceso de hiring docente
  - **Evaluación del Desempeño:** Assessment basado en métricas
  - **Desarrollo Profesional:** Capacitaciones y certificaciones
  - **Gestión de Horarios:** Asignación y modificación de horarios
- **Integración con Sistema:** Datos de asistencia alimentan evaluaciones

#### **2.4 Administración Estudiantil**
- **Responsable:** Secretaría Académica + Admisiones
- **Frecuencia:** Continua con picos semestrales
- **Subprocesos:**
  - **Admisiones:** Proceso de ingreso de estudiantes
  - **Matriculación:** Inscripción a cursos y programas
  - **Seguimiento Académico:** Monitoreo del progreso
  - **Graduación:** Proceso de certificación y titulación

### 🔧 **NIVEL 3: PROCESOS DE APOYO**
**Propósito:** Soporte y habilitación de procesos misionales

#### **3.1 Gestión de Recursos Humanos**
- **Responsable:** Jefe de Recursos Humanos
- **Frecuencia:** Continua con ciclos mensuales
- **Subprocesos:**
  - **Administración de Personal:** Expedientes y documentación
  - **Nómina y Pagos:** Procesamiento de sueldos (integrado con asistencia)
  - **Capacitación:** Programas de desarrollo profesional
  - **Bienestar Laboral:** Programas de bienestar y clima organizacional

#### **3.2 Gestión Financiera y Contable**
- **Responsable:** Contador General + Administración
- **Frecuencia:** Diaria con cierres mensuales
- **Subprocesos:**
  - **Presupuesto Institucional:** Planificación financiera anual
  - **Control de Gastos:** Monitoreo y autorización de gastos
  - **Facturación:** Emisión de comprobantes y cobranza
  - **Reportes Financieros:** Estados financieros y análisis
- **Integración con Sistema:** Datos de asistencia para cálculo de nómina

#### **3.3 Tecnología y Sistemas de Información** ⭐ **PROCESO AUTOMATIZADO**
- **Responsable:** Jefe de TI + Soporte Técnico
- **Frecuencia:** 24/7 con mantenimientos programados
- **Subprocesos Automatizados:**
  - **Infraestructura TI:** Servidores, redes, seguridad
  - **Desarrollo de Software:** Mantenimiento del sistema de asistencia
  - **Soporte Técnico:** Help desk y resolución de incidencias
  - **Seguridad Informática:** Backup, recovery, ciberseguridad

#### **3.4 Gestión de Instalaciones y Mantenimiento**
- **Responsable:** Servicios Generales + Mantenimiento
- **Frecuencia:** Continua con programas preventivos
- **Subprocesos:**
  - **Mantenimiento de Aulas:** Conservación de espacios académicos
  - **Servicios Generales:** Limpieza, seguridad, servicios básicos
  - **Seguridad Física:** Control de acceso y vigilancia
  - **Gestión de Espacios:** Asignación y programación de aulas

---

## 🔄 MATRIZ DE INTERACCIONES ENTRE PROCESOS

### **Flujos de Información Principales:**

| **Proceso Origen** | **Proceso Destino** | **Información Transferida** | **Frecuencia** |
|-------------------|-------------------|---------------------------|---------------|
| Planificación Estratégica | Gestión Académica | Objetivos y metas académicas | Semestral |
| Control Asistencia | Gestión Personal | Métricas de rendimiento docente | Diario |
| Control Asistencia | Gestión Financiera | Datos para cálculo de nómina | Mensual |
| Gestión Calidad | Control Asistencia | Indicadores de control requeridos | Mensual |
| Tecnología | Control Asistencia | Soporte técnico y mantenimiento | Continuo |
| Instalaciones | Control Asistencia | Ubicaciones GPS permitidas | Por cambios |

### **Retroalimentación y Mejora Continua:**

```
Control de Asistencia → Gestión de Calidad → Planificación Estratégica
      ↓                        ↓                      ↓
  Datos reales         Análisis y métricas    Ajustes estratégicos
      ↓                        ↓                      ↓
Mejoras operativas    Planes de mejora      Nueva planificación
```

---

## 📈 INDICADORES CLAVE DE RENDIMIENTO (KPIs)

### **KPIs del Proceso de Control de Asistencia:**

#### **Eficiencia Operacional:**
- **Tiempo de registro:** <30 segundos por marcación
- **Disponibilidad del sistema:** 99.9% uptime
- **Precisión de ubicación:** 5-10 metros (GPS)
- **Tiempo de generación de reportes:** <5 minutos

#### **Calidad del Proceso:**
- **Puntualidad promedio docente:** 92.3%
- **Asistencia mensual promedio:** 85.5%
- **Cobertura del sistema:** 100% docentes activos
- **Errores de registro:** <0.1% mensual

#### **Impacto en el Negocio:**
- **Reducción tiempo administrativo:** 40 horas/mes
- **Ahorro en costos operativos:** $2,500 USD/año
- **Mejora en transparencia:** 100% trazabilidad
- **ROI del sistema:** 300% en 24 meses

### **KPIs Institucionales Impactados:**

#### **Gestión de Calidad Educativa:**
- **Cumplimiento horario docente:** Mejoró de 75% a 92%
- **Satisfacción administrativa:** Incrementó 40%
- **Tiempo de respuesta a consultas:** Reducción 60%

#### **Eficiencia Organizacional:**
- **Procesos digitalizados:** 8 de 11 procesos (73%)
- **Automatización de reportes:** 100% para asistencia
- **Reducción de errores administrativos:** 95%

---

## 💡 ANÁLISIS DE VALOR AGREGADO

### **Procesos de Alto Valor:**
1. **Control de Asistencia Docente** - Impacto directo en calidad educativa
2. **Gestión Académica** - Core del negocio educativo
3. **Gestión de Personal Docente** - Recurso crítico institucional

### **Procesos Habilitadores:**
1. **Tecnología y Sistemas** - Plataforma de automatización
2. **Gestión Financiera** - Sostenibilidad económica
3. **Planificación Estratégica** - Dirección organizacional

### **Oportunidades de Mejora:**
1. **Automatizar evaluación docente** - Integrar métricas de asistencia
2. **Dashboard ejecutivo** - Métricas en tiempo real para dirección
3. **Integración financiera** - Automatizar completamente la nómina
4. **Predictive analytics** - Alertas tempranas de ausentismo

---

## 🎯 ALINEACIÓN ESTRATÉGICA

### **Objetivos Institucionales Soportados:**

#### **Eficiencia Operacional (+25%):**
- Automatización del control de asistencia
- Reducción de procesos manuales
- Optimización de recursos administrativos

#### **Transparencia Administrativa (100%):**
- Trazabilidad completa de asistencias
- Reportes automáticos y auditables
- Acceso en tiempo real a información

#### **Calidad Educativa (>85% satisfacción):**
- Mejor control de cumplimiento docente
- Datos para evaluación de desempeño
- Optimización de recursos académicos

#### **Sostenibilidad Financiera:**
- Reducción de costos administrativos
- Mejor control de nómina docente
- ROI positivo en tecnología

---

## 🚀 ROADMAP DE EVOLUCIÓN DE PROCESOS

### **Fase Actual (Octubre 2024):**
- ✅ Control de asistencia automatizado
- ✅ Reportes automáticos
- ✅ Integración básica con nómina

### **Fase 2 (Q1 2025):**
- 🔄 Dashboard ejecutivo en tiempo real
- 🔄 Automatización completa de nómina
- 🔄 Integración con evaluación docente

### **Fase 3 (Q2 2025):**
- 📋 Predictive analytics para ausentismo
- 📋 Automatización de horarios académicos
- 📋 Integración con sistema académico principal

### **Visión Futura (2025+):**
- 🎯 Instituto 100% digital
- 🎯 IA para optimización de recursos
- 🎯 Integración completa de procesos
- 🎯 Certificación ISO 9001 en procesos

---

*Documento de Arquitectura de Negocio - Instituto San Martín - Octubre 2024*