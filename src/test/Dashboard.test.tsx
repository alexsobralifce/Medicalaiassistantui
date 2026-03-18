import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../components/screens/Dashboard';

// Mock the API module
vi.mock('../lib/api', () => ({
  patientsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('lucide-react', () => {
  const React = require('react');
  const MockIcon = React.forwardRef((props: any, ref: any) => <span ref={ref}>Icon</span>);
  MockIcon.displayName = 'MockIcon';
  return {
    Activity: MockIcon,
    Mic: MockIcon,
    Search: MockIcon,
    FileText: MockIcon,
    Plus: MockIcon,
    User: MockIcon,
    Loader2: MockIcon,
    AlertCircle: MockIcon,
    XIcon: MockIcon,
    X: MockIcon,
  };
});

vi.mock('../components/screens/PreConsultationModal', () => ({
  PreConsultationModal: ({ onSubmit, initialData }: any) => (
    <div data-testid="pre-consultation-modal">
      <button 
        data-testid="submit-modal" 
        onClick={() => onSubmit({ ...initialData, name: initialData?.name || 'Novo Paciente', cpf: '000.000.000-00', reportedIssues: 'DOR' })}
      >
        Submit
      </button>
    </div>
  )
}));

// Mock Button component
vi.mock('../components/ui/button', () => ({
  Button: ({ children, onClick, size, variant, className }: any) => (
    <button onClick={onClick} className={className ?? ''}>{children}</button>
  ),
}));

// Mock Patient domain
vi.mock('../domain/patient/Patient', () => ({}));

import { patientsApi } from '../lib/api';

const mockPatients = [
  { id: '1', name: 'João Silva', age: 45, gender: 'Masculino', lastVisit: '2024-01-15' },
  { id: '2', name: 'Maria Santos', age: 32, gender: 'Feminino', lastVisit: '2024-01-20' },
];

describe('Dashboard – Estados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir loading enquanto carrega os pacientes', () => {
    // API que nunca resolve (pending state)
    vi.mocked(patientsApi.list).mockReturnValue(new Promise(() => {}));
    render(<Dashboard onStartConsultation={vi.fn()} />);
    expect(screen.getByText('Carregando pacientes...')).toBeInTheDocument();
  });

  it('deve exibir a lista de pacientes quando a API retorna dados', async () => {
    vi.mocked(patientsApi.list).mockResolvedValue(mockPatients as any);
    render(<Dashboard onStartConsultation={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de erro quando a API falha', async () => {
    vi.mocked(patientsApi.list).mockRejectedValue(new Error('Network error'));
    render(<Dashboard onStartConsultation={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText(/Não foi possível carregar/i)).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de estado vazio quando não há pacientes', async () => {
    vi.mocked(patientsApi.list).mockResolvedValue([]);
    render(<Dashboard onStartConsultation={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Nenhum paciente cadastrado ainda.')).toBeInTheDocument();
    });
  });

  it('deve chamar onStartConsultation com dados do paciente ao clicar em Atender', async () => {
    vi.mocked(patientsApi.list).mockResolvedValue(mockPatients as any);
    const onStartConsultation = vi.fn();
    render(<Dashboard onStartConsultation={onStartConsultation} />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const atenderBtns = screen.getAllByText('Atender');
    await userEvent.click(atenderBtns[0]);
    
    await waitFor(() => expect(screen.getByTestId('pre-consultation-modal')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('submit-modal'));

    expect(onStartConsultation).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João Silva' })
    );
  });

  it('deve iniciar consulta sem paciente ao clicar em "Iniciar Nova Consulta"', async () => {
    // Para simplificar, quando não houver id eu crio um com name mock e ele recebe no fluxo.
    vi.mocked(patientsApi.list).mockResolvedValue([]);
    vi.mocked(patientsApi.create).mockResolvedValue({ id: 'new', name: 'Novo Paciente' } as any);
    const onStartConsultation = vi.fn();
    render(<Dashboard onStartConsultation={onStartConsultation} />);

    await waitFor(() => screen.getByText('Nenhum paciente cadastrado ainda.'));
    const novaConsultaBtn = screen.getByText('Iniciar Nova Consulta');
    await userEvent.click(novaConsultaBtn);
    
    await waitFor(() => expect(screen.getByTestId('pre-consultation-modal')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('submit-modal'));

    expect(onStartConsultation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new' })
    );
  });

  it('deve renderizar os 3 cards de funcionalidades', async () => {
    vi.mocked(patientsApi.list).mockResolvedValue([]);
    render(<Dashboard onStartConsultation={vi.fn()} />);
    await waitFor(() => screen.getByText('Nenhum paciente cadastrado ainda.'));
    expect(screen.getByText('1. Escuta Ativa')).toBeInTheDocument();
    expect(screen.getByText('2. Análise Clínica')).toBeInTheDocument();
    expect(screen.getByText('3. Documentação')).toBeInTheDocument();
  });
});
