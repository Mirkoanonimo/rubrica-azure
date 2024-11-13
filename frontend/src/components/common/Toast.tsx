import { useEffect } from 'react';
import clsx from 'clsx';
import { ToastType } from '../../hooks/useToast';

interface ToastProps {
  id: number;
  message: string;
  type: ToastType;
  onRemove: (id: number) => void;
  duration?: number;
}

export const Toast = ({
  id,
  message,
  type,
  onRemove,
  duration = 3000
}: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const typeStyles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  };

  return (
    <div
      className={clsx(
        'max-w-sm w-full rounded-lg shadow-lg border p-4',
        'transform transition-all duration-300 ease-in-out',
        'animate-in slide-in-from-right fade-in',
        typeStyles[type]
      )}
      role="alert"
    >
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => onRemove(id)}
          className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <span className="sr-only">Chiudi</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;