import { twMerge } from 'tailwind-merge';

export function Card({ children,className,hover = false,...props }) {
  return (
    <div
      className={twMerge(
        'bg-surface border border-border rounded-2xl p-6 shadow-card',
        hover && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
