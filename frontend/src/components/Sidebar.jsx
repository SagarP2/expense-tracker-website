import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, ChevronRight, Wallet, Users } from 'lucide-react';
import { clsx } from 'clsx';

export function Sidebar({ isOpen, setIsOpen }) {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Receipt, label: 'Transactions', path: '/transactions' },
    { icon: Users, label: 'Collaborations', path: '/collaborations' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 glass border-r border-white/20 transform transition-transform duration-300 ease-out lg:transform-none flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-glow">
              <Wallet size={20} />
            </div>
            Tracker
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-6">
          <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => clsx(
                "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-white shadow-glow" 
                  : "text-text-muted hover:bg-white/50 hover:text-primary"
              )}
            >
              <item.icon size={20} className={clsx("transition-transform group-hover:scale-110")} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={16} className={clsx("opacity-0 -translate-x-2 transition-all", ({isActive}) => isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-50 group-hover:translate-x-0")} />
            </NavLink>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={60} />
            </div>
            <p className="text-xs text-gray-400 font-medium mb-1">Pro Tip</p>
            <p className="text-sm font-medium leading-relaxed">Track your expenses daily to save more!</p>
          </div>
        </div>
      </aside>
    </>
  );
}
