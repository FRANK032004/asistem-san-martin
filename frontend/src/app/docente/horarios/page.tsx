'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useHorarios } from '@/store/docente';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, BookOpen, Grid3x3, List, Download, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function MisHorariosPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // 🔥 Usar hook optimizado del store
  const { horarios, loading, error, cargar } = useHorarios();

  // Estado para cambiar entre vista calendario y lista
  const [vistaCalendario, setVistaCalendario] = useState(true);
  const [soloActivos, setSoloActivos] = useState(true);

  useEffect(() => {
    if (!user || user.rol?.nombre?.toLowerCase() !== 'docente') {
      router.push('/login');
      return;
    }
    // 🔥 Cargar horarios desde el store
    cargar(soloActivos);
  }, [user, router, soloActivos, cargar]);

  // Mostrar errores del store
  useEffect(() => {
    if (error) {
      toast.error('Error al cargar horarios', {
        description: error,
        duration: 5000,
      });
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando horarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => cargar(true)}>Reintentar</Button>
          </div>
        </Card>
      </div>
    );
  }

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const exportarAPDF = () => {
    toast.info('Función en desarrollo', {
      description: 'Próximamente podrás exportar tus horarios a PDF',
      duration: 3000,
    });
  };

  const exportarAiCal = () => {
    toast.info('Función en desarrollo', {
      description: 'Próximamente podrás exportar a Google Calendar / iCal',
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/docente')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Horarios</h1>
                <p className="text-sm text-gray-500">Horarios asignados por semana</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Vista */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={vistaCalendario ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setVistaCalendario(true)}
                  className="h-8"
                >
                  <Grid3x3 className="h-4 w-4 mr-1" />
                  Calendario
                </Button>
                <Button
                  variant={!vistaCalendario ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setVistaCalendario(false)}
                  className="h-8"
                >
                  <List className="h-4 w-4 mr-1" />
                  Lista
                </Button>
              </div>

              {/* Toggle Activos/Todos */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoloActivos(!soloActivos)}
              >
                {soloActivos ? 'Mostrar todos' : 'Solo activos'}
              </Button>

              {/* Exportar */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportarAPDF}>
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={exportarAiCal}>
                  <Download className="h-4 w-4 mr-1" />
                  iCal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Horarios</p>
                <p className="text-3xl font-bold text-gray-900">{horarios?.estadisticas.totalHorarios || 0}</p>
                <p className="text-xs text-gray-500 mt-1">clases semanales</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas Semanales</p>
                <p className="text-3xl font-bold text-green-600">{horarios?.estadisticas.horasSemanaTotales || 0}h</p>
                <p className="text-xs text-gray-500 mt-1">tiempo en aula</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Días con Clases</p>
                <p className="text-3xl font-bold text-purple-600">{horarios?.estadisticas.diasConClases || 0}</p>
                <p className="text-xs text-gray-500 mt-1">de 7 días</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio Diario</p>
                <p className="text-3xl font-bold text-orange-600">
                  {horarios?.estadisticas.diasConClases 
                    ? Math.round((horarios?.estadisticas.horasSemanaTotales || 0) / horarios.estadisticas.diasConClases * 10) / 10
                    : 0}h
                </p>
                <p className="text-xs text-gray-500 mt-1">horas por día</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Horarios - Vista Calendario o Lista */}
        {vistaCalendario ? (
          /* VISTA CALENDARIO SEMANAL */
          <Card className="p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Calendario Semanal</h3>
            <div className="grid grid-cols-7 gap-2 min-w-[900px]">
              {/* Encabezados de días */}
              {diasSemana.map((dia) => {
                const horariosDelDia = horarios?.horariosPorDia[dia] || [];
                const totalHoras = horariosDelDia.reduce((sum: number, h: any) => sum + (h.horasSemana || 0), 0);
                
                return (
                  <div key={dia} className="text-center pb-4 border-b-2 border-gray-200">
                    <p className="font-semibold text-gray-900">{dia}</p>
                    <p className="text-xs text-gray-500">{horariosDelDia.length} clases</p>
                    <p className="text-xs text-blue-600 font-medium">{totalHoras}h</p>
                  </div>
                );
              })}
              
              {/* Bloques de horarios */}
              {diasSemana.map((dia) => {
                const horariosDelDia = horarios?.horariosPorDia[dia] || [];
                
                return (
                  <div key={`${dia}-content`} className="space-y-2 pt-4">
                    {horariosDelDia.length > 0 ? (
                      horariosDelDia.map((horario: any, index: number) => (
                        <div
                          key={horario.id}
                          className="bg-linear-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          style={{
                            backgroundColor: horario.area?.color_hex || '#3B82F6'
                          }}
                        >
                          <p className="text-xs font-semibold mb-1">
                            {horario.horaInicio} - {horario.horaFin}
                          </p>
                          <p className="text-xs font-medium line-clamp-2">
                            {horario.area?.nombre || 'Sin área'}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] opacity-80">
                              {horario.horasSemana}h
                            </p>
                            {horario.tipoClase && (
                              <Badge 
                                variant="outline" 
                                className="text-[9px] h-4 px-1 bg-white/20 text-white border-white/40"
                              >
                                {horario.tipoClase}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 p-3 rounded-lg text-center border-2 border-dashed border-gray-200">
                        <p className="text-xs text-gray-400">Sin clases</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          /* VISTA LISTA */
          <div className="space-y-6">{diasSemana.map((dia) => {
            const horariosDelDia = horarios?.horariosPorDia[dia] || [];
            if (horariosDelDia.length === 0) return null;

            return (
              <Card key={dia} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  {dia}
                  <Badge variant="outline" className="ml-3">
                    {horariosDelDia.length} {horariosDelDia.length === 1 ? 'clase' : 'clases'}
                  </Badge>
                </h3>
                <div className="space-y-3">
                  {horariosDelDia.map((horario: any) => (
                    <div
                      key={horario.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {horario.horaInicio} - {horario.horaFin}
                          </p>
                          <p className="text-sm text-gray-500">
                            {horario.area?.nombre || 'Sin área'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {horario.tipoClase && (
                          <Badge variant="outline">{horario.tipoClase}</Badge>
                        )}
                        <Badge className="bg-green-100 text-green-800">
                          {horario.horasSemana}h/semana
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
        )}

        {/* Mensaje si no hay horarios */}
        {horarios?.horarios.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes horarios asignados
            </h3>
            <p className="text-gray-600">
              Contacta con el administrador para que te asigne horarios de clase.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
