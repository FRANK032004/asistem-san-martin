'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp,
  Download,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Award,
  Target
} from 'lucide-react';
import { docentePanelService } from '@/services/docente-panel.service';
import { toast } from 'sonner';

interface AsistenciaHistorial {
  id: string;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  estado: string;
  tardanzaMinutos: number;
  horasTrabajadas: number | null;
  ubicacionEntrada: { nombre: string } | null;
  observaciones: string | null;
}

export default function HistorialAsistenciasPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [historial, setHistorial] = useState<AsistenciaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const registrosPorPagina = 20;
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalDias: 0,
    presente: 0,
    tardanzas: 0,
    ausente: 0,
    promedioPuntualidad: 0,
    rachaActual: 0
  });

  useEffect(() => {
    if (!user || user.rol?.nombre?.toLowerCase() !== 'docente') {
      router.push('/login');
      return;
    }
    cargarHistorial();
  }, [user, router, paginaActual, estadoFiltro, fechaInicio, fechaFin]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el servicio API correcto con la URL de Railway
      const response = await docentePanelService.obtenerHistorialAsistencias({
        page: paginaActual,
        limit: registrosPorPagina,
        ...(estadoFiltro !== 'TODOS' && { estado: estadoFiltro }),
        ...(fechaInicio && { fechaInicio }),
        ...(fechaFin && { fechaFin })
      });
      
      if (response.ok) {
        setHistorial(response.data || []);
        setTotalPaginas(Math.ceil((response.total || 0) / registrosPorPagina));
        
        // Calcular estadísticas
        calcularEstadisticas(response.data || []);
      } else {
        throw new Error(response.error?.message || 'Error al cargar historial');
      }
      
    } catch (error: any) {
      console.error('❌ Error:', error);
      setError(error.message);
      toast.error('Error al cargar historial', {
        description: error.message,
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };
  
  const calcularEstadisticas = (datos: AsistenciaHistorial[]) => {
    const stats = {
      totalDias: datos.length,
      presente: datos.filter(a => a.estado === 'PRESENTE').length,
      tardanzas: datos.filter(a => a.estado === 'TARDANZA').length,
      ausente: datos.filter(a => a.estado === 'AUSENTE' || a.estado === 'FALTA').length,
      promedioPuntualidad: 0,
      rachaActual: 0
    };
    
    if (stats.totalDias > 0) {
      stats.promedioPuntualidad = Math.round((stats.presente / stats.totalDias) * 100);
    }
    
    // Calcular racha actual de puntualidad
    let racha = 0;
    for (const asistencia of datos) {
      if (asistencia.estado === 'PRESENTE' && asistencia.tardanzaMinutos === 0) {
        racha++;
      } else {
        break;
      }
    }
    stats.rachaActual = racha;
    
    setEstadisticas(stats);
  };
  
  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setEstadoFiltro('TODOS');
    setPaginaActual(1);
  };
  
  const exportarCSV = () => {
    toast.info('Exportando a CSV', {
      description: 'Función en desarrollo',
      duration: 3000
    });
  };
  
  const exportarPDF = () => {
    toast.info('Exportando a PDF', {
      description: 'Función en desarrollo',
      duration: 3000
    });
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PRESENTE':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Presente
          </Badge>
        );
      case 'AUSENTE':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Ausente
          </Badge>
        );
      case 'JUSTIFICADO':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Justificado
          </Badge>
        );
      case 'TARDANZA':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Tardanza
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={cargarHistorial}>Reintentar</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/docente')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Historial Completo</h1>
                <p className="text-sm text-gray-500">Todas tus asistencias registradas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
              <Button variant="outline" size="sm" onClick={exportarCSV}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportarPDF}>
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Días</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalDias}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Presente</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.presente}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tardanzas</p>
                <p className="text-2xl font-bold text-orange-600">{estadisticas.tardanzas}</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Puntualidad</p>
                <p className="text-2xl font-bold text-purple-600">{estadisticas.promedioPuntualidad}%</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Racha Actual</p>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.rachaActual}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Panel de Filtros */}
        {mostrarFiltros && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Búsqueda</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                  <SelectTrigger id="estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="PRESENTE">Presente</SelectItem>
                    <SelectItem value="TARDANZA">Tardanza</SelectItem>
                    <SelectItem value="AUSENTE">Ausente</SelectItem>
                    <SelectItem value="JUSTIFICADO">Justificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={limpiarFiltros} className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tabla de Historial */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tardanza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historial.length > 0 ? (
                  historial.map((asistencia) => (
                    <tr key={asistencia.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatearFecha(asistencia.fecha)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {asistencia.horaEntrada ? formatearHora(asistencia.horaEntrada) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {asistencia.horaSalida ? formatearHora(asistencia.horaSalida) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(asistencia.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {asistencia.tardanzaMinutos > 0 ? (
                          <span className="text-orange-600 font-medium">
                            {asistencia.tardanzaMinutos} min
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {asistencia.horasTrabajadas ? `${asistencia.horasTrabajadas}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {asistencia.ubicacionEntrada?.nombre || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No hay registros de asistencia</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Los registros aparecerán cuando marques asistencia
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Página <span className="font-medium">{paginaActual}</span> de{' '}
                <span className="font-medium">{totalPaginas}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
