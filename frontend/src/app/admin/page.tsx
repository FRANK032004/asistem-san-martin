'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  MapPin, 
  Clock, 
  BarChart3, 
  Settings, 
  BookOpen,
  Calendar,
  Shield,
  RefreshCw,
  AlertCircle,
  Home,
  FileText,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminStore } from '@/store/admin';
import { useAuthStore } from '@/store/auth';
import { justificacionService } from '@/services/justificacion-api.service';

export default function AdminPage() {
  const { estadisticas, isLoading, error, cargarEstadisticasAdmin } = useAdminStore();
  const { logout } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justificacionesPendientes, setJustificacionesPendientes] = useState(0);
  const [loadingJustificaciones, setLoadingJustificaciones] = useState(true);
  const [intentosRecarga, setIntentosRecarga] = useState(0);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    console.log('🔍 AdminPage mounted - Cargando estadísticas...');
    console.log('📍 Estado actual del store:', { estadisticas, isLoading, error });
    cargarEstadisticasAdmin();
    cargarJustificacionesPendientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar el componente

  // Debug: Ver qué hay en estadisticas
  useEffect(() => {
    console.log('📊 Estadísticas actuales:', estadisticas);
    console.log('⚠️ Error actual:', error);
    console.log('⏳ isLoading:', isLoading);
    
    // ALERTA VISUAL SI NO HAY DATOS
    if (!estadisticas && !isLoading) {
      console.warn('⚠️⚠️⚠️ NO HAY ESTADÍSTICAS CARGADAS ⚠️⚠️⚠️');
    }
  }, [estadisticas, error, isLoading]);

  // Auto-reintentar si las estadísticas no cargan (máximo 3 intentos)
  useEffect(() => {
    if (!estadisticas && !isLoading && !error && intentosRecarga < 3) {
      console.log(`🔄 Reintentando carga automática (intento ${intentosRecarga + 1}/3)...`);
      const timer = setTimeout(() => {
        setIntentosRecarga(prev => prev + 1);
        cargarEstadisticasAdmin();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadisticas, isLoading, error, intentosRecarga]);

  // Cargar justificaciones pendientes
  const cargarJustificacionesPendientes = async () => {
    try {
      setLoadingJustificaciones(true);
      const justificaciones = await justificacionService.obtenerJustificacionesPendientes();
      const pendientes = justificaciones.filter(j => j.estado === 'PENDIENTE').length;
      setJustificacionesPendientes(pendientes);
    } catch (error) {
      console.error('Error al cargar justificaciones:', error);
      setJustificacionesPendientes(0);
    } finally {
      setLoadingJustificaciones(false);
    }
  };

  // Función para refrescar datos
  const handleRefresh = async () => {
    console.log('🔄 Usuario presionó botón Actualizar');
    setIsRefreshing(true);
    setIntentosRecarga(0); // Resetear contador de intentos
    await cargarEstadisticasAdmin();
    await cargarJustificacionesPendientes();
    setIsRefreshing(false);
    console.log('✅ Actualización completada');
  };

  // Calcular estadísticas derivadas - USAR DATOS REALES SIN FALLBACKS
  const totalUsuarios = estadisticas?.totalUsuarios ?? 0;
  const porcentajeAsistencia = (estadisticas && estadisticas.totalDocentes > 0) ? 
    Math.round((estadisticas.docentesPresentes / estadisticas.totalDocentes) * 100) : 0;
  
  const menuItems = [
    {
      title: 'Usuarios',
      description: 'Gestionar usuarios del sistema',
      icon: Users,
      href: '/admin/usuarios',
      color: 'bg-blue-500',
      stats: `${totalUsuarios} usuarios`
    },
    {
      title: 'Docentes',
      description: 'Administrar docentes e información académica',
      icon: UserCheck,
      href: '/admin/docentes',
      color: 'bg-green-500',
      stats: `${estadisticas?.totalDocentes ?? 0} docentes`
    },
    {
      title: 'Asistencias',
      description: 'Registros y control de asistencia',
      icon: Clock,
      href: '/admin/asistencias',
      color: 'bg-orange-500',
      stats: `Hoy: ${porcentajeAsistencia}%`
    },
    {
      title: 'Ubicaciones',
      description: 'Gestionar ubicaciones y coordenadas GPS',
      icon: MapPin,
      href: '/admin/ubicaciones',
      color: 'bg-purple-500',
      stats: `${estadisticas?.totalUbicaciones || 0} ubicaciones`
    },
    {
      title: 'Horarios',
      description: 'Configurar horarios de clases',
      icon: Calendar,
      href: '/admin/horarios',
      color: 'bg-teal-500',
      stats: `${estadisticas?.totalHorarios || 0} horarios`
    },
    {
      title: 'Áreas',
      description: 'Administrar áreas académicas',
      icon: BookOpen,
      href: '/admin/areas',
      color: 'bg-indigo-500',
      stats: `${estadisticas?.totalAreas || 0} áreas`
    },
    {
      title: 'Justificaciones',
      description: 'Revisar y aprobar justificaciones',
      icon: FileText,
      href: '/admin/justificaciones',
      color: 'bg-yellow-500',
      stats: loadingJustificaciones ? '...' : `${justificacionesPendientes} pendientes`,
      badge: justificacionesPendientes > 0 ? justificacionesPendientes : undefined
    },
    {
      title: 'Planillas',
      description: 'Gestionar planillas de pago',
      icon: FileText,
      href: '/admin/planillas',
      color: 'bg-pink-500',
      stats: 'Mensual'
    },
    {
      title: 'Reportes',
      description: 'Generar reportes y estadísticas',
      icon: BarChart3,
      href: '/admin/reportes',
      color: 'bg-red-500',
      stats: 'Mensual'
    }
  ];

  const quickStats = [
    { 
      label: 'Total Usuarios', 
      value: totalUsuarios.toString(), 
      change: '+2', 
      trend: 'up' as const,
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Docentes Activos', 
      value: (estadisticas?.totalDocentes ?? 0).toString(), 
      change: estadisticas?.docentesPresentes ? `${estadisticas.docentesPresentes} presentes` : 'Sin registros hoy', 
      trend: (estadisticas?.docentesPresentes ?? 0) > 0 ? 'up' as const : 'stable' as const,
      icon: UserCheck,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'Asistencia Hoy', 
      value: porcentajeAsistencia > 0 ? `${porcentajeAsistencia}%` : 'Sin datos', 
      change: porcentajeAsistencia > 0 ? `Puntualidad: ${estadisticas?.puntualidadPromedio ?? 0}%` : 'Aún no hay asistencias', 
      trend: porcentajeAsistencia >= 90 ? 'up' as const : porcentajeAsistencia >= 75 ? 'stable' as const : porcentajeAsistencia > 0 ? 'down' as const : 'stable' as const,
      icon: Clock,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      label: 'Ubicaciones GPS', 
      value: (estadisticas?.totalUbicaciones ?? 0).toString(), 
      change: estadisticas?.alertasActivas ? `${estadisticas.alertasActivas} alertas` : 'Sin alertas', 
      trend: (estadisticas?.alertasActivas || 0) > 0 ? 'down' as const : 'stable' as const,
      icon: MapPin,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              Panel de Administración
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Instituto Superior Tecnológico San Martín
            </p>
            {estadisticas?.ultimaActualizacion && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                Última actualización: {new Date(estadisticas.ultimaActualizacion).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {/* Mostrar estado de carga */}
            {!estadisticas && !isLoading && error && (
              <Badge variant="destructive" className="text-xs shrink-0">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
            {estadisticas && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 shrink-0">
                Datos Reales
              </Badge>
            )}
            <Link href="/dashboard" className="shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                className="min-h-11"
              >
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Inicio</span>
              </Button>
            </Link>
            <Link href="/admin/configuraciones" className="shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                className="min-h-11"
              >
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Config</span>
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="min-h-11 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={logout}
              title="Cerrar Sesión"
              className="min-h-11 shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats - Grid responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card 
                key={index} 
                className={`transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                  isLoading ? 'animate-pulse' : ''
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-gray-500 mb-0.5 uppercase tracking-wide truncate">{stat.label}</p>
                      <p className={`text-base sm:text-lg font-bold ${
                        isLoading ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {isLoading ? '...' : stat.value}
                      </p>
                      <p className={`text-[9px] font-medium flex items-center gap-0.5 mt-0.5 ${
                        isLoading ? 'text-gray-400' : 
                        stat.trend === 'up' ? 'text-green-600' : 
                        stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {!isLoading && stat.trend === 'up' && '↗'}
                        {!isLoading && stat.trend === 'down' && '↘'}
                        {!isLoading && stat.trend === 'stable' && '→'}
                        {isLoading ? '...' : stat.change}
                      </p>
                    </div>
                    <div className={`p-1.5 rounded-md ${stat.bgColor} shrink-0 self-end sm:self-auto`}>
                      <IconComponent className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Menu Grid - 2 cols móvil, 3 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden min-h-[120px] touch-manipulation active:scale-95"
              >
                <Link href={item.href}>
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg ${item.color} text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 shrink-0">
                        {item.stats}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4 px-4">
                    <CardTitle className="text-sm sm:text-base mb-1 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </CardTitle>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </CardContent>
                  {/* Badge de notificación */}
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-lg animate-pulse">
                      {item.badge}
                    </div>
                  )}
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions - Optimizado para móvil */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/usuarios" className="flex-1 min-w-40 sm:flex-initial">
                <Button className="gap-2 w-full sm:w-auto min-h-11">
                  <Users className="h-4 w-4" />
                  Crear Usuario
                </Button>
              </Link>
              <Link href="/admin/docentes" className="flex-1 min-w-40 sm:flex-initial">
                <Button variant="outline" className="gap-2 w-full sm:w-auto min-h-11">
                  <UserCheck className="h-4 w-4" />
                  Registrar Docente
                </Button>
              </Link>
              <Link href="/admin/reportes" className="flex-1 min-w-40 sm:flex-initial">
                <Button variant="outline" className="gap-2 w-full sm:w-auto min-h-11">
                  <BarChart3 className="h-4 w-4" />
                  Ver Reportes
                </Button>
              </Link>
              <Link href="/admin/justificaciones" className="flex-1 min-w-40 sm:flex-initial">
                <Button variant="outline" className="gap-2 relative w-full sm:w-auto min-h-11">
                  <FileText className="h-4 w-4" />
                  Revisar Justificaciones
                  {justificacionesPendientes > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">
                      {justificacionesPendientes}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/admin/configuraciones" className="flex-1 min-w-40 sm:flex-initial">
                <Button variant="outline" className="gap-2 w-full sm:w-auto min-h-11">
                  <Settings className="h-4 w-4" />
                  Configurar Sistema
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>ASISTEM San Martín - Sistema de Gestión Académica v2.0</p>
          <p>© 2025 Instituto Superior Tecnológico San Martín</p>
        </div>
      </div>
    </div>
  );
}