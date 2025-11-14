'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { obtenerAsistencias, exportarReporteAsistencias, AsistenciaDetalle, EstadisticasAsistencia, FiltrosAsistencia, RespuestaAsistencias } from '@/services/asistencia-api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';





export default function AsistenciasPage() {
  const [asistencias, setAsistencias] = useState<AsistenciaDetalle[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAsistencia>({
    total: 0,
    presentes: 0,
    ausentes: 0,
    tardanzas: 0,
    justificados: 0,
    porcentajeAsistencia: 0
  });
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('hoy');
  const [busqueda, setBusqueda] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de asistencias
  const cargarAsistencias = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filtros: FiltrosAsistencia = {
        fecha: filtroFecha,
        estado: filtroEstado as any,
      };

      const respuesta = await obtenerAsistencias(filtros);
      setAsistencias(respuesta.asistencias);
      setEstadisticas(respuesta.estadisticas);
    } catch (error: any) {
      console.error('Error cargando asistencias:', error);
      setError(error.message || 'Error al cargar las asistencias');
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    cargarAsistencias();
  }, [filtroFecha, filtroEstado]);

  // Función para refrescar datos
  const handleRefresh = () => {
    cargarAsistencias();
  };

  // Función para exportar reportes
  const handleExportar = async (tipo: 'pdf' | 'excel') => {
    try {
      setIsLoading(true);
      const filtros: FiltrosAsistencia = {
        fecha: filtroFecha,
        estado: filtroEstado as any,
      };
      
      await exportarReporteAsistencias(tipo, filtros);
    } catch (error: any) {
      console.error('Error exportando reporte:', error);
      setError('Error al exportar el reporte');
    } finally {
      setIsLoading(false);
    }
  };

  // Estadísticas calculadas (usar las del servidor)
  const estadisticasHoy = estadisticas;

  // Filtrar asistencias (solo por búsqueda ya que el backend maneja estado y fecha)
  const asistenciasFiltradas = Array.isArray(asistencias) ? asistencias.filter(asistencia => {
    if (busqueda === '') return true;
    
    const busquedaLower = busqueda.toLowerCase();
    return (
      asistencia.docente.nombres.toLowerCase().includes(busquedaLower) ||
      asistencia.docente.apellidos.toLowerCase().includes(busquedaLower) ||
      asistencia.docente.codigoDocente.toLowerCase().includes(busquedaLower) ||
      asistencia.docente.area.nombre.toLowerCase().includes(busquedaLower)
    );
  }) : [];

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'presente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tardanza':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ausente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'justificado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'presente':
        return <CheckCircle className="h-4 w-4" />;
      case 'tardanza':
        return <Clock className="h-4 w-4" />;
      case 'ausente':
        return <XCircle className="h-4 w-4" />;
      case 'justificado':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              Gestión de Asistencias
            </h1>
            <p className="text-gray-600 mt-1">
              Control y seguimiento de asistencia de docentes
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportar('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportar('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas del día */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Docentes</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticasHoy.total}</p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Presentes</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticasHoy.presentes}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ausentes</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticasHoy.ausentes}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tardanzas</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticasHoy.tardanzas}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">% Asistencia</p>
                  <p className="text-2xl font-bold text-blue-600">{estadisticasHoy.porcentajeAsistencia}%</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Buscar docente
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Nombre, apellido o código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Estado
                </label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="presente">Presentes</SelectItem>
                    <SelectItem value="ausente">Ausentes</SelectItem>
                    <SelectItem value="tardanza">Tardanzas</SelectItem>
                    <SelectItem value="justificado">Justificados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Fecha
                </label>
                <Select value={filtroFecha} onValueChange={setFiltroFecha}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="ayer">Ayer</SelectItem>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="mes">Este mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de asistencias */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Asistencias del Día ({asistenciasFiltradas.length} registros)</CardTitle>
              <Badge variant="outline" className="text-sm">
                Actualizado: {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Docente</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Hora Entrada</TableHead>
                    <TableHead>Hora Salida</TableHead>
                    <TableHead>Tardanza</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>GPS</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Cargando asistencias...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : asistenciasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <User className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500">No se encontraron asistencias</p>
                          {busqueda && (
                            <p className="text-sm text-gray-400">
                              Intenta con otros términos de búsqueda
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    asistenciasFiltradas.map((asistencia) => (
                    <TableRow key={asistencia.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {asistencia.docente.nombres} {asistencia.docente.apellidos}
                          </p>
                          <p className="text-sm text-gray-600">{asistencia.docente.codigoDocente}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{asistencia.docente.area.nombre}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getBadgeColor(asistencia.estado)}>
                          <div className="flex items-center gap-1">
                            {getEstadoIcon(asistencia.estado)}
                            <span className="capitalize">{asistencia.estado}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asistencia.horaEntrada ? (
                          <span className="text-sm font-mono">
                            {asistencia.horaEntrada.substring(0, 5)}
                          </span>
                        ) : (
                          <span className="text-gray-400">--:--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asistencia.horaSalida ? (
                          <span className="text-sm font-mono">
                            {asistencia.horaSalida.substring(0, 5)}
                          </span>
                        ) : (
                          <span className="text-gray-400">--:--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asistencia.tardanzaMinutos ? (
                          <span className="text-yellow-600 font-medium">
                            +{asistencia.tardanzaMinutos} min
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asistencia.ubicacionEntrada && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{asistencia.ubicacionEntrada}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            asistencia.gpsValidoEntrada ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs text-gray-600">
                            {asistencia.gpsValidoEntrada ? 'Válido' : 'Inválido'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MapPin className="h-4 w-4 mr-2" />
                              Ver en Mapa
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Justificar Ausencia
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}