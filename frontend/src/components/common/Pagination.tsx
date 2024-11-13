import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}) => {
  // Calcola intervallo di pagine da mostrare
  const getPageNumbers = () => {
    const delta = 2; // Numero di pagine da mostrare prima e dopo la pagina corrente
    const range = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 my-4">
      {/* Bottone Precedente */}
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
      >
        ←
      </Button>

      {/* Numeri Pagina */}
      <div className="flex items-center space-x-1">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`dots-${index}`}
                className="px-3 py-2 text-gray-500"
              >
                ...
              </span>
            );
          }

          const pageNumber = Number(page);
          return (
            <Button
              key={pageNumber}
              variant={currentPage === pageNumber ? 'primary' : 'secondary'}
              onClick={() => onPageChange(pageNumber)}
              disabled={isLoading}
              className={currentPage === pageNumber ? 'font-bold' : ''}
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>

      {/* Bottone Successivo */}
      <Button
        variant="secondary"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
      >
        →
      </Button>
    </div>
  );
};

export default Pagination;