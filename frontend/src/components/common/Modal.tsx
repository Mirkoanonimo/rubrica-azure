import React, { useEffect } from 'react';
import clsx from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  preventClose?: boolean;
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footerContent,
  size = 'md',
  preventClose = false,
  hideCloseButton = false
}) => {
  // Unisce i due useEffect in uno
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      
      // Gestione tasto ESC
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !preventClose) {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose, preventClose]);

  // Handler per il click sul backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose) {
      onClose();
    }
  };

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-50",
          "transition-opacity ease-in-out duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
      />
      {/* Modal Content */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={clsx(
              "relative bg-white rounded-lg shadow-xl",
              "w-full transform transition-all",
              sizeClasses[size],
              "animate-in fade-in zoom-in-95 duration-300"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3
                className="text-lg font-semibold text-gray-900"
                id="modal-title"
              >
                {title}
              </h3>
              {!hideCloseButton && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={onClose}
                  aria-label="Chiudi"
                  disabled={preventClose}
                >
                  <span className="sr-only">Chiudi</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Body */}
            <div className="p-4">
              {children}
            </div>
            {/* Footer */}
            {footerContent && (
              <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
                {footerContent}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;