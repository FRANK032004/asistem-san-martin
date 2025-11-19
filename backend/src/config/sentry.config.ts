/**
 * Configuración de Sentry para monitoreo de errores
 * 
 * @description Configura Sentry para capturar errores no manejados,
 * excepciones, y métricas de rendimiento en producción.
 * 
 * @see https://docs.sentry.io/platforms/node/
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Application } from 'express';

/**
 * Inicializa Sentry con la configuración del proyecto
 * 
 * @param app - Instancia de Express Application
 */
export const initSentry = (app: Application): void => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

  // Solo inicializar si hay DSN configurado
  if (!dsn || dsn.trim() === '') {
    console.log('⚠️  Sentry: DSN no configurado, monitoreo deshabilitado');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      
      // Configuración de trazas (performance monitoring)
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      
      // Configuración de profiling
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      
      integrations: [
        // Integración con Express y HTTP
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
        
        // Profiling para análisis de rendimiento
        nodeProfilingIntegration(),
      ],

      // Filtrar datos sensibles
      beforeSend(event) {
        // Remover información sensible de los datos enviados
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
        }
        return event;
      },

      // Ignorar ciertos errores que no son críticos
      ignoreErrors: [
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'jwt expired', // Manejado en el middleware
        'jwt malformed', // Manejado en el middleware
      ],
    });

    // Setup Express error handling después de init
    Sentry.setupExpressErrorHandler(app);

    console.log(`✅ Sentry inicializado correctamente (${environment})`);
    console.log(`📊 Traces sample rate: ${process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'}`);
    console.log(`🔍 Profiles sample rate: ${process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'}`);
  } catch (error) {
    console.error('❌ Error al inicializar Sentry:', error);
  }
};

/**
 * Capturar excepción manualmente
 * 
 * @param error - Error a reportar
 * @param context - Contexto adicional
 */
export const captureSentryException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
};

/**
 * Capturar mensaje/evento personalizado
 * 
 * @param message - Mensaje a reportar
 * @param level - Nivel de severidad
 */
export const captureSentryMessage = (
  message: string, 
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.captureMessage(message, level);
};

export default Sentry;
