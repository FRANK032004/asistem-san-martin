import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font, 
  Image 
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar fuentes (opcional)
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf'
});

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Roboto'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#3B82F6',
    paddingBottom: 10
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10
  },
  dateInfo: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 5
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  metricCard: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
    width: '22%',
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center'
  },
  table: {
    marginTop: 10
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 5
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 5
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151'
  },
  tableCell: {
    fontSize: 9,
    color: '#4B5563'
  },
  col1: { width: '20%' },
  col2: { width: '20%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '15%' },
  col6: { width: '15%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 8,
    color: '#6B7280'
  },
  // Colores para diferentes métricas
  blueCard: {
    borderLeftColor: '#3B82F6',
    borderLeftWidth: 4,
    borderLeftStyle: 'solid'
  },
  greenCard: {
    borderLeftColor: '#10B981',
    borderLeftWidth: 4,
    borderLeftStyle: 'solid'
  },
  purpleCard: {
    borderLeftColor: '#8B5CF6',
    borderLeftWidth: 4,
    borderLeftStyle: 'solid'
  },
  orangeCard: {
    borderLeftColor: '#F59E0B',
    borderLeftWidth: 4,
    borderLeftStyle: 'solid'
  },
  // Estados de asistencia
  presente: { color: '#10B981' },
  ausente: { color: '#EF4444' },
  tardanza: { color: '#F59E0B' },
  justificado: { color: '#3B82F6' }
});

// Interfaces para los datos
interface ReporteAsistencia {
  id: string;
  docente: {
    nombres: string;
    apellidos: string;
    area: string;
  };
  fecha: string;
  horaEntrada?: string;
  horaSalida?: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO';
  observaciones?: string;
}

interface EstadisticasReporte {
  totalAsistencias: number;
  presentesPromedio: number;
  puntualidadPromedio: number;
  ausentismoPromedio: number;
  fechaInicio: Date;
  fechaFin: Date;
}

interface ReportePDFProps {
  estadisticas: EstadisticasReporte;
  asistencias: ReporteAsistencia[];
  logoUrl?: string;
}

export const ReportePDF: React.FC<ReportePDFProps> = ({ 
  estadisticas, 
  asistencias, 
  logoUrl 
}) => {
  const fechaGeneracion = new Date();
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoUrl && (
            <Image style={styles.logo} src={logoUrl} />
          )}
          <Text style={styles.title}>INSTITUTO SAN MARTÍN</Text>
          <Text style={styles.subtitle}>Reporte de Asistencias - Análisis Detallado</Text>
          <Text style={styles.dateInfo}>
            Período: {format(estadisticas.fechaInicio, 'dd/MM/yyyy', { locale: es })} - {format(estadisticas.fechaFin, 'dd/MM/yyyy', { locale: es })}
          </Text>
          <Text style={styles.dateInfo}>
            Generado el: {format(fechaGeneracion, "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
          </Text>
        </View>

        {/* Resumen Ejecutivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 RESUMEN EJECUTIVO</Text>
          
          <View style={styles.metricsContainer}>
            {/* Total Asistencias */}
            <View style={[styles.metricCard, styles.blueCard]}>
              <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
                {estadisticas.totalAsistencias}
              </Text>
              <Text style={styles.metricLabel}>Total Asistencias</Text>
            </View>

            {/* Asistencia Promedio */}
            <View style={[styles.metricCard, styles.greenCard]}>
              <Text style={[styles.metricValue, { color: '#10B981' }]}>
                {estadisticas.presentesPromedio}%
              </Text>
              <Text style={styles.metricLabel}>Asistencia Promedio</Text>
            </View>

            {/* Puntualidad */}
            <View style={[styles.metricCard, styles.purpleCard]}>
              <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                {estadisticas.puntualidadPromedio}%
              </Text>
              <Text style={styles.metricLabel}>Puntualidad</Text>
            </View>

            {/* Ausentismo */}
            <View style={[styles.metricCard, styles.orangeCard]}>
              <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
                {estadisticas.ausentismoPromedio}%
              </Text>
              <Text style={styles.metricLabel}>Ausentismo</Text>
            </View>
          </View>
        </View>

        {/* Detalle de Asistencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 REGISTRO DETALLADO DE ASISTENCIAS</Text>
          
          <View style={styles.table}>
            {/* Header de tabla */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>Docente</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Área</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>Fecha</Text>
              <Text style={[styles.tableHeaderText, styles.col4]}>Entrada</Text>
              <Text style={[styles.tableHeaderText, styles.col5]}>Salida</Text>
              <Text style={[styles.tableHeaderText, styles.col6]}>Estado</Text>
            </View>

            {/* Filas de datos */}
            {asistencias.slice(0, 20).map((asistencia, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>
                  {asistencia.docente.nombres} {asistencia.docente.apellidos}
                </Text>
                <Text style={[styles.tableCell, styles.col2]}>
                  {asistencia.docente.area}
                </Text>
                <Text style={[styles.tableCell, styles.col3]}>
                  {format(new Date(asistencia.fecha), 'dd/MM/yy', { locale: es })}
                </Text>
                <Text style={[styles.tableCell, styles.col4]}>
                  {asistencia.horaEntrada || '-'}
                </Text>
                <Text style={[styles.tableCell, styles.col5]}>
                  {asistencia.horaSalida || '-'}
                </Text>
                <Text style={[
                  styles.tableCell, 
                  styles.col6,
                  styles[asistencia.estado.toLowerCase() as keyof typeof styles] || {}
                ]}>
                  {asistencia.estado}
                </Text>
              </View>
            ))}
          </View>

          {asistencias.length > 20 && (
            <Text style={[styles.tableCell, { marginTop: 10, textAlign: 'center' }]}>
              ... y {asistencias.length - 20} registros adicionales
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Instituto San Martín - Sistema de Control de Asistencias
          </Text>
          <Text style={styles.footerText}>
            Página 1 de 1
          </Text>
        </View>
      </Page>
    </Document>
  );
};
