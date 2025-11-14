# Script para regenerar Prisma Client de forma segura
Write-Host "🔄 Regenerando Prisma Client..." -ForegroundColor Cyan

# Detener procesos Node.js relacionados
Write-Host "⏹️  Deteniendo procesos Node.js..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*ASISTEM_SAN_MARTIN*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 3

# Limpiar carpeta .prisma
Write-Host "🧹 Limpiando cliente anterior..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# Generar nuevo cliente
Write-Host "⚙️  Generando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cliente Prisma generado exitosamente!" -ForegroundColor Green
} else {
    Write-Host "❌ Error al generar cliente Prisma" -ForegroundColor Red
    exit 1
}
