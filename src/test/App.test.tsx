import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock the screen components to isolate App logic
vi.mock('../components/screens/Login', () => ({
  Login: ({ onLogin }: { onLogin: () => void }) => (
    <div data-testid="login-screen">
      <button onClick={onLogin} data-testid="login-btn">Entrar</button>
    </div>
  ),
}));

vi.mock('../components/screens/Dashboard', () => ({
  Dashboard: ({ onStartConsultation }: { onStartConsultation: (p: any) => void }) => (
    <div data-testid="dashboard-screen">
      <button onClick={() => onStartConsultation({ id: '1', name: 'João', age: 30, gender: 'M' })} data-testid="start-consultation-btn">
        Nova Consulta
      </button>
    </div>
  ),
}));

vi.mock('../components/screens/Patients', () => ({
  Patients: ({ onStartConsultation }: { onStartConsultation: (p: any) => void }) => (
    <div data-testid="patients-screen">
      <button onClick={() => onStartConsultation({ id: '2', name: 'Maria', age: 25, gender: 'F' })}>
        Atender
      </button>
    </div>
  ),
}));

vi.mock('../components/screens/Settings', () => ({
  Settings: () => <div data-testid="settings-screen">Configurações</div>,
}));

vi.mock('../components/screens/Consultation', () => ({
  Consultation: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="consultation-screen">
      <button onClick={onBack} data-testid="back-btn">Voltar</button>
    </div>
  ),
}));

vi.mock('../components/layout/Sidebar', () => ({
  Sidebar: ({ onLogout, onNavigate, activeScreen }: {
    onLogout: () => void;
    onNavigate: (s: string) => void;
    activeScreen: string;
  }) => (
    <nav data-testid="sidebar" data-active={activeScreen}>
      <button onClick={() => onNavigate('dashboard')} data-testid="nav-dashboard">Painel</button>
      <button onClick={() => onNavigate('patients')} data-testid="nav-patients">Pacientes</button>
      <button onClick={() => onNavigate('settings')} data-testid="nav-settings">Configurações</button>
      <button onClick={onLogout} data-testid="nav-logout">Sair</button>
    </nav>
  ),
}));

vi.mock('../components/layout/Topbar', () => ({
  Topbar: () => <div data-testid="topbar-mock">Topbar</div>
}));

vi.mock('sonner', () => ({
  Toaster: () => null,
}));

vi.mock('../lib/api', () => ({
  authApi: {
    login: vi.fn().mockResolvedValue({ token: 'fake-token', user: { id: '1', name: 'Test', role: 'ADMIN' } })
  }
}));

import { waitFor } from '@testing-library/react';

describe('App – Fluxo de Navegação', () => {
  it('deve renderizar a tela de Login por padrão', () => {
    render(<App />);
    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
  });

  it('deve navegar para o Dashboard após o login', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument());
  });

  it('deve navegar para a tela de Pacientes via Sidebar', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('nav-patients'));
    expect(screen.getByTestId('patients-screen')).toBeInTheDocument();
  });

  it('deve navegar para a tela de Configurações via Sidebar', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('nav-settings'));
    expect(screen.getByTestId('settings-screen')).toBeInTheDocument();
  });

  it('deve abrir a tela de Consulta ao clicar em Nova Consulta', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('start-consultation-btn'));
    expect(screen.getByTestId('consultation-screen')).toBeInTheDocument();
  });

  it('deve fazer logout e retornar para a tela de Login', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('nav-logout'));
    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
  });
});
