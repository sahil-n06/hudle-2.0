'use client';
import { Icon } from '../icons';

const cx = (...c) => c.filter(Boolean).join(' ');

const BUTTON_VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-black',
  secondary:
    'bg-white text-slate-800 ring-1 ring-inset ring-slate-300 hover:bg-slate-100 hover:ring-slate-400',
  danger:
    'bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

const inputClass = (error) =>
  cx(
    'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors',
    'placeholder:text-slate-400 hover:border-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-100',
    error ? 'border-red-300' : 'border-slate-300',
  );

export function Input({ error, className, ...props }) {
  return (
    <input
      aria-invalid={!!error}
      className={cx(inputClass(error), className)}
      {...props}
    />
  );
}

export function Select({ error, className, children, ...props }) {
  return (
    <select
      aria-invalid={!!error}
      className={cx(inputClass(error), 'pr-8', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ error, className, ...props }) {
  return (
    <textarea
      aria-invalid={!!error}
      className={cx(inputClass(error), className)}
      {...props}
    />
  );
}

export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={cx('animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-16 text-slate-500"
      role="status"
    >
      <Spinner /> <span className="text-sm">{label}</span>
    </div>
  );
}

const ALERT = {
  error: 'bg-red-50 text-red-700 ring-red-200',
  success: 'bg-play-50 text-play-600 ring-play-50',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export function Alert({ type = 'error', children, className }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cx(
        'rounded-lg px-4 py-3 text-sm ring-1',
        ALERT[type],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon = 'search', title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="bg-accent-50 text-accent-500 grid h-11 w-11 place-items-center rounded-full">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      {children && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{children}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const BADGE = {
  green: 'bg-play-50 text-play-600 ring-play-50',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function Badge({ color = 'gray', children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        BADGE[color],
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children }) {
  return (
    <div className={cx('rounded-xl bg-white ring-1 ring-slate-200', className)}>
      {children}
    </div>
  );
}

export { cx };
