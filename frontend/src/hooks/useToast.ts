import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

// Creiamo un singleton per gestire i toast globalmente
class ToastManager {
  private static instance: ToastManager;
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private toasts: Toast[] = [];

  private constructor() {}

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  addListener(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (toasts: Toast[]) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }

  show(message: string, type: ToastType = 'info') {
    const toast: Toast = {
      id: Date.now(),
      message,
      type
    };
    this.toasts.push(toast);
    this.notify();

    // Rimuovi automaticamente dopo 3 secondi
    setTimeout(() => {
      this.remove(toast.id);
    }, 3000);
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  getToasts() {
    return this.toasts;
  }
}

const toastManager = ToastManager.getInstance();

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Registra il listener quando il componente viene montato
  useState(() => {
    const listener = (newToasts: Toast[]) => setToasts([...newToasts]);
    toastManager.addListener(listener);
    return () => toastManager.removeListener(listener);
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    toastManager.show(message, type);
  }, []);

  const removeToast = useCallback((id: number) => {
    toastManager.remove(id);
  }, []);

  const clearToasts = useCallback(() => {
    toastManager.clear();
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts
  };
};

export default useToast;