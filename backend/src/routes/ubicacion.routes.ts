import { Router } from 'express';
import { 
  obtenerUbicaciones, 
  crearUbicacion, 
  actualizarUbicacion, 
  eliminarUbicacion, 
  obtenerUbicacionPorId 
} from '../controllers/ubicacion.controller';
import { validateDTO } from '../middleware/validate.middleware';
import { CreateUbicacionDTO, UpdateUbicacionDTO } from '../dtos/admin.dto';

const router = Router();

/**
 * @route GET /api/ubicaciones
 * @description Obtener todas las ubicaciones GPS
 * @access Admin
 */
router.get('/', obtenerUbicaciones);

/**
 * @route POST /api/ubicaciones
 * @description Crear nueva ubicación GPS
 * @access Admin
 */
router.post('/', validateDTO(CreateUbicacionDTO), crearUbicacion);

/**
 * @route GET /api/ubicaciones/:id
 * @description Obtener ubicación por ID
 * @access Admin
 */
router.get('/:id', obtenerUbicacionPorId);

/**
 * @route PUT /api/ubicaciones/:id
 * @description Actualizar ubicación GPS
 * @access Admin
 */
router.put('/:id', validateDTO(UpdateUbicacionDTO), actualizarUbicacion);

/**
 * @route DELETE /api/ubicaciones/:id
 * @description Eliminar ubicación GPS
 * @access Admin
 */
router.delete('/:id', eliminarUbicacion);

export default router;