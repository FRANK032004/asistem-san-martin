# ============================================================
# SCRIPT DE DEPLOYMENT AUTOMÁTICO
# Sistema de Asistencias - Instituto San Martín
# ============================================================
# PowerShell Script para Windows

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  🚀 DEPLOYMENT AUTOMÁTICO - SISTEMA SAN MARTÍN" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n▶ $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Check-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# ============================================================
# VERIFICAR REQUISITOS
# ============================================================

Write-Step "Verificando requisitos..."

$requirements = @(
    @{Name="Docker"; Command="docker"},
    @{Name="Docker Compose"; Command="docker-compose"},
    @{Name="Node.js"; Command="node"},
    @{Name="NPM"; Command="npm"}
)

$allRequirementsMet = $true
foreach ($req in $requirements) {
    if (Check-Command $req.Command) {
        $version = & $req.Command --version 2>$null
        Write-Success "$($req.Name): $version"
    } else {
        Write-Error "$($req.Name) no encontrado"
        $allRequirementsMet = $false
    }
}

if (-not $allRequirementsMet) {
    Write-Error "Por favor instala los requisitos faltantes"
    exit 1
}

# ============================================================
# VERIFICAR ARCHIVO .ENV
# ============================================================

Write-Step "Verificando archivo .env..."

if (-not (Test-Path ".env")) {
    Write-Host "⚠ Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host "Creando desde .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Success "Archivo .env creado"
        Write-Host ""
        Write-Host "⚠ IMPORTANTE: Edita .env con tus valores reales" -ForegroundColor Yellow
        Write-Host "Press Enter cuando hayas configurado .env..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Error "Archivo .env.example no encontrado"
        exit 1
    }
} else {
    Write-Success "Archivo .env encontrado"
}

# ============================================================
# MODO DE DEPLOYMENT
# ============================================================

Write-Host ""
Write-Host "Selecciona modo de deployment:" -ForegroundColor Yellow
Write-Host "1. Desarrollo (local sin Docker)" -ForegroundColor White
Write-Host "2. Docker Compose (desarrollo con containers)" -ForegroundColor White
Write-Host "3. Producción (Docker Compose + optimizaciones)" -ForegroundColor White
Write-Host "4. Tests solamente" -ForegroundColor White
Write-Host ""
$mode = Read-Host "Opción (1-4)"

