#!/usr/bin/env node

/**
 * Script de Auditoría de Seguridad Automatizada
 * 
 * Ejecuta múltiples verificaciones de seguridad:
 * - npm audit (vulnerabilidades CVE)
 * - Verificación de secretos débiles
 * - Check de versiones de dependencias
 * - Validación de configuraciones críticas
 * 
 * Uso: node scripts/security-audit.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.blue}📋 ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
};

// Resultados de la auditoría
const auditResults = {
  vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
  secrets: { weak: [], missing: [] },
  dependencies: { outdated: [] },
  config: { issues: [] },
  timestamp: new Date().toISOString(),
};

/**
 * 1. AUDITORÍA DE NPM (CVE)
 */
function auditNpmVulnerabilities() {
  log.section('AUDITORÍA DE VULNERABILIDADES (CVE)');

  try {
    const output = execSync('npm audit --json', { encoding: 'utf-8' });
    const audit = JSON.parse(output);

    const vuln = audit.metadata.vulnerabilities;
    auditResults.vulnerabilities = {
      critical: vuln.critical || 0,
      high: vuln.high || 0,
      moderate: vuln.moderate || 0,
      low: vuln.low || 0,
      info: vuln.info || 0,
    };

    log.info(`Total de paquetes: ${audit.metadata.totalDependencies}`);
    
    if (vuln.critical > 0) {
      log.error(`CRÍTICAS: ${vuln.critical}`);
    }
    if (vuln.high > 0) {
      log.error(`ALTAS: ${vuln.high}`);
    }
    if (vuln.moderate > 0) {
      log.warning(`MODERADAS: ${vuln.moderate}`);
    }
    if (vuln.low > 0) {
      log.warning(`BAJAS: ${vuln.low}`);
    }

    const total = vuln.critical + vuln.high + vuln.moderate + vuln.low;
    if (total === 0) {
      log.success('No se encontraron vulnerabilidades');
    } else {
      log.warning(`Total de vulnerabilidades: ${total}`);
      log.info('Ejecuta: npm audit fix --force (para corregir)');
    }
  } catch (error) {
    if (error.status === 1) {
      // npm audit retorna exit code 1 cuando hay vulnerabilidades
      try {
        const output = error.stdout.toString();
        const audit = JSON.parse(output);
        const vuln = audit.metadata.vulnerabilities;
        
        auditResults.vulnerabilities = {
          critical: vuln.critical || 0,
          high: vuln.high || 0,
          moderate: vuln.moderate || 0,
          low: vuln.low || 0,
          info: vuln.info || 0,
        };

        if (vuln.critical > 0) log.error(`CRÍTICAS: ${vuln.critical}`);
        if (vuln.high > 0) log.error(`ALTAS: ${vuln.high}`);
        if (vuln.moderate > 0) log.warning(`MODERADAS: ${vuln.moderate}`);
        if (vuln.low > 0) log.warning(`BAJAS: ${vuln.low}`);
        
        log.warning('⚠️  Se encontraron vulnerabilidades. Ejecuta: npm audit fix');
      } catch (parseError) {
        log.error('Error al parsear resultado de npm audit');
      }
    } else {
      log.error('Error ejecutando npm audit');
    }
  }
}

/**
 * 2. VERIFICACIÓN DE SECRETOS
 */
