/**
 * Mock de Prisma Client para Testing
 * Simula las operaciones de base de datos sin conexión real
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Crear mock profundo de PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Resetear el mock antes de cada test
beforeEach(() => {
  mockReset(prismaMock);
});

export default prismaMock;
