/**
 * 🎯 DTOs: JUSTIFICACIONES DOCENTE
 * 
 * Data Transfer Objects para validación de requests
 * con class-validator
 */

import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsBoolean, 
  IsUUID,
  IsDateString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max
} from 'class-validator';

// ========================================
// CREAR JUSTIFICACIÓN
// ========================================

export class CrearJustificacionDTO {
  @IsOptional()
  @IsUUID('4', { message: 'El ID de asistencia debe ser un UUID válido' })
  asistenciaId?: string;

  @IsDateString({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' })
  fechaInicio!: string;

  @IsDateString({}, { message: 'La fecha fin debe tener formato YYYY-MM-DD' })
  fechaFin!: string;

  @IsEnum(['MEDICA', 'PERSONAL', 'FAMILIAR', 'CAPACITACION', 'OTRO'], {
    message: 'El tipo debe ser: MEDICA, PERSONAL, FAMILIAR, CAPACITACION u OTRO'
  })
  tipo!: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';

  @IsString({ message: 'El motivo debe ser texto' })
  @MinLength(20, { message: 'El motivo debe tener al menos 20 caracteres' })
  @MaxLength(1000, { message: 'El motivo no puede exceder 1000 caracteres' })
  motivo!: string;

  @IsOptional()
  @IsString({ message: 'La URL de evidencia debe ser texto' })
  @MaxLength(500, { message: 'La URL no puede exceder 500 caracteres' })
  evidenciaUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'afectaPago debe ser true o false' })
  afectaPago?: boolean;
}

// ========================================
// ACTUALIZAR JUSTIFICACIÓN
// ========================================

export class ActualizarJustificacionDTO {
  @IsOptional()
  @IsEnum(['MEDICA', 'PERSONAL', 'FAMILIAR', 'CAPACITACION', 'OTRO'], {
    message: 'El tipo debe ser: MEDICA, PERSONAL, FAMILIAR, CAPACITACION u OTRO'
  })
  tipo?: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';

  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  @MinLength(20, { message: 'El motivo debe tener al menos 20 caracteres' })
  @MaxLength(1000, { message: 'El motivo no puede exceder 1000 caracteres' })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'La URL de evidencia debe ser texto' })
  @MaxLength(500, { message: 'La URL no puede exceder 500 caracteres' })
  evidenciaUrl?: string;
}

// ========================================
// FILTROS DE BÚSQUEDA
// ========================================

export class FiltrosJustificacionDTO {
  @IsOptional()
  @IsEnum(['PENDIENTE', 'APROBADO', 'RECHAZADO'], {
    message: 'El estado debe ser: PENDIENTE, APROBADO o RECHAZADO'
  })
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

  @IsOptional()
  @IsEnum(['MEDICA', 'PERSONAL', 'FAMILIAR', 'CAPACITACION', 'OTRO'], {
    message: 'El tipo debe ser: MEDICA, PERSONAL, FAMILIAR, CAPACITACION u OTRO'
  })
  tipo?: 'MEDICA' | 'PERSONAL' | 'FAMILIAR' | 'CAPACITACION' | 'OTRO';

  @IsOptional()
  @IsDateString({}, { message: 'fechaDesde debe tener formato YYYY-MM-DD' })
  fechaDesde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaHasta debe tener formato YYYY-MM-DD' })
  fechaHasta?: string;

  @IsOptional()
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number;

  @IsOptional()
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit no puede exceder 100' })
  limit?: number;
}
