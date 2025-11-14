import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EstadisticasReporte {
  totalAsistencias: number;
  presentesPromedio: number;
  puntualidadPromedio: number;
  ausentismoPromedio: number;
  fechaInicio: Date;
  fechaFin: Date;
}

interface ReporteAsistencia {
  id: string;
  docente: {
    nombre: string;
    apellido: string;
  };
  fecha: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';
}

export const generarReporteExcel = async (
  estadisticas: EstadisticasReporte,
  asistencias: ReporteAsistencia[]
): Promise<void> => {
  try {
    console.log('Iniciando generación de Excel profesional');
    
    // Crear libro de trabajo
    const workbook = new ExcelJS.Workbook();
    
    // Configurar propiedades del documento
    workbook.creator = 'Instituto San Martín';
    workbook.lastModifiedBy = 'Sistema de Asistencias';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();

    // HOJA 1: RESUMEN EJECUTIVO
    const hojaResumen = workbook.addWorksheet('Resumen Ejecutivo', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
        margins: {
          left: 0.75,
          right: 0.75,
          top: 1.0,
          bottom: 1.0,
          header: 0.3,
          footer: 0.3,
        },
      },
    });

    // HEADER INSTITUCIONAL
    hojaResumen.mergeCells('A1:E1');
    const titleCell = hojaResumen.getCell('A1');
    titleCell.value = 'INSTITUTO SAN MARTÍN - REPORTE DE ASISTENCIAS';
    titleCell.font = { 
      name: 'Arial', 
      size: 16, 
      bold: true, 
      color: { argb: 'FF1F2937' } 
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };
    hojaResumen.getRow(1).height = 30;

    // FECHA DE GENERACIÓN
    hojaResumen.mergeCells('A2:E2');
    const dateCell = hojaResumen.getCell('A2');
    dateCell.value = `Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`;
    dateCell.font = { name: 'Arial', size: 11, color: { argb: 'FF6B7280' } };
    dateCell.alignment = { horizontal: 'center' };
    hojaResumen.getRow(2).height = 20;

    // LÍNEA SEPARADORA
    hojaResumen.mergeCells('A3:E3');
    const separatorCell = hojaResumen.getCell('A3');
    separatorCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    hojaResumen.getRow(3).height = 3;

    // ESTADÍSTICAS PRINCIPALES
    let currentRow = 5;
    
    // Título de estadísticas
    hojaResumen.mergeCells(`A${currentRow}:E${currentRow}`);
    const statsTitle = hojaResumen.getCell(`A${currentRow}`);
    statsTitle.value = 'ESTADÍSTICAS GENERALES';
    statsTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1F2937' } };
    statsTitle.alignment = { horizontal: 'left' };
    currentRow += 2;

    // Crear tarjetas de estadísticas
    const estadisticasData = [
      { label: 'Total de Asistencias', value: estadisticas.totalAsistencias, color: 'FF3B82F6' },
      { label: 'Promedio de Presentes', value: `${estadisticas.presentesPromedio.toFixed(1)}%`, color: 'FF10B981' },
      { label: 'Promedio de Puntualidad', value: `${estadisticas.puntualidadPromedio.toFixed(1)}%`, color: 'FF8B5CF6' },
      { label: 'Promedio de Ausentismo', value: `${estadisticas.ausentismoPromedio.toFixed(1)}%`, color: 'FFEF4444' },
    ];

    estadisticasData.forEach((stat, index) => {
      const row = currentRow + index;
      
      // Label
      const labelCell = hojaResumen.getCell(`A${row}`);
      labelCell.value = stat.label;
      labelCell.font = { name: 'Arial', size: 11, bold: true };
      
      // Value
      const valueCell = hojaResumen.getCell(`C${row}`);
      valueCell.value = stat.value;
      valueCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: stat.color } };
      valueCell.alignment = { horizontal: 'right' };
      
      hojaResumen.getRow(row).height = 25;
    });

    currentRow += estadisticasData.length + 2;

    // PERÍODO DEL REPORTE
    const periodoCell = hojaResumen.getCell(`A${currentRow}`);
    const fechaInicio = format(estadisticas.fechaInicio, 'dd/MM/yyyy', { locale: es });
    const fechaFin = format(estadisticas.fechaFin, 'dd/MM/yyyy', { locale: es });
    periodoCell.value = `Período analizado: ${fechaInicio} - ${fechaFin}`;
    periodoCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF6B7280' } };

    // HOJA 2: DETALLE DE ASISTENCIAS
    const hojaDetalle = workbook.addWorksheet('Detalle de Asistencias', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
      },
    });

    // Headers de la tabla
    const headers = ['N°', 'DOCENTE', 'FECHA', 'ESTADO', 'OBSERVACIONES'];
    headers.forEach((header, index) => {
      const cell = hojaDetalle.getCell(1, index + 1);
      cell.value = header;
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Configurar anchos de columnas
    hojaDetalle.columns = [
      { width: 8 },   // N°
      { width: 25 },  // DOCENTE
      { width: 15 },  // FECHA
      { width: 15 },  // ESTADO
      { width: 30 },  // OBSERVACIONES
    ];

    hojaDetalle.getRow(1).height = 25;

    // Datos de asistencias
    asistencias.forEach((asistencia, index) => {
      const rowIndex = index + 2;
      const row = hojaDetalle.getRow(rowIndex);
      
      // Número consecutivo
      row.getCell(1).value = index + 1;
      row.getCell(1).alignment = { horizontal: 'center' };
      
      // Nombre completo del docente
      row.getCell(2).value = `${asistencia.docente.nombre} ${asistencia.docente.apellido}`;
      
      // Fecha
      row.getCell(3).value = asistencia.fecha;
      row.getCell(3).alignment = { horizontal: 'center' };
      
      // Estado con color
      const estadoCell = row.getCell(4);
      estadoCell.value = asistencia.estado;
      estadoCell.alignment = { horizontal: 'center' };
      estadoCell.font = { name: 'Arial', size: 10, bold: true };
      
      // Colores por estado
      switch (asistencia.estado) {
        case 'PRESENTE':
          estadoCell.font.color = { argb: 'FF10B981' };
          estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
          break;
        case 'AUSENTE':
          estadoCell.font.color = { argb: 'FFEF4444' };
          estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
          break;
        case 'TARDANZA':
          estadoCell.font.color = { argb: 'FFF59E0B' };
          estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
          break;
        case 'JUSTIFICADO':
          estadoCell.font.color = { argb: 'FF3B82F6' };
          estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
          break;
      }
      
      // Observaciones (por ahora vacío)
      row.getCell(5).value = '';
      
      // Alternar color de fondo para mejor legibilidad
      if (index % 2 === 0) {
        [1, 2, 3, 5].forEach(colIndex => {
          row.getCell(colIndex).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        });
      }
      
      // Bordes para todas las celdas
      [1, 2, 3, 4, 5].forEach(colIndex => {
        row.getCell(colIndex).border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
      
      row.height = 20;
    });

    // HOJA 3: ESTADÍSTICAS POR ESTADO
    const hojaEstados = workbook.addWorksheet('Estadísticas por Estado');
    
    // Contar estados
    const conteoEstados = {
      PRESENTE: asistencias.filter(a => a.estado === 'PRESENTE').length,
      AUSENTE: asistencias.filter(a => a.estado === 'AUSENTE').length,
      TARDANZA: asistencias.filter(a => a.estado === 'TARDANZA').length,
      JUSTIFICADO: asistencias.filter(a => a.estado === 'JUSTIFICADO').length,
    };

    // Headers
    hojaEstados.getCell('A1').value = 'ESTADO';
    hojaEstados.getCell('B1').value = 'CANTIDAD';
    hojaEstados.getCell('C1').value = 'PORCENTAJE';

    [hojaEstados.getCell('A1'), hojaEstados.getCell('B1'), hojaEstados.getCell('C1')].forEach(cell => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Datos por estado
    let rowIndex = 2;
    Object.entries(conteoEstados).forEach(([estado, cantidad]) => {
      const porcentaje = ((cantidad / asistencias.length) * 100).toFixed(1);
      
      hojaEstados.getCell(`A${rowIndex}`).value = estado;
      hojaEstados.getCell(`B${rowIndex}`).value = cantidad;
      hojaEstados.getCell(`C${rowIndex}`).value = `${porcentaje}%`;
      
      hojaEstados.getCell(`B${rowIndex}`).alignment = { horizontal: 'center' };
      hojaEstados.getCell(`C${rowIndex}`).alignment = { horizontal: 'center' };
      
      rowIndex++;
    });

    // Configurar anchos de columnas
    hojaEstados.columns = [
      { width: 15 }, // ESTADO
      { width: 12 }, // CANTIDAD
      { width: 15 }, // PORCENTAJE
    ];

    // Aplicar filtros automáticos
    hojaDetalle.autoFilter = {
      from: 'A1',
      to: `E${asistencias.length + 1}`
    };

    // Generar archivo y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte-asistencias-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    enlace.click();
    
    URL.revokeObjectURL(url);
    
    console.log('Excel generado exitosamente');
    
  } catch (error) {
    console.error('Error al generar Excel:', error);
    throw error;
  }
};

export default { generarReporteExcel };
