import { AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const isError = type === 'error';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 text-left">
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isSuccess ? 'bg-success/10 text-success' :
                        isError ? 'bg-danger/10 text-danger' :
                            'bg-primary/10 text-primary'
                        }`}>
                        {isSuccess ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <p className="text-text-muted font-medium text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                <Button
                    onClick={onClose}
                    className={`w-full py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] ${isSuccess ? 'bg-success hover:bg-success/90 shadow-success/25' :
                        isError ? 'bg-danger hover:bg-danger/90 shadow-danger/25' :
                            'bg-primary hover:bg-primary/90 shadow-primary/25'
                        }`}
                >
                    Okay
                </Button>
            </div>
        </Modal>
    );
}
