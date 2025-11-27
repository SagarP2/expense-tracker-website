import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ children, className, variant = 'primary', size = 'md', ...props }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-600 hover:shadow-glow focus:ring-primary-500 shadow-sm',
    secondary: 'bg-white text-text border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-200 shadow-sm',
    danger: 'bg-danger text-white hover:bg-red-600 hover:shadow-lg focus:ring-red-500 shadow-sm',
    ghost: 'bg-transparent text-text hover:bg-gray-100 focus:ring-gray-200',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary-50 focus:ring-primary-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={twMerge(baseStyles, variants[variant], sizes[size], className)} 
      {...props}
    >
      {children}
    </button>
  );
}
