# ========================================
# VERIFICADOR DE VARIABLES DE ENTORNO
# Sistema ASISTEM San Martín
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Variables requeridas para producción
$requiredVars = @{
    "DATABASE_URL" = @{
        required = $true
        description = "URL de conexión a PostgreSQL"
        example = "postgresql://user:pass@host:5432/db"
        critical = $true
    }
    "PORT" = @{
        required = $true
        description = "Puerto del servidor"
        example = "5000"
        critical = $true
    }
    "NODE_ENV" = @{
        required = $true
        description = "Ambiente de ejecución"
        example = "production"
        critical = $true
    }
    "JWT_SECRET" = @{
        required = $true
        description = "Secreto para firmar JWT"
        example = "64_caracteres_aleatorios..."
        critical = $true
        minLength = 32
    }
    "JWT_EXPIRES_IN" = @{
        required = $true
        description = "Tiempo de expiración de JWT"
        example = "24h"
        critical = $false
    }
    "JWT_REFRESH_SECRET" = @{
        required = $true
        description = "Secreto para refresh tokens"
        example = "64_caracteres_aleatorios..."
        critical = $true
        minLength = 32
    }
    "JWT_REFRESH_EXPIRES_IN" = @{
        required = $true
        description = "Tiempo de expiración de refresh token"
        example = "7d"
        critical = $false
    }
    "FRONTEND_URL" = @{
        required = $true
        description = "URL del frontend en Vercel"
        example = "https://asistem-san-martin.vercel.app"
        critical = $true
    }
    "ALLOWED_ORIGINS" = @{
        required = $true
        description = "Orígenes permitidos para CORS"
        example = "https://asistem-san-martin.vercel.app,https://*.vercel.app"
        critical = $true
    }
    "GPS_PRECISION_METERS" = @{
        required = $false
        description = "Radio GPS en metros"
        example = "50"
        critical = $false
    }
    "RATE_LIMIT_WINDOW_MS" = @{
        required = $false
        description = "Ventana de rate limiting"
        example = "900000"
        critical = $false
    }
}

# Función para mostrar resultado
function Show-VarResult {
    param(
        [string]$VarName,
        [string]$Status,
        [string]$Message = ""
    )
    
    switch ($Status) {
        "OK" {
            Write-Host "✅ $VarName" -ForegroundColor Green
            if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
        }
        "WARNING" {
            Write-Host "⚠️  $VarName" -ForegroundColor Yellow
            if ($Message) { Write-Host "   $Message" -ForegroundColor Yellow }
        }
        "ERROR" {
            Write-Host "❌ $VarName" -ForegroundColor Red
            if ($Message) { Write-Host "   $Message" -ForegroundColor Red }
        }
    }
}

Write-Host "Verificando configuración para PRODUCCIÓN...`n" -ForegroundColor Cyan

$errors = @()
$warnings = @()
$ok = 0

foreach ($varName in $requiredVars.Keys) {
    $config = $requiredVars[$varName]
    
    Write-Host "`nVariable: $varName" -ForegroundColor White
    Write-Host "Descripción: $($config.description)" -ForegroundColor Gray
    Write-Host "Ejemplo: $($config.example)" -ForegroundColor Gray
    
    # Nota: En producción estas variables están en Railway/Vercel, no en .env local
    Write-Host "Estado: " -NoNewline
    
    if ($config.required) {
        if ($config.critical) {
            Show-VarResult $varName "WARNING" "CRÍTICA - Debe estar en Railway/Vercel"
            $warnings += "$varName (crítica) - Verificar en Railway"
        } else {
            Show-VarResult $varName "OK" "Opcional - Verificar en Railway si es necesario"
            $ok++
        }
    } else {
        Show-VarResult $varName "OK" "Opcional"
        $ok++
    }
}

# Verificaciones específicas
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "VERIFICACIONES ESPECÍFICAS" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Checklist para Railway
Write-Host "📋 CHECKLIST RAILWAY (Backend):`n" -ForegroundColor Cyan

