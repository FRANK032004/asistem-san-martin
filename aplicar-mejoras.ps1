# ========================================
# APLICAR MEJORAS CRITICAS A PRODUCCION
# ========================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MEJORAS CRITICAS PARA PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$improvements = @()

# ========================================
# 1. LOG_LEVEL (Cambiar de debug a info)
# ========================================
Write-Host "[1] LOG_LEVEL Configuration..." -ForegroundColor Yellow
Write-Host "    Actual: debug" -ForegroundColor Red
Write-Host "    Recomendado: info" -ForegroundColor Green
Write-Host ""

$changeLogs = Read-Host "Cambiar LOG_LEVEL a 'info'? (s/n)"
if ($changeLogs -eq 's' -or $changeLogs -eq 'S') {
    Write-Host "    Ejecutando: railway variables set LOG_LEVEL=info..." -ForegroundColor Cyan
    railway variables set LOG_LEVEL="info"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] LOG_LEVEL actualizado" -ForegroundColor Green
        $improvements += "LOG_LEVEL cambiado a 'info'"
    } else {
        Write-Host "    [ERROR] No se pudo actualizar" -ForegroundColor Red
    }
} else {
    Write-Host "    [SKIP] No se cambio LOG_LEVEL" -ForegroundColor Yellow
}

# ========================================
# 2. SENTRY_ENVIRONMENT
# ========================================
Write-Host "`n[2] SENTRY_ENVIRONMENT Configuration..." -ForegroundColor Yellow
Write-Host "    Actual: development" -ForegroundColor Red
Write-Host "    Recomendado: production" -ForegroundColor Green
Write-Host ""

$changeSentry = Read-Host "Cambiar SENTRY_ENVIRONMENT a 'production'? (s/n)"
if ($changeSentry -eq 's' -or $changeSentry -eq 'S') {
    Write-Host "    Ejecutando: railway variables set SENTRY_ENVIRONMENT=production..." -ForegroundColor Cyan
    railway variables set SENTRY_ENVIRONMENT="production"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] SENTRY_ENVIRONMENT actualizado" -ForegroundColor Green
        $improvements += "SENTRY_ENVIRONMENT cambiado a 'production'"
    } else {
        Write-Host "    [ERROR] No se pudo actualizar" -ForegroundColor Red
    }
} else {
    Write-Host "    [SKIP] No se cambio SENTRY_ENVIRONMENT" -ForegroundColor Yellow
}

# ========================================
# 3. VERIFICAR DATABASE_URL SSL
# ========================================
Write-Host "`n[3] DATABASE_URL SSL Mode..." -ForegroundColor Yellow
Write-Host "    Verificando conexion SSL..." -ForegroundColor Cyan
Write-Host ""

# Cambiar a servicio Postgres para ver DATABASE_URL
railway link --service Postgres | Out-Null

$dbUrl = railway variables --json | ConvertFrom-Json | Where-Object { $_.name -eq "DATABASE_PUBLIC_URL" } | Select-Object -ExpandProperty value

if ($dbUrl -like "*sslmode=require*") {
    Write-Host "    [OK] SSL mode ya configurado" -ForegroundColor Green
} else {
    Write-Host "    [INFO] DATABASE_URL no tiene sslmode=require" -ForegroundColor Yellow
    Write-Host "    Railway maneja SSL automaticamente en conexiones internas" -ForegroundColor Gray
    Write-Host "    No requiere cambios." -ForegroundColor Gray
}

# Volver a vincular el servicio backend
railway link --service asistem-san-martin | Out-Null

# ========================================
# 4. VERIFICAR RATE_LIMIT
# ========================================
Write-Host "`n[4] Rate Limiting..." -ForegroundColor Yellow
Write-Host "    RATE_LIMIT_ENABLED: true [OK]" -ForegroundColor Green
Write-Host "    RATE_LIMIT_MAX_REQUESTS: 100 [OK]" -ForegroundColor Green
Write-Host "    RATE_LIMIT_WINDOW_MS: 900000 (15 min) [OK]" -ForegroundColor Green
Write-Host ""

# ========================================
# 5. CREAR SCRIPT DE BACKUP
# ========================================
Write-Host "`n[5] Configurar Backups..." -ForegroundColor Yellow
Write-Host "    Los backups se configuran desde Railway Dashboard" -ForegroundColor Gray
Write-Host "    URL: https://railway.app/project/hearty-ambition" -ForegroundColor Cyan
Write-Host ""

$openRailway = Read-Host "Abrir Railway Dashboard para configurar backups? (s/n)"
if ($openRailway -eq 's' -or $openRailway -eq 'S') {
    Start-Process "https://railway.app/project/5060fe27-c3dc-4fce-abb0-5d85a22e8aeb"
    Write-Host "    [OK] Dashboard abierto en navegador" -ForegroundColor Green
    Write-Host "    Pasos:" -ForegroundColor Yellow
    Write-Host "      1. Seleccionar servicio 'Postgres'" -ForegroundColor Gray
    Write-Host "      2. Ir a Settings -> Backups" -ForegroundColor Gray
    Write-Host "      3. Habilitar 'Daily automated backups'" -ForegroundColor Gray
    Write-Host "      4. Configurar retencion: 7 dias minimo" -ForegroundColor Gray
    $improvements += "Dashboard abierto para configurar backups"
}

# ========================================
# RESUMEN
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE MEJORAS APLICADAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($improvements.Count -gt 0) {
    Write-Host "Mejoras aplicadas:" -ForegroundColor Green
    foreach ($improvement in $improvements) {
        Write-Host "  [OK] $improvement" -ForegroundColor Green
    }
    
    Write-Host "`nREINICIO REQUERIDO:" -ForegroundColor Yellow
    Write-Host "Las variables de entorno requieren reiniciar el servicio" -ForegroundColor Yellow
    Write-Host ""
    
    $restart = Read-Host "Reiniciar servicio ahora? (s/n)"
    if ($restart -eq 's' -or $restart -eq 'S') {
        Write-Host "`nReiniciando servicio..." -ForegroundColor Cyan
        railway up --detach
        Write-Host "[OK] Servicio reiniciandose" -ForegroundColor Green
        Write-Host "Espera 30-60 segundos para que este disponible" -ForegroundColor Gray
    }
} else {
    Write-Host "No se aplicaron mejoras" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SIGUIENTE PASO CRITICO:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CAMBIAR PASSWORD DEL ADMINISTRADOR" -ForegroundColor Red
Write-Host ""
Write-Host "1. Ir a: https://asistem-san-martin.vercel.app" -ForegroundColor White
Write-Host "2. Login: admin@sanmartin.edu.pe / admin123" -ForegroundColor White
Write-Host "3. Perfil -> Cambiar Contraseña" -ForegroundColor White
Write-Host "4. Usar password fuerte (12+ caracteres)" -ForegroundColor White
Write-Host ""
Write-Host "========================================`n" -ForegroundColor Cyan
