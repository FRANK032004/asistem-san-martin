# ============================================================
# MAKEFILE - Comandos útiles del proyecto
# Sistema de Asistencias - Instituto San Martín
# ============================================================

.PHONY: help install dev build test clean docker-up docker-down docker-logs

# Colores para output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

## help: Muestra este mensaje de ayuda
help:
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  Sistema de Asistencias - Instituto San Martín$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)Comandos disponibles:$(NC)"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /' | column -t -s ':' | sed 's/^/  /'
	@echo ""

## install: Instala todas las dependencias
install:
	@echo "$(GREEN)📦 Instalando dependencias...$(NC)"
	cd backend && npm install
	cd frontend && npm install
	@echo "$(GREEN)✅ Dependencias instaladas$(NC)"

## dev: Inicia el entorno de desarrollo
dev:
	@echo "$(GREEN)🚀 Iniciando modo desarrollo...$(NC)"
	@powershell -Command "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backend; npm run dev' -WindowStyle Normal"
	@powershell -Command "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend; npm run dev' -WindowStyle Normal"

## build: Compila backend y frontend
build:
	@echo "$(GREEN)🏗️  Compilando proyecto...$(NC)"
	cd backend && npm run build
	cd frontend && npm run build
	@echo "$(GREEN)✅ Compilación completa$(NC)"

## test: Ejecuta todos los tests
test:
	@echo "$(GREEN)🧪 Ejecutando tests...$(NC)"
	cd backend && npm test
	@echo "$(GREEN)✅ Tests completados$(NC)"

## test-coverage: Ejecuta tests con coverage
test-coverage:
	@echo "$(GREEN)📊 Generando reporte de coverage...$(NC)"
	cd backend && npm run test:coverage
	@echo "$(GREEN)✅ Reporte generado en: backend/coverage/index.html$(NC)"

## lint: Ejecuta linter
lint:
	@echo "$(GREEN)🔍 Ejecutando linter...$(NC)"
	cd backend && npm run lint
	@echo "$(GREEN)✅ Linter completado$(NC)"

## clean: Limpia archivos generados
clean:
	@echo "$(YELLOW)🧹 Limpiando archivos...$(NC)"
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf backend/dist
	rm -rf frontend/.next
	rm -rf backend/coverage
	@echo "$(GREEN)✅ Limpieza completa$(NC)"

## docker-up: Inicia containers con Docker Compose
docker-up:
	@echo "$(GREEN)🐳 Iniciando containers...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Containers iniciados$(NC)"
	@echo "$(BLUE)Backend:  http://localhost:5000$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:3000$(NC)"

## docker-down: Detiene containers
docker-down:
	@echo "$(YELLOW)🛑 Deteniendo containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Containers detenidos$(NC)"

## docker-logs: Muestra logs de containers
docker-logs:
	docker-compose logs -f

## docker-build: Construye imágenes Docker
docker-build:
	@echo "$(GREEN)🏗️  Construyendo imágenes...$(NC)"
	docker-compose build
	@echo "$(GREEN)✅ Imágenes construidas$(NC)"

## prisma-migrate: Ejecuta migraciones de Prisma
prisma-migrate:
	@echo "$(GREEN)🗄️  Ejecutando migraciones...$(NC)"
	cd backend && npx prisma migrate dev
	@echo "$(GREEN)✅ Migraciones aplicadas$(NC)"

## prisma-studio: Abre Prisma Studio
prisma-studio:
	@echo "$(GREEN)📊 Abriendo Prisma Studio...$(NC)"
	cd backend && npx prisma studio

## db-seed: Llena la base de datos con datos de prueba
db-seed:
	@echo "$(GREEN)🌱 Sembrando base de datos...$(NC)"
	cd backend && npx prisma db seed
	@echo "$(GREEN)✅ Datos de prueba insertados$(NC)"

## status: Muestra estado del sistema
status:
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  Estado del Sistema$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════$(NC)"
	@docker-compose ps 2>/dev/null || echo "Docker no está corriendo"
	@echo ""
	@echo "$(YELLOW)Node.js:$(NC) $$(node --version 2>/dev/null || echo 'No instalado')"
	@echo "$(YELLOW)NPM:$(NC)     $$(npm --version 2>/dev/null || echo 'No instalado')"
	@echo "$(YELLOW)Docker:$(NC)  $$(docker --version 2>/dev/null || echo 'No instalado')"

## backup-db: Hace backup de la base de datos
backup-db:
	@echo "$(GREEN)💾 Creando backup...$(NC)"
	@mkdir -p database/backups
	docker-compose exec -T postgres pg_dump -U postgres instituto_san_martin > database/backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup creado$(NC)"

.DEFAULT_GOAL := help
