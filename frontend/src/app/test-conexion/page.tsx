'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export default function TestConexionPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    testConexion();
  }, []);

  const testConexion = async () => {
    addLog('🔍 Iniciando test de conexión...');
    
    // 1. Verificar token en cookies
    const tokenFromCookies = Cookies.get('token');
    setToken(tokenFromCookies || null);
    addLog(tokenFromCookies ? '✅ Token encontrado en cookies' : '❌ NO hay token en cookies');
    
    if (!tokenFromCookies) {
      addLog('⚠️ Debes iniciar sesión primero');
      return;
    }

    // 2. Intentar obtener estadísticas
    try {
      addLog('📡 Haciendo request a /api/admin/estadisticas...');
      const response = await api.get('/admin/estadisticas');
      addLog('✅ Response recibida exitosamente');
      addLog(`📊 Datos: ${JSON.stringify(response.data.data, null, 2)}`);
      setEstadisticas(response.data.data);
    } catch (error: any) {
      addLog('❌ Error al obtener estadísticas');
      addLog(`❌ Status: ${error.response?.status}`);
      addLog(`❌ Mensaje: ${error.response?.data?.message || error.message}`);
      addLog(`❌ Data: ${JSON.stringify(error.response?.data)}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Test de Conexión Backend-Frontend</h1>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>🔑 Estado del Token</h2>
        <p><strong>Token presente:</strong> {token ? 'SÍ' : 'NO'}</p>
        {token && (
          <p style={{ wordBreak: 'break-all', fontSize: '11px' }}>
            <strong>Token:</strong> {token.substring(0, 100)}...
          </p>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>📊 Estadísticas</h2>
        {estadisticas ? (
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(estadisticas, null, 2)}
          </pre>
        ) : (
          <p>No hay estadísticas (ver logs abajo)</p>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#000', color: '#0f0', borderRadius: '8px' }}>
        <h2>📋 Logs</h2>
        <div style={{ maxHeight: '400px', overflow: 'auto', fontSize: '12px' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '5px' }}>{log}</div>
          ))}
        </div>
      </div>

      <button 
        onClick={testConexion}
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          background: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        🔄 Probar Nuevamente
      </button>

      <a 
        href="/login"
        style={{ 
          marginLeft: '10px',
          display: 'inline-block',
          marginTop: '20px', 
          padding: '10px 20px', 
          background: '#10b981', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '16px'
        }}
      >
        🔐 Ir a Login
      </a>

      <a 
        href="/admin"
        style={{ 
          marginLeft: '10px',
          display: 'inline-block',
          marginTop: '20px', 
          padding: '10px 20px', 
          background: '#6366f1', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '16px'
        }}
      >
        📊 Ir a Admin
      </a>
    </div>
  );
}
