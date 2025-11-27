import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Avatar';
import { Menu, Bell, LogOut, Search } from 'lucide-react';
import { Button } from './ui/Button';

export function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

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
          
          {/* Search Bar - Hidden on mobile, visible on tablet+ */}
          <div className="hidden md:flex items-center relative w-64 lg:w-96">
            <Search className="absolute left-3 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50/50 border border-transparent focus:bg-white focus:border-primary/20 focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <button className="relative p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-gray-100">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
          </button>

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-text">{user?.name}</p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
            <Avatar name={user?.name} size="md" />
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
    </header>
  );
}
