'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock,
  Calendar,
  Users,
  MoreHorizontal,
  RefreshCw,
  CalendarDays,
  Timer,
  BookOpen
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
interface Horario {
  id: string;
  nombre: string;
  descripcion?: string;
  horaEntrada: string;
  horaSalida: string;
  diasSemana: string[];
  esEspecial: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  area?: {
    id: string;
    nombre: string;
  };
  activo: boolean;
  fechaCreacion: string;
  docentesAsignados: number;
}

interface HorarioFormData {
  nombre: string;
  descripcion: string;
  horaEntrada: string;
  horaSalida: string;
  diasSemana: string[];
  esEspecial: boolean;
  fechaInicio: string;
  fechaFin: string;
  areaId: string;
  activo: boolean;
}

interface Area {
  id: string;
  nombre: string;
}

const DIAS_SEMANA = [
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' }
];

export default function HorariosAdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // ========== ESTADOS ==========
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroArea, setFiltroArea] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
  const [formData, setFormData] = useState<HorarioFormData>({
    nombre: '',
    descripcion: '',
    horaEntrada: '',
    horaSalida: '',
    diasSemana: [],
    esEspecial: false,
    fechaInicio: '',
    fechaFin: '',
    areaId: '',
    activo: true
  });

  // ========== EFECTOS ==========
  useEffect(() => {
    if (!user || (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user && (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) === 'ADMIN') {
      cargarHorarios();
      cargarAreas();
    }
  }, [user]);

  // ========== FUNCIONES DE CARGA ==========
  const cargarHorarios = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar desde API real
      try {
        const response = await fetch(`${API_URL}/horarios`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHorarios(data.horarios || []);
          return;
        }
      } catch (error) {
        console.log('API no disponible, usando datos de ejemplo');
      }
      
      // Datos de ejemplo para desarrollo
      const horariosEjemplo: Horario[] = [
        {
          id: '1',
          nombre: 'Horario Regular Mañana',
          descripcion: 'Horario estándar de turno mañana',
          horaEntrada: '07:30',
          horaSalida: '13:30',
          diasSemana: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
          esEspecial: false,
          activo: true,
          fechaCreacion: '2024-01-15',
          docentesAsignados: 25
        },
        {
          id: '2',
          nombre: 'Horario Regular Tarde',
          descripcion: 'Horario estándar de turno tarde',
          horaEntrada: '13:00',
          horaSalida: '18:00',
          diasSemana: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
          esEspecial: false,
          activo: true,
          fechaCreacion: '2024-01-15',
          docentesAsignados: 18
        },
        {
          id: '3',
          nombre: 'Horario Especial - Exámenes Finales',
          descripcion: 'Horario especial para período de exámenes finales',
          horaEntrada: '08:00',
          horaSalida: '16:00',
          diasSemana: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'],
          esEspecial: true,
          fechaInicio: '2025-12-01',
          fechaFin: '2025-12-15',
          area: {
            id: '1',
            nombre: 'Todas las áreas'
          },
          activo: true,
          fechaCreacion: '2024-11-01',
          docentesAsignados: 40
        },
        {
          id: '4',
          nombre: 'Horario Verano - Educación Física',
          descripcion: 'Horario especial de verano para área de educación física',
          horaEntrada: '06:30',
          horaSalida: '11:30',
          diasSemana: ['LUNES', 'MIERCOLES', 'VIERNES'],
          esEspecial: true,
          fechaInicio: '2025-01-15',
          fechaFin: '2025-03-15',
          area: {
            id: '2',
            nombre: 'Educación Física'
          },
          activo: false,
          fechaCreacion: '2024-12-01',
          docentesAsignados: 5
        },
        {
          id: '5',
          nombre: 'Horario Sábados - Actividades Extra',
          descripcion: 'Horario para actividades extracurriculares los sábados',
          horaEntrada: '08:00',
          horaSalida: '12:00',
          diasSemana: ['SABADO'],
          esEspecial: false,
          activo: true,
          fechaCreacion: '2024-03-01',
          docentesAsignados: 8
        }
      ];

      setHorarios(horariosEjemplo);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      toast.error('Error al cargar la lista de horarios');
    } finally {
      setLoading(false);
    }
  };

  const cargarAreas = async () => {
    try {
      // Intentar cargar desde API real
      try {
        const response = await fetch(`${API_URL}/areas`, {
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

  // ========== FUNCIONES CRUD ==========
  const crearHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.diasSemana.length === 0) {
      toast.error('Debe seleccionar al menos un día de la semana');
      return;
    }

    if (formData.horaEntrada >= formData.horaSalida) {
      toast.error('La hora de entrada debe ser anterior a la hora de salida');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/horarios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Horario creado exitosamente');
        setShowCreateDialog(false);
        limpiarFormulario();
        cargarHorarios();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al crear horario');
      }
    } catch (error) {
      toast.error('Error de conexión al crear horario');
      console.error('Error:', error);
    }
  };

  const editarHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHorario) return;

    try {
      const response = await fetch(`${API_URL}/horarios/${selectedHorario.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Horario actualizado exitosamente');
        setShowEditDialog(false);
        limpiarFormulario();
        cargarHorarios();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al actualizar horario');
      }
    } catch (error) {
      toast.error('Error de conexión al actualizar horario');
      console.error('Error:', error);
    }
  };

  const eliminarHorario = async () => {
    if (!selectedHorario) return;

    try {
      const response = await fetch(`${API_URL}/horarios/${selectedHorario.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Horario eliminado exitosamente');
        setShowDeleteDialog(false);
        setSelectedHorario(null);
        cargarHorarios();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al eliminar horario');
      }
    } catch (error) {
      toast.error('Error de conexión al eliminar horario');
      console.error('Error:', error);
    }
  };

  const toggleEstadoHorario = async (horario: Horario) => {
    try {
      const response = await fetch(`${API_URL}/horarios/${horario.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success(`Horario ${horario.activo ? 'desactivado' : 'activado'} exitosamente`);
        cargarHorarios();
      } else {
        toast.error('Error al cambiar estado del horario');
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
      horaEntrada: '',
      horaSalida: '',
      diasSemana: [],
      esEspecial: false,
      fechaInicio: '',
      fechaFin: '',
      areaId: '',
      activo: true
    });
  };

  const abrirDialogoEditar = (horario: Horario) => {
    setSelectedHorario(horario);
    setFormData({
      nombre: horario.nombre,
      descripcion: horario.descripcion || '',
      horaEntrada: horario.horaEntrada,
      horaSalida: horario.horaSalida,
      diasSemana: horario.diasSemana,
      esEspecial: horario.esEspecial,
      fechaInicio: horario.fechaInicio || '',
      fechaFin: horario.fechaFin || '',
      areaId: horario.area?.id || '',
      activo: horario.activo
    });
    setShowEditDialog(true);
  };

  const abrirDialogoEliminar = (horario: Horario) => {
    setSelectedHorario(horario);
    setShowDeleteDialog(true);
  };

  const toggleDiaSemana = (dia: string) => {
    const nuevos = formData.diasSemana.includes(dia)
      ? formData.diasSemana.filter(d => d !== dia)  
      : [...formData.diasSemana, dia];
    setFormData({...formData, diasSemana: nuevos});
  };

  // ========== FILTROS ==========
  const horariosFiltrados = horarios.filter(horario => {
    const matchBusqueda = searchTerm === '' || 
      horario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (horario.descripcion && horario.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchTipo = filtroTipo === '' || 
      (filtroTipo === 'ESPECIAL' && horario.esEspecial) ||
      (filtroTipo === 'REGULAR' && !horario.esEspecial);
      
    const matchArea = filtroArea === '' || horario.area?.id === filtroArea;
    
    return matchBusqueda && matchTipo && matchArea;
  });

  // ========== BADGES ==========
  const getTipoBadge = (esEspecial: boolean) => {
    return esEspecial
      ? <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Timer className="w-3 h-3 mr-1" />Especial</Badge>
      : <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />Regular</Badge>;
  };

  const getEstadoBadge = (activo: boolean) => {
    return activo
      ? <Badge className="bg-green-100 text-green-800 border-green-200">Activo</Badge>
      : <Badge className="bg-red-100 text-red-800 border-red-200">Inactivo</Badge>;
  };

  const formatearDias = (dias: string[]) => {
    const abrev = {
      'LUNES': 'L', 'MARTES': 'M', 'MIERCOLES': 'X', 
      'JUEVES': 'J', 'VIERNES': 'V', 'SABADO': 'S', 'DOMINGO': 'D'
    };
    return dias.map(dia => abrev[dia as keyof typeof abrev]).join('-');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Horarios</h1>
            <p className="text-gray-600">Administrar horarios regulares y especiales del instituto</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={cargarHorarios} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Nuevo Horario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Horario</DialogTitle>
                  <DialogDescription>
                    Complete los datos para crear un nuevo horario
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={crearHorario} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="nombre">Nombre del Horario *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Ej: Horario Regular Mañana"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="Descripción opcional del horario"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="horaEntrada">Hora de Entrada *</Label>
                      <Input
                        id="horaEntrada"
                        type="time"
                        value={formData.horaEntrada}
                        onChange={(e) => setFormData({...formData, horaEntrada: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="horaSalida">Hora de Salida *</Label>
                      <Input
                        id="horaSalida"
                        type="time"
                        value={formData.horaSalida}
                        onChange={(e) => setFormData({...formData, horaSalida: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Días de la Semana *</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {DIAS_SEMANA.map(dia => (
                        <div key={dia.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`dia-${dia.value}`}
                            checked={formData.diasSemana.includes(dia.value)}
                            onChange={() => toggleDiaSemana(dia.value)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`dia-${dia.value}`} className="text-sm">
                            {dia.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="esEspecial"
                      checked={formData.esEspecial}
                      onCheckedChange={(checked: boolean) => setFormData({...formData, esEspecial: checked})}
                    />
                    <Label htmlFor="esEspecial">Es un horario especial (con fechas específicas)</Label>
                  </div>
                  
                  {formData.esEspecial && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
                      <div>
                        <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                        <Input
                          id="fechaInicio"
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="fechaFin">Fecha de Fin</Label>
                        <Input
                          id="fechaFin"
                          type="date"
                          value={formData.fechaFin}
                          onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                        />
                      </div>
                      
                      <div className="col-span-2">
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
                  )}
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setShowCreateDialog(false);
                      limpiarFormulario();
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Horario</Button>
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
                <Label htmlFor="search">Buscar Horario</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="filtroTipo">Tipo de Horario</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los tipos</SelectItem>
                    <SelectItem value="REGULAR">Horarios Regulares</SelectItem>
                    <SelectItem value="ESPECIAL">Horarios Especiales</SelectItem>
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
                Mostrando {horariosFiltrados.length} de {horarios.length} horarios
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
                <p className="text-sm font-medium text-gray-600">Total Horarios</p>
                <p className="text-3xl font-bold text-blue-600">{horarios.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horarios Regulares</p>
                <p className="text-3xl font-bold text-green-600">
                  {horarios.filter(h => !h.esEspecial).length}
                </p>
              </div>
              <CalendarDays className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horarios Especiales</p>
                <p className="text-3xl font-bold text-orange-600">
                  {horarios.filter(h => h.esEspecial).length}
                </p>
              </div>
              <Timer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Docentes Asignados</p>
                <p className="text-3xl font-bold text-purple-600">
                  {horarios.reduce((total, h) => total + h.docentesAsignados, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Horarios */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Lista de Horarios ({horariosFiltrados.length})
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
                      <TableHead>Horario</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Días</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Docentes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {horariosFiltrados.map((horario) => (
                      <TableRow key={horario.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{horario.nombre}</div>
                            {horario.descripcion && (
                              <div className="text-sm text-gray-500">{horario.descripcion}</div>
                            )}
                            {horario.area && (
                              <Badge variant="outline" className="mt-1">
                                {horario.area.nombre}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTipoBadge(horario.esEspecial)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{horario.horaEntrada} - {horario.horaSalida}</div>
                            <div className="text-gray-500">
                              {Math.round((new Date(`1970-01-01T${horario.horaSalida}`).getTime() - 
                                         new Date(`1970-01-01T${horario.horaEntrada}`).getTime()) / (1000 * 60 * 60))}h
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {formatearDias(horario.diasSemana)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {horario.esEspecial && horario.fechaInicio && horario.fechaFin ? (
                            <div className="text-sm">
                              <div>{new Date(horario.fechaInicio).toLocaleDateString('es-ES')}</div>
                              <div className="text-gray-500">
                                al {new Date(horario.fechaFin).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Permanente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{horario.docentesAsignados}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getEstadoBadge(horario.activo)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => abrirDialogoEditar(horario)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleEstadoHorario(horario)}>
                                {horario.activo ? (
                                  <>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Timer className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => abrirDialogoEliminar(horario)}
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
                
                {horariosFiltrados.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay horarios</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filtroTipo || filtroArea 
                        ? 'No se encontraron horarios con los filtros aplicados.' 
                        : 'Comience creando un nuevo horario.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog Eliminar Horario */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el horario "{selectedHorario?.nombre}"?
              Esta acción no se puede deshacer y afectará a los {selectedHorario?.docentesAsignados} docentes asignados.
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
              onClick={eliminarHorario}
            >
              Eliminar Horario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
