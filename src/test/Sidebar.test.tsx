import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../components/layout/Sidebar';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <span>LayoutDashboard</span>,
  LogOut: () => <span>LogOut</span>,
  Settings: () => <span>Settings</span>,
  Users: () => <span>Users</span>,
  Activity: () => <span>Activity</span>,
  Menu: () => <span>Menu</span>,
  Moon: () => <span>Moon</span>,
  Sun: () => <span>Sun</span>,
  BookOpen: () => <span>BookOpen</span>,
  ShieldAlert: () => <span>ShieldAlert</span>,
}));

// Mock Radix UI Sheet (usado no mobile)
vi.mock('../components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@radix-ui/react-visually-hidden', () => ({
  VisuallyHidden: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('../components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('../components/ui/theme-toggle', () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Tema</button>,
}));

const defaultProps = {
  onLogout: vi.fn(),
  activeScreen: 'dashboard' as const,
  onNavigate: vi.fn(),
  currentUser: { id: '1', name: 'Test User', email: 'test@medassist.com', role: 'DOCTOR' as const },
};

describe('Sidebar – Renderização', () => {
  it('deve renderizar os itens de navegação', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getAllByText('Painel').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pacientes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ajustes').length).toBeGreaterThan(0);
  });

  it('deve renderizar o botão de Sair', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getAllByText('Sair').length).toBeGreaterThan(0);
  });

  it('deve chamar onNavigate com "dashboard" ao clicar em Painel', () => {
    const onNavigate = vi.fn();
    render(<Sidebar {...defaultProps} onNavigate={onNavigate} />);
    const panelButtons = screen.getAllByTitle('Painel');
    fireEvent.click(panelButtons[0]);
    expect(onNavigate).toHaveBeenCalledWith('dashboard');
  });

  it('deve chamar onNavigate com "patients" ao clicar em Pacientes', () => {
    const onNavigate = vi.fn();
    render(<Sidebar {...defaultProps} onNavigate={onNavigate} />);
    const patientButtons = screen.getAllByTitle('Pacientes');
    fireEvent.click(patientButtons[0]);
    expect(onNavigate).toHaveBeenCalledWith('patients');
  });

  it('deve chamar onNavigate com "settings" ao clicar em Ajustes', () => {
    const onNavigate = vi.fn();
    render(<Sidebar {...defaultProps} onNavigate={onNavigate} />);
    const settingsButtons = screen.getAllByTitle('Ajustes');
    fireEvent.click(settingsButtons[0]);
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('deve chamar onLogout ao clicar em Sair', () => {
    const onLogout = vi.fn();
    render(<Sidebar {...defaultProps} onLogout={onLogout} />);
    const logoutButtons = screen.getAllByText('Sair');
    fireEvent.click(logoutButtons[0]);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('deve aplicar estilo ativo ao item do painel quando activeScreen é "dashboard"', () => {
    render(<Sidebar {...defaultProps} activeScreen="dashboard" />);
    const panelBtn = screen.getAllByTitle('Painel')[0];
    expect(panelBtn.className).toContain('bg-primary');
  });

  it('deve aplicar estilo ativo a Pacientes quando activeScreen é "patients"', () => {
    render(<Sidebar {...defaultProps} activeScreen="patients" />);
    const patientsBtn = screen.getAllByTitle('Pacientes')[0];
    expect(patientsBtn.className).toContain('bg-primary');
  });
});
