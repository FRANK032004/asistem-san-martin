/**
 * DTOs para módulo de Asistencia
 * Incluye validación GPS y reglas de negocio
 */

import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional,
  IsLatitude,
  IsLongitude,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsEnum,
  ValidateIf
} from 'class-validator';

// ========================================
// ENUMS
// ========================================

export enum TipoRegistro {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA'
}

export enum EstadoAsistencia {
  PRESENTE = 'PRESENTE',
  AUSENTE = 'AUSENTE',
  TARDANZA = 'TARDANZA',
  JUSTIFICADO = 'JUSTIFICADO'
}

// ========================================
// DTOs DE REGISTRO DE ASISTENCIA
// ========================================

/**
 * DTO para registro de entrada (check-in)
 * Incluye validación GPS obligatoria
 */
export class RegistroEntradaDTO {
  @IsUUID('4', { message: 'ID de ubicación debe ser un UUID válido' })
  @IsNotEmpty({ message: 'ID de ubicación es requerido' })
  ubicacionId!: string;

  @IsNumber({}, { message: 'Latitud debe ser un número' })
  @IsNotEmpty({ message: 'Latitud es requerida' })
  @IsLatitude({ message: 'Latitud debe estar entre -90 y 90' })
  latitud!: number;

  @IsNumber({}, { message: 'Longitud debe ser un número' })
  @IsNotEmpty({ message: 'Longitud es requerida' })
  @IsLongitude({ message: 'Longitud debe estar entre -180 y 180' })
  longitud!: number;

  @IsNumber({}, { message: 'Precisión GPS debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'Precisión GPS no puede ser negativa' })
  @Max(100, { message: 'Precisión GPS máxima es 100 metros' })
  precision?: number;

  @IsString({ message: 'Observaciones debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Observaciones no pueden exceder 500 caracteres' })
  observaciones?: string;
}

/**
 * DTO para registro de salida (check-out)
 * GPS es opcional en salida
 */
export class RegistroSalidaDTO {
  @IsNumber({}, { message: 'Latitud debe ser un número' })
  @IsOptional()
  @IsLatitude({ message: 'Latitud debe estar entre -90 y 90' })
  latitud?: number;

  @IsNumber({}, { message: 'Longitud debe ser un número' })
  @IsOptional()
  @IsLongitude({ message: 'Longitud debe estar entre -180 y 180' })
  longitud?: number;

  @IsNumber({}, { message: 'Precisión GPS debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'Precisión GPS no puede ser negativa' })
  @Max(100, { message: 'Precisión GPS máxima es 100 metros' })
  precision?: number;

  @IsString({ message: 'Observaciones debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Observaciones no pueden exceder 500 caracteres' })
  observaciones?: string;
}

// ========================================
// DTOs DE JUSTIFICACIÓN
// ========================================

/**
 * DTO para crear una justificación de ausencia/tardanza
 */
export class CreateJustificacionDTO {
  @IsUUID('4', { message: 'ID de asistencia debe ser un UUID válido' })
  @IsNotEmpty({ message: 'ID de asistencia es requerido' })
  asistencia_id!: string;

  @IsString({ message: 'Motivo debe ser un string' })
  @IsNotEmpty({ message: 'Motivo es requerido' })
  @MinLength(10, { message: 'Motivo debe tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'Motivo no puede exceder 1000 caracteres' })
  motivo!: string;

  @IsString({ message: 'Tipo debe ser un string' })
  @IsOptional()
  @MaxLength(50, { message: 'Tipo no puede exceder 50 caracteres' })
  tipo?: string;

  @IsString({ message: 'Documento debe ser un string' })
  @IsOptional()
  @MaxLength(255, { message: 'Documento no puede exceder 255 caracteres' })
  documento?: string;
}

/**
 * DTO para aprobar/rechazar justificación (Admin)
 */
export class AprobarJustificacionDTO {
  @IsEnum(['APROBADO', 'RECHAZADO'], { 
    message: 'Estado debe ser APROBADO o RECHAZADO' 
  })
  @IsNotEmpty({ message: 'Estado es requerido' })
  estado!: 'APROBADO' | 'RECHAZADO';

  @IsString({ message: 'Comentario debe ser un string' })
  @ValidateIf(o => o.estado === 'RECHAZADO')
  @IsNotEmpty({ message: 'Comentario es requerido al rechazar' })
  @MaxLength(500, { message: 'Comentario no puede exceder 500 caracteres' })
  comentario?: string;
}

// ========================================
// DTOs DE CONSULTA/FILTROS
// ========================================

/**
 * DTO para filtrar asistencias (query params)
 */
export class FiltrarAsistenciasDTO {
  @IsString({ message: 'Fecha inicio debe ser un string' })
  @IsOptional()
  fecha_inicio?: string;

  @IsString({ message: 'Fecha fin debe ser un string' })
  @IsOptional()
  fecha_fin?: string;

  @IsEnum(EstadoAsistencia, { 
    message: 'Estado debe ser PRESENTE, AUSENTE, TARDANZA o JUSTIFICADO' 
  })
  @IsOptional()
  estado?: EstadoAsistencia;

  @IsUUID('4', { message: 'ID de docente debe ser un UUID válido' })
  @IsOptional()
  docenteId?: string;

  @IsNumber({}, { message: 'Página debe ser un número' })
  @IsOptional()
  @Min(1, { message: 'Página mínima es 1' })
  page?: number;

  @IsNumber({}, { message: 'Límite debe ser un número' })
  @IsOptional()
  @Min(1, { message: 'Límite mínimo es 1' })
  @Max(100, { message: 'Límite máximo es 100' })
  limit?: number;
}

// ========================================
// DTOs DE REPORTES
// ========================================

/**
 * DTO para generar reporte de asistencias
 */
export class GenerarReporteAsistenciaDTO {
  @IsString({ message: 'Fecha inicio debe ser un string' })
  @IsNotEmpty({ message: 'Fecha inicio es requerida' })
  fecha_inicio!: string;

  @IsString({ message: 'Fecha fin debe ser un string' })
  @IsNotEmpty({ message: 'Fecha fin es requerida' })
  fecha_fin!: string;

  @IsUUID('4', { message: 'ID de área debe ser un UUID válido' })
  @IsOptional()
  area_id?: string;

  @IsEnum(['PDF', 'EXCEL', 'CSV'], { 
    message: 'Formato debe ser PDF, EXCEL o CSV' 
  })
  @IsOptional()
  formato?: 'PDF' | 'EXCEL' | 'CSV';
}
