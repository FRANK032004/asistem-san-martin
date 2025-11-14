'use client';

/**
 * 🎨 DASHBOARD DOCENTE PROFESIONAL - VERSIÓN EMPRESARIAL
 * Diseñado con estándares enterprise-grade
 * - Gradientes modernos y sombras elegantes
 * - Animaciones suaves y micro-interacciones
 * - Gráficos profesionales integrados
 * - Feedback visual completo
 * - Diseño responsive y accesible
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useDashboard, useAsistencia } from '@/store/docente';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  BookOpen, 
  Navigation,
  Award,
  Target,
  Activity,
  Zap,
  Star,
  Timer,
  MapPinned
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocenteDashboardProfessional() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const { dashboard, loading, error, cargar } = useDashboard();
  const { registrandoEntrada, registrandoSalida, registrarEntrada, registrarSalida } = useAsistencia();
  
  const [obteniendoGPS, setObteniendoGPS] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const location = useGeolocation({ 
    enableHighAccuracy: true,
    timeout: 15000,
    watch: false 
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.rol?.nombre !== 'DOCENTE') {
      router.push('/dashboard');
      return;
    }
    cargar();
  }, [user, router, cargar]);

  useEffect(() => {
    if (error) {
      toast.error('Error al cargar dashboard', {
        description: error,
        duration: 5000,
      });
    }
  }, [error]);

  if (!user || user.rol?.nombre !== 'DOCENTE') {
    return null;
  }

  const handleRegistrarEntrada = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible', {
        description: 'Tu navegador no soporta geolocalización',
      });
      return;
    }

    setObteniendoGPS(true);
    
    toast.info('📍 Obteniendo ubicación GPS...', {
      description: 'Espera mientras obtenemos tu ubicación precisa',
      duration: 3000,
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        if (accuracy && accuracy > 100) {
          toast.warning('⚠️ Precisión GPS baja', {
            description: `Precisión: ${Math.round(accuracy)}m. Se recomienda estar en exterior.`,
            duration: 5000,
          });
        }

        try {
          await registrarEntrada(latitude, longitude);
          setShowSuccessAnimation(true);
          setTimeout(() => setShowSuccessAnimation(false), 3000);
          
          toast.success('✅ Entrada registrada exitosamente', {
            description: `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            duration: 5000,
          });
          
          await cargar(); // Recargar dashboard
        } catch (error: any) {
          console.error('Error en entrada:', error);
        } finally {
          setObteniendoGPS(false);
        }
      },
      (error) => {
        setObteniendoGPS(false);
        toast.error('❌ Error al obtener ubicación', {
          description: error.message || 'No se pudo obtener tu ubicación',
          duration: 5000,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleRegistrarSalida = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible');
      return;
    }

    setObteniendoGPS(true);
    
    toast.info('📍 Obteniendo ubicación GPS...', {
      duration: 3000,
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          await registrarSalida(latitude, longitude);
          setShowSuccessAnimation(true);
          setTimeout(() => setShowSuccessAnimation(false), 3000);
          
          toast.success('✅ Salida registrada exitosamente', {
            description: `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            duration: 5000,
          });
          
          await cargar();
        } catch (error: any) {
          console.error('Error en salida:', error);
        } finally {
          setObteniendoGPS(false);
        }
      },
      (error) => {
        setObteniendoGPS(false);
        toast.error('❌ Error al obtener ubicación', {
          description: error.message,
          duration: 5000,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const formatearHora = (fecha: string | null) => {
    if (!fecha) return '--:--';
    return new Date(fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PRESENTE':
        return <Badge className="bg-green-500 hover:bg-green-600 transition-colors"><CheckCircle className="w-3 h-3 mr-1" />Presente</Badge>;
      case 'TARDANZA':
        return <Badge className="bg-orange-500 hover:bg-orange-600 transition-colors"><Clock className="w-3 h-3 mr-1" />Tardanza</Badge>;
      default:
        return <Badge variant="outline">Sin registrar</Badge>;
    }
  };

  // Loading state mejorado
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-white font-medium text-lg">Cargando panel docente...</p>
          <p className="text-blue-200 text-sm mt-2">Preparando tu espacio de trabajo</p>
        </div>
      </div>
    );
  }

  // Error state mejorado
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md shadow-2xl border-2 border-red-200">
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar datos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => cargar()} 
              className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const asistenciaHoy = dashboard?.ultimasAsistencias?.[0];
  const esHoy = asistenciaHoy && new Date(asistenciaHoy.fecha).toDateString() === new Date().toDateString();
  const yaRegistroEntrada = Boolean(esHoy && asistenciaHoy?.horaEntrada);
  const yaRegistroSalida = Boolean(esHoy && asistenciaHoy?.horaSalida);

  // Calcular racha y logros
  const diasConsecutivos = dashboard?.estadisticas?.asistenciasEsteMes || 0;
  const puntualidad = dashboard?.estadisticas?.puntualidad || 0;
  const esExcelente = puntualidad >= 95;
  const esBueno = puntualidad >= 85;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 🎨 Header Profesional con Gradiente */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  Panel Docente
                  {esExcelente && <Star className="w-5 h-5 ml-2 text-yellow-300 fill-yellow-300 animate-pulse" />}
                </h1>
                <p className="text-blue-100 text-sm">Sistema de Asistencia San Martín</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-semibold">Buen día, {user?.nombres}! 👋</p>
                <p className="text-blue-100 text-sm">{new Date().toLocaleDateString('es-PE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all">
                DOCENTE
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 transition-all"
              >
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 🎯 Sección de Estado y Logros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card: Estado de Hoy */}
          <Card className="p-6 bg-linear-to-br from-white to-blue-50 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Estado de Hoy</h3>
              {yaRegistroEntrada && (
                <div className="animate-pulse">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Entrada</span>
                </div>
                <span className={`font-bold ${yaRegistroEntrada ? 'text-green-600' : 'text-gray-400'}`}>
                  {yaRegistroEntrada && asistenciaHoy ? formatearHora(asistenciaHoy.horaEntrada) : 'No registrada'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Salida</span>
                </div>
                <span className={`font-bold ${yaRegistroSalida ? 'text-green-600' : 'text-gray-400'}`}>
                  {yaRegistroSalida && asistenciaHoy ? formatearHora(asistenciaHoy.horaSalida) : 'No registrada'}
                </span>
              </div>
            </div>
            {yaRegistroEntrada && asistenciaHoy && (
              <div className="mt-4 pt-3 border-t border-blue-100">
                {getEstadoBadge(asistenciaHoy.estado)}
              </div>
            )}
          </Card>

          {/* Card: Días Asistidos */}
          <Card className="p-6 bg-linear-to-br from-white to-green-50 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-green-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <CalendarDays className="w-8 h-8 text-green-600" />
              {diasConsecutivos > 10 && <Award className="w-6 h-6 text-yellow-500 animate-bounce" />}
            </div>
            <div className="mt-4">
              <div className="text-4xl font-bold text-green-600 mb-1">
                {dashboard?.estadisticas.asistenciasEsteMes || 0}
              </div>
              <div className="text-sm text-gray-600">Días asistidos este mes</div>
              {diasConsecutivos > 5 && (
                <div className="mt-3 px-3 py-1 bg-green-100 rounded-full text-xs font-medium text-green-700 inline-block">
                  🔥 ¡{diasConsecutivos} días consecutivos!
                </div>
              )}
            </div>
          </Card>

          {/* Card: Puntualidad */}
          <Card className="p-6 bg-linear-to-br from-white to-amber-50 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-amber-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-amber-600" />
              {esExcelente && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-pulse" />}
            </div>
            <div className="mt-4">
              <div className="text-4xl font-bold text-amber-600 mb-1">
                {dashboard?.estadisticas.puntualidad || 0}%
              </div>
              <div className="text-sm text-gray-600">Puntualidad</div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      esExcelente ? 'bg-green-500' : esBueno ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${puntualidad}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs font-medium">
                  {esExcelente ? '🌟 ¡Excelente!' : esBueno ? '👍 Muy bien' : '💪 Sigue mejorando'}
                </div>
              </div>
            </div>
          </Card>

          {/* Card: Próxima Clase */}
          <Card className="p-6 bg-linear-to-br from-white to-purple-50 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-purple-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <Timer className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Próxima Clase</div>
              {dashboard?.proximoHorario ? (
                <>
                  <div className="text-lg font-bold text-purple-600">
                    {dashboard.proximoHorario.area}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatearHora(dashboard.proximoHorario.horaInicio)} - {formatearHora(dashboard.proximoHorario.horaFin)}
                  </div>
                  <Badge className="mt-2 bg-purple-100 text-purple-700">
                    {dashboard.proximoHorario.dia}
                  </Badge>
                </>
              ) : (
                <div className="text-gray-400 text-sm py-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  No hay clases programadas
                </div>
              )}
            </div>
          </Card>

        </div>

        {/* 📍 Sección de Registro GPS Mejorado */}
        <Card className="p-8 mb-8 bg-linear-to-br from-white to-slate-50 shadow-xl border-2 border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Navigation className="w-7 h-7 mr-3 text-blue-600" />
              Registro de Asistencia
            </h2>
            {location.isSupported && location.accuracy && (
              <Badge 
                variant="outline" 
                className={`text-sm px-4 py-2 ${
                  location.accuracy <= 50 
                    ? 'bg-green-50 border-green-300 text-green-700' 
                    : location.accuracy <= 100 
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'bg-red-50 border-red-300 text-red-700'
                }`}
              >
                <MapPinned className="w-4 h-4 mr-2" />
                GPS: ±{Math.round(location.accuracy)}m
              </Badge>
            )}
          </div>
          
          {/* Indicador de precisión GPS mejorado */}
          {location.isSupported && location.accuracy && (
            <div className={`mb-6 p-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 ${
              location.accuracy <= 50 
                ? 'bg-green-50/80 border-green-300 shadow-green-100' 
                : location.accuracy <= 100 
                ? 'bg-yellow-50/80 border-yellow-300 shadow-yellow-100'
                : 'bg-red-50/80 border-red-300 shadow-red-100'
            } shadow-lg`}>
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  location.accuracy <= 50 
                    ? 'bg-green-100' 
                    : location.accuracy <= 100 
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
                }`}>
                  <MapPin className={`w-5 h-5 ${
                    location.accuracy <= 50 
                      ? 'text-green-600' 
                      : location.accuracy <= 100 
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`} />
                </div>
                <div className="ml-4 flex-1">
                  <span className="text-sm font-semibold">
                    {location.accuracy <= 50 
                      ? '✅ Precisión GPS Excelente - Listo para registrar' 
                      : location.accuracy <= 100 
                      ? '⚠️ Precisión GPS Aceptable - Puedes registrar'
                      : '❌ Precisión GPS Baja - Intenta estar en exterior'}
                  </span>
                  <div className="mt-1 text-xs text-gray-600">
                    Precisión: ±{Math.round(location.accuracy)} metros
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción mejorados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleRegistrarEntrada}
              disabled={registrandoEntrada || obteniendoGPS || yaRegistroEntrada}
              className="h-16 text-lg font-semibold bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {registrandoEntrada || obteniendoGPS ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {obteniendoGPS ? 'Obteniendo GPS...' : 'Registrando...'}
                </>
              ) : yaRegistroEntrada ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Entrada ya registrada ✓
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Registrar Entrada
                </>
              )}
            </Button>

            <Button
              onClick={handleRegistrarSalida}
              disabled={registrandoSalida || obteniendoGPS || !yaRegistroEntrada || yaRegistroSalida}
              className="h-16 text-lg font-semibold bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {registrandoSalida || obteniendoGPS ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {obteniendoGPS ? 'Obteniendo GPS...' : 'Registrando...'}
                </>
              ) : yaRegistroSalida ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Salida ya registrada ✓
                </>
              ) : !yaRegistroEntrada ? (
                <>
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Primero registra entrada
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 mr-2" />
                  Registrar Salida
                </>
              )}
            </Button>
          </div>

          {/* Información adicional */}
          {!location.isSupported && (
            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <span className="text-sm text-yellow-800">
                  Geolocalización no disponible en tu navegador
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* 📊 Sección de Gráficos Profesionales - PENDIENTE: Agregar endpoints de tendencia */}
        {/* TODO: Implementar endpoints de tendencia y distribución en el backend
        {dashboard?.tendencia && dashboard.tendencia.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            <Card className="p-6 shadow-xl border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                  Tendencia de Asistencias
                </h3>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                  Últimos 7 días
                </Badge>
              </div>
              <TendenciaAsistenciaChart 
                data={dashboard.tendencia}
                height={300}
              />
            </Card>

            {dashboard?.distribucion && (
              <Card className="p-6 shadow-xl border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-600" />
                    Distribución de Asistencias
                  </h3>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    Este mes
                  </Badge>
                </div>
                <DistribucionAsistenciaChart 
                  data={dashboard.distribucion}
                  height={300}
                />
              </Card>
            )}

          </div>
        )}
        */}

        {/* 📋 Historial Reciente Mejorado */}
        {dashboard?.ultimasAsistencias && dashboard.ultimasAsistencias.length > 0 && (
          <Card className="p-6 shadow-xl border-2 border-slate-100 bg-linear-to-br from-white to-slate-50">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-slate-600" />
              Historial Reciente
            </h3>
            <div className="space-y-3">
              {dashboard.ultimasAsistencias.slice(0, 5).map((asistencia, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      asistencia.estado === 'PRESENTE' 
                        ? 'bg-green-100' 
                        : asistencia.estado === 'TARDANZA' 
                        ? 'bg-orange-100'
                        : 'bg-red-100'
                    }`}>
                      <CalendarDays className={`w-5 h-5 ${
                        asistencia.estado === 'PRESENTE' 
                          ? 'text-green-600' 
                          : asistencia.estado === 'TARDANZA' 
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {new Date(asistencia.fecha).toLocaleDateString('es-PE', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        Entrada: {asistencia.horaEntrada ? formatearHora(asistencia.horaEntrada) : '--:--'} 
                        {asistencia.horaSalida && ` • Salida: ${formatearHora(asistencia.horaSalida)}`}
                      </div>
                    </div>
                  </div>
                  <div>
                    {getEstadoBadge(asistencia.estado)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                variant="outline"
                onClick={() => router.push('/docente/historial')}
                className="hover:bg-slate-100"
              >
                Ver historial completo
              </Button>
            </div>
          </Card>
        )}

      </div>

      {/* 🎉 Animación de éxito */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="animate-ping absolute h-32 w-32 rounded-full bg-green-400 opacity-75"></div>
          <CheckCircle className="h-24 w-24 text-green-500 animate-bounce" />
        </div>
      )}
    </div>
  );
}
