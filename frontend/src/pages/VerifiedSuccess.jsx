import { useEffect,useState } from 'react';
import { useNavigate,useSearchParams } from 'react-router-dom';
import { CheckCircle,Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosInstance';
import Button from '../components/ui/Button';

const VerifiedSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser,setToken } = useAuth();
    const [isLoading,setIsLoading] = useState(false);

    // Auto-login if token is present
    useEffect(() => {
        const token = searchParams.get('token');

        const performAutoLogin = async () => {
            if (!token) return;

            try {
                setIsLoading(true);
                // Set token locally first to allow API call
                localStorage.setItem('token',token);

                // Fetch user data
                const { data: userData } = await api.get('/users/profile');

                // Update context
                setToken(token);
                setUser(userData);
                localStorage.setItem('user',JSON.stringify(userData));

                // Redirect
                setTimeout(() => navigate('/dashboard'),1000);
            } catch (error) {
                console.error('Auto-login failed:',error);
                localStorage.removeItem('token');
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            performAutoLogin();
        }
    },[searchParams,navigate,setUser,setToken]);

    const handleGoToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="glass p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <div className="flex flex-col items-center">
                    <CheckCircle size={64} className="text-success mb-6" />
                    <h1 className="text-3xl font-bold text-text mb-2">You're verified 🎉</h1>

                    {isLoading ? (
                        <div className="flex flex-col items-center mt-4">
                            <Loader className="animate-spin text-primary mb-2" />
                            <p className="text-text-muted">Logging you in...</p>
                        </div>
                    ) : (
                        <div className="mt-6 w-full">
                            <Button
                                onClick={handleGoToDashboard}
                                className="w-full justify-center"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifiedSuccess;
