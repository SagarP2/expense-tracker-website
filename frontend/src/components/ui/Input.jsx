import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Input({ className, label, error, ...props }) {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-sm font-medium text-text-muted">{label}</label>}
      <input
        className={twMerge(
          'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-gray-400',
          error && 'border-danger focus:ring-danger/20 focus:border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-danger animate-fade-in">{error}</p>}
    </div>
  );
}
