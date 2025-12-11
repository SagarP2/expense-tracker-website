import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Wallet } from 'lucide-react';

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 border-b border-border backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-glow shadow-primary/20">
            <Wallet size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">Tracker</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Sign up</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
