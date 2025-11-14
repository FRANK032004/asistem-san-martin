#!/bin/bash
# ============================================================
# SCRIPT DE DEPLOYMENT AUTOMÁTICO - LINUX/MAC
# Sistema de Asistencias - Instituto San Martín
# ============================================================

set -e  # Exit on error

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🚀 DEPLOYMENT AUTOMÁTICO - SISTEMA SAN MARTÍN${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "\n${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# ============================================================
# INICIO
# ============================================================

print_header

# ============================================================
# VERIFICAR REQUISITOS
# ============================================================

print_step "Verificando requisitos..."

REQUIREMENTS=("docker" "docker-compose" "node" "npm")
ALL_MET=true

for cmd in "${REQUIREMENTS[@]}"; do
    if check_command $cmd; then
        version=$($cmd --version 2>/dev/null | head -n1)
        print_success "$cmd: $version"
    else
        print_error "$cmd no encontrado"
        ALL_MET=false
    fi
done

if [ "$ALL_MET" = false ]; then
    print_error "Por favor instala los requisitos faltantes"
    exit 1
fi

# ============================================================
# VERIFICAR ARCHIVO .ENV
# ============================================================

print_step "Verificando archivo .env..."

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Archivo .env no encontrado${NC}"
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Archivo .env creado desde .env.example"
        echo ""
        echo -e "${YELLOW}⚠ IMPORTANTE: Edita .env con tus valores reales${NC}"
        echo -e "${YELLOW}Press Enter cuando hayas configurado .env...${NC}"
        read
    else
        print_error "Archivo .env.example no encontrado"
        exit 1
    fi
else
    print_success "Archivo .env encontrado"
fi

# ============================================================
# MODO DE DEPLOYMENT
# ============================================================

echo ""
echo -e "${YELLOW}Selecciona modo de deployment:${NC}"
echo "1. Desarrollo (local sin Docker)"
echo "2. Docker Compose (desarrollo con containers)"
echo "3. Producción (Docker Compose + optimizaciones)"
echo "4. Tests solamente"
echo ""
read -p "Opción (1-4): " mode

case $mode in
    1)
        # ====== MODO DESARROLLO ======
        print_step "Iniciando en modo DESARROLLO (local)..."
        
        print_step "Instalando dependencias del backend..."
        cd backend && npm install && cd ..
        print_success "Dependencias backend instaladas"
        
        print_step "Instalando dependencias del frontend..."
        cd frontend && npm install && cd ..
        print_success "Dependencias frontend instaladas"
        
        print_step "Generando Prisma Client..."
        cd backend && npx prisma generate && cd ..
        print_success "Prisma Client generado"
        
        print_step "Ejecutando migraciones..."
        cd backend && npx prisma migrate deploy && cd ..
        print_success "Migraciones aplicadas"
        
        print_success "\n✓ Setup completo"
        echo ""
        echo -e "${YELLOW}Para iniciar los servicios:${NC}"
        echo "  Backend:  cd backend && npm run dev"
        echo "  Frontend: cd frontend && npm run dev"
        ;;
        
    2)
        # ====== DOCKER COMPOSE DESARROLLO ======
        print_step "Iniciando con DOCKER COMPOSE (desarrollo)..."
        
        print_step "Deteniendo containers existentes..."
        docker-compose down 2>/dev/null || true
        
        print_step "Construyendo imágenes Docker..."
        docker-compose build
        print_success "Imágenes construidas"
        
        print_step "Iniciando servicios..."
        docker-compose up -d
        print_success "Servicios iniciados"
        
        print_step "Esperando a que los servicios estén listos..."
        sleep 10
        
        print_step "Verificando salud de servicios..."
        docker-compose ps
        
        print_success "\n✓ Deployment completo con Docker Compose"
        echo ""
        echo -e "${YELLOW}Servicios disponibles:${NC}"
        echo "  Backend:   http://localhost:5000"
        echo "  Frontend:  http://localhost:3000"
        echo "  Postgres:  localhost:5432"
        echo "  Redis:     localhost:6379"
        echo ""
        echo -e "${CYAN}Ver logs:     docker-compose logs -f${NC}"
        echo -e "${CYAN}Detener:      docker-compose down${NC}"
        ;;
        
    3)
        # ====== PRODUCCIÓN ======
        print_step "Iniciando en modo PRODUCCIÓN..."
        
        print_step "Verificando configuración de producción..."
        
        CRITICAL_VARS=("JWT_SECRET" "JWT_REFRESH_SECRET" "DB_PASSWORD")
        WARNINGS=()
        
        for var in "${CRITICAL_VARS[@]}"; do
            if grep -i "$var.*change\|$var.*test\|$var.*example" .env &> /dev/null; then
                WARNINGS+=("$var")
            fi
        done
        
        if [ ${#WARNINGS[@]} -gt 0 ]; then
            echo ""
            echo -e "${RED}⚠ ADVERTENCIA: Variables de producción no configuradas:${NC}"
            for w in "${WARNINGS[@]}"; do
                echo -e "${YELLOW}  - $w${NC}"
            done
            echo ""
            read -p "¿Continuar de todos modos? (y/N): " continue
            if [ "$continue" != "y" ]; then
                print_error "Deployment cancelado"
                exit 1
            fi
        fi
        
        print_step "Construyendo imágenes de producción (sin cache)..."
        docker-compose build --no-cache
        print_success "Imágenes construidas"
        
        print_step "Iniciando servicios de producción..."
        docker-compose --profile production up -d
        print_success "Servicios iniciados"
        
        print_step "Aplicando migraciones..."
        docker-compose exec backend npx prisma migrate deploy
        print_success "Migraciones aplicadas"
        
        print_success "\n✓ Deployment de PRODUCCIÓN completo"
        echo ""
        echo -e "${YELLOW}⚠ Recuerda configurar:${NC}"
        echo "  - Certificados SSL"
        echo "  - Firewall rules"
        echo "  - Backups automáticos"
        echo "  - Monitoreo (Sentry)"
        ;;
        
    4)
        # ====== TESTS ======
        print_step "Ejecutando TESTS..."
        
        cd backend
        
        print_step "Instalando dependencias..."
        npm install
        
        print_step "Ejecutando suite de tests..."
        npm test
        
        print_step "Generando reporte de coverage..."
        npm run test:coverage
        
        cd ..
        
        print_success "\n✓ Tests completados"
        echo ""
        echo -e "${CYAN}Reporte de coverage: backend/coverage/index.html${NC}"
        ;;
        
    *)
        print_error "Opción inválida"
        exit 1
        ;;
esac

# ============================================================
# FINALIZACIÓN
# ============================================================

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ DEPLOYMENT COMPLETADO${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${NC}Timestamp: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
