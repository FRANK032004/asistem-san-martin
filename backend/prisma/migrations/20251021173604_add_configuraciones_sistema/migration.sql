-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "permisos" TEXT[],

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "dni" VARCHAR(20) NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "activo" BOOLEAN DEFAULT true,
    "ultimo_acceso" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "bloqueado_hasta" TIMESTAMP(6),
    "fecha_expiracion_token" TIMESTAMP(6),
    "intentos_fallidos" INTEGER DEFAULT 0,
    "token_reset_password" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "codigo" VARCHAR(10),
    "color_hex" VARCHAR(7),
    "coordinador_id" UUID,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos_docentes" (
    "id" SERIAL NOT NULL,
    "docente_id" UUID NOT NULL,
    "tipo_contrato" VARCHAR(20) NOT NULL,
    "horas_semanales_minimas" DECIMAL(5,2),
    "horas_semanales_maximas" DECIMAL(5,2),
    "tarifa_por_hora" DECIMAL(8,2) NOT NULL,
    "sueldo_base" DECIMAL(10,2),
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "contratos_docentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "docentes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_id" UUID NOT NULL,
    "area_id" INTEGER,
    "codigo_docente" VARCHAR(20),
    "fecha_ingreso" DATE,
    "horario_entrada" TIME(6) DEFAULT '07:30:00'::time without time zone,
    "horario_salida" TIME(6) DEFAULT '17:30:00'::time without time zone,
    "sueldo" DECIMAL(10,2),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "banco" VARCHAR(50),
    "contacto_emergencia" VARCHAR(100),
    "cuenta_bancaria" VARCHAR(30),
    "direccion" VARCHAR(255),
    "estado" VARCHAR(20) DEFAULT 'activo',
    "estado_civil" VARCHAR(20),
    "fecha_nacimiento" DATE,
    "numero_hijos" INTEGER DEFAULT 0,
    "telefono_emergencia" VARCHAR(20),

    CONSTRAINT "docentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_base" (
    "id" SERIAL NOT NULL,
    "docente_id" UUID NOT NULL,
    "area_id" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "tipo_clase" VARCHAR(30),
    "horas_semana" DECIMAL(4,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_vigencia" DATE,
    "fecha_fin" DATE,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horarios_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horas_trabajadas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "docente_id" UUID NOT NULL,
    "horario_base_id" INTEGER,
    "asistencia_id" UUID,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "horas_programadas" DECIMAL(4,2) NOT NULL,
    "horas_efectivas" DECIMAL(4,2) NOT NULL,
    "horas_extras" DECIMAL(4,2),
    "tipo_hora" VARCHAR(20) NOT NULL,
    "tardanza_minutos" INTEGER DEFAULT 0,
    "salida_temprana" INTEGER DEFAULT 0,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'completo',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horas_trabajadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones_permitidas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "latitud" DECIMAL(10,8) NOT NULL,
    "longitud" DECIMAL(11,8) NOT NULL,
    "radio_metros" INTEGER DEFAULT 100,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "tipo_ubicacion" VARCHAR(20) DEFAULT 'sede',

    CONSTRAINT "ubicaciones_permitidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "docente_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_entrada" TIMESTAMP(6),
    "hora_salida" TIMESTAMP(6),
    "latitud_entrada" DECIMAL(10,8),
    "longitud_entrada" DECIMAL(11,8),
    "latitud_salida" DECIMAL(10,8),
    "longitud_salida" DECIMAL(11,8),
    "ubicacion_entrada_id" INTEGER,
    "ubicacion_salida_id" INTEGER,
    "estado" VARCHAR(20) DEFAULT 'presente',
    "observaciones" TEXT,
    "ip_entrada" INET,
    "ip_salida" INET,
    "dispositivo_entrada" TEXT,
    "dispositivo_salida" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "distancia_entrada" DECIMAL(8,2),
    "distancia_salida" DECIMAL(8,2),
    "estado_salida" VARCHAR(20),
    "gps_valido_entrada" BOOLEAN DEFAULT true,
    "gps_valido_salida" BOOLEAN DEFAULT true,
    "horas_trabajadas" DECIMAL(4,2),
    "navegador_entrada" TEXT,
    "navegador_salida" TEXT,
    "salida_temprana_min" INTEGER DEFAULT 0,
    "tardanza_minutos" INTEGER DEFAULT 0,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planillas_horas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "docente_id" UUID NOT NULL,
    "contrato_id" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "año" INTEGER NOT NULL,
    "horas_contractuales" DECIMAL(6,2) NOT NULL,
    "horas_trabajadas" DECIMAL(6,2) NOT NULL,
    "horas_extras" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "horas_faltantes" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "dias_trabajados" INTEGER NOT NULL,
    "tardanzas_cantidad" INTEGER NOT NULL DEFAULT 0,
    "tardanzas_minutos" INTEGER NOT NULL DEFAULT 0,
    "faltas_justificadas" INTEGER NOT NULL DEFAULT 0,
    "faltas_injustificadas" INTEGER NOT NULL DEFAULT 0,
    "tarifa_hora" DECIMAL(8,2) NOT NULL,
    "monto_horas_normales" DECIMAL(10,2) NOT NULL,
    "monto_horas_extras" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuento_tardanzas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuento_faltas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonificaciones" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "calculado" BOOLEAN NOT NULL DEFAULT false,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_aprobacion" TIMESTAMP(6),
    "fecha_pago" TIMESTAMP(6),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "planillas_horas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones_docentes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "docente_id" UUID NOT NULL,
    "evaluador_id" UUID NOT NULL,
    "periodo" VARCHAR(20) NOT NULL,
    "porcentaje_asistencia" DECIMAL(5,2) NOT NULL,
    "porcentaje_puntualidad" DECIMAL(5,2) NOT NULL,
    "horas_completas" DECIMAL(5,2) NOT NULL,
    "tardanzas_promedio" DECIMAL(5,2) NOT NULL,
    "faltas_total" INTEGER NOT NULL,
    "cumplimiento_horario" INTEGER NOT NULL,
    "responsabilidad" INTEGER NOT NULL,
    "calificacion_general" DECIMAL(3,1) NOT NULL,
    "fortalezas" TEXT,
    "areas_mejora" TEXT,
    "recomendaciones" TEXT,
    "fecha_evaluacion" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_docentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "justificaciones" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "docente_id" UUID NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "motivo" TEXT NOT NULL,
    "documento_adjunto" VARCHAR(255),
    "estado" VARCHAR(20) DEFAULT 'pendiente',
    "aprobado_por" UUID,
    "fecha_aprobacion" TIMESTAMP(6),
    "observaciones_admin" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "afecta_pago" BOOLEAN NOT NULL DEFAULT true,
    "asistencia_id" UUID,
    "horas_afectadas" DECIMAL(4,2),
    "porcentaje_descuento" DECIMAL(5,2) DEFAULT 0,
    "prioridad" VARCHAR(20) DEFAULT 'normal',

    CONSTRAINT "justificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_id" UUID NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "datos" JSONB,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_leido" TIMESTAMP(6),

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_usuarios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "dispositivo" TEXT,
    "navegador" TEXT,
    "ip_address" INET NOT NULL,
    "ubicacion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "ultima_actividad" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_especiales" (
    "id" SERIAL NOT NULL,
    "docente_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_entrada_especial" TIME(6),
    "hora_salida_especial" TIME(6),
    "motivo" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "aprobado_por" UUID,
    "horas_especiales" DECIMAL(4,2),

    CONSTRAINT "horarios_especiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "generado_por" UUID NOT NULL,
    "tipo_reporte" VARCHAR(50) NOT NULL,
    "parametros" JSONB,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "archivo_generado" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'generando',
    "filtros" JSONB,
    "formato_archivo" VARCHAR(10),
    "subtipo" VARCHAR(30),
    "tamaño" INTEGER,
    "tiempo_generacion" DECIMAL(6,2),

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(20) DEFAULT 'string',
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "categoria" VARCHAR(50),
    "es_publico" BOOLEAN NOT NULL DEFAULT false,
    "validacion" TEXT,

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_actividad" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_id" UUID,
    "accion" VARCHAR(100) NOT NULL,
    "tabla_afectada" VARCHAR(50),
    "registro_id" UUID,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "duracion_ms" INTEGER,
    "modulo" VARCHAR(50),
    "resultado" VARCHAR(20),

    CONSTRAINT "logs_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_key" ON "usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_usuarios_dni" ON "usuarios"("dni");

-- CreateIndex
CREATE INDEX "idx_usuarios_email" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_usuarios_rol" ON "usuarios"("rol_id");

-- CreateIndex
CREATE INDEX "idx_usuarios_activo" ON "usuarios"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "areas_codigo_key" ON "areas"("codigo");

-- CreateIndex
CREATE INDEX "idx_contratos_docente" ON "contratos_docentes"("docente_id");

-- CreateIndex
CREATE INDEX "idx_contratos_tipo" ON "contratos_docentes"("tipo_contrato");

-- CreateIndex
CREATE INDEX "idx_contratos_activo" ON "contratos_docentes"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "docentes_codigo_docente_key" ON "docentes"("codigo_docente");

-- CreateIndex
CREATE INDEX "idx_docentes_codigo" ON "docentes"("codigo_docente");

-- CreateIndex
CREATE INDEX "idx_docentes_estado" ON "docentes"("estado");

-- CreateIndex
CREATE INDEX "idx_docentes_area" ON "docentes"("area_id");

-- CreateIndex
CREATE INDEX "idx_horarios_docente" ON "horarios_base"("docente_id");

-- CreateIndex
CREATE INDEX "idx_horarios_dia" ON "horarios_base"("dia_semana");

-- CreateIndex
CREATE INDEX "idx_horarios_activo" ON "horarios_base"("activo");

-- CreateIndex
CREATE INDEX "idx_horas_docente_fecha" ON "horas_trabajadas"("docente_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_horas_fecha" ON "horas_trabajadas"("fecha");

-- CreateIndex
CREATE INDEX "idx_horas_tipo" ON "horas_trabajadas"("tipo_hora");

-- CreateIndex
CREATE INDEX "idx_ubicaciones_activo" ON "ubicaciones_permitidas"("activo");

-- CreateIndex
CREATE INDEX "idx_asistencias_docente_fecha" ON "asistencias"("docente_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_asistencias_fecha" ON "asistencias"("fecha");

-- CreateIndex
CREATE INDEX "idx_asistencias_estado" ON "asistencias"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "unique_docente_fecha" ON "asistencias"("docente_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_planillas_periodo" ON "planillas_horas"("mes", "año");

-- CreateIndex
CREATE INDEX "idx_planillas_calculado" ON "planillas_horas"("calculado");

-- CreateIndex
CREATE INDEX "idx_planillas_aprobado" ON "planillas_horas"("aprobado");

-- CreateIndex
CREATE UNIQUE INDEX "unique_planilla_mes_anio" ON "planillas_horas"("docente_id", "mes", "año");

-- CreateIndex
CREATE INDEX "idx_evaluaciones_docente" ON "evaluaciones_docentes"("docente_id");

-- CreateIndex
CREATE INDEX "idx_evaluaciones_periodo" ON "evaluaciones_docentes"("periodo");

-- CreateIndex
CREATE INDEX "idx_justificaciones_docente" ON "justificaciones"("docente_id");

-- CreateIndex
CREATE INDEX "idx_justificaciones_estado" ON "justificaciones"("estado");

-- CreateIndex
CREATE INDEX "idx_justificaciones_periodo" ON "justificaciones"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "idx_notificaciones_usuario" ON "notificaciones"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_notificaciones_leido" ON "notificaciones"("leido");

-- CreateIndex
CREATE INDEX "idx_notificaciones_tipo" ON "notificaciones"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_usuarios_token_key" ON "sesiones_usuarios"("token");

-- CreateIndex
CREATE INDEX "idx_sesiones_usuario" ON "sesiones_usuarios"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_sesiones_token" ON "sesiones_usuarios"("token");

-- CreateIndex
CREATE INDEX "idx_sesiones_activa" ON "sesiones_usuarios"("activa");

-- CreateIndex
CREATE INDEX "idx_horarios_especiales_docente_fecha" ON "horarios_especiales"("docente_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_reportes_tipo" ON "reportes"("tipo_reporte");

-- CreateIndex
CREATE INDEX "idx_reportes_generador" ON "reportes"("generado_por");

-- CreateIndex
CREATE INDEX "idx_reportes_estado" ON "reportes"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "configuraciones"("clave");

-- CreateIndex
CREATE INDEX "idx_configuraciones_categoria" ON "configuraciones"("categoria");

-- CreateIndex
CREATE INDEX "idx_logs_usuario" ON "logs_actividad"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_logs_modulo" ON "logs_actividad"("modulo");

-- CreateIndex
CREATE INDEX "idx_logs_accion" ON "logs_actividad"("accion");

-- CreateIndex
CREATE INDEX "idx_logs_fecha" ON "logs_actividad"("created_at");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_coordinador_id_fkey" FOREIGN KEY ("coordinador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos_docentes" ADD CONSTRAINT "contratos_docentes_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "horarios_base" ADD CONSTRAINT "horarios_base_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_base" ADD CONSTRAINT "horarios_base_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horas_trabajadas" ADD CONSTRAINT "horas_trabajadas_asistencia_id_fkey" FOREIGN KEY ("asistencia_id") REFERENCES "asistencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horas_trabajadas" ADD CONSTRAINT "horas_trabajadas_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horas_trabajadas" ADD CONSTRAINT "horas_trabajadas_horario_base_id_fkey" FOREIGN KEY ("horario_base_id") REFERENCES "horarios_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_ubicacion_entrada_id_fkey" FOREIGN KEY ("ubicacion_entrada_id") REFERENCES "ubicaciones_permitidas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_ubicacion_salida_id_fkey" FOREIGN KEY ("ubicacion_salida_id") REFERENCES "ubicaciones_permitidas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "planillas_horas" ADD CONSTRAINT "planillas_horas_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos_docentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planillas_horas" ADD CONSTRAINT "planillas_horas_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_docentes" ADD CONSTRAINT "evaluaciones_docentes_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones_docentes" ADD CONSTRAINT "evaluaciones_docentes_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justificaciones" ADD CONSTRAINT "justificaciones_aprobado_por_fkey" FOREIGN KEY ("aprobado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "justificaciones" ADD CONSTRAINT "justificaciones_asistencia_id_fkey" FOREIGN KEY ("asistencia_id") REFERENCES "asistencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justificaciones" ADD CONSTRAINT "justificaciones_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_usuarios" ADD CONSTRAINT "sesiones_usuarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_especiales" ADD CONSTRAINT "horarios_especiales_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_generado_por_fkey" FOREIGN KEY ("generado_por") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logs_actividad" ADD CONSTRAINT "logs_actividad_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- RenameIndex
ALTER INDEX "idx_configuraciones_activo" RENAME TO "idx_config_sistema_activo";

-- RenameIndex
ALTER INDEX "idx_configuraciones_categoria" RENAME TO "idx_config_sistema_categoria";