function checkSecrets() {
  log.section('VERIFICACIÓN DE SECRETOS Y CONFIGURACIÓN');

  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    log.error('.env no encontrado');
    auditResults.secrets.missing.push('.env file');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  // Verificar JWT_SECRET
  const jwtSecretLine = lines.find(line => line.startsWith('JWT_SECRET='));
  if (jwtSecretLine) {
    const secret = jwtSecretLine.split('=')[1]?.trim();
    if (!secret || secret.length < 64) {
      log.error('JWT_SECRET es demasiado corto (< 64 caracteres)');
      auditResults.secrets.weak.push('JWT_SECRET');
    } else if (secret.includes('instituto') || secret.includes('super_seguro')) {
      log.error('JWT_SECRET contiene palabras predecibles');
      auditResults.secrets.weak.push('JWT_SECRET (predecible)');
    } else {
      log.success(`JWT_SECRET: ${secret.length} caracteres (seguro)`);
    }
  } else {
    log.error('JWT_SECRET no encontrado en .env');
    auditResults.secrets.missing.push('JWT_SECRET');
  }

  // Verificar JWT_REFRESH_SECRET
  const refreshSecretLine = lines.find(line => line.startsWith('JWT_REFRESH_SECRET='));
  if (refreshSecretLine) {
    const secret = refreshSecretLine.split('=')[1]?.trim();
    if (!secret || secret.length < 64) {
      log.error('JWT_REFRESH_SECRET es demasiado corto (< 64 caracteres)');
      auditResults.secrets.weak.push('JWT_REFRESH_SECRET');
    } else {
      log.success(`JWT_REFRESH_SECRET: ${secret.length} caracteres (seguro)`);
    }
  } else {
    log.error('JWT_REFRESH_SECRET no encontrado en .env');
    auditResults.secrets.missing.push('JWT_REFRESH_SECRET');
  }

  // Verificar DATABASE_URL
  const dbUrlLine = lines.find(line => line.startsWith('DATABASE_URL='));
  if (dbUrlLine) {
    const dbUrl = dbUrlLine.split('=')[1]?.trim().replace(/"/g, '');
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      log.warning('DATABASE_URL apunta a localhost (OK en desarrollo)');
    } else {
      log.success('DATABASE_URL configurada para producción');
    }
  } else {
    log.error('DATABASE_URL no encontrada en .env');
    auditResults.secrets.missing.push('DATABASE_URL');
  }

  // Verificar Sentry
  const sentryDsnLine = lines.find(line => line.startsWith('SENTRY_DSN='));
  if (sentryDsnLine) {
    const dsn = sentryDsnLine.split('=')[1]?.trim();
    if (!dsn || dsn === '') {
      log.warning('SENTRY_DSN vacío (monitoreo deshabilitado)');
    } else {
      log.success('SENTRY_DSN configurado');
    }
  }
}

/**
 * 3. VERIFICAR DEPENDENCIAS DESACTUALIZADAS
 */
function checkOutdatedDependencies() {
  log.section('VERIFICACIÓN DE DEPENDENCIAS DESACTUALIZADAS');

  try {
    const output = execSync('npm outdated --json', { encoding: 'utf-8' });
    if (!output.trim()) {
      log.success('Todas las dependencias están actualizadas');
      return;
    }

    const outdated = JSON.parse(output);
    const packages = Object.keys(outdated);

    if (packages.length === 0) {
      log.success('Todas las dependencias están actualizadas');
      return;
    }

    log.warning(`${packages.length} dependencias desactualizadas:`);
    
    packages.forEach(pkg => {
      const info = outdated[pkg];
      const severity = getUpdateSeverity(info.current, info.latest);
      
      auditResults.dependencies.outdated.push({
        package: pkg,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest,
        severity,
      });

      if (severity === 'major') {
        log.warning(`  ${pkg}: ${info.current} → ${info.latest} (MAJOR UPDATE)`);
      } else {
        log.info(`  ${pkg}: ${info.current} → ${info.latest}`);
      }
    });

    log.info('Ejecuta: npm update (para actualizar)');
  } catch (error) {
    // npm outdated retorna exit code 1 si hay paquetes desactualizados
    if (error.status === 1 && error.stdout) {
      try {
        const output = error.stdout.toString();
        if (!output.trim() || output === '{}') {
          log.success('Todas las dependencias están actualizadas');
          return;
        }
        
        const outdated = JSON.parse(output);
        const packages = Object.keys(outdated);
        
        log.warning(`${packages.length} dependencias desactualizadas`);
        packages.slice(0, 5).forEach(pkg => {
          const info = outdated[pkg];
          log.info(`  ${pkg}: ${info.current} → ${info.latest}`);
        });
        
        if (packages.length > 5) {
          log.info(`  ... y ${packages.length - 5} más`);
        }
      } catch (parseError) {
        log.info('Verificación de versiones completada');
      }
    }
  }
}

