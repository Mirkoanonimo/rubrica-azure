import { Toast } from './Toast';
import useToast from '../../hooks/useToast';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;