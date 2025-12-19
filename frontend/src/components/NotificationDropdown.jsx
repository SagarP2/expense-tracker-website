import { createPortal } from 'react-dom';
import { useRef, useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { acceptSettlementRequest } from '../services/collabApi';
import { useNavigate } from 'react-router-dom';

export function NotificationDropdown({ isOpen, onClose }) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteAllNotifications, deleteNotification, isLoading, fetchNotifications } = useNotifications();
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(false);

    const handlePay = async (notification) => {
        if (actionLoading) return;
        try {
            const collabId = notification.collabId || notification.payload?.collabId;

            if (!collabId) return;

            // Navigate to collaboration dashboard and trigger payment modal
            navigate(`/collaborations/${collabId}`, {
                state: { openPaymentModal: true }
            });
            onClose();

            // Optionally mark as read
            if (!notification.isRead) {
                markAsRead(notification._id);
            }

        } catch (error) {
            console.error("Navigation failed", error);
        }
    };

    const handleNotificationClick = (notification) => {
        // 1. Mark as read
        if (!notification.isRead) {
            markAsRead(notification._id);
        }

        // 2. Determine Route
        let path = '/dashboard'; // Default fallback
        const { type, collabId, payload } = notification;
        const targetCollabId = collabId || payload?.collabId;

        switch (type) {
            // Invites & Deletions -> List
            case 'COLLAB_INVITE':
            case 'invite_received': // Legacy
            case 'COLLAB_DELETED':
                path = '/collaborations';
                break;

            // Specific Collaboration Activity -> Dashboard
            case 'invite_response':
            case 'SETTLEMENT_REQUEST':
            case 'settlement_request': // Legacy
            case 'settlement_response':
            case 'settlement_paid':
            case 'SETTLEMENT_PARTIAL_PAYMENT':
            case 'COLLAB_DELETE_REQUEST':
            case 'COLLAB_DELETE_REJECTED':
            case 'EXPENSE_ADDED': // Future proofing
                if (targetCollabId) {
                    path = `/collaborations/${targetCollabId}`;
                }
                break;

            // Goals -> Dashboard (or Analysis if it existed)
            case 'GOAL_REACHED':
            case 'GOAL_PROGRESS':
            case 'GOAL_REGRESSED':
                path = '/dashboard';
                break;

            default:
                // If we have a collabId, try to go there based on assumption it's collab related
                if (targetCollabId) {
                    path = `/collaborations/${targetCollabId}`;
                }
                break;
        }

        // 3. Navigate & Close
        navigate(path);
        onClose();
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <>
            {/* Mobile Backdrop - Starts below header */}
            <div className="fixed inset-0 top-[60px] lg:top-16 bg-black/50 z-[99] lg:hidden animate-fade-in" onClick={onClose} />

            {/* Dropdown / Mobile Sheet - Starts below header */}
            <div
                ref={dropdownRef}
                className={`
                    fixed right-0 top-[60px] lg:top-16 lg:right-4
                    w-full lg:w-96 h-[calc(100vh-60px)] lg:h-[32rem]
                    bg-surface border-l lg:border border-border
                    shadow-2xl lg:rounded-xl
                    z-[100] flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                    animate-fade-in
                `}
            >

                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50 backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                        <Bell className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-text">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {notifications.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={deleteAllNotifications}
                                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                Clear all
                            </Button>
                        )}
                        <button onClick={onClose} className="lg:hidden p-1 hover:bg-surface-hover rounded-full">
                            <X className="w-5 h-5 text-text-secondary" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-secondary gap-2">
                            <Bell className="w-8 h-8 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`
                                    p-3 rounded-lg transition-colors relative group
                                    ${notification.isRead ? 'bg-surface hover:bg-surface-hover' : 'bg-primary/5 hover:bg-primary/10'}
                                `}
                            >
                                <div
                                    className="flex gap-3 cursor-pointer"
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={`
                                        w-2 h-2 rounded-full mt-2 flex-shrink-0
                                        ${notification.isRead ? 'bg-transparent' : 'bg-primary'}
                                    `} />
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm ${notification.isRead ? 'text-text-secondary' : 'text-text font-medium'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-text-tertiary">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                        {/* Show Reason for Partial Payments */}
                                        {notification.payload?.reason && (
                                            <p className="text-xs text-text-muted mt-1 bg-surface-highlight p-1.5 rounded-md border border-border inline-block italic">
                                                "{notification.payload.reason}"
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notification._id);
                                        }}
                                        className="p-1 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete notification"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Pay Button for Settlement Requests */}
                                {(notification.type === 'settlement_request' || notification.type === 'SETTLEMENT_REQUEST') && !notification.isRead && (
                                    <div className="mt-3 pl-5">
                                        <Button
                                            size="sm"
                                            className="w-full bg-primary text-white hover:bg-primary/90"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePay(notification);
                                            }}
                                        >
                                            Pay ₹{notification.payload?.amount}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div >
        </>,
        document.body
    );
}
