/**
 * 📊 Pagination Component
 * 
 * Componente de paginación profesional y reutilizable.
 * Incluye navegación, información de página y controles intuitivos.
 * 
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   totalItems={95}
 *   itemsPerPage={10}
 *   onPageChange={(page) => setPage(page)}
 * />
 * ```
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showItemsInfo?: boolean;
  showPageNumbers?: boolean;
  maxPageButtons?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showItemsInfo = true,
  showPageNumbers = true,
  maxPageButtons = 5,
  className = ''
}: PaginationProps) {
  // Calcular rango de items mostrados
  const from = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  // Calcular qué números de página mostrar
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Primera página siempre visible
    pages.push(1);

    if (shouldShowLeftDots) {
      pages.push('...');
    }

    // Páginas del medio
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (shouldShowRightDots) {
      pages.push('...');
    }

    // Última página siempre visible
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = showPageNumbers ? getPageNumbers() : [];

  // Handlers
  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));

  // Si no hay páginas, no mostrar nada
  if (totalPages <= 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 ${className}`}>
      {/* Información de items (móvil y desktop) */}
      {showItemsInfo && (
        <div className="flex-1 flex justify-between sm:hidden">
          <span className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{from}</span> a{' '}
            <span className="font-medium">{to}</span> de{' '}
            <span className="font-medium">{totalItems}</span> resultados
          </span>
        </div>
      )}

      {/* Controles de paginación (desktop) */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        {/* Info izquierda */}
        {showItemsInfo && (
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{from}</span> a{' '}
              <span className="font-medium">{to}</span> de{' '}
              <span className="font-medium">{totalItems}</span> resultados
            </p>
          </div>
        )}

        {/* Controles derecha */}
        <div className="flex items-center gap-2">
          {/* Primera página */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="h-9 w-9"
            title="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Página anterior */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-9 w-9"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Números de página */}
          {showPageNumbers && (
            <div className="flex items-center gap-1">
              {pageNumbers.map((page, index) => {
                if (page === '...') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-3 py-2 text-sm text-gray-500"
                    >
                      ...
                    </span>
                  );
                }

                const pageNumber = page as number;
                const isActive = pageNumber === currentPage;

                return (
                  <Button
                    key={pageNumber}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNumber)}
                    className={`h-9 min-w-[36px] ${
                      isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Página siguiente */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="h-9 w-9"
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Última página */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="h-9 w-9"
            title="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Controles móviles simplificados */}
      <div className="flex sm:hidden w-full justify-between items-center mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <span className="text-sm text-gray-700 font-medium">
          Página {currentPage} de {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * 🔢 Page Size Selector Component
 * 
 * Selector de cantidad de items por página
 */
export interface PageSizeSelectorProps {
  value: number;
  onChange: (size: number) => void;
  options?: number[];
  className?: string;
}

export function PageSizeSelector({
  value,
  onChange,
  options = [10, 25, 50, 100],
  className = ''
}: PageSizeSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="page-size" className="text-sm text-gray-700">
        Mostrar:
      </label>
      <select
        id="page-size"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option} por página
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * 📊 Complete Pagination Controls
 * 
 * Componente que combina paginación + selector de tamaño
 */
export interface PaginationControlsProps extends PaginationProps {
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationControls({
  onPageSizeChange,
  pageSizeOptions,
  ...paginationProps
}: PaginationControlsProps) {
  return (
    <div className="space-y-3">
      {onPageSizeChange && (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-gray-200">
          <PageSizeSelector
            value={paginationProps.itemsPerPage}
            onChange={onPageSizeChange}
            options={pageSizeOptions}
          />
        </div>
      )}
      <Pagination {...paginationProps} />
    </div>
  );
}
