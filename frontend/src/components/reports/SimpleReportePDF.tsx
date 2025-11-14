import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet 
} from '@react-pdf/renderer';

// Estilos simplificados sin bordes problemáticos
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20
  },
  text: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 10
  }
});

interface SimpleReportePDFProps {
  datos: {
    periodo: string;
    totalPersonas: number;
  };
}

export const SimpleReportePDF: React.FC<SimpleReportePDFProps> = ({ datos }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Reporte de Asistencias</Text>
          <Text style={styles.text}>Período: {datos.periodo}</Text>
          <Text style={styles.text}>Total de Personas: {datos.totalPersonas}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default SimpleReportePDF;
