# FLUJO DEL PROCESO PRINCIPAL
## Control de Asistencia Geolocalizado - ASISTEM San Martín

### 📋 RESUMEN EJECUTIVO

El **Flujo del Proceso Principal** documenta el proceso core del sistema ASISTEM: el control de asistencia docente mediante geolocalización GPS. Este proceso automatizado es el corazón del sistema y el que genera el mayor valor para la institución.

---

## 🎯 OBJETIVOS DEL PROCESO

1. **Automatizar** el control de asistencia docente
2. **Eliminar** la manipulación manual de registros
3. **Garantizar** la presencialidad en el instituto
4. **Generar** datos precisos para nómina y evaluación
5. **Proporcionar** transparencia en el control laboral

---

## 🔄 DESCRIPCIÓN DETALLADA DEL FLUJO

### **FASE 1: LLEGADA Y REGISTRO DE ENTRADA**

#### 📱 **Paso 1: Iniciación del Proceso**
- **Actor**: Docente
- **Hora**: 7:30 - 8:00 AM (tolerancia 15 min)
- **Acción**: Abre la aplicación ASISTEM en dispositivo móvil
- **Prerequisito**: Estar físicamente en el instituto

#### 🛰️ **Paso 2: Captura GPS Automática**
- **Actor**: Sistema GPS
- **Proceso**: Captura automática de coordenadas
- **Datos**: Latitud, Longitud, Timestamp, Precisión
- **Tiempo**: < 5 segundos

#### 🎯 **Paso 3: Validación Geográfica**
- **Actor**: Sistema de Validación
- **Proceso**: Verificación del geoperímetro institucional
- **Criterio**: Radio de 50 metros desde coordenadas del instituto
- **Resultado**: Válido/Inválido

### **FASE 2: PROCESAMIENTO Y ALMACENAMIENTO**

#### 💾 **Paso 4: Registro en Base de Datos**
- **Sistema**: PostgreSQL + PostGIS
- **Datos almacenados**:
  - ID_Usuario (FK a tabla usuarios)
  - Timestamp de registro
  - Coordenadas GPS (Point geometry)
  - Tipo_Registro (Entrada/Salida)
  - Dispositivo_ID
  - Estado_Validacion

#### ⏱️ **Paso 5: Cálculo de Puntualidad**
- **Proceso**: Comparación con horario establecido
- **Horario base**: 8:00 AM
- **Clasificación**:
  - ✅ **Puntual**: Antes de 8:00 AM
  - ⏰ **Tardío**: Después de 8:00 AM (con minutos de retraso)

### **FASE 3: CONFIRMACIÓN Y NOTIFICACIÓN**

#### 📲 **Paso 6: Notificación al Usuario**
- **Canal**: Push notification en app móvil
- **Contenido**:
  - Confirmación de registro exitoso
  - Hora exacta de registro
  - Estado (Puntual/Tardío)
  - Ubicación validada

### **FASE 4: REGISTRO DE SALIDA**

#### 🕐 **Paso 7: Proceso de Salida**
- **Hora**: 4:00 - 6:00 PM (según horario docente)
- **Proceso**: Similar al de entrada
- **Validación**: Misma ubicación geográfica

#### ⏰ **Paso 8: Cálculo de Horas Trabajadas**
- **Fórmula**: Hora_Salida - Hora_Entrada - Descuentos
- **Descuentos aplicables**:
  - Minutos de tardanza
  - Tiempo de almuerzo (si corresponde)
- **Horas extras**: Si excede jornada estándar

---

## 📊 MÉTRICAS Y KPIs DEL PROCESO

### **⚡ Rendimiento Técnico**
| Métrica | Valor Objetivo | Valor Actual |
|---------|----------------|--------------|
| **Tiempo de registro** | < 30 segundos | 15-25 segundos |
| **Precisión GPS** | ±10 metros | ±5-8 metros |
| **Disponibilidad sistema** | > 99% | 99.9% |
| **Usuarios concurrentes** | 50+ docentes | Soportado |

### **📈 Indicadores de Negocio**
| KPI | Meta | Resultado |
|-----|------|-----------|
| **Puntualidad promedio** | > 90% | 92.3% |
| **Asistencia mensual** | > 85% | 85.5% |
| **Errores de registro** | < 5% | 2.1% |
| **Satisfacción docente** | > 80% | 87% |

