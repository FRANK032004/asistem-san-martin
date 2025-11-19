/**
 * ============================================================
 * VALIDADOR DE VARIABLES DE ENTORNO
 * Sistema de Asistencias - Instituto San Martín
 * ============================================================
 * Valida que todas las variables de entorno necesarias estén presentes
 * y tengan valores válidos antes de iniciar la aplicación
 */

import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Variables de entorno requeridas
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PORT',
  'NODE_ENV',
] as const;

/**
 * Variables de entorno opcionales con valores por defecto
 */
const OPTIONAL_ENV_VARS = {
  JWT_EXPIRES_IN: '24h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  GPS_PRECISION_METERS: '50',
  GPS_TIMEOUT_SECONDS: '30',
  LOG_LEVEL: 'info',
  FRONTEND_URL: 'http://localhost:3000',
  ALLOWED_ORIGINS: 'http://localhost:3000',
} as const;

/**
 * Validaciones personalizadas por variable
 */
const VALIDATORS: Record<string, (value: string) => boolean> = {
  DATABASE_URL: (value) => value.startsWith('postgresql://'),
  PORT: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 && parseInt(value) < 65536,
  JWT_SECRET: (value) => value.length >= 32,
  JWT_REFRESH_SECRET: (value) => value.length >= 32,
  NODE_ENV: (value) => ['development', 'production', 'test'].includes(value),
  RATE_LIMIT_WINDOW_MS: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
  RATE_LIMIT_MAX_REQUESTS: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
  GPS_PRECISION_METERS: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
};

/**
 * Mensajes de ayuda para cada variable
 */
const HELP_MESSAGES: Record<string, string> = {
  DATABASE_URL: 'Debe ser una URL de PostgreSQL válida. Ejemplo: postgresql://user:pass@localhost:5432/db',
  PORT: 'Debe ser un número entre 1 y 65535',
  JWT_SECRET: 'Debe tener al menos 32 caracteres. Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
  JWT_REFRESH_SECRET: 'Debe tener al menos 32 caracteres',
  NODE_ENV: 'Debe ser: development, production o test',
};

/**
 * Resultado de la validación
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida todas las variables de entorno
 */
export function validateEnvVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar variables requeridas
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];

    if (!value) {
      const helpMsg = HELP_MESSAGES[varName] || '';
      errors.push(`❌ Variable requerida faltante: ${varName}${helpMsg ? `\n   ${helpMsg}` : ''}`);
      continue;
    }

    // Validación personalizada si existe
    const validator = VALIDATORS[varName];
    if (validator && !validator(value)) {
      const helpMsg = HELP_MESSAGES[varName] || '';
      errors.push(`❌ Variable inválida: ${varName}${helpMsg ? `\n   ${helpMsg}` : ''}`);
    }
  }

  // Validar variables opcionales si están presentes
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[varName];

    if (!value) {
      warnings.push(`⚠️  Variable opcional no configurada: ${varName} (usando default: ${defaultValue})`);
      continue;
    }

    const validator = VALIDATORS[varName];
    if (validator && !validator(value)) {
      warnings.push(`⚠️  Variable opcional inválida: ${varName}, se usará valor por defecto`);
    }
  }

  // Validaciones especiales
  validateSpecialCases(errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validaciones especiales de lógica de negocio
 */
function validateSpecialCases(errors: string[], warnings: string[]): void {
  // Verificar que JWT_SECRET y JWT_REFRESH_SECRET sean diferentes
  if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
    if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      errors.push('❌ JWT_SECRET y JWT_REFRESH_SECRET deben ser diferentes');
    }
  }

  // Advertir si se usan valores por defecto en producción
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET?.includes('fallback')) {
      errors.push('❌ No puedes usar JWT_SECRET por defecto en producción');
    }

    if (!process.env.SENTRY_DSN) {
      warnings.push('⚠️  SENTRY_DSN no configurado en producción (recomendado para monitoreo)');
    }

    if (process.env.LOG_LEVEL === 'debug') {
      warnings.push('⚠️  LOG_LEVEL en "debug" en producción (puede afectar performance)');
    }
  }

  // Verificar conexión a base de datos en desarrollo
  if (process.env.NODE_ENV === 'development') {
    if (process.env.DATABASE_URL?.includes('production')) {
      errors.push('❌ ¡PELIGRO! Estás conectado a base de datos de producción en desarrollo');
    }
  }
}

/**
 * Imprime el resultado de la validación en consola
 */
export function printValidationResult(result: ValidationResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VALIDACIÓN DE VARIABLES DE ENTORNO');
  console.log('='.repeat(60) + '\n');

  if (result.errors.length > 0) {
    console.log('❌ ERRORES CRÍTICOS:\n');
    result.errors.forEach(error => console.log(error));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  ADVERTENCIAS:\n');
    result.warnings.forEach(warning => console.log(warning));
    console.log('');
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Todas las variables de entorno están correctamente configuradas\n');
  } else if (result.valid) {
    console.log('✅ Variables críticas OK (revisar advertencias)\n');
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Valida y termina el proceso si hay errores
 */
export function validateEnvOrExit(): void {
  const result = validateEnvVariables();
  printValidationResult(result);

  if (!result.valid) {
    console.error('💀 No se puede iniciar la aplicación con errores en variables de entorno\n');
    console.error('📝 Copia .env.example a .env y configura los valores necesarios\n');
    process.exit(1);
  }
}

/**
 * Helper para obtener variable de entorno con validación
 */
export function getEnvVar(name: string, required = true): string {
  const value = process.env[name];

  if (!value && required) {
    throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
  }

  return value || '';
}

/**
 * Helper para obtener variable de entorno numérica
 */
export function getEnvNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Variable de entorno numérica requerida no encontrada: ${name}`);
  }

  const parsed = parseInt(value);
  if (isNaN(parsed)) {
    throw new Error(`Variable de entorno ${name} no es un número válido: ${value}`);
  }

  return parsed;
}

/**
 * Helper para obtener variable de entorno booleana
 */
export function getEnvBoolean(name: string, defaultValue = false): boolean {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true' || value === '1';
}
