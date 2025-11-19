import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    console.log('🔍 Verificando si la base de datos tiene datos...');
    
    // Verificar si existe al menos un usuario
    const userCount = await prisma.usuarios.count();
    
    if (userCount === 0) {
      console.log('📦 Base de datos vacía. Ejecutando seed...');
      execSync('npm run prisma:seed', { stdio: 'inherit' });
    } else {
      console.log(`✅ Base de datos ya tiene ${userCount} usuarios. Saltando seed.`);
    }
  } catch (error) {
    console.warn('⚠️  No se pudo verificar la base de datos:', error);
    // No lanzar error para que el servidor inicie de todos modos
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeed();
