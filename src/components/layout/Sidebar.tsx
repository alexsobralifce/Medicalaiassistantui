import { LayoutDashboard, LogOut, Settings, Users, Activity, Menu } from "lucide-react";
import { cn } from "../ui/utils";
import { Screen } from "../../App";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "../ui/sheet";
import { Button } from "../ui/button";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SidebarProps {
  onLogout: () => void;
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Sidebar({ onLogout, activeScreen, onNavigate }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (screen: Screen) => {
    onNavigate(screen);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#008080] text-white p-4 flex items-center justify-start shadow-md shrink-0 z-20 gap-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0 bg-[#008080] text-white border-none">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation for mobile devices</SheetDescription>
            </VisuallyHidden>
            <SidebarContent 
              onLogout={onLogout} 
              activeScreen={activeScreen} 
              onNavigate={handleNavigate} 
              isMobile={true}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm mr-3">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">MedAssist AI</span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#008080] text-white flex-col py-6 transition-all duration-300 shadow-xl z-10 h-full">
        <SidebarContent 
          onLogout={onLogout} 
          activeScreen={activeScreen} 
          onNavigate={onNavigate} 
          isMobile={false}
        />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  onLogout: () => void;
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isMobile: boolean;
}

function SidebarContent({ onLogout, activeScreen, onNavigate, isMobile }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={cn("flex items-center justify-start px-6 mb-10", isMobile ? "mt-6" : "")}>
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <Activity className="h-8 w-8 text-white" />
        </div>
        <span className="ml-3 text-xl font-bold tracking-tight">MedAssist AI</span>
      </div>

      <nav className="flex-1 px-2 space-y-2">
        <SidebarItem 
          icon={<LayoutDashboard size={22} />} 
          label="Painel" 
          isActive={activeScreen === 'dashboard'} 
          onClick={() => onNavigate('dashboard')}
        />
        <SidebarItem 
          icon={<Users size={22} />} 
          label="Pacientes" 
          isActive={false} 
          onClick={() => {}}
        />
        <SidebarItem 
          icon={<Settings size={22} />} 
          label="Configurações" 
          isActive={false} 
          onClick={() => {}}
        />
      </nav>

      <div className="px-2 pb-4">
        <button 
          onClick={onLogout}
          className="flex items-center justify-start w-full p-3 text-white/80 hover:bg-white/10 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="ml-3 font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-start w-full p-3 px-4 rounded-xl transition-all duration-200 group",
        isActive 
          ? "bg-white text-[#008080] shadow-md" 
          : "text-white/80 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
      <span className={cn("ml-3 font-medium", isActive ? "font-semibold" : "")}>
        {label}
      </span>
    </button>
  );
}
