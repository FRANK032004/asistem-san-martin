import 'reflect-metadata'; // Requerido por class-transformer
import 'express-async-errors';
import dotenv from 'dotenv';

// ⚠️ IMPORTANTE: Cargar variables de entorno ANTES de cualquier otra importación
dotenv.config();

// ✅ VALIDAR VARIABLES DE ENTORNO AL ARRANCAR
import { validateEnvOrExit } from './shared/utils/env-validator';
validateEnvOrExit(); // Valida y termina si hay errores críticos

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Logger profesional
import { logger } from './shared/utils/logger';

// 🔴 SENTRY: Debe importarse ANTES de todas las rutas
import { initSentry } from './config/sentry.config';

// Importar rutas modulares (nueva arquitectura)
import { gestionDocentesRoutes } from './modules/admin';
import { docenteRoutes } from './modules/docente';

// Importar rutas legacy (mantener hasta migración completa)
import authRoutes from './routes/auth.routes';
import asistenciaRoutes from './routes/asistencia.routes';
import justificacionRoutes from './routes/justificacion.routes';
import notificacionRoutes from './routes/notificacion.routes';
import planillaDocenteRoutes from './routes/planilla-docente.routes';
import adminRoutes from './routes/admin.routes';
import adminPlanillaRoutes from './routes/admin-planilla.routes';
import horarioRoutes from './routes/horario.routes';
import areaRoutes from './routes/area.routes';
import ubicacionRoutes from './routes/ubicacion.routes';
import asignacionRoutes from './routes/asignacion.routes';
import testRoutes from './routes/test.routes';
import healthRoutes from './routes/health.routes';
import cacheRoutes from './modules/admin/routes/cache.routes';

// Importar utilidades
import { connectDB, disconnectDB, checkDatabaseHealth } from './utils/database';

// Importar middleware de error handling
import { 
  globalErrorHandler, 
  notFoundHandler, 
  requestIdMiddleware,
  contentTypeValidation 
} from './middleware/error-handler';
import { requestLogger, errorLogger } from './middleware/request-logger.middleware';

const app: Application = express();
const PORT = Number(process.env.PORT) || 5000;

// ========================================
// INICIALIZAR SENTRY (MONITOREO)
// ========================================
// ⚠️ DEBE SER LO PRIMERO después de crear la app
initSentry(app);

// ========================================
// CONFIGURACIÓN DE SEGURIDAD
// ========================================

// Helmet para headers de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// TRUST PROXY para Railway (debe estar ANTES del rate limiting)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  console.log('🔧 Trust proxy habilitado para Railway');
}

// Rate limiting - Configuración más permisiva para Railway
if (process.env.NODE_ENV === 'production') {
  // Rate limiter general - más permisivo
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // 500 requests por ventana (aumentado de 100)
    message: {
      error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Generar clave única por IP real
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for'] as string;
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
      return ip || 'unknown';
    },
  });
  
  // Rate limiter específico para auth - más restrictivo
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 intentos de login por IP por 15 minutos
    message: {
      error: 'Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.',
      code: 'RATE_LIMIT_AUTH',
      retryAfter: 900,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // No contar requests exitosos
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for'] as string;
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
      return `auth_${ip || 'unknown'}`;
    },
  });
  
  app.use('/api', generalLimiter);
  app.use('/api/auth', authLimiter);
  console.log('🛡️  Rate limiter activado - General: 500/15min, Auth: 50/15min');
} else {
  console.log('⚠️  Rate limiter DESHABILITADO (desarrollo)');
}

