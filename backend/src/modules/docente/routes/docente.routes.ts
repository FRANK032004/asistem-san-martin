/**
 * @module DocenteRoutes
 * @description Rutas de auto-gestión para docente autenticado
 * 
 * Responsabilidades:
 * - Gestión de perfil propio
 * - Consulta de horarios propios
 * - Dashboard personal
 * - Registro de asistencias con GPS
 * - Estadísticas personales
 * 
 * Requiere rol: DOCENTE
 * Solo permite operaciones sobre el usuario autenticado
 */

import express from 'express';
import {
  getMiPerfil,
  updateMiPerfil,
  getMisHorarios,
  getMiDashboard,
  registrarEntrada,
  registrarSalida,
  obtenerAsistenciaHoy,
  obtenerHistorialAsistencias
} from '../controllers/docente.controller';
// 🔥 Importar estadísticas desde docente-new.controller
import {
  obtenerEstadisticasMes,
  obtenerComparativa
} from '../controllers/docente-new.controller';
// 🔥 Importar justificaciones
import {
  crearJustificacion,
  listarMisJustificaciones,
  obtenerJustificacion,
  actualizarJustificacion,
  eliminarJustificacion,
  obtenerEstadisticas as obtenerEstadisticasJustificaciones
} from '../controllers/justificacion.controller';
import { authenticateToken, requireDocente } from '../../../shared/middleware/auth';
import { validateDTO } from '../../../shared/middleware/validate.middleware';
import { UpdateMiPerfilDocenteDTO } from '../dtos/docente.dto';
import { 
  RegistrarEntradaDTO, 
  RegistrarSalidaDTO,
  EstadisticasMesDTO,
  HistorialAsistenciasDTO
} from '../dtos/asistencia-docente.dto';
import {
  CrearJustificacionDTO,
  ActualizarJustificacionDTO
} from '../dtos/justificacion.dto';

const router = express.Router();

// ========================================
// RUTAS DEL DOCENTE AUTENTICADO
// ========================================

/**
 * GET /api/docente/mi-perfil
 * Obtener MI perfil completo
 * Acceso: Solo Docente autenticado
 * 
 * Retorna:
 * - Datos personales
 * - Datos de usuario
 * - Área asignada
 * - Estadísticas del mes actual
 */
router.get('/mi-perfil', 
  authenticateToken, 
  requireDocente,
  getMiPerfil
);

/**
 * PUT /api/docente/mi-perfil
 * Actualizar MI perfil (datos personales)
 * Acceso: Solo Docente autenticado
 * 
 * Campos permitidos (self-service):
 * - telefono
 * - direccion
 * - contacto_emergencia
 * - telefono_emergencia
 * 
 * Campos restringidos (solo admin):
 * - area
 * - sueldo
 * - codigo_docente
 */
router.put('/mi-perfil', 
  authenticateToken, 
  requireDocente,
  validateDTO(UpdateMiPerfilDocenteDTO),
  updateMiPerfil
);

/**
 * GET /api/docente/mis-horarios
 * Obtener MIS horarios asignados
 * Acceso: Solo Docente autenticado
 * 
 * Query params:
 * - activo: true|false (default: true)
 * 
 * Retorna:
 * - Lista de horarios
 * - Horarios agrupados por día
 * - Estadísticas semanales
 */
router.get('/mis-horarios', 
  authenticateToken, 
  requireDocente,
  getMisHorarios
);

/**
 * GET /api/docente/mi-dashboard
 * Obtener MI dashboard personal
 * Acceso: Solo Docente autenticado
 * 
 * Retorna:
 * - Estadísticas del mes
 * - Próximo horario
 * - Últimas 5 asistencias
 * - Justificaciones pendientes
 */
router.get('/mi-dashboard', 
  authenticateToken, 
  requireDocente,
  getMiDashboard
);

// ========================================
// RUTAS DE ASISTENCIAS CON GPS
// ========================================

/**
 * POST /api/docente/asistencia/entrada
 * Registrar entrada con GPS
 * Acceso: Solo Docente autenticado
 * 
 * Body:
 * - latitud: number
 * - longitud: number
 * - precision: number (metros)
 * - timestamp: number (milisegundos)
 * 
 * Validaciones:
 * - GPS dentro de ubicación permitida
 * - Precisión < 100 metros
 * - No más de 5 minutos de antigüedad
 * - Sin entrada previa hoy
 */
router.post('/asistencia/entrada',
  authenticateToken,
  requireDocente,
  validateDTO(RegistrarEntradaDTO),
  registrarEntrada
);

/**
 * POST /api/docente/asistencia/salida
 * Registrar salida con GPS
 * Acceso: Solo Docente autenticado
 * 
 * Body:
 * - latitud: number
 * - longitud: number
 * - precision: number (metros)
 * - timestamp: number (milisegundos)
 * 
 * Validaciones:
 * - GPS dentro de ubicación permitida
 * - Debe existir entrada previa
 * - Sin salida previa hoy
 */
router.post('/asistencia/salida',
  authenticateToken,
  requireDocente,
  validateDTO(RegistrarSalidaDTO),
  registrarSalida
);

/**
 * GET /api/docente/asistencia/hoy
 * Obtener asistencia de hoy
 * Acceso: Solo Docente autenticado
 * 
 * Retorna:
 * - Entrada registrada
 * - Salida registrada (si existe)
 * - Ubicaciones
 * - Estado (PRESENTE/TARDANZA)
 */
