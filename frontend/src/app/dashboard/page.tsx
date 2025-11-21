'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { useAsistenciaStore } from '@/store/asistencia';
import { useAdminStore } from '@/store/admin';
import { useGeolocation } from '@/hooks/useGeolocation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/ui/stat-card';
import Chart from '@/components/ui/chart';
import Loading, { CardSkeleton } from '@/components/ui/loading';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  LogOut,
  Calendar,
  TrendingUp,
  Users,
  Settings,
  Bell,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  MapIcon,
  Timer,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';

// Animaciones
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

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { 
    asistencias, 
    isLoading, 
    registrarEntrada 
  } = useAsistenciaStore();
  const { latitude, longitude, error: ubicacionError, loading: ubicacionLoading } = useGeolocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [registrandoAsistencia, setRegistrandoAsistencia] = useState(false);
  
  // Redireccionar docentes a su panel específico INMEDIATAMENTE
  useEffect(() => {
    if (user && user.rol?.nombre === 'DOCENTE') {
      // Redirigir inmediatamente sin renderizar nada
      window.location.href = '/docente';
    }
  }, [user]);

  // Si es docente, no renderizar nada mientras redirige
  if (user && user.rol?.nombre === 'DOCENTE') {
    return null;
  }
  
  // Crear objeto ubicacion para compatibilidad
  const ubicacion = latitude && longitude ? { latitude, longitude } : null;

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // NO cargar asistencias automáticamente - removido para evitar error 403

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleRegistrarAsistencia = async () => {
    if (!ubicacion || !user?.id) {
      toast.error('No se puede obtener la ubicación');
      return;
    }

    try {
      setRegistrandoAsistencia(true);
      const success = await registrarEntrada(ubicacion.latitude, ubicacion.longitude);
      if (success) {
        toast.success('¡Asistencia registrada correctamente!');
        // obtenerAsistenciasHoy(); // Removido para evitar error 403
      } else {
        toast.error('Error al registrar asistencia');
      }
    } catch (error) {
      toast.error('Error al registrar asistencia');
      console.error('Error:', error);
    } finally {
      setRegistrandoAsistencia(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" />
      
      {/* Header Profesional */}
      <motion.header 
        className="bg-white shadow-lg border-b border-slate-200"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  ASISTEM San Martín
                </h1>
                <p className="text-slate-600 text-sm">
                  Sistema de Asistencia Inteligente
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  {format(currentTime, 'EEEE, d MMMM yyyy', { locale: es })}
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {format(currentTime, 'HH:mm:ss')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Contenido Principal */}
      <motion.main 
        className="max-w-7xl mx-auto px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Bienvenida Personalizada */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  ¡Buen día, {user.nombres}! 👋
                </h2>
                <p className="text-blue-100">
                  {(typeof user.rol === 'string' ? user.rol : user.rol?.nombre) === 'Administrador' 
                    ? 'Panel de administración del sistema de asistencias'
                    : 'Registra tu asistencia de forma rápida y segura'
                  }
                </p>
              </div>
              <div className="flex items-center gap-4">
                {(typeof user.rol === 'string' ? user.rol : user.rol?.nombre) === 'Administrador' && (
                  <Button 
                    variant="secondary" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={() => window.location.href = '/admin'}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Panel Admin
                  </Button>
                )}
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {typeof user.rol === 'string' ? user.rol : user.rol?.nombre || 'Administrador'}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard según el rol */}
        {(typeof user.rol === 'string' ? user.rol : user.rol?.nombre) === 'Administrador' ? (
          <AdminDashboard />
        ) : (
          <DocenteDashboard 
            ubicacion={ubicacion}
            ubicacionError={ubicacionError}
            asistencias={asistencias}
            isLoading={isLoading}
            registrandoAsistencia={registrandoAsistencia}
            onRegistrarAsistencia={handleRegistrarAsistencia}
          />
        )}
      </motion.main>
    </div>
  );
}

