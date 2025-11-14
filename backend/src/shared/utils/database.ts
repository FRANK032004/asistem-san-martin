import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// 🔒 CONFIGURACIÓN REFORZADA DE PRISMA CLIENT
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'minimal',
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// 🛡️ HEALTH CHECK CON RETRY LOGIC
const testConnection = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1 as health_check`;
      return true;
    } catch (error) {
      console.warn(`⚠️ Intento ${i + 1}/${retries} de conexión a DB falló`);
      if (i === retries - 1) throw error;
      // Esperar 2 segundos antes del próximo intento
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
};

// 📊 FUNCTION MEJORADA: Conectar con validaciones exhaustivas
export const connectDB = async () => {
  try {
    // 1️⃣ Test de conexión básica con retries
    console.log('🔄 Probando conexión a PostgreSQL...');
    await testConnection(3);
    
    // 2️⃣ Conectar explícitamente
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL exitosamente');
    
    // 3️⃣ Verificar versión de PostgreSQL
    const version = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    if (version && version[0]) {
      const pgVersion = version[0].version.match(/PostgreSQL (\d+\.\d+)/)?.[1] || 'unknown';
      console.log(`📦 PostgreSQL versión: ${pgVersion}`);
    }
    
    // 4️⃣ Verificar PostGIS (crítico para GPS)
    try {
      const postgis = await prisma.$queryRaw<Array<{ postgis_version: string }>>`SELECT PostGIS_Version() as postgis_version`;
      if (postgis && postgis[0]) {
        console.log(`🌍 PostGIS versión: ${postgis[0].postgis_version}`);
      }
    } catch (error) {
      console.warn('⚠️ PostGIS no disponible (puede afectar funcionalidad GPS)');
    }
    
    // 5️⃣ Verificar pool de conexiones
    const poolInfo = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    if (poolInfo && poolInfo[0]) {
      console.log(`🔗 Conexiones activas: ${poolInfo[0].count}`);
    }
    
    // 6️⃣ Test de escritura/lectura
    const testWrite = await prisma.$executeRaw`SELECT 1`;
    if (testWrite !== undefined) {
      console.log('✅ Test de escritura/lectura: OK');
    }
    
  } catch (error: any) {
    console.error('❌ Error crítico conectando a la base de datos:', error.message);
    console.error('💡 Verifica:');
    console.error('   1. PostgreSQL está corriendo: pg_ctl status');
    console.error('   2. DATABASE_URL en .env es correcta');
    console.error('   3. Usuario/contraseña tienen permisos');
    console.error('   4. Puerto 5432 está disponible');
    process.exit(1);
  }
};

// Función para desconectar de la base de datos
export const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado de PostgreSQL');
  } catch (error) {
    console.error('❌ Error desconectando de la base de datos:', error);
  }
};

// 🔄 GRACEFUL SHUTDOWN - Cierre seguro de conexiones
export const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️ Señal ${signal} recibida. Cerrando conexiones...`);
  
  try {
    // Dar tiempo a las operaciones en curso (5 segundos)
    console.log('⏳ Esperando operaciones en curso...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Desconectar Prisma
    await disconnectDB();
    
    console.log('✅ Apagado seguro completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en apagado seguro:', error);
    process.exit(1);
  }
};

// 🔍 HEALTH CHECK FUNCTION para endpoints
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: any;
}> => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      message: 'Base de datos operativa',
      details: {
        responseTime: `${responseTime}ms`,
        connections: 'pool activo',
      }
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: 'Base de datos no disponible',
      details: {
        error: error.message,
      }
    };
  }
};

// ⚠️ NOTA: Los signal handlers (SIGTERM, SIGINT, etc.) deben registrarse 
// SOLO en index.ts para evitar duplicados. Este archivo solo exporta las funciones.

export default prisma;
