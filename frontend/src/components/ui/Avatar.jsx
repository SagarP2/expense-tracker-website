import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Avatar({ name, src, size = 'md', className }) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={twMerge(
        'relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white font-semibold shadow-sm ring-2 ring-white',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
