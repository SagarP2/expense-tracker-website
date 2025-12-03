import { useNavigate,useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

const VerifyError = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reason = searchParams.get('reason');

    const getMessage = () => {
        switch (reason) {
            case 'invalid':
                return 'The verification link is invalid or has expired.';
            case 'server':
                return 'A server error occurred. Please try again later.';
            default:
                return 'Verification failed. Please try again.';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="glass p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="flex flex-col items-center">
                    <XCircle size={64} className="text-danger mb-6" />
                    <h1 className="text-3xl font-bold text-text mb-2">Verification Failed</h1>
                    <p className="text-text-muted mb-8">{getMessage()}</p>
                    <Button onClick={() => navigate('/login')} variant="outline" className="w-full mb-4">
                        Go to Login
                    </Button>
                    <button
                        onClick={() => navigate('/register')}
                        className="text-primary hover:underline text-sm"
                    >
                        Register Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyError;
