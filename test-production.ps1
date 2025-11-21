# ========================================
# SCRIPT DE TESTING COMPLETO EN PRODUCCIÓN
# Sistema ASISTEM San Martín
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 TESTING COMPLETO DE PRODUCCIÓN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# URLs de producción
$BACKEND_URL = "https://asistem-san-martin-production-b195.up.railway.app"
$FRONTEND_URL = "https://asistem-san-martin.vercel.app"

# Función para mostrar resultado
function Show-Result {
    param(
        [string]$Test,
        [bool]$Success,
        [string]$Message = ""
    )
    
    if ($Success) {
        Write-Host "✅ $Test" -ForegroundColor Green
        if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
    } else {
        Write-Host "❌ $Test" -ForegroundColor Red
        if ($Message) { Write-Host "   Error: $Message" -ForegroundColor Yellow }
    }
}

# Resultados globales
$script:PassedTests = 0
$script:FailedTests = 0
$script:Errors = @()

# ========================================
# FASE 1: VERIFICAR BACKEND
# ========================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "FASE 1: TESTING BACKEND (Railway)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Test 1.1: Health Check
Write-Host "🔍 Test 1.1: Health Check del Backend..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Show-Result "Health Check" $true "Backend respondiendo correctamente"
        $script:PassedTests++
    } else {
        Show-Result "Health Check" $false "Status: $($response.status)"
        $script:FailedTests++
        $script:Errors += "Health check devolvió status: $($response.status)"
    }
    Write-Host "   Uptime: $($response.uptime) segundos" -ForegroundColor Gray
    Write-Host "   Environment: $($response.environment)" -ForegroundColor Gray
    Write-Host "   Database: $($response.database.status)" -ForegroundColor Gray
} catch {
    Show-Result "Health Check" $false $_.Exception.Message
    $script:FailedTests++
    $script:Errors += "Health check falló: $($_.Exception.Message)"
}

# Test 1.2: API Info
Write-Host "`n🔍 Test 1.2: API Info Endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api" -Method Get -TimeoutSec 10
    Show-Result "API Info" $true "Versión: $($response.version)"
    $script:PassedTests++
    Write-Host "   Arquitectura: $($response.architecture)" -ForegroundColor Gray
} catch {
    Show-Result "API Info" $false $_.Exception.Message
    $script:FailedTests++
    $script:Errors += "API Info falló: $($_.Exception.Message)"
}

# Test 1.3: CORS Headers
Write-Host "`n🔍 Test 1.3: CORS Headers..." -ForegroundColor Cyan
try {
    $headers = @{
        "Origin" = $FRONTEND_URL
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api" -Method Options -Headers $headers -TimeoutSec 10 -UseBasicParsing
    
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader -contains "*" -or $corsHeader -contains $FRONTEND_URL) {
        Show-Result "CORS Configuration" $true "CORS configurado correctamente"
        $script:PassedTests++
    } else {
        Show-Result "CORS Configuration" $false "Origin no permitido: $corsHeader"
        $script:FailedTests++
        $script:Errors += "CORS no permite el frontend: $FRONTEND_URL"
    }
} catch {
    Show-Result "CORS Configuration" $false $_.Exception.Message
    $script:FailedTests++
    $script:Errors += "CORS test falló: $($_.Exception.Message)"
}

# Test 1.4: Login Endpoint (sin autenticar)
Write-Host "`n🔍 Test 1.4: Login Endpoint..." -ForegroundColor Cyan
try {
    $loginBody = @{
        email = "test@test.com"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/auth/login" -Method Post -Body $loginBody -Headers $headers -TimeoutSec 10
        Show-Result "Login Endpoint" $false "Login aceptó credenciales incorrectas"
        $script:FailedTests++
        $script:Errors += "Login no validó credenciales correctamente"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 400) {
            Show-Result "Login Endpoint" $true "Rechaza credenciales incorrectas (esperado)"
            $script:PassedTests++
        } else {
            Show-Result "Login Endpoint" $false "Error inesperado: $($_.Exception.Message)"
            $script:FailedTests++
            $script:Errors += "Login endpoint error: $($_.Exception.Message)"
        }
    }
} catch {
    Show-Result "Login Endpoint" $false $_.Exception.Message
    $script:FailedTests++
    $script:Errors += "Login test falló: $($_.Exception.Message)"
}

# Test 1.5: Endpoints protegidos (deben devolver 401)
Write-Host "`n🔍 Test 1.5: Protección de Endpoints..." -ForegroundColor Cyan
$protectedEndpoints = @(
    "/api/auth/profile",
    "/api/docentes",
    "/api/asistencias/hoy",
    "/api/admin/docentes"
)

foreach ($endpoint in $protectedEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$BACKEND_URL$endpoint" -Method Get -TimeoutSec 5 -UseBasicParsing
        Show-Result "Protección $endpoint" $false "Endpoint sin protección (devolvió 200)"
        $script:FailedTests++
        $script:Errors += "Endpoint sin autenticación: $endpoint"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Show-Result "Protección $endpoint" $true "Requiere autenticación (esperado)"
            $script:PassedTests++
        } else {
            Show-Result "Protección $endpoint" $false "Error inesperado: $($_.Exception.Response.StatusCode)"
            $script:FailedTests++
            $script:Errors += "Endpoint $endpoint error inesperado"
        }
    }
}

