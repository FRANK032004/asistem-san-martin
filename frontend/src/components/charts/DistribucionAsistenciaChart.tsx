/**
 * Gráfico de Distribución de Asistencia (Pie Chart)
 * Muestra la distribución porcentual de asistencias, tardanzas y faltas
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface DistribucionData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for recharts
}

interface DistribucionAsistenciaChartProps {
  asistencias: number;
  tardanzas: number;
  faltas: number;
  height?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
}

const COLORS = {
  asistencias: '#10b981', // green-500
  tardanzas: '#f59e0b',   // amber-500
  faltas: '#ef4444',      // red-500
};

// Tooltip personalizado
const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const total = payload[0]?.payload?.total || 100;
  const porcentaje = ((data.value / total) * 100).toFixed(1);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.fill }}
        />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {data.name}
        </span>
      </div>
      <div className="mt-2 text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Cantidad: <span className="font-semibold text-gray-900 dark:text-white">{data.value}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Porcentaje: <span className="font-semibold text-gray-900 dark:text-white">{porcentaje}%</span>
        </p>
      </div>
    </div>
  );
};

// Renderizar label personalizado
const renderLabel = (entry: any) => {
  const porcentaje = entry.percent * 100;
  return porcentaje > 5 ? `${porcentaje.toFixed(0)}%` : '';
};

export const DistribucionAsistenciaChart: React.FC<DistribucionAsistenciaChartProps> = ({
  asistencias,
  tardanzas,
  faltas,
  height = 300,
  showLegend = true,
  showPercentage = true,
}) => {
  const total = asistencias + tardanzas + faltas;

  // Si no hay datos, mostrar mensaje
  if (total === 0) {
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
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No hay datos de distribución disponibles
          </p>
        </div>
      </div>
    );
  }

  const data: DistribucionData[] = [
    {
      name: 'Asistencias',
      value: asistencias,
      color: COLORS.asistencias,
    },
    {
      name: 'Tardanzas',
      value: tardanzas,
      color: COLORS.tardanzas,
    },
    {
      name: 'Faltas',
      value: faltas,
      color: COLORS.faltas,
    },
  ].filter(item => item.value > 0); // Solo mostrar si tiene valor

  return (
    <div className="w-full">
      {/* Estadísticas numéricas */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Asistencias</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {asistencias}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {((asistencias / total) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Tardanzas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {tardanzas}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {((tardanzas / total) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Faltas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {faltas}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {((faltas / total) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Gráfico de pastel */}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentage ? renderLabel : false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistribucionAsistenciaChart;
