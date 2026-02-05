import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings2, 
  Palette, 
  Link2, 
  Sun, 
  Moon, 
  Laptop,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export type Theme = 'light' | 'dark' | 'system';

interface GuestMenuProps {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

// Brand Icons as standard SVGs
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
);

export const GuestMenu: React.FC<GuestMenuProps> = ({ currentTheme, setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'theme' | 'links' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) setActiveSubmenu(null);
  };

  const handleSubmenuClick = (submenu: 'theme' | 'links') => {
    setActiveSubmenu(activeSubmenu === submenu ? null : submenu);
  };

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    // Don't close immediately, nice UX to see selection
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={toggleMenu}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Settings2 size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-popover text-popover-foreground border border-border rounded-xl shadow-lg shadow-black/10 py-1 z-50 animate-fade-in-up origin-top-right overflow-hidden">
          
          {/* Main Menu */}
          <div className="p-1">
            <button 
              onClick={() => handleSubmenuClick('theme')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${activeSubmenu === 'theme' ? 'bg-accent' : 'hover:bg-accent/50'}`}
            >
              <div className="flex items-center gap-2.5">
                <Palette size={16} className="text-muted-foreground" />
                <span>Theme</span>
              </div>
              <ChevronRight size={14} className={`text-muted-foreground transition-transform ${activeSubmenu === 'theme' ? 'rotate-90' : ''}`} />
            </button>
            
            {/* Theme Submenu */}
            {activeSubmenu === 'theme' && (
              <div className="ml-2 pl-2 border-l border-border my-1 space-y-0.5 animate-fade-in">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Laptop, label: 'System' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleThemeChange(item.id as Theme)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon size={14} />
                      <span>{item.label}</span>
                    </div>
                    {currentTheme === item.id && <Check size={14} className="text-primary" />}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={() => handleSubmenuClick('links')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${activeSubmenu === 'links' ? 'bg-accent' : 'hover:bg-accent/50'}`}
            >
              <div className="flex items-center gap-2.5">
                <Link2 size={16} className="text-muted-foreground" />
                <span>Links</span>
              </div>
              <ChevronRight size={14} className={`text-muted-foreground transition-transform ${activeSubmenu === 'links' ? 'rotate-90' : ''}`} />
            </button>

            {/* Links Submenu */}
            {activeSubmenu === 'links' && (
              <div className="ml-2 pl-2 border-l border-border my-1 space-y-0.5 animate-fade-in">
                 <a 
                    href="https://www.instagram.com/al_marid_.1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors w-full"
                 >
                    <InstagramIcon />
                    <span>Instagram</span>
                    <ExternalLink size={10} className="ml-auto opacity-50" />
                 </a>
                 <a 
                    href="https://t.me/al_marid_1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors w-full"
                 >
                    <TelegramIcon />
                    <span>Telegram</span>
                    <ExternalLink size={10} className="ml-auto opacity-50" />
                 </a>
                 <a 
                    href="https://github.com/AL-MARID/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-accent/50 transition-colors w-full"
                 >
                    <GithubIcon />
                    <span>GitHub</span>
                    <ExternalLink size={10} className="ml-auto opacity-50" />
                 </a>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};