router.get('/asistencia/hoy',
  authenticateToken,
  requireDocente,
  obtenerAsistenciaHoy
);

/**
 * GET /api/docente/asistencia/historial
 * Obtener historial de asistencias
 * Acceso: Solo Docente autenticado
 * 
 * Query params:
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 * - fecha_inicio: YYYY-MM-DD (opcional)
 * - fecha_fin: YYYY-MM-DD (opcional)
 * 
 * Retorna:
 * - Lista de asistencias
 * - Paginación
 * - Total
 */
router.get('/asistencia/historial',
  authenticateToken,
  requireDocente,
  validateDTO(HistorialAsistenciasDTO),
  obtenerHistorialAsistencias
);

// ========================================
// RUTAS DE ESTADÍSTICAS
// ========================================

/**
 * GET /api/docente/estadisticas/mes
 * Obtener estadísticas mensuales
 * Acceso: Solo Docente autenticado
 * 
 * Query params:
 * - mes: number (1-12, opcional, default: mes actual)
 * - anio: number (opcional, default: año actual)
 * 
 * Retorna:
 * - Total asistencias
 * - Total tardanzas
 * - Puntualidad %
 * - Promedio tardanza
 * - Días trabajados
 */
router.get('/estadisticas/mes',
  authenticateToken,
  requireDocente,
  validateDTO(EstadisticasMesDTO),
  obtenerEstadisticasMes
);

/**
 * GET /api/docente/estadisticas/comparativa
 * Comparar mi puntualidad con promedio institucional
 * Acceso: Solo Docente autenticado
 * 
 * Retorna:
 * - Mi puntualidad %
 * - Promedio institucional %
 * - Diferencia
 * - Mensaje motivacional
 */
router.get('/estadisticas/comparativa',
  authenticateToken,
  requireDocente,
  obtenerComparativa
);

// ========================================
// RUTAS DE JUSTIFICACIONES
// ========================================

/**
 * POST /api/docente/justificaciones
 * Crear una nueva justificación
 * Acceso: Solo Docente autenticado
 * 
 * Body:
 * - asistenciaId?: string (opcional)
 * - fechaInicio: YYYY-MM-DD
 * - fechaFin: YYYY-MM-DD
 * - tipo: MEDICA | PERSONAL | FAMILIAR | CAPACITACION | OTRO
 * - motivo: string (min 20 caracteres)
 * - evidenciaUrl?: string (opcional)
 * - afectaPago?: boolean (opcional)
 * 
 * Validaciones:
 * - Fechas válidas
 * - No solapamiento con otras justificaciones
 * - Rango máximo 30 días
 * - Asistencia existe y pertenece al docente (si se proporciona)
 */
router.post('/justificaciones',
  authenticateToken,
  requireDocente,
  validateDTO(CrearJustificacionDTO),
  crearJustificacion
);

/**
 * GET /api/docente/justificaciones
 * Listar mis justificaciones con filtros
 * Acceso: Solo Docente autenticado
 * 
 * Query params:
 * - estado?: PENDIENTE | APROBADO | RECHAZADO
 * - tipo?: MEDICA | PERSONAL | FAMILIAR | CAPACITACION | OTRO
 * - fechaDesde?: YYYY-MM-DD
 * - fechaHasta?: YYYY-MM-DD
 * - page?: number (default: 1)
 * - limit?: number (default: 50, max: 100)
 * 
 * Retorna:
 * - data: Lista de justificaciones
 * - pagination: { page, limit, total, totalPages }
 */
router.get('/justificaciones',
  authenticateToken,
  requireDocente,
  listarMisJustificaciones
);

/**
 * GET /api/docente/justificaciones/estadisticas
 * Obtener estadísticas de justificaciones
 * Acceso: Solo Docente autenticado
 * 
 * Retorna:
 * - total: number
 * - pendientes: number
 * - aprobadas: number
 * - rechazadas: number
 * - tasaAprobacion: string (porcentaje)
 */
router.get('/justificaciones/estadisticas',
  authenticateToken,
  requireDocente,
  obtenerEstadisticasJustificaciones
);

/**
 * GET /api/docente/justificaciones/:id
 * Obtener detalle de una justificación
 * Acceso: Solo Docente autenticado (propietario)
 * 
 * Retorna:
 * - Justificación completa con relaciones
 * - Asistencia relacionada
 * - Datos del aprobador (si existe)
 */
router.get('/justificaciones/:id',
  authenticateToken,
  requireDocente,
  obtenerJustificacion
);

/**
 * PUT /api/docente/justificaciones/:id
 * Actualizar una justificación (solo si está PENDIENTE)
 * Acceso: Solo Docente autenticado (propietario)
 * 
 * Body:
 * - tipo?: MEDICA | PERSONAL | FAMILIAR | CAPACITACION | OTRO
 * - motivo?: string (min 20 caracteres)
 * - evidenciaUrl?: string
 * 
 * Validaciones:
 * - Estado PENDIENTE
 * - Ownership
 */
router.put('/justificaciones/:id',
  authenticateToken,
  requireDocente,
  validateDTO(ActualizarJustificacionDTO),
  actualizarJustificacion
);

/**
 * DELETE /api/docente/justificaciones/:id
 * Eliminar una justificación (solo si está PENDIENTE)
 * Acceso: Solo Docente autenticado (propietario)
 * 
 * Validaciones:
 * - Estado PENDIENTE
 * - Ownership
 */
router.delete('/justificaciones/:id',
  authenticateToken,
  requireDocente,
  eliminarJustificacion
);

export default router;
