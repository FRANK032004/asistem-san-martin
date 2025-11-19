/**
 * Utilidades para tests de autenticación
 */

import request from 'supertest';
import app from '../../index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Crea un usuario de prueba
 */
export async function createTestUser(overrides: any = {}) {
  const defaultPassword = 'Test123!';
  const password_hash = await bcrypt.hash(defaultPassword, 10);

  // Asegurar que existe el rol DOCENTE
  let rol = await prisma.roles.findFirst({ where: { nombre: 'DOCENTE' } });
  
  if (!rol) {
    rol = await prisma.roles.create({
      data: {
        nombre: 'DOCENTE',
        descripcion: 'Rol de docente',
        permisos: ['asistencia.crear', 'asistencia.ver'],
      },
    });
  }

  // Generar DNI único con timestamp y random
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const uniqueDni = overrides.dni || `${timestamp}${random}`.slice(0, 8);

  const usuario = await prisma.usuarios.create({
    data: {
      dni: uniqueDni,
      nombres: overrides.nombres || 'Test',
      apellidos: overrides.apellidos || 'Usuario',
      email: overrides.email || `test${timestamp}${random}@test.com`,
      telefono: overrides.telefono || '987654321',
      password_hash,
      rol_id: rol.id,
      activo: overrides.activo !== undefined ? overrides.activo : true,
      intentos_fallidos: overrides.intentos_fallidos || 0,
      ...overrides,
    },
  });

  return { usuario, plainPassword: defaultPassword };
}

/**
 * Crea un usuario ADMIN de prueba
 */
export async function createTestAdmin(overrides: any = {}) {
  const defaultPassword = 'Admin123!';
  const password_hash = await bcrypt.hash(defaultPassword, 10);

  // Asegurar que existe el rol ADMIN
  let rol = await prisma.roles.findFirst({ where: { nombre: 'ADMIN' } });
  
  if (!rol) {
    rol = await prisma.roles.create({
      data: {
        nombre: 'ADMIN',
        descripcion: 'Rol de administrador',
        permisos: ['*'],
      },
    });
  }

  const usuario = await prisma.usuarios.create({
    data: {
      dni: overrides.dni || `1234567${Date.now().toString().slice(-2)}`,
      nombres: overrides.nombres || 'Admin',
      apellidos: overrides.apellidos || 'Test',
      email: overrides.email || `admin${Date.now()}@test.com`,
      telefono: overrides.telefono || '912345678',
      password_hash,
      rol_id: rol.id,
      activo: overrides.activo !== undefined ? overrides.activo : true,
      intentos_fallidos: overrides.intentos_fallidos || 0,
      ...overrides,
    },
  });

  return { usuario, plainPassword: defaultPassword };
}

/**
 * Login y obtener token
 */
export async function loginAndGetToken(email: string, password: string) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response.body.data?.accessToken || null;
}

/**
 * Limpia todos los usuarios de prueba
 */
export async function cleanTestUsers() {
  try {
    // Eliminar usuarios de prueba por email
    await prisma.usuarios.deleteMany({
      where: {
        OR: [
          { email: { contains: '@test.com' } },
          { email: { contains: 'test@sanmartin' } },
          { email: { contains: 'admin@test.com' } },
          { email: { contains: 'login.test' } },
          { email: { contains: 'wrong.password' } },
          { email: { contains: 'inactive' } },
          { email: { contains: 'intentos.test' } },
          { email: { contains: 'bloqueo.test' } },
          { email: { contains: 'email-invalido' } },
          { email: { contains: 'mayusculas' } },
          { email: { contains: 'reset.intentos' } },
          { email: { contains: 'jwt.valid' } },
          { email: { contains: 'jwt.admin' } },
          { dni: { startsWith: '17' } }, // DNI que empiezan con timestamp
        ],
      },
    });
  } catch (error) {
    console.warn('Error limpiando usuarios de test:', error);
  }
}

/**
 * Cierra la conexión de Prisma
 */
export async function closeConnection() {
  await prisma.$disconnect();
}