function getUpdateSeverity(current, latest) {
  const [currMajor] = current.split('.');
  const [latestMajor] = latest.split('.');
  return currMajor !== latestMajor ? 'major' : 'minor';
}

/**
 * 4. VERIFICAR CONFIGURACIONES CRÍTICAS
 */
function checkCriticalConfigurations() {
  log.section('VERIFICACIÓN DE CONFIGURACIONES CRÍTICAS');

  // Check package.json scripts
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (packageJson.scripts?.test) {
      log.success('Script de test configurado');
    } else {
      log.warning('No hay script de test en package.json');
      auditResults.config.issues.push('Missing test script');
    }

    if (packageJson.scripts?.build) {
      log.success('Script de build configurado');
    } else {
      log.warning('No hay script de build en package.json');
    }
  }

  // Check .gitignore
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    
    if (gitignore.includes('.env')) {
      log.success('.env está en .gitignore');
    } else {
      log.error('.env NO está en .gitignore (CRÍTICO)');
      auditResults.config.issues.push('.env not in .gitignore');
    }

    if (gitignore.includes('node_modules')) {
      log.success('node_modules está en .gitignore');
    }
  } else {
    log.warning('.gitignore no encontrado');
  }

  // Check TypeScript config
  const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    log.success('tsconfig.json encontrado');
  } else {
    log.warning('tsconfig.json no encontrado');
  }
}

/**
 * 5. GENERAR REPORTE
 */
function generateReport() {
  log.title();
  log.section('RESUMEN DE AUDITORÍA');

  const totalVuln = 
    auditResults.vulnerabilities.critical +
    auditResults.vulnerabilities.high +
    auditResults.vulnerabilities.moderate +
    auditResults.vulnerabilities.low;

  console.log(`
${colors.bright}Vulnerabilidades CVE:${colors.reset}
  🔴 Críticas:  ${auditResults.vulnerabilities.critical}
  🟠 Altas:     ${auditResults.vulnerabilities.high}
  🟡 Moderadas: ${auditResults.vulnerabilities.moderate}
  🟢 Bajas:     ${auditResults.vulnerabilities.low}
  Total:       ${totalVuln}

${colors.bright}Secretos y Configuración:${colors.reset}
  Secretos débiles: ${auditResults.secrets.weak.length}
  Secretos faltantes: ${auditResults.secrets.missing.length}

${colors.bright}Dependencias:${colors.reset}
  Desactualizadas: ${auditResults.dependencies.outdated.length}

${colors.bright}Configuración:${colors.reset}
  Problemas: ${auditResults.config.issues.length}
  `);

  // Guardar reporte JSON
  const reportPath = path.join(__dirname, '..', 'security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  log.success(`Reporte guardado en: ${reportPath}`);

  // Score final
  let score = 100;
  score -= auditResults.vulnerabilities.critical * 20;
  score -= auditResults.vulnerabilities.high * 10;
  score -= auditResults.vulnerabilities.moderate * 3;
  score -= auditResults.secrets.weak.length * 15;
  score -= auditResults.secrets.missing.length * 10;
  score -= auditResults.config.issues.length * 5;
  score = Math.max(0, score);

  console.log(`\n${colors.bright}SCORE DE SEGURIDAD: ${score}/100${colors.reset}`);
  
  if (score >= 90) {
    log.success('✅ Excelente nivel de seguridad');
  } else if (score >= 70) {
    log.warning('⚠️  Nivel de seguridad aceptable, hay mejoras pendientes');
  } else {
    log.error('❌ Nivel de seguridad bajo, requiere atención inmediata');
  }

  log.title();
}

/**
 * MAIN
 */
async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         🔒  AUDITORÍA DE SEGURIDAD AUTOMATIZADA  🔒       ║
║              Sistema ASISTEM San Martín                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
`);

  log.info(`Fecha: ${new Date().toLocaleString()}`);
  log.info(`Node.js: ${process.version}`);
  
  try {
    auditNpmVulnerabilities();
    checkSecrets();
    checkOutdatedDependencies();
    checkCriticalConfigurations();
    generateReport();
  } catch (error) {
    log.error(`Error durante auditoría: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar
main();
