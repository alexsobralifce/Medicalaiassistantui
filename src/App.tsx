import { useState } from "react";
import { Login } from "./components/screens/Login";
import { Dashboard } from "./components/screens/Dashboard";
import { Consultation } from "./components/screens/Consultation";
import { Sidebar } from "./components/layout/Sidebar";
import { Toaster } from "sonner@2.0.3";

export type Screen = "login" | "dashboard" | "consultation";
export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  image: string;
};

export default function App() {
  const [currentScreen, setCurrentScreen] =
    useState<Screen>("login");
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);

  const handleLogin = () => setCurrentScreen("dashboard");

  const handleStartConsultation = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentScreen("consultation");
  };

  const handleBackToDashboard = () => {
    setSelectedPatient(null);
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    setSelectedPatient(null);
    setCurrentScreen("login");
  };

  if (currentScreen === "login") {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
      {currentScreen !== "consultation" && (
        <Sidebar
          onLogout={handleLogout}
          activeScreen={currentScreen}
          onNavigate={setCurrentScreen}
        />
      )}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {currentScreen === "dashboard" && (
          <Dashboard
            onStartConsultation={handleStartConsultation}
          />
        )}
        {currentScreen === "consultation" &&
          selectedPatient && (
            <Consultation
              patient={selectedPatient}
              onBack={handleBackToDashboard}
            />
          )}
      </main>
      <Toaster />
    </div>
  );
}