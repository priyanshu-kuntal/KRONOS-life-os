import { create } from 'zustand';

export type ToastType = 'success' | 'info' | 'warning' | 'danger' | 'error';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id' | 'type'> & { type?: ToastType }) => void;
  hideToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: ({ message, title, type = 'info', duration = 3500 }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const normalizedType: 'success' | 'info' | 'warning' | 'danger' = type === 'error' ? 'danger' : type;
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type: normalizedType, duration }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
