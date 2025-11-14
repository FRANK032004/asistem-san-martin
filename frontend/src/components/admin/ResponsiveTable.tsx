"use client";

import React from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente tabla responsive para admin móvil
 * - Scroll horizontal automático en móvil
 * - Mantiene diseño desktop en pantallas grandes
 */
export function ResponsiveTable({ children, className = "" }: ResponsiveTableProps) {
  return (
    <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className={`min-w-full divide-y divide-gray-300 ${className}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

interface MobileActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}

/**
 * Botón optimizado para móvil - más grande y fácil de tocar
 * Tamaño mínimo 44x44px (recomendación Apple)
 */
export function MobileActionButton({ 
  children, 
  onClick, 
  variant = 'primary',
  className = "",
  disabled = false
}: MobileActionButtonProps) {
  const baseClasses = "min-h-[44px] min-w-[44px] px-4 py-2 rounded-md font-medium transition-colors touch-manipulation";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card optimizado para vista móvil
 * Padding reducido en móvil, normal en desktop
 */
export function MobileCard({ children, className = "" }: MobileCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-3 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
