'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  MapPin,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Map,
  Navigation,
  AlertCircle,
  CheckCircle,
  Clock,
  Users
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import MapModal from '@/components/maps/MapModal';
import CreateLocationModal, { LocationFormData } from '@/components/maps/CreateLocationModal';
import { Label } from '@/components/ui/label';
import { 
  obtenerUbicaciones as obtenerUbicacionesAPI, 
  crearUbicacion as crearUbicacionAPI,
  actualizarUbicacion as actualizarUbicacionAPI,
  eliminarUbicacion as eliminarUbicacionAPI,
  UbicacionGPS,
  EstadisticasUbicaciones,
  FiltrosUbicaciones,
  DatosUbicacion,
  formatearCoordenadas
} from '@/services/ubicacion-api.service';

// Interfaces ya están importadas del servicio

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<UbicacionGPS[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasUbicaciones>({
    total: 0,
    activas: 0,
    inactivas: 0,
    radioPromedio: 0,
    usosRecientes: 0
  });
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedUbicacion, setSelectedUbicacion] = useState<UbicacionGPS | null>(null);
  const [modoDialog, setModoDialog] = useState<'crear' | 'editar'>('crear');
  const [ubicacionEditando, setUbicacionEditando] = useState<LocationFormData | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ubicacionAEliminar, setUbicacionAEliminar] = useState<number | null>(null);

  // Solución para hydration error - solo renderizar tiempo en el cliente
  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date().toLocaleTimeString('es-ES'));
  }, []);

  // Cargar datos de ubicaciones
  const cargarUbicaciones = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filtros: FiltrosUbicaciones = {
        activo: filtroEstado as any,
        busqueda: busqueda || undefined
      };

      const respuesta = await obtenerUbicacionesAPI(filtros);
      setUbicaciones(respuesta.ubicaciones);
      setEstadisticas(respuesta.estadisticas);
      
      // Actualizar tiempo de última carga
      setCurrentTime(new Date().toLocaleTimeString('es-ES'));
      
    } catch (error: any) {
      console.error('Error cargando ubicaciones:', error);
      setError(error.message || 'Error al cargar las ubicaciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarUbicaciones();
  }, [filtroEstado]);

  // Filtrar ubicaciones
  const ubicacionesFiltradas = ubicaciones.filter(ubicacion => {
    const coincideBusqueda = busqueda === '' || 
      ubicacion.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      ubicacion.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === 'todos' || 
      (filtroEstado === 'activas' && ubicacion.activo) ||
      (filtroEstado === 'inactivas' && !ubicacion.activo);
    
    return coincideBusqueda && coincideEstado;
  });

  const handleCrear = () => {
    setModoDialog('crear');
    setUbicacionEditando(null);
    setShowDialog(true);
  };

  const handleEditar = (ubicacion: UbicacionGPS) => {
    setModoDialog('editar');
    setUbicacionEditando({
      nombre: ubicacion.nombre,
      descripcion: ubicacion.descripcion || '',
      latitud: ubicacion.latitud.toString(),
      longitud: ubicacion.longitud.toString(),
      radioMetros: ubicacion.radioMetros.toString(),
      activo: ubicacion.activo
    });
    setShowDialog(true);
  };

  const handleGuardarUbicacion = async (data: LocationFormData) => {
    try {
      const datosUbicacion: DatosUbicacion = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        latitud: data.latitud,
        longitud: data.longitud,
        radioMetros: data.radioMetros,
        activo: data.activo
      };
      
      if (modoDialog === 'crear') {
        await crearUbicacionAPI(datosUbicacion);
      } else {
        if (!ubicacionEditando) {
          throw new Error('No se pudo identificar la ubicación a editar');
        }
        // Encontrar el ID de la ubicación que se está editando
        const ubicacionOriginal = ubicaciones.find(
          ub => ub.nombre === ubicacionEditando.nombre && 
                ub.latitud.toString() === ubicacionEditando.latitud
        );
        if (!ubicacionOriginal?.id) {
          throw new Error('No se pudo identificar la ubicación a editar');
        }
        await actualizarUbicacionAPI(ubicacionOriginal.id, datosUbicacion);
      }
      
      await cargarUbicaciones();
    } catch (error: any) {
      throw new Error(error.message || 'Error al guardar la ubicación');
    }
  };

  const handleEliminar = async (id: number) => {
    setUbicacionAEliminar(id);
    setShowDeleteDialog(true);
  };

  const confirmarEliminar = async () => {
    if (!ubicacionAEliminar) return;
    
    try {
      setIsLoading(true);
      const resultado = await eliminarUbicacionAPI(ubicacionAEliminar);
      
      // Mostrar mensaje de éxito que puede ser eliminación o desactivación
      if (resultado.mensaje.includes('desactivada')) {
        setError(null); // Limpiar errores previos
        // Recargar para mostrar el estado actualizado
        await cargarUbicaciones();
      } else {
        await cargarUbicaciones();
      }
    } catch (error: any) {
      setError(error.message || 'Error al eliminar la ubicación');
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
      setUbicacionAEliminar(null);
    }
  };

  const getBadgeEstado = (activo: boolean) => {
    return activo 
      ? <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Activa</Badge>
      : <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Inactiva</Badge>;
  };

  // Función de formateo ya está importada del servicio

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MapPin className="h-8 w-8 text-blue-600 mr-3" />
              Gestión de Ubicaciones GPS
            </h1>
            <p className="text-gray-600 mt-2">
              Control y administración de ubicaciones permitidas para registro de asistencia
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cargarUbicaciones}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button size="sm" onClick={handleCrear}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ubicación
            </Button>
            <Button 
              onClick={() => {
                setSelectedUbicacion(null);
                setShowMapModal(true);
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Map className="h-4 w-4" />
              Ver Todas en Mapa
            </Button>
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ubicaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                </div>
                <Map className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activas</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.activas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactivas</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.inactivas}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Radio Promedio</p>
                  <p className="text-2xl font-bold text-orange-600">{Math.round(estadisticas.radioPromedio)}m</p>
                </div>
                <Navigation className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usos Recientes</p>
                  <p className="text-2xl font-bold text-purple-600">{estadisticas.usosRecientes}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
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
                  Buscar ubicación
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="busqueda"
                    placeholder="Nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full lg:w-48">
                <Label htmlFor="estado" className="text-sm font-medium text-gray-700 mb-2 block">
                  Estado
                </Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="activas">Activas</SelectItem>
                    <SelectItem value="inactivas">Inactivas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={() => {setBusqueda(''); setFiltroEstado('todos');}}>
                  <Filter className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Ubicaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ubicaciones Registradas ({ubicacionesFiltradas.length} registros)</span>
              <span className="text-sm font-normal text-gray-500" suppressHydrationWarning>
                {isMounted && `Actualizado: ${currentTime}`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Coordenadas</TableHead>
                    <TableHead>Radio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Cargando ubicaciones...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : ubicacionesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <MapPin className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500">No se encontraron ubicaciones</p>
                          {busqueda && (
                            <p className="text-sm text-gray-400">
                              Intenta con otros términos de búsqueda
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ubicacionesFiltradas.map((ubicacion) => (
                      <TableRow key={ubicacion.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{ubicacion.nombre}</p>
                            <p className="text-sm text-gray-600">{ubicacion.descripcion || 'Sin descripción'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-mono">
                              {ubicacion.latitud && ubicacion.longitud 
                                ? formatearCoordenadas(ubicacion.latitud, ubicacion.longitud)
                                : 'Sin coordenadas'
                              }
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ubicacion.radioMetros}m</Badge>
                        </TableCell>
                        <TableCell>
                          {getBadgeEstado(ubicacion.activo)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>E: {ubicacion._count?.asistenciasEntrada || 0}</p>
                            <p>S: {ubicacion._count?.asistenciasSalida || 0}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(ubicacion.updatedAt).toLocaleDateString('es-ES')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditar(ubicacion)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUbicacion(ubicacion);
                                setShowMapModal(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver en Mapa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleEliminar(ubicacion.id)}
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

        {/* Modal Profesional para Crear/Editar Ubicación */}
        <CreateLocationModal
          isOpen={showDialog}
          onClose={() => {
            setShowDialog(false);
            setUbicacionEditando(null);
          }}
          onSave={handleGuardarUbicacion}
          editingLocation={ubicacionEditando}
          mode={modoDialog}
        />

        {/* Modal de Mapa Interactivo */}
        <MapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setSelectedUbicacion(null);
          }}
          ubicaciones={ubicaciones.map(ub => ({
            id: ub.id,
            nombre: ub.nombre,
            descripcion: ub.descripcion || undefined,
            latitud: Number(ub.latitud),
            longitud: Number(ub.longitud),
            radioMetros: ub.radioMetros,
            activo: ub.activo
          }))}
          title={selectedUbicacion 
            ? `Ubicación: ${selectedUbicacion.nombre}` 
            : 'Ver Todas las Ubicaciones en Mapa'
          }
          selectedUbicacion={selectedUbicacion ? {
            id: selectedUbicacion.id,
            nombre: selectedUbicacion.nombre,
            descripcion: selectedUbicacion.descripcion || undefined,
            latitud: Number(selectedUbicacion.latitud),
            longitud: Number(selectedUbicacion.longitud),
            radioMetros: selectedUbicacion.radioMetros,
            activo: selectedUbicacion.activo
          } : null}
        />

        {/* Modal de Confirmación de Eliminación */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Confirmar Eliminación
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p className="text-base text-gray-700">
                    ¿Estás seguro de que deseas eliminar esta ubicación GPS?
                  </p>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">⚠️ Advertencia:</span> Esta acción no se puede deshacer. Si la ubicación tiene registros de asistencia asociados, será desactivada en lugar de eliminarse.
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmarEliminar}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
