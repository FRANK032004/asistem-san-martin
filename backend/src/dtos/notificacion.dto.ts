/**
 * DTOs para Notificaciones
 * Validación y tipado de datos de notificaciones
 */

import { IsString, IsBoolean, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';

export enum TipoNotificacion {
  ASISTENCIA = 'ASISTENCIA',
  JUSTIFICACION = 'JUSTIFICACION',
  PLANILLA = 'PLANILLA',
  HORARIO = 'HORARIO',
  SISTEMA = 'SISTEMA',
  ALERTA = 'ALERTA',
}

/**
 * DTO para crear notificación
 */
export class CreateNotificacionDTO {
  @IsUUID()
  usuario_id!: string;

  @IsEnum(TipoNotificacion)
  tipo!: TipoNotificacion;

  @IsString()
  titulo!: string;

  @IsString()
  mensaje!: string;

  @IsOptional()
  @IsObject()
  datos?: any;

  @IsOptional()
  @IsBoolean()
  importante?: boolean;
}

/**
 * DTO para marcar como leída
 */
export class MarcarLeidaDTO {
  @IsUUID()
  id!: string;
}

/**
 * DTO para filtros de notificaciones
 */
export class FiltrosNotificacionesDTO {
  @IsOptional()
  @IsEnum(TipoNotificacion)
  tipo?: TipoNotificacion;

  @IsOptional()
  @IsBoolean()
  leido?: boolean;

  @IsOptional()
  @IsBoolean()
  importante?: boolean;
}
