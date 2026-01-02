import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { User, Mail, Phone, Edit2 } from 'lucide-react';

import { ThemeToggle } from './ui/ThemeToggle';

export function UserProfile({ isOpen, onClose }) {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobileNumber: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                mobileNumber: user.mobileNumber || '',
            });
        }
    }, [user]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await updateProfile(formData);
            setSuccess('Profile updated successfully');
            setTimeout(() => setSuccess(''), 2000);
            setIsEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
            setTimeout(() => setError(''), 2000);
        }

    }


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="User Profile"
            description="Manage your personal information"
            className="max-w-lg text-text font-medium text-sm sm:text-base"
        >
            <div className="text-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-xl sm:text-3xl font-bold text-white shadow-lg shadow-primary/30">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-text">
                    @{user?.username || 'username'}
                </h2>
            </div>

            {error && (
                <div className="bg-danger/10 text-danger p-3 rounded-xl mb-6 text-sm font-medium border border-danger/20">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-success/10 text-success p-3 rounded-xl mb-6 text-sm font-medium border border-success/20">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 flex items-center gap-1.5">
                        <User size={12} /> Name
                    </label>
                    {isEditing ? (
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                            className="py-2 sm:py-3 text-sm sm:text-base"
                        />
                    ) : (
                        <div className="text-text font-medium p-2.5 sm:p-3.5 bg-surface-highlight/30 rounded-xl border border-border flex items-center justify-between group text-sm sm:text-base">
                            {user?.name}
                            <Edit2 size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 flex items-center gap-1.5">
                        <Mail size={12} /> Email
                    </label>
                    <div className="text-text font-medium p-2.5 sm:p-3.5 bg-surface-highlight/30 rounded-xl border border-border opacity-70 break-all text-xs sm:text-base">
                        {user?.email}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 flex items-center gap-1.5">
                        <Phone size={12} /> Mobile Number
                    </label>
                    {isEditing ? (
                        <Input
                            type="tel"
                            value={formData.mobileNumber}
                            onChange={(e) =>
                                setFormData({ ...formData, mobileNumber: e.target.value })
                            }
                            placeholder="Add mobile number"
                            className="py-2 sm:py-3 text-sm sm:text-base"
                        />
                    ) : (
                        <div className="text-text font-medium p-2.5 sm:p-3.5 bg-surface-highlight/30 rounded-xl border border-border flex items-center justify-between group text-sm sm:text-base">
                            {user?.mobileNumber || <span className="text-text-muted italic">Not set</span>}
                            <Edit2 size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>

                {/* Theme Toggle Dropdown */}
                <div className="pt-2 flex justify-between items-center bg-surface-highlight/10 p-2.5 sm:p-3 rounded-xl border border-border/40">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">App Theme</span>
                    <ThemeToggle mode="dropdown" />
                </div>

                <div className="flex gap-3 mt-4 sm:mt-6 pt-2">
                    {isEditing ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 py-2 sm:py-3 text-xs sm:text-sm"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 py-2 sm:py-3 shadow-lg shadow-primary/25 text-xs sm:text-sm">
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            className="w-full py-2 sm:py-3 shadow-lg shadow-primary/25 text-xs sm:text-sm"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </Button>
                    )}
                </div>
            </form>
        </Modal>
    );
}

