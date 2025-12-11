
import { createContext,useContext,useState,useEffect,useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user,token } = useAuth();
    const [notifications,setNotifications] = useState([]);
    const [unreadCount,setUnreadCount] = useState(0);
    const [socket,setSocket] = useState(null);
    const [isLoading,setIsLoading] = useState(false);

    // Initialize Socket
    useEffect(() => {
        // Only connect if we have a user AND a token
        if (user && token && !socket) {
            const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000',{
                withCredentials: true,
                auth: { token } // Pass token for authentication
            });

            newSocket.on('connect',() => {
                console.log('🔌 Socket connected:',newSocket.id);
            });

            newSocket.on('notification:new',(notification) => {
                console.log('🔔 New notification:',notification);
                setNotifications(prev => [notification,...prev]);
                setUnreadCount(prev => prev + 1);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    },[user?._id,token]);

    // Fetch Notifications
    const fetchNotifications = useCallback(async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications`,{
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:',error);
        } finally {
            setIsLoading(false);
        }
    },[token]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    },[user?._id,fetchNotifications]);

    // Mark as read
    const markAsRead = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/${id}/read`,{
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n =>
                    n._id === id ? { ...n,isRead: true } : n
                ));
                setUnreadCount(prev => Math.max(0,prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:',error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/read-all`,{
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n,isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:',error);
        }
    };

    // Delete all notifications
    const deleteAllNotifications = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/delete-all`,{
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error deleting all notifications:',error);
        }
    };

    // Delete single notification
    const deleteNotification = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/${id}`,{
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setNotifications(currentNotifications => {
                    const target = currentNotifications.find(n => n._id === id);
                    if (target && !target.isRead) {
                        setUnreadCount(c => Math.max(0,c - 1));
                    }
                    return currentNotifications.filter(n => n._id !== id);
                });
            }
        } catch (error) {
            console.error('Error deleting notification:',error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            markAsRead,
            markAllAsRead,
            deleteAllNotifications,
            deleteNotification,
            fetchNotifications,
            socket
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

