'use client';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Icon } from './icons';
import { cx } from './ui';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const dismiss = useCallback(
    (id) => setToasts((all) => all.filter((t) => t.id !== id)),
    [],
  );
  const toast = useCallback(
    (message, type = 'success') => {
      const id = ++nextId.current;
      setToasts((all) => [...all.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 top-20 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              'pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-white p-4 text-sm font-medium shadow-xl ring-1',
              t.type === 'error'
                ? 'text-red-700 ring-red-200'
                : 'text-slate-800 ring-slate-200',
            )}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <Icon
              name={t.type === 'error' ? 'x' : 'check'}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span className="flex-1">{t.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
