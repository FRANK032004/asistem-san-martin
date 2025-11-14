const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocentes() {
  try {
    console.log('🔍 Consultando docentes en la base de datos...\n');
    
    const docentes = await prisma.docentes.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            email: true,
            nombres: true,
            apellidos: true,
            activo: true
          }
        }
      },
      take: 5
    });
    
    if (docentes.length === 0) {
      console.log('⚠️ No se encontraron docentes en la base de datos');
    } else {
      console.log(`✅ Encontrados ${docentes.length} docentes:\n`);
      
      docentes.forEach((doc, index) => {
        console.log(`${index + 1}. Docente ID: ${doc.id}`);
        console.log(`   Usuario: ${doc.usuarios.nombres} ${doc.usuarios.apellidos}`);
        console.log(`   Email: ${doc.usuarios.email}`);
        console.log(`   Código: ${doc.codigo_docente || 'N/A'}`);
        console.log(`   Activo: ${doc.usuarios.activo ? 'Sí' : 'No'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocentes();
