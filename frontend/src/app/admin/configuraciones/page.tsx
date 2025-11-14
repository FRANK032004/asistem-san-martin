'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Settings,
  Save,
  RefreshCw,
  Shield,
  Clock,
  MapPin,
  Bell,
  Mail,
  Database,
  Globe,
  Smartphone,
  Monitor,
  Key,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useConfiguracionesStore, type TodasConfiguraciones } from '@/store/configuraciones';
import { toast } from 'sonner';
import { 
  configuracionGeneralSchema,
  configuracionAsistenciaSchema,
  type ConfiguracionGeneralForm,
  type ConfiguracionAsistenciaForm
} from '@/lib/validations/schemas-completos';

// ========== TIPOS Y INTERFACES ==========
interface ConfiguracionSistema {
  general: {
    nombreInstituto: string;
    logoUrl: string;
    direccion: string;
    telefono: string;
    email: string;
    sitioWeb: string;
    descripcion: string;
  };
  asistencia: {
    radioToleranciaGPS: number;
    tiempoGraciaEntrada: number;
    tiempoGraciaSalida: number;
    permitirRegistroOffline: boolean;
    validarUbicacionSalida: boolean;
    horasTrabajoMinimas: number;
  };
  notificaciones: {
    emailNotificaciones: boolean;
    notificacionesTardanza: boolean;
    notificacionesAusencia: boolean;
    recordatorioRegistro: boolean;
    horariosNotificacion: string[];
  };
  seguridad: {
    tiempoExpiracionSesion: number;
    intentosLoginMaximos: number;
    requiereConfirmacionEmail: boolean;
    forzarCambioPasswordInicial: boolean;
    longitudMinimaPassword: number;
  };
  sistema: {
    modoMantenimiento: boolean;
    mensajeMantenimiento: string;
    versionSistema: string;
    ultimaActualizacion: string;
    backupAutomatico: boolean;
    frecuenciaBackup: string;
  };
}

