/**
 * Setup global de tipos para Jest
 * Este archivo asegura que TypeScript reconozca las funciones globales de Jest
 */

import '@types/jest';

// Extender namespace global si es necesario
declare global {
  // Jest globals ya están disponibles vía @types/jest
  namespace jest {
    interface Matchers<R> {
      // Podemos agregar matchers personalizados aquí si es necesario
    }
  }
}

export {};
