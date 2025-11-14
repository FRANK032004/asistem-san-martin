/**
 * Script para probar directamente los métodos de estadísticas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEstadisticas() {
  try {
    console.log('\n🔍 PROBANDO MÉTODOS DE ESTADÍSTICAS DIRECTAMENTE...\n');

    // Buscar docente
    const docente = await prisma.docentes.findFirst({
      where: { codigo_docente: 'DOC003' }
    });

    if (!docente) {
      console.log('❌ Docente no encontrado');
      return;
    }

    console.log('✅ Docente encontrado:', docente.id);

    // Probar query de estadísticas mensuales
    console.log('\n📊 Probando obtenerEstadisticasMes...');
    
    const inicioMes = new Date(2025, 10, 1); // Noviembre 2025
    const finMes = new Date(2025, 10, 30);

    console.log('Rango de fechas:');
    console.log('  Inicio:', inicioMes);
    console.log('  Fin:', finMes);

    // Contar asistencias
    const count = await prisma.asistencias.count({
      where: {
        docente_id: docente.id,
        fecha: { gte: inicioMes, lte: finMes },
        hora_entrada: { not: null }
      }
    });

    console.log('\n✅ Asistencias encontradas:', count);

    // Obtener detalle
    const asistencias = await prisma.asistencias.findMany({
      where: {
        docente_id: docente.id,
        fecha: { gte: inicioMes, lte: finMes }
      },
      orderBy: { fecha: 'asc' },
      select: {
        fecha: true,
        hora_entrada: true,
        hora_salida: true,
        tardanza_minutos: true
      }
    });

    console.log('\n✅ Detalle de asistencias:', asistencias.length, 'registros');
    
    if (asistencias.length > 0) {
      console.log('\nPrimera asistencia:');
      console.log(JSON.stringify(asistencias[0], null, 2));
    }

    // Probar query de comparativa
    console.log('\n\n📈 Probando obtenerComparativa...');
    
    const misPuntualidad = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as asistencias,
        COUNT(*) FILTER (WHERE tardanza_minutos > 0) as tardanzas,
        CASE 
          WHEN COUNT(*) > 0 THEN
            ROUND((COUNT(*) FILTER (WHERE tardanza_minutos = 0)::numeric / COUNT(*)::numeric) * 100, 2)
          ELSE 100
        END as puntualidad
      FROM asistencias
      WHERE docente_id = ${docente.id}
      AND fecha BETWEEN ${inicioMes} AND ${finMes}
      AND hora_entrada IS NOT NULL
    `;

    console.log('\n✅ Mi puntualidad:');
    console.log(JSON.stringify(misPuntualidad, null, 2));

    console.log('\n✅ TODO FUNCIONÓ CORRECTAMENTE');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testEstadisticas();
