import React from 'react';
import { Plus, PanelLeftClose } from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  onNewChat: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewChat, isOpen, toggleSidebar }) => {
  if (!isOpen) return null;

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 z-20 hidden md:flex transition-colors duration-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Logo className="h-5 text-sidebar-foreground" />
          <span className="font-semibold text-lg tracking-tight text-sidebar-foreground">Lorph</span>
        </div>
        <button 
          onClick={toggleSidebar} 
          className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200 group"
        >
          <Plus size={18} className="transition-colors" />
          <span>New Chat</span>
        </button>
      </div>

      {/* History Placeholder */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="text-xs font-medium text-sidebar-foreground/50 mb-3 px-2 mt-4">Recent</div>
        <div className="flex flex-col gap-1">
          <p className="px-3 text-xs text-sidebar-foreground/40 italic">No recent history</p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
         <div className="text-center text-[10px] text-sidebar-foreground/40">
           Lorph AI v1.0
         </div>
      </div>
    </div>
  );
};