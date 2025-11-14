'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Download, 
  FileText, 
  TrendingUp, 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Filter,
  Search,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { generarReportePDFSimple } from '@/components/reports/generadorJsPDF';
import { generarReporteExcel } from '@/components/reports/generadorExcel';
import api from '@/lib/api';

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
  tendenciaSemanal: Array<{
    fecha: string;
    presentes: number;
    ausentes: number;
    tardanzas: number;
  }>;
  porArea: Array<{
    area: string;
    presentes: number;
    ausentes: number;
    puntualidad: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [asistencias, setAsistencias] = useState<ReporteAsistencia[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasReporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    fechaFin: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    area: '',
    estado: '',
    docente: ''
  });

  // Verificar autorización
  useEffect(() => {
    if (!user || (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Cargar datos
  useEffect(() => {
    if (user && (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) === 'ADMIN') {
      // ✅ Cargar datos inmediatamente al montar el componente
      cargarReportes();
    }
  }, [user]); // ✅ Solo depende de 'user', no de 'filtros'

  // Funciones para filtros rápidos
  const aplicarFiltroRapido = (tipo: 'hoy' | 'semana' | 'mes' | 'limpiar') => {
    const hoy = new Date();
    const formatoFecha = (fecha: Date) => fecha.toISOString().split('T')[0];

    switch (tipo) {
      case 'hoy':
        setFiltros(prev => ({
          ...prev,
          fechaInicio: formatoFecha(hoy),
          fechaFin: formatoFecha(hoy)
        }));
        break;
      
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - 7);
        setFiltros(prev => ({
          ...prev,
          fechaInicio: formatoFecha(inicioSemana),
          fechaFin: formatoFecha(hoy)
        }));
        break;
      
      case 'mes':
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        setFiltros(prev => ({
          ...prev,
          fechaInicio: formatoFecha(inicioMes),
          fechaFin: formatoFecha(hoy)
        }));
        break;
      
      case 'limpiar':
        setFiltros({
          fechaInicio: '',
          fechaFin: '',
          area: '',
          estado: '',
          docente: ''
        });
        break;
    }
  };

  // Función personalizada para renderizar etiquetas del gráfico circular
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) => {
    // No mostrar etiquetas para valores de 0 o muy pequeños
    if (!percent || percent === 0 || percent < 0.05 || !value || value === 0) {
      return null;
    }
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    const percentage = (percent * 100).toFixed(0);
    
    // Solo mostrar si el porcentaje es mayor a 5%
    if (parseInt(percentage) < 5) {
      return null;
    }
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {`${percentage}%`}
      </text>
    );
  };

  const cargarReportes = async () => {
    try {
      setLoading(true);
      
      // Construir parámetros de consulta
      const params: any = {};
      if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio;
      if (filtros.fechaFin) params.fechaFin = filtros.fechaFin;
      if (filtros.area) params.area = filtros.area;
      if (filtros.estado) params.estado = filtros.estado.toLowerCase();
      if (filtros.docente) params.docente = filtros.docente;

      // Llamar a la API del backend usando axios configurado
      const response = await api.get('/admin/asistencias', { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener asistencias');
      }

      // Transformar datos de la API al formato del componente
      const asistenciasAPI = (response.data.data.asistencias || []).map((a: any) => ({
        id: a.id,
        docente: {
          nombres: a.docente?.nombres || '',
          apellidos: a.docente?.apellidos || '',
          area: a.docente?.area?.nombre || 'Sin área'
        },
        fecha: a.fecha,
        horaEntrada: a.horaEntrada || undefined,
        horaSalida: a.horaSalida || undefined,
        estado: a.estado.toUpperCase() as 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO',
        observaciones: a.observaciones || undefined
      }));

      setAsistencias(asistenciasAPI);

      // ✅ Validación defensiva para arrays
      if (!Array.isArray(asistenciasAPI)) {
        console.error('asistenciasAPI no es un array:', asistenciasAPI);
        return;
      }

      // Calcular estadísticas desde los datos reales
      const total = asistenciasAPI.length;
      const presentes = asistenciasAPI.filter((a: any) => a.estado === 'PRESENTE').length;
      const ausentes = asistenciasAPI.filter((a: any) => a.estado === 'AUSENTE').length;
      const tardanzas = asistenciasAPI.filter((a: any) => a.estado === 'TARDANZA').length;

      // Calcular tendencia semanal (últimos 7 días)
      const tendenciaSemanal = [];
      const hoy = new Date();
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = format(fecha, 'yyyy-MM-dd');
        
        const asistenciasDia = asistenciasAPI.filter((a: any) => a.fecha.startsWith(fechaStr));
        tendenciaSemanal.push({
          fecha: fechaStr,
          presentes: asistenciasDia.filter((a: any) => a.estado === 'PRESENTE').length,
          ausentes: asistenciasDia.filter((a: any) => a.estado === 'AUSENTE').length,
          tardanzas: asistenciasDia.filter((a: any) => a.estado === 'TARDANZA').length
        });
      }

      // Calcular estadísticas por área
      const areaMap = new Map();
      asistenciasAPI.forEach((a: any) => {
        const area = a.docente?.area;
        if (!areaMap.has(area)) {
          areaMap.set(area, { presentes: 0, ausentes: 0, total: 0 });
        }
        const stats = areaMap.get(area);
        stats.total++;
        if (a.estado === 'PRESENTE' || a.estado === 'TARDANZA') {
          stats.presentes++;
        } else {
          stats.ausentes++;
        }
      });

      const porArea = Array.from(areaMap.entries()).map(([area, stats]: [string, any]) => ({
        area,
        presentes: stats.total > 0 ? Math.round((stats.presentes / stats.total) * 100) : 0,
        ausentes: stats.total > 0 ? Math.round((stats.ausentes / stats.total) * 100) : 0,
        puntualidad: stats.total > 0 ? Math.round(((stats.presentes - (asistenciasAPI.filter((a: any) => a.docente?.area === area && a.estado === 'TARDANZA').length)) / stats.total) * 100) : 0
      }));

      const estadisticasCalculadas: EstadisticasReporte = {
        totalAsistencias: total,
        presentesPromedio: total > 0 ? Math.round((presentes / total) * 100) : 0,
        puntualidadPromedio: total > 0 ? Math.round(((presentes / (presentes + tardanzas || 1)) * 100)) : 0,
        ausentismoPromedio: total > 0 ? Math.round((ausentes / total) * 100) : 0,
        tendenciaSemanal,
        porArea
      };

      setEstadisticas(estadisticasCalculadas);
      
      toast.success(`${total} registros cargados exitosamente`);
      
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = async (formato: 'pdf' | 'excel') => {
    try {
      // Preparar estadísticas (común para ambos formatos)
      const estadisticasReporte = estadisticas ? {
        totalAsistencias: estadisticas.totalAsistencias,
        presentesPromedio: estadisticas.presentesPromedio,
        puntualidadPromedio: estadisticas.puntualidadPromedio,
        ausentismoPromedio: estadisticas.ausentismoPromedio,
        fechaInicio: filtros.fechaInicio ? new Date(filtros.fechaInicio) : new Date(),
        fechaFin: filtros.fechaFin ? new Date(filtros.fechaFin) : new Date()
      } : {
        totalAsistencias: 150,
        presentesPromedio: 85.5,
        puntualidadPromedio: 92.3,
        ausentismoPromedio: 14.5,
        fechaInicio: new Date(),
        fechaFin: new Date()
      };

      // Preparar asistencias (común para ambos formatos)
      const asistenciasReporte = asistencias.map(asistencia => ({
        id: asistencia.id,
        docente: {
          nombre: asistencia.docente?.nombres,
          apellido: asistencia.docente?.apellidos
        },
        fecha: asistencia.fecha,
        estado: asistencia.estado as 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO'
      }));

      if (formato === 'pdf') {
        toast.success('Generando reporte PDF...');
        
        // Generar PDF con jsPDF
        await generarReportePDFSimple(estadisticasReporte, asistenciasReporte);
        toast.success('Reporte PDF descargado exitosamente');
        
      } else if (formato === 'excel') {
        toast.success('Generando reporte Excel...');
        
        // Generar Excel con ExcelJS
        await generarReporteExcel(estadisticasReporte, asistenciasReporte);
        toast.success('Reporte Excel descargado exitosamente');
      }
      
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      toast.error(`Error al generar el reporte ${formato.toUpperCase()}`);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PRESENTE':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Presente</Badge>;
      case 'AUSENTE':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Ausente</Badge>;
      case 'TARDANZA':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Tardanza</Badge>;
      case 'JUSTIFICADO':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Justificado</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.15, // ✅ Reducido de 0.2 a 0.15
        staggerChildren: 0.03 // ✅ Reducido de 0.05 a 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { y: 5, opacity: 0 }, // ✅ Reducido movimiento de 10 a 5
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.15 } // ✅ Reducido de 0.2 a 0.15
    }
  };

  if (!user || (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) !== 'ADMIN') {
    return null;
  }

  return (
    <motion.div 
      className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes y Análisis</h1>
            <p className="text-gray-600">Análisis detallado de asistencias y estadísticas</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => cargarReportes()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportarReporte('excel')} 
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button 
              onClick={() => exportarReporte('pdf')} 
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <BackToAdminButton />
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros Rápidos */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Filtros Rápidos</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filtros.fechaInicio === format(new Date(), 'yyyy-MM-dd') && filtros.fechaFin === format(new Date(), 'yyyy-MM-dd') ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const hoy = format(new Date(), 'yyyy-MM-dd');
                    setFiltros({ ...filtros, fechaInicio: hoy, fechaFin: hoy });
                    // ✅ Cargar datos automáticamente con filtro rápido
                    setTimeout(() => cargarReportes(), 50);
                  }}
                >
                  Hoy
                </Button>
                <Button
                  variant={filtros.fechaInicio === format(subDays(new Date(), 7), 'yyyy-MM-dd') ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const hace7dias = format(subDays(new Date(), 7), 'yyyy-MM-dd');
                    const hoy = format(new Date(), 'yyyy-MM-dd');
                    setFiltros({ ...filtros, fechaInicio: hace7dias, fechaFin: hoy });
                    // ✅ Cargar datos automáticamente con filtro rápido
                    setTimeout(() => cargarReportes(), 50);
                  }}
                >
                  Última Semana
                </Button>
                <Button
                  variant={filtros.fechaInicio === format(startOfMonth(new Date()), 'yyyy-MM-dd') ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFiltros({ 
                      ...filtros, 
                      fechaInicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                      fechaFin: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                    });
                    // ✅ Cargar datos automáticamente con filtro rápido
                    setTimeout(() => cargarReportes(), 50);
                  }}
                >
                  Este Mes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltros({
                      fechaInicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                      fechaFin: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
                      area: '',
                      estado: '',
                      docente: ''
                    });
                    // ✅ Cargar datos automáticamente al limpiar
                    setTimeout(() => cargarReportes(), 50);
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>

            {/* Filtros Detallados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="docente">Docente</Label>
                <Input
                  id="docente"
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={filtros.docente}
                  onChange={(e) => setFiltros({ ...filtros, docente: e.target.value })}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="area">Área</Label>
                <Select value={filtros.area} onValueChange={(value) => setFiltros({ ...filtros, area: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las áreas</SelectItem>
                    <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                    <SelectItem value="Comunicación">Comunicación</SelectItem>
                    <SelectItem value="Ciencias">Ciencias</SelectItem>
                    <SelectItem value="Historia">Historia</SelectItem>
                    <SelectItem value="Educación Física">Educación Física</SelectItem>
                    <SelectItem value="Arte">Arte</SelectItem>
                    <SelectItem value="Inglés">Inglés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={filtros.estado} onValueChange={(value) => setFiltros({ ...filtros, estado: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    <SelectItem value="PRESENTE">✅ Presente</SelectItem>
                    <SelectItem value="AUSENTE">❌ Ausente</SelectItem>
                    <SelectItem value="TARDANZA">⏰ Tardanza</SelectItem>
                    <SelectItem value="JUSTIFICADO">📋 Justificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contador de Resultados */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Mostrando {asistencias.length} registros
                  {(filtros.area || filtros.estado || filtros.docente) && (
                    <span className="ml-1">
                      ({filtros.area && `Área: ${filtros.area}`}
                      {filtros.area && filtros.estado && ', '}
                      {filtros.estado && `Estado: ${filtros.estado}`}
                      {(filtros.area || filtros.estado) && filtros.docente && ', '}
                      {filtros.docente && `Docente: "${filtros.docente}"`})
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-medium">
                    {format(new Date(filtros.fechaInicio), 'dd/MM/yyyy', { locale: es })} - {format(new Date(filtros.fechaFin), 'dd/MM/yyyy', { locale: es })}
                  </span>
                  <Button 
                    onClick={() => cargarReportes()} 
                    size="sm"
                    className="ml-2"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Estadísticas Generales */}
      {estadisticas && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Asistencias</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.totalAsistencias}</p>
                  <p className="text-xs text-blue-600 mt-1">Registros del período</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Asistencia Promedio</p>
                  <p className="text-3xl font-bold text-green-600">{estadisticas.presentesPromedio}%</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Tendencia positiva
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Puntualidad</p>
                  <p className="text-3xl font-bold text-purple-600">{estadisticas.puntualidadPromedio}%</p>
                  <p className="text-xs text-purple-600 mt-1">Llegadas a tiempo</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ausentismo</p>
                  <p className="text-3xl font-bold text-red-600">{estadisticas.ausentismoPromedio}%</p>
                  <p className="text-xs text-red-600 mt-1">Promedio mensual</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <UserX className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Gráficos */}
      {estadisticas && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Distribución de Estados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                Distribución Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Presentes', value: estadisticas.presentesPromedio, fill: '#10B981' },
                      { name: 'Ausentes', value: estadisticas.ausentismoPromedio, fill: '#EF4444' },
                      { name: 'Tardanzas', value: 100 - estadisticas.presentesPromedio - estadisticas.ausentismoPromedio, fill: '#F59E0B' }
                    ].filter(item => item.value > 0)} // Filtrar valores de 0
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {[
                      { name: 'Presentes', value: estadisticas.presentesPromedio, fill: '#10B981' },
                      { name: 'Ausentes', value: estadisticas.ausentismoPromedio, fill: '#EF4444' },
                      { name: 'Tardanzas', value: 100 - estadisticas.presentesPromedio - estadisticas.ausentismoPromedio, fill: '#F59E0B' }
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, '']} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value: string) => value}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              {/* Leyenda personalizada adicional */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Presentes: {estadisticas.presentesPromedio.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Ausentes: {estadisticas.ausentismoPromedio.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Tardanzas: {(100 - estadisticas.presentesPromedio - estadisticas.ausentismoPromedio).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tendencia Semanal */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Tendencia Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={estadisticas.tendenciaSemanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="fecha" 
                    tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: es })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: es })}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="presentes" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Presentes"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tardanzas" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Tardanzas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ausentes" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Ausentes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Asistencia por Área */}
          <Card>
            <CardHeader>
              <CardTitle>Asistencia por Área</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estadisticas.porArea}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="presentes" fill="#10B981" name="% Presentes" />
                  <Bar dataKey="puntualidad" fill="#3B82F6" name="% Puntualidad" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabla de Asistencias Detallada */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Registro Detallado de Asistencias</span>
              <Badge variant="secondary">
                {asistencias.length} registros
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando reportes...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Docente</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora Entrada</TableHead>
                    <TableHead>Hora Salida</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asistencias.map((asistencia) => (
                    <TableRow key={asistencia.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">
                          {asistencia.docente?.nombres} {asistencia.docente?.apellidos}
                        </div>
                      </TableCell>
                      <TableCell>{asistencia.docente?.area}</TableCell>
                      <TableCell>
                        {format(new Date(asistencia.fecha), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {asistencia.horaEntrada 
                          ? format(new Date(`2025-01-01 ${asistencia.horaEntrada}`), 'HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {asistencia.horaSalida 
                          ? format(new Date(`2025-01-01 ${asistencia.horaSalida}`), 'HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getEstadoBadge(asistencia.estado)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {asistencia.observaciones || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!loading && asistencias.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron asistencias con los filtros aplicados.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
