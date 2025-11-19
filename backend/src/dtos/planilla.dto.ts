import { IsInt, IsOptional, IsEnum, Min, Max } from 'class-validator';

// ============================================
// DTOs para listar planillas
// ============================================

export class ObtenerPlanillasDocenteDto {
  id!: string;
  mes!: number;
  anio!: number;
  periodo!: string;
  estado!: string;
  horasRegulares!: number;
  horasExtras!: number;
  totalHoras!: number;
  montoBase!: number;
  bonificaciones!: number;
  descuentos!: number;
  totalNeto!: number;
  fechaEmision!: string | null;
  fechaPago!: string | null;
  docente!: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
}

export class FiltrarPlanillasDto {
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2100)
  anio?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @IsEnum(['PENDIENTE', 'EN_PROCESO', 'PAGADO', 'ANULADO', 'TODOS'])
  estado?: string;
}

// ============================================
// DTOs para detalle de planilla
// ============================================

export class PlanillaDetalleDto {
  id!: string;
  mes!: number;
  anio!: number;
  periodo!: string;
  estado!: string;

  docente!: {
    nombres: string;
    apellidos: string;
    dni: string;
    email: string;
    especialidad: string;
    nivelEducativo: string;
    condicionLaboral: string;
    regimen: string;
  };

  horas!: {
    regulares: number;
    extras: number;
    total: number;
    valorHora: number;
  };

  montos!: {
    base: number;
    horasExtras: number;
    bonificaciones: number;
    descuentos: number;
    totalBruto: number;
    totalNeto: number;
  };

  asistencia!: {
    totalDias: number;
    diasPresente: number;
    diasTardanza: number;
    diasAusente: number;
    porcentajeAsistencia: number;
    totalTardanzaMinutos: number;
    promedioTardanzaMinutos: number;
  };

  detalles!: Array<{
    id: string;
    fecha: string;
    horasTrabajadas: number;
    horasExtras: number;
    estado: string;
    horaEntrada: string | null;
    horaSalida: string | null;
    tardanzaMinutos: number;
    observaciones: string | null;
  }>;

  fechaEmision!: string | null;
  fechaPago!: string | null;
  observaciones!: string | null;
}

// ============================================
// DTOs para estadísticas
// ============================================

export class EstadisticasPlanillaDto {
  ultimaPlanilla!: {
    periodo: string;
    estado: string;
    totalNeto: number;
  } | null;
  totalPercibidoAnio!: number;
  promedioMensual!: number;
  planillasPendientes!: number;
  totalPlanillasAnio!: number;
}

// ============================================
// DTOs para respuestas
// ============================================

export class PlanillaResponseDto {
  success!: boolean;
  message!: string;
  data?: ObtenerPlanillasDocenteDto[] | PlanillaDetalleDto | EstadisticasPlanillaDto;
}
