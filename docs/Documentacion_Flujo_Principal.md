# FLUJO DEL PROCESO PRINCIPAL - CONTROL DE ASISTENCIA GPS
## Instituto San Martín - Sistema ASISTEM

### 📋 RESUMEN EJECUTIVO

El **Flujo del Proceso Principal** describe paso a paso cómo funciona el control de asistencia geolocalizado en el Instituto San Martín, desde que el docente llega hasta la generación de reportes automáticos.

---

## 🎯 PROCESO COMPLETO DE ASISTENCIA

### **📅 FASE 1: REGISTRO DE ENTRADA (7:30 - 8:00 AM)**

| Paso | Actor | Actividad | Tiempo | Resultado |
|------|-------|-----------|--------|-----------|
| 1 | **DOCENTE** | Llega al instituto | - | Activación del proceso |
| 2 | **DOCENTE** | Abre App ASISTEM | 10 seg | Interface lista |
| 3 | **SISTEMA** | Captura GPS automáticamente | 5 seg | Coordenadas obtenidas |
| 4 | **SISTEMA** | Valida geoperímetro (50m) | 3 seg | Ubicación verificada |
| 5 | **SISTEMA** | Registra en base de datos | 2 seg | Datos almacenados |
| 6 | **SISTEMA** | Calcula puntualidad | 1 seg | Estado definido |
| 7 | **SISTEMA** | Envía confirmación | 2 seg | Docente notificado |

**⏱️ Tiempo Total de Registro: < 30 segundos**

### **🕐 FASE 2: REGISTRO DE SALIDA (4:00 - 6:00 PM)**

| Paso | Actor | Actividad | Tiempo | Resultado |
|------|-------|-----------|--------|-----------|
| 1 | **DOCENTE** | Registra salida en app | 10 seg | Proceso iniciado |
| 2 | **SISTEMA** | Captura GPS de salida | 5 seg | Ubicación confirmada |
| 3 | **SISTEMA** | Valida ubicación | 3 seg | Salida verificada |
| 4 | **SISTEMA** | Registra en BD | 2 seg | Datos guardados |
| 5 | **SISTEMA** | Calcula horas trabajadas | 5 seg | Jornada procesada |
| 6 | **SISTEMA** | Genera reporte automático | 10 seg | Reporte creado |

**⏱️ Tiempo Total de Salida: < 40 segundos**

---

## 🔄 VALIDACIONES AUTOMÁTICAS

### **🎯 Validación de Geoperímetro**
- **Radio Permitido**: 50 metros desde el centro del instituto
- **Precisión GPS**: 5-10 metros
- **Margen de Error**: ±3 metros
- **Acción si Falla**: Notificación inmediata + Reintento automático

### **⏰ Validación de Horarios**
- **Entrada Puntual**: Antes de 8:00 AM
- **Tolerancia**: 15 minutos (hasta 8:15 AM)
- **Llegada Tardía**: Después de 8:15 AM
- **Registro Automático**: Cálculo de minutos de retraso

---

## 📊 DATOS ALMACENADOS EN CADA REGISTRO

### **💾 Información de Entrada**
```json
{
  "id_usuario": "DOC_001",
  "timestamp_entrada": "2024-10-09T07:45:23Z",
  "coordenadas_gps": {
    "latitud": -6.7011,
    "longitud": -79.9061
  },
  "tipo_registro": "ENTRADA",
  "dispositivo_id": "ANDROID_ABC123",
  "estado_puntualidad": "PUNTUAL",
  "distancia_instituto": "15m"
}
```

### **💾 Información de Salida**
```json
{
  "id_usuario": "DOC_001",
  "timestamp_salida": "2024-10-09T16:30:45Z",
  "horas_trabajadas": "8:45:22",
  "horas_extras": "0:45:22",
  "total_descuentos": "0:00:00",
  "jornada_completa": true
}
```

---

## 📈 DISTRIBUCIÓN DE INFORMACIÓN

### **👥 COORDINADORES DE ÁREA**
- **Dashboard en Tiempo Real**: Asistencia actual
- **Reportes Diarios**: Puntualidad por docente
- **Alertas Automáticas**: Ausencias no justificadas
- **Métricas de Área**: Estadísticas de su departamento

### **👨‍💼 DIRECTOR ACADÉMICO**
- **Reportes Consolidados**: Vista general institucional
- **Indicadores KPI**: Puntualidad, asistencia, eficiencia
- **Análisis Mensual**: Tendencias y patrones
- **Reportes Normativos**: Para entidades reguladoras

### **👩‍💻 ADMINISTRACIÓN**
- **Datos de Nómina**: Horas trabajadas por docente
- **Cálculo de Descuentos**: Por tardanzas y ausencias
- **Horas Extras**: Tiempo adicional trabajado
- **Reportes Financieros**: Impacto en costos laborales

---

## 🔧 PROCESOS PARALELOS AUTOMATIZADOS

### **🔄 Procesos en Segundo Plano**
1. **Backup Automático**: Cada 24 horas a las 2:00 AM
2. **Sincronización**: Tiempo real con servidores en la nube
3. **Validación de Integridad**: Cada registro verificado
4. **Alertas Automáticas**: Notificaciones por ausencias
5. **Limpieza de Datos**: Archivado mensual de registros antiguos
6. **Monitoreo de Sistema**: Disponibilidad 24/7

### **📊 Métricas de Rendimiento**
- **Tiempo de Respuesta**: < 5 segundos promedio
- **Disponibilidad**: 99.9% uptime garantizado
- **Usuarios Concurrentes**: Hasta 50 docentes simultáneos
- **Precisión GPS**: 95% dentro del margen esperado
- **Tasa de Error**: < 0.1% en registros

---

*Documento generado para Informe Académico 2024 - Instituto San Martín*  
*Sistema ASISTEM - Control de Asistencia Geolocalizado*