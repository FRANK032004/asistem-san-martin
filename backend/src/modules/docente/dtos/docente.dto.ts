/**
 * @module DocenteDTO
 * @description DTOs para auto-gestión del docente autenticado
 * 
 * Solo para operaciones self-service del docente
 * Validaciones restrictivas para proteger datos sensibles
 */

import { 
  IsString, 
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsInt,
  Min,
  Max
} from 'class-validator';

// ========================================
// DTOs DE PERFIL PROPIO
// ========================================

/**
 * DTO para actualizar MI perfil (Docente autenticado)
 * Solo permite cambiar datos personales
 * 
 * Campos restringidos (solo admin puede cambiar):
 * - area
 * - sueldo
 * - codigo_docente
 * - horarios
 */
export class UpdateMiPerfilDocenteDTO {
  @IsString({ message: 'Teléfono debe ser un string' })
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'Teléfono debe tener exactamente 9 dígitos' })
  telefono?: string;

  @IsString({ message: 'Dirección debe ser un string' })
  @IsOptional()
  @MinLength(10, { message: 'Dirección debe tener al menos 10 caracteres' })
  @MaxLength(255, { message: 'Dirección no puede exceder 255 caracteres' })
  direccion?: string;

  @IsString({ message: 'Contacto de emergencia debe ser un string' })
  @IsOptional()
  @MinLength(5, { message: 'Contacto de emergencia debe tener al menos 5 caracteres' })
  @MaxLength(100, { message: 'Contacto de emergencia no puede exceder 100 caracteres' })
  contacto_emergencia?: string;

  @IsString({ message: 'Teléfono de emergencia debe ser un string' })
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'Teléfono de emergencia debe tener exactamente 9 dígitos' })
  telefono_emergencia?: string;
}

// ========================================
// DTOs DE CONSULTAS PROPIAS
// ========================================

/**
 * DTO para filtrar MIS justificaciones (Docente autenticado)
 */
export class FiltrarMisJustificacionesDTO {
  @IsString({ message: 'Estado debe ser un string' })
  @IsOptional()
  @Matches(/^(pendiente|aprobada|rechazada|todas)$/, { 
    message: 'Estado debe ser: pendiente, aprobada, rechazada o todas' 
  })
  estado?: string = 'todas';

  @IsString({ message: 'Fecha inicio debe ser un string' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Fecha inicio debe tener formato YYYY-MM-DD' 
  })
  fecha_inicio?: string;

  @IsString({ message: 'Fecha fin debe ser un string' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Fecha fin debe tener formato YYYY-MM-DD' 
  })
  fecha_fin?: string;

  @IsInt({ message: 'Límite debe ser un número entero' })
  @Min(1, { message: 'Límite debe ser mayor a 0' })
  @Max(100, { message: 'Límite no puede ser mayor a 100' })
  @IsOptional()
  limite?: number = 20;
}

/**
 * DTO para filtrar MIS asistencias (Docente autenticado)
 */
export class FiltrarMisAsistenciasDTO {
  @IsString({ message: 'Fecha inicio debe ser un string' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Fecha inicio debe tener formato YYYY-MM-DD' 
  })
  fecha_inicio?: string;

  @IsString({ message: 'Fecha fin debe ser un string' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Fecha fin debe tener formato YYYY-MM-DD' 
  })
  fecha_fin?: string;

  @IsString({ message: 'Estado debe ser un string' })
  @IsOptional()
  @Matches(/^(PRESENTE|TARDANZA|AUSENTE|JUSTIFICADA|todas)$/, { 
    message: 'Estado debe ser: PRESENTE, TARDANZA, AUSENTE, JUSTIFICADA o todas' 
  })
  estado?: string = 'todas';

  @IsInt({ message: 'Límite debe ser un número entero' })
  @Min(1, { message: 'Límite debe ser mayor a 0' })
  @Max(100, { message: 'Límite no puede ser mayor a 100' })
  @IsOptional()
  limite?: number = 20;
}
