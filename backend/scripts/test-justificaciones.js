/**
 * Script de prueba para el módulo de justificaciones
 * Prueba los endpoints mediante HTTP requests
 */

// Usar fetch nativo de Node.js 18+
const BASE_URL = 'http://localhost:5000';

// Token de autenticación
let authToken = '';

// Test 1: Login como docente
async function loginDocente() {
  try {
    console.log('\n🔐 TEST 1: Login como docente...');
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'docente.prueba@sanmartin.edu.pe',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    authToken = data.data.token;
    console.log('✅ Login exitoso');
    console.log('Token:', authToken.substring(0, 30) + '...');
    console.log('Usuario:', data.data.usuarios.nombres, data.data.usuarios.apellidos);
    return data;
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
}

// Test 2: Crear justificación
async function crearJustificacion() {
  try {
    console.log('\n📝 TEST 2: Crear justificación...');
    const response = await fetch(`${BASE_URL}/api/docente/justificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fechaInicio: '2025-11-10',
        fechaFin: '2025-11-10',
        tipo: 'MEDICA',
        motivo: 'Tuve que asistir a una consulta médica por un dolor de cabeza persistente que me impedía trabajar normalmente.',
        afectaPago: false
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    console.log('✅ Justificación creada exitosamente');
    console.log('ID:', data.data.id);
    console.log('Estado:', data.data.estado);
    console.log('Mensaje:', data.message);
    return data.data;
  } catch (error) {
    console.error('❌ Error al crear:', error.message);
    throw error;
  }
}

// Test 3: Listar justificaciones
async function listarJustificaciones() {
  try {
    console.log('\n📋 TEST 3: Listar justificaciones...');
    const response = await fetch(`${BASE_URL}/api/docente/justificaciones?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    console.log('✅ Lista obtenida exitosamente');
    console.log('Total:', data.data.pagination.total);
    console.log('Justificaciones en esta página:', data.data.data.length);
    
    if (data.data.data.length > 0) {
      console.log('\nPrimera justificación:');
      const first = data.data.data[0];
      console.log('- ID:', first.id);
      console.log('- Tipo:', first.tipo);
      console.log('- Estado:', first.estado);
      console.log('- Motivo:', first.motivo.substring(0, 50) + '...');
    }
    
    return data.data;
  } catch (error) {
    console.error('❌ Error al listar:', error.message);
    throw error;
  }
}

// Test 4: Obtener estadísticas
async function obtenerEstadisticas() {
  try {
    console.log('\n📊 TEST 4: Obtener estadísticas...');
    const response = await fetch(`${BASE_URL}/api/docente/justificaciones/estadisticas`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    console.log('✅ Estadísticas obtenidas');
    console.log('Total:', data.data.total);
    console.log('Pendientes:', data.data.pendientes);
    console.log('Aprobadas:', data.data.aprobadas);
    console.log('Rechazadas:', data.data.rechazadas);
    console.log('Tasa de aprobación:', data.data.tasaAprobacion + '%');
    
    return data.data;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error.message);
    throw error;
  }
}

// Test 5: Actualizar justificación
async function actualizarJustificacion(justificacionId) {
  try {
    console.log('\n✏️ TEST 5: Actualizar justificación...');
    const response = await fetch(`${BASE_URL}/api/docente/justificaciones/${justificacionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        motivo: 'Actualizado: Consulta médica por dolor de cabeza persistente que requirió estudios adicionales y reposo recomendado por el especialista.'
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    console.log('✅ Justificación actualizada');
    console.log('Motivo actualizado:', data.data.motivo.substring(0, 60) + '...');
    
    return data.data;
  } catch (error) {
    console.error('❌ Error al actualizar:', error.message);
  }
}

// Test 6: Validaciones
async function probarValidaciones() {
  console.log('\n🧪 TEST 6: Probar validaciones...');
  
  // 6.1: Motivo muy corto
  try {
    console.log('\n6.1: Motivo muy corto (debe fallar)...');
    const response = await fetch(`${BASE_URL}/api/docente/justificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fechaInicio: '2025-11-11',
        fechaFin: '2025-11-11',
        tipo: 'PERSONAL',
        motivo: 'Corto' // < 20 caracteres
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Validación correcta: Motivo muy corto rechazado');
      console.log('   Error:', data.error?.message || data.message);
    } else {
      console.log('❌ ERROR: Debería haber rechazado motivo corto');
    }
  } catch (error) {
    console.log('⚠️ Error:', error.message);
  }
  
  // 6.2: Fechas inválidas
  try {
    console.log('\n6.2: Fecha fin antes que fecha inicio (debe fallar)...');
    const response = await fetch(`${BASE_URL}/api/docente/justificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fechaInicio: '2025-11-15',
        fechaFin: '2025-11-10', // Fecha fin antes
        tipo: 'MEDICA',
        motivo: 'Motivo válido con más de veinte caracteres para cumplir validación'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Validación correcta: Fechas inválidas rechazadas');
      console.log('   Error:', data.error?.message || data.message);
    } else {
      console.log('❌ ERROR: Debería haber rechazado fechas inválidas');
    }
  } catch (error) {
    console.log('⚠️ Error:', error.message);
  }
}

// Ejecutar todas las pruebas
async function ejecutarPruebas() {
  console.log('🚀 Iniciando pruebas del módulo de justificaciones...');
  console.log('='.repeat(60));
  
  try {
    // Login
    await loginDocente();
    
    // Crear justificación
    const nuevaJustificacion = await crearJustificacion();
    
    // Listar
    await listarJustificaciones();
    
    // Estadísticas
    await obtenerEstadisticas();
    
    // Actualizar (si se creó correctamente)
    if (nuevaJustificacion?.id) {
      await actualizarJustificacion(nuevaJustificacion.id);
    }
    
    // Validaciones
    await probarValidaciones();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Pruebas completadas exitosamente');
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ Pruebas finalizadas con errores');
    console.log('Error:', error.message);
  }
}

// Ejecutar
ejecutarPruebas();