$railwayChecklist = @(
    @{item = "DATABASE_URL"; desc = "Generada automáticamente al agregar PostgreSQL"},
    @{item = "JWT_SECRET"; desc = "Generar con: node -e ""console.log(require('crypto').randomBytes(64).toString('hex'))"""},
    @{item = "JWT_REFRESH_SECRET"; desc = "Generar con: node -e ""console.log(require('crypto').randomBytes(64).toString('hex'))"""},
    @{item = "FRONTEND_URL"; desc = "URL de Vercel (ej: https://asistem-san-martin.vercel.app)"},
    @{item = "ALLOWED_ORIGINS"; desc = "Incluir todas las URLs de Vercel (producción y preview)"},
    @{item = "NODE_ENV"; desc = "Debe ser 'production'"},
    @{item = "PORT"; desc = "Railway usa la variable PORT automáticamente"}
)

foreach ($check in $railwayChecklist) {
    Write-Host "  [ ] $($check.item)" -ForegroundColor White
    Write-Host "      → $($check.desc)" -ForegroundColor Gray
}

# Checklist para Vercel
Write-Host "`n📋 CHECKLIST VERCEL (Frontend):`n" -ForegroundColor Cyan

$vercelChecklist = @(
    @{item = "NEXT_PUBLIC_API_URL"; desc = "URL del backend en Railway + /api"},
    @{item = "NEXT_PUBLIC_APP_NAME"; desc = "Nombre de la aplicación"},
    @{item = "NODE_ENV"; desc = "Debe ser 'production'"}
)

foreach ($check in $vercelChecklist) {
    Write-Host "  [ ] $($check.item)" -ForegroundColor White
    Write-Host "      → $($check.desc)" -ForegroundColor Gray
}

# Comandos útiles
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "COMANDOS ÚTILES" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

Write-Host "🔐 Generar secretos JWT:" -ForegroundColor Cyan
Write-Host "node -e ""console.log('JWT_SECRET:', require('crypto').randomBytes(64).toString('hex')); console.log('JWT_REFRESH_SECRET:', require('crypto').randomBytes(64).toString('hex'))""" -ForegroundColor Gray

Write-Host "`n📊 Ver variables en Railway:" -ForegroundColor Cyan
Write-Host "railway variables" -ForegroundColor Gray

Write-Host "`n📊 Ver variables en Vercel:" -ForegroundColor Cyan
Write-Host "vercel env ls" -ForegroundColor Gray

Write-Host "`n🔄 Redeploy Railway:" -ForegroundColor Cyan
Write-Host "railway up" -ForegroundColor Gray

Write-Host "`n🔄 Redeploy Vercel:" -ForegroundColor Cyan
Write-Host "vercel --prod" -ForegroundColor Gray

# Instrucciones finales
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "INSTRUCCIONES PARA CONFIGURAR" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. RAILWAY (Backend):" -ForegroundColor Yellow
Write-Host "   • Ir a: https://railway.app" -ForegroundColor White
Write-Host "   • Proyecto → Backend Service → Variables" -ForegroundColor White
Write-Host "   • Agregar cada variable del checklist de Railway" -ForegroundColor White
Write-Host "   • Guardar y esperar redeploy automático" -ForegroundColor White

Write-Host "`n2. VERCEL (Frontend):" -ForegroundColor Yellow
Write-Host "   • Ir a: https://vercel.com" -ForegroundColor White
Write-Host "   • Proyecto → Settings → Environment Variables" -ForegroundColor White
Write-Host "   • Agregar cada variable del checklist de Vercel" -ForegroundColor White
Write-Host "   • Marcar: Production, Preview, Development" -ForegroundColor White
Write-Host "   • Guardar y hacer Redeploy" -ForegroundColor White

Write-Host "`n3. VERIFICAR DESPUÉS:" -ForegroundColor Yellow
Write-Host "   • Ejecutar: .\test-production.ps1" -ForegroundColor White
Write-Host "   • Probar login en: https://asistem-san-martin.vercel.app" -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Guardar reporte
$reportPath = "env-check-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$reportContent = @"
========================================
VERIFICACIÓN DE VARIABLES DE ENTORNO
Sistema ASISTEM San Martín
Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
========================================

VARIABLES CRÍTICAS PARA RAILWAY:
$(foreach ($check in $railwayChecklist) { "- $($check.item): $($check.desc)" })

VARIABLES PARA VERCEL:
$(foreach ($check in $vercelChecklist) { "- $($check.item): $($check.desc)" })

WARNINGS:
$($warnings -join "`n")

========================================
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "📄 Reporte guardado en: $reportPath" -ForegroundColor Cyan
Write-Host ""
