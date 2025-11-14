// Script de debugging para login
// Ejecutar en la consola del navegador

async function testLogin() {
  try {
    console.log('🔍 Probando login...');
    
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sanmartin.edu.pe',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('📡 Response status:', response.status);
    console.log('📄 Response data:', data);
    
    if (data.success) {
      console.log('✅ Login exitoso!');
      console.log('👤 Usuario:', data.data.user);
      console.log('🔑 Token:', data.data.token);
    } else {
      console.log('❌ Login falló:', data.message);
    }
    
    return data;
  } catch (error) {
    console.error('💥 Error en login:', error);
    return null;
  }
}

// Ejecutar la prueba
testLogin();