switch ($mode) {
    "1" {
        # ====== MODO DESARROLLO ======
        Write-Step "Iniciando en modo DESARROLLO (local)..."
        
        # Instalar dependencias
        Write-Step "Instalando dependencias del backend..."
        Push-Location backend
        npm install
        Pop-Location
        Write-Success "Dependencias backend instaladas"
        
        Write-Step "Instalando dependencias del frontend..."
        Push-Location frontend
        npm install
        Pop-Location
        Write-Success "Dependencias frontend instaladas"
        
        # Generar Prisma Client
        Write-Step "Generando Prisma Client..."
        Push-Location backend
        npx prisma generate
        Pop-Location
        Write-Success "Prisma Client generado"
        
        # Ejecutar migraciones
        Write-Step "Ejecutando migraciones de base de datos..."
        Push-Location backend
        npx prisma migrate deploy
        Pop-Location
        Write-Success "Migraciones aplicadas"
        
        # Iniciar servicios
        Write-Success "`n✓ Setup completo"
        Write-Host ""
        Write-Host "Para iniciar los servicios:" -ForegroundColor Yellow
        Write-Host "  Backend:  cd backend && npm run dev" -ForegroundColor White
        Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "O usa el archivo batch: .\iniciar_sistema.bat" -ForegroundColor White
    }
    
    "2" {
        # ====== DOCKER COMPOSE DESARROLLO ======
        Write-Step "Iniciando con DOCKER COMPOSE (desarrollo)..."
        
        # Detener containers existentes
        Write-Step "Deteniendo containers existentes..."
        docker-compose down 2>$null
        
        # Build de imágenes
        Write-Step "Construyendo imágenes Docker..."
        docker-compose build
        Write-Success "Imágenes construidas"
        
        # Iniciar servicios
        Write-Step "Iniciando servicios..."
        docker-compose up -d
        Write-Success "Servicios iniciados"
        
        # Esperar a que los servicios estén listos
        Write-Step "Esperando a que los servicios estén listos..."
        Start-Sleep -Seconds 10
        
        # Verificar salud
        Write-Step "Verificando salud de servicios..."
        docker-compose ps
        
        Write-Success "`n✓ Deployment completo con Docker Compose"
        Write-Host ""
        Write-Host "Servicios disponibles:" -ForegroundColor Yellow
        Write-Host "  Backend:   http://localhost:5000" -ForegroundColor White
        Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
        Write-Host "  Postgres:  localhost:5432" -ForegroundColor White
        Write-Host "  Redis:     localhost:6379" -ForegroundColor White
        Write-Host ""
        Write-Host "Ver logs:     docker-compose logs -f" -ForegroundColor Cyan
        Write-Host "Detener:      docker-compose down" -ForegroundColor Cyan
    }
    
    "3" {
        # ====== PRODUCCIÓN ======
        Write-Step "Iniciando en modo PRODUCCIÓN..."
        
        # Verificar variables críticas
        Write-Step "Verificando configuración de producción..."
        $envContent = Get-Content ".env" -Raw
        
        $criticalVars = @("JWT_SECRET", "JWT_REFRESH_SECRET", "DB_PASSWORD")
        $warnings = @()
        
        foreach ($var in $criticalVars) {
            if ($envContent -match "$var=.*change.*|$var=.*test.*|$var=.*example.*") {
                $warnings += $var
            }
        }
        
        if ($warnings.Count -gt 0) {
            Write-Host ""
            Write-Host "⚠ ADVERTENCIA: Variables de producción no configuradas:" -ForegroundColor Red
            foreach ($w in $warnings) {
                Write-Host "  - $w" -ForegroundColor Yellow
            }
            Write-Host ""
            $continue = Read-Host "¿Continuar de todos modos? (y/N)"
            if ($continue -ne "y") {
                Write-Error "Deployment cancelado"
                exit 1
            }
        }
        
        # Build sin cache
        Write-Step "Construyendo imágenes de producción (sin cache)..."
        docker-compose build --no-cache
        Write-Success "Imágenes construidas"
        
        # Iniciar con perfil producción
        Write-Step "Iniciando servicios de producción..."
        docker-compose --profile production up -d
        Write-Success "Servicios iniciados"
        
        # Aplicar migraciones
        Write-Step "Aplicando migraciones..."
        docker-compose exec backend npx prisma migrate deploy
        Write-Success "Migraciones aplicadas"
        
        Write-Success "`n✓ Deployment de PRODUCCIÓN completo"
        Write-Host ""
        Write-Host "⚠ Recuerda configurar:" -ForegroundColor Yellow
        Write-Host "  - Certificados SSL" -ForegroundColor White
        Write-Host "  - Firewall rules" -ForegroundColor White
        Write-Host "  - Backups automáticos" -ForegroundColor White
        Write-Host "  - Monitoreo (Sentry)" -ForegroundColor White
    }
    
    "4" {
        # ====== TESTS ======
        Write-Step "Ejecutando TESTS..."
        
        Push-Location backend
        
        Write-Step "Instalando dependencias..."
        npm install
        
        Write-Step "Ejecutando suite de tests..."
        npm test
        
        Write-Step "Generando reporte de coverage..."
        npm run test:coverage
        
        Pop-Location
        
        Write-Success "`n✓ Tests completados"
        Write-Host ""
        Write-Host "Reporte de coverage: backend\coverage\index.html" -ForegroundColor Cyan
    }
    
    default {
        Write-Error "Opción inválida"
        exit 1
    }
}

# ============================================================
# FINALIZACIÓN
# ============================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  ✓ DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
