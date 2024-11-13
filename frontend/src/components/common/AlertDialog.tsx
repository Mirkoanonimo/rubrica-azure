import React from 'react';
import { Button } from './Button';
import clsx from 'clsx';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Si',
  cancelLabel = 'No',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false
}) => {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    if (!isLoading) onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    if (!isLoading) onOpenChange(false);
  };

  // Previene che i click sul backdrop chiudano il dialog durante il loading
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div 
        className={clsx(
          "bg-white rounded-lg shadow-lg w-full max-w-md p-6",
          "transform transition-all",
          "animate-in fade-in zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
          "data-[state=open]:duration-500"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;