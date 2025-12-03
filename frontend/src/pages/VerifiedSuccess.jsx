import { useEffect } from 'react';
import { useNavigate,useSearchParams } from 'react-router-dom';
import { CheckCircle,Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VerifiedSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setUser } = useAuth();
    const token = searchParams.get('token');
    const userData = searchParams.get('user');

    useEffect(() => {
        if (token && userData) {
            try {
                // Auto-login: Store token and user data
                localStorage.setItem('token',token);
                const user = JSON.parse(decodeURIComponent(userData));
                localStorage.setItem('user',JSON.stringify(user));
                setUser(user);

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                },2000);
            } catch (error) {
                console.error('Auto-login failed:',error);
            }
        }
    },[token,userData,setUser,navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="glass p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="flex flex-col items-center">
                    <CheckCircle size={64} className="text-success mb-6" />
                    <h1 className="text-3xl font-bold text-text mb-2">You're verified 🎉</h1>
                    <p className="text-text-muted mb-8">
                        Your email has been successfully confirmed.
                        <br />
                        Redirecting to your dashboard...
                    </p>
                    <Loader2 size={24} className="text-primary animate-spin" />
                </div>
            </div>
        </div>
    );
};

export default VerifiedSuccess;
