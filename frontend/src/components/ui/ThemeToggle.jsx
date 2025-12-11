import { Moon,Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';

export function ThemeToggle() {
    const { theme,toggleTheme } = useTheme();

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
