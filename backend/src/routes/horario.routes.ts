import { Router } from 'express';
import { 
  obtenerHorarios, 
  crearHorario, 
  eliminarHorario 
} from '../controllers/horario.controller';
import { validateDTO } from '../middleware/validate.middleware';
import { CreateHorarioDTO } from '../dtos/admin.dto';

const router = Router();

/**
 * @route GET /api/horarios
 * @description Obtener todos los horarios académicos
 * @access Admin
 */
router.get('/', obtenerHorarios);

/**
 * @route POST /api/horarios
 * @description Crear nuevo horario académico
 * @access Admin
 */
router.post('/', validateDTO(CreateHorarioDTO), crearHorario);

/**
 * @route DELETE /api/horarios/:id
 * @description Eliminar horario académico
 * @access Admin
 */
router.delete('/:id', eliminarHorario);

export default router;