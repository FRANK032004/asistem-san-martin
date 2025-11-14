# Módulo de Planillas - Documentación

## 📋 Descripción General

Módulo completo para la gestión y consulta de planillas mensuales de docentes. Permite a los docentes visualizar sus planillas, consultar detalles de cálculos, estadísticas de asistencia y descargar boletas de pago.

## 🎯 Estado Actual

✅ **Frontend**: 100% Implementado y funcional
⏳ **Backend**: 100% Implementado (requiere modelo Prisma)
⏳ **Base de Datos**: Scripts creados (pendiente de ejecución)
⏳ **Pruebas**: Pendiente (requiere datos en BD)

## 📁 Estructura de Archivos

### Backend
```
backend/src/
├── services/
│   └── planilla-docente.service.ts (350 líneas)
├── controllers/
│   └── planilla-docente.controller.ts (190 líneas)
├── routes/
│   └── planilla-docente.routes.ts (80 líneas)
└── dtos/
    └── planilla.dto.ts (130 líneas)
```

### Frontend
```
frontend/src/
├── app/docente/planillas/
│   ├── page.tsx (650 líneas) - Lista de planillas
│   └── [id]/
│       └── page.tsx (600 líneas) - Detalle completo
└── services/
    └── planilla-api.service.ts (200 líneas)
```

### Base de Datos
```
database/
└── crear_planillas.sql (300 líneas)
    ├── CREATE TABLE planillas
    ├── CREATE TABLE detalle_planillas
    ├── Triggers y funciones
    └── Datos de prueba
```

## 🚀 Instalación y Configuración

### 1. Crear Tablas en Base de Datos

```bash
# Ejecutar script SQL
psql -U postgres -d asistem_san_martin -f database/crear_planillas.sql
```

### 2. Actualizar Schema de Prisma

Agregar al archivo `backend/prisma/schema.prisma`:

```prisma
// Copiar contenido de backend/prisma/schema-planillas.prisma
// al final del archivo schema.prisma
```

Actualizar modelo **Usuario** agregando:
```prisma
model Usuario {
  // ... campos existentes ...
  
  // Agregar estas relaciones:
  planillasDocente      Planilla[]  @relation("PlanillasDocente")
  planillasCreadas      Planilla[]  @relation("PlanillasCreadas")
  planillasActualizadas Planilla[]  @relation("PlanillasActualizadas")
}
```

Actualizar modelo **Asistencia** agregando:
```prisma
model Asistencia {
  // ... campos existentes ...
  
  // Agregar esta relación:
  detallePlanilla DetallePlanilla[] @relation("DetallePlanillaAsistencia")
}
```

### 3. Generar Cliente Prisma

```bash
cd backend
npx prisma generate
```

### 4. Verificar Instalación

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

Navegar a: http://localhost:3000/docente/planillas

## 🔧 API Endpoints

### Rutas Docente (Autenticado)

```typescript
GET    /api/docente/planillas                    // Listar planillas con filtros
GET    /api/docente/planillas/estadisticas       // Estadísticas generales
GET    /api/docente/planillas/anios              // Años disponibles
GET    /api/docente/planillas/:id                // Detalle completo
GET    /api/docente/planillas/:id/pdf            // Descargar PDF (pendiente)
```

### Parámetros de Filtro

```typescript
// GET /api/docente/planillas
?anio=2025         // Filtrar por año
&mes=1             // Filtrar por mes (1-12)
&estado=PAGADO     // Filtrar por estado
```

### Respuestas

**Lista de Planillas:**
```json
{
  "success": true,
  "message": "Planillas obtenidas correctamente",
  "data": [
    {
      "id": "uuid",
      "mes": 1,
      "anio": 2025,
      "periodo": "Enero 2025",
      "estado": "PAGADO",
      "horasRegulares": 160,
      "horasExtras": 10,
      "totalHoras": 170,
      "montoBase": 3200.00,
      "bonificaciones": 500.00,
      "descuentos": 200.00,
      "totalNeto": 3500.00,
      "fechaEmision": "2025-02-05T00:00:00Z",
      "fechaPago": "2025-02-15T00:00:00Z"
    }
  ],
  "total": 12
}
```

