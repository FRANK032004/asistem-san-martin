import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableExtensions() {
  try {
    console.log('🔧 Habilitando extensiones de PostgreSQL...');
    
    // Habilitar uuid-ossp
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    console.log('✅ Extensión uuid-ossp habilitada');
    
    // Intentar habilitar PostGIS (puede fallar, no es crítico)
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "postgis";`);
      console.log('✅ Extensión postgis habilitada');
    } catch (e) {
      console.log('⚠️  PostGIS no disponible (opcional)');
    }
    
    console.log('✅ Extensiones configuradas correctamente');
  } catch (error) {
    console.error('❌ Error habilitando extensiones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enableExtensions();