export default function ConfiguracionesAdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    configuraciones: configStore,
    cargando,
    cargarConfiguraciones,
    guardarConfiguraciones: guardarEnStore,
    restaurarDefecto
  } = useConfiguracionesStore();
  
  // ========== ESTADOS LOCALES ==========
  const [saving, setSaving] = useState(false);
  const [configuraciones, setConfiguraciones] = useState<TodasConfiguraciones | null>(null);
  const [configuracionesOriginales, setConfiguracionesOriginales] = useState<TodasConfiguraciones | null>(null);
  const [hayCambios, setHayCambios] = useState(false);

  // ========== REACT HOOK FORM - GENERAL ==========
  const {
    register: registerGeneral,
    formState: { errors: errorsGeneral },
    setValue: setValueGeneral,
    trigger: triggerGeneral,
  } = useForm<ConfiguracionGeneralForm>({
    resolver: zodResolver(configuracionGeneralSchema),
    mode: 'onChange',
  });

  // ========== REACT HOOK FORM - ASISTENCIA ==========
  const {
    register: registerAsistencia,
    formState: { errors: errorsAsistencia },
    setValue: setValueAsistencia,
    trigger: triggerAsistencia,
  } = useForm<ConfiguracionAsistenciaForm>({
    resolver: zodResolver(configuracionAsistenciaSchema),
    mode: 'onChange',
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
      cargarConfiguraciones();
    }
  }, [user, cargarConfiguraciones]);

  // Sincronizar configuraciones del store con estado local
  useEffect(() => {
    if (configStore) {
      setConfiguraciones(configStore);
      if (!configuracionesOriginales) {
        setConfiguracionesOriginales(configStore);
      }
      
      // Inicializar formulario General
      if (configStore.general) {
        Object.entries(configStore.general).forEach(([key, value]) => {
          setValueGeneral(key as keyof ConfiguracionGeneralForm, value);
        });
      }
      
      // Inicializar formulario Asistencia
      if (configStore.asistencia) {
        Object.entries(configStore.asistencia).forEach(([key, value]) => {
          setValueAsistencia(key as keyof ConfiguracionAsistenciaForm, value);
        });
      }
    }
  }, [configStore, configuracionesOriginales, setValueGeneral, setValueAsistencia]);

  // Detectar cambios
  useEffect(() => {
    if (configuraciones && configuracionesOriginales) {
      const cambios = JSON.stringify(configuraciones) !== JSON.stringify(configuracionesOriginales);
      setHayCambios(cambios);
    }
  }, [configuraciones, configuracionesOriginales]);

  // ========== FUNCIONES DE GUARDADO ==========
  const handleGuardarConfiguraciones = async () => {
    if (!configuraciones) return;
    
    // Validar formularios antes de guardar
    const generalValido = await triggerGeneral();
    const asistenciaValido = await triggerAsistencia();
    
    if (!generalValido || !asistenciaValido) {
      toast.error('Errores de validación', {
        description: 'Por favor, corrige los errores en el formulario antes de guardar',
        duration: 5000,
      });
      return;
    }
    
    setSaving(true);
    const success = await guardarEnStore(configuraciones);
    setSaving(false);
    
    if (success) {
      setConfiguracionesOriginales(configuraciones);
      setHayCambios(false);
    }
  };

  const restaurarConfiguraciones = () => {
    if (configuracionesOriginales) {
      setConfiguraciones(configuracionesOriginales);
      setHayCambios(false);
      toast('Configuraciones restauradas', { icon: 'ℹ️' });
    }
  };

  const handleRestaurarDefecto = async () => {
    const confirmacion = window.confirm(
      '¿Estás seguro de restaurar las configuraciones a los valores por defecto? Esta acción no se puede deshacer.'
    );
    
    if (confirmacion) {
      const success = await restaurarDefecto();
      if (success) {
        setHayCambios(false);
      }
    }
  };

  // ========== FUNCIONES DE UTILIDAD ==========
  const updateGeneral = (field: string, value: any) => {
    if (!configuraciones) return;
    setConfiguraciones(prev => prev ? ({
      ...prev,
      general: { ...prev.general, [field]: value }
    }) : null);
    setValueGeneral(field as keyof ConfiguracionGeneralForm, value);
    triggerGeneral(field as keyof ConfiguracionGeneralForm);
  };

  const updateAsistencia = (field: string, value: any) => {
    if (!configuraciones) return;
    setConfiguraciones(prev => prev ? ({
      ...prev,
      asistencia: { ...prev.asistencia, [field]: value }
    }) : null);
    setValueAsistencia(field as keyof ConfiguracionAsistenciaForm, value);
    triggerAsistencia(field as keyof ConfiguracionAsistenciaForm);
  };

  const updateNotificaciones = (field: string, value: any) => {
    if (!configuraciones) return;
    setConfiguraciones(prev => prev ? ({
      ...prev,
      notificaciones: { ...prev.notificaciones, [field]: value }
    }) : null);
  };

  const updateSeguridad = (field: string, value: any) => {
    if (!configuraciones) return;
    setConfiguraciones(prev => prev ? ({
      ...prev,
      seguridad: { ...prev.seguridad, [field]: value }
    }) : null);
  };

  const updateSistema = (field: string, value: any) => {
    if (!configuraciones) return;
    setConfiguraciones(prev => prev ? ({
      ...prev,
      sistema: { ...prev.sistema, [field]: value }
    }) : null);
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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/admin')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuraciones del Sistema</h1>
              <p className="text-gray-600">Parámetros generales y configuración avanzada</p>
            </div>
          </div>
          <div className="flex gap-4">
            {hayCambios && (
              <>
                <Button variant="outline" onClick={restaurarConfiguraciones} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Restaurar
                </Button>
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Cambios sin guardar
                </Badge>
              </>
            )}
            <Button 
              onClick={handleGuardarConfiguraciones} 
              disabled={!hayCambios || saving}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {cargando || !configuraciones ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuración General */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nombreInstituto">Nombre del Instituto</Label>
                  <Input
                    id="nombreInstituto"
                    value={configuraciones.general.nombreInstituto}
                    onChange={(e) => updateGeneral('nombreInstituto', e.target.value)}
                    className={errorsGeneral.nombreInstituto ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errorsGeneral.nombreInstituto && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errorsGeneral.nombreInstituto.message}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={configuraciones.general.direccion}
                    onChange={(e) => updateGeneral('direccion', e.target.value)}
                    className={errorsGeneral.direccion ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errorsGeneral.direccion && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errorsGeneral.direccion.message}</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={configuraciones.general.telefono}
                      onChange={(e) => updateGeneral('telefono', e.target.value)}
                      placeholder="999999999"
                      className={errorsGeneral.telefono ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {errorsGeneral.telefono && (
                      <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{errorsGeneral.telefono.message}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={configuraciones.general.email}
                      onChange={(e) => updateGeneral('email', e.target.value)}
                      placeholder="contacto@instituto.edu.pe"
                      className={errorsGeneral.email ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {errorsGeneral.email && (
                      <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{errorsGeneral.email.message}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="sitioWeb">Sitio Web</Label>
                  <Input
                    id="sitioWeb"
                    value={configuraciones.general.sitioWeb}
                    onChange={(e) => updateGeneral('sitioWeb', e.target.value)}
                    placeholder="https://www.instituto.edu.pe"
                    className={errorsGeneral.sitioWeb ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errorsGeneral.sitioWeb && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errorsGeneral.sitioWeb.message}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={configuraciones.general.descripcion}
                    onChange={(e) => updateGeneral('descripcion', e.target.value)}
                    rows={3}
                    placeholder="Descripción de la institución..."
                    className={errorsGeneral.descripcion ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errorsGeneral.descripcion && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errorsGeneral.descripcion.message}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Configuración de Asistencias */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  Control de Asistencias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="radioGPS">Radio de Tolerancia GPS (metros)</Label>
                  <Input
                    id="radioGPS"
                    type="number"
                    min="10"
                    max="1000"
                    value={configuraciones.asistencia.radioToleranciaGPS}
                    onChange={(e) => updateAsistencia('radioToleranciaGPS', parseInt(e.target.value) || 0)}
                    className={errorsAsistencia.radioToleranciaGPS ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errorsAsistencia.radioToleranciaGPS && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errorsAsistencia.radioToleranciaGPS.message}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Rango válido: 10 - 1000 metros</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="graciaEntrada">Tiempo Gracia Entrada (min)</Label>
                    <Input
                      id="graciaEntrada"
                      type="number"
                      min="0"
                      max="60"
                      value={configuraciones.asistencia.tiempoGraciaEntrada}
                      onChange={(e) => updateAsistencia('tiempoGraciaEntrada', parseInt(e.target.value) || 0)}
                      className={errorsAsistencia.tiempoGraciaEntrada ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {errorsAsistencia.tiempoGraciaEntrada && (
                      <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{errorsAsistencia.tiempoGraciaEntrada.message}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="graciaSalida">Tiempo Gracia Salida (min)</Label>
                    <Input
                      id="graciaSalida"
                      type="number"
                      min="0"
                      max="60"
                      value={configuraciones.asistencia.tiempoGraciaSalida}
                      onChange={(e) => updateAsistencia('tiempoGraciaSalida', parseInt(e.target.value) || 0)}
                      className={errorsAsistencia.tiempoGraciaSalida ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {errorsAsistencia.tiempoGraciaSalida && (
                      <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{errorsAsistencia.tiempoGraciaSalida.message}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="horasMinimas">Horas de Trabajo Mínimas</Label>
                  <Input
                    id="horasMinimas"
                    type="number"
                    min="1"
                    max="12"
                    value={configuraciones.asistencia.horasTrabajoMinimas}
                    onChange={(e) => updateAsistencia('horasTrabajoMinimas', parseInt(e.target.value) || 0)}
                    className={errorsAsistencia.horasTrabajoMinimas ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {errorsAsistencia.horasTrabajoMinimas && (
                    <div className="flex items-center gap-1.5 text-sm text-red-600 mt-1.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{errorsAsistencia.horasTrabajoMinimas.message}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Rango válido: 1 - 12 horas</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="registroOffline"
                      checked={configuraciones.asistencia.permitirRegistroOffline}
                      onCheckedChange={(checked: boolean) => updateAsistencia('permitirRegistroOffline', checked)}
                    />
                    <Label htmlFor="registroOffline">Permitir registro offline</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="validarSalida"
                      checked={configuraciones.asistencia.validarUbicacionSalida}
                      onCheckedChange={(checked: boolean) => updateAsistencia('validarUbicacionSalida', checked)}
                    />
                    <Label htmlFor="validarSalida">Validar ubicación en salida</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Configuración de Notificaciones */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-500" />
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNotif"
                      checked={configuraciones.notificaciones.emailNotificaciones}
                      onCheckedChange={(checked: boolean) => updateNotificaciones('emailNotificaciones', checked)}
                    />
                    <Label htmlFor="emailNotif">Notificaciones por email</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notifTardanza"
                      checked={configuraciones.notificaciones.notificacionesTardanza}
                      onCheckedChange={(checked: boolean) => updateNotificaciones('notificacionesTardanza', checked)}
                    />
                    <Label htmlFor="notifTardanza">Notificar tardanzas</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notifAusencia"
                      checked={configuraciones.notificaciones.notificacionesAusencia}
                      onCheckedChange={(checked: boolean) => updateNotificaciones('notificacionesAusencia', checked)}
                    />
                    <Label htmlFor="notifAusencia">Notificar ausencias</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recordatorio"
                      checked={configuraciones.notificaciones.recordatorioRegistro}
                      onCheckedChange={(checked: boolean) => updateNotificaciones('recordatorioRegistro', checked)}
                    />
                    <Label htmlFor="recordatorio">Recordatorios de registro</Label>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label>Horarios de Notificación</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      type="time"
                      value={configuraciones.notificaciones.horariosNotificacion[0] || '08:00'}
                      onChange={(e) => updateNotificaciones('horariosNotificacion', [e.target.value, configuraciones.notificaciones.horariosNotificacion[1]])}
                    />
                    <Input
                      type="time"
                      value={configuraciones.notificaciones.horariosNotificacion[1] || '17:00'}
                      onChange={(e) => updateNotificaciones('horariosNotificacion', [configuraciones.notificaciones.horariosNotificacion[0], e.target.value])}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Configuración de Seguridad */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="expiracionSesion">Expiración de Sesión (minutos)</Label>
                  <Input
                    id="expiracionSesion"
                    type="number"
                    min="30"
                    max="1440"
                    value={configuraciones.seguridad.tiempoExpiracionSesion}
                    onChange={(e) => updateSeguridad('tiempoExpiracionSesion', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="intentosLogin">Intentos Login Máximos</Label>
                    <Input
                      id="intentosLogin"
                      type="number"
                      min="3"
                      max="10"
                      value={configuraciones.seguridad.intentosLoginMaximos}
                      onChange={(e) => updateSeguridad('intentosLoginMaximos', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitudPassword">Longitud Mínima Password</Label>
                    <Input
                      id="longitudPassword"
                      type="number"
                      min="6"
                      max="20"
                      value={configuraciones.seguridad.longitudMinimaPassword}
                      onChange={(e) => updateSeguridad('longitudMinimaPassword', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="confirmEmail"
                      checked={configuraciones.seguridad.requiereConfirmacionEmail}
                      onCheckedChange={(checked: boolean) => updateSeguridad('requiereConfirmacionEmail', checked)}
                    />
                    <Label htmlFor="confirmEmail">Confirmar email al registrar</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cambioPassword"
                      checked={configuraciones.seguridad.forzarCambioPasswordInicial}
                      onCheckedChange={(checked: boolean) => updateSeguridad('forzarCambioPasswordInicial', checked)}
                    />
                    <Label htmlFor="cambioPassword">Forzar cambio password inicial</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Configuración del Sistema */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-purple-500" />
                  Sistema y Mantenimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="modoMantenimiento"
                        checked={configuraciones.sistema.modoMantenimiento}
                        onCheckedChange={(checked: boolean) => updateSistema('modoMantenimiento', checked)}
                      />
                      <Label htmlFor="modoMantenimiento">Modo mantenimiento</Label>
                      {configuraciones.sistema.modoMantenimiento && (
                        <Badge variant="secondary" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Activo
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="mensajeMantenimiento">Mensaje de Mantenimiento</Label>
                      <Textarea
                        id="mensajeMantenimiento"
                        value={configuraciones.sistema.mensajeMantenimiento}
                        onChange={(e) => updateSistema('mensajeMantenimiento', e.target.value)}
                        rows={3}
                        disabled={!configuraciones.sistema.modoMantenimiento}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="backupAuto"
                        checked={configuraciones.sistema.backupAutomatico}
                        onCheckedChange={(checked: boolean) => updateSistema('backupAutomatico', checked)}
                      />
                      <Label htmlFor="backupAuto">Backup automático</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="frecuenciaBackup">Frecuencia de Backup</Label>
                      <Select 
                        value={configuraciones.sistema.frecuenciaBackup} 
                        onValueChange={(value) => updateSistema('frecuenciaBackup', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diario">Diario</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensual">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Información del Sistema</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Versión:</span>
                          <Badge variant="outline">{configuraciones.sistema.versionSistema}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Última actualización:</span>
                          <span className="text-sm font-medium">{configuraciones.sistema.ultimaActualizacion}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Estado:</span>
                          <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Operativo
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="gap-2">
                        <Database className="h-4 w-4" />
                        Crear Backup
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Globe className="h-4 w-4" />
                        Verificar Conexión
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Footer de confirmación */}
      {hayCambios && (
        <motion.div 
          variants={itemVariants}
          className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Tienes cambios sin guardar
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={restaurarConfiguraciones}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleGuardarConfiguraciones} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
