import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireDocente } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { Request, Response } from 'express';

const router = express.Router();

// Controlador simple para pruebas
const registrarEntrada = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Entrada registrada correctamente',
      data: {
        latitud: req.body.latitud,
        longitud: req.body.longitud,
        fechaHora: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar entrada'
    });
  }
};

const registrarSalida = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Salida registrada correctamente',
      data: {
        latitud: req.body.latitud,
        longitud: req.body.longitud,
        fechaHora: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar salida'
    });
  }
};

const obtenerAsistenciasHoy = async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Asistencias obtenidas',
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener asistencias'
    });
  }
};

// Validaciones
const registroAsistenciaValidation = [
  body('latitud')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud debe estar entre -90 y 90'),
  body('longitud')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud debe estar entre -180 y 180'),
];

/**
 * POST /api/asistencia/entrada
 * Registrar entrada con validación GPS
 * Acceso: Solo Docentes
 */
router.post('/entrada', 
  authenticateToken, 
  requireDocente, 
  registroAsistenciaValidation, 
  handleValidationErrors,
  registrarEntrada
);

/**
 * POST /api/asistencia/salida
 * Registrar salida con validación GPS
 * Acceso: Solo Docentes
 */
router.post('/salida', 
  authenticateToken, 
  requireDocente, 
  registroAsistenciaValidation, 
  handleValidationErrors,
  registrarSalida
);

/**
 * GET /api/asistencia/hoy
 * Obtener asistencia del día actual
 * Acceso: Solo Docentes (su propia asistencia)
 */
router.get('/hoy', 
  authenticateToken, 
  requireDocente, 
  obtenerAsistenciasHoy
);

export default router;
