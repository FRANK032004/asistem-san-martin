/**
 * Configuración centralizada de la API
 * Usar esta constante en TODOS los archivos que hagan requests al backend
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Versión sin /api para casos específicos
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
