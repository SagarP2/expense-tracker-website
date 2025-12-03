import { useEffect,useState } from 'react';
import { useSearchParams,useNavigate } from 'react-router-dom';
import { CheckCircle,XCircle,Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const token = searchParams.get('token');
    const [status,setStatus] = useState('verifying'); // verifying, success, error
    const [message,setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-email?token=${token}`);

                if (response.data.success && response.data.token) {
                    // Store token and user data
                    localStorage.setItem('token',response.data.token);
                    localStorage.setItem('user',JSON.stringify(response.data.user));

                    // Update auth context
                    setUser(response.data.user);

                    setStatus('success');
                    setMessage('Email verified successfully! Redirecting to dashboard...');

                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        navigate('/dashboard');
                    },2000);
                } else {
                    setStatus('error');
                    setMessage('Verification succeeded but login failed. Please login manually.');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed or link expired.');
            }
        };

        verify();
    },[token,navigate,setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="glass p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 size={48} className="text-primary animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-text mb-2">Verifying Email</h2>
                        <p className="text-text-muted">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle size={48} className="text-success mb-4" />
                        <h2 className="text-2xl font-bold text-text mb-2">Verified!</h2>
                        <p className="text-text-muted mb-6">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle size={48} className="text-danger mb-4" />
                        <h2 className="text-2xl font-bold text-text mb-2">Verification Failed</h2>
                        <p className="text-text-muted mb-6">{message}</p>
                        <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                            Back to Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
