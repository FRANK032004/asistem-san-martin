'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Power,
  UserCheck
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
import { Textarea } from '@/components/ui/textarea';
import Modal from '@/components/ui/modal-simple';
import { 
  obtenerAreas as obtenerAreasAPI, 
  crearArea as crearAreaAPI,
  actualizarArea as actualizarAreaAPI,
  eliminarArea as eliminarAreaAPI,
  cambiarEstadoArea as cambiarEstadoAreaAPI,
  Area,
  EstadisticasAreas,
  FiltrosAreas,
  DatosArea,
  formatearNombreCoordinador,
  obtenerColorEstado,
  obtenerTextoEstado,
  obtenerColoresPredefinidos,
  generarCodigoSugerido,
  validarDatosArea
} from '@/services/area-api.service';

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAreas>({
    total: 0,
    activas: 0,
    inactivas: 0,
    conCoordinador: 0,
    sinCoordinador: 0,
    totalDocentes: 0,
    totalHorarios: 0,
    distribucion: []
  });
  
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [modoDialog, setModoDialog] = useState<'crear' | 'editar'>('crear');
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);
  
  const [formData, setFormData] = useState<DatosArea>({
    nombre: '',
    descripcion: '',
    codigo: '',
    colorHex: '#3B82F6',
    coordinadorId: '',
    activo: true
  });

  // Cargar áreas al montar el componente
  useEffect(() => {
    cargarAreas();
  }, []);

  // Filtrar áreas
  const areasFiltradas = areas.filter(area => {
    const cumpleBusqueda = busqueda === '' || 
      area.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (area.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (area.codigo || '').toLowerCase().includes(busqueda.toLowerCase());
    
    const cumpleEstado = filtroEstado === 'todos' || 
      (filtroEstado === 'activo' && area.activo) ||
      (filtroEstado === 'inactivo' && !area.activo);

    return cumpleBusqueda && cumpleEstado;
  });

  const cargarAreas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filtros: FiltrosAreas = {
        activo: filtroEstado === 'activo' ? true : filtroEstado === 'inactivo' ? false : undefined
      };
      
      const respuesta = await obtenerAreasAPI(filtros);
      setAreas(respuesta.data.areas);
      setEstadisticas(respuesta.data.estadisticas);
    } catch (error: any) {
      console.error('Error cargando áreas:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNuevaArea = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      codigo: '',
      colorHex: '#3B82F6',
      coordinadorId: '',
      activo: true
    });
    setAreaSeleccionada(null);
    setModoDialog('crear');
    setShowDialog(true);
  };

  const handleEditarArea = (area: Area) => {
    setFormData({
      nombre: area.nombre,
      descripcion: area.descripcion || '',
      codigo: area.codigo || '',
      colorHex: area.colorHex || '#3B82F6',
      coordinadorId: area.coordinadorId || '',
      activo: area.activo
    });
    setAreaSeleccionada(area);
    setModoDialog('editar');
    setShowDialog(true);
  };

  const handleGuardar = async () => {
    // Validar datos
    const validacion = validarDatosArea(formData);
    if (!validacion.valido) {
      setError(validacion.errores.join(', '));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (modoDialog === 'crear') {
        await crearAreaAPI(formData);
      } else if (areaSeleccionada) {
        await actualizarAreaAPI(areaSeleccionada.id, formData);
      }
      setShowDialog(false);
      cargarAreas();
    } catch (error: any) {
      console.error('Error guardando área:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminar = async (area: Area) => {
    if (!confirm(`¿Está seguro de que desea eliminar el área "${area.nombre}"?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await eliminarAreaAPI(area.id);
      cargarAreas();
    } catch (error: any) {
      console.error('Error eliminando área:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarEstado = async (area: Area) => {
    setIsLoading(true);
    setError(null);

    try {
      await cambiarEstadoAreaAPI(area.id, !area.activo);
      cargarAreas();
    } catch (error: any) {
      console.error('Error cambiando estado:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerarCodigo = () => {
    if (formData.nombre) {
      const codigoGenerado = generarCodigoSugerido(formData.nombre);
      setFormData({ ...formData, codigo: codigoGenerado });
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
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
              Gestión de Áreas Académicas
            </h1>
            <p className="text-gray-600 mt-2">
              Control y administración de áreas de conocimiento y especialización
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={cargarAreas}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={handleNuevaArea}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Área
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
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Áreas</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.total}</p>
                </div>
                <BookOpen className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Áreas Activas</p>
                  <p className="text-3xl font-bold text-green-600">{estadisticas.activas}</p>
                  <p className="text-xs text-gray-500 mt-1">{estadisticas.inactivas} inactivas</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Docentes</p>
                  <p className="text-3xl font-bold text-blue-600">{estadisticas.totalDocentes}</p>
                  <p className="text-xs text-gray-500 mt-1">En todas las áreas</p>
                </div>
                <Users className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Horarios</p>
                  <p className="text-3xl font-bold text-orange-600">{estadisticas.totalHorarios}</p>
                  <p className="text-xs text-gray-500 mt-1">Clases programadas</p>
                </div>
                <Clock className="h-10 w-10 text-orange-600" />
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
                  Buscar área
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="busqueda"
                    placeholder="Nombre, código o descripción..."
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
                    <SelectItem value="activo">Activas</SelectItem>
                    <SelectItem value="inactivo">Inactivas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setBusqueda('');
                  setFiltroEstado('todos');
                }}
                className="lg:mt-7"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Áreas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Áreas Registradas ({areasFiltradas.length})</span>
              <span className="text-sm font-normal text-gray-500">
                Actualizado: {new Date().toLocaleString('es-ES')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Coordinador</TableHead>
                    <TableHead className="text-center">Docentes</TableHead>
                    <TableHead className="text-center">Horarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Cargando áreas...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : areasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <BookOpen className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500">No se encontraron áreas</p>
                          {busqueda && (
                            <p className="text-sm text-gray-400">
                              Intenta con otros términos de búsqueda
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    areasFiltradas.map((area) => (
                      <TableRow key={area.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: area.colorHex || '#6B7280' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {area.codigo || 'Sin código'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">{area.nombre}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 max-w-xs truncate">
                            {area.descripcion || 'Sin descripción'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {area.coordinador ? (
                              <>
                                <UserCheck className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">
                                  {formatearNombreCoordinador(area)}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">Sin coordinador</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {area._count?.docentes || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {area._count?.horarios || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getBadgeEstado(area.activo)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => console.log('Ver detalles:', area)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditarArea(area)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCambiarEstado(area)}>
                                <Power className="h-4 w-4 mr-2" />
                                {area.activo ? 'Desactivar' : 'Activar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEliminar(area)}
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
          title={modoDialog === 'crear' ? 'Nueva Área Académica' : 'Editar Área Académica'}
          description={modoDialog === 'crear' 
            ? 'Registra una nueva área de conocimiento o especialización.'
            : 'Modifica los datos del área seleccionada.'
          }
          size="lg"
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
                  <BookOpen className="h-4 w-4 mr-2" />
                )}
                {modoDialog === 'crear' ? 'Crear Área' : 'Guardar Cambios'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Área *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Matemáticas, Ciencias Sociales..."
                required
              />
            </div>

            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="codigo">Código del Área</Label>
              <div className="flex gap-2">
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                  placeholder="Ej: MAT-01, CS-02"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerarCodigo}
                  disabled={!formData.nombre}
                >
                  Generar
                </Button>
              </div>
              <p className="text-xs text-gray-500">Formato: AA-NN o AAA-NNN</p>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Describe el área académica..."
                rows={3}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color Identificador</Label>
              <div className="grid grid-cols-5 gap-2">
                {obtenerColoresPredefinidos().map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({...formData, colorHex: color.value})}
                    className={`w-full h-10 rounded-lg border-2 transition-all ${
                      formData.colorHex === color.value 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Coordinador ID */}
            <div className="space-y-2">
              <Label htmlFor="coordinadorId">ID del Coordinador (opcional)</Label>
              <Input
                id="coordinadorId"
                value={formData.coordinadorId}
                onChange={(e) => setFormData({...formData, coordinadorId: e.target.value})}
                placeholder="UUID del coordinador"
              />
              <p className="text-xs text-gray-500">Deja en blanco si aún no hay coordinador</p>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="activo">Estado</Label>
              <Select 
                value={formData.activo ? 'true' : 'false'} 
                onValueChange={(value) => setFormData({...formData, activo: value === 'true'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
