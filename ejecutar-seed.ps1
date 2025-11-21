# Script simplificado para ejecutar seed en produccion
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EJECUTANDO SEED EN PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Railway CLI
Write-Host "[1/4] Verificando Railway CLI..." -ForegroundColor Yellow
try {
    $version = railway --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      OK - Railway CLI instalado" -ForegroundColor Green
    } else {
        Write-Host "      Instalando Railway CLI..." -ForegroundColor Yellow
        npm install -g @railway/cli
    }
} catch {
    Write-Host "      Instalando Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

Write-Host ""
Write-Host "[2/4] Autenticando con Railway..." -ForegroundColor Yellow
Write-Host "      Se abrira el navegador para login" -ForegroundColor Gray
railway login

Write-Host ""
Write-Host "[3/4] Vinculando proyecto..." -ForegroundColor Yellow
Write-Host "      Selecciona: asistem-san-martin" -ForegroundColor Gray
railway link

Write-Host ""
Write-Host "[4/4] Ejecutando seed..." -ForegroundColor Yellow
Write-Host "      Esto tardara 30-60 segundos" -ForegroundColor Gray
Write-Host ""
railway run npm run prisma:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SEED EJECUTADO CORRECTAMENTE" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credenciales de acceso:" -ForegroundColor Cyan
    Write-Host "  Email: admin@sanmartin.edu.pe" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "URL: https://asistem-san-martin.vercel.app" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR al ejecutar seed" -ForegroundColor Red
    Write-Host "Revisa los mensajes anteriores" -ForegroundColor Yellow
}
