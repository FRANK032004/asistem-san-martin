/**
 * Página de Estadísticas Avanzadas
 * Dashboard con gráficos interactivos para análisis de asistencias
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TendenciaAsistenciaChart, 
  ComparativaChart, 
  DistribucionAsistenciaChart 
} from '../components/charts';
import { useAuthStore } from '../store/auth';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface EstadisticasAvanzadas {
  tendencia: {
    fecha: string;
    asistencias: number;
    tardanzas: number;
    faltas: number;
  }[];
  comparativa: {
    categoria: string;
    miValor: number;
    promedioInstitucional: number;
  }[];
  distribucion: {
    asistencias: number;
    tardanzas: number;
    faltas: number;
  };
  resumen: {
    totalDias: number;
    diasAsistidos: number;
    porcentajeAsistencia: number;
    porcentajePuntualidad: number;
  };
}

export const EstadisticasAvanzadasPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAvanzadas | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'semana' | 'mes' | 'trimestre'>('mes');

  useEffect(() => {
    cargarEstadisticas();
  }, [periodoSeleccionado]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Aquí iría la llamada real al endpoint
      // const response = await docenteService.obtenerEstadisticasAvanzadas(periodoSeleccionado);

      // Datos de ejemplo (reemplazar con datos reales)
      const hoy = new Date();
      const diasPeriodo = periodoSeleccionado === 'semana' ? 7 : periodoSeleccionado === 'mes' ? 30 : 90;
      
      const tendenciaData = Array.from({ length: diasPeriodo }, (_, i) => {
        const fecha = subDays(hoy, diasPeriodo - i - 1);
        return {
          fecha: format(fecha, 'yyyy-MM-dd'),
          asistencias: Math.floor(Math.random() * 5) + 3,
          tardanzas: Math.floor(Math.random() * 2),
          faltas: Math.floor(Math.random() * 2),
        };
      });

      const comparativaData = [
        { categoria: 'Asistencia', miValor: 92, promedioInstitucional: 88 },
        { categoria: 'Puntualidad', miValor: 85, promedioInstitucional: 90 },
        { categoria: 'Justificaciones', miValor: 95, promedioInstitucional: 85 },
        { categoria: 'Cumplimiento', miValor: 88, promedioInstitucional: 87 },
      ];

      const distribucionData = {
        asistencias: 85,
        tardanzas: 10,
        faltas: 5,
      };

      const resumenData = {
        totalDias: diasPeriodo,
        diasAsistidos: 85,
        porcentajeAsistencia: 92.5,
        porcentajePuntualidad: 85.3,
      };

      setEstadisticas({
        tendencia: tendenciaData,
        comparativa: comparativaData,
        distribucion: distribucionData,
        resumen: resumenData,
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas avanzadas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-red-600">{error}</p>
          <button
            onClick={cargarEstadisticas}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Estadísticas Avanzadas
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Análisis detallado de tu asistencia y rendimiento
              </p>
            </div>

            {/* Selector de período */}
            <div className="mt-4 sm:mt-0">
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                  onClick={() => setPeriodoSeleccionado('semana')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    periodoSeleccionado === 'semana'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setPeriodoSeleccionado('mes')}
                  className={`px-4 py-2 text-sm font-medium border-l border-r border-gray-200 dark:border-gray-700 ${
                    periodoSeleccionado === 'mes'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setPeriodoSeleccionado('trimestre')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    periodoSeleccionado === 'trimestre'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Trimestre
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Días</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{estadisticas.resumen.totalDias}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Días Asistidos</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{estadisticas.resumen.diasAsistidos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">% Asistencia</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{estadisticas.resumen.porcentajeAsistencia.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">% Puntualidad</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{estadisticas.resumen.porcentajePuntualidad.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tendencia de Asistencia */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tendencia de Asistencia
            </h2>
            <TendenciaAsistenciaChart data={estadisticas.tendencia} height={300} />
          </div>

          {/* Comparativa con Institución */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Comparativa Institucional
            </h2>
            <ComparativaChart data={estadisticas.comparativa} height={300} />
          </div>

          {/* Distribución de Asistencias */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribución de Asistencias
            </h2>
            <DistribucionAsistenciaChart
              asistencias={estadisticas.distribucion.asistencias}
              tardanzas={estadisticas.distribucion.tardanzas}
              faltas={estadisticas.distribucion.faltas}
              height={350}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasAvanzadasPage;
