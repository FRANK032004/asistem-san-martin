import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton para Prisma Client con configuración anti-timeout
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Keep-alive: Hacer ping cada 5 minutos para mantener conexión activa
let keepAliveInterval: NodeJS.Timeout;

export const startKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  keepAliveInterval = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('🏓 Keep-alive ping a PostgreSQL exitoso');
    } catch (error) {
      console.error('❌ Error en keep-alive ping:', error);
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
  
  console.log('✅ Keep-alive iniciado (ping cada 5 min)');
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    console.log('🛑 Keep-alive detenido');
  }
};

// Función para conectar a la base de datos
export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL exitosamente');
    
    // Iniciar keep-alive para mantener conexión activa
    startKeepAlive();
    
    // Verificar que las extensiones estén disponibles (opcional)
    // await prisma.$queryRaw`SELECT PostGIS_Version() as postgis_version`;
    // console.log('✅ PostGIS está disponible');
    
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

// Función para desconectar de la base de datos
export const disconnectDB = async () => {
  try {
    stopKeepAlive();
    await prisma.$disconnect();
    console.log('✅ Desconectado de PostgreSQL');
  } catch (error) {
    console.error('❌ Error desconectando de la base de datos:', error);
  }
};

// 🏥 Health check de la base de datos (para endpoint /health)
export const checkDatabaseHealth = async (): Promise<{
  status: string;
  details: { responseTime: string };
}> => {
  const startTime = Date.now();
  
  try {
    // Hacer query simple para verificar conexión
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      details: {
        responseTime: `${responseTime}ms`,
      },
    };
  } catch (error) {
    console.error('❌ Database health check falló:', error);
    
    throw new Error(
      `Base de datos no disponible: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
};

export default prisma;
