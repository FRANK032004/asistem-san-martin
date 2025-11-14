const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarUbicaciones() {
  try {
    const ubicaciones = await prisma.ubicaciones_permitidas.findMany();
    
    console.log('\n========== UBICACIONES PERMITIDAS ==========\n');
    
    if (ubicaciones.length === 0) {
      console.log('❌ NO HAY UBICACIONES CONFIGURADAS');
      console.log('\n⚠️  Esto causa el error: "Ubicación fuera del rango permitido"');
      console.log('\n💡 SOLUCIÓN: Necesitas insertar al menos una ubicación en la tabla ubicaciones_permitidas');
      console.log('\nEjemplo SQL:');
      console.log(`
INSERT INTO ubicaciones_permitidas (nombre, latitud, longitud, radio_metros, activo)
VALUES ('Colegio San Martín', -12.0464, -77.0428, 200, true);
      `);
    } else {
      console.log(`✅ Total: ${ubicaciones.length} ubicación(es) configurada(s)\n`);
      ubicaciones.forEach((u, i) => {
        console.log(`${i + 1}. ${u.nombre}`);
        console.log(`   📍 Coordenadas: ${u.latitud}, ${u.longitud}`);
        console.log(`   📏 Radio permitido: ${u.radio_metros}m`);
        console.log(`   🟢 Activo: ${u.activo ? 'Sí' : 'No'}\n`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarUbicaciones();
