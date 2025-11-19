/**
 * @module AsistenciaDocenteDTO
 * @description DTOs para registro de asistencias con GPS
 * Validaciones robustas para coordenadas, precisión y timestamp
 */

import { 
  IsNumber, 
  IsInt,
  Min,
  Max,
  IsOptional
} from 'class-validator';

/**
 * DTO para registrar entrada con GPS
 */
export class RegistrarEntradaDTO {
  @IsNumber({}, { message: 'Latitud debe ser un número' })
  @Min(-90, { message: 'Latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'Latitud debe estar entre -90 y 90' })
  latitud!: number;

  @IsNumber({}, { message: 'Longitud debe ser un número' })
  @Min(-180, { message: 'Longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'Longitud debe estar entre -180 y 180' })
  longitud!: number;

  @IsNumber({}, { message: 'Precisión debe ser un número' })
  @Min(0, { message: 'Precisión debe ser un valor positivo' })
  @Max(1000, { message: 'Precisión no puede ser mayor a 1000 metros' })
  precision!: number;

  @IsInt({ message: 'Timestamp debe ser un número entero' })
  @Min(0, { message: 'Timestamp debe ser un valor positivo' })
  timestamp!: number;
}

/**
 * DTO para registrar salida con GPS
 */
export class RegistrarSalidaDTO {
  @IsNumber({}, { message: 'Latitud debe ser un número' })
  @Min(-90, { message: 'Latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'Latitud debe estar entre -90 y 90' })
  latitud!: number;

  @IsNumber({}, { message: 'Longitud debe ser un número' })
  @Min(-180, { message: 'Longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'Longitud debe estar entre -180 y 180' })
  longitud!: number;

  @IsNumber({}, { message: 'Precisión debe ser un número' })
  @Min(0, { message: 'Precisión debe ser un valor positivo' })
  @Max(1000, { message: 'Precisión no puede ser mayor a 1000 metros' })
  precision!: number;

  @IsInt({ message: 'Timestamp debe ser un número entero' })
  @Min(0, { message: 'Timestamp debe ser un valor positivo' })
  timestamp!: number;
}

/**
 * DTO para obtener estadísticas mensuales
 */
export class EstadisticasMesDTO {
  @IsInt({ message: 'Mes debe ser un número entero' })
  @Min(1, { message: 'Mes debe estar entre 1 y 12' })
  @Max(12, { message: 'Mes debe estar entre 1 y 12' })
  @IsOptional()
  mes?: number;

  @IsInt({ message: 'Año debe ser un número entero' })
  @Min(2020, { message: 'Año debe ser mayor o igual a 2020' })
  @Max(2100, { message: 'Año debe ser menor o igual a 2100' })
  @IsOptional()
  anio?: number;
}

/**
 * DTO para obtener historial con paginación
 */
export class HistorialAsistenciasDTO {
  @IsInt({ message: 'Límite debe ser un número entero' })
  @Min(1, { message: 'Límite debe ser mayor a 0' })
  @Max(100, { message: 'Límite no puede ser mayor a 100' })
  @IsOptional()
  limit?: number = 50;

  @IsInt({ message: 'Offset debe ser un número entero' })
  @Min(0, { message: 'Offset debe ser mayor o igual a 0' })
  @IsOptional()
  offset?: number = 0;
}
