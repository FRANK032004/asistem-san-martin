/**
 * Gráfico de Comparativa de Asistencia
 * Compara las estadísticas del docente con el promedio institucional
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';

interface ComparativaData {
  categoria: string;
  miValor: number;
  promedioInstitucional: number;
}

interface ComparativaChartProps {
  data: ComparativaData[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

// Colores para las barras
const COLORS = {
  miValor: '#3b82f6', // blue-500
  promedioInstitucional: '#8b5cf6', // violet-500
  mejor: '#10b981', // green-500
  peor: '#ef4444', // red-500
};

// Tooltip personalizado
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const miValor = payload[0]?.value || 0;
  const promedio = payload[1]?.value || 0;
  const diferencia = miValor - promedio;
  const porcentaje = promedio > 0 ? ((diferencia / promedio) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-400">
            {entry.name}:
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {entry.value}%
          </span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className={`text-xs font-medium ${
          diferencia >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {diferencia >= 0 ? '▲' : '▼'} {Math.abs(diferencia).toFixed(1)}% ({porcentaje}%)
        </span>
      </div>
    </div>
  );
};

export const ComparativaChart: React.FC<ComparativaChartProps> = ({
  data,
  height = 350,
  showLegend = true,
  showGrid = true,
}) => {
  // Si no hay datos, mostrar mensaje
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
        style={{ height }}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No hay datos de comparativa disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
          )}
          <XAxis
            dataKey="categoria"
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-gray-600 dark:text-gray-400"
            label={{ value: 'Porcentaje (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              iconType="rect"
            />
          )}
          <Bar
            dataKey="miValor"
            name="Mi Desempeño"
            fill={COLORS.miValor}
            radius={[8, 8, 0, 0]}
          >
            {data.map((entry, index) => {
              // Colorear la barra según si es mejor o peor que el promedio
              const esMejor = entry.miValor >= entry.promedioInstitucional;
              const color = esMejor ? COLORS.mejor : COLORS.peor;
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
          <Bar
            dataKey="promedioInstitucional"
            name="Promedio Institucional"
            fill={COLORS.promedioInstitucional}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparativaChart;
