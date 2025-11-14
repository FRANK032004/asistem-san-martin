/**
 * Script para probar el endpoint de estadísticas directamente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEstadisticas() {
  try {
    console.log('\n🔍 PROBANDO ESTADÍSTICAS...\n');

    // Buscar docente
    const docente = await prisma.docentes.findFirst({
      where: { codigo_docente: 'DOC003' }
    });

    if (!docente) {
      console.log('❌ Docente no encontrado');
      return;
    }

    console.log('✅ Docente encontrado:', docente.id);
    console.log('   Nombre:', docente.nombres, docente.apellidos);

    // Importar el servicio
    const { estadisticasService } = require('../src/modules/docente/services/estadisticas.service.ts');

    // Probar el método
    console.log('\n📊 Llamando a obtenerEstadisticasMes...');
    const resultado = await estadisticasService.obtenerEstadisticasMes(docente.id, 11, 2025);

    console.log('\n✅ RESULTADO:');
    console.log(JSON.stringify(resultado, null, 2));

    // Verificar estructura
    console.log('\n🔍 VALIDACIÓN DE ESTRUCTURA:');
    console.log('   ¿Tiene periodo?:', !!resultado.periodo);
    console.log('   ¿Tiene estadisticas?:', !!resultado.estadisticas);
    console.log('   ¿Tiene detallePorDia?:', !!resultado.detallePorDia);
    console.log('   Cantidad de días:', resultado.detallePorDia?.length || 0);

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testEstadisticas();
