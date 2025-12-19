import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, ChevronRight, Wallet, Users, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useState } from 'react';

export function Sidebar({ isOpen, setIsOpen }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Receipt, label: 'Transactions', path: '/transactions' },
    { icon: Users, label: 'Collaborations', path: '/collaborations' },
  ];

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-[60] lg:z-auto w-72 bg-surface/95 backdrop-blur-xl border-r border-border shadow-2xl lg:shadow-none transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) lg:transform-none flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-glow shadow-primary/30">
              <Wallet size={20} />
            </div>
            Tracker
          </h1>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-text-secondary hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 py-6 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => clsx(
                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-text-secondary hover:bg-primary/5 hover:text-primary"
              )}
            >
              <item.icon size={20} className={clsx("transition-transform group-hover:scale-110")} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={16} className={clsx("opacity-0 -translate-x-2 transition-all", ({ isActive }) => isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-50 group-hover:translate-x-0")} />
            </NavLink>
          ))}
        </nav>

        {/* Logout Button - Mobile Only */}
        <div className="p-4 border-t border-border/50 lg:hidden">
          <button
            onClick={() => {
              setIsOpen(false);
              setIsLogoutConfirmOpen(true);
            }}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-text-muted hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={20} className="transition-transform group-hover:scale-110" />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
      />
    </>
  );
}
