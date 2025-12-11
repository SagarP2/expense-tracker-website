import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Avatar } from './ui/Avatar';
import { Menu,Bell,LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { useState } from 'react';

import { UserProfile } from './UserProfile';
import { NotificationDropdown } from './NotificationDropdown';
import { ThemeToggle } from './ui/ThemeToggle';
import { ConfirmDialog } from './ui/ConfirmDialog';

export function Navbar({ onMenuClick }) {
  const { user,logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isProfileOpen,setIsProfileOpen] = useState(false);
  const [isNotificationOpen,setIsNotificationOpen] = useState(false);
  const [isLogoutConfirmOpen,setIsLogoutConfirmOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border px-4 py-3 lg:px-8 transition-all duration-300 shadow-sm support-[backdrop-filter]:bg-surface/60">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 text-text-secondary hover:text-primary transition-colors rounded-full hover:bg-primary/5 relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-surface animate-pulse" />
              )}
            </button>
            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>

          <div className="h-8 w-px bg-border hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-text">{user?.name}</p>
            </div>
            <div onClick={() => setIsProfileOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity">
              <Avatar name={user?.name} size="md" />
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="hidden lg:flex text-danger hover:bg-danger/10 hover:text-danger"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={logout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will be redirected to the login page."
      />
    </header>
  );
}
