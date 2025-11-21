/**
 * ========================================
 * SCRIPT DE TESTING COMPLETO DE API
 * Sistema ASISTEM San Martín
 * ========================================
 */

const axios = require('axios');
const colors = require('./colors');

// Configuración
const BACKEND_URL = process.env.BACKEND_URL || 'https://asistem-san-martin-production-b195.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://asistem-san-martin.vercel.app';

// Credenciales de prueba (cambiar si son diferentes)
const TEST_CREDENTIALS = {
  email: 'admin@sanmartin.edu.pe',
  password: 'admin123'
};

// Resultados
let passedTests = 0;
let failedTests = 0;
let errors = [];

// Función para mostrar resultados
function showResult(test, success, message = '') {
  if (success) {
    console.log(`${colors.green}✅ ${test}${colors.reset}`);
    if (message) console.log(`   ${colors.gray}${message}${colors.reset}`);
    passedTests++;
  } else {
    console.log(`${colors.red}❌ ${test}${colors.reset}`);
    if (message) console.log(`   ${colors.yellow}Error: ${message}${colors.reset}`);
    failedTests++;
    errors.push(`${test}: ${message}`);
  }
}

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========================================
// TESTS
// ========================================

async function runTests() {
  console.log(`\n${colors.cyan}========================================`);
  console.log('🔍 TESTING COMPLETO DE API');
  console.log(`========================================${colors.reset}\n`);

  let authToken = null;
  let testDocenteId = null;

  // ========================================
  // FASE 1: ENDPOINTS PÚBLICOS
  // ========================================
  console.log(`\n${colors.yellow}FASE 1: ENDPOINTS PÚBLICOS${colors.reset}\n`);

  // Test 1: Health Check
  console.log(`${colors.cyan}Test 1: Health Check...${colors.reset}`);
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
    if (response.data.status === 'healthy') {
      showResult('Health Check', true, `Uptime: ${response.data.uptime}s`);
    } else {
      showResult('Health Check', false, `Status: ${response.data.status}`);
    }
  } catch (error) {
    showResult('Health Check', false, error.message);
  }

  await delay(500);

  // Test 2: API Info
  console.log(`\n${colors.cyan}Test 2: API Info...${colors.reset}`);
  try {
    const response = await axios.get(`${BACKEND_URL}/api`, { timeout: 10000 });
    showResult('API Info', true, `Versión: ${response.data.version}`);
  } catch (error) {
    showResult('API Info', false, error.message);
  }

  await delay(500);

  // ========================================
  // FASE 2: AUTENTICACIÓN
  // ========================================
  console.log(`\n${colors.yellow}FASE 2: AUTENTICACIÓN${colors.reset}\n`);

  // Test 3: Login con credenciales incorrectas
  console.log(`${colors.cyan}Test 3: Login (credenciales incorrectas)...${colors.reset}`);
  try {
    await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'wrong@test.com',
      password: 'wrongpass'
    }, { timeout: 10000 });
    showResult('Login Rechazo', false, 'Aceptó credenciales incorrectas');
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 400)) {
      showResult('Login Rechazo', true, 'Rechazó credenciales incorrectas');
    } else {
      showResult('Login Rechazo', false, error.message);
    }
  }

  await delay(500);

  // Test 4: Login con credenciales correctas
  console.log(`\n${colors.cyan}Test 4: Login (credenciales correctas)...${colors.reset}`);
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, TEST_CREDENTIALS, {
      timeout: 10000
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      showResult('Login Exitoso', true, `Token: ${authToken.substring(0, 20)}...`);
      console.log(`   ${colors.gray}Usuario: ${response.data.usuario.nombres} ${response.data.usuario.apellidos}${colors.reset}`);
      console.log(`   ${colors.gray}Rol: ${response.data.usuario.rol.nombre}${colors.reset}`);
    } else {
      showResult('Login Exitoso', false, 'No devolvió token');
    }
  } catch (error) {
    showResult('Login Exitoso', false, error.response?.data?.error || error.message);
    console.log(`\n${colors.red}⚠️ ADVERTENCIA: No se pudo autenticar. Los siguientes tests fallarán.${colors.reset}`);
  }

  await delay(500);

  if (!authToken) {
    console.log(`\n${colors.red}❌ No se pudo obtener token. Abortando tests protegidos.${colors.reset}\n`);
    printSummary();
    return;
  }

  // Test 5: Obtener perfil
  console.log(`\n${colors.cyan}Test 5: Obtener Perfil...${colors.reset}`);
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    showResult('Obtener Perfil', true, `Usuario: ${response.data.nombres}`);
  } catch (error) {
    showResult('Obtener Perfil', false, error.response?.data?.error || error.message);
  }

  await delay(500);

  // ========================================
  // FASE 3: GESTIÓN DE DOCENTES
  // ========================================
  console.log(`\n${colors.yellow}FASE 3: GESTIÓN DE DOCENTES${colors.reset}\n`);

  // Test 6: Listar docentes
  console.log(`${colors.cyan}Test 6: Listar Docentes...${colors.reset}`);
  try {
    const response = await axios.get(`${BACKEND_URL}/api/docentes`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    
    if (Array.isArray(response.data)) {
      showResult('Listar Docentes', true, `Total: ${response.data.length} docentes`);
      if (response.data.length > 0) {
        testDocenteId = response.data[0].id;
        console.log(`   ${colors.gray}Primer docente: ${response.data[0].usuario?.nombres || 'N/A'}${colors.reset}`);
      }
    } else {
      showResult('Listar Docentes', false, 'Respuesta no es un array');
    }
  } catch (error) {
    showResult('Listar Docentes', false, error.response?.data?.error || error.message);
  }

  await delay(500);

  // Test 7: Obtener docente específico
  if (testDocenteId) {
    console.log(`\n${colors.cyan}Test 7: Obtener Docente por ID...${colors.reset}`);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/docentes/${testDocenteId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 10000
      });
      showResult('Obtener Docente', true, `ID: ${response.data.id}`);
    } catch (error) {
      showResult('Obtener Docente', false, error.response?.data?.error || error.message);
    }
    await delay(500);
  }

  // ========================================
  // FASE 4: ASISTENCIAS
  // ========================================
  console.log(`\n${colors.yellow}FASE 4: ASISTENCIAS${colors.reset}\n`);

  // Test 8: Listar asistencias del día
  console.log(`${colors.cyan}Test 8: Asistencias del Día...${colors.reset}`);
  try {
    const response = await axios.get(`${BACKEND_URL}/api/asistencias/hoy`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    showResult('Asistencias Hoy', true, `Total: ${response.data.length || 0} registros`);
  } catch (error) {
    showResult('Asistencias Hoy', false, error.response?.data?.error || error.message);
  }

  await delay(500);

  // Test 9: Validar ubicación GPS
  console.log(`\n${colors.cyan}Test 9: Validar Ubicación GPS...${colors.reset}`);
  try {
    const response = await axios.post(`${BACKEND_URL}/api/asistencias/validar-ubicacion`, {
      latitud: -12.0464,
      longitud: -77.0428
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    
    if (response.data.valido !== undefined) {
      showResult('Validar GPS', true, `Válido: ${response.data.valido}, Distancia: ${response.data.distancia}m`);
    } else {
      showResult('Validar GPS', false, 'Respuesta inesperada');
    }
  } catch (error) {
    showResult('Validar GPS', false, error.response?.data?.error || error.message);
  }

  await delay(500);

  // ========================================
  // FASE 5: ÁREAS
  // ========================================
  console.log(`\n${colors.yellow}FASE 5: ÁREAS ACADÉMICAS${colors.reset}\n`);

  // Test 10: Listar áreas
  console.log(`${colors.cyan}Test 10: Listar Áreas...${colors.reset}`);
  try {
    const response = await axios.get(`${BACKEND_URL}/api/areas`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    showResult('Listar Áreas', true, `Total: ${response.data.length || 0} áreas`);
  } catch (error) {
    showResult('Listar Áreas', false, error.response?.data?.error || error.message);
  }

  await delay(500);

  // ========================================
  // FASE 6: UBICACIONES GPS
  // ========================================
  console.log(`\n${colors.yellow}FASE 6: UBICACIONES PERMITIDAS${colors.reset}\n`);

  // Test 11: Listar ubicaciones
  console.log(`${colors.cyan}Test 11: Listar Ubicaciones...${colors.reset}`);
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ubicaciones`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000
    });
    showResult('Listar Ubicaciones', true, `Total: ${response.data.length || 0} ubicaciones`);
  } catch (error) {
    showResult('Listar Ubicaciones', false, error.response?.data?.error || error.message);
  }

  await delay(500);

  // ========================================
  // FASE 7: TESTS DE SEGURIDAD
  // ========================================
  console.log(`\n${colors.yellow}FASE 7: SEGURIDAD${colors.reset}\n`);

  // Test 12: Endpoint protegido sin token
  console.log(`${colors.cyan}Test 12: Protección sin Token...${colors.reset}`);
  try {
    await axios.get(`${BACKEND_URL}/api/docentes`, { timeout: 10000 });
    showResult('Protección sin Token', false, 'Permitió acceso sin autenticación');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      showResult('Protección sin Token', true, 'Rechazó acceso sin token');
    } else {
      showResult('Protección sin Token', false, error.message);
    }
  }

  await delay(500);

  // Test 13: Token inválido
  console.log(`\n${colors.cyan}Test 13: Token Inválido...${colors.reset}`);
  try {
    await axios.get(`${BACKEND_URL}/api/docentes`, {
      headers: { Authorization: 'Bearer invalid_token_xyz123' },
      timeout: 10000
    });
    showResult('Rechazo Token Inválido', false, 'Aceptó token inválido');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      showResult('Rechazo Token Inválido', true, 'Rechazó token inválido');
    } else {
      showResult('Rechazo Token Inválido', false, error.message);
    }
  }

  // Resumen final
  printSummary();
}

function printSummary() {
  console.log(`\n${colors.cyan}========================================`);
  console.log('📊 RESUMEN DE RESULTADOS');
  console.log(`========================================${colors.reset}\n`);

  const totalTests = passedTests + failedTests;
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;

  console.log(`Total de Tests: ${totalTests}`);
  console.log(`${colors.green}✅ Exitosos: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}❌ Fallidos: ${failedTests}${colors.reset}`);
  
  const rateColor = successRate >= 80 ? colors.green : (successRate >= 60 ? colors.yellow : colors.red);
  console.log(`${rateColor}📈 Tasa de Éxito: ${successRate}%${colors.reset}`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}⚠️ ERRORES DETECTADOS:${colors.reset}`);
    errors.forEach(error => {
      console.log(`   ${colors.yellow}• ${error}${colors.reset}`);
    });
  }

  console.log(`\n${colors.cyan}========================================${colors.reset}\n`);

  // Exit code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Ejecutar tests
runTests().catch(error => {
  console.error(`\n${colors.red}Error fatal:${colors.reset}`, error);
  process.exit(1);
});
