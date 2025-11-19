/**
 * @module AdminModule
 * @description Punto de entrada del módulo administrativo
 * 
 * Exporta todas las rutas, controllers, DTOs y services del módulo admin
 */

// Exportar rutas
export { default as gestionDocentesRoutes } from './routes/gestion-docentes.routes';

// Exportar controllers
export * from './controllers/gestion-docentes.controller';

// Exportar DTOs
export * from './dtos/gestion-docentes.dto';
