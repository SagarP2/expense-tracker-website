import { createContext,useState,useEffect,useContext } from 'react';
import api from '../utils/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user,setUser] = useState(null);
    const [token,setToken] = useState(localStorage.getItem('token'));
    const [loading,setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (storedToken && storedUser) {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            }
            setLoading(false);
        };
        checkUser();
    },[]);

    const login = async (email,password) => {
        const { data } = await api.post('/auth/login',{ email,password });
        localStorage.setItem('token',data.token);
        localStorage.setItem('user',JSON.stringify(data));
        setUser(data);
        setToken(data.token);
    };

    const register = async (name,email,password,mobileNumber) => {
        const { data } = await api.post('/auth/register',{ name,email,password,mobileNumber });
        // Don't auto-login - user must verify email first
        // Just return the response data which includes the verification message
        return data;
    };

    const updateProfile = async (userData) => {
        const { data } = await api.put('/users/profile',userData);
        localStorage.setItem('user',JSON.stringify(data));
        setUser(data);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user,token,setUser,login,register,logout,loading,updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
