import { useState,useEffect } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import { Mail,RefreshCw,CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const VerifyPending = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser } = useAuth();
    const email = location.state?.email || 'your email';
    const [resending,setResending] = useState(false);
    const [message,setMessage] = useState('');
    const [isVerified,setIsVerified] = useState(false);

    // Polling for verification status
    useEffect(() => {
        if (!email || email === 'your email') return;

        const checkVerification = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-status?email=${encodeURIComponent(email)}`
                );

                if (response.data.verified) {
                    // User is verified, call auto-login
                    const loginResponse = await axios.post(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/auto-login`,
                        { email }
                    );

                    // Store token and user data
                    localStorage.setItem('token',loginResponse.data.token);
                    localStorage.setItem('user',JSON.stringify(loginResponse.data));
                    setUser(loginResponse.data);
                    setIsVerified(true);
                    setMessage('Email verified successfully! Redirecting to dashboard...');

                    // Redirect to dashboard
                    setTimeout(() => {
                        navigate('/dashboard');
                    },2000);
                }
            } catch (error) {
                // Silently fail - user might not be verified yet
                console.log('Verification check:',error.response?.data?.message || 'Not verified yet');
            }
        };

        // Poll every 3 seconds
        const interval = setInterval(checkVerification,3000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    },[email,setUser,navigate]);

    const handleResend = async () => {
        setResending(true);
        setMessage('');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/resend-verification`,{ email });
            setMessage('Verification email sent! Please check your inbox.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to resend email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const handleGoToDashboard = () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="glass p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="flex flex-col items-center">
                    {isVerified ? (
                        <CheckCircle size={64} className="text-success mb-6" />
                    ) : (
                        <Mail size={64} className="text-primary mb-6" />
                    )}
                    <h1 className="text-3xl font-bold text-text mb-2">
                        {isVerified ? "You're verified! 🎉" : "Verify that's you"}
                    </h1>
                    <p className="text-text-muted mb-6">
                        {isVerified ? 'Taking you to your dashboard...' : 'We sent a verification email to:'}
                    </p>
                    {!isVerified && <p className="text-text font-semibold mb-6">{email}</p>}
                    {!isVerified && (
                        <p className="text-text-muted mb-8">
                            Please click the "Verify Now" button in your email to continue.
                        </p>
                    )}

                    {message && (
                        <div className={`p-3 rounded-lg mb-4 text-sm w-full ${message.includes('sent') || message.includes('verified') || message.includes('successfully')
                                ? 'bg-green-50 text-green-600'
                                : 'bg-red-50 text-danger'
                            }`}>
                            {message}
                        </div>
                    )}

                    {!isVerified && (
                        <>
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
                                onClick={handleGoToDashboard}
                                className="text-primary hover:underline text-sm"
                            >
                                Go to Dashboard
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyPending;
