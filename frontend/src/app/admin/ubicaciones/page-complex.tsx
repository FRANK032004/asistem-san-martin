'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin,
  Map,
  Navigation,
  MoreHorizontal,
  RefreshCw,
  Compass,
  Target,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

// ========== TIPOS Y INTERFACES ==========
interface UbicacionGPS {
  id: string;
  nombre: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  radio: number; // metros
  direccion?: string;
  tipo: 'PRINCIPAL' | 'SECUNDARIA' | 'TEMPORAL';
  activa: boolean;
  fechaCreacion: string;
  area?: {
    id: string;
    nombre: string;
  };
  registrosAsistencia: number;
}

interface UbicacionFormData {
  nombre: string;
  descripcion: string;
  latitud: string;
  longitud: string;
  radio: string;
  direccion: string;
  tipo: 'PRINCIPAL' | 'SECUNDARIA' | 'TEMPORAL';
  areaId: string;
  activa: boolean;
}

interface Area {
  id: string;
  nombre: string;
}

export default function UbicacionesAdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // ========== ESTADOS ==========
  const [ubicaciones, setUbicaciones] = useState<UbicacionGPS[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUbicacion, setSelectedUbicacion] = useState<UbicacionGPS | null>(null);
  const [formData, setFormData] = useState<UbicacionFormData>({
    nombre: '',
    descripcion: '',
    latitud: '',
    longitud: '',
    radio: '50',
    direccion: '',
    tipo: 'PRINCIPAL',
    areaId: '',
    activa: true
  });
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);

  // ========== EFECTOS ==========
  useEffect(() => {
    if (!user || (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user && (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) === 'ADMIN') {
      cargarUbicaciones();
      cargarAreas();
    }
  }, [user]);

  // ========== FUNCIONES DE CARGA ==========
  const cargarUbicaciones = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar desde API real
      try {
        const response = await fetch('http://localhost:5000/api/ubicaciones', {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUbicaciones(data.ubicaciones || []);
          return;
        }
      } catch (error) {
        console.log('API no disponible, usando datos de ejemplo');
      }
      
      // Datos de ejemplo para desarrollo
      const ubicacionesEjemplo: UbicacionGPS[] = [
        {
          id: '1',
          nombre: 'Instituto San Martín - Edificio Principal',
          descripcion: 'Ubicación principal del instituto, entrada y oficinas administrativas',
          latitud: -12.046374,
          longitud: -77.042793,
          radio: 100,
          direccion: 'Av. Arequipa 1234, Lima, Perú',
          tipo: 'PRINCIPAL',
          activa: true,
          fechaCreacion: '2024-01-15',
          registrosAsistencia: 2547
        },
        {
          id: '2',
          nombre: 'Laboratorio de Ciencias',
          descripcion: 'Laboratorio de física y química, segundo piso del edificio B',
          latitud: -12.046395,
          longitud: -77.042810,
          radio: 30,
          direccion: 'Edificio B - 2do Piso, Instituto San Martín',
          tipo: 'SECUNDARIA',
          activa: true,
          fechaCreacion: '2024-02-10',
          area: {
            id: '3',
            nombre: 'Ciencias'
          },
          registrosAsistencia: 324
        },
        {
          id: '3',
          nombre: 'Gimnasio y Cancha Deportiva',
          descripcion: 'Área deportiva para clases de educación física y eventos',
          latitud: -12.046420,
          longitud: -77.042750,
          radio: 75,
          direccion: 'Patio posterior, Instituto San Martín',
          tipo: 'SECUNDARIA',
          activa: true,
          fechaCreacion: '2024-02-15',
          area: {
            id: '5',
            nombre: 'Educación Física'
          },
          registrosAsistencia: 186
        },
        {
          id: '4',
          nombre: 'Aula de Arte y Música',
          descripcion: 'Espacio especializado para clases artísticas y musicales',
          latitud: -12.046340,
          longitud: -77.042830,
          radio: 25,
          direccion: 'Edificio C - 1er Piso, Instituto San Martín',
          tipo: 'SECUNDARIA',
          activa: true,
          fechaCreacion: '2024-03-01',
          area: {
            id: '6',
            nombre: 'Arte'
          },
          registrosAsistencia: 142
        },
        {
          id: '5',
          nombre: 'Zona de Emergencia - Patio Central',
          descripcion: 'Ubicación temporal para uso durante simulacros y emergencias',
          latitud: -12.046380,
          longitud: -77.042780,
          radio: 50,
          direccion: 'Patio Central, Instituto San Martín',
          tipo: 'TEMPORAL',
          activa: false,
          fechaCreacion: '2024-06-15',
          registrosAsistencia: 23
        }
      ];

      setUbicaciones(ubicacionesEjemplo);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      toast.error('Error al cargar la lista de ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  const cargarAreas = async () => {
    try {
      // Intentar cargar desde API real
      try {
        const response = await fetch('http://localhost:5000/api/areas', {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAreas(data.areas || []);
          return;
        }
      } catch (error) {
        console.log('API áreas no disponible, usando datos de ejemplo');
      }
      
      // Datos de ejemplo
      setAreas([
        { id: '1', nombre: 'Matemáticas' },
        { id: '2', nombre: 'Comunicación' },
        { id: '3', nombre: 'Ciencias' },
        { id: '4', nombre: 'Historia' },
        { id: '5', nombre: 'Educación Física' },
        { id: '6', nombre: 'Arte' },
        { id: '7', nombre: 'Inglés' }
      ]);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
    }
  };

  // ========== FUNCIONES GPS ==========
  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no es soportada por este navegador');
      return;
    }

    setObteniendoUbicacion(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitud: position.coords.latitude.toString(),
          longitud: position.coords.longitude.toString()
        });
        setObteniendoUbicacion(false);
        toast.success('Ubicación obtenida exitosamente');
      },
      (error) => {
        setObteniendoUbicacion(false);
        toast.error('Error al obtener la ubicación: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // ========== FUNCIONES CRUD ==========
  const crearUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(formData.latitud);
    const lng = parseFloat(formData.longitud);
    const radio = parseInt(formData.radio);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Las coordenadas no son válidas');
      return;
    }

    if (isNaN(radio) || radio < 10 || radio > 1000) {
      toast.error('El radio debe estar entre 10 y 1000 metros');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/ubicaciones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          latitud: lat,
          longitud: lng,
          radio: radio
        })
      });

      if (response.ok) {
        toast.success('Ubicación creada exitosamente');
        setShowCreateDialog(false);
        limpiarFormulario();
        cargarUbicaciones();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al crear ubicación');
      }
    } catch (error) {
      toast.error('Error de conexión al crear ubicación');
      console.error('Error:', error);
    }
  };

  const editarUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUbicacion) return;

    try {
      const response = await fetch(`http://localhost:5000/api/ubicaciones/${selectedUbicacion.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          latitud: parseFloat(formData.latitud),
          longitud: parseFloat(formData.longitud),
          radio: parseInt(formData.radio)
        })
      });

      if (response.ok) {
        toast.success('Ubicación actualizada exitosamente');
        setShowEditDialog(false);
        limpiarFormulario();
        cargarUbicaciones();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al actualizar ubicación');
      }
    } catch (error) {
      toast.error('Error de conexión al actualizar ubicación');
      console.error('Error:', error);
    }
  };

  const eliminarUbicacion = async () => {
    if (!selectedUbicacion) return;

    try {
      const response = await fetch(`http://localhost:5000/api/ubicaciones/${selectedUbicacion.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Ubicación eliminada exitosamente');
        setShowDeleteDialog(false);
        setSelectedUbicacion(null);
        cargarUbicaciones();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al eliminar ubicación');
      }
    } catch (error) {
      toast.error('Error de conexión al eliminar ubicación');
      console.error('Error:', error);
    }
  };

  const toggleEstadoUbicacion = async (ubicacion: UbicacionGPS) => {
    try {
      const response = await fetch(`http://localhost:5000/api/ubicaciones/${ubicacion.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success(`Ubicación ${ubicacion.activa ? 'desactivada' : 'activada'} exitosamente`);
        cargarUbicaciones();
      } else {
        toast.error('Error al cambiar estado de la ubicación');
      }
    } catch (error) {
      toast.error('Error de conexión');
      console.error('Error:', error);
    }
  };

  // ========== UTILIDADES ==========
  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      latitud: '',
      longitud: '',
      radio: '50',
      direccion: '',
      tipo: 'PRINCIPAL',
      areaId: '',
      activa: true
    });
  };

  const abrirDialogoEditar = (ubicacion: UbicacionGPS) => {
    setSelectedUbicacion(ubicacion);
    setFormData({
      nombre: ubicacion.nombre,
      descripcion: ubicacion.descripcion || '',
      latitud: ubicacion.latitud.toString(),
      longitud: ubicacion.longitud.toString(),
      radio: ubicacion.radio.toString(),
      direccion: ubicacion.direccion || '',
      tipo: ubicacion.tipo,
      areaId: ubicacion.area?.id || '',
      activa: ubicacion.activa
    });
    setShowEditDialog(true);
  };

  const abrirDialogoEliminar = (ubicacion: UbicacionGPS) => {
    setSelectedUbicacion(ubicacion);
    setShowDeleteDialog(true);
  };

  const abrirEnMapa = (ubicacion: UbicacionGPS) => {
    const url = `https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`;
    window.open(url, '_blank');
  };

  // ========== FILTROS ==========
  const ubicacionesFiltradas = ubicaciones.filter(ubicacion => {
    const matchBusqueda = searchTerm === '' || 
      ubicacion.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ubicacion.descripcion && ubicacion.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ubicacion.direccion && ubicacion.direccion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchTipo = filtroTipo === '' || ubicacion.tipo === filtroTipo;
    const matchArea = filtroArea === '' || ubicacion.area?.id === filtroArea;
    
    return matchBusqueda && matchTipo && matchArea;
  });

  // ========== BADGES ==========
  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'PRINCIPAL':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Target className="w-3 h-3 mr-1" />Principal</Badge>;
      case 'SECUNDARIA':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><Navigation className="w-3 h-3 mr-1" />Secundaria</Badge>;
      case 'TEMPORAL':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Compass className="w-3 h-3 mr-1" />Temporal</Badge>;
      default:
        return <Badge variant="secondary">{tipo}</Badge>;
    }
  };

  const getEstadoBadge = (activa: boolean) => {
    return activa
      ? <Badge className="bg-green-100 text-green-800 border-green-200">Activa</Badge>
      : <Badge className="bg-red-100 text-red-800 border-red-200">Inactiva</Badge>;
  };

  // ========== ANIMACIONES ==========
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  if (!user || (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) !== 'ADMIN') {
    return null;
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Ubicaciones GPS</h1>
            <p className="text-gray-600">Administrar zonas válidas para registro de asistencias</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={cargarUbicaciones} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Nueva Ubicación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Ubicación GPS</DialogTitle>
                  <DialogDescription>
                    Configure una nueva zona válida para registro de asistencias
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={crearUbicacion} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="nombre">Nombre de la Ubicación *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Ej: Instituto San Martín - Edificio Principal"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="Descripción detallada de la ubicación"
                        rows={2}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                        placeholder="Dirección completa"
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <Label className="text-sm font-medium mb-3 block">Coordenadas GPS</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="latitud">Latitud *</Label>
                        <Input
                          id="latitud"
                          value={formData.latitud}
                          onChange={(e) => setFormData({...formData, latitud: e.target.value})}
                          placeholder="-12.046374"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="longitud">Longitud *</Label>
                        <Input
                          id="longitud"
                          value={formData.longitud}
                          onChange={(e) => setFormData({...formData, longitud: e.target.value})}
                          placeholder="-77.042793"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="radio">Radio (metros) *</Label>
                        <Input
                          id="radio"
                          type="number"
                          min="10"
                          max="1000"
                          value={formData.radio}
                          onChange={(e) => setFormData({...formData, radio: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={obtenerUbicacionActual}
                        disabled={obteniendoUbicacion}
                        className="gap-2"
                      >
                        {obteniendoUbicacion ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            Obteniendo...
                          </>
                        ) : (
                          <>
                            <Navigation className="h-3 w-3" />
                            Usar Ubicación Actual
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo">Tipo de Ubicación *</Label>
                      <Select value={formData.tipo} onValueChange={(value: any) => setFormData({...formData, tipo: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRINCIPAL">Principal - Acceso general</SelectItem>
                          <SelectItem value="SECUNDARIA">Secundaria - Área específica</SelectItem>
                          <SelectItem value="TEMPORAL">Temporal - Uso específico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="area">Área Específica (Opcional)</Label>
                      <Select value={formData.areaId} onValueChange={(value) => setFormData({...formData, areaId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar área (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas las áreas</SelectItem>
                          {areas.map(area => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="activa"
                      checked={formData.activa}
                      onCheckedChange={(checked: boolean) => setFormData({...formData, activa: checked})}
                    />
                    <Label htmlFor="activa">Ubicación activa para registros</Label>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowCreateDialog(false);
                      limpiarFormulario();
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Ubicación</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Filtros y Búsqueda */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar Ubicación</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Nombre, descripción o dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="filtroTipo">Tipo de Ubicación</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los tipos</SelectItem>
                    <SelectItem value="PRINCIPAL">Ubicaciones Principales</SelectItem>
                    <SelectItem value="SECUNDARIA">Ubicaciones Secundarias</SelectItem>
                    <SelectItem value="TEMPORAL">Ubicaciones Temporales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="filtroArea">Filtrar por Área</Label>
                <Select value={filtroArea} onValueChange={setFiltroArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las áreas</SelectItem>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setFiltroTipo('');
                  setFiltroArea('');
                }} className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando {ubicacionesFiltradas.length} de {ubicaciones.length} ubicaciones
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Estadísticas */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ubicaciones</p>
                <p className="text-3xl font-bold text-blue-600">{ubicaciones.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ubicaciones Activas</p>
                <p className="text-3xl font-bold text-green-600">
                  {ubicaciones.filter(u => u.activa).length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Principales</p>
                <p className="text-3xl font-bold text-purple-600">
                  {ubicaciones.filter(u => u.tipo === 'PRINCIPAL').length}
                </p>
              </div>
              <Navigation className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registros Total</p>
                <p className="text-3xl font-bold text-orange-600">
                  {ubicaciones.reduce((total, u) => total + u.registrosAsistencia, 0)}
                </p>
              </div>
              <Globe className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Ubicaciones */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Lista de Ubicaciones GPS ({ubicacionesFiltradas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Coordenadas</TableHead>
                      <TableHead>Radio</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Registros</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ubicacionesFiltradas.map((ubicacion) => (
                      <TableRow key={ubicacion.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{ubicacion.nombre}</div>
                            {ubicacion.descripcion && (
                              <div className="text-sm text-gray-500 mt-1">{ubicacion.descripcion}</div>
                            )}
                            {ubicacion.direccion && (
                              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {ubicacion.direccion}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTipoBadge(ubicacion.tipo)}</TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            <div>Lat: {ubicacion.latitud.toFixed(6)}</div>
                            <div>Lng: {ubicacion.longitud.toFixed(6)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {ubicacion.radio}m
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ubicacion.area ? (
                            <Badge variant="outline">{ubicacion.area.nombre}</Badge>
                          ) : (
                            <span className="text-gray-400">General</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{ubicacion.registrosAsistencia}</div>
                        </TableCell>
                        <TableCell>{getEstadoBadge(ubicacion.activa)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => abrirEnMapa(ubicacion)}>
                                <Map className="mr-2 h-4 w-4" />
                                Ver en Mapa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => abrirDialogoEditar(ubicacion)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleEstadoUbicacion(ubicacion)}>
                                {ubicacion.activa ? (
                                  <>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Target className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => abrirDialogoEliminar(ubicacion)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {ubicacionesFiltradas.length === 0 && (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ubicaciones</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filtroTipo || filtroArea 
                        ? 'No se encontraron ubicaciones con los filtros aplicados.' 
                        : 'Comience creando una nueva ubicación GPS.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog Eliminar Ubicación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar la ubicación "{selectedUbicacion?.nombre}"?
              Esta acción no se puede deshacer y afectará los {selectedUbicacion?.registrosAsistencia} registros de asistencia asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={eliminarUbicacion}
            >
              Eliminar Ubicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
