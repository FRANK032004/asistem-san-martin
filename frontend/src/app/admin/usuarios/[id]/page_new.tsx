'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Power, Shield, User, Mail, Phone, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usuarioService, type Usuario } from '@/services/usuario-api.service';

export default function UsuarioDetallesPage() {
  const params = useParams();
  const usuarioId = params?.id as string;
  
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario desde el backend
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await usuarioService.obtenerUsuarioPorId(usuarioId);
        setUsuario(data);
      } catch (err: any) {
        setError(err.message || 'Usuario no encontrado');
      } finally {
        setLoading(false);
      }
    };

    if (usuarioId) {
      cargarUsuario();
    }
  }, [usuarioId]);

  // Función para cambiar estado del usuario
  const handleToggleStatus = async () => {
    if (!usuario) return;
    
    try {
      const usuarioActualizado = await usuarioService.cambiarEstadoUsuario(usuario.id, !usuario.activo);
      setUsuario(usuarioActualizado);
      alert(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente`);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado del usuario');
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 mt-4">Cargando información del usuario...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error o usuario no encontrado
  if (error || !usuario) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Usuario no encontrado</h2>
              <p className="text-gray-600 mb-6">
                {error || `No se pudo encontrar el usuario con ID: ${usuarioId}`}
              </p>
              <Link href="/admin/usuarios">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Usuarios
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header con navegación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/usuarios">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {usuario.nombres} {usuario.apellidos}
              </h1>
              <p className="text-gray-600">Detalles del usuario</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href={`/admin/usuarios/${usuario.id}/editar`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Editar Usuario
              </Button>
            </Link>
          </div>
        </div>

        {/* Estado y acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <Badge 
                    variant={usuario.activo ? 'default' : 'destructive'}
                    className="mt-1"
                  >
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <Power className={`h-8 w-8 ${usuario.activo ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rol</p>
                  <Badge 
                    variant={usuario.roles?.nombre === 'ADMIN' ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {usuario.roles?.nombre === 'ADMIN' ? 'Administrador' : 'Docente'}
                  </Badge>
                </div>
                <Shield className={`h-8 w-8 ${usuario.roles?.nombre === 'ADMIN' ? 'text-purple-600' : 'text-blue-600'}`} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Último acceso</p>
                  <p className="text-sm text-gray-900 mt-1">No disponible</p>
                </div>
                <Eye className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Información personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Nombres</label>
                <p className="text-lg font-semibold text-gray-900">{usuario.nombres}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Apellidos</label>
                <p className="text-lg font-semibold text-gray-900">{usuario.apellidos}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">DNI</label>
                <p className="text-lg font-mono font-semibold text-gray-900">{usuario.dni}</p>
              </div>
              
              {usuario.telefono && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Teléfono</label>
                  <div className="flex items-center mt-1">
                    <Phone className="mr-2 h-4 w-4 text-gray-400" />
                    <p className="text-lg font-semibold text-gray-900">{usuario.telefono}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="flex items-center mt-1">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-900">{usuario.email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Rol en el sistema</label>
                <div className="mt-1">
                  <Badge 
                    variant={usuario.roles?.nombre === 'ADMIN' ? 'default' : 'secondary'}
                    className="text-base px-3 py-1"
                  >
                    {usuario.roles?.nombre === 'ADMIN' ? 'Administrador' : 'Docente'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <div className="mt-1">
                  <Badge 
                    variant={usuario.activo ? 'default' : 'destructive'}
                    className="text-base px-3 py-1"
                  >
                    {usuario.activo ? 'Usuario Activo' : 'Usuario Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial y fechas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Historial y Fechas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de creación</label>
                <p className="text-sm text-gray-900 mt-1">{usuario.createdAt ? formatDate(usuario.createdAt) : 'No disponible'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Última actualización</label>
                <p className="text-sm text-gray-900 mt-1">{usuario.updatedAt ? formatDate(usuario.updatedAt) : 'No disponible'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Último acceso</label>
                <p className="text-sm text-gray-900 mt-1">No disponible</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link href={`/admin/usuarios/${usuario.id}/editar`}>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Usuario
                </Button>
              </Link>
              
              <Button 
                variant={usuario.activo ? "destructive" : "default"}
                onClick={handleToggleStatus}
              >
                <Power className="mr-2 h-4 w-4" />
                {usuario.activo ? 'Desactivar' : 'Activar'} Usuario
              </Button>
              
              {usuario.roles?.nombre === 'DOCENTE' && (
                <Link href={`/admin/docentes?usuario=${usuario.id}`}>
                  <Button variant="outline">
                    <User className="mr-2 h-4 w-4" />
                    Ver perfil docente
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
