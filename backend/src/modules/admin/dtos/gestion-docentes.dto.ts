/**
 * @module GestionDocentesDTO
 * @description DTOs para gestión administrativa de docentes
 * 
 * Solo para uso de Admin/Supervisor
 * Incluye validaciones para operaciones CRUD de docentes
 */

import { 
  IsString, 
  IsNotEmpty, 
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  ArrayMinSize,
  IsInt,
  Min
} from 'class-validator';

// ========================================
// DTOs DE PERFIL DOCENTE (ADMIN)
// ========================================

/**
 * DTO para actualizar perfil del docente (Solo Admin)
 * Permite cambiar área, código docente y otros campos administrativos
 */
export class UpdatePerfilDocenteDTO {
  @IsString({ message: 'Código docente debe ser un string' })
  @IsOptional()
  @MinLength(3, { message: 'Código docente debe tener al menos 3 caracteres' })
  @MaxLength(20, { message: 'Código docente no puede exceder 20 caracteres' })
  codigo_docente?: string;

  @IsString({ message: 'Teléfono debe ser un string' })
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'Teléfono debe tener exactamente 9 dígitos' })
  telefono?: string;

  @IsUUID('4', { message: 'ID de área debe ser un UUID válido' })
  @IsOptional()
  area_id?: string;
}

/**
 * DTO para actualizar estado de docente (Solo Admin)
 */
export class UpdateEstadoDocenteDTO {
  @IsString({ message: 'Estado debe ser un string' })
  @IsNotEmpty({ message: 'Estado es requerido' })
  @Matches(/^(activo|inactivo)$/, { 
    message: 'Estado debe ser "activo" o "inactivo"' 
  })
  estado!: string;

  @IsString({ message: 'Motivo debe ser un string' })
  @IsOptional()
  @MaxLength(500, { message: 'Motivo no puede exceder 500 caracteres' })
  motivo?: string;
}

// ========================================
// DTOs DE ASIGNACIONES (ADMIN)
// ========================================

/**
 * DTO para asignar horario a un docente
 */
export class AsignarHorarioDocenteDTO {
  @IsUUID('4', { message: 'ID de docente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'ID de docente es requerido' })
  docenteId!: string;

  @IsUUID('4', { message: 'ID de horario debe ser un UUID válido' })
  @IsNotEmpty({ message: 'ID de horario es requerido' })
  horarioId!: string;

  @IsString({ message: 'Descripción debe ser un string' })
  @IsOptional()
  @MaxLength(200, { message: 'Descripción no puede exceder 200 caracteres' })
  descripcion?: string;
}

/**
 * DTO para asignar múltiples horarios a un docente
 */
export class AsignarMultiplesHorariosDTO {
  @IsUUID('4', { message: 'ID de docente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'ID de docente es requerido' })
  docenteId!: string;

  @IsArray({ message: 'Horarios debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe asignar al menos un horario' })
  @IsUUID('4', { each: true, message: 'Cada ID de horario debe ser un UUID válido' })
  horarioIds!: string[];
}

/**
 * DTO para asignar área a un docente
 */
export class AsignarAreaDocenteDTO {
  @IsUUID('4', { message: 'ID de docente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'ID de docente es requerido' })
  docenteId!: string;

  @IsInt({ message: 'ID de área debe ser un número entero' })
  @Min(1, { message: 'ID de área debe ser mayor a 0' })
  @IsNotEmpty({ message: 'ID de área es requerido' })
  area_id!: number;
}

// ========================================
// DTOs DE CONSULTAS (ADMIN)
// ========================================

/**
 * DTO para filtrar docentes (query params)
 */
export class FiltrarDocentesDTO {
  @IsString({ message: 'Página debe ser un string' })
  @IsOptional()
  page?: string; // ✅ Parámetro de paginación

  @IsString({ message: 'Límite debe ser un string' })
  @IsOptional()
  limit?: string; // ✅ Parámetro de paginación

  @IsString({ message: 'Área debe ser un string' })
  @IsOptional()
  area_id?: string;

  @IsString({ message: 'Estado debe ser un string' })
  @IsOptional()
  estado?: string; // ✅ Sin validación restrictiva - acepta ACTIVO, INACTIVO, LICENCIA, etc.

  @IsString({ message: 'Búsqueda debe ser un string' })
  @IsOptional()
  @MinLength(2, { message: 'Búsqueda debe tener al menos 2 caracteres' })
  search?: string; // ✅ Cambiado de 'busqueda' a 'search' para coincidir con frontend
}