# ========================================
# FASE 2: VERIFICAR FRONTEND
# ========================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "FASE 2: TESTING FRONTEND (Vercel)" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Test 2.1: Frontend Disponible
Write-Host "🔍 Test 2.1: Frontend Accesible..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $FRONTEND_URL -Method Get -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Show-Result "Frontend Disponible" $true "HTTP 200 OK"
        $script:PassedTests++
    } else {
        Show-Result "Frontend Disponible" $false "HTTP $($response.StatusCode)"
        $script:FailedTests++
        $script:Errors += "Frontend devolvió código: $($response.StatusCode)"
    }
} catch {
    Show-Result "Frontend Disponible" $false $_.Exception.Message
    $script:FailedTests++
    $script:Errors += "Frontend no accesible: $($_.Exception.Message)"
}

# Test 2.2: Verificar HTTPS
Write-Host "`n🔍 Test 2.2: HTTPS Configurado..." -ForegroundColor Cyan
if ($FRONTEND_URL -like "https://*") {
    Show-Result "HTTPS Frontend" $true "Usando HTTPS"
    $script:PassedTests++
} else {
    Show-Result "HTTPS Frontend" $false "No usa HTTPS"
    $script:FailedTests++
    $script:Errors += "Frontend no usa HTTPS"
}

# Test 2.3: PWA Manifest
Write-Host "`n🔍 Test 2.3: PWA Manifest..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$FRONTEND_URL/manifest.json" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Show-Result "PWA Manifest" $true "Manifest disponible"
        $script:PassedTests++
    } else {
        Show-Result "PWA Manifest" $false "HTTP $($response.StatusCode)"
        $script:FailedTests++
        $script:Errors += "Manifest no encontrado"
    }
} catch {
    Show-Result "PWA Manifest" $false "No encontrado"
    $script:FailedTests++
    $script:Errors += "PWA Manifest no disponible"
}

# Test 2.4: Service Worker
Write-Host "`n🔍 Test 2.4: Service Worker..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$FRONTEND_URL/sw.js" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Show-Result "Service Worker" $true "SW disponible"
        $script:PassedTests++
    } else {
        Show-Result "Service Worker" $false "HTTP $($response.StatusCode)"
        $script:FailedTests++
        $script:Errors += "Service Worker no encontrado"
    }
} catch {
    Show-Result "Service Worker" $false "No encontrado"
    $script:FailedTests++
    $script:Errors += "Service Worker no disponible"
}

# ========================================
# FASE 3: VERIFICAR INTEGRACIÓN
# ========================================
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "FASE 3: TESTING INTEGRACIÓN" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Test 3.1: Frontend puede alcanzar Backend
Write-Host "🔍 Test 3.1: Conectividad Frontend → Backend..." -ForegroundColor Cyan
try {
    # Simular request desde frontend
    $headers = @{
        "Origin" = $FRONTEND_URL
        "Referer" = $FRONTEND_URL
    }
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get -Headers $headers -TimeoutSec 10
    Show-Result "Frontend → Backend" $true "Conexión exitosa"
    $script:PassedTests++
} catch {
    Show-Result "Frontend → Backend" $false $_.Exception.Message
    $script:FailedTests++
    $script:Errors += "Frontend no puede conectar con backend: $($_.Exception.Message)"
}

# Test 3.2: Response Times
Write-Host "`n🔍 Test 3.2: Response Times..." -ForegroundColor Cyan
$endpoints = @{
    "Health Check" = "$BACKEND_URL/health"
    "API Info" = "$BACKEND_URL/api"
    "Frontend" = $FRONTEND_URL
}

foreach ($name in $endpoints.Keys) {
    $url = $endpoints[$name]
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 10 -UseBasicParsing
        $stopwatch.Stop()
        $ms = $stopwatch.ElapsedMilliseconds
        
        if ($ms -lt 3000) {
            Show-Result "Response Time: $name" $true "$ms ms (aceptable)"
            $script:PassedTests++
        } else {
            Show-Result "Response Time: $name" $false "$ms ms (lento)"
            $script:FailedTests++
            $script:Errors += "$name muy lento: $ms ms"
        }
    } catch {
        Show-Result "Response Time: $name" $false "Timeout o error"
        $script:FailedTests++
        $script:Errors += "$name no responde"
    }
}

# ========================================
# RESUMEN FINAL
# ========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE RESULTADOS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$totalTests = $script:PassedTests + $script:FailedTests
$successRate = if ($totalTests -gt 0) { [math]::Round(($script:PassedTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "Total de Tests: $totalTests" -ForegroundColor White
Write-Host "✅ Exitosos: $($script:PassedTests)" -ForegroundColor Green
Write-Host "❌ Fallidos: $($script:FailedTests)" -ForegroundColor Red
Write-Host "📈 Tasa de Éxito: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

if ($script:FailedTests -gt 0) {
    Write-Host "`n⚠️ ERRORES DETECTADOS:" -ForegroundColor Red
    foreach ($error in $script:Errors) {
        Write-Host "   • $error" -ForegroundColor Yellow
    }
}

# Guardar reporte
$reportPath = "test-production-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$reportContent = @"
========================================
REPORTE DE TESTING EN PRODUCCIÓN
Sistema ASISTEM San Martín
Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
========================================

BACKEND: $BACKEND_URL
FRONTEND: $FRONTEND_URL

RESULTADOS:
-----------
Total Tests: $totalTests
Exitosos: $($script:PassedTests)
Fallidos: $($script:FailedTests)
Tasa de Éxito: $successRate%

ERRORES DETECTADOS:
-------------------
$($script:Errors -join "`n")

========================================
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`n📄 Reporte guardado en: $reportPath" -ForegroundColor Cyan

Write-Host "`n========================================`n" -ForegroundColor Cyan
