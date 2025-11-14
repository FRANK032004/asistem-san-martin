import { Router } from 'express';
import {
  obtenerAreas,
  obtenerAreaPorId,
  crearArea,
  actualizarArea,
  eliminarArea,
  cambiarEstadoArea
} from '../controllers/area.controller';
import { validateDTO } from '../middleware/validate.middleware';
import { CreateAreaDTO, UpdateAreaDTO } from '../dtos/admin.dto';

const router = Router();

// Rutas de áreas
router.get('/', obtenerAreas);
router.get('/:id', obtenerAreaPorId);
router.post('/', validateDTO(CreateAreaDTO), crearArea);
router.put('/:id', validateDTO(UpdateAreaDTO), actualizarArea);
router.delete('/:id', eliminarArea);
router.patch('/:id/estado', cambiarEstadoArea);

export default router;
