import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { 
  obtenerEstadisticasAdmin, 
  obtenerResumenActividad, 
  obtenerMetricasTiempoReal
} from '../controllers/dashboard.controller';
import { 
  obtenerEstadoDocentes, 
  exportarReporte,
  obtenerAsistencias,
  obtenerAsistenciasSemana,
  obtenerDistribucionPuntualidad
} from '../controllers/admin.controller';
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  toggleUsuarioStatus
} from '../controllers/usuario.controller';
import {
  obtenerConfiguraciones,
  actualizarConfiguraciones,
  obtenerConfiguracionPorClave,
  restaurarConfiguracionesDefecto
} from '../controllers/configuracion.controller';
import ubicacionRoutes from './ubicacion.routes';
import horarioRoutes from './horario.routes';

const router = Router();

// Middleware: Solo administradores pueden acceder
router.use(authenticateToken);
router.use(requireRole(['Administrador']));

// Rutas de dashboard y estadísticas
router.get('/estadisticas', obtenerEstadisticasAdmin);
router.get('/resumen-actividad', obtenerResumenActividad);
router.get('/metricas-tiempo-real', obtenerMetricasTiempoReal);

// Rutas para gráficos del dashboard
router.get('/graficos/asistencias-semana', obtenerAsistenciasSemana);
router.get('/graficos/distribucion-puntualidad', obtenerDistribucionPuntualidad);

// Rutas de administración general
router.get('/docentes/estado', obtenerEstadoDocentes);
router.get('/asistencias', obtenerAsistencias);
router.post('/reportes/exportar', exportarReporte);

// Rutas de gestión de usuarios
router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id', getUsuarioById);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuario);
router.delete('/usuarios/:id', deleteUsuario);
router.put('/usuarios/:id/toggle-status', toggleUsuarioStatus);

// Rutas de configuraciones del sistema
router.get('/configuraciones', obtenerConfiguraciones);
router.put('/configuraciones', actualizarConfiguraciones);
router.get('/configuraciones/:clave', obtenerConfiguracionPorClave);
router.post('/configuraciones/restaurar', restaurarConfiguracionesDefecto);

// Rutas modulares - Gestión de ubicaciones GPS
router.use('/ubicaciones', ubicacionRoutes);

// Rutas modulares - Gestión de horarios académicos
router.use('/horarios', horarioRoutes);

export default router;