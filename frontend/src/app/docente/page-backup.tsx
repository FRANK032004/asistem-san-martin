'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useDashboard, useAsistencia } from '@/store/docente';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, BookOpen, Navigation } from 'lucide-react';
import { toast } from 'sonner';

export default function DocenteDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  // 🔥 Usar hooks optimizados del store
  const { dashboard, loading, error, cargar } = useDashboard();
  const { registrandoEntrada, registrandoSalida, registrarEntrada, registrarSalida } = useAsistencia();
  
  // 🔥 Usar hook de geolocalización mejorado
  const [obteniendoGPS, setObteniendoGPS] = useState(false);
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
    // 🔥 Cargar dashboard desde el store
    cargar();
  }, [user, router, cargar]);

  // Mostrar errores del store
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

  // 🔥 Función mejorada para registrar entrada con GPS de alta precisión
  const handleRegistrarEntrada = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible', {
        description: 'Tu navegador no soporta geolocalización',
      });
      return;
    }

    setObteniendoGPS(true);
    
    toast.info('Obteniendo ubicación GPS...', {
      description: 'Espera mientras obtenemos tu ubicación precisa',
      duration: 3000,
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Validar precisión GPS
        if (accuracy && accuracy > 100) {
          toast.warning('Precisión GPS baja', {
            description: `Precisión: ${Math.round(accuracy)}m. Se recomienda estar en exterior.`,
            duration: 5000,
          });
        }

        try {
          await registrarEntrada(latitude, longitude);
          toast.success('Entrada registrada', {
            description: `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy || 0)}m)`,
            duration: 5000,
          });
        } catch (error: any) {
          // El error ya se maneja en el store
          console.error('Error en entrada:', error);
        } finally {
          setObteniendoGPS(false);
        }
      },
      (error) => {
        setObteniendoGPS(false);
        toast.error('Error al obtener ubicación', {
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

  // 🔥 Función mejorada para registrar salida con GPS de alta precisión
  const handleRegistrarSalida = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible', {
        description: 'Tu navegador no soporta geolocalización',
      });
      return;
    }

    setObteniendoGPS(true);
    
    toast.info('Obteniendo ubicación GPS...', {
      description: 'Espera mientras obtenemos tu ubicación precisa',
      duration: 3000,
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Validar precisión GPS
        if (accuracy && accuracy > 100) {
          toast.warning('Precisión GPS baja', {
            description: `Precisión: ${Math.round(accuracy)}m. Se recomienda estar en exterior.`,
            duration: 5000,
          });
        }

        try {
          await registrarSalida(latitude, longitude);
          toast.success('Salida registrada', {
            description: `Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy || 0)}m)`,
            duration: 5000,
          });
        } catch (error: any) {
          // El error ya se maneja en el store
          console.error('Error en salida:', error);
        } finally {
          setObteniendoGPS(false);
        }
      },
      (error) => {
        setObteniendoGPS(false);
        toast.error('Error al obtener ubicación', {
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

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PRESENTE':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Presente</Badge>;
      case 'TARDANZA':
        return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" />Tardanza</Badge>;
      default:
        return <Badge variant="outline">Sin registrar</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel docente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar datos</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => cargar()}>Reintentar</Button>
          </div>
        </Card>
      </div>
    );
  }

  const asistenciaHoy = dashboard?.ultimasAsistencias?.[0];
  const esHoy = asistenciaHoy && new Date(asistenciaHoy.fecha).toDateString() === new Date().toDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Panel Docente</h1>
                <p className="text-sm text-gray-500">Sistema de Asistencia San Martín</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Buen día, {user?.nombres}!</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString('es-PE')}</p>
              </div>
              <Badge variant="outline">DOCENTE</Badge>
              <Button variant="outline" size="sm" onClick={logout}>Salir</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Estado de Hoy</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Entrada:</span>
                <span className="font-medium">{esHoy && asistenciaHoy?.horaEntrada ? formatearHora(asistenciaHoy.horaEntrada) : 'No registrada'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Salida:</span>
                <span className="font-medium">{esHoy && asistenciaHoy?.horaSalida ? formatearHora(asistenciaHoy.horaSalida) : 'No registrada'}</span>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Estadísticas del Mes</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboard?.estadisticas.asistenciasEsteMes || 0}</div>
                <div className="text-xs text-gray-500">Días asistidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dashboard?.estadisticas.puntualidad || 0}%</div>
                <div className="text-xs text-gray-500">Puntualidad</div>
              </div>
            </div>
          </Card>
        </div>
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-blue-600" />
            Registro de Asistencia
            {location.isSupported && location.accuracy && (
              <Badge variant="outline" className="ml-3">
                GPS: ±{Math.round(location.accuracy)}m
              </Badge>
            )}
          </h2>
          
          {/* Indicador de precisión GPS */}
          {location.isSupported && location.accuracy && (
            <div className={`mb-4 p-3 rounded-lg border ${
              location.accuracy <= 50 
                ? 'bg-green-50 border-green-200' 
                : location.accuracy <= 100 
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                <MapPin className={`w-4 h-4 mr-2 ${
                  location.accuracy <= 50 
                    ? 'text-green-600' 
                    : location.accuracy <= 100 
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`} />
                <span className="text-sm font-medium">
                  {location.accuracy <= 50 
                    ? '✅ Precisión GPS Excelente' 
                    : location.accuracy <= 100 
                    ? '⚠️ Precisión GPS Aceptable'
                    : '❌ Precisión GPS Baja - Intenta estar en exterior'}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex space-x-4">
            <Button 
              onClick={handleRegistrarEntrada} 
              disabled={obteniendoGPS || registrandoEntrada || (esHoy && !!asistenciaHoy?.horaEntrada)} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {obteniendoGPS || registrandoEntrada 
                ? 'Registrando...' 
                : (esHoy && asistenciaHoy?.horaEntrada 
                  ? '✓ Entrada Registrada' 
                  : 'Registrar Entrada')}
            </Button>
            <Button 
              onClick={handleRegistrarSalida} 
              disabled={obteniendoGPS || registrandoSalida || !(esHoy && asistenciaHoy?.horaEntrada) || (esHoy && !!asistenciaHoy?.horaSalida)} 
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {obteniendoGPS || registrandoSalida 
                ? 'Registrando...' 
                : (esHoy && asistenciaHoy?.horaSalida 
                  ? '✓ Salida Registrada' 
                  : 'Registrar Salida')}
            </Button>
          </div>
        </Card>

        {/* Próximo Horario */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
            Próximo Horario
          </h2>
          {dashboard?.proximoHorario ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-900">{dashboard.proximoHorario.dia}</span>
                <Badge variant="outline">{dashboard.proximoHorario.tipoClase || 'Clase'}</Badge>
              </div>
              <div className="flex items-center text-gray-700 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                <span>{dashboard.proximoHorario.horaInicio} - {dashboard.proximoHorario.horaFin}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <BookOpen className="w-4 h-4 mr-2" />
                <span>{dashboard.proximoHorario.area || 'Sin área'}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No tienes horarios asignados próximamente</p>
            </div>
          )}
        </Card>

        {/* Últimas Asistencias */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-600" />
            Últimas Asistencias
          </h2>
          {dashboard?.ultimasAsistencias && dashboard.ultimasAsistencias.length > 0 ? (
            <div className="space-y-3">
              {dashboard.ultimasAsistencias.slice(0, 5).map((asistencia) => (
                <div key={asistencia.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm font-medium">
                        {new Date(asistencia.fecha).toLocaleDateString('es-PE', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>
                        {asistencia.horaEntrada ? formatearHora(asistencia.horaEntrada) : '--:--'} - {' '}
                        {asistencia.horaSalida ? formatearHora(asistencia.horaSalida) : '--:--'}
                      </span>
                      {asistencia.tardanzaMinutos && asistencia.tardanzaMinutos > 0 && (
                        <span className="ml-2 text-orange-600">
                          (+{asistencia.tardanzaMinutos} min)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{asistencia.ubicacion || 'Sin ubicación'}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {getEstadoBadge(asistencia.estado)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No hay asistencias registradas</p>
              <p className="text-sm mt-1">Registra tu primera asistencia usando los botones de arriba</p>
            </div>
          )}
        </Card>

        {/* Acciones Rápidas */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card 
              className="p-6 hover:shadow-lg transition cursor-pointer border-2 hover:border-blue-500"
              onClick={() => router.push('/docente/horarios')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Ver Horarios</h3>
              <p className="text-sm text-gray-600">Consulta tus horarios asignados por día</p>
            </Card>

            <Card 
              className="p-6 hover:shadow-lg transition cursor-pointer border-2 hover:border-green-500"
              onClick={() => router.push('/docente/perfil')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <User className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Mi Perfil</h3>
              <p className="text-sm text-gray-600">Actualiza tus datos personales</p>
            </Card>

            <Card 
              className="p-6 hover:shadow-lg transition cursor-pointer border-2 hover:border-purple-500"
              onClick={() => router.push('/docente/historial')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Historial</h3>
              <p className="text-sm text-gray-600">Revisa tu historial de asistencias</p>
            </Card>

            <Card 
              className="p-6 hover:shadow-lg transition cursor-pointer border-2 hover:border-orange-500"
              onClick={() => router.push('/docente/justificaciones')}
            >
              <div className="flex items-center mb-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Justificaciones</h3>
              <p className="text-sm text-gray-600">Justifica tus ausencias</p>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
