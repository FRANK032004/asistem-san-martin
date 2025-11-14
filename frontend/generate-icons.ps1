# Script para copiar el SVG como iconos PWA
# Nota: Para producción, considera usar sharp o un servicio online

Write-Host "🎨 Generando iconos PWA..." -ForegroundColor Cyan

$source = "public\logo-source.svg"
$iconDir = "public\icons"

if (!(Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir | Out-Null
    Write-Host "📁 Directorio de iconos creado" -ForegroundColor Green
}

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($size in $sizes) {
    $dest = "$iconDir\icon-$size" + "x" + "$size.png"
    
    # Por ahora, solo crear archivos placeholder
    # En producción, usa: https://realfavicongenerator.net/ o npm install sharp
    
    Write-Host "📝 Pendiente: icon-$size" + "x" + "$size.png" -ForegroundColor Yellow
}

Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Para generar los iconos PNG reales, usa una de estas opciones:" -ForegroundColor White
Write-Host "1. Online: https://realfavicongenerator.net/" -ForegroundColor Cyan
Write-Host "2. npm: npm install sharp && node generate-pwa-icons.js" -ForegroundColor Cyan
Write-Host "3. Manual: Usa un editor de imágenes para crear los PNGs desde logo-source.svg`n" -ForegroundColor Cyan

Write-Host "✅ Script completado" -ForegroundColor Green
Write-Host "📁 Los iconos deben colocarse en: $iconDir" -ForegroundColor White
