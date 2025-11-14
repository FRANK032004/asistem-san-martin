/**
 * Script para poblar base de datos con datos de prueba
 * Ejecutar con: npx ts-node database/seed-data.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...\n');

  // Hash para password 'docente123'
  const hashedPassword = await bcrypt.hash('docente123', 10);

  try {
    // 1. ÁREAS
    console.log('📚 Creando áreas académicas...');
    const areas = await Promise.all([
      prisma.area.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          nombre: 'Matemáticas',
          descripcion: 'Área de matemática y cálculo',
          jefeArea: 'Dr. Roberto Méndez',
          activo: true
        }
      }),
      prisma.area.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440002' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          nombre: 'Comunicación',
          descripcion: 'Área de lenguaje y comunicación',
          jefeArea: 'Lic. María Torres',
          activo: true
        }
      }),
      prisma.area.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440003' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440003',
          nombre: 'Ciencias Naturales',
          descripcion: 'Área de ciencias y biología',
          jefeArea: 'Ing. Carlos Ruiz',
          activo: true
        }
      }),
      prisma.area.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440004' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440004',
          nombre: 'Ciencias Sociales',
          descripcion: 'Área de historia y geografía',
          jefeArea: 'Lic. Ana Fernández',
          activo: true
        }
      }),
      prisma.area.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440005' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440005',
          nombre: 'Inglés',
          descripcion: 'Área de idioma inglés',
          jefeArea: 'Prof. John Smith',
          activo: true
        }
      }),
      prisma.area.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440006' },
        update: {},
        create: {
          id: '550e8400-e29b-41d4-a716-446655440006',
          nombre: 'Educación Física',
          descripcion: 'Área de deportes y actividad física',
          jefeArea: 'Prof. Luis Vargas',
          activo: true
        }
      })
    ]);
    console.log(`✅ ${areas.length} áreas creadas\n`);

    // 2. UBICACIONES GPS
    console.log('📍 Creando ubicaciones GPS...');
    const ubicaciones = await Promise.all([
      prisma.ubicacion.upsert({
        where: { id: '660e8400-e29b-41d4-a716-446655440001' },
        update: {},
        create: {
          id: '660e8400-e29b-41d4-a716-446655440001',
          nombre: 'Entrada Principal',
          latitud: -12.046374,
          longitud: -77.042793,
          radio: 50.0,
          descripcion: 'Puerta principal del instituto',
          activo: true
        }
      }),
      prisma.ubicacion.upsert({
        where: { id: '660e8400-e29b-41d4-a716-446655440002' },
        update: {},
        create: {
          id: '660e8400-e29b-41d4-a716-446655440002',
          nombre: 'Pabellón A',
          latitud: -12.046450,
          longitud: -77.042850,
          radio: 30.0,
          descripcion: 'Edificio administrativo y aulas 1-10',
          activo: true
        }
      }),
      prisma.ubicacion.upsert({
        where: { id: '660e8400-e29b-41d4-a716-446655440003' },
        update: {},
        create: {
          id: '660e8400-e29b-41d4-a716-446655440003',
          nombre: 'Pabellón B',
          latitud: -12.046520,
          longitud: -77.042750,
          radio: 30.0,
          descripcion: 'Aulas 11-20 y laboratorios',
          activo: true
        }
      }),
      prisma.ubicacion.upsert({
        where: { id: '660e8400-e29b-41d4-a716-446655440004' },
        update: {},
        create: {
          id: '660e8400-e29b-41d4-a716-446655440004',
          nombre: 'Pabellón C',
          latitud: -12.046300,
          longitud: -77.042900,
          radio: 30.0,
          descripcion: 'Talleres y biblioteca',
          activo: true
        }
      }),
      prisma.ubicacion.upsert({
        where: { id: '660e8400-e29b-41d4-a716-446655440005' },
        update: {},
        create: {
          id: '660e8400-e29b-41d4-a716-446655440005',
          nombre: 'Cancha Deportiva',
          latitud: -12.046600,
          longitud: -77.042650,
          radio: 40.0,
          descripcion: 'Área de educación física',
          activo: true
        }
      })
    ]);
    console.log(`✅ ${ubicaciones.length} ubicaciones creadas\n`);

    // 3. OBTENER ROL DOCENTE
    const rolDocente = await prisma.rol.findFirst({
      where: { nombre: { equals: 'DOCENTE', mode: 'insensitive' } }
    });

    if (!rolDocente) {
      throw new Error('Rol DOCENTE no encontrado');
    }

    // 4. USUARIOS DOCENTES
    console.log('👥 Creando usuarios docentes...');
    const usuariosDocentes = [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        dni: '12345678',
        nombres: 'María Elena',
        apellidos: 'García Rodríguez',
        email: 'maria.garcia@sanmartin.edu.pe',
        telefono: '987654321',
        direccion: 'Av. Los Olivos 123',
        fechaNacimiento: new Date('1985-03-15')
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        dni: '23456789',
        nombres: 'Carlos Alberto',
        apellidos: 'Mendoza Silva',
        email: 'carlos.mendoza@sanmartin.edu.pe',
        telefono: '987654322',
        direccion: 'Jr. Las Flores 456',
        fechaNacimiento: new Date('1982-07-22')
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440003',
        dni: '34567890',
        nombres: 'Ana Patricia',
        apellidos: 'Fernández Torres',
        email: 'ana.fernandez@sanmartin.edu.pe',
        telefono: '987654323',
        direccion: 'Calle Los Pinos 789',
        fechaNacimiento: new Date('1988-11-30')
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440004',
        dni: '45678901',
        nombres: 'Roberto',
        apellidos: 'Pérez Vargas',
        email: 'roberto.perez@sanmartin.edu.pe',
        telefono: '987654324',
        direccion: 'Av. Universitaria 234',
        fechaNacimiento: new Date('1980-05-10')
      }
    ];

    for (const userData of usuariosDocentes) {
      await prisma.usuario.upsert({
        where: { id: userData.id },
        update: {},
        create: {
          ...userData,
          password: hashedPassword,
          activo: true,
          rolId: rolDocente.id
        }
      });
    }
    console.log(`✅ ${usuariosDocentes.length} usuarios docentes creados\n`);

    // 5. DOCENTES
    console.log('👨‍🏫 Creando perfiles de docentes...');
    const docentes = [
      {
        id: '880e8400-e29b-41d4-a716-446655440001',
        codigoDocente: 'DOC002',
        usuarioId: '770e8400-e29b-41d4-a716-446655440001',
        areaId: '550e8400-e29b-41d4-a716-446655440001',
        especialidad: 'Cálculo Diferencial',
        fechaIngreso: new Date('2020-03-01'),
        sueldo: 2500.00,
        contactoEmergencia: 'Luis García',
        telefonoEmergencia: '987654301'
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440002',
        codigoDocente: 'DOC003',
        usuarioId: '770e8400-e29b-41d4-a716-446655440002',
        areaId: '550e8400-e29b-41d4-a716-446655440002',
        especialidad: 'Literatura Peruana',
        fechaIngreso: new Date('2019-08-15'),
        sueldo: 2600.00,
        contactoEmergencia: 'Rosa Mendoza',
        telefonoEmergencia: '987654302'
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440003',
        codigoDocente: 'DOC004',
        usuarioId: '770e8400-e29b-41d4-a716-446655440003',
        areaId: '550e8400-e29b-41d4-a716-446655440004',
        especialidad: 'Historia del Perú',
        fechaIngreso: new Date('2021-01-10'),
        sueldo: 2400.00,
        contactoEmergencia: 'Mario Fernández',
        telefonoEmergencia: '987654303'
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440004',
        codigoDocente: 'DOC005',
        usuarioId: '770e8400-e29b-41d4-a716-446655440004',
        areaId: '550e8400-e29b-41d4-a716-446655440003',
        especialidad: 'Biología Molecular',
        fechaIngreso: new Date('2018-06-20'),
        sueldo: 2800.00,
        contactoEmergencia: 'Carmen Pérez',
        telefonoEmergencia: '987654304'
      }
    ];

    for (const docenteData of docentes) {
      await prisma.docente.upsert({
        where: { id: docenteData.id },
        update: {},
        create: {
          ...docenteData,
          activo: true
        }
      });
    }
    console.log(`✅ ${docentes.length} docentes creados\n`);

    console.log('✨ Seed completado exitosamente!');
    
    // Mostrar resumen
    const counts = await prisma.$transaction([
      prisma.area.count(),
      prisma.ubicacion.count(),
      prisma.docente.count(),
      prisma.usuario.count({ where: { rolId: rolDocente.id } })
    ]);

    console.log('\n📊 Resumen de datos insertados:');
    console.log(`   • Áreas: ${counts[0]}`);
    console.log(`   • Ubicaciones GPS: ${counts[1]}`);
    console.log(`   • Docentes: ${counts[2]}`);
    console.log(`   • Usuarios Docentes: ${counts[3]}\n`);

  } catch (error) {
    console.error('❌ Error durante seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
