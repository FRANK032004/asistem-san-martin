# Script para ejecutar seed usando DATABASE_PUBLIC_URL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EJECUTANDO SEED CON URL PUBLICA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio backend
Set-Location backend

# Obtener DATABASE_PUBLIC_URL de Railway
Write-Host "Obteniendo URL publica de base de datos..." -ForegroundColor Yellow
railway link --service Postgres | Out-Null

$dbPublicUrl = railway variables --json | ConvertFrom-Json | Where-Object { $_.name -eq "DATABASE_PUBLIC_URL" } | Select-Object -ExpandProperty value

if (-not $dbPublicUrl) {
    Write-Host "ERROR: No se pudo obtener DATABASE_PUBLIC_URL" -ForegroundColor Red
    Write-Host "Ejecutando seed directamente..." -ForegroundColor Yellow
    railway run npm run prisma:seed
    exit
}

Write-Host "URL obtenida exitosamente" -ForegroundColor Green
Write-Host ""

# Configurar variable de entorno temporal
$env:DATABASE_URL = $dbPublicUrl

Write-Host "Ejecutando seed..." -ForegroundColor Yellow
npm run prisma:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SEED EJECUTADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credenciales:" -ForegroundColor Cyan
    Write-Host "  Email: admin@sanmartin.edu.pe" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "URL: https://asistem-san-martin.vercel.app" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ERROR al ejecutar seed" -ForegroundColor Red
}

# Volver al directorio raiz
Set-Location ..
