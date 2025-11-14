/**
 * Sistema de Logging Simple y Funcional
 */

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class SimpleLogger {
  private logLevel: LogLevel = 'info';

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      data
    };

    // En desarrollo, usar console con colores
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        error: '\x1b[31m',  // rojo
        warn: '\x1b[33m',   // amarillo
        info: '\x1b[36m',   // cyan
        debug: '\x1b[37m'   // blanco
      };
      const reset = '\x1b[0m';
      console.log(`${colors[level]}[${logEntry.timestamp}] ${logEntry.level}: ${message}${reset}`, data || '');
    } else {
      // En producción, JSON estructurado
      console.log(JSON.stringify(logEntry));
    }
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }
}

// Exportar instancia singleton
export const logger = new SimpleLogger();

// Exportar tipos
export type { LogEntry, LogLevel };