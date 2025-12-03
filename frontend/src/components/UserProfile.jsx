import { useState,useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X } from 'lucide-react';

export function UserProfile({ isOpen,onClose }) {
    const { user,updateProfile } = useAuth();
    const [isEditing,setIsEditing] = useState(false);
    const [formData,setFormData] = useState({
        name: '',
        mobileNumber: '',
    });
    const [error,setError] = useState('');
    const [success,setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                mobileNumber: user.mobileNumber || '',
            });
        }
    },[user]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await updateProfile(formData);
            setSuccess('Profile updated successfully');
            setTimeout(() => setSuccess(''),2000);
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
            setTimeout(() => setError(''),2000);
        }

    }


    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="glass rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold text-text">
                        User Profile
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-danger p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">
                            Name
                        </label>
                        {isEditing ? (
                            <Input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData,name: e.target.value })
                                }
                                required
                            />
                        ) : (
                            <p className="text-text p-2 bg-white/50 rounded-lg border border-white/20">
                                {user?.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">
                            Email
                        </label>
                        <p className="text-text p-2 bg-white/50 rounded-lg border border-white/20">
                            {user?.email}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">
                            Mobile Number
                        </label>
                        {isEditing ? (
                            <Input
                                type="tel"
                                value={formData.mobileNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData,mobileNumber: e.target.value })
                                }
                                placeholder="Add mobile number"
                            />
                        ) : (
                            <p className="text-text p-2 bg-white/50 rounded-lg border border-white/20">
                                {user?.mobileNumber || 'Not set'}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        {isEditing ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                className="w-full"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

