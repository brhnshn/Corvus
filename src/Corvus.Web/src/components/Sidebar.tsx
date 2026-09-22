import React from 'react';
import { 
  LayoutDashboard, 
  Grid, 
  Boxes, 
  Activity, 
  Clock, 
  Settings,
  User as UserIcon,
  LogOut
} from 'lucide-react';

export type PageId = 'dashboard' | 'services' | 'containers' | 'metrics' | 'uptime' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  username?: string | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onSelectPage,
  username,
  onLogout
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'Servisler', icon: Grid },
    { id: 'containers', label: 'Container\'lar', icon: Boxes },
    { id: 'metrics', label: 'Sistem Metrikleri', icon: Activity },
    { id: 'uptime', label: 'Uptime', icon: Clock },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ] as const;

  return (
    <aside className="w-64 bg-[#1a1d29] border-r border-[#2a2e3f] flex flex-col h-screen fixed left-0 top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#2a2e3f] gap-3">
        <img 
          src="/Corvus.png" 
          alt="Corvus" 
          className="w-10 h-10 object-contain shrink-0 rounded-md"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="flex flex-col">
          <span className="font-bold text-lg tracking-wider text-[#e5e7eb] leading-tight">CORVUS</span>
          <span className="text-[10px] text-[#9ca3af] uppercase tracking-widest font-mono">System Monitor</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#d4d4d8] text-[#0f1117] font-semibold shadow-sm'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      {username && (
        <div className="p-3.5 border-t border-[#2a2e3f] bg-[#0f1117]/50">
          <div className="flex items-center justify-between bg-[#1a1d29] border border-[#2a2e3f] rounded-lg px-3 py-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-[#d4d4d8]/10 text-[#d4d4d8] flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-[#e5e7eb] truncate">{username}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Çıkış Yap"
                className="text-[#9ca3af] hover:text-[#ef4444] p-1 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
