/**
 * Script para generar iconos PWA en todos los tamaños requeridos
 * Requiere: npm install sharp
 * Uso: node generate-pwa-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_IMAGE = path.join(__dirname, 'public', 'logo-source.png'); // Imagen fuente (mínimo 512x512)
const OUTPUT_DIR = path.join(__dirname, 'public', 'icons');
const BACKGROUND_COLOR = '#1e40af'; // Azul del sistema

// Crear directorio si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('📁 Directorio de iconos creado');
}

// Verificar si existe imagen fuente
if (!fs.existsSync(SOURCE_IMAGE)) {
  console.log('⚠️  No se encontró logo-source.png');
  console.log('📝 Creando icono placeholder...');
  
  // Crear SVG placeholder
  const svgContent = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="${BACKGROUND_COLOR}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="200" fill="white" 
            text-anchor="middle" dominant-baseline="middle" font-weight="bold">AS</text>
      <text x="50%" y="70%" font-family="Arial, sans-serif" font-size="40" fill="white" 
            text-anchor="middle" font-weight="normal">ASISTEM</text>
    </svg>
  `;
  
  fs.writeFileSync(SOURCE_IMAGE, svgContent);
  console.log('✅ Icono placeholder creado');
}

// Función para generar icono
async function generateIcon(size) {
  const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
  
  try {
    await sharp(SOURCE_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: BACKGROUND_COLOR
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Generado: icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`❌ Error generando icono ${size}x${size}:`, error.message);
  }
}

// Generar todos los iconos
async function generateAllIcons() {
  console.log('🎨 Generando iconos PWA...\n');
  
  for (const size of ICON_SIZES) {
    await generateIcon(size);
  }
  
  // Generar favicon.ico
  try {
    await sharp(SOURCE_IMAGE)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, 'public', 'favicon.png'));
    
    console.log('✅ Generado: favicon.png');
  } catch (error) {
    console.error('❌ Error generando favicon:', error.message);
  }
  
  console.log('\n✅ ¡Todos los iconos generados correctamente!');
  console.log(`📁 Ubicación: ${OUTPUT_DIR}`);
}

// Ejecutar
generateAllIcons().catch(console.error);