// CORS - Configuración permisiva para desarrollo
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permitir requests sin origin (como Postman, apps móviles)
    if (!origin) {
      console.log('🌐 CORS: Request sin origin - PERMITIDO');
      return callback(null, true);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 CORS: Desarrollo - Permitiendo origen: ${origin}`);
      return callback(null, true);
    }
    
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
    console.log(`🌐 CORS: Verificando origen: ${origin}`);
    console.log(`🌐 CORS: Orígenes permitidos:`, allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origen ${origin} PERMITIDO`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origen ${origin} NO PERMITIDO`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ========================================
// MIDDLEWARE GENERAL
// ========================================

// Request ID tracking
app.use(requestIdMiddleware);

// Logging con Winston (solo en desarrollo y producción, no en tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger); // Winston logger estructurado
}

// Parseo de datos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Validación de Content-Type
app.use(contentTypeValidation);

// Compresión
app.use(compression());

// Archivos estáticos
app.use('/uploads', express.static('uploads'));

// ========================================
// RUTAS DE SALUD DEL SISTEMA
// ========================================

// Health check completo (incluye estado de base de datos)
app.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Verificar estado de la base de datos
    const dbHealth = await checkDatabaseHealth();
    
    res.status(200).json({
      status: 'healthy',
      message: 'Sistema de Asistencia - Instituto San Martín',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(), // Segundos desde que se inició el servidor
      database: dbHealth,
      responseTime: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    // Si la base de datos falla, aún responder pero con status degraded
    console.error('❌ Health check falló:', error);
    
    res.status(503).json({
      status: 'degraded',
      message: 'Sistema parcialmente disponible',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      database: {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      responseTime: `${Date.now() - startTime}ms`,
    });
  }
});

// Info del API
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'API del Sistema de Asistencia - Instituto San Martín',
    version: '2.0.0', // ✅ Arquitectura Modular
    architecture: 'Clean Architecture + SOLID Principles',
    documentation: '/api/docs',
    endpoints: {
      // Módulos Nuevos (Arquitectura Modular)
      docenteSelfService: '/api/docente/*',
      adminGestionDocentes: '/api/admin/docentes/*',
      // Endpoints Legacy
      auth: '/api/auth',
      asistencia: '/api/asistencias',
      justificaciones: '/api/justificaciones',
      admin: '/api/admin',
      horarios: '/api/horarios',
      areas: '/api/areas',
      asignaciones: '/api/admin/asignaciones',
    },
  });
});

// ========================================
// RUTAS PRINCIPALES
// ========================================

// 🆕 ARQUITECTURA MODULAR - Nuevas Rutas
app.use('/api/docente', docenteRoutes);              // Módulo Docente (Self-Service)
app.use('/api/admin/docentes', gestionDocentesRoutes); // Módulo Admin (Gestión Docentes)
app.use('/api/admin/planillas', adminPlanillaRoutes); // Módulo Admin (Gestión Planillas)
app.use('/api/admin/cache', cacheRoutes);            // Módulo Admin (Cache Management)

// ⚠️ RUTAS LEGACY - Mantener hasta migración completa
app.use('/api/auth', authRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/justificaciones', justificacionRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/docente/planillas', planillaDocenteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/asignaciones', asignacionRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/test', testRoutes);
app.use('/api', healthRoutes); // Health checks detallados

// ========================================
// MANEJO DE ERRORES
// ========================================

// Error logger (loguea errores antes del handler global)
app.use(errorLogger);

// Ruta no encontrada (404)
app.use(notFoundHandler);

// Manejo global de errores
app.use(globalErrorHandler);

// ========================================
// INICIAR SERVIDOR
// ========================================

const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📘 API Info: http://localhost:${PORT}/api`);
      console.log(`📡 Network: http://192.168.0.107:${PORT}/api`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Modo desarrollo activo`);
      }
    });

    // ⚡ CONFIGURACIÓN ANTI-TIMEOUT
    // Prevenir que el servidor se cierre por inactividad
    server.keepAliveTimeout = 65000; // 65 segundos (mayor que típico proxy timeout de 60s)
    server.headersTimeout = 66000; // 66 segundos (siempre mayor que keepAliveTimeout)
    server.timeout = 120000; // 2 minutos para requests largos
    
    logger.debug('✅ Timeouts configurados', { 
      keepAlive: '65s', 
      headers: '66s', 
      timeout: '120s' 
    });

    // Manejo graceful de cierre (solo en producción o cuando no usa nodemon)
    const gracefulShutdown = async (signal: string) => {
      logger.warn(`⚠️ Señal ${signal} recibida. Cerrando conexiones...`);
      logger.info('⏳ Esperando operaciones en curso...');
      
      server.close(async () => {
        logger.info('✅ Servidor HTTP cerrado');
        await disconnectDB();
        logger.info('✅ Apagado seguro completado');
        process.exit(0);
      });

      // Forzar cierre después de 30 segundos si no termina
      setTimeout(() => {
        logger.error('⏰ Forzando cierre después de 30s timeout');
        process.exit(1);
      }, 30000);
    };

    // Solo registrar handlers si NO es nodemon (para evitar conflictos en desarrollo)
    if (!process.env.npm_lifecycle_event?.includes('dev')) {
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      logger.info('🛡️ Signal handlers registrados (producción)');
    } else {
      logger.debug('🔧 Modo desarrollo: nodemon maneja los reinicios');
    }

  } catch (error) {
    logger.error('❌ Error al iniciar el servidor', error);
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

export default app;
