#!/usr/bin/env node

/**
 * Script de Validación PWA - ASISTEM San Martín
 * Verifica todos los aspectos críticos de la PWA
 * 
 * Ejecutar: node pwa-validator.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO VALIDACIÓN PWA...\n');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let errorsCount = 0;
let warningsCount = 0;
let successCount = 0;

// ========================================
// 1. VERIFICAR MANIFEST.JSON
// ========================================
console.log(`${colors.cyan}[1/6] Verificando manifest.json...${colors.reset}`);

const manifestPath = path.join(__dirname, 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  // Verificar campos requeridos
  const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
  let manifestValid = true;
  
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      console.log(`  ${colors.red}✗${colors.reset} Campo requerido faltante: ${field}`);
      errorsCount++;
      manifestValid = false;
    }
  });
  
  // Verificar iconos
  if (manifest.icons && manifest.icons.length >= 2) {
    console.log(`  ${colors.green}✓${colors.reset} Manifest válido con ${manifest.icons.length} iconos`);
    successCount++;
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} Se recomienda al menos 2 iconos (encontrados: ${manifest.icons?.length || 0})`);
    warningsCount++;
  }
  
  // Verificar shortcuts
  if (manifest.shortcuts && manifest.shortcuts.length > 0) {
    console.log(`  ${colors.green}✓${colors.reset} ${manifest.shortcuts.length} shortcuts configurados`);
    successCount++;
  }
  
} else {
  console.log(`  ${colors.red}✗${colors.reset} manifest.json NO encontrado`);
  errorsCount++;
}

// ========================================
// 2. VERIFICAR SERVICE WORKER
// ========================================
console.log(`\n${colors.cyan}[2/6] Verificando Service Worker...${colors.reset}`);

const swPath = path.join(__dirname, 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf-8');
  
  // Verificar eventos críticos
  const criticalEvents = ['install', 'activate', 'fetch'];
  let allEventsPresent = true;
  
  criticalEvents.forEach(event => {
    if (swContent.includes(`addEventListener('${event}'`)) {
      console.log(`  ${colors.green}✓${colors.reset} Evento '${event}' implementado`);
      successCount++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Evento '${event}' faltante`);
      errorsCount++;
      allEventsPresent = false;
    }
  });
  
  // Verificar estrategias de cache
  if (swContent.includes('caches.open')) {
    console.log(`  ${colors.green}✓${colors.reset} Cache API implementada`);
    successCount++;
  }
  
  // Verificar offline fallback
  if (swContent.includes('offline.html')) {
    console.log(`  ${colors.green}✓${colors.reset} Offline fallback configurado`);
    successCount++;
  }
  
} else {
  console.log(`  ${colors.red}✗${colors.reset} sw.js NO encontrado`);
  errorsCount++;
}

// ========================================
// 3. VERIFICAR ICONOS PWA
// ========================================
console.log(`\n${colors.cyan}[3/6] Verificando iconos PWA...${colors.reset}`);

const iconsDir = path.join(__dirname, 'public', 'icons');
const requiredSizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (fs.existsSync(iconsDir)) {
  let allIconsValid = true;
  const iconFiles = fs.readdirSync(iconsDir);
  
  requiredSizes.forEach(size => {
    const iconFile = `icon-${size}x${size}.png`;
    const iconPath = path.join(iconsDir, iconFile);
    
    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      
      // Verificar que no sea un placeholder vacío (> 1KB)
      if (stats.size > 1024) {
        console.log(`  ${colors.green}✓${colors.reset} ${iconFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        successCount++;
      } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${iconFile} muy pequeño (${stats.size} bytes) - posible placeholder`);
        warningsCount++;
        allIconsValid = false;
      }
    } else {
      console.log(`  ${colors.red}✗${colors.reset} ${iconFile} NO encontrado`);
      errorsCount++;
      allIconsValid = false;
    }
  });
  
} else {
  console.log(`  ${colors.red}✗${colors.reset} Directorio /public/icons NO encontrado`);
  errorsCount++;
}

// ========================================
// 4. VERIFICAR OFFLINE.HTML
// ========================================
console.log(`\n${colors.cyan}[4/6] Verificando página offline...${colors.reset}`);

const offlinePath = path.join(__dirname, 'public', 'offline.html');
if (fs.existsSync(offlinePath)) {
  const offlineContent = fs.readFileSync(offlinePath, 'utf-8');
  
  // Verificar elementos críticos
  if (offlineContent.includes('<html') && offlineContent.includes('</html>')) {
    console.log(`  ${colors.green}✓${colors.reset} offline.html es un HTML válido`);
    successCount++;
  }
  
  if (offlineContent.includes('offline') || offlineContent.includes('conexión')) {
    console.log(`  ${colors.green}✓${colors.reset} Mensaje de offline presente`);
    successCount++;
  }
  
} else {
  console.log(`  ${colors.red}✗${colors.reset} offline.html NO encontrado`);
  errorsCount++;
}

// ========================================
// 5. VERIFICAR STORE ZUSTAND
// ========================================
console.log(`\n${colors.cyan}[5/6] Verificando Store Zustand...${colors.reset}`);

const storePath = path.join(__dirname, 'src', 'store', 'docente.ts');
if (fs.existsSync(storePath)) {
  const storeContent = fs.readFileSync(storePath, 'utf-8');
  
  // Verificar hooks optimizados
  const hooks = ['useDashboard', 'usePerfil', 'useHorarios', 'useAsistencia'];
  
  hooks.forEach(hook => {
    if (storeContent.includes(`export const ${hook}`)) {
      console.log(`  ${colors.green}✓${colors.reset} Hook '${hook}()' implementado`);
      successCount++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Hook '${hook}()' no encontrado`);
      warningsCount++;
    }
  });
  
  // Verificar acciones críticas
  const actions = ['registrarEntrada', 'registrarSalida', 'cargarDashboard'];
  
  actions.forEach(action => {
    if (storeContent.includes(action)) {
      console.log(`  ${colors.green}✓${colors.reset} Acción '${action}' implementada`);
      successCount++;
    }
  });
  
} else {
  console.log(`  ${colors.yellow}⚠${colors.reset} Store docente.ts NO encontrado`);
  warningsCount++;
}

// ========================================
// 6. VERIFICAR GEOLOCALIZACIÓN
// ========================================
console.log(`\n${colors.cyan}[6/6] Verificando hook de geolocalización...${colors.reset}`);

const geoPath = path.join(__dirname, 'src', 'hooks', 'useGeolocation.ts');
if (fs.existsSync(geoPath)) {
  const geoContent = fs.readFileSync(geoPath, 'utf-8');
  
  // Verificar enableHighAccuracy
  if (geoContent.includes('enableHighAccuracy')) {
    console.log(`  ${colors.green}✓${colors.reset} GPS de alta precisión configurado`);
    successCount++;
  }
  
  // Verificar accuracy tracking
  if (geoContent.includes('accuracy')) {
    console.log(`  ${colors.green}✓${colors.reset} Tracking de precisión implementado`);
    successCount++;
  }
  
  // Verificar utilities
  const utilities = ['calculateDistance', 'isWithinRadius', 'formatCoordinates'];
  
  utilities.forEach(util => {
    if (geoContent.includes(util)) {
      console.log(`  ${colors.green}✓${colors.reset} Utilidad '${util}' disponible`);
      successCount++;
    }
  });
  
} else {
  console.log(`  ${colors.yellow}⚠${colors.reset} useGeolocation.ts NO encontrado`);
  warningsCount++;
}

// ========================================
// RESUMEN FINAL
// ========================================
console.log(`\n${'='.repeat(50)}`);
console.log(`${colors.blue}RESUMEN DE VALIDACIÓN${colors.reset}`);
console.log(`${'='.repeat(50)}`);

console.log(`\n  ${colors.green}✓${colors.reset} Exitosos: ${successCount}`);
console.log(`  ${colors.yellow}⚠${colors.reset} Advertencias: ${warningsCount}`);
console.log(`  ${colors.red}✗${colors.reset} Errores: ${errorsCount}`);

const total = successCount + warningsCount + errorsCount;
const successRate = ((successCount / total) * 100).toFixed(1);

console.log(`\n  Tasa de éxito: ${successRate}%`);

if (errorsCount === 0) {
  console.log(`\n${colors.green}✅ PWA VALIDADA - LISTA PARA PRODUCCIÓN${colors.reset}`);
  process.exit(0);
} else if (errorsCount <= 3) {
  console.log(`\n${colors.yellow}⚠️  PWA FUNCIONAL - REVISAR ERRORES MENORES${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}❌ PWA CON ERRORES CRÍTICOS - REQUIERE CORRECCIÓN${colors.reset}`);
  process.exit(1);
}
