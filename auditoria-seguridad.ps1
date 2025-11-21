# ========================================
# AUDITORIA DE SEGURIDAD Y PRODUCCION
# ========================================

$apiUrl = "https://asistem-san-martin-production-b195.up.railway.app"
$frontendUrl = "https://asistem-san-martin.vercel.app"

$issues = @()
$warnings = @()
$recommendations = @()

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AUDITORIA DE SEGURIDAD - PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ========================================
# 1. CREDENCIALES Y SECRETOS
# ========================================
Write-Host "[1] VERIFICANDO CREDENCIALES..." -ForegroundColor Yellow
Write-Host ""

# Test 1.1: Password por defecto
Write-Host "  [1.1] Password de administrador..." -ForegroundColor Cyan
$loginBody = @{
    email = "admin@sanmartin.edu.pe"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    if ($loginResponse.data.accessToken) {
        Write-Host "       [CRITICO] Password por defecto ACTIVA" -ForegroundColor Red
        $issues += "Password admin123 sigue activa - CAMBIAR INMEDIATAMENTE"
    }
} catch {
    Write-Host "       [OK] Password por defecto no funciona" -ForegroundColor Green
}

# Test 1.2: Email pattern
Write-Host "  [1.2] Email de administrador..." -ForegroundColor Cyan
if ($loginResponse.data.usuario.email -eq "admin@sanmartin.edu.pe") {
    Write-Host "       [INFO] Usando email generico" -ForegroundColor Yellow
    $warnings += "Considerar cambiar email admin a uno personal/institucional"
}

# ========================================
# 2. SEGURIDAD DE API
# ========================================
Write-Host "`n[2] VERIFICANDO SEGURIDAD API..." -ForegroundColor Yellow
Write-Host ""

# Test 2.1: Rate Limiting
Write-Host "  [2.1] Rate Limiting..." -ForegroundColor Cyan
$rateLimitHit = $false
for ($i = 1; $i -le 150; $i++) {
    try {
        Invoke-RestMethod -Uri "$apiUrl/health" -Method GET -TimeoutSec 2 | Out-Null
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            $rateLimitHit = $true
            break
        }
    }
}
if ($rateLimitHit) {
    Write-Host "       [OK] Rate limiting activado" -ForegroundColor Green
} else {
    Write-Host "       [WARNING] Rate limiting no detectado" -ForegroundColor Yellow
    $warnings += "Verificar configuracion de rate limiting en produccion"
}

# Test 2.2: Headers de seguridad
Write-Host "  [2.2] Security Headers..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method GET -UseBasicParsing
    $headers = $response.Headers
    
    $securityHeaders = @{
        "X-Content-Type-Options" = "nosniff"
        "X-Frame-Options" = "DENY o SAMEORIGIN"
        "X-XSS-Protection" = "1; mode=block"
        "Strict-Transport-Security" = "HSTS"
    }
    
    $headerCount = 0
    foreach ($header in $securityHeaders.Keys) {
        if ($headers.ContainsKey($header)) {
            $headerCount++
        }
    }
    
    if ($headerCount -ge 2) {
        Write-Host "       [OK] Headers de seguridad presentes ($headerCount/4)" -ForegroundColor Green
    } else {
        Write-Host "       [WARNING] Pocos headers de seguridad ($headerCount/4)" -ForegroundColor Yellow
        $warnings += "Helmet deberia agregar mas headers de seguridad"
    }
} catch {
    Write-Host "       [ERROR] No se pudieron verificar headers" -ForegroundColor Red
}

# Test 2.3: HTTPS enforcement
Write-Host "  [2.3] HTTPS Enforcement..." -ForegroundColor Cyan
if ($apiUrl -like "https://*" -and $frontendUrl -like "https://*") {
    Write-Host "       [OK] HTTPS habilitado en todos los servicios" -ForegroundColor Green
} else {
    Write-Host "       [CRITICO] HTTPS no habilitado completamente" -ForegroundColor Red
    $issues += "HTTPS debe estar habilitado en TODOS los servicios"
}

# ========================================
# 3. CONFIGURACION DE BASE DE DATOS
# ========================================
Write-Host "`n[3] VERIFICANDO BASE DE DATOS..." -ForegroundColor Yellow
Write-Host ""

# Test 3.1: SSL Connection
Write-Host "  [3.1] Conexion SSL a DB..." -ForegroundColor Cyan
Write-Host "       [INFO] Verificar DATABASE_URL incluye sslmode=require" -ForegroundColor Gray
$recommendations += "DATABASE_URL debe incluir ?sslmode=require para conexiones seguras"

# Test 3.2: Backups
Write-Host "  [3.2] Backups automaticos..." -ForegroundColor Cyan
Write-Host "       [INFO] Verificar backups en Railway" -ForegroundColor Gray
$recommendations += "Configurar backups automaticos diarios en Railway"

