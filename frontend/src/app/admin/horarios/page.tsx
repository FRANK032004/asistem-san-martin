'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  BookOpen,
  BarChart3
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import Modal from '@/components/ui/modal-simple';
import { 
  obtenerHorarios as obtenerHorariosAPI, 
  crearHorario as crearHorarioAPI,
  eliminarHorario as eliminarHorarioAPI,
  HorarioBase,
  EstadisticasHorarios,
  FiltrosHorarios,
  DatosHorario,
  formatearNombreDocente,
  formatearCodigoDocente,
  obtenerNombreDia,
  formatearRangoHoras,
  calcularDuracionHoras,
  obtenerColorEstado,
  obtenerTextoEstado,
  obtenerOpcionesDias,
  obtenerTiposClase
} from '@/services/horario-api.service';

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<HorarioBase[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasHorarios>({
    total: 0,
    activos: 0,
    inactivos: 0,
    totalHorasSemana: 0,
    promedioHorasSemana: 0,
    distribuciones: []
  });
  
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroDia, setFiltroDia] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [modoDialog, setModoDialog] = useState<'crear' | 'editar'>('crear');
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>('');
  
  const [formData, setFormData] = useState<DatosHorario>({
    docenteId: '',
    areaId: 1,
    diaSemana: 1,
    horaInicio: '08:00',
    horaFin: '10:00',
    tipoClase: 'TEORICA',
    horasSemana: 0,
    activo: true
  });

  // Cargar horarios al montar el componente
  useEffect(() => {
    cargarHorarios();
  }, []);

  // Establecer fecha de actualización solo en el cliente
  useEffect(() => {
    setUltimaActualizacion(new Date().toLocaleString('es-ES'));
  }, [horarios]);

  // Filtrar horarios
  const horariosFiltrados = horarios.filter(horario => {
    const cumpleBusqueda = busqueda === '' || 
      formatearNombreDocente(horario).toLowerCase().includes(busqueda.toLowerCase()) ||
      (horario.area?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (horario.tipoClase || '').toLowerCase().includes(busqueda.toLowerCase());
    
    const cumpleEstado = filtroEstado === 'todos' || 
      (filtroEstado === 'activo' && horario.activo) ||
      (filtroEstado === 'inactivo' && !horario.activo);
    
    const cumpleDia = filtroDia === 'todos' || 
      horario.diaSemana.toString() === filtroDia;

    return cumpleBusqueda && cumpleEstado && cumpleDia;
  });

  const cargarHorarios = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filtros: FiltrosHorarios = {
        activo: filtroEstado === 'activo' ? true : filtroEstado === 'inactivo' ? false : undefined,
        diaSemana: filtroDia === 'todos' ? undefined : parseInt(filtroDia)
      };
      
      const respuesta = await obtenerHorariosAPI(filtros);
      setHorarios(respuesta.data.horarios);
      setEstadisticas(respuesta.data.estadisticas);
    } catch (error: any) {
      console.error('Error cargando horarios:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNuevoHorario = () => {
    setFormData({
      docenteId: '',
      areaId: 1,
      diaSemana: 1,
      horaInicio: '08:00',
      horaFin: '10:00',
      tipoClase: 'TEORICA',
      horasSemana: 0,
      activo: true
    });
    setModoDialog('crear');
    setShowDialog(true);
  };

  const handleGuardar = async () => {
    if (!formData.docenteId) {
      setError('Debe seleccionar un docente');
      return;
    }

    // Calcular horas semanales automáticamente
    const horasCalculadas = calcularDuracionHoras(formData.horaInicio, formData.horaFin);
    const datosCompletos = {
      ...formData,
      horasSemana: horasCalculadas
    };

    setIsLoading(true);
    setError(null);

    try {
      await crearHorarioAPI(datosCompletos);
      setShowDialog(false);
      cargarHorarios();
    } catch (error: any) {
      console.error('Error guardando horario:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este horario?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await eliminarHorarioAPI(id);
      cargarHorarios();
    } catch (error: any) {
      console.error('Error eliminando horario:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeEstado = (activo: boolean) => {
    return (
      <Badge 
        variant={obtenerColorEstado(activo) as "default" | "secondary" | "destructive" | "outline"} 
        className={activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
      >
        {obtenerTextoEstado(activo)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              Gestión de Horarios Académicos
            </h1>
            <p className="text-gray-600 mt-2">
              Control y administración de horarios de clases y actividades académicas
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={cargarHorarios}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={handleNuevoHorario}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Horario
            </Button>
            <Link href="/admin">
              <Button variant="outline">
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Horarios</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.activos}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactivos</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.inactivos}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Horas Semana</p>
                  <p className="text-2xl font-bold text-orange-600">{Math.round(estadisticas.totalHorasSemana)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio Horas</p>
                  <p className="text-2xl font-bold text-purple-600">{estadisticas.promedioHorasSemana.toFixed(1)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="busqueda" className="text-sm font-medium text-gray-700 mb-2 block">
                  Buscar horario
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="busqueda"
                    placeholder="Docente, área o tipo de clase..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full lg:w-48">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Estado</Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activos</SelectItem>
                    <SelectItem value="inactivo">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full lg:w-48">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Día</Label>
                <Select value={filtroDia} onValueChange={setFiltroDia}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los días</SelectItem>
                    {obtenerOpcionesDias().map(dia => (
                      <SelectItem key={dia.value} value={dia.value.toString()}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setBusqueda('');
                  setFiltroEstado('todos');
                  setFiltroDia('todos');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Horarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Horarios Registrados ({horariosFiltrados.length} {horariosFiltrados.length === 1 ? 'registro' : 'registros'})</span>
              {ultimaActualizacion && (
                <span className="text-sm font-normal text-gray-500">
                  Actualizado: {ultimaActualizacion}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Docente</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Cargando horarios...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : horariosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Clock className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500">No se encontraron horarios</p>
                          {busqueda && (
                            <p className="text-sm text-gray-400">
                              Intenta con otros términos de búsqueda
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    horariosFiltrados.map((horario) => (
                      <TableRow key={horario.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatearNombreDocente(horario)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {horario.docente?.codigoDocente || 'Sin código'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{horario.area?.nombre || 'Sin área'}</p>
                            <p className="text-sm text-gray-600">{horario.area?.descripcion || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {obtenerNombreDia(horario.diaSemana)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {formatearRangoHoras(horario.horaInicio, horario.horaFin)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {horario.tipoClase || 'Sin especificar'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{horario.horasSemana}h</p>
                            <p className="text-gray-500">semanales</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getBadgeEstado(horario.activo)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => console.log('Ver detalles:', horario)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => console.log('Editar:', horario)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEliminar(horario.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
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

        {/* Modal para Crear/Editar */}
        <Modal
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          title={modoDialog === 'crear' ? 'Nuevo Horario Académico' : 'Editar Horario Académico'}
          description={modoDialog === 'crear' 
            ? 'Configura un nuevo horario de clases o actividades académicas.'
            : 'Modifica los datos del horario seleccionado.'
          }
          size="md"
          footer={
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                {modoDialog === 'crear' ? 'Crear Horario' : 'Guardar Cambios'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="docenteId" className="text-right">Docente ID</Label>
              <Input
                id="docenteId"
                value={formData.docenteId}
                onChange={(e) => setFormData({...formData, docenteId: e.target.value})}
                className="col-span-3"
                placeholder="UUID del docente"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="areaId" className="text-right">Área ID</Label>
              <Input
                id="areaId"
                type="number"
                value={formData.areaId}
                onChange={(e) => setFormData({...formData, areaId: parseInt(e.target.value) || 1})}
                className="col-span-3"
                placeholder="ID del área"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="diaSemana" className="text-right">Día</Label>
              <Select 
                value={formData.diaSemana.toString()} 
                onValueChange={(value) => setFormData({...formData, diaSemana: parseInt(value)})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {obtenerOpcionesDias().map(dia => (
                    <SelectItem key={dia.value} value={dia.value.toString()}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="horaInicio" className="text-right">Hora Inicio</Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="horaFin" className="text-right">Hora Fin</Label>
              <Input
                id="horaFin"
                type="time"
                value={formData.horaFin}
                onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipoClase" className="text-right">Tipo</Label>
              <Select 
                value={formData.tipoClase || 'TEORICA'} 
                onValueChange={(value) => setFormData({...formData, tipoClase: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {obtenerTiposClase().map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activo" className="text-right">Estado</Label>
              <Select 
                value={formData.activo ? 'true' : 'false'} 
                onValueChange={(value) => setFormData({...formData, activo: value === 'true'})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.horaInicio && formData.horaFin && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Duración</Label>
                <div className="col-span-3">
                  <p className="text-sm text-gray-600">
                    {calcularDuracionHoras(formData.horaInicio, formData.horaFin).toFixed(2)} horas
                  </p>
                </div>
              </div>
            )}
          </div>
        </Modal>

      </div>
    </div>
  );
}
