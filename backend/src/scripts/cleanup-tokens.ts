/**
 * 🧹 Script de Mantenimiento de Tokens
 * 
 * Limpia tokens expirados de la base de datos
 * Recomendado ejecutar diariamente con cron
 * 
 * Uso:
 *   npx ts-node src/scripts/cleanup-tokens.ts
 * 
 * O en cron (diario a las 3 AM):
 *   0 3 * * * cd /ruta/backend && npx ts-node src/scripts/cleanup-tokens.ts
 */

import { refreshTokenService } from '../services/refreshToken.service';

async function cleanupExpiredTokens() {
  console.log('🧹 Iniciando limpieza de tokens expirados...');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    const deletedCount = await refreshTokenService.cleanExpiredTokens();
    
    if (deletedCount > 0) {
      console.log(`✅ ${deletedCount} token(s) expirado(s) eliminado(s)`);
    } else {
      console.log('✅ No hay tokens expirados para eliminar');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al limpiar tokens:', error);
    process.exit(1);
  }
}

// Ejecutar script
cleanupExpiredTokens();
