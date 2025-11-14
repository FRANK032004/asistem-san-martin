const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticoEstadisticas() {
  try {
    console.log('\n========== DIAGNÓSTICO: MÓDULO ESTADÍSTICAS ==========\n');
    
    // 1. Verificar docentes en BD
    const docentes = await prisma.docentes.count();
    console.log(`✅ Total docentes en BD: ${docentes}`);
    
    // 2. Verificar asistencias
    const asistencias = await prisma.asistencias.count();
    console.log(`✅ Total asistencias registradas: ${asistencias}`);
    
    // 3. Verificar asistencias de noviembre 2025
    const ahora = new Date();
    const primerDia = new Date(2025, 10, 1); // Noviembre 2025
    const ultimoDia = new Date(2025, 10, 30);
    
    const asistenciasNoviembre = await prisma.asistencias.count({
      where: {
        fecha: {
          gte: primerDia,
          lte: ultimoDia
        }
      }
    });
    
    console.log(`✅ Asistencias en Noviembre 2025: ${asistenciasNoviembre}`);
    
    // 4. Verificar docente específico (Carlos Rodríguez)
    const docenteCarlos = await prisma.docentes.findFirst({
      where: {
        codigo_docente: 'DOC003'
      },
      include: {
        usuarios: {
          select: {
            nombres: true,
            apellidos: true,
            email: true
          }
        },
        _count: {
          select: {
            asistencias: true
          }
        }
      }
    });
    
    if (docenteCarlos) {
      console.log(`\n✅ Docente encontrado: ${docenteCarlos.usuarios.nombres} ${docenteCarlos.usuarios.apellidos}`);
      console.log(`   Email: ${docenteCarlos.usuarios.email}`);
      console.log(`   Total asistencias: ${docenteCarlos._count.asistencias}`);
      
      // 5. Ver últimas 5 asistencias
      const ultimasAsistencias = await prisma.asistencias.findMany({
        where: {
          docente_id: docenteCarlos.id
        },
        orderBy: {
          fecha: 'desc'
        },
        take: 5,
        select: {
          fecha: true,
          hora_entrada: true,
          hora_salida: true,
          tardanza_minutos: true,
          estado: true
        }
      });
      
      if (ultimasAsistencias.length > 0) {
        console.log(`\n📊 Últimas 5 asistencias:`);
        ultimasAsistencias.forEach((a, i) => {
          console.log(`   ${i + 1}. ${a.fecha.toISOString().split('T')[0]} - ${a.estado} (Tardanza: ${a.tardanza_minutos}min)`);
        });
      } else {
        console.log(`\n⚠️  Este docente NO tiene asistencias registradas`);
      }
    } else {
      console.log(`\n❌ Docente DOC003 no encontrado`);
    }
    
    // 6. Verificar ubicaciones_permitidas
    const ubicaciones = await prisma.ubicaciones_permitidas.count();
    console.log(`\n✅ Ubicaciones permitidas: ${ubicaciones}`);
    
    // 7. Verificar horarios_base
    const horarios = await prisma.horarios_base.count();
    console.log(`✅ Horarios configurados: ${horarios}`);
    
    console.log('\n========== RESUMEN ==========');
    
    if (docentes === 0) {
      console.log('❌ NO HAY DOCENTES en la base de datos');
      console.log('   Solución: Ejecutar seed-data.ts o insertar docentes manualmente');
    } else if (asistencias === 0) {
      console.log('❌ NO HAY ASISTENCIAS registradas');
      console.log('   Solución: Registrar al menos una asistencia desde el frontend');
    } else if (asistenciasNoviembre === 0) {
      console.log('⚠️  NO HAY ASISTENCIAS en Noviembre 2025');
      console.log('   El módulo de estadísticas mostrará datos vacíos');
      console.log('   Solución: Registrar asistencias o ajustar fechas de prueba');
    } else {
      console.log('✅ TODO CORRECTO: Hay datos suficientes para mostrar estadísticas');
    }
    
    console.log('\n');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    process.exit(1);
  }
}

diagnosticoEstadisticas();
