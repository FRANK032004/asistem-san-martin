#!/usr/bin/env node

/**
 * 🎨 GENERADOR DE ICONOS PROFESIONALES PARA PWA
 * Crea iconos de alta calidad con gradientes y tipografía clara
 * - SVG base con diseño profesional
 * - Exportación a PNG en múltiples resoluciones
 * - Optimización para iOS y Android
 */

const fs = require('fs');
const path = require('path');

// Diseño SVG profesional con gradiente y tipografía limpia
const generateProfessionalSVG = (size) => {
  const fontSize = size * 0.35; // Tamaño de fuente proporcional
  const subFontSize = size * 0.12; // Subtítulo
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Fondo con gradiente -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bgGradient)"/>
  
  <!-- Círculo decorativo con sombra -->
  <circle cx="${size * 0.5}" cy="${size * 0.35}" r="${size * 0.25}" fill="rgba(255,255,255,0.1)" filter="url(#shadow)"/>
  
  <!-- Texto principal "AS" con sombra y fuente sans-serif moderna -->
  <text 
    x="${size * 0.5}" 
    y="${size * 0.42}" 
    font-family="'Segoe UI', Arial, sans-serif" 
    font-size="${fontSize}px" 
    font-weight="700" 
    fill="#ffffff" 
    text-anchor="middle" 
    dominant-baseline="middle"
    filter="url(#shadow)"
    style="letter-spacing: ${size * 0.02}px;">AS</text>
  
  <!-- Subtítulo "San Martín" -->
  <text 
    x="${size * 0.5}" 
    y="${size * 0.75}" 
    font-family="'Segoe UI', Arial, sans-serif" 
    font-size="${subFontSize}px" 
    font-weight="600" 
    fill="#ffffff" 
    text-anchor="middle" 
    opacity="0.95"
    style="letter-spacing: ${size * 0.004}px;">San Martín</text>
  
  <!-- Barra decorativa inferior -->
  <rect x="${size * 0.3}" y="${size * 0.85}" width="${size * 0.4}" height="${size * 0.02}" rx="${size * 0.01}" fill="rgba(255,255,255,0.3)"/>
</svg>`;
};

// Tamaños necesarios para PWA iOS y Android
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Crear directorio si no existe
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar SVG base profesional
const baseSVG = generateProfessionalSVG(512);
fs.writeFileSync(path.join(iconsDir, 'icon-base.svg'), baseSVG);

console.log('✅ SVG base generado: public/icons/icon-base.svg');
console.log('\n📋 Para generar los PNG, ejecuta:');
console.log('   npm install -g sharp-cli');
console.log('   cd frontend/public/icons');

sizes.forEach(size => {
  const svg = generateProfessionalSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`   sharp icon-${size}x${size}.svg -o icon-${size}x${size}.png`);
});

console.log('\n🎨 Iconos SVG generados exitosamente!');
