import { useState, useEffect } from 'react';
import { Users, Search, Plus, Trash2, Stethoscope } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { patientsApi } from '../../lib/api';
import { toast } from 'sonner';
import { Patient } from '../../domain/patient/Patient';
import { maskCPF, maskPhone } from "../../utils/masks";
import { MedicalRecordModal } from '../ui/MedicalRecordModal';

interface PatientsScreenProps {
  onStartConsultation: (patient: Patient) => void;
}

interface PatientFormData {
  name: string;
  cpf: string;
  dob: string;
  gender: string;
  phone: string;
  city: string;
  state: string;
}

const EMPTY_FORM: PatientFormData = { name: '', cpf: '', dob: '', gender: '', phone: '', city: '', state: '' };

export function Patients({ onStartConsultation }: PatientsScreenProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<PatientFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Prontuário states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  async function loadPatients() {
    try {
      const data = await patientsApi.list();
      setPatients(data as unknown as Patient[]);
    } catch (error) {
      toast.error('Não foi possível carregar os pacientes. Verifique se a API está rodando.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadPatients(); }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  async function handleCreatePatient(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.cpf || !form.gender) {
      toast.error('Preencha todos os campos obrigatórios (Nome, CPF e Sexo).');
      return;
    }
    setIsSaving(true);
    try {
      const age = form.dob ? new Date().getFullYear() - new Date(form.dob).getFullYear() : 0;
      await patientsApi.create({
        name: form.name,
        cpf: form.cpf,
        age,
        dob: form.dob,
        gender: form.gender,
        phone: form.phone,
        city: form.city,
        state: form.state,
        lastVisit: new Date().toLocaleDateString('pt-BR'),
        image: '',
      } as any);
      toast.success(`Paciente ${form.name} cadastrado com sucesso!`);
      setIsDialogOpen(false);
      setForm(EMPTY_FORM);
      loadPatients();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao criar paciente');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover o paciente "${name}"? Esta ação é irreversível.`)) return;
    setDeletingId(id);
    try {
      await patientsApi.remove(id);
      toast.success(`Paciente ${name} removido.`);
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao remover paciente');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="section-padding h-full flex flex-col bg-surface relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Pacientes</h1>
          </div>
          <p className="text-muted mt-1 text-sm md:text-base">Gerencie seu painel de pacientes e histórico clínico.</p>
        </div>
        <Button className="shrink-0 interactive w-full md:w-auto" onClick={() => { setForm(EMPTY_FORM); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Paciente
        </Button>
      </header>

      <div className="bg-card rounded-2xl border border-border shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pacientes por nome..."
              className="pl-9 bg-background"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-surface-alt/30">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Users className="h-12 w-12 text-muted/30 mx-auto" />
              <p className="text-muted">
                {searchValue ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
              </p>
              {!searchValue && (
                <Button variant="outline" className="interactive w-full max-w-sm mx-auto" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar o primeiro paciente
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col space-y-3">
              {/* Fake Table Header for Desktop */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-muted uppercase tracking-wider border-b border-border/50">
                <div className="col-span-4 lg:col-span-3">Paciente</div>
                <div className="col-span-2">Idade / Sexo</div>
                <div className="col-span-3">CPF / Contato</div>
                <div className="col-span-3 text-right">Ações</div>
              </div>

              {/* Responsive Cards/Rows */}
              {filtered.map(patient => (
                <PatientRowCard 
                  key={patient.id} 
                  patient={patient} 
                  onDelete={() => handleDelete(patient.id, patient.name)}
                  isDeleting={deletingId === patient.id}
                  onRecord={() => { setSelectedPatient(patient); setIsRecordModalOpen(true); }}
                  onConsult={() => onStartConsultation(patient)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Novo Paciente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
            <DialogDescription>Preencha os dados para cadastrar um novo paciente no sistema.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePatient} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="p-name">Nome Completo *</Label>
              <Input
                id="p-name"
                required
                placeholder="Ex: Maria Oliveira"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-cpf">CPF *</Label>
                <Input
                  id="p-cpf"
                  required
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={form.cpf}
                  onChange={e => setForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-gender">Sexo *</Label>
                <select
                  id="p-gender"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">Selecionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-dob">Data de Nascimento</Label>
                <Input
                  id="p-dob"
                  type="date"
                  value={form.dob}
                  onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-phone">Telefone</Label>
                <Input
                  id="p-phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-city">Cidade</Label>
                <Input
                  id="p-city"
                  placeholder="Ex: São Paulo"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-state">Estado</Label>
                <Input
                  id="p-state"
                  placeholder="SP"
                  maxLength={2}
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Cadastrar Paciente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <MedicalRecordModal 
        isOpen={isRecordModalOpen} 
        onClose={() => {
          setIsRecordModalOpen(false);
          setSelectedPatient(null);
        }} 
        patient={selectedPatient} 
      />
    </div>
  );
}

// ----------------------------------------------------
// UI ENGINE: Cross-Platform Component (Mobile Card -> Desktop Table Row)
// ----------------------------------------------------
function PatientRowCard({ 
  patient, 
  onDelete, 
  isDeleting, 
  onRecord, 
  onConsult 
}: { 
  patient: Patient, 
  onDelete: () => void, 
  isDeleting: boolean, 
  onRecord: () => void, 
  onConsult: () => void 
}) {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4 p-4 lg:py-3 lg:px-4 rounded-xl border border-border bg-surface hover:shadow-[var(--shadow-card)] transition-shadow">
      
      {/* 1. Nome & Imagem */}
      <div className="col-span-4 lg:col-span-3 flex items-center justify-between lg:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-surface-alt border border-border flex items-center justify-center font-bold text-muted overflow-hidden">
            {patient.image ? (
              <img src={patient.image} alt="avatar" className="w-full h-full object-cover" />
            ) : (
               patient.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 pr-2">
            <h3 className="font-semibold text-base truncate text-on-surface">{patient.name}</h3>
            {/* Mobile Helper infos */}
            <p className="lg:hidden text-xs text-muted">
              {patient.age}y · {patient.gender} · CPF: {patient.cpf || '—'}
            </p>
          </div>
        </div>
        
        {/* Mobile Delete Button */}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="lg:hidden p-2 rounded-md text-muted hover:text-critical hover:bg-critical/10"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Idade & Sexo (Desktop Only) */}
      <div className="hidden lg:flex flex-col col-span-2 justify-center">
        <span className="text-sm font-medium">{patient.age} anos</span>
        <span className="text-xs text-muted">{patient.gender}</span>
      </div>

      {/* 3. Contatos (Desktop Only) */}
      <div className="hidden lg:flex flex-col col-span-3 justify-center">
        <span className="text-sm font-mono tracking-tight">{patient.cpf || 'Sem CPF'}</span>
        <span className="text-xs text-muted">{patient.phone || patient.city || '--'}</span>
      </div>

      {/* 4. Actions */}
      <div className="col-span-4 flex items-center lg:justify-end gap-2 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-border/50 lg:border-0">
        <Button variant="outline" size="sm" className="flex-1 lg:flex-none h-10 lg:h-9 interactive" onClick={onRecord}>
          <Users className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Prontuário</span>
          <span className="sm:hidden">Rec</span>
        </Button>
        <Button variant="default" size="sm" className="flex-1 lg:flex-none h-10 lg:h-9 bg-primary text-on-primary hover:bg-primary-light interactive" onClick={onConsult}>
          <Stethoscope className="mr-2 h-4 w-4" />
          <span>Consulta</span>
        </Button>

        {/* Desktop Delete Button */}
        <button
          title="Remover"
          onClick={onDelete}
          disabled={isDeleting}
          className="hidden lg:flex interactive w-9 h-9 items-center justify-center rounded-md text-muted hover:text-critical hover:bg-critical/10 ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