**Estadísticas:**
```json
{
  "success": true,
  "data": {
    "ultimaPlanilla": {
      "periodo": "Enero 2025",
      "estado": "PAGADO",
      "totalNeto": 3500.00
    },
    "totalPercibidoAnio": 42000.00,
    "promedioMensual": 3500.00,
    "planillasPendientes": 1,
    "totalPlanillasAnio": 12
  }
}
```

## 🎨 Funcionalidades Frontend

### Página Principal (`/docente/planillas`)

**Estadísticas (4 tarjetas):**
- Última Planilla (monto y estado)
- Total Percibido Año
- Promedio Mensual
- Planillas Pendientes

**Filtros:**
- Año (dropdown con años disponibles)
- Mes (dropdown 1-12 + "Todos")
- Estado (TODOS | PENDIENTE | EN_PROCESO | PAGADO | ANULADO)
- Botón Limpiar

**Tabla:**
- Período (mes/año)
- Estado (badge con color)
- Horas Totales (con extras destacadas)
- Total Neto (formato moneda)
- Fecha de Pago
- Acciones:
  - Ver detalle
  - Descargar PDF (solo si PAGADO)

**Estados Visuales:**
- Loading (spinner)
- Empty state (sin datos)
- Error handling (toast)

### Página de Detalle (`/docente/planillas/[id]`)

**Secciones:**

1. **Header**
   - Título con período
   - Badge de estado
   - Botón descargar PDF

2. **Información del Docente**
   - Nombre completo
   - DNI
   - Email
   - Especialidad
   - Nivel educativo
   - Condición laboral
   - Régimen

3. **Resumen de Montos (4 cards)**
   - Monto Base
   - Bonificaciones
   - Descuentos
   - **Total Neto** (destacado en verde)

4. **Detalle de Horas**
   - Horas Regulares
   - Horas Extras
   - Total Horas
   - Valor por Hora

5. **Estadísticas de Asistencia (7 métricas)**
   - Total Días
   - Días Presente
   - Tardanzas
   - Ausencias
   - % Puntualidad
   - Min. Tardanza Total
   - Promedio Tardanza

6. **Detalle Diario (tabla completa)**
   - Fecha
   - Estado (badge)
   - Hora Entrada
   - Hora Salida
   - Horas Trabajadas
   - Horas Extras
   - Tardanza (minutos)
   - Observaciones

7. **Información Administrativa**
   - Fecha de Emisión
   - Fecha de Pago
   - Observaciones generales

## 🗄️ Modelo de Datos

### Tabla: planillas
```sql
- id: UUID (PK)
- usuario_id: UUID (FK -> usuarios)
- mes: INTEGER (1-12)
- anio: INTEGER (2020-2100)
- estado: VARCHAR(20) - PENDIENTE | EN_PROCESO | PAGADO | ANULADO
- horas_regulares: DECIMAL(6,2)
- horas_extras: DECIMAL(6,2)
- monto_base: DECIMAL(10,2)
- bonificaciones: DECIMAL(10,2)
- descuentos: DECIMAL(10,2)
- total_neto: DECIMAL(10,2) - Calculado automáticamente
- fecha_emision: TIMESTAMP
- fecha_pago: TIMESTAMP
- observaciones: TEXT
- created_at, updated_at
- created_by, updated_by: UUID (FK -> usuarios)

Constraints:
- UNIQUE (usuario_id, mes, anio)
- CHECK (mes >= 1 AND mes <= 12)
- CHECK (anio >= 2020 AND anio <= 2100)
```

### Tabla: detalle_planillas
```sql
- id: UUID (PK)
- planilla_id: UUID (FK -> planillas)
- asistencia_id: UUID (FK -> asistencias) [opcional]
- fecha: DATE
- horas_trabajadas: DECIMAL(4,2)
- horas_extras: DECIMAL(4,2)
- observaciones: TEXT
- created_at, updated_at
```

### Triggers
- `calcular_total_neto_planilla()` - Calcula automáticamente el total neto
- `actualizar_timestamp_planilla()` - Actualiza updated_at

