import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔍 Verificando usuario administrador...');
    
    // Verificar si existe el rol ADMIN
    let adminRole = await prisma.role.findFirst({
      where: { nombre: 'ADMIN' }
    });

    if (!adminRole) {
      console.log('📝 Creando rol ADMIN...');
      adminRole = await prisma.role.create({
        data: {
          nombre: 'ADMIN',
          descripcion: 'Administrador del sistema'
        }
      });
    }

    // Verificar si existe el usuario admin
    const existingUser = await prisma.usuario.findUnique({
      where: { email: 'admin@sanmartin.edu.pe' },
      include: { rol: true }
    });

    if (existingUser) {
      console.log('👤 Usuario admin existe. Actualizando contraseña...');
      
      // Generar nuevo hash de contraseña
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Actualizar usuario
      await prisma.usuario.update({
        where: { email: 'admin@sanmartin.edu.pe' },
        data: {
          passwordHash: hashedPassword,
          rolId: adminRole.id
        }
      });
      
      console.log('✅ Contraseña actualizada correctamente');
    } else {
      console.log('👤 Creando usuario administrador...');
      
      // Generar hash de contraseña
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Crear usuario admin
      const adminUser = await prisma.usuario.create({
        data: {
          email: 'admin@sanmartin.edu.pe',
          passwordHash: hashedPassword,
          nombres: 'Administrador',
          apellidos: 'del Sistema',
          dni: '00000000',
          telefono: '999999999',
          rolId: adminRole.id,
          activo: true
        }
      });
      
      console.log('✅ Usuario administrador creado:', adminUser.email);
    }

    // Verificar la contraseña
    const user = await prisma.usuario.findUnique({
      where: { email: 'admin@sanmartin.edu.pe' },
      include: { rol: true }
    });

    if (user) {
      const isValid = await bcrypt.compare('admin123', user.passwordHash);
      console.log('🔐 Verificación de contraseña:', isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
      
      if (isValid) {
        console.log('');
        console.log('🎉 CREDENCIALES LISTAS:');
        console.log('📧 Email: admin@sanmartin.edu.pe');
        console.log('🔑 Contraseña: admin123');
        console.log('👤 Rol:', user.rol.nombre);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
