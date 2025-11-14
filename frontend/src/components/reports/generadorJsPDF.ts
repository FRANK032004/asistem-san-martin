import jsPDF from 'jspdf';
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

export const generarReportePDFSimple = async (
  estadisticas: EstadisticasReporte,
  asistencias: ReporteAsistencia[]
): Promise<void> => {
  try {
    console.log('Iniciando generación de PDF con jsPDF');
    
    // Crear documento PDF
    const doc = new jsPDF();
    
    // Configurar fuente
    doc.setFont('helvetica');
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('REPORTE DE ASISTENCIAS', 105, 30, { align: 'center' });
    
    // Subtítulo con fecha
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const fechaReporte = format(new Date(), 'dd/MM/yyyy', { locale: es });
    doc.text(`Generado el: ${fechaReporte}`, 105, 40, { align: 'center' });
    
    // Línea separadora
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(20, 50, 190, 50);
    
    // Sección de estadísticas
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('ESTADÍSTICAS GENERALES', 20, 70);
    
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    
    // Estadísticas en formato de lista
    let yPos = 85;
    doc.text(`• Total de Asistencias: ${estadisticas.totalAsistencias}`, 25, yPos);
    yPos += 10;
    doc.text(`• Promedio de Presentes: ${estadisticas.presentesPromedio.toFixed(1)}%`, 25, yPos);
    yPos += 10;
    doc.text(`• Promedio de Puntualidad: ${estadisticas.puntualidadPromedio.toFixed(1)}%`, 25, yPos);
    yPos += 10;
    doc.text(`• Promedio de Ausentismo: ${estadisticas.ausentismoPromedio.toFixed(1)}%`, 25, yPos);
    
    // Período del reporte
    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const fechaInicio = format(estadisticas.fechaInicio, 'dd/MM/yyyy', { locale: es });
    const fechaFin = format(estadisticas.fechaFin, 'dd/MM/yyyy', { locale: es });
    doc.text(`Período: ${fechaInicio} - ${fechaFin}`, 25, yPos);
    
    // Sección de asistencias detalladas
    yPos += 30;
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('REGISTRO DE ASISTENCIAS', 20, yPos);
    
    // Encabezados de tabla
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    
    doc.text('DOCENTE', 25, yPos);
    doc.text('FECHA', 80, yPos);
    doc.text('ESTADO', 130, yPos);
    
    // Datos de asistencias (máximo 20 registros para evitar desbordamiento)
    doc.setTextColor(60, 60, 60);
    const maxRegistros = Math.min(asistencias.length, 20);
    
    for (let i = 0; i < maxRegistros; i++) {
      const asistencia = asistencias[i];
      yPos += 12;
      
      // Alternar color de fondo para mejor legibilidad
      if (i % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, yPos - 8, 170, 10, 'F');
      }
      
      // Nombre completo del docente
      const nombreCompleto = `${asistencia.docente.nombre} ${asistencia.docente.apellido}`;
      doc.text(nombreCompleto.substring(0, 25), 25, yPos);
      
      // Fecha formateada
      doc.text(asistencia.fecha, 80, yPos);
      
      // Estado con color
      const [r, g, b] = getColorForState(asistencia.estado);
      doc.setTextColor(r, g, b);
      doc.text(asistencia.estado, 130, yPos);
      doc.setTextColor(60, 60, 60);
      
      // Verificar si necesitamos una nueva página
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.text('REGISTRO DE ASISTENCIAS (continuación)', 20, yPos);
        yPos += 15;
      }
    }
    
    // Pie de página
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Instituto San Martín - Página ${i} de ${totalPages}`,
        105,
        285,
        { align: 'center' }
      );
    }
    
    // Descargar el PDF
    const nombreArchivo = `reporte-asistencias-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(nombreArchivo);
    
    console.log('PDF generado exitosamente');
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
};

// Función auxiliar para obtener colores según el estado
function getColorForState(estado: string): [number, number, number] {
  switch (estado) {
    case 'PRESENTE':
      return [16, 185, 129]; // Verde
    case 'AUSENTE':
      return [239, 68, 68]; // Rojo
    case 'TARDANZA':
      return [245, 158, 11]; // Naranja
    case 'JUSTIFICADO':
      return [59, 130, 246]; // Azul
    default:
      return [60, 60, 60]; // Gris
  }
}

export default { generarReportePDFSimple };
