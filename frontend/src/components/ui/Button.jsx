import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ children,className,variant = 'primary',size = 'md',...props }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 focus:ring-primary',
    secondary: 'bg-surface text-text border border-border hover:bg-surface-highlight hover:border-border focus:ring-border shadow-sm',
    danger: 'bg-danger text-white hover:bg-danger/90 hover:shadow-lg hover:shadow-danger/25 focus:ring-danger',
    ghost: 'bg-transparent text-text hover:bg-surface-highlight focus:ring-border',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'px-7 py-4 text-base',
  };

  return (
    <button
      className={twMerge(baseStyles,variants[variant],sizes[size],className)}
      {...props}
    >
      {children}
    </button>
  );
}
