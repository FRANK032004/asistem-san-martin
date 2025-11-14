'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Trophy,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useComparativaInstitucional } from '@/store/docente';
import { toast } from 'sonner';

/**
 * 🎯 Componente ComparativaInstitucional
 * 
 * Compara el rendimiento del docente con el promedio institucional
 * GET /docente/estadisticas/comparativa
 * 
 * Features:
 * - Comparación con promedios institucionales
 * - Indicadores de diferencia (mejor/peor)
 * - Posicionamiento general
 * - Visualización con barras comparativas
 */

export default function ComparativaInstitucional() {
  const { comparativa, loading, error, cargar } = useComparativaInstitucional();

  // 🔄 Cargar al montar
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Mostrar errores con toast
  useEffect(() => {
    if (error) {
      toast.error('Error al cargar comparativa', {
        description: error,
      });
    }
  }, [error]);

  const getIndicadorTendencia = (diferencia: number) => {
    if (diferencia > 0) {
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        texto: 'mejor'
      };
    } else if (diferencia < 0) {
      return {
        icon: <TrendingDown className="w-4 h-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        texto: 'menor'
      };
    } else {
      return {
        icon: <Minus className="w-4 h-4" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300',
        texto: 'igual'
      };
    }
  };

  const getPosicionamientoBadge = (posicionamiento: string) => {
    switch (posicionamiento) {
      case 'Sobresaliente':
        return <Badge className="bg-green-500"><Trophy className="w-3 h-3 mr-1" />Sobresaliente</Badge>;
      case 'Muy Bueno':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Muy Bueno</Badge>;
      case 'Bueno':
        return <Badge className="bg-cyan-500"><Target className="w-3 h-3 mr-1" />Bueno</Badge>;
      case 'Regular':
        return <Badge className="bg-orange-500"><Minus className="w-3 h-3 mr-1" />Regular</Badge>;
      case 'Mejorable':
        return <Badge className="bg-red-500"><TrendingDown className="w-3 h-3 mr-1" />Mejorable</Badge>;
      default:
        return <Badge variant="outline">{posicionamiento}</Badge>;
    }
  };

  const renderBarraComparativa = (
    titulo: string,
    miValor: number,
    promedioValor: number,
    diferencia: number,
    porcentaje: number,
    unidad: string = ''
  ) => {
    const indicador = getIndicadorTendencia(diferencia);
    const maxValor = Math.max(miValor, promedioValor);
    const miPorcentaje = maxValor > 0 ? (miValor / maxValor) * 100 : 0;
    const promedioPorcentaje = maxValor > 0 ? (promedioValor / maxValor) * 100 : 0;

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">{titulo}</h4>
          <Badge className={`${indicador.bgColor} ${indicador.color} ${indicador.borderColor} border`}>
            {indicador.icon}
            <span className="ml-1">
              {diferencia > 0 ? '+' : ''}{diferencia.toFixed(1)}{unidad} ({porcentaje > 0 ? '+' : ''}{porcentaje.toFixed(1)}%)
            </span>
          </Badge>
        </div>

        {/* Mi rendimiento */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Tu rendimiento</span>
            <span className="text-sm font-bold text-blue-700">{miValor.toFixed(1)}{unidad}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${miPorcentaje}%` }}
            >
              {miPorcentaje > 15 && (
                <span className="text-xs font-bold text-white">Tú</span>
              )}
            </div>
          </div>
        </div>

        {/* Promedio institucional */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Promedio institucional</span>
            <span className="text-sm font-medium text-gray-700">{promedioValor.toFixed(1)}{unidad}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gray-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${promedioPorcentaje}%` }}
            >
              {promedioPorcentaje > 20 && (
                <span className="text-xs font-medium text-white">Promedio</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !comparativa) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200">
        <div className="text-center py-8">
          <TrendingDown className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={() => cargar()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </Card>
    );
  }

  if (!comparativa) {
    return null;
  }

  const { miRendimiento, promedioInstitucional, comparativa: comp, posicionamiento } = comparativa;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Comparativa Institucional</h2>
            <p className="text-sm text-gray-500">
              Tu rendimiento vs promedio de docentes
            </p>
          </div>
        </div>
        {getPosicionamientoBadge(posicionamiento)}
      </div>

      {/* Mensaje de posicionamiento */}
      <div className={`mb-6 p-4 rounded-lg border ${
        posicionamiento === 'Sobresaliente' || posicionamiento === 'Muy Bueno'
          ? 'bg-green-50 border-green-200'
          : posicionamiento === 'Bueno'
          ? 'bg-blue-50 border-blue-200'
          : posicionamiento === 'Regular'
          ? 'bg-orange-50 border-orange-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start space-x-3">
          {posicionamiento === 'Sobresaliente' || posicionamiento === 'Muy Bueno' ? (
            <Trophy className="w-5 h-5 text-green-600 mt-0.5" />
          ) : posicionamiento === 'Bueno' ? (
            <Target className="w-5 h-5 text-blue-600 mt-0.5" />
          ) : (
            <TrendingDown className="w-5 h-5 text-orange-600 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {posicionamiento === 'Sobresaliente' && '🎉 ¡Excelente trabajo!'}
              {posicionamiento === 'Muy Bueno' && '👏 ¡Muy buen rendimiento!'}
              {posicionamiento === 'Bueno' && '✅ Buen desempeño'}
              {posicionamiento === 'Regular' && '📊 Rendimiento promedio'}
              {posicionamiento === 'Mejorable' && '💪 Oportunidad de mejora'}
            </p>
            <p className="text-xs text-gray-600">
              {posicionamiento === 'Sobresaliente' && 'Estás superando ampliamente el promedio institucional. ¡Sigue así!'}
              {posicionamiento === 'Muy Bueno' && 'Tu rendimiento está por encima del promedio institucional.'}
              {posicionamiento === 'Bueno' && 'Tu rendimiento es ligeramente superior al promedio.'}
              {posicionamiento === 'Regular' && 'Tu rendimiento está cerca del promedio institucional.'}
              {posicionamiento === 'Mejorable' && 'Te recomendamos mejorar tu puntualidad y asistencia.'}
            </p>
          </div>
        </div>
      </div>

      {/* Comparativas */}
      <div className="space-y-6">
        {/* Asistencias */}
        {renderBarraComparativa(
          'Asistencias',
          miRendimiento.asistencias,
          promedioInstitucional.asistencias,
          comp.asistencias.diferencia,
          comp.asistencias.porcentaje,
          ''
        )}

        {/* Puntualidad */}
        {renderBarraComparativa(
          'Puntualidad',
          miRendimiento.puntualidad,
          promedioInstitucional.puntualidad,
          comp.puntualidad.diferencia,
          comp.puntualidad.porcentaje,
          '%'
        )}

        {/* Horas trabajadas */}
        {renderBarraComparativa(
          'Horas Trabajadas',
          miRendimiento.horasTrabajadas,
          promedioInstitucional.horasTrabajadas,
          comp.horasTrabajadas.diferencia,
          comp.horasTrabajadas.porcentaje,
          'h'
        )}

        {/* Tardanzas (invertido - menos es mejor) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Tardanzas</h4>
            <Badge className={`${
              comp.tardanzas.diferencia <= 0 
                ? 'bg-green-100 text-green-600 border-green-300' 
                : 'bg-red-100 text-red-600 border-red-300'
            } border`}>
              {comp.tardanzas.diferencia <= 0 ? (
                <TrendingDown className="w-4 h-4 mr-1" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-1" />
              )}
              {comp.tardanzas.diferencia > 0 ? '+' : ''}{comp.tardanzas.diferencia.toFixed(1)} ({comp.tardanzas.porcentaje > 0 ? '+' : ''}{comp.tardanzas.porcentaje.toFixed(1)}%)
            </Badge>
          </div>

          {/* Mi rendimiento */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Tus tardanzas</span>
              <span className="text-sm font-bold text-blue-700">{miRendimiento.tardanzas}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  miRendimiento.tardanzas < promedioInstitucional.tardanzas 
                    ? 'bg-green-600' 
                    : 'bg-red-600'
                }`}
                style={{ 
                  width: `${Math.min((miRendimiento.tardanzas / Math.max(miRendimiento.tardanzas, promedioInstitucional.tardanzas)) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Promedio institucional */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Promedio institucional</span>
              <span className="text-sm font-medium text-gray-700">{promedioInstitucional.tardanzas}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gray-500 h-4 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((promedioInstitucional.tardanzas / Math.max(miRendimiento.tardanzas, promedioInstitucional.tardanzas)) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {miRendimiento.tardanzas < promedioInstitucional.tardanzas 
              ? '✅ Tienes menos tardanzas que el promedio' 
              : '⚠️ Tienes más tardanzas que el promedio'}
          </p>
        </div>
      </div>

      {/* Resumen en números */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumen Numérico</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{miRendimiento.asistencias}</div>
            <div className="text-xs text-gray-500">Mis asistencias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{miRendimiento.puntualidad.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Mi puntualidad</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{miRendimiento.horasTrabajadas.toFixed(1)}h</div>
            <div className="text-xs text-gray-500">Mis horas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{miRendimiento.tardanzas}</div>
            <div className="text-xs text-gray-500">Mis tardanzas</div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && comparativa && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Actualizando...</p>
          </div>
        </div>
      )}
    </Card>
  );
}
