const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function crearAsistenciasPrueba() {
  try {
    console.log('\n========== CREANDO ASISTENCIAS DE PRUEBA ==========\n');
    
    // 1. Obtener docente Carlos Rodríguez
    const docente = await prisma.docentes.findFirst({
      where: { codigo_docente: 'DOC003' }
    });
    
    if (!docente) {
      console.log('❌ Docente DOC003 no encontrado');
      return;
    }
    
    console.log(`✅ Docente encontrado: ${docente.id}`);
    
    // 2. Obtener ubicación permitida
    const ubicacion = await prisma.ubicaciones_permitidas.findFirst();
    
    if (!ubicacion) {
      console.log('❌ No hay ubicaciones permitidas');
      return;
    }
    
    console.log(`✅ Ubicación encontrada: ${ubicacion.nombre}`);
    
    // 3. Crear asistencias para los últimos 15 días de noviembre 2025
    const asistenciasCreadas = [];
    const hoy = new Date('2025-11-11'); // Fecha actual
    
    for (let i = 14; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      
      // Saltar fines de semana (sábado=6, domingo=0)
      if (fecha.getDay() === 0 || fecha.getDay() === 6) {
        continue;
      }
      
      // Generar tardanza aleatoria (0-20 minutos)
      const tardanzaMinutos = Math.floor(Math.random() * 21);
      const estado = tardanzaMinutos > 0 ? 'TARDANZA' : 'PRESENTE';
      
      // Hora de entrada (7:45 AM + tardanza)
      const horaEntrada = new Date(fecha);
      horaEntrada.setHours(7, 45 + tardanzaMinutos, 0, 0);
      
      // Hora de salida (4:30 PM)
      const horaSalida = new Date(fecha);
      horaSalida.setHours(16, 30, 0, 0);
      
      // Crear asistencia
      const asistencia = await prisma.asistencias.create({
        data: {
          docente_id: docente.id,
          fecha: fecha,
          hora_entrada: horaEntrada,
          hora_salida: horaSalida,
          tardanza_minutos: tardanzaMinutos,
          estado: estado,
          ubicacion_entrada_id: ubicacion.id,
          ubicacion_salida_id: ubicacion.id,
          latitud_entrada: parseFloat(ubicacion.latitud.toString()),
          longitud_entrada: parseFloat(ubicacion.longitud.toString()),
          latitud_salida: parseFloat(ubicacion.latitud.toString()),
          longitud_salida: parseFloat(ubicacion.longitud.toString())
        }
      });
      
      asistenciasCreadas.push(asistencia);
      
      console.log(`✅ ${fecha.toISOString().split('T')[0]} - ${estado} (${tardanzaMinutos}min)`);
    }
    
    console.log(`\n✅ Total asistencias creadas: ${asistenciasCreadas.length}`);
    
    // 4. Calcular estadísticas
    const totalTardanzas = asistenciasCreadas.filter(a => a.tardanza_minutos > 0).length;
    const puntualidad = ((asistenciasCreadas.length - totalTardanzas) / asistenciasCreadas.length * 100).toFixed(1);
    
    console.log(`\n📊 ESTADÍSTICAS:`);
    console.log(`   Total asistencias: ${asistenciasCreadas.length}`);
    console.log(`   Presente: ${asistenciasCreadas.length - totalTardanzas}`);
    console.log(`   Tardanzas: ${totalTardanzas}`);
    console.log(`   Puntualidad: ${puntualidad}%`);
    
    console.log(`\n✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE`);
    console.log(`   Ahora puedes acceder al módulo de estadísticas!`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

crearAsistenciasPrueba();
