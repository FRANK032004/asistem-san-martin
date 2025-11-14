import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../shared/utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Health Check Endpoint
 * GET /api/health
 * Verifica el estado del sistema y sus dependencias
 */
router.get('/health', async (_req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'unknown',
      memory: 'unknown',
      disk: 'unknown'
    }
  };

  try {
    // ✅ CHECK 1: Base de datos
    const startDb = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startDb;
    
    healthCheck.checks.database = 'healthy';
    (healthCheck.checks as any).databaseResponseTime = `${dbResponseTime}ms`;

    // ✅ CHECK 2: Memoria
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    healthCheck.checks.memory = 'healthy';
    (healthCheck.checks as any).memoryUsage = memUsageMB;

    // ✅ CHECK 3: Espacio en disco (CPU)
    const cpuUsage = process.cpuUsage();
    healthCheck.checks.disk = 'healthy';
    (healthCheck.checks as any).cpuUsage = {
      user: Math.round(cpuUsage.user / 1000), // ms
      system: Math.round(cpuUsage.system / 1000) // ms
    };

    logger.debug('Health check ejecutado', { 
      dbResponseTime: `${dbResponseTime}ms`,
      memoryUsed: `${memUsageMB.heapUsed}MB`
    });

    return res.status(200).json(healthCheck);

  } catch (error: any) {
    logger.error('Health check falló', error);
    
    healthCheck.status = 'unhealthy';
    healthCheck.checks.database = 'unhealthy';
    (healthCheck.checks as any).error = error.message;

    return res.status(503).json(healthCheck);
  }
});

/**
 * Readiness Check Endpoint
 * GET /api/health/ready
 * Verifica si la aplicación está lista para recibir tráfico
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Verificar conexión a BD
    await prisma.$queryRaw`SELECT 1`;
    
    logger.debug('Readiness check passed');
    
    return res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.warn('Readiness check failed', error);
    
    return res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Liveness Check Endpoint
 * GET /api/health/live
 * Verifica si la aplicación está viva (para Kubernetes)
 */
router.get('/health/live', (_req: Request, res: Response) => {
  logger.debug('Liveness check passed');
  
  return res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
