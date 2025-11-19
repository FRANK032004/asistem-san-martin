const crypto = require('crypto');

console.log('\n========================================');
console.log('🔐 SECRETOS PARA RAILWAY/VERCEL');
console.log('========================================\n');

console.log('Copia estos valores en Railway (Variables de Entorno):\n');

console.log('JWT_SECRET:');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log(jwtSecret);

console.log('\nJWT_REFRESH_SECRET:');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log(jwtRefreshSecret);

console.log('\n========================================');
console.log('⚠️  IMPORTANTE:');
console.log('1. NO compartas estos secretos públicamente');
console.log('2. Usa JWT_SECRET para el primer campo');
console.log('3. Usa JWT_REFRESH_SECRET para el segundo campo');
console.log('4. Son DIFERENTES entre sí (nunca uses el mismo)');
console.log('========================================\n');
