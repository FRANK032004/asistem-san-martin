import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear usuario admin
  console.log('📝 Creando usuario administrador...');
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.usuarios.upsert({
    where: { email: 'admin@sanmartin.edu.pe' },
    update: {},
    create: {
      dni: '00000000',
      nombres: 'Administrador',
      apellidos: 'Sistema',
      email: 'admin@sanmartin.edu.pe',
      password_hash: hashedPasswordAdmin,
      telefono: '999999999',
      activo: true,
      rol_id: 1, // Rol Admin
    },
  });
  console.log('✅ Usuario admin creado:', admin.email);

  // 2. Crear áreas académicas
  console.log('📚 Creando áreas académicas...');
  const areas = await Promise.all([
    prisma.areas.create({
      data: {
        nombre: 'Matemáticas',
        descripcion: 'Área de matemática y cálculo',
        activo: true,
      },
    }),
    prisma.areas.create({
      data: {
        nombre: 'Comunicación',
        descripcion: 'Área de lenguaje y comunicación',
        activo: true,
      },
    }),
    prisma.areas.create({
      data: {
        nombre: 'Ciencias Naturales',
        descripcion: 'Área de ciencias y biología',
        activo: true,
      },
    }),
    prisma.areas.create({
      data: {
        nombre: 'Ciencias Sociales',
        descripcion: 'Área de historia y geografía',
        activo: true,
      },
    }),
    prisma.areas.create({
      data: {
        nombre: 'Inglés',
        descripcion: 'Área de idioma inglés',
        activo: true,
      },
    }),
    prisma.areas.create({
      data: {
        nombre: 'Educación Física',
        descripcion: 'Área de deportes y actividad física',
        activo: true,
      },
    }),
  ]);
  console.log(`✅ ${areas.length} áreas académicas creadas`);

  // 3. Crear ubicaciones GPS
  console.log('📍 Creando ubicaciones GPS...');
  const ubicaciones = await Promise.all([
    prisma.ubicaciones_permitidas.create({
      data: {
        nombre: 'Entrada Principal',
        latitud: -12.046374,
        longitud: -77.042793,
        radio_metros: 50,
        descripcion: 'Puerta principal del instituto',
        activo: true,
      },
    }),
    prisma.ubicaciones_permitidas.create({
      data: {
        nombre: 'Pabellón A',
        latitud: -12.046450,
        longitud: -77.042850,
        radio_metros: 30,
        descripcion: 'Edificio administrativo y aulas 1-10',
        activo: true,
      },
    }),
    prisma.ubicaciones_permitidas.create({
      data: {
        nombre: 'Pabellón B',
        latitud: -12.046520,
        longitud: -77.042750,
        radio_metros: 30,
        descripcion: 'Aulas 11-20 y laboratorios',
        activo: true,
      },
    }),
    prisma.ubicaciones_permitidas.create({
      data: {
        nombre: 'Pabellón C',
        latitud: -12.046300,
        longitud: -77.042900,
        radio_metros: 30,
        descripcion: 'Talleres y biblioteca',
        activo: true,
      },
    }),
    prisma.ubicaciones_permitidas.create({
      data: {
        nombre: 'Cancha Deportiva',
        latitud: -12.046600,
        longitud: -77.042650,
        radio_metros: 40,
        descripcion: 'Área de educación física',
        activo: true,
      },
    }),
  ]);
  console.log(`✅ ${ubicaciones.length} ubicaciones GPS creadas`);

  // 4. Crear usuarios docentes
  console.log('👨‍🏫 Creando usuarios docentes...');
  const hashedPasswordDocente = await bcrypt.hash('docente123', 10);
  
  const usuariosDocentes = await Promise.all([
    prisma.usuarios.create({
      data: {
        dni: '12345678',
        nombres: 'María Elena',
        apellidos: 'García Rodríguez',
        email: 'maria.garcia@sanmartin.edu.pe',
        password_hash: hashedPasswordDocente,
        telefono: '987654321',
        activo: true,
        rol_id: 2, // Rol Docente
      },
    }),
    prisma.usuarios.create({
      data: {
        dni: '23456789',
        nombres: 'Carlos Alberto',
        apellidos: 'Mendoza Silva',
        email: 'carlos.mendoza@sanmartin.edu.pe',
        password_hash: hashedPasswordDocente,
        telefono: '987654322',
        activo: true,
        rol_id: 2,
      },
    }),
    prisma.usuarios.create({
      data: {
        dni: '34567890',
        nombres: 'Ana Patricia',
        apellidos: 'Fernández Torres',
        email: 'ana.fernandez@sanmartin.edu.pe',
        password_hash: hashedPasswordDocente,
        telefono: '987654323',
        activo: true,
        rol_id: 2,
      },
    }),
  ]);
  console.log(`✅ ${usuariosDocentes.length} usuarios docentes creados`);

  // 5. Crear docentes vinculados a usuarios
  console.log('📋 Creando perfiles de docentes...');
  const docentes = await Promise.all([
    prisma.docentes.create({
      data: {
        codigo_docente: 'DOC002',
        usuario_id: usuariosDocentes[0].id,
        area_id: areas[0].id, // Matemáticas
        fecha_ingreso: new Date('2020-03-01'),
        sueldo: 2500.00,
        contacto_emergencia: 'Luis García',
        telefono_emergencia: '987654301',
        estado: 'activo',
      },
    }),
    prisma.docentes.create({
      data: {
        codigo_docente: 'DOC003',
        usuario_id: usuariosDocentes[1].id,
        area_id: areas[1].id, // Comunicación
        fecha_ingreso: new Date('2019-08-15'),
        sueldo: 2600.00,
        contacto_emergencia: 'Rosa Mendoza',
        telefono_emergencia: '987654302',
        estado: 'activo',
      },
    }),
    prisma.docentes.create({
      data: {
        codigo_docente: 'DOC004',
        usuario_id: usuariosDocentes[2].id,
        area_id: areas[3].id, // Ciencias Sociales
        fecha_ingreso: new Date('2021-01-10'),
        sueldo: 2400.00,
        contacto_emergencia: 'Mario Fernández',
        telefono_emergencia: '987654303',
        estado: 'activo',
      },
    }),
  ]);
  console.log(`✅ ${docentes.length} perfiles de docentes creados`);

  // 6. Crear horarios base para docentes
  console.log('⏰ Creando horarios base...');
  const horariosBase = await Promise.all([
    // María García - Matemáticas (Lunes, Miércoles, Viernes)
    prisma.horarios_base.create({
      data: {
        docente_id: docentes[0].id,
        dia_semana: 1, // Lunes
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        area_id: areas[0].id,
        tipo_clase: 'teorica',
        horas_semana: 2,
        activo: true,
        fecha_vigencia: new Date(),
      },
    }),
    prisma.horarios_base.create({
      data: {
        docente_id: docentes[0].id,
        dia_semana: 3, // Miércoles
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        area_id: areas[0].id,
        tipo_clase: 'teorica',
        horas_semana: 2,
        activo: true,
        fecha_vigencia: new Date(),
      },
    }),
    prisma.horarios_base.create({
      data: {
        docente_id: docentes[0].id,
        dia_semana: 5, // Viernes
        hora_inicio: '10:00:00',
        hora_fin: '12:00:00',
        area_id: areas[0].id,
        tipo_clase: 'practica',
        horas_semana: 2,
        activo: true,
        fecha_vigencia: new Date(),
      },
    }),
    // Carlos Mendoza - Comunicación (Martes, Jueves)
    prisma.horarios_base.create({
      data: {
        docente_id: docentes[1].id,
        dia_semana: 2, // Martes
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        area_id: areas[1].id,
        tipo_clase: 'teorica',
        horas_semana: 2,
        activo: true,
        fecha_vigencia: new Date(),
      },
    }),
    prisma.horarios_base.create({
      data: {
        docente_id: docentes[1].id,
        dia_semana: 4, // Jueves
        hora_inicio: '08:00:00',
        hora_fin: '10:00:00',
        area_id: areas[1].id,
        tipo_clase: 'teorica',
        horas_semana: 2,
        activo: true,
        fecha_vigencia: new Date(),
      },
    }),
    // Ana Fernández - Ciencias Sociales (Lunes, Miércoles)
    prisma.horarios_base.create({
      data: {
        docente_id: docentes[2].id,
        dia_semana: 1, // Lunes
        hora_inicio: '14:00:00',
        hora_fin: '16:00:00',
        area_id: areas[3].id,
        tipo_clase: 'teorica',
        horas_semana: 2,
        activo: true,
        fecha_vigencia: new Date(),
      },
    }),
    prisma.horarios_base.create({
      data: {
        docente_id: docentes[2].id,
        dia_semana: 3, // Miércoles
        hora_inicio: '14:00:00',
        hora_fin: '16:00:00',
        area_id: areas[3].id,
        tipo_clase: 'practica',
        horas_semana: 2,
        activo: true,
        fecha_vigencia: new Date(),
      },
    }),
  ]);
  console.log(`✅ ${horariosBase.length} horarios base creados`);

  console.log('');
  console.log('🎉 ¡Seed completado exitosamente!');
  console.log('');
  console.log('📊 Resumen:');
  console.log(`   • 1 usuario admin`);
  console.log(`   • ${areas.length} áreas académicas`);
  console.log(`   • ${ubicaciones.length} ubicaciones GPS`);
  console.log(`   • ${usuariosDocentes.length} usuarios docentes`);
  console.log(`   • ${docentes.length} perfiles de docentes`);
  console.log(`   • ${horariosBase.length} horarios base`);
  console.log('');
  console.log('🔑 Credenciales de acceso:');
  console.log('   Admin: admin@sanmartin.edu.pe / admin123');
  console.log('   Docente: maria.garcia@sanmartin.edu.pe / docente123');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
