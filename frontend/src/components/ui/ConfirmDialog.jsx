import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({ isOpen,onClose,onConfirm,title = 'Confirm Action',message = 'Are you sure?' }) {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={message}
        >
            <div className="flex gap-3 justify-end mt-6">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 sm:flex-none"
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className="flex-1 sm:flex-none shadow-lg shadow-danger/20"
                >
                    Confirm
                </Button>
            </div>
        </Modal>
    );
}
