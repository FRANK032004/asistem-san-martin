/**
 * @module DocenteModule
 * @description Punto de entrada del módulo de auto-gestión docente
 * 
 * Exporta todas las rutas, controllers, DTOs y services del módulo docente
 */

// Exportar rutas
export { default as docenteRoutes } from './routes/docente.routes';

// Exportar controllers
export * from './controllers/docente.controller';

// Exportar DTOs
export * from './dtos/docente.dto';
