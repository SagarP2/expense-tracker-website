import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';

export function ThemeToggle({ mode = 'icon' }) {
    const { theme, toggleTheme } = useTheme();

    if (mode === 'dropdown') {
        return (
            <div className="relative">
                <select
                    value={theme}
                    onChange={toggleTheme}
                    className="appearance-none bg-surface border border-border text-text rounded-lg py-1.5 pl-3 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-currentColor"></div>
                </div>
            </div>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun size={20} className="text-warning" />
            ) : (
                <Moon size={20} className="text-primary" />
            )}
        </Button>
    );
}