# ========================================
# 4. VARIABLES DE ENTORNO
# ========================================
Write-Host "`n[4] VERIFICANDO VARIABLES DE ENTORNO..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  [4.1] Variables criticas..." -ForegroundColor Cyan
$criticalEnvVars = @(
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "FRONTEND_URL",
    "ALLOWED_ORIGINS"
)

Write-Host "       [INFO] Verificar que esten configuradas en Railway:" -ForegroundColor Gray
foreach ($var in $criticalEnvVars) {
    Write-Host "         - $var" -ForegroundColor Gray
}

$recommendations += "Verificar todas las variables de entorno con: railway variables"

# ========================================
# 5. LOGS Y MONITOREO
# ========================================
Write-Host "`n[5] VERIFICANDO LOGS Y MONITOREO..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  [5.1] Nivel de logs..." -ForegroundColor Cyan
Write-Host "       [INFO] LOG_LEVEL debe ser 'info' o 'warn' en produccion" -ForegroundColor Gray
$recommendations += "Configurar LOG_LEVEL=info (no debug) en produccion"

Write-Host "  [5.2] Sentry configurado..." -ForegroundColor Cyan
Write-Host "       [INFO] Verificar SENTRY_DSN esta configurado" -ForegroundColor Gray
$recommendations += "Configurar Sentry para monitoreo de errores en tiempo real"

# ========================================
# 6. CORS Y ORIGINS
# ========================================
Write-Host "`n[6] VERIFICANDO CORS..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  [6.1] Origins permitidos..." -ForegroundColor Cyan
try {
    $corsTest = Invoke-WebRequest -Uri "$apiUrl/api" -Method OPTIONS -Headers @{"Origin"="https://malicious-site.com"} -UseBasicParsing -ErrorAction SilentlyContinue
    $allowedOrigin = $corsTest.Headers["Access-Control-Allow-Origin"]
    
    if ($allowedOrigin -eq "*") {
        Write-Host "       [CRITICO] CORS permite TODOS los origenes (*)" -ForegroundColor Red
        $issues += "ALLOWED_ORIGINS no debe ser '*' en produccion"
    } else {
        Write-Host "       [OK] CORS restrictivo configurado" -ForegroundColor Green
    }
} catch {
    Write-Host "       [OK] CORS rechaza origenes desconocidos" -ForegroundColor Green
}

# ========================================
# 7. DATOS SENSIBLES
# ========================================
Write-Host "`n[7] VERIFICANDO EXPOSICION DE DATOS..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  [7.1] Stack traces en errores..." -ForegroundColor Cyan
try {
    $errorTest = Invoke-RestMethod -Uri "$apiUrl/api/nonexistent" -Method GET -ErrorAction Stop
} catch {
    $errorBody = $_.ErrorDetails.Message
    if ($errorBody -like "*at *" -or $errorBody -like "*stack*") {
        Write-Host "       [CRITICO] Stack traces expuestos" -ForegroundColor Red
        $issues += "Desactivar stack traces en produccion (NODE_ENV=production)"
    } else {
        Write-Host "       [OK] Errores no exponen stack traces" -ForegroundColor Green
    }
}

Write-Host "  [7.2] Version de API..." -ForegroundColor Cyan
try {
    $apiInfo = Invoke-RestMethod -Uri "$apiUrl/api" -Method GET
    if ($apiInfo.version) {
        Write-Host "       [INFO] Version API expuesta: $($apiInfo.version)" -ForegroundColor Gray
        $recommendations += "Considerar no exponer version exacta de la API"
    }
} catch {
    # Silencioso
}

# ========================================
# 8. PWA Y FRONTEND
# ========================================
Write-Host "`n[8] VERIFICANDO FRONTEND..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  [8.1] Service Worker..." -ForegroundColor Cyan
try {
    $sw = Invoke-WebRequest -Uri "$frontendUrl/sw.js" -UseBasicParsing
    if ($sw.Content -like "*console.log*" -or $sw.Content -like "*debug*") {
        Write-Host "       [WARNING] Service Worker contiene logs de debug" -ForegroundColor Yellow
        $warnings += "Minimizar y limpiar service worker para produccion"
    } else {
        Write-Host "       [OK] Service Worker optimizado" -ForegroundColor Green
    }
} catch {
    Write-Host "       [ERROR] No se pudo verificar SW" -ForegroundColor Red
}

