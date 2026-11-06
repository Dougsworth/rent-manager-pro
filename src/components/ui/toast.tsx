import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-4 bottom-20 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:w-[380px] lg:bottom-6 print:hidden"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Same drawn marks as StatusBadge, so a toast reads by shape and words, not colour. */
const marks: Record<Toast['type'], string> = {
  success: 'bg-paid',
  error: 'border border-late hatch-late',
  warning: 'border border-due',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className="flex items-start gap-3 border border-rule bg-popover py-3 pl-4 pr-1.5 text-ink shadow-lg"
    >
      <span aria-hidden="true" className={cn('mt-1 h-3 w-1.5 shrink-0', marks[toast.type])} />
      <p className={cn('flex-1 py-px text-[15px] leading-snug', toast.type === 'error' && 'font-medium')}>{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-my-1.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-quiet transition-colors duration-100 hover:bg-secondary hover:text-ink"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
