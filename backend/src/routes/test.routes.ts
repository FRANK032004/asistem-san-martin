import { Router } from 'express';
import { 
  obtenerUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  eliminarUbicacion,
  obtenerUbicacionPorId,
  obtenerHorarios,
  crearHorario,
  eliminarHorario
} from '../controllers/admin.controller';

const router = Router();

// Rutas temporales de ubicaciones SIN autenticación para pruebas
router.get('/ubicaciones-test', obtenerUbicaciones);
router.get('/ubicaciones-test/:id', obtenerUbicacionPorId);
router.post('/ubicaciones-test', crearUbicacion);
router.put('/ubicaciones-test/:id', actualizarUbicacion);
router.delete('/ubicaciones-test/:id', eliminarUbicacion);

// Rutas temporales de horarios SIN autenticación para pruebas
router.get('/horarios-test', obtenerHorarios);
router.post('/horarios-test', crearHorario);
router.delete('/horarios-test/:id', eliminarHorario);

export default router;