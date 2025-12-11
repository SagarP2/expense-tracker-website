import { Search } from 'lucide-react';
import { clsx } from 'clsx';

export function EmptyState({
    title = "No data found",
    description = "Try adjusting your filters or add a new item.",
    icon: Icon = Search,
    action,
    className
}) {
    return (
        <div className={clsx("flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in",className)}>
            <div className="p-4 bg-neutral-100 rounded-full mb-4">
                <Icon size={32} className="text-text-muted opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
            <p className="text-text-muted max-w-xs mx-auto mb-6">{description}</p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
}