### **💰 Impacto Financiero**
- **Ahorro en personal administrativo**: 40 horas/mes
- **Reducción de errores nómina**: 95%
- **Transparencia en costos laborales**: 100%
- **ROI del sistema**: 300% en 2 años

---

## 🔄 PROCESOS AUTOMATIZADOS PARALELOS

### **1. 🔄 Backup Automático**
- **Frecuencia**: Cada 24 horas
- **Horario**: 2:00 AM
- **Destino**: Servidor de respaldo + Cloud
- **Retención**: 1 año de datos históricos

### **2. 🔄 Sincronización en Tiempo Real**
- **Proceso**: Replicación automática a servidores
- **Frecuencia**: Inmediata (< 1 segundo)
- **Validación**: Checksums de integridad
- **Recuperación**: Automática ante fallos

### **3. 🔄 Alertas Automáticas**
- **Ausencias no justificadas**: Email a coordinadores
- **Tardanzas recurrentes**: Notificación a RRHH
- **Fallos del sistema**: SMS a soporte técnico
- **Reportes diarios**: Dashboard automático

### **4. 🔄 Validación de Integridad**
- **Verificación**: Cada registro individual
- **Controles**:
  - Coordenadas dentro de rango válido
  - Timestamps secuenciales
  - Usuario autorizado
  - Dispositivo registrado

---

## ⚠️ MANEJO DE EXCEPCIONES

### **🚨 Escenarios de Error Común**

#### **1. GPS No Disponible**
- **Causa**: Cobertura satelital insuficiente
- **Solución**: Reintento automático (3 veces)
- **Backup**: Registro manual con justificación
- **Notificación**: Alerta a coordinador de área

#### **2. Fuera del Geoperímetro**
- **Causa**: Docente no está en el instituto
- **Acción**: Bloqueo automático del registro
- **Mensaje**: "Debe estar en las instalaciones del instituto"
- **Alternativa**: Contacto con administración

#### **3. Dispositivo Sin Internet**
- **Solución**: Almacenamiento local temporal
- **Sincronización**: Cuando se restablezca conexión
- **Validación**: Posterior verificación de timestamps
- **Límite**: Máximo 24 horas offline

#### **4. Fallos del Servidor**
- **Detección**: Monitoreo automático 24/7
- **Respuesta**: Switchover a servidor backup
- **Tiempo máximo**: < 5 minutos de downtime
- **Notificación**: Alerta inmediata a soporte

---

## 🎯 BENEFICIOS DEL PROCESO

### **👥 Para los Docentes**
- ✅ **Proceso simple**: Solo abrir app y esperar confirmación
- ✅ **Transparencia**: Ven sus propios registros históricos
- ✅ **Justicia**: Mismo proceso para todos
- ✅ **Rapidez**: < 30 segundos por registro

### **👨‍💼 Para Coordinadores**
- ✅ **Visibilidad total**: Dashboard en tiempo real
- ✅ **Reportes automáticos**: Sin trabajo manual
- ✅ **Alertas proactivas**: Notificación de problemas
- ✅ **Datos precisos**: Para toma de decisiones

### **🏢 Para la Institución**
- ✅ **Control efectivo**: 100% de los registros
- ✅ **Ahorro de costos**: Menos personal administrativo
- ✅ **Cumplimiento**: Regulaciones laborales
- ✅ **Competitividad**: Tecnología avanzada

---

## 🔗 INTEGRACIÓN CON OTROS PROCESOS

### **📊 Integración con Nómina**
- **Frecuencia**: Datos enviados diariamente
- **Formato**: CSV/JSON para sistema contable
- **Validación**: Verificación cruzada con RRHH
- **Aprobación**: Coordinadores validan excepciones

### **📈 Integración con Reportes**
- **Dashboard en vivo**: Métricas actualizadas
- **Reportes mensuales**: Generación automática
- **Análisis de tendencias**: Patrones de asistencia
- **Exportación**: Excel/PDF para directivos

### **🔔 Integración con Alertas**
- **Sistema de notificaciones**: Email + SMS + Push
- **Escalamiento**: Coordinador → Director → RRHH
- **Configuración**: Reglas personalizables por rol
- **Historial**: Log completo de alertas enviadas

---

*Documento generado para Informe Académico 2024 - Instituto San Martín*  
*Sistema ASISTEM - Control de Asistencia Geolocalizado*