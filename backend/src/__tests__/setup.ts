/**
 * Configuración global para tests
 * 
 * ESTRATEGIA: Usar base de datos real en modo test
 * - Más confiable que mocks
 * - Tests de integración reales
 * - Detecta problemas de BD temprano
 */

// Cargar variables de entorno ANTES de cualquier import
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde el directorio raíz del backend
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.PORT = '5001'; // Puerto diferente para tests

// Asegurar que JWT_SECRET está configurado
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
}

// Verificar DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada');
  process.exit(1);
}

// Timeout global para tests (algunos pueden tardar)
jest.setTimeout(30000);

// Configuración global para tests
beforeAll(async () => {
  // Setup global - la BD ya está conectada por el app
  console.log('🧪 Iniciando suite de tests...');
  console.log('📊 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@')); // Ocultar password
});

afterAll(async () => {
  // Cleanup global después de todos los tests
  console.log('✅ Tests completados');
});

export {};
