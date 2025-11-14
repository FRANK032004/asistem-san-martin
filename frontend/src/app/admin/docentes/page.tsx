'use client';

import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Power, Trash2, MoreHorizontal, Users, UserCheck, UserX, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { docenteService, type Docente, type Area } from '@/services/docente-api.service';
import BackToAdminButton from '@/components/admin/BackToAdminButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function DocentesPageContent() {
  // 🔥 Estados locales para paginación y búsqueda (igual que usuarios)
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [areas, setAreas] = useState<Area[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');

  // Función para cargar docentes (igual que usuarios)
  const fetchDocentes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(estadoFilter && { estado: estadoFilter }),
        ...(areaFilter && { areaId: areaFilter })
      });
      
      const response = await fetch(`${API_URL}/admin/docentes?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar docentes');
      }
      
      const data = await response.json();
      console.log('📦 Respuesta del backend (docentes):', data);
      
      if (data.success) {
        const paginatedData = data.data;
        const docentesData = Array.isArray(paginatedData?.data) ? paginatedData.data : [];
        const paginationData = paginatedData?.pagination || null;
        
        console.log('✅ Docentes parseados:', docentesData.length);
        setDocentes(docentesData);
        setPagination(paginationData);
      }
    } catch (err: any) {
      console.error('❌ Error al cargar docentes:', err);
      setError(err.message || 'Error al cargar docentes');
      setDocentes([]); // ✅ Resetear a array vacío
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, estadoFilter, areaFilter]);

  // Cargar docentes cuando cambien los filtros
  useEffect(() => {
    fetchDocentes();
  }, [fetchDocentes]);

  // Cargar áreas
  useEffect(() => {
    cargarAreas();
  }, []);

  const cargarAreas = async () => {
    try {
      const areasData = await docenteService.obtenerAreas();
      if (Array.isArray(areasData)) {
        setAreas(areasData);
      }
    } catch (err: any) {
      console.error('Error al cargar áreas:', err);
    }
  };

  // Ya no necesitamos este useEffect porque los filtros se manejan en fetchDocentes

  const handleToggleStatus = async (id: string) => {
    const docente = docentes.find(d => d.id === id);
    if (!docente) return;

    try {
      await docenteService.cambiarEstadoDocente(id, !docente.usuarios?.activo);
      fetchDocentes(); // Recargar datos
      alert(`Docente ${docente.usuarios?.activo ? 'desactivado' : 'activado'} correctamente`);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado del docente');
    }
  };

  const handleDelete = async (id: string) => {
    const docente = docentes.find(d => d.id === id);
    if (!docente || !confirm(`¿Está seguro de eliminar al docente ${docente.usuarios?.nombres} ${docente.usuarios?.apellidos}?`)) return;

    try {
      await docenteService.eliminarDocente(id);
      fetchDocentes(); // Recargar datos
      alert('Docente eliminado correctamente');
    } catch (err: any) {
      alert(err.message || 'Error al eliminar docente');
    }
  };

  // Calcular estadísticas (usar pagination.total si está disponible)
  const totalDocentes = pagination?.total || (Array.isArray(docentes) ? docentes.length : 0);
  const docentesActivos = Array.isArray(docentes) ? docentes.filter(d => d.estado === 'ACTIVO' && d.usuarios?.activo).length : 0;
  const docentesInactivos = Array.isArray(docentes) ? docentes.filter(d => d.estado === 'INACTIVO' || !d.usuarios?.activo).length : 0;
  const docentesLicencia = Array.isArray(docentes) ? docentes.filter(d => d.estado === 'LICENCIA').length : 0;

  if (loading && docentes.length === 0) {
    return <LoadingScreen message="Cargando docentes..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Docentes</h1>
            <p className="text-gray-600 mt-1">Administrar docentes del instituto</p>
          </div>
          
          <div className="flex gap-3">
            <Link href="/admin/docentes/crear">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Docente
              </Button>
            </Link>
            <BackToAdminButton />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{totalDocentes}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {docentesActivos}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactivos</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {docentesInactivos}
                  </p>
                </div>
                <UserX className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Licencia</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {docentesLicencia}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar docentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                  <SelectItem value="LICENCIA">Licencia</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por área" />
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
              
              <Button 
                variant="outline" 
                onClick={() => { 
                  setSearchTerm(''); 
                  setEstadoFilter(''); 
                  setAreaFilter('');
                }}
              >
                Limpiar filtros
              </Button>
            </div>

            {/* Selector de items por página */}
            <div className="mt-4 flex items-center justify-between">
              <PageSizeSelector
                value={pagination?.limit || 10}
                onChange={setPageSize}
                options={[10, 25, 50, 100]}
              />
              
              {pagination && (
                <p className="text-sm text-gray-600">
                  Total: <span className="font-semibold">{pagination.total}</span> docentes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>
              Docentes
              {pagination && ` (${pagination.from}-${pagination.to} de ${pagination.total})`}
              {loading && <span className="text-sm text-gray-500 ml-2">Cargando...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <p>Error: {error}</p>
                <Button variant="outline" size="sm" onClick={fetchDocentes} className="mt-2">
                  Reintentar
                </Button>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>DNI</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Cargando docentes...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : docentes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-gray-500">No se encontraron docentes</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    docentes.map((docente) => (
                      <TableRow key={docente.id}>
                        <TableCell className="font-mono font-semibold">
                          {docente.codigoDocente}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {docente.usuarios?.nombres} {docente.usuarios?.apellidos}
                            </div>
                            {docente.usuarios?.telefono && (
                              <div className="text-sm text-gray-500">
                                Tel: {docente.usuarios?.telefono}
                              </div>
                            )}
                            {docente.especialidad && (
                              <div className="text-xs text-gray-400 mt-1">
                                Esp: {docente.especialidad}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{docente.usuarios?.email}</TableCell>
                        <TableCell className="font-mono">{docente.usuarios?.dni}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {docente.area?.nombre || 'Sin área'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge 
                              variant={
                                docente.estado === 'ACTIVO' ? 'default' : 
                                docente.estado === 'LICENCIA' ? 'secondary' : 
                                'destructive'
                              }
                            >
                              {docente.estado}
                            </Badge>
                            {!docente.usuarios?.activo && (
                              <Badge variant="destructive" className="text-xs">
                                Usuario Inactivo
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/admin/docentes/${docente.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalles
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/admin/docentes/${docente.id}/editar`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(docente.id)}
                                className="cursor-pointer"
                              >
                                <Power className="mr-2 h-4 w-4" />
                                {docente.usuarios?.activo ? 'Desactivar' : 'Activar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(docente.id)}
                                className="cursor-pointer text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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

            {/* Componente de paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={setPage}
                  showItemsInfo={true}
                  showPageNumbers={true}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DocentesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando...</div>}>
      <DocentesPageContent />
    </Suspense>
  );
}
