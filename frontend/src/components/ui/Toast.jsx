import { useEffect } from 'react';
import { CheckCircle,AlertCircle,X,Info } from 'lucide-react';
import { clsx } from 'clsx';

export function Toast({
    message,
    type = 'success',
    onClose,
    duration = 3000,
    isVisible
}) {
    useEffect(() => {
        if (isVisible && duration) {
            const timer = setTimeout(() => {
                onClose();
            },duration);
            return () => clearTimeout(timer);
        }
    },[isVisible,duration,onClose]);

    if (!isVisible) return null;

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
        warning: AlertCircle,
    };

    const styles = {
        success: 'bg-white border-l-4 border-success text-text shadow-lg',
        error: 'bg-white border-l-4 border-danger text-text shadow-lg',
        info: 'bg-white border-l-4 border-info text-text shadow-lg',
        warning: 'bg-white border-l-4 border-warning text-text shadow-lg',
    };

    const Icon = icons[type];

    return (
        <div className={clsx(
            "fixed bottom-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg min-w-[300px] max-w-md animate-slide-in-right",
            styles[type]
        )}>
            <Icon size={20} className={clsx(
                type === 'success' && 'text-success',
                type === 'error' && 'text-danger',
                type === 'info' && 'text-info',
                type === 'warning' && 'text-warning',
            )} />
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="text-text-muted hover:text-text transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}