## 🎯 Casos de Uso

### Docente: Consultar Planillas
1. Accede a `/docente/planillas`
2. Ve estadísticas generales
3. Aplica filtros (año, mes, estado)
4. Visualiza lista de planillas

### Docente: Ver Detalle
1. Click en "Ver" en una planilla
2. Navega a `/docente/planillas/[id]`
3. Ve información completa:
   - Datos personales
   - Desglose de montos
   - Estadísticas de asistencia
   - Detalle día por día

### Docente: Descargar Boleta
1. En lista o detalle
2. Click en "Descargar PDF"
3. Sistema valida estado = PAGADO
4. Descarga archivo PDF

### Admin: Generar Planilla (Futuro)
1. Accede a módulo admin
2. Selecciona mes/año
3. Selecciona docentes
4. Sistema calcula automáticamente:
   - Horas de asistencias
   - Bonificaciones según config
   - Descuentos aplicables
5. Genera planilla y detalle

## 🔐 Seguridad

### Autenticación
- JWT requerido en todas las rutas
- Middleware `authenticateToken`

### Autorización
- Middleware `requireDocente`
- Solo el docente propietario puede ver sus planillas
- Validación de acceso por `usuarioId`

### Validación de Datos
- Class-validator en DTOs
- Express-validator en rutas
- Constraints en base de datos

## 🧪 Datos de Prueba

El script `crear_planillas.sql` genera automáticamente:
- 3 planillas para el primer docente encontrado
- Estados variados: PENDIENTE, EN_PROCESO, PAGADO
- Detalles diarios con horas trabajadas
- Cálculos automáticos de montos

## 📊 Estadísticas y Métricas

### Calculadas Automáticamente
- Total horas = horas_regulares + horas_extras
- Total neto = monto_base + bonificaciones - descuentos
- % Puntualidad = (días presente / total días) * 100
- Promedio tardanza = total tardanza / días con tardanza

### Agregadas por Frontend
- Total percibido año
- Promedio mensual
- Planillas pendientes
- Racha actual sin tardanzas

## ⚡ Optimizaciones

### Índices en BD
```sql
idx_planillas_usuario              (usuario_id)
idx_planillas_periodo              (anio DESC, mes DESC)
idx_planillas_estado               (estado)
idx_planillas_usuario_periodo      (usuario_id, anio DESC, mes DESC)
idx_detalle_planillas_planilla     (planilla_id)
idx_detalle_planillas_fecha        (fecha)
```

### Consultas Optimizadas
- Select específico con includes limitados
- Ordenamiento por índices
- Paginación preparada (20 por página)
- Carga en paralelo (Promise.all)

### Frontend
- React Hook Form para formularios
- Lazy loading de detalle
- Caché de años disponibles
- Estados de loading/error

## 🐛 Manejo de Errores

### Backend
- Try-catch en todos los servicios
- AppError con códigos HTTP apropiados
- Logging de errores

### Frontend
- Toast notifications (sonner)
- Estados de error con UI dedicada
- Redirección en casos críticos
- Validación de parámetros

## 🚧 Pendientes

### Alta Prioridad
- [ ] Generación de PDF de boletas
- [ ] Módulo Admin para generar planillas
- [ ] Cálculo automático desde asistencias

### Media Prioridad
- [ ] Export a Excel
- [ ] Envío por email
- [ ] Notificaciones push
- [ ] Historial de cambios

### Baja Prioridad
- [ ] Gráficas de tendencias
- [ ] Comparativas entre meses
- [ ] Proyección anual
- [ ] Análisis predictivo

## 📞 Soporte

Para consultas o problemas:
1. Verificar logs del backend
2. Verificar console del frontend
3. Revisar datos en base de datos
4. Contactar a soporte técnico

## 📝 Changelog

### v1.0.0 (2025-01-12)
- ✅ Implementación completa de frontend
- ✅ Implementación completa de backend
- ✅ Scripts de base de datos
- ✅ Documentación

### Próxima Versión (v1.1.0)
- Generación de PDF
- Módulo de administración
- Tests unitarios e integración
