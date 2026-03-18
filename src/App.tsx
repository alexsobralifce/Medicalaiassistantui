import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Login } from "./components/screens/Login";
import { Dashboard } from "./components/screens/Dashboard";
import { Consultation } from "./components/screens/Consultation";
import { Patients } from "./components/screens/Patients";
import { Settings } from "./components/screens/Settings";
import { CidDirectory } from "./components/screens/CidDirectory";
import { AdminUsers } from "./components/screens/AdminUsers";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { Toaster } from "sonner";
import { authApi, AuthenticatedUser } from "./lib/api";

export type Screen = "login" | "dashboard" | "consultation" | "patients" | "settings" | "cids" | "admin";
export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit?: string;
  image?: string;
  phone?: string;
  city?: string;
  state?: string;
  dob?: string;
  cpf?: string;
  reportedIssues?: string;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // 1. Restaurar Sessão e Estado de Navegação no Mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('medassist_token');
      if (token) {
        try {
          const user = await authApi.me();
          setCurrentUser(user);
          
          // Recuperar estado de navegação salvo
          const savedState = localStorage.getItem('medassist_app_state');
          if (savedState) {
            const { screen, patient } = JSON.parse(savedState);
            setCurrentScreen(screen || "dashboard");
            setSelectedPatient(patient || null);
          } else {
            setCurrentScreen("dashboard");
          }
        } catch (err) {
          console.error("Sessão inválida", err);
          localStorage.removeItem('medassist_token');
          localStorage.removeItem('medassist_app_state');
          setCurrentScreen("login");
        }
      }
      setIsRestoringSession(false);
    };
    restoreSession();
  }, []);

  // 2. Persistir Estado de Navegação sempre que mudar (desde que logado)
  useEffect(() => {
    if (currentUser && currentScreen !== "login") {
      localStorage.setItem('medassist_app_state', JSON.stringify({
        screen: currentScreen,
        patient: selectedPatient
      }));
    }
  }, [currentScreen, selectedPatient, currentUser]);

  const handleLogin = async (email: string, pass: string) => {
    setIsLoggingIn(true);
    try {
      const response = await authApi.login({ email, password: pass });
      localStorage.setItem('medassist_token', response.token);
      setCurrentUser(response.user);
      setCurrentScreen("dashboard");
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Falha ao logar. Verifique as credenciais.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStartConsultation = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentScreen("consultation");
  };

  const handleBackToDashboard = () => {
    setSelectedPatient(null);
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem('medassist_token');
    localStorage.removeItem('medassist_app_state');
    setCurrentUser(null);
    setSelectedPatient(null);
    setCurrentScreen("login");
  };

  if (isRestoringSession) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Restaurando sessão...</p>
      </div>
    );
  }

  if (currentScreen === "login" || !currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} isLoading={isLoggingIn} />
        <Toaster />
      </>
    );
  }

  // Se for a tela de consulta, ocupamos 100% da viewport removendo o framework de barras
  if (currentScreen === "consultation" && selectedPatient) {
    return (
      <div className="h-[100dvh] w-full bg-surface-alt overflow-hidden">
        <Consultation patient={selectedPatient as any} onBack={handleBackToDashboard} />
        <Toaster theme="system" />
      </div>
    );
  }

  return (
    <div className="app-layout no-right-drawer bg-surface-alt font-sans text-on-surface">
      
      {/* Grid injection via Inline Styles */}
      <style>{`
        .app-layout > header { grid-area: 1 / 1 / 2 / 2; }
        .app-layout > main { grid-area: 2 / 1 / 3 / 2; }
        .app-layout > aside { grid-area: 3 / 1 / 4 / 2; }

        @media (min-width: 768px) {
          .app-layout > header { grid-area: 1 / 2 / 2 / 3; }
          .app-layout > aside { grid-area: 1 / 1 / 3 / 2; }
          .app-layout > main { grid-area: 2 / 2 / 3 / 3; }
        }
      `}</style>
      
      <Topbar currentUser={currentUser} />

      <Sidebar
        onLogout={handleLogout}
        activeScreen={currentScreen}
        onNavigate={setCurrentScreen}
        currentUser={currentUser}
      />
      
      <main className="overflow-y-auto bg-surface relative">
        {currentScreen === "dashboard" && <Dashboard onStartConsultation={handleStartConsultation} />}
        {currentScreen === "patients" && <Patients onStartConsultation={handleStartConsultation} />}
        {currentScreen === "settings" && <Settings />}
        {currentScreen === "admin" && <AdminUsers />}
        {currentScreen === "cids" && <CidDirectory />}
      </main>

      <Toaster theme="system" />
    </div>
  );
}