'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building,
  Users,
  BookOpen,
  MoreHorizontal
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

interface Area {
  id: string;
  nombre: string;
  descripcion?: string;
  coordinador?: string;
  cantidadDocentes: number;
  estado: 'ACTIVA' | 'INACTIVA';
  fechaCreacion: string;
}

export default function AreasAdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  // Verificar autorización
  useEffect(() => {
    if (!user || (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user && (typeof user.rol === 'string' ? user.rol : user.rol?.nombre) === 'ADMIN') {
      cargarAreas();
    }
  }, [user]);

  const cargarAreas = async () => {
    try {
      setLoading(true);
      
      // Datos de ejemplo para desarrollo
      const areasEjemplo: Area[] = [
        {
          id: '1',
          nombre: 'Matemáticas',
          descripcion: 'Área de ciencias exactas, álgebra, geometría y estadística',
          coordinador: 'Dr. Juan Pérez',
          cantidadDocentes: 8,
          estado: 'ACTIVA',
          fechaCreacion: '2023-01-15'
        },
        {
          id: '2',
          nombre: 'Comunicación',
          descripcion: 'Área de lenguaje, literatura y redacción',
          coordinador: 'Lic. María García',
          cantidadDocentes: 6,
          estado: 'ACTIVA',
          fechaCreacion: '2023-01-15'
        },
        {
          id: '3',
          nombre: 'Ciencias Naturales',
          descripcion: 'Biología, química, física y ciencias ambientales',
          coordinador: 'Ing. Carlos López',
          cantidadDocentes: 7,
          estado: 'ACTIVA',
          fechaCreacion: '2023-02-01'
        },
        {
          id: '4',
          nombre: 'Ciencias Sociales',
          descripcion: 'Historia, geografía, educación cívica y filosofía',
          coordinador: 'Lic. Ana Torres',
          cantidadDocentes: 5,
          estado: 'ACTIVA',
          fechaCreacion: '2023-02-15'
        },
        {
          id: '5',
          nombre: 'Inglés',
          descripcion: 'Enseñanza del idioma inglés como segunda lengua',
          coordinador: 'Lic. Robert Smith',
          cantidadDocentes: 4,
          estado: 'ACTIVA',
          fechaCreacion: '2023-03-01'
        },
        {
          id: '6',
          nombre: 'Educación Física',
          descripcion: 'Deporte, recreación y actividad física',
          coordinador: 'Prof. Luis Ramos',
          cantidadDocentes: 3,
          estado: 'ACTIVA',
          fechaCreacion: '2023-03-15'
        }
      ];

      setAreas(areasEjemplo);
      
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      toast.error('Error al cargar la lista de áreas');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar áreas
  const areasFiltradas = areas.filter(area =>
    area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (area.descripcion && area.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (area.coordinador && area.coordinador.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Activa</Badge>;
      case 'INACTIVA':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Inactiva</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Áreas Académicas</h1>
            <p className="text-gray-600">Administra las áreas académicas del instituto</p>
          </div>
          <div className="flex gap-4">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Nueva Área
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Área</DialogTitle>
                </DialogHeader>
                <AreaForm 
                  onSuccess={() => {
                    setShowCreateDialog(false);
                    cargarAreas();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Áreas</p>
                <p className="text-2xl font-bold text-gray-900">{areas.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Áreas Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {areas.filter(a => a.estado === 'ACTIVA').length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Docentes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {areas.reduce((total, area) => total + area.cantidadDocentes, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio por Área</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {areas.length > 0 ? Math.round(areas.reduce((total, area) => total + area.cantidadDocentes, 0) / areas.length) : 0}
                </p>
              </div>
              <Building className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtros */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, descripción o coordinador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de áreas */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Áreas Académicas</span>
              <Badge variant="secondary">
                {areasFiltradas.length} de {areas.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando áreas...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead>Coordinador</TableHead>
                    <TableHead>Docentes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areasFiltradas.map((area) => (
                    <TableRow key={area.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{area.nombre}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {area.descripcion || 'Sin descripción'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {area.coordinador || 'Sin asignar'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-center">
                          {area.cantidadDocentes}
                        </Badge>
                      </TableCell>
                      <TableCell>{getEstadoBadge(area.estado)}</TableCell>
                      <TableCell>
                        {new Date(area.fechaCreacion).toLocaleDateString('es-PE')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedArea(area);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Desactivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!loading && areasFiltradas.length === 0 && (
              <div className="text-center py-8">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay áreas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? 'No se encontraron áreas con los filtros aplicados.'
                    : 'Comienza agregando una nueva área académica.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog de edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Área</DialogTitle>
          </DialogHeader>
          {selectedArea && (
            <AreaForm 
              area={selectedArea}
              onSuccess={() => {
                setShowEditDialog(false);
                setSelectedArea(null);
                cargarAreas();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Componente del formulario de área
function AreaForm({ 
  area, 
  onSuccess 
}: { 
  area?: Area; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    nombre: area?.nombre || '',
    descripcion: area?.descripcion || '',
    coordinador: area?.coordinador || '',
    estado: area?.estado || 'ACTIVA'
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Aquí iría la llamada a la API
      toast.success(area ? 'Área actualizada exitosamente' : 'Área creada exitosamente');
      onSuccess();
    } catch (error) {
      toast.error('Error al guardar el área');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre del Área</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Matemáticas"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="coordinador">Coordinador</Label>
          <Input
            id="coordinador"
            value={formData.coordinador}
            onChange={(e) => setFormData({ ...formData, coordinador: e.target.value })}
            placeholder="Ej: Dr. Juan Pérez"
          />
        </div>
        
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción del área académica..."
            rows={4}
          />
        </div>
      </div>
      
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Guardando...' : (area ? 'Actualizar' : 'Crear')} Área
        </Button>
      </div>
    </form>
  );
}
