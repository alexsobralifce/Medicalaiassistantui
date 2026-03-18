import { useState, useEffect } from "react";
import { Activity, Mic, Search, FileText, Plus, User, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Patient } from "../../domain/patient/Patient";
import { patientsApi } from "../../lib/api";
import { PreConsultationModal, PreConsultationData } from "./PreConsultationModal";

interface DashboardProps {
  onStartConsultation: (patient: Patient) => void;
}

export function Dashboard({ onStartConsultation }: DashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientsApi.list()
      .then(setPatients)
      .catch(() => setError("Não foi possível carregar os pacientes. Verifique se a API está rodando."))
      .finally(() => setIsLoading(false));
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);

  const handleNewConsultation = () => {
    setSelectedPatientForModal(null);
    setIsModalOpen(true);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientForModal(patient);
    setIsModalOpen(true);
  };

  const handleStartWithPreData = async (data: PreConsultationData) => {
    setIsModalOpen(false);

    let finalPatient: Patient;
    
    // If it's an existing patient from the list
    if (selectedPatientForModal && selectedPatientForModal.id !== "new") {
      finalPatient = selectedPatientForModal;
      try {
        const updated = await patientsApi.update(finalPatient.id, {
           cpf: data.cpf,
           phone: data.phone,
           city: data.city,
           state: data.state,
           dob: data.dob,
        });
        finalPatient = { ...finalPatient, ...updated, reportedIssues: data.reportedIssues };
      } catch (err) {
        console.error("Failed to update patient data", err);
      }
    } else {
      // Create new patient right now
      try {
        const age = data.dob ? new Date().getFullYear() - new Date(data.dob).getFullYear() : 0;
        const created = await patientsApi.create({
          name: data.name,
          age,
          gender: "Não Informado", // Optionally asked in the modal later
          image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces",
          cpf: data.cpf,
          phone: data.phone,
          city: data.city,
          state: data.state,
          dob: data.dob,
        } as any);
        finalPatient = { ...created, reportedIssues: data.reportedIssues };
      } catch (err) {
        console.error("Failed to create the patient", err);
        return; // Don't proceed to consultation if saving failed
      }
    }

    onStartConsultation(finalPatient);
  };

  return (
    <div className="section-padding h-full overflow-y-auto bg-surface-alt relative">
      <header className="mb-12 text-center max-w-3xl mx-auto mt-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
          <Activity className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">MedAssist AI</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Sua assistente clínica inteligente. Focada em transcrição automática,
          análise baseada em evidências e geração de documentação médica.
        </p>
      </header>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Main Action */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="h-20 px-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xl font-semibold shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all flex items-center gap-3"
            onClick={handleNewConsultation}
          >
            <div className="bg-white/20 p-2 rounded-full">
              <Mic size={24} />
            </div>
            Iniciar Nova Consulta
          </Button>
        </div>

        {/* Recent Patients */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-card-foreground">Pacientes Recentes</h3>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleNewConsultation}
            >
              <Plus size={14} />
              Nova consulta
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Carregando pacientes...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 py-6 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {!isLoading && !error && patients.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <User size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum paciente cadastrado ainda.</p>
              <p className="text-xs mt-1 opacity-70">Inicie uma nova consulta para criar o primeiro registro.</p>
            </div>
          )}

          {!isLoading && !error && patients.length > 0 && (
            <ul className="divide-y divide-border">
              {patients.map((patient) => (
                <li key={patient.id} className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full border border-border flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ backgroundColor: 'var(--color-primary-surface)', color: 'var(--color-primary)' }}
                      title={patient.name}
                    >
                      {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.age} anos · {patient.gender}
                        {patient.lastVisit && ` · última visita: ${new Date(patient.lastVisit).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-primary hover:text-primary/90"
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <Mic size={14} />
                    Atender
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Mic className="text-blue-500" size={32} />}
            title="1. Escuta Ativa"
            description="O sistema ouve a consulta. O paciente se identifica e relata os sintomas naturalmente."
            color="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800"
            delay="delay-[0ms]"
          />
          <FeatureCard
            icon={<Search className="text-purple-500" size={32} />}
            title="2. Análise Clínica"
            description="A IA cruza os relatos com bases científicas, sugerindo diagnósticos e CIDs para sua validação."
            color="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800"
            delay="delay-[100ms]"
          />
          <FeatureCard
            icon={<FileText className="text-teal-500 dark:text-teal-400" size={32} />}
            title="3. Documentação"
            description="Gera pedidos de exames e atestados em PDF instantaneamente, prontos para envio via WhatsApp."
            color="bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800"
            delay="delay-[200ms]"
          />
        </div>
      </div>

      {isModalOpen && (
        <PreConsultationModal
          isOpen={isModalOpen}
          initialData={selectedPatientForModal ? {
            name: selectedPatientForModal.name,
            cpf: selectedPatientForModal.cpf || "",
            dob: selectedPatientForModal.dob || "",
            phone: selectedPatientForModal.phone || "",
            city: selectedPatientForModal.city || "",
            state: selectedPatientForModal.state || "",
          } : undefined}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleStartWithPreData}
        />
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description, color, delay }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay: string;
}) {
  return (
    <div className={`p-6 rounded-2xl border ${color} h-full hover:shadow-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${delay}`}>
      <div className="mb-4 bg-background w-16 h-16 rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </div>
  )
}