// Componente Dashboard para Administradores - VERSIÓN MEJORADA
function AdminDashboard() {
  const { 
    estadisticas, 
    docentesEstado, 
    asistenciasSemana,
    puntualidadData,
    isLoading: adminLoading, 
    cargarEstadisticasAdmin, 
    cargarEstadoDocentes,
    cargarAsistenciasSemana,
    cargarDistribucionPuntualidad,
    exportarReporte 
  } = useAdminStore();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarEstadisticasAdmin();
    cargarEstadoDocentes();
    cargarAsistenciasSemana();
    cargarDistribucionPuntualidad();
  }, [cargarEstadisticasAdmin, cargarEstadoDocentes, cargarAsistenciasSemana, cargarDistribucionPuntualidad]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      cargarEstadisticasAdmin(),
      cargarEstadoDocentes(),
      cargarAsistenciasSemana(),
      cargarDistribucionPuntualidad()
    ]);
    toast.success('Datos actualizados');
    setRefreshing(false);
  };

  const handleExportar = async (tipo: 'pdf' | 'excel') => {
    await exportarReporte(tipo);
    toast.success(`Reporte ${tipo.toUpperCase()} generado exitosamente`);
  };

  if (adminLoading && !estadisticas) {
    return (
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <Loading message="Cargando estadísticas..." />
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header Mejorado */}
      <motion.div 
        className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Panel de Administración
          </h2>
          <p className="text-slate-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Última actualización: {estadisticas?.ultimaActualizacion ? 
              format(estadisticas.ultimaActualizacion, 'HH:mm:ss') : 'Cargando...'
            }
          </p>
        </div>
        
        <motion.div 
          className="flex gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportar('excel')}
            className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300"
          >
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportar('pdf')}
            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </motion.div>
      </motion.div>

      {/* Métricas Principales Mejoradas */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, staggerChildren: 0.1 }}
      >
        <StatCard
          title="Presentes Hoy"
          value={estadisticas?.docentesPresentes || 0}
          icon={<UserCheck className="h-4 w-4" />}
          color="green"
          description={`de ${estadisticas?.totalDocentes || 0} docentes`}
        />
        
        <StatCard
          title="Total Docentes"
          value={estadisticas?.totalDocentes || 0}
          icon={<Users className="h-4 w-4" />}
          color="blue"
          description="Activos en el sistema"
        />
        
        <StatCard
          title="Puntualidad"
          value={estadisticas?.puntualidadPromedio || 0}
          icon={<Clock className="h-4 w-4" />}
          color="purple"
          suffix="%"
          description="Promedio mensual"
        />
        
        <StatCard
          title="Alertas"
          value={estadisticas?.alertasActivas || 0}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="orange"
          description="Requieren atención"
        />
      </motion.div>

      {/* Gráficos de Análisis */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Chart
          title="Asistencias de la Semana"
          data={asistenciasSemana}
          type="bar"
          dataKey="presente"
          xAxisKey="name"
          color="#3B82F6"
          height={300}
        />
        
        <Chart
          title="Distribución de Puntualidad"
          data={puntualidadData}
          type="pie"
          dataKey="value"
          height={300}
        />
      </motion.div>

      {/* Estado de Docentes en Tiempo Real - Mejorado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Estado de Docentes en Tiempo Real
              </CardTitle>
              <motion.div
                className="flex items-center gap-2 text-sm text-green-600"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                En vivo
              </motion.div>
            </div>
          </CardHeader>
          <CardContent>
            {docentesEstado && docentesEstado.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {docentesEstado.map((docente, index) => {
                  // Debug: Log para ver la estructura de datos
                  console.log('Docente data:', {
                    id: docente.id,
                    nombres: docente.nombres,
                    apellidos: docente.apellidos,
                    area: docente.area,
                    nombre: (docente as any).nombre,
                    fullData: docente
                  });
                  
                  return (
                  <motion.div 
                    key={docente.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold"
                        whileHover={{ rotate: 5 }}
                      >
                        {(docente.nombres?.charAt(0) || '?')}{(docente.apellidos?.charAt(0) || '')}
                      </motion.div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {docente.nombres || docente.apellidos ? (
                            `${docente.nombres || ''} ${docente.apellidos || ''}`.trim()
                          ) : (
                            (docente as any).nombre || 'Nombre no disponible'
                          )}
                        </p>
                        <p className="text-sm text-slate-600">{docente.area || 'Sin área asignada'}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-200 px-3 py-1"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Presente
                    </Badge>
                  </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay registros para hoy</h3>
                <p className="text-slate-500">Los docentes aparecerán aquí cuando registren su asistencia</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Componente Dashboard para Docentes
function DocenteDashboard({ 
  ubicacion, 
  ubicacionError, 
  asistencias, 
  isLoading, 
  registrandoAsistencia, 
  onRegistrarAsistencia 
}: {
  ubicacion: { latitude: number; longitude: number } | null;
  ubicacionError: string | null;
  asistencias: any[];
  isLoading: boolean;
  registrandoAsistencia: boolean;
  onRegistrarAsistencia: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Panel de Registro GPS */}
      <motion.div variants={itemVariants}>
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <MapPin className="h-5 w-5 text-blue-600" />
              Registro de Asistencia GPS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Estado GPS */}
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border-2 ${
                ubicacion 
                  ? 'bg-green-50 border-green-200' 
                  : ubicacionError 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-3">
                  {ubicacion ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : ubicacionError ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600 animate-spin" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      ubicacion ? 'text-green-800' : ubicacionError ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {ubicacion 
                        ? '📍 Ubicación Obtenida'
                        : ubicacionError 
                          ? '❌ Error de Ubicación'
                          : '🔍 Obteniendo Ubicación...'
                      }
                    </p>
                    <p className={`text-sm ${
                      ubicacion ? 'text-green-600' : ubicacionError ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {ubicacion 
                        ? `Lat: ${ubicacion.latitude.toFixed(6)}, Lng: ${ubicacion.longitude.toFixed(6)}`
                        : ubicacionError 
                          ? ubicacionError
                          : 'Esperando permisos de geolocalización...'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de Registro */}
              <Button
                onClick={onRegistrarAsistencia}
                disabled={!ubicacion || registrandoAsistencia || isLoading}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                {registrandoAsistencia ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Registrando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Registrar Asistencia
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Panel de Historial */}
      <motion.div variants={itemVariants}>
        <Card className="h-full">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="h-5 w-5 text-slate-600" />
              Historial de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : asistencias.length > 0 ? (
              <div className="space-y-3">
                {asistencias.map((asistencia: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Entrada Registrada</p>
                        <p className="text-sm text-slate-600">
                          {format(new Date(asistencia.horaEntrada), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Presente
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No hay registros para hoy</p>
                <p className="text-sm">Registra tu primera asistencia</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
