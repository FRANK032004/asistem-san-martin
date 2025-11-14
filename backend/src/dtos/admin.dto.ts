/**
 * DTOs para módulo de Administración
 * Validación automática con class-validator
 */

import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsBoolean,
  MinLength, 
  MaxLength,
  Min,
  Max,
  Matches,
  IsLatitude,
  IsLongitude,
  IsInt
} from 'class-validator';

// ========================================
// DTOs DE UBICACIONES (GPS)
// ========================================

/**
 * DTO para crear una nueva ubicación
 */
export class CreateUbicacionDTO {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsNotEmpty({ message: 'Nombre es requerido' })
  @MinLength(3, { message: 'Nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'Nombre no puede exceder 100 caracteres' })
  nombre!: string;

  @IsString({ message: 'Descripción debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsNumber({}, { message: 'Latitud debe ser un número' })
  @IsNotEmpty({ message: 'Latitud es requerida' })
  @IsLatitude({ message: 'Latitud debe estar entre -90 y 90' })
  latitud!: number;

  @IsNumber({}, { message: 'Longitud debe ser un número' })
  @IsNotEmpty({ message: 'Longitud es requerida' })
  @IsLongitude({ message: 'Longitud debe estar entre -180 y 180' })
  longitud!: number;

  @IsNumber({}, { message: 'Radio debe ser un número' })
  @IsNotEmpty({ message: 'Radio es requerido' })
  @Min(10, { message: 'Radio mínimo es 10 metros' })
  @Max(500, { message: 'Radio máximo es 500 metros' })
  radio_metros!: number;

  @IsBoolean({ message: 'Activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

/**
 * DTO para actualizar una ubicación existente
 */
export class UpdateUbicacionDTO {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsOptional()
  @MinLength(3, { message: 'Nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'Nombre no puede exceder 100 caracteres' })
  nombre?: string;

  @IsString({ message: 'Descripción debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsNumber({}, { message: 'Latitud debe ser un número' })
  @IsOptional()
  @IsLatitude({ message: 'Latitud debe estar entre -90 y 90' })
  latitud?: number;

  @IsNumber({}, { message: 'Longitud debe ser un número' })
  @IsOptional()
  @IsLongitude({ message: 'Longitud debe estar entre -180 y 180' })
  longitud?: number;

  @IsNumber({}, { message: 'Radio debe ser un número' })
  @IsOptional()
  @Min(10, { message: 'Radio mínimo es 10 metros' })
  @Max(500, { message: 'Radio máximo es 500 metros' })
  radio_metros?: number;

  @IsBoolean({ message: 'Activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

// ========================================
// DTOs DE HORARIOS
// ========================================

/**
 * DTO para crear un nuevo horario académico
 */
export class CreateHorarioDTO {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsNotEmpty({ message: 'Nombre es requerido' })
  @MinLength(3, { message: 'Nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'Nombre no puede exceder 100 caracteres' })
  nombre!: string;

  @IsString({ message: 'Descripción debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsString({ message: 'Hora de entrada debe ser un string' })
  @IsNotEmpty({ message: 'Hora de entrada es requerida' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Hora de entrada debe estar en formato HH:MM (24h)' 
  })
  horaEntrada!: string;

  @IsString({ message: 'Hora de salida debe ser un string' })
  @IsNotEmpty({ message: 'Hora de salida es requerida' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Hora de salida debe estar en formato HH:MM (24h)' 
  })
  horaSalida!: string;

  @IsInt({ message: 'Tolerancia entrada debe ser un número entero' })
  @IsOptional()
  @Min(0, { message: 'Tolerancia entrada no puede ser negativa' })
  @Max(60, { message: 'Tolerancia entrada máxima es 60 minutos' })
  toleranciaEntrada?: number;

  @IsInt({ message: 'Tolerancia salida debe ser un número entero' })
  @IsOptional()
  @Min(0, { message: 'Tolerancia salida no puede ser negativa' })
  @Max(60, { message: 'Tolerancia salida máxima es 60 minutos' })
  toleranciaSalida?: number;

  @IsBoolean({ message: 'Activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

/**
 * DTO para actualizar un horario existente
 */
export class UpdateHorarioDTO {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsOptional()
  @MinLength(3, { message: 'Nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'Nombre no puede exceder 100 caracteres' })
  nombre?: string;

  @IsString({ message: 'Descripción debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsString({ message: 'Hora de entrada debe ser un string' })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Hora de entrada debe estar en formato HH:MM (24h)' 
  })
  horaEntrada?: string;

  @IsString({ message: 'Hora de salida debe ser un string' })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Hora de salida debe estar en formato HH:MM (24h)' 
  })
  horaSalida?: string;

  @IsInt({ message: 'Tolerancia entrada debe ser un número entero' })
  @IsOptional()
  @Min(0, { message: 'Tolerancia entrada no puede ser negativa' })
  @Max(60, { message: 'Tolerancia entrada máxima es 60 minutos' })
  toleranciaEntrada?: number;

  @IsInt({ message: 'Tolerancia salida debe ser un número entero' })
  @IsOptional()
  @Min(0, { message: 'Tolerancia salida no puede ser negativa' })
  @Max(60, { message: 'Tolerancia salida máxima es 60 minutos' })
  toleranciaSalida?: number;

  @IsBoolean({ message: 'Activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

// ========================================
// DTOs DE ÁREAS
// ========================================

/**
 * DTO para crear un área
 */
export class CreateAreaDTO {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsNotEmpty({ message: 'Nombre es requerido' })
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Nombre no puede exceder 100 caracteres' })
  nombre!: string;

  @IsString({ message: 'Descripción debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsBoolean({ message: 'Activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}

/**
 * DTO para actualizar un área
 */
export class UpdateAreaDTO {
  @IsString({ message: 'Nombre debe ser un string' })
  @IsOptional()
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Nombre no puede exceder 100 caracteres' })
  nombre?: string;

  @IsString({ message: 'Descripción debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsBoolean({ message: 'Activo debe ser un booleano' })
  @IsOptional()
  activo?: boolean;
}
