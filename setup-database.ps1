# ========================================
# SCRIPT DE CONFIGURACION INICIAL DE BD
# Ejecuta el seed para poblar datos iniciales
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACION INICIAL DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script ejecutara el seed para crear:" -ForegroundColor White
Write-Host "  - Usuario administrador (admin@sanmartin.edu.pe)" -ForegroundColor Gray
Write-Host "  - 2 roles (Administrador y Docente)" -ForegroundColor Gray
Write-Host "  - 6 areas academicas" -ForegroundColor Gray
Write-Host "  - 5 docentes de prueba" -ForegroundColor Gray
Write-Host "  - 2 ubicaciones GPS permitidas" -ForegroundColor Gray
Write-Host ""

# Verificar si Railway CLI esta instalado
Write-Host "Verificando Railway CLI..." -ForegroundColor Cyan
try {
    $railwayVersion = railway --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway CLI instalado: $railwayVersion" -ForegroundColor Green
    } else {
        throw "No instalado"
    }
} catch {
    Write-Host "❌ Railway CLI no encontrado" -ForegroundColor Red
    Write-Host "`n📦 Instalando Railway CLI..." -ForegroundColor Yellow
    
    try {
        npm install -g @railway/cli
        Write-Host "✅ Railway CLI instalado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al instalar Railway CLI" -ForegroundColor Red
        Write-Host "`nPor favor instala manualmente:" -ForegroundColor Yellow
        Write-Host "npm install -g @railway/cli" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "Verificando autenticacion con Railway..." -ForegroundColor Cyan

# Intentar ejecutar un comando de Railway para verificar auth
try {
    $projectCheck = railway whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ADVERTENCIA: No estas autenticado en Railway" -ForegroundColor Yellow
        Write-Host "`nIniciando proceso de login..." -ForegroundColor Cyan
        railway login
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Error al hacer login" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ Autenticado en Railway" -ForegroundColor Green
    }
} catch {
    Write-Host "Iniciando login..." -ForegroundColor Yellow
    railway login
}

Write-Host ""
Write-Host "Vinculando proyecto..." -ForegroundColor Cyan
Write-Host "Selecciona el proyecto 'asistem-san-martin' cuando se te pregunte`n" -ForegroundColor Yellow

# Verificar si ya está vinculado
$isLinked = Test-Path ".railway"
if ($isLinked) {
    Write-Host "✅ Proyecto ya vinculado" -ForegroundColor Green
} else {
    railway link
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al vincular proyecto" -ForegroundColor Red
        Write-Host "`nAsegúrate de seleccionar el proyecto correcto" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ADVERTENCIA IMPORTANTE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Este comando va a:" -ForegroundColor White
Write-Host "  1. Conectarse a tu base de datos de PRODUCCIÓN" -ForegroundColor Yellow
Write-Host "  2. Crear datos iniciales (usuarios, docentes, áreas, etc.)" -ForegroundColor Yellow
Write-Host "`nNOTA: Si ya ejecutaste el seed antes, se crearán" -ForegroundColor Red
Write-Host "      duplicados. Ejecuta solo UNA vez." -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Estas seguro de continuar? (s/n)"
if ($confirmation -ne 's' -and $confirmation -ne 'S') {
    Write-Host "`nOperacion cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 EJECUTANDO SEED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Ejecutando: railway run npm run prisma:seed..." -ForegroundColor Yellow
Write-Host "Esto puede tardar 30-60 segundos...`n" -ForegroundColor Gray

try {
    railway run npm run prisma:seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "✅ SEED EJECUTADO EXITOSAMENTE" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        
        Write-Host "Datos creados:" -ForegroundColor White
        Write-Host "  [OK] Usuario Admin: admin@sanmartin.edu.pe" -ForegroundColor Green
        Write-Host "  [OK] Password: admin123" -ForegroundColor Green
        Write-Host "  [OK] 2 Roles" -ForegroundColor Green
        Write-Host "  [OK] 6 Areas academicas" -ForegroundColor Green
        Write-Host "  [OK] 5 Docentes de prueba" -ForegroundColor Green
        Write-Host "  [OK] 2 Ubicaciones GPS" -ForegroundColor Green
        
        Write-Host "`nPROXIMOS PASOS:" -ForegroundColor Cyan
        Write-Host "  1. Ir a: https://asistem-san-martin.vercel.app" -ForegroundColor White
        Write-Host "  2. Login con:" -ForegroundColor White
        Write-Host "     Email: admin@sanmartin.edu.pe" -ForegroundColor Gray
        Write-Host "     Password: admin123" -ForegroundColor Gray
        Write-Host "  3. Explorar el sistema" -ForegroundColor White
        
        Write-Host "`nTesting:" -ForegroundColor Cyan
        Write-Host "  Ejecuta: .\test-production.ps1" -ForegroundColor White
        
    } else {
        Write-Host "`n❌ ERROR AL EJECUTAR SEED" -ForegroundColor Red
        Write-Host "`nPosibles causas:" -ForegroundColor Yellow
        Write-Host "  - Database no esta conectada" -ForegroundColor Gray
        Write-Host "  - Seed ya fue ejecutado antes (datos duplicados)" -ForegroundColor Gray
        Write-Host "  - Error en la conexion" -ForegroundColor Gray
        Write-Host "`nRevisa los logs arriba para más detalles" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
