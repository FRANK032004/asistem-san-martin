/**
 * Singleton de Prisma para Testing
 * Intercepta las importaciones de Prisma y retorna el mock
 */

import prismaMock from './prisma';

// Mock del módulo completo de Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
}));

// Exportar el mock para uso en tests
export const prisma = prismaMock;
export default prismaMock;
