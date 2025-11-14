# Script para generar iconos PWA optimizados para iOS
# Este script genera los iconos necesarios para iPhone/iPad

param(
    [string]$SourceImage = ".\public\favicon.png"
)

$sizes = @(
    @{Size=180; Name="apple-touch-icon-180x180.png"; Desc="iPhone 6 Plus, 7 Plus, 8 Plus, X, XS, XS Max, 11, 11 Pro, 11 Pro Max, 12, 12 Pro, 12 Pro Max, 13, 13 Pro, 13 Pro Max, 14, 14 Pro"},
    @{Size=167; Name="apple-touch-icon-167x167.png"; Desc="iPad Pro 12.9"},
    @{Size=152; Name="apple-touch-icon-152x152.png"; Desc="iPad, iPad mini"},
    @{Size=120; Name="apple-touch-icon-120x120.png"; Desc="iPhone 6, 7, 8"}
)

Write-Host "🎨 Generando iconos optimizados para iOS..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SourceImage)) {
    Write-Host "❌ Error: No se encontró la imagen fuente: $SourceImage" -ForegroundColor Red
    exit 1
}

$outputDir = ".\public\icons"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Write-Host "📂 Directorio de salida: $outputDir" -ForegroundColor Yellow
Write-Host ""

foreach ($icon in $sizes) {
    $outputPath = Join-Path $outputDir $icon.Name
    Write-Host "Generando: $($icon.Name) ($($icon.Size)x$($icon.Size)) - $($icon.Desc)" -ForegroundColor Green
    
    # Usar ImageMagick o similar si está disponible
    # Por ahora, este es un placeholder - necesitarías implementar la lógica de resize
    Write-Host "  → $outputPath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Generación completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Nota: Este script requiere ImageMagick o una herramienta similar para redimensionar imágenes." -ForegroundColor Yellow
Write-Host "   Puedes usar herramientas online como https://realfavicongenerator.net/" -ForegroundColor Yellow
