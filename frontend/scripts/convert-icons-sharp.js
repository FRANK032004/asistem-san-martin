#!/usr/bin/env node

/**
 * 🎨 CONVERTIDOR SVG A PNG CON SHARP
 * Convierte iconos SVG a PNG de alta calidad para PWA
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Convirtiendo iconos SVG a PNG de alta calidad...\n');

async function convertSVGtoPNG() {
  for (const size of sizes) {
    const svgFile = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngFile = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    if (!fs.existsSync(svgFile)) {
      console.log(`⚠️  icon-${size}x${size}.svg no encontrado, saltando...`);
      continue;
    }
    
    try {
      await sharp(svgFile, {
        density: 300 // Alta resolución
      })
        .resize(size, size)
        .png({
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toFile(pngFile);
      
      console.log(`✅ icon-${size}x${size}.png (${size}x${size}px)`);
      
    } catch (error) {
      console.error(`❌ Error con icon-${size}x${size}.svg:`, error.message);
    }
  }
  
  console.log('\n🎉 ¡Conversión completada!');
  console.log(`\n📱 Los nuevos iconos están en:\n   ${iconsDir}`);
}

convertSVGtoPNG();
