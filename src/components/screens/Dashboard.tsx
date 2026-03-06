import { Activity, Mic, Search, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Patient } from "../../App";

interface DashboardProps {
  onStartConsultation: (patient: Patient) => void;
}

export function Dashboard({ onStartConsultation }: DashboardProps) {
  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto bg-slate-50/50 relative">
      <header className="mb-12 text-center max-w-3xl mx-auto mt-8">
        <div className="inline-flex items-center justify-center p-3 bg-teal-100 rounded-2xl mb-6">
          <Activity className="h-8 w-8 text-[#008080]" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">MedAssist AI</h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          Sua assistente clínica inteligente. Focada em transcrição automática, 
          análise baseada em evidências e geração de documentação médica.
        </p>
      </header>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Main Action */}
        <div className="flex justify-center">
           <Button 
             size="lg"
             className="h-20 px-12 rounded-full bg-[#008080] hover:bg-[#006666] text-xl font-semibold shadow-xl shadow-teal-200 hover:shadow-teal-300 hover:scale-105 transition-all flex items-center gap-3"
             onClick={() => onStartConsultation({
                id: "new",
                name: "Identificando...",
                age: 0,
                gender: "-",
                lastVisit: "-",
                image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces"
              })}
           >
             <div className="bg-white/20 p-2 rounded-full">
               <Mic size={24} />
             </div>
             Iniciar Nova Consulta
           </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Mic className="text-blue-500" size={32} />}
            title="1. Escuta Ativa"
            description="O sistema ouve a consulta. O paciente se identifica e relata os sintomas naturalmente."
            color="bg-blue-50 border-blue-100"
          />
          <FeatureCard 
            icon={<Search className="text-purple-500" size={32} />}
            title="2. Análise Clínica"
            description="A IA cruza os relatos com bases científicas, sugerindo diagnósticos e CIDs para sua validação."
            color="bg-purple-50 border-purple-100"
          />
          <FeatureCard 
            icon={<FileText className="text-teal-500" size={32} />}
            title="3. Documentação"
            description="Gera pedidos de exames e atestados em PDF instantaneamente, prontos para envio via WhatsApp."
            color="bg-teal-50 border-teal-100"
          />
        </div>

        {/* Recent Activity / MVP Info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sobre este MVP</h3>
          <div className="prose prose-slate text-slate-600">
            <p>
              Esta versão de demonstração foca na experiência "human-in-the-loop". 
              O médico mantém total controle sobre as decisões, enquanto a IA atua como copiloto 
              para agilizar a burocracia e fornecer segunda opinião baseada em dados.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              <li className="flex items-center gap-2"><div className="w-2 h-2 bg-teal-500 rounded-full"/> Reconhecimento de voz avançado (Simulado)</li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 bg-teal-500 rounded-full"/> Sugestão de CID-10 em tempo real</li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 bg-teal-500 rounded-full"/> Integração nativa com WhatsApp</li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 bg-teal-500 rounded-full"/> Segurança de dados (HIPAA Ready)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: any) {
  return (
    <div className={`p-6 rounded-2xl border ${color} h-full hover:shadow-md transition-shadow`}>
      <div className="mb-4 bg-white w-16 h-16 rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  )
}
