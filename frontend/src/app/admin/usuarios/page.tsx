'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Power, Trash2, MoreHorizontal, Users, Mail, Calendar, Clock, Shield, User, Save, X, Phone, CreditCard, Lock, EyeOff, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { usuarioService, type Usuario, type ActualizarUsuarioDto } from '@/services/usuario-api.service';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editarUsuarioSchema, type EditarUsuarioForm, crearUsuarioSchema, type CrearUsuarioForm } from '@/lib/validations/usuario';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

// ============================================
// COMPONENTE: Modal de Detalles del Usuario
// ============================================
interface ModalDetallesProps {
  usuario: Usuario | null;
  isOpen: boolean;
  onClose: () => void;
  onEditar: (usuario: Usuario) => void;
}

function ModalDetallesUsuario({ usuario, isOpen, onClose, onEditar }: ModalDetallesProps) {
  if (!usuario) return null;

  const handleEditarClick = () => {
    onClose(); // Cerrar modal de detalles
    onEditar(usuario); // Abrir modal de editar
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            {usuario.nombres} {usuario.apellidos}
          </DialogTitle>
          <DialogDescription>
            Información completa del usuario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Cards de Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Estado</p>
                    <Badge 
                      variant={usuario.activo ? "default" : "secondary"}
                      className={usuario.activo ? "bg-green-500" : "bg-gray-500"}
                    >
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <Power className={`h-8 w-8 ${usuario.activo ? 'text-green-500' : 'text-gray-500'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rol</p>
                    <Badge 
                      variant="outline"
                      className={
                        usuario.roles?.nombre === 'ADMIN' 
                          ? 'border-purple-500 text-purple-700 bg-purple-50' 
                          : 'border-blue-500 text-blue-700 bg-blue-50'
                      }
                    >
                      {usuario.roles?.nombre === 'ADMIN' ? 'Administrador' : 'Docente'}
                    </Badge>
                  </div>
                  <Shield className={`h-8 w-8 ${usuario.roles?.nombre === 'ADMIN' ? 'text-purple-500' : 'text-blue-500'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Creado</p>
                    <p className="text-sm text-gray-900">
                      {usuario.createdAt 
                        ? format(new Date(usuario.createdAt), 'dd/MM/yyyy', { locale: es })
                        : 'No disponible'}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Información específica de Docente */}
          {usuario.roles?.nombre === 'DOCENTE' && usuario.docente && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Información de Docente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Código de Docente</p>
                      <p className="text-base font-semibold text-gray-900">{usuario.docente?.codigoDocente}</p>
                    </div>
                    {usuario.docente.area && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Área Asignada</p>
                        <Badge variant="outline" className="text-base">
                          {usuario.docente?.area?.nombre}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Separator />
            </>
          )}

          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombres</p>
                  <p className="text-base font-semibold text-gray-900">{usuario.nombres}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Apellidos</p>
                  <p className="text-base font-semibold text-gray-900">{usuario.apellidos}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">DNI</p>
                  <p className="text-base font-semibold text-gray-900">{usuario.dni}</p>
                </div>
                {usuario.telefono && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p className="text-base font-semibold text-gray-900">{usuario.telefono}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Información del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-base text-gray-900">{usuario.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Rol en el sistema</p>
                  <Badge 
                    variant="outline"
                    className={
                      usuario.roles?.nombre === 'ADMIN' 
                        ? 'border-purple-500 text-purple-700 bg-purple-50' 
                        : 'border-blue-500 text-blue-700 bg-blue-50'
                    }
                  >
                    {usuario.roles?.nombre === 'ADMIN' ? 'Administrador' : 'Docente'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <Badge 
                    variant={usuario.activo ? "default" : "secondary"}
                    className={usuario.activo ? "bg-green-500" : "bg-gray-500"}
                  >
                    {usuario.activo ? 'Usuario Activo' : 'Usuario Inactivo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Historial y Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Historial y Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Fecha de creación</p>
                  <p className="text-base text-gray-900">
                    {usuario.createdAt 
                      ? format(new Date(usuario.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: es })
                      : 'No disponible'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Última actualización</p>
                  <p className="text-base text-gray-900">
                    {usuario.updatedAt 
                      ? format(new Date(usuario.updatedAt), "dd 'de' MMMM 'de' yyyy", { locale: es })
                      : 'No disponible'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Cerrar
            </Button>
            <Button 
              className="gap-2"
              onClick={handleEditarClick}
            >
              <Edit className="h-4 w-4" />
              Editar Usuario
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: Modal de Editar Usuario
// ============================================
interface ModalEditarProps {
  usuario: Usuario | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalEditarUsuario({ usuario, isOpen, onClose, onSuccess }: ModalEditarProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { user: usuarioActual, logout } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<EditarUsuarioForm>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      email: '',
      dni: '',
      telefono: '',
      rol: 'DOCENTE',
      activo: true,
      password: '',
      confirmPassword: ''
    }
  });

  // Verificar si el usuario está editando su propia cuenta
  const esUsuarioActual = usuarioActual?.id === usuario?.id;

  // 🔔 Detectar cambio de rol para mostrar advertencia
  const rolActual = watch('rol');
  const rolOriginal = usuario?.roles.nombre;
  const cambioRol = rolActual !== rolOriginal;
  const cambioDocenteAAdmin = rolOriginal === 'DOCENTE' && rolActual === 'ADMIN';
  const cambioAdminADocente = rolOriginal === 'ADMIN' && rolActual === 'DOCENTE';

  // Cargar datos del usuario en el formulario cuando se abre el modal
  useEffect(() => {
    if (usuario && isOpen) {
      console.log('🔄 Cargando datos en formulario:', {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        rol: usuario.roles?.nombre,
        activo: usuario.activo,
        email: usuario.email
      });
      
      reset({
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        dni: usuario.dni,
        telefono: usuario.telefono || '',
        rol: usuario.roles?.nombre as 'ADMIN' | 'DOCENTE',
        activo: usuario.activo,
        password: '',
        confirmPassword: ''
      });
    }
  }, [usuario, isOpen, reset]);

  const onSubmit = async (formData: EditarUsuarioForm) => {
    if (!usuario) return;
    
    // 🛡️ VALIDACIÓN 1: Prevenir que un usuario cambie su propio rol
    if (esUsuarioActual && formData.rol !== usuario.roles?.nombre) {
      toast.error('Acción no permitida', {
        description: 'No puedes cambiar tu propio rol. Pide a otro administrador que lo haga.',
        duration: 5000,
      });
      return;
    }

    // 🛡️ VALIDACIÓN 2: Prevenir que un usuario se desactive a sí mismo
    if (esUsuarioActual && !formData.activo && usuario.activo) {
      toast.error('Acción no permitida', {
        description: 'No puedes desactivar tu propia cuenta.',
        duration: 5000,
      });
      return;
    }
    
    setLoading(true);
    try {
      const dataParaBackend: ActualizarUsuarioDto = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        dni: formData.dni,
        telefono: formData.telefono,
        rol: formData.rol,
        activo: formData.activo,
        updatedAt: usuario.updatedAt, // 🔒 Versionado optimista
        ...(formData.password && { password: formData.password })
      };
      
      const response: any = await usuarioService.actualizarUsuario(usuario.id, dataParaBackend);
      
      // 🔐 SEGURIDAD: Detectar si el backend indica que se requiere logout
      if (response.requireLogout) {
        let razonLogout = 'Debes iniciar sesión nuevamente.';
        
        if (response.reason === 'EMAIL_CHANGED') {
          razonLogout = 'Has cambiado tu email de acceso. Por seguridad, debes iniciar sesión nuevamente con tu nuevo email.';
        } else if (response.reason === 'ACCOUNT_DEACTIVATED') {
          razonLogout = 'Tu cuenta ha sido desactivada. Serás redirigido al inicio de sesión.';
        } else if (response.reason === 'ROLE_CHANGED') {
          razonLogout = 'Tu rol ha sido modificado. Por seguridad, debes iniciar sesión nuevamente para actualizar tus permisos.';
        }
        
        toast.warning('Sesión cerrada por seguridad', {
          description: razonLogout,
          duration: 7000,
        });
        
        // Esperar 2 segundos para que el usuario lea el mensaje
        setTimeout(() => {
          logout(); // Cerrar sesión del store
          window.location.href = '/login'; // Redirigir al login
        }, 2000);
        
        return; // No continuar con el flujo normal
      }
      
      toast.success('Usuario actualizado correctamente', {
        description: `Los datos de ${formData.nombres} ${formData.apellidos} han sido actualizados.`,
      });
      
      onSuccess(); // Recargar la lista
      onClose(); // Cerrar modal
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      
      // Manejo específico de errores
      if (error.code === 'VERSION_CONFLICT') {
        // 🔒 CONFLICTO DE VERSIÓN: Otro admin editó el usuario
        toast.error('Conflicto de edición', {
          description: error.message || 'Este usuario fue modificado por otro administrador. Los datos se recargarán automáticamente.',
          duration: 7000,
          action: {
            label: 'Recargar',
            onClick: async () => {
              try {
                const usuarioActualizado = await usuarioService.obtenerUsuarioPorId(usuario.id);
                onClose(); // Cerrar modal actual
                setTimeout(() => {
                  // Re-abrir modal con datos frescos (esto debería manejarse desde el componente padre)
                  toast.info('Datos actualizados', {
                    description: 'Puedes editar nuevamente con los datos más recientes.',
                  });
                }, 300);
              } catch (err) {
                toast.error('Error al recargar', {
                  description: 'No se pudieron obtener los datos actualizados.',
                });
              }
            }
          }
        });
        onSuccess(); // Recargar la lista para mostrar cambios
        return;
      }
      
      if (error.statusCode === 409 || error.status === 409) {
        // Conflicto: Email o DNI duplicado
        toast.error('Datos duplicados', {
          description: error.message || 'El email o DNI ya está registrado por otro usuario.',
          duration: 6000,
        });
      } else if (error.statusCode === 403 || error.status === 403) {
        // Prohibido: Validación de seguridad
        toast.error('Operación no permitida', {
          description: error.message || 'No tienes permisos para realizar esta acción.',
          duration: 5000,
        });
      } else {
        // Error genérico
        toast.error('Error al actualizar usuario', {
          description: error.message || 'No se pudieron guardar los cambios. Intenta nuevamente.',
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Edit className="h-6 w-6 text-blue-600" />
            Editar Usuario
            {esUsuarioActual && (
              <Badge variant="outline" className="ml-2 border-orange-500 text-orange-700 bg-orange-50">
                Tu cuenta
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Modificar información de {usuario.nombres} {usuario.apellidos}
          </DialogDescription>
        </DialogHeader>

        {/* Advertencia de seguridad */}
        {esUsuarioActual && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">Editando tu propia cuenta</h4>
                <p className="text-sm text-orange-800">
                  Por seguridad, <strong>no puedes cambiar tu propio rol ni desactivar tu cuenta</strong>. 
                  Si necesitas hacer estos cambios, pide ayuda a otro administrador.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Información Personal */}
          <Card>
            <CardHeader className="bg-linear-to-r from-blue-50 to-blue-100 border-b pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    {...register('nombres')}
                    placeholder="Ej: Carlos Alberto"
                    className={errors.nombres ? 'border-red-500' : ''}
                  />
                  {errors.nombres && (
                    <p className="text-sm text-red-600">{errors.nombres.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    {...register('apellidos')}
                    placeholder="Ej: Rodríguez Pérez"
                    className={errors.apellidos ? 'border-red-500' : ''}
                  />
                  {errors.apellidos && (
                    <p className="text-sm text-red-600">{errors.apellidos.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dni" className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    DNI *
                  </Label>
                  <Input
                    id="dni"
                    {...register('dni')}
                    placeholder="12345678"
                    maxLength={8}
                    className={errors.dni ? 'border-red-500' : ''}
                  />
                  {errors.dni && (
                    <p className="text-sm text-red-600">{errors.dni.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    {...register('telefono')}
                    placeholder="987654321"
                    maxLength={9}
                    className={errors.telefono ? 'border-red-500' : ''}
                  />
                  {errors.telefono && (
                    <p className="text-sm text-red-600">{errors.telefono.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Sistema */}
          <Card>
            <CardHeader className="bg-linear-to-r from-purple-50 to-purple-100 border-b pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email institucional *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="usuario@sanmartin.edu.pe"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rol" className="flex items-center gap-2">
                    Rol en el sistema *
                    {esUsuarioActual && (
                      <span className="text-xs text-orange-600 font-normal">(Bloqueado por seguridad)</span>
                    )}
                  </Label>
                  <fieldset disabled={isSubmitting || esUsuarioActual}>
                    <Select 
                      value={watch('rol')} 
                      onValueChange={(value) => {
                        if (!esUsuarioActual) {
                          setValue('rol', value as 'ADMIN' | 'DOCENTE');
                        }
                      }}
                    >
                      <SelectTrigger className={`${errors.rol ? 'border-red-500' : ''} ${esUsuarioActual ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full inline-block ${watch('rol') === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                          {watch('rol') === 'ADMIN' ? 'Administrador' : 'Docente'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOCENTE">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Docente
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Administrador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </fieldset>
                  {errors.rol && (
                    <p className="text-sm text-red-600">{errors.rol.message}</p>
                  )}
                  
                  {/* ⚠️ ADVERTENCIA: Cambio de rol DOCENTE → ADMIN */}
                  {cambioDocenteAAdmin && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-amber-900">
                            Cambio de DOCENTE a ADMINISTRADOR
                          </p>
                          <p className="text-xs text-amber-700">
                            • El registro de docente se <strong>desactivará</strong> automáticamente
                          </p>
                          <p className="text-xs text-amber-700">
                            • Se conservará el historial pero perderá acceso al módulo de docente
                          </p>
                          <p className="text-xs text-amber-700">
                            • Podrás revertirlo cambiando el rol nuevamente a DOCENTE
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ✅ INFORMACIÓN: Cambio de rol ADMIN → DOCENTE */}
                  {cambioAdminADocente && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-blue-900">
                            Cambio de ADMINISTRADOR a DOCENTE
                          </p>
                          <p className="text-xs text-blue-700">
                            • El registro de docente se <strong>reactivará</strong> automáticamente
                          </p>
                          <p className="text-xs text-blue-700">
                            • Recuperará acceso completo al módulo de docente
                          </p>
                          <p className="text-xs text-blue-700">
                            • Perderá acceso al panel de administración
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activo" className="flex items-center gap-2">
                    Estado de la cuenta *
                    {esUsuarioActual && (
                      <span className="text-xs text-orange-600 font-normal">(Bloqueado por seguridad)</span>
                    )}
                  </Label>
                  <fieldset disabled={isSubmitting || esUsuarioActual}>
                    <Select 
                      value={watch('activo') ? 'true' : 'false'} 
                      onValueChange={(value) => {
                        if (!esUsuarioActual) {
                          setValue('activo', value === 'true');
                        }
                      }}
                    >
                      <SelectTrigger className={esUsuarioActual ? 'opacity-60 cursor-not-allowed' : ''}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full inline-block ${watch('activo') ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                          {watch('activo') ? 'Activo' : 'Inactivo'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Activo
                          </div>
                        </SelectItem>
                        <SelectItem value="false">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            Inactivo
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </fieldset>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña - SOLO para el usuario actual */}
          {esUsuarioActual && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="bg-linear-to-r from-orange-50 to-orange-100 border-b pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-orange-600" />
                  Cambiar Mi Contraseña (Opcional)
                </CardTitle>
                <CardDescription className="text-sm">
                  Actualiza tu contraseña de acceso al sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Mínimo 8 caracteres"
                      className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="Repetir la nueva contraseña"
                      className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 Si dejas estos campos vacíos, tu contraseña actual se mantendrá sin cambios.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensaje informativo cuando NO es el usuario actual */}
          {!esUsuarioActual && (
            <Card className="border-l-4 border-l-blue-500 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Seguridad y Privacidad</h4>
                    <p className="text-sm text-blue-800">
                      Por políticas de seguridad, <strong>no puedes cambiar la contraseña de otros usuarios</strong>. 
                      Cada usuario debe gestionar su propia contraseña desde su perfil.
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      Si un usuario olvidó su contraseña, debe usar la opción "Olvidé mi contraseña" en el login.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting || loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || loading}
            >
              {(isSubmitting || loading) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: Modal de Confirmación de Eliminación
// ============================================
interface ModalEliminarProps {
  usuario: Usuario | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function ModalEliminarUsuario({ usuario, isOpen, onClose, onConfirm, isDeleting }: ModalEliminarProps) {
  if (!usuario) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">
            ¿Eliminar usuario?
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500 mt-2">
            Esta acción no se puede deshacer
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Información del usuario */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {usuario.nombres.charAt(0)}{usuario.apellidos.charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {usuario.nombres} {usuario.apellidos}
                </p>
                <p className="text-sm text-gray-500 truncate mt-1">
                  <Mail className="inline h-3 w-3 mr-1" />
                  {usuario.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="outline"
                    className={
                      usuario.roles?.nombre === 'ADMIN' 
                        ? 'border-purple-500 text-purple-700 bg-purple-50 text-xs' 
                        : 'border-blue-500 text-blue-700 bg-blue-50 text-xs'
                    }
                  >
                    {usuario.roles?.nombre === 'ADMIN' ? 'Administrador' : 'Docente'}
                  </Badge>
                  <Badge 
                    variant={usuario.activo ? "default" : "secondary"}
                    className={`${usuario.activo ? "bg-green-500" : "bg-gray-500"} text-xs`}
                  >
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">
                  Advertencia importante
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  Al eliminar este usuario se perderá permanentemente:
                </p>
                <ul className="text-sm text-red-700 mt-2 ml-4 list-disc space-y-1">
                  <li>Toda la información personal del usuario</li>
                  <li>Historial de asistencias registradas</li>
                  <li>Justificaciones asociadas</li>
                  <li>Acceso al sistema</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mensaje de confirmación */}
          <p className="text-sm text-gray-600 text-center">
            ¿Está completamente seguro de que desea eliminar a{' '}
            <span className="font-semibold text-gray-900">
              {usuario.nombres} {usuario.apellidos}
            </span>?
          </p>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <div className="relative w-4 h-4 mr-2">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
                  <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Sí, eliminar usuario
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE: Modal de Crear Usuario
// ============================================
interface ModalCrearProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ModalCrearUsuario({ isOpen, onClose, onSuccess }: ModalCrearProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      email: '',
      dni: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      rol: 'DOCENTE',
    },
  });

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, reset]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
      onClose();
    }
  }, [isSubmitting, onClose, reset]);

  const onSubmit = async (data: CrearUsuarioForm) => {
    try {
      await usuarioService.crearUsuario({
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        dni: data.dni,
        telefono: data.telefono,
        password: data.password,
        rol: data.rol,
      });
      
      toast.success('Usuario creado exitosamente', {
        description: `${data.nombres} ${data.apellidos} ha sido agregado al sistema`,
        duration: 4000,
      });
      
      // Resetear formulario y cerrar modal
      reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
      onClose();
      onSuccess();
      
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      
      if (error.isConflict || error.statusCode === 409) {
        toast.error('Datos duplicados', {
          description: error.message || 'El email o DNI ya está registrado en el sistema.',
          duration: 6000,
        });
      } else if (error.isValidationError || error.statusCode === 400) {
        toast.error('Datos inválidos', {
          description: error.message || 'Por favor verifica la información ingresada.',
          duration: 5000,
        });
      } else {
        toast.error('Error al crear el usuario', {
          description: error.message || 'Intente nuevamente más tarde',
          duration: 5000,
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Complete la información para crear un nuevo usuario en el sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crear-nombres">Nombres *</Label>
                <Input
                  id="crear-nombres"
                  {...register('nombres')}
                  placeholder="Ej: Juan Carlos"
                  className={errors.nombres ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                {errors.nombres && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.nombres.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="crear-apellidos">Apellidos *</Label>
                <Input
                  id="crear-apellidos"
                  {...register('apellidos')}
                  placeholder="Ej: Pérez González"
                  className={errors.apellidos ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                {errors.apellidos && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.apellidos.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Información de Contacto
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="crear-email">Email Institucional *</Label>
              <Input
                id="crear-email"
                type="email"
                {...register('email')}
                placeholder="usuario@sanmartin.edu.pe"
                className={errors.email ? 'border-red-500' : ''}
                disabled={isSubmitting}
                autoComplete="off"
              />
              {errors.email && (
                <div className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email.message}</span>
                </div>
              )}
              <p className="text-xs text-gray-500">Debe usar el dominio @sanmartin.edu.pe</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crear-dni">DNI *</Label>
                <Input
                  id="crear-dni"
                  {...register('dni')}
                  placeholder="12345678"
                  maxLength={8}
                  className={errors.dni ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                {errors.dni && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.dni.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="crear-telefono">Teléfono</Label>
                <Input
                  id="crear-telefono"
                  {...register('telefono')}
                  placeholder="987654321"
                  maxLength={9}
                  className={errors.telefono ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                {errors.telefono && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.telefono.message}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">Opcional - 9 dígitos comenzando con 9</p>
              </div>
            </div>
          </div>

          {/* Rol */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Rol y Permisos
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="crear-rol">Rol en el Sistema *</Label>
              <fieldset disabled={isSubmitting}>
                <Select 
                  value={watch('rol')}
                  onValueChange={(value) => setValue('rol', value as 'ADMIN' | 'DOCENTE')}
                >
                  <SelectTrigger className={errors.rol ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCENTE">
                      <span>Docente</span>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <span>Administrador</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </fieldset>
              {errors.rol && (
                <div className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.rol.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contraseñas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Credenciales de Acceso
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crear-password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="crear-password"
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    placeholder="Mínimo 8 caracteres"
                    className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.password.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="crear-confirmPassword">Confirmar Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="crear-confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register('confirmPassword')}
                    placeholder="Repetir contraseña"
                    className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.confirmPassword.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <Separator />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="relative w-4 h-4 mr-2">
                    <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
                    <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  Creando usuario...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Usuario
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE PRINCIPAL: Página de Usuarios
// ============================================
export default function UsuariosPage() {
  // Estados locales
  const [rolFilter, setRolFilter] = useState<string>('');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null);
  const [isModalEliminarOpen, setIsModalEliminarOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  
  // Store de autenticación
  const { user: usuarioActual, logout } = useAuthStore();

  // 🔥 Estados locales para paginación y búsqueda
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Función para cargar usuarios
  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(rolFilter && { rol: rolFilter })
      });
      
      const response = await fetch(`http://localhost:5000/api/admin/usuarios?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      console.log('📦 Respuesta del backend:', data);
      
      if (data.success) {
        // ✅ Backend devuelve: { success: true, data: { data: [...], pagination: {...} } }
        const paginatedData = data.data;
        const usuariosData = Array.isArray(paginatedData?.data) ? paginatedData.data : [];
        const metaData = paginatedData?.pagination || null;
        
        console.log('✅ Usuarios parseados:', usuariosData.length);
        setUsuarios(usuariosData);
        setMeta(metaData);
      }
    } catch (err: any) {
      console.error('❌ Error al cargar usuarios:', err);
      setError(err.message || 'Error al cargar usuarios');
      setUsuarios([]); // ✅ Resetear a array vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, rolFilter]);

  // Cargar usuarios cuando cambien los filtros
  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Handler para ver detalles
  const handleVerDetalles = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  // Handler para cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Pequeño delay antes de limpiar el usuario para evitar parpadeos
    setTimeout(() => setSelectedUsuario(null), 200);
  };

  // Handler para abrir modal de editar
  // Handler para abrir modal de editar
  const handleEditar = async (usuario: Usuario) => {
    try {
      // Obtener datos frescos del usuario desde el backend
      const usuarioActualizado = await usuarioService.obtenerUsuarioPorId(usuario.id);
      console.log('📋 Usuario cargado para editar:', usuarioActualizado);
      setUsuarioAEditar(usuarioActualizado);
      setIsModalEditarOpen(true);
    } catch (error: any) {
      console.error('Error al cargar usuario:', error);
      toast.error('Error al cargar usuario', {
        description: 'No se pudo cargar la información del usuario. Intenta de nuevo.',
      });
    }
  };

  // Handler para cerrar modal de editar
  const handleCloseModalEditar = () => {
    setIsModalEditarOpen(false);
    setTimeout(() => setUsuarioAEditar(null), 200);
  };

  // Handler cuando se actualiza exitosamente
  const handleSuccessEditar = () => {
    fetchUsuarios(); // 🔄 Recargar la lista con paginación
  };

  // Handler para cambiar estado
  const handleToggleStatus = async (id: string) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    // Verificar si intenta desactivarse a sí mismo
    const esUsuarioActual = usuarioActual?.id === id;
    if (esUsuarioActual && usuario.activo) {
      toast.error('Operación no permitida', {
        description: 'No puedes desactivar tu propia cuenta.',
        duration: 5000,
      });
      return;
    }

    try {
      await usuarioService.cambiarEstadoUsuario(id, !usuario.activo);
      
      toast.success(
        `Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente`,
        {
          description: `${usuario.nombres} ${usuario.apellidos} ha sido ${usuario.activo ? 'desactivado' : 'activado'} en el sistema.`,
          duration: 3000,
        }
      );
      
      // 🔄 Refrescar datos con paginación
      fetchUsuarios();
    } catch (err: any) {
      const isValidationError = err.isValidationError || err.statusCode === 403;
      
      toast.error(
        isValidationError ? 'Operación no permitida' : 'Error del sistema',
        {
          description: err.message || 'Error al cambiar estado del usuario',
          duration: isValidationError ? 5000 : 6000,
        }
      );
    }
  };

  // Handler para eliminar
  const handleDelete = async (id: string) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;
    
    // Verificar si intenta eliminarse a sí mismo
    const esUsuarioActual = usuarioActual?.id === id;
    if (esUsuarioActual) {
      toast.error('Operación no permitida', {
        description: 'No puedes eliminar tu propia cuenta de usuario.',
        duration: 5000,
      });
      return;
    }
    
    // Abrir modal de confirmación
    setUsuarioAEliminar(usuario);
    setIsModalEliminarOpen(true);
  };

  // Handler para confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!usuarioAEliminar) return;

    try {
      setIsDeleting(true);
      await usuarioService.eliminarUsuario(usuarioAEliminar.id);
      setUsuarios(prev => prev.filter(user => user.id !== usuarioAEliminar.id));
      
      toast.success('Usuario eliminado correctamente', {
        description: `${usuarioAEliminar.nombres} ${usuarioAEliminar.apellidos} ha sido eliminado del sistema.`,
        duration: 3000,
      });

      // 🔄 Refrescar datos con paginación
      fetchUsuarios();
      
      // Cerrar modal
      setIsModalEliminarOpen(false);
      setUsuarioAEliminar(null);
    } catch (err: any) {
      const isValidationError = err.isValidationError || err.statusCode === 403;
      
      toast.error(
        isValidationError ? 'Operación no permitida' : 'Error del sistema',
        {
          description: err.message || 'Error al eliminar usuario',
          duration: isValidationError ? 5000 : 6000,
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Renderizado
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Administrar usuarios del sistema</p>
          </div>
          
          <div className="flex gap-3">
            <Button className="gap-2" onClick={() => setIsModalCrearOpen(true)}>
              <Plus className="h-4 w-4" />
              Crear Usuario
            </Button>
            <BackToAdminButton />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-xl font-bold mt-1">{meta?.total || 0}</p>
                </div>
                <Eye className="h-7 w-7 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Activos</p>
                  <p className="text-xl font-bold text-green-600 mt-1">
                    {Array.isArray(usuarios) ? usuarios.filter(u => u.activo).length : 0}
                  </p>
                </div>
                <Power className="h-7 w-7 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Inactivos</p>
                  <p className="text-xl font-bold text-gray-600 mt-1">
                    {Array.isArray(usuarios) ? usuarios.filter(u => !u.activo).length : 0}
                  </p>
                </div>
                <Power className="h-7 w-7 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Admins</p>
                  <p className="text-xl font-bold text-purple-600 mt-1">
                    {Array.isArray(usuarios) ? usuarios.filter(u => u.roles?.nombre === 'ADMIN').length : 0}
                  </p>
                </div>
                <Search className="h-7 w-7 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Docentes</p>
                  <p className="text-xl font-bold text-orange-600 mt-1">
                    {Array.isArray(usuarios) ? usuarios.filter(u => u.roles?.nombre === 'DOCENTE').length : 0}
                  </p>
                </div>
                <Users className="h-7 w-7 text-orange-600" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={rolFilter} onValueChange={setRolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="DOCENTE">Docente</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => { setSearchTerm(''); setRolFilter(''); }}
              >
                Limpiar filtros
              </Button>
            </div>
            
            {/* 🔥 Page Size Selector */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {meta ? `${((meta.page - 1) * meta.limit) + 1}-${Math.min(meta.page * meta.limit, meta.totalItems || meta.total)} de ${meta.totalItems || meta.total}` : '0'} resultados
              </p>
              <PageSizeSelector 
                value={pageSize}
                onChange={setPageSize}
                options={[10, 25, 50, 100]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla Responsive */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios ({meta?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Usuario</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[100px]">DNI</TableHead>
                    <TableHead className="min-w-20">Rol</TableHead>
                    <TableHead className="min-w-20">Estado</TableHead>
                    <TableHead className="text-right min-w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Cargando usuarios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => {
                    const esUsuarioActual = usuarioActual?.id === usuario.id;
                    
                    return (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{usuario.nombres} {usuario.apellidos}</p>
                          {usuario.telefono && (
                            <p className="text-sm text-gray-500">Tel: {usuario.telefono}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{usuario.dni}</TableCell>
                      <TableCell>
                        <Badge variant={usuario.roles?.nombre === 'ADMIN' ? 'default' : 'secondary'}>
                          {usuario.roles?.nombre === 'ADMIN' ? 'Admin' : 'Docente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
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
                              className="cursor-pointer"
                              onClick={() => handleVerDetalles(usuario)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleEditar(usuario)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => !esUsuarioActual && handleToggleStatus(usuario.id)}
                              className={`cursor-pointer ${esUsuarioActual ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {usuario.activo ? 'Desactivar' : 'Activar'}
                              {esUsuarioActual && (
                                <span className="ml-auto text-xs text-gray-400">(Tú mismo)</span>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => !esUsuarioActual && handleDelete(usuario.id)}
                              className={`text-red-600 focus:text-red-600 ${esUsuarioActual ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                              {esUsuarioActual && (
                                <span className="ml-auto text-xs text-gray-400">(Tú mismo)</span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
            
            {/* 🔥 Paginación */}
            {meta && (meta.totalPages || meta.pages) > 1 && (
              <div className="mt-6 px-4 sm:px-0">
                <Pagination
                  currentPage={page}
                  totalPages={meta.totalPages || meta.pages}
                  totalItems={meta.totalItems || meta.total || 0}
                  itemsPerPage={pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalles */}
      <ModalDetallesUsuario 
        usuario={selectedUsuario}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEditar={handleEditar}
      />

      {/* Modal de Editar */}
      <ModalEditarUsuario 
        usuario={usuarioAEditar}
        isOpen={isModalEditarOpen}
        onClose={handleCloseModalEditar}
        onSuccess={handleSuccessEditar}
      />

      {/* Modal de Confirmación de Eliminación */}
      <ModalEliminarUsuario 
        usuario={usuarioAEliminar}
        isOpen={isModalEliminarOpen}
        onClose={() => {
          setIsModalEliminarOpen(false);
          setUsuarioAEliminar(null);
        }}
        onConfirm={confirmarEliminacion}
        isDeleting={isDeleting}
      />

      {/* Modal de Crear Usuario */}
      {isModalCrearOpen && (
        <ModalCrearUsuario 
          isOpen={isModalCrearOpen}
          onClose={() => setIsModalCrearOpen(false)}
          onSuccess={fetchUsuarios}
        />
      )}
    </div>
  );
}

