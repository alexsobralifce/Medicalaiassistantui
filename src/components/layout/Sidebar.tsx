import { LayoutDashboard, LogOut, Settings, Users, BookOpen, ShieldAlert, Activity } from "lucide-react";
import { cn } from "../ui/utils";
import { Screen } from "../../App";
import { AuthenticatedUser } from "../../lib/api";
import { ThemeToggle } from "../ui/theme-toggle";

interface SidebarProps {
  onLogout: () => void;
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  currentUser: AuthenticatedUser;
}

export function Sidebar({ onLogout, activeScreen, onNavigate, currentUser }: SidebarProps) {
  // O Header Topo (Brand) só aparece na Sidebar para Tablet/Desktop 
  // no Mobile, a Sidebar vira a Bottom Nav e perde o título
  
  return (
    <aside className="
      z-50 bg-surface border-border flex
      /* MOBILE: Bottom Navigation Bar */
      flex-row items-center justify-around border-t w-full h-16
      /* TABLET/DESKTOP: Sidebar fixada na Esquerda (grid-area) */
      md:flex-col md:h-full md:border-t-0 md:border-r md:py-6 md:justify-start overflow-y-auto overflow-x-hidden
    ">
      
      {/* Brand - Hide Mobile */}
      <div className="hidden md:flex items-center justify-center lg:justify-start px-4 mb-8">
        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
          <Activity className="h-7 w-7 text-primary" />
        </div>
        <span className="ml-3 text-xl font-bold tracking-tight text-primary hidden lg:block">MedAssist</span>
      </div>

      <nav className="flex flex-row md:flex-col items-center md:items-stretch justify-around md:justify-start w-full md:flex-1 md:px-3 space-x-1 md:space-x-0 md:space-y-2">
        <SidebarItem icon={<LayoutDashboard size={24} />} label="Painel" isActive={activeScreen === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        <SidebarItem icon={<Users size={24} />} label="Pacientes" isActive={activeScreen === 'patients'} onClick={() => onNavigate('patients')} />
        <SidebarItem icon={<BookOpen size={24} />} label="CIDs" isActive={activeScreen === 'cids'} onClick={() => onNavigate('cids')} />
        
        <div className="hidden md:block w-full h-px bg-border my-4" />
        
        <SidebarItem icon={<Settings size={24} />} label="Ajustes" isActive={activeScreen === 'settings'} onClick={() => onNavigate('settings')} />
        
        {currentUser.role === 'ADMIN' && (
          <SidebarItem icon={<ShieldAlert size={24} />} label="Contas" isActive={activeScreen === 'admin'} onClick={() => onNavigate('admin')} />
        )}
      </nav>

      {/* Footer Controls - Hide Mobile */}
      <div className="hidden md:block px-3 mt-auto space-y-2 pt-4 border-t border-border">
        <div className="flex items-center justify-center lg:justify-start px-3 mb-4">
           <ThemeToggle />
           <span className="ml-3 font-medium text-sm text-muted hidden lg:block">Tema</span>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center justify-center lg:justify-start w-full p-3 text-on-surface hover:bg-surface-alt rounded-xl transition-colors shrink-0 group"
          title="Sair"
        >
          <LogOut size={22} className="shrink-0 text-muted group-hover:text-critical transition-colors" />
          <span className="ml-3 font-medium hidden lg:block group-hover:text-critical transition-colors">Sair</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col md:flex-row items-center justify-center lg:justify-start p-2 md:p-3 rounded-xl transition-all duration-200 shrink-0 interactive",
        isActive 
          ? "text-primary md:bg-primary/10" 
          : "text-muted hover:bg-surface-alt hover:text-on-surface"
      )}
      title={label}
    >
      <div className={cn("shrink-0 flex items-center justify-center w-6 md:w-8 transition-transform", isActive ? "scale-110" : "")}>
        {icon}
      </div>
      {/* Texto no Mobile (Bem pequeno embaixo) */}
      <span className={cn("text-[10px] mt-1 md:hidden font-medium", isActive ? "font-bold text-primary" : "")}>
         {label}
      </span>
      {/* Texto no Desktop (Maior ao lado) */}
      <span className={cn("ml-3 text-sm font-medium truncate hidden lg:block", isActive ? "font-bold" : "")}>
        {label}
      </span>
    </button>
  );
}
