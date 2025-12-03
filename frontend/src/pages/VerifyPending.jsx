import { useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { Mail,RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import axios from 'axios';

const VerifyPending = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || 'your email';
    const [resending,setResending] = useState(false);
    const [message,setMessage] = useState('');

    const handleResend = async () => {
        setResending(true);
        setMessage('');
        try {
            // You'll need to create a resend endpoint
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/resend-verification`,{ email });
            setMessage('Verification email sent! Please check your inbox.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to resend email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="glass p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="flex flex-col items-center">
                    <Mail size={64} className="text-primary mb-6" />
                    <h1 className="text-3xl font-bold text-text mb-2">Verify that's you</h1>
                    <p className="text-text-muted mb-6">
                        We sent a verification email to:
                    </p>
                    <p className="text-text font-semibold mb-6">{email}</p>
                    <p className="text-text-muted mb-8">
                        Please click the "Verify Now" button in your email to continue.
                    </p>

                    {message && (
                        <div className={`p-3 rounded-lg mb-4 text-sm w-full ${message.includes('sent') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-danger'
                            }`}>
                            {message}
                        </div>
                    )}

                    <Button
                        onClick={handleResend}
                        variant="outline"
                        className="w-full mb-4"
                        disabled={resending}
                    >
                        {resending ? (
                            <>
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} className="mr-2" />
                                Resend Verification Email
                            </>
                        )}
                    </Button>

                    <button
                        onClick={() => navigate('/login')}
                        className="text-primary hover:underline text-sm"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyPending;
