import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Avatar';
import { Menu,Bell,LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { useState } from 'react';
import { UserProfile } from './UserProfile';

export function Navbar({ onMenuClick }) {
  const { user,logout } = useAuth();
  const [isProfileOpen,setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/20 px-4 py-3 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-text">{user?.name}</p>

            </div>
            <div onClick={() => setIsProfileOpen(true)} className="cursor-pointer">
              <Avatar name={user?.name} size="md" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="hidden sm:flex text-danger hover:bg-red-50 hover:text-danger"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>
      <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  );
}
