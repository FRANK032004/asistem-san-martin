'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';
import CountUp from 'react-countup';

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'yellow';
  suffix?: string;
  prefix?: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const colorVariants = {
  green: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    text: 'text-emerald-800 dark:text-emerald-200',
    accent: 'text-emerald-600 dark:text-emerald-400'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-800 dark:text-blue-200',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-800 dark:text-purple-200',
    accent: 'text-purple-600 dark:text-purple-400'
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900',
    text: 'text-orange-800 dark:text-orange-200',
    accent: 'text-orange-600 dark:text-orange-400'
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-200',
    accent: 'text-red-600 dark:text-red-400'
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950 dark:to-amber-900',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-800 dark:text-yellow-200',
    accent: 'text-yellow-600 dark:text-yellow-400'
  }
};

export default function StatCard({
  title,
  value,
  previousValue,
  icon,
  color,
  suffix = '',
  prefix = '',
  description,
  trend
}: StatCardProps) {
  const variant = colorVariants[color];
  
  const getTrendIcon = () => {
    if (!trend || !previousValue) return null;
    
    const percentage = ((value - previousValue) / previousValue * 100).toFixed(1);
    const isPositive = trend === 'up' ? value > previousValue : value < previousValue;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp className={`h-3 w-3 ${!isPositive ? 'rotate-180' : ''}`} />
        <span>{Math.abs(parseFloat(percentage))}%</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={`
        ${variant.bg} ${variant.border} 
        border-2 shadow-lg hover:shadow-xl 
        transition-all duration-300 
        cursor-pointer group
        relative overflow-hidden
      `}>
        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                        translate-x-[-100%] group-hover:translate-x-[100%] 
                        transition-transform duration-1000 ease-out" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${variant.text}`}>
            {title}
          </CardTitle>
          <motion.div 
            className={`${variant.iconBg} p-2 rounded-lg`}
            whileHover={{ rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className={`h-4 w-4 ${variant.icon}`}>
              {icon}
            </div>
          </motion.div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${variant.accent}`}>
                {prefix}
                <CountUp
                  end={value}
                  duration={2.5}
                  preserveValue
                  useEasing
                />
                {suffix}
              </span>
            </div>
            
            {getTrendIcon()}
          </div>
          
          {description && (
            <p className={`text-xs ${variant.text} opacity-70 mt-1`}>
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
