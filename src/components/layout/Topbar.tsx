import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AuthenticatedUser } from "../../lib/api";

interface TopbarProps {
  currentUser: AuthenticatedUser | null;
  onMobileMenuToggle?: () => void;
}

export function Topbar({ currentUser, onMobileMenuToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full flex items-center justify-between px-4 md:px-6 h-16 bg-surface/80 backdrop-blur-md border-b border-border hide-mobile-flex">
      {/* Mobile Hamburger (Only visible if we opted to use a Drawer on mobile instead of Bottom Tabs, but we'll use bottom tabs, so this is just fallback) */}
      <div className="flex items-center gap-2 md:hidden">
        {onMobileMenuToggle && (
          <Button variant="ghost" size="icon" onClick={onMobileMenuToggle} className="mr-2">
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <span className="font-bold text-lg text-primary tracking-tight">MedAssist</span>
      </div>

      <div className="hidden md:flex items-center flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input 
          placeholder="Buscar pacientes, prontuários..." 
          className="pl-9 bg-surface-alt border-border/50 focus-visible:ring-primary rounded-full h-10 w-full"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Button variant="ghost" size="icon" className="relative text-muted hover:text-foreground interactive rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-critical rounded-full border border-surface"></span>
        </Button>
        
        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-semibold leading-none">{currentUser?.name || 'Dr(a).'}</p>
            <p className="text-xs text-muted mt-1">{currentUser?.role === 'ADMIN' ? 'Administrador' : 'Médico'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-surface text-primary flex items-center justify-center font-bold shadow-sm border border-primary/10">
            {currentUser?.name?.charAt(0).toUpperCase() || <User size={18} />}
          </div>
        </div>
      </div>
    </header>
  );
}