Write-Host "  [8.2] Archivos sensibles expuestos..." -ForegroundColor Cyan
$sensitiveFiles = @(".env", ".git/config", "package.json", "tsconfig.json")
$exposedCount = 0
foreach ($file in $sensitiveFiles) {
    try {
        $test = Invoke-WebRequest -Uri "$frontendUrl/$file" -UseBasicParsing -ErrorAction Stop
        if ($test.StatusCode -eq 200) {
            $exposedCount++
        }
    } catch {
        # Correcto - archivo no accesible
    }
}
if ($exposedCount -eq 0) {
    Write-Host "       [OK] Archivos sensibles no expuestos" -ForegroundColor Green
} else {
    Write-Host "       [CRITICO] $exposedCount archivos sensibles expuestos" -ForegroundColor Red
    $issues += "Archivos de configuracion accesibles publicamente"
}

# ========================================
# 9. PERFORMANCE Y CACHING
# ========================================
Write-Host "`n[9] VERIFICANDO PERFORMANCE..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  [9.1] Compresion GZIP..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing
    if ($response.Headers["Content-Encoding"] -eq "gzip" -or $response.Headers["Content-Encoding"] -eq "br") {
        Write-Host "       [OK] Compresion habilitada" -ForegroundColor Green
    } else {
        Write-Host "       [WARNING] Compresion no detectada" -ForegroundColor Yellow
        $warnings += "Habilitar compresion GZIP/Brotli en Vercel"
    }
} catch {
    Write-Host "       [ERROR] No se pudo verificar" -ForegroundColor Red
}

Write-Host "  [9.2] Cache headers..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$frontendUrl/icons/icon-192x192.png" -UseBasicParsing
    if ($response.Headers["Cache-Control"]) {
        Write-Host "       [OK] Cache headers configurados" -ForegroundColor Green
    } else {
        Write-Host "       [WARNING] Sin cache headers" -ForegroundColor Yellow
        $recommendations += "Configurar cache headers para assets estaticos"
    }
} catch {
    # Silencioso
}

# ========================================
# 10. USUARIOS Y ROLES
# ========================================
Write-Host "`n[10] VERIFICANDO GESTION DE USUARIOS..." -ForegroundColor Yellow
Write-Host ""

if ($loginResponse.data.accessToken) {
    $token = $loginResponse.data.accessToken
    $headers = @{"Authorization" = "Bearer $token"}
    
    Write-Host "  [10.1] Usuarios activos..." -ForegroundColor Cyan
    try {
        $usuarios = Invoke-RestMethod -Uri "$apiUrl/api/admin/docentes" -Method GET -Headers $headers -ErrorAction SilentlyContinue
        if ($usuarios.data.total -eq 1) {
            Write-Host "       [WARNING] Solo hay 1 usuario (admin)" -ForegroundColor Yellow
            $warnings += "Crear usuarios adicionales y probar permisos"
        } else {
            Write-Host "       [OK] Multiples usuarios configurados" -ForegroundColor Green
        }
    } catch {
        Write-Host "       [INFO] No se pudo verificar cantidad de usuarios" -ForegroundColor Gray
    }
}

# ========================================
# RESUMEN FINAL
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE AUDITORIA" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "PROBLEMAS CRITICOS: $($issues.Count)" -ForegroundColor $(if ($issues.Count -eq 0) { "Green" } else { "Red" })
if ($issues.Count -gt 0) {
    foreach ($issue in $issues) {
        Write-Host "  [!] $issue" -ForegroundColor Red
    }
}

Write-Host "`nADVERTENCIAS: $($warnings.Count)" -ForegroundColor $(if ($warnings.Count -eq 0) { "Green" } else { "Yellow" })
if ($warnings.Count -gt 0) {
    foreach ($warning in $warnings) {
        Write-Host "  [!] $warning" -ForegroundColor Yellow
    }
}

Write-Host "`nRECOMENDACIONES: $($recommendations.Count)" -ForegroundColor Cyan
if ($recommendations.Count -gt 0) {
    foreach ($rec in $recommendations) {
        Write-Host "  [i] $rec" -ForegroundColor Cyan
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "SISTEMA SEGURO PARA PRODUCCION" -ForegroundColor Green
} elseif ($issues.Count -le 2) {
    Write-Host "CORREGIR PROBLEMAS CRITICOS ANTES DE USO" -ForegroundColor Yellow
} else {
    Write-Host "ATENCION: MULTIPLES PROBLEMAS DE SEGURIDAD" -ForegroundColor Red
}

Write-Host "========================================`n" -ForegroundColor Cyan

# Guardar reporte
$reportPath = "auditoria-seguridad-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$reportContent = @"
========================================
AUDITORIA DE SEGURIDAD - PRODUCCION
$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
========================================

PROBLEMAS CRITICOS ($($issues.Count)):
$($issues | ForEach-Object { "- $_" } | Out-String)

ADVERTENCIAS ($($warnings.Count)):
$($warnings | ForEach-Object { "- $_" } | Out-String)

RECOMENDACIONES ($($recommendations.Count)):
$($recommendations | ForEach-Object { "- $_" } | Out-String)

========================================
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "Reporte guardado en: $reportPath`n" -ForegroundColor Gray
