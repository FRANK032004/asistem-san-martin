-- Habilitar extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable: Configuraciones del Sistema
CREATE TABLE "configuraciones_sistema" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT,
    "tipo" VARCHAR(50) NOT NULL DEFAULT 'string',
    "categoria" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuraciones_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_sistema_clave_key" ON "configuraciones_sistema"("clave");

-- CreateIndex
CREATE INDEX "idx_configuraciones_categoria" ON "configuraciones_sistema"("categoria");

-- CreateIndex
CREATE INDEX "idx_configuraciones_activo" ON "configuraciones_sistema"("activo");

-- Insertar configuraciones por defecto
INSERT INTO "configuraciones_sistema" ("clave", "valor", "tipo", "categoria", "descripcion") VALUES
-- General
('general.nombre_instituto', 'Instituto San Martín', 'string', 'general', 'Nombre del instituto'),
('general.direccion', 'Av. Arequipa 1234, Lima, Perú', 'string', 'general', 'Dirección física del instituto'),
('general.telefono', '+51 1 234-5678', 'string', 'general', 'Teléfono de contacto'),
('general.email', 'contacto@sanmartin.edu.pe', 'string', 'general', 'Email de contacto'),
('general.sitio_web', 'https://www.sanmartin.edu.pe', 'string', 'general', 'Sitio web oficial'),
('general.descripcion', 'Institución educativa comprometida con la excelencia académica', 'text', 'general', 'Descripción del instituto'),

-- Asistencia
('asistencia.radio_tolerancia_gps', '100', 'number', 'asistencia', 'Radio de tolerancia GPS en metros'),
('asistencia.tiempo_gracia_entrada', '15', 'number', 'asistencia', 'Tiempo de gracia para entrada en minutos'),
('asistencia.tiempo_gracia_salida', '10', 'number', 'asistencia', 'Tiempo de gracia para salida en minutos'),
('asistencia.horas_trabajo_minimas', '6', 'number', 'asistencia', 'Horas mínimas de trabajo diarias'),
('asistencia.permitir_registro_offline', 'true', 'boolean', 'asistencia', 'Permitir registro sin conexión'),
('asistencia.validar_ubicacion_salida', 'true', 'boolean', 'asistencia', 'Validar ubicación GPS en salida'),

-- Notificaciones
('notificaciones.email_notificaciones', 'true', 'boolean', 'notificaciones', 'Activar notificaciones por email'),
('notificaciones.notificar_tardanzas', 'true', 'boolean', 'notificaciones', 'Notificar tardanzas'),
('notificaciones.notificar_ausencias', 'true', 'boolean', 'notificaciones', 'Notificar ausencias'),
('notificaciones.recordatorio_registro', 'true', 'boolean', 'notificaciones', 'Recordatorios de registro'),
('notificaciones.horarios_notificacion', '08:00,17:00', 'array', 'notificaciones', 'Horarios para enviar notificaciones'),

-- Seguridad
('seguridad.tiempo_expiracion_sesion', '480', 'number', 'seguridad', 'Tiempo de expiración de sesión en minutos'),
('seguridad.intentos_login_maximos', '5', 'number', 'seguridad', 'Número máximo de intentos de login'),
('seguridad.requiere_confirmacion_email', 'false', 'boolean', 'seguridad', 'Requiere confirmación de email'),
('seguridad.forzar_cambio_password_inicial', 'true', 'boolean', 'seguridad', 'Forzar cambio de contraseña inicial'),
('seguridad.longitud_minima_password', '8', 'number', 'seguridad', 'Longitud mínima de contraseña'),

-- Sistema
('sistema.modo_mantenimiento', 'false', 'boolean', 'sistema', 'Modo de mantenimiento activo'),
('sistema.mensaje_mantenimiento', 'El sistema está en mantenimiento. Intente más tarde.', 'text', 'sistema', 'Mensaje a mostrar en mantenimiento'),
('sistema.version_sistema', '2.1.0', 'string', 'sistema', 'Versión del sistema'),
('sistema.backup_automatico', 'true', 'boolean', 'sistema', 'Realizar backups automáticos'),
('sistema.frecuencia_backup', 'diario', 'string', 'sistema', 'Frecuencia de backups (diario/semanal/mensual)');
