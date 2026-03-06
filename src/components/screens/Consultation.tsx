import { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Pause, Square, Play, Check, X, FileText, Pill, Stethoscope, AlertCircle, Printer, Mail, Save, ChevronDown, Download, Send } from 'lucide-react';
import { Button } from "../ui/button";
import { Patient } from "../../App";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { toast } from "sonner@2.0.3";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../ui/utils";

interface ConsultationProps {
  patient: Patient;
  onBack: () => void;
}

type Mode = 'recording' | 'processing' | 'review';

  const MOCK_TRANSCRIPT_CHUNKS = [
    "Meu nome é Carlos Silva.",
    "Relato dores de cabeça persistentes nas últimas 2 semanas.",
    "Descrevo a dor como pulsante na região frontal.",
    "Menciono tontura ocasional ao levantar-se rapidamente.",
    "Sem histórico de enxaqueca na família.",
    "Atualmente tomando analgésicos de venda livre com alívio mínimo.",
    "Padrões de sono irregulares devido ao estresse no trabalho.",
  ];

export function Consultation({ patient, onBack }: ConsultationProps) {
  const [mode, setMode] = useState<Mode>('recording');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentPatientName, setCurrentPatientName] = useState(patient.name);

  // Simulate transcription
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && mode === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        if (Math.random() > 0.7 && transcript.length < MOCK_TRANSCRIPT_CHUNKS.length) {
           const nextChunk = MOCK_TRANSCRIPT_CHUNKS[transcript.length];
           setTranscript(prev => [...prev, nextChunk]);
           
           // Simulate extracting name
           if (nextChunk.includes("Meu nome é")) {
             setCurrentPatientName("Carlos Silva");
           }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, mode, transcript]);

  const handleStartRecording = () => setIsRecording(true);
  const handlePauseRecording = () => setIsRecording(false);
  const handleStopRecording = () => {
    setIsRecording(false);
    setMode('processing');
    // Simulate processing time
    setTimeout(() => setMode('review'), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center space-x-3">
            <img src={patient.image} alt={currentPatientName} className="w-8 h-8 rounded-full object-cover" />
            <div>
              <h2 className="font-semibold text-sm text-slate-900">{currentPatientName}</h2>
              <p className="text-xs text-slate-500">{patient.age > 0 ? `${patient.age} anos` : 'Idade não informada'} • {patient.gender}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="font-mono font-normal text-slate-500">
            {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
          {mode === 'review' && (
            <Button size="sm" className="bg-[#008080] hover:bg-[#006666]" onClick={() => toast.success("Consulta salva com sucesso!")}>
               <Save size={16} className="mr-2" /> Salvar no Prontuário
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {mode === 'recording' && (
            <RecordingView 
              key="recording"
              isRecording={isRecording} 
              recordingTime={recordingTime}
              transcript={transcript}
              onStart={handleStartRecording}
              onPause={handlePauseRecording}
              onStop={handleStopRecording}
            />
          )}
          {mode === 'processing' && (
            <ProcessingView key="processing" />
          )}
          {mode === 'review' && (
            <ReviewView key="review" transcript={transcript} patient={{...patient, name: currentPatientName}} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RecordingView({ isRecording, recordingTime, transcript, onStart, onPause, onStop }: any) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center bg-slate-50"
    >
      <div className="w-full max-w-3xl px-6 flex-1 flex flex-col justify-center min-h-0 pb-32">
        <div className="text-center mb-12">
           <h2 className="text-2xl font-bold text-slate-900 mb-2">
             {isRecording ? "Ouvindo..." : "Pronto para gravar"}
           </h2>
           <p className="text-slate-500">
             O MedAssist está pronto para transcrever e analisar a consulta.
           </p>
        </div>

        {/* Visualizer */}
        <div className="h-32 flex items-center justify-center space-x-1 mb-12">
          {isRecording ? (
            Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-[#008080] rounded-full"
                animate={{ height: [10, Math.random() * 60 + 10, 10] }}
                transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
              />
            ))
          ) : (
            <div className="h-1 w-full max-w-md bg-slate-200 rounded-full overflow-hidden relative">
               {transcript.length > 0 && <div className="absolute left-0 top-0 bottom-0 bg-[#008080] w-1/3" />}
            </div>
          )}
        </div>

        {/* Transcript Preview */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[200px] max-h-[300px] overflow-y-auto">
           {transcript.length === 0 ? (
             <p className="text-slate-400 italic text-center mt-8">A transcrição aparecerá aqui em tempo real...</p>
           ) : (
             <p className="text-slate-700 leading-relaxed whitespace-pre-line">
               {transcript.join(" ")}
               <span className="animate-pulse inline-block w-2 h-4 bg-[#008080] ml-1 align-middle"></span>
             </p>
           )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 flex flex-col items-center shadow-lg">
         <div className="font-mono text-2xl font-medium text-slate-700 mb-6">
           {formatTime(recordingTime)}
         </div>
         
         <div className="flex items-center space-x-6">
           {!isRecording ? (
             <Button size="lg" onClick={onStart} className="h-16 w-16 rounded-full bg-[#008080] hover:bg-[#006666] shadow-lg shadow-teal-200 scale-100 hover:scale-105 transition-all">
               <Mic size={28} />
             </Button>
           ) : (
             <Button size="lg" onClick={onPause} className="h-16 w-16 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200">
               <Pause size={28} />
             </Button>
           )}
           
           {(transcript.length > 0 || recordingTime > 0) && (
             <Button size="lg" variant="destructive" onClick={onStop} className="h-16 w-16 rounded-full shadow-lg shadow-red-200">
               <Square size={24} fill="currentColor" />
             </Button>
           )}
         </div>
         <p className="mt-4 text-xs text-slate-400 uppercase tracking-widest font-semibold">
           {isRecording ? "Gravação Ativa" : "Pausado"}
         </p>
      </div>
    </motion.div>
  );
}

function ProcessingView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-900 to-slate-900" />
      
      <div className="z-10 flex flex-col items-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border-t-2 border-l-2 border-[#00FFFF] rounded-full mb-8 relative flex items-center justify-center shadow-[0_0_30px_rgba(0,255,255,0.3)]"
        >
           <div className="w-24 h-24 border-r-2 border-b-2 border-teal-500 rounded-full opacity-60" />
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-400">
          Analisando Dados Clínicos
        </h2>
        <div className="flex flex-col items-center space-y-2 text-sm text-slate-400">
          <motion.span 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }}
          >
            Transcrevendo áudio...
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 1.5 }}
          >
            Buscando códigos CID-10...
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 2.5 }}
          >
            Gerando plano de tratamento...
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewView({ transcript, patient }: { transcript: string[], patient: Patient }) {
  const [selectedExams, setSelectedExams] = useState<string>('');
  const [activeTab, setActiveTab] = useState("analysis");

  const handleGeneratePDF = (type: string) => {
    toast.success(`Gerando PDF do ${type}...`, {
      description: "O documento foi baixado com sucesso."
    });
  };

  const handleWhatsApp = () => {
    toast.success("Abrindo WhatsApp...", {
      description: "Documentos anexados e prontos para envio."
    });
    window.open('https://wa.me/', '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="h-full flex flex-col bg-slate-50 overflow-hidden"
    >
      {/* Mobile Tabs Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-2 shrink-0 z-20">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="transcript">Transcrição</TabsTrigger>
             <TabsTrigger value="analysis">Análise & Conduta</TabsTrigger>
           </TabsList>
         </Tabs>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Panel: Transcript */}
        <div className={cn(
          "w-full lg:w-1/3 flex-col border-r border-slate-200 bg-white min-w-0 lg:flex",
          activeTab === 'transcript' ? "flex" : "hidden"
        )}>
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-slate-700 flex items-center">
              <FileText size={18} className="mr-2 text-[#008080]" /> 
              Transcrição da Consulta
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4 lg:p-6">
            <div className="prose prose-slate max-w-none pb-20 lg:pb-0">
              {transcript.map((line, i) => (
                <p key={i} className="mb-3 text-slate-700 leading-relaxed p-2 rounded hover:bg-slate-50 transition-colors">{line}</p>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Middle/Right Panel: AI Analysis & Actions */}
        <div className={cn(
          "flex-1 flex-col bg-slate-50 h-full overflow-hidden lg:flex",
          activeTab === 'analysis' ? "flex" : "hidden"
        )}>
           <div className="flex-1 overflow-y-auto p-4 lg:p-6">
             <div className="space-y-6 max-w-4xl mx-auto">
               
               {/* AI Insights Card */}
               <Card className="border-l-4 border-l-[#008080] shadow-md">
                 <CardHeader className="pb-2 bg-teal-50/30">
                   <div className="flex items-center gap-2 mb-1">
                     <Badge variant="outline" className="bg-[#008080] text-white border-none">IA Clinical Analysis</Badge>
                     <span className="text-xs text-slate-500">Baseado em Evidências • Atualizado hoje</span>
                   </div>
                   <CardTitle className="text-xl font-bold text-slate-800">Diagnóstico Sugerido</CardTitle>
                 </CardHeader>
                 <CardContent className="pt-4 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-1">Hipótese Principal</h4>
                        <p className="text-lg font-bold text-[#008080]">Cefaleia Tensional</p>
                        <p className="text-sm text-slate-500 mt-1">CID-10: <span className="font-mono font-medium text-slate-900">G44.2</span></p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[92%]"></div>
                          </div>
                          <span className="text-xs font-bold text-green-600">92%</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-1">Diagnóstico Diferencial</h4>
                        <p className="text-lg font-bold text-slate-600">Hipotensão Ortostática</p>
                        <p className="text-sm text-slate-500 mt-1">CID-10: <span className="font-mono font-medium text-slate-900">I95.1</span></p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[65%]"></div>
                          </div>
                          <span className="text-xs font-bold text-amber-600">65%</span>
                        </div>
                      </div>
                   </div>

                   <Accordion type="single" collapsible className="w-full border rounded-lg bg-white px-4">
                      <AccordionItem value="evidence" className="border-none">
                        <AccordionTrigger className="text-sm font-medium text-slate-600">
                           Ver Evidências Científicas
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2 text-sm text-slate-600">
                             <p>• <strong>Sintomas Coincidentes:</strong> Dor frontal bilateral, caráter opressivo/pulsante, ausência de fotofobia severa.</p>
                             <p>• <strong>Base Bibliográfica:</strong> <em>"Stress is a primary trigger for TTH..."</em> - J. Neurology 2023.</p>
                             <p>• <strong>Contra-indicação de Enxaqueca:</strong> Ausência de aura e histórico familiar negativo.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                   </Accordion>
                 </CardContent>
               </Card>

               {/* Exam Request Section */}
               <Card className="shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-lg font-semibold text-slate-800">Solicitação de Exames</CardTitle>
                   <CardDescription>Selecione os exames recomendados para este perfil clínico</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-col md:flex-row gap-3 items-end">
                     <div className="w-full flex-1 space-y-2">
                       <label className="text-sm font-medium text-slate-700">Exames Disponíveis</label>
                       <Select value={selectedExams} onValueChange={setSelectedExams}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione um exame..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hemograma">Hemograma Completo</SelectItem>
                            <SelectItem value="tireoide">Função Tireoidiana (TSH, T4)</SelectItem>
                            <SelectItem value="rm">Ressonância Magnética - Crânio</SelectItem>
                            <SelectItem value="mapa">MAPA 24h (Monitorização PA)</SelectItem>
                          </SelectContent>
                       </Select>
                     </div>
                     <Button 
                       onClick={() => handleGeneratePDF("Pedido de Exames")}
                       disabled={!selectedExams}
                       className="w-full md:w-auto bg-slate-900 text-white hover:bg-slate-800 mt-2 md:mt-0"
                     >
                       <FileText size={18} className="mr-2" />
                       Gerar Pedido
                     </Button>
                   </div>
                   
                   {selectedExams && (
                     <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center">
                       <Check size={16} className="mr-2" />
                       Exame selecionado: <strong className="ml-1 capitalize">{selectedExams}</strong>
                     </div>
                   )}
                 </CardContent>
               </Card>

               {/* Certificate Section */}
               <Card className="shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-lg font-semibold text-slate-800">Atestado Médico</CardTitle>
                   <CardDescription>Gerar atestado de comparecimento ou afastamento</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-col sm:flex-row gap-3">
                     <Button variant="outline" className="flex-1 w-full border-slate-300" onClick={() => handleGeneratePDF("Atestado de Horas")}>
                       Atestado de Horas (Comparecimento)
                     </Button>
                     <Button variant="outline" className="flex-1 w-full border-slate-300" onClick={() => handleGeneratePDF("Atestado de 1 Dia")}>
                       Atestado de 1 Dia (Afastamento)
                     </Button>
                   </div>
                 </CardContent>
               </Card>

             </div>
           </div>

           {/* Footer Actions */}
           <div className="shrink-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20">
             <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="text-sm text-slate-500 order-2 md:order-1 text-center md:text-left">
                 <span className="font-semibold text-slate-900">Dr. Ray</span> • CRM 123456-SP
               </div>
               <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto order-1 md:order-2">
                  <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-300" onClick={() => handleGeneratePDF("Relatório Completo")}>
                    <Download size={18} className="mr-2" /> Baixar Tudo (PDF)
                  </Button>
                  <Button className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white border-none" onClick={handleWhatsApp}>
                    <Send size={18} className="mr-2" /> Enviar via WhatsApp
                  </Button>
               </div>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function SuggestionCard({ title, code, confidence, details }: any) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  return (
    <Card className={`border transition-colors ${status === 'accepted' ? 'border-teal-500 bg-teal-50/50' : status === 'rejected' ? 'border-red-200 bg-red-50/50 opacity-60' : 'border-slate-200'}`}>
      <div className="p-3 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h5 className="font-semibold text-slate-900 text-sm">{title}</h5>
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-600 border-slate-200">{code}</Badge>
          </div>
          <p className="text-xs text-slate-500 mb-2">{details}</p>
          
          {/* Confidence Bar */}
          <div className="flex items-center space-x-2">
            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${confidence > 80 ? 'bg-green-500' : 'bg-amber-500'}`} 
                style={{ width: `${confidence}%` }} 
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400">{confidence}% Match</span>
          </div>
        </div>

        <div className="flex flex-col space-y-1 ml-2">
           {status === 'pending' ? (
             <>
               <button onClick={() => setStatus('accepted')} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-teal-100 text-slate-400 hover:text-teal-600 flex items-center justify-center transition-colors">
                 <Check size={14} />
               </button>
               <button onClick={() => setStatus('rejected')} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors">
                 <X size={14} />
               </button>
             </>
           ) : status === 'accepted' ? (
             <button onClick={() => setStatus('pending')} className="h-7 w-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
               <Check size={14} />
             </button>
           ) : (
             <button onClick={() => setStatus('pending')} className="h-7 w-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
               <X size={14} />
             </button>
           )}
        </div>
      </div>
    </Card>
  );
}

function PlanItem({ type, title, subtitle }: any) {
  const [checked, setChecked] = useState(true);
  
  return (
    <div className={`p-3 flex items-start group hover:bg-slate-50 transition-colors ${!checked && 'opacity-50'}`}>
      <div 
        className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${checked ? 'bg-[#008080] border-[#008080] text-white' : 'border-slate-300 bg-white'}`}
        onClick={() => setChecked(!checked)}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </div>
      <div className="ml-3 flex-1">
        <p className={`text-sm font-medium ${checked ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <Badge variant="outline" className="ml-2 text-[10px] text-slate-400 border-slate-200 bg-white">
        {type}
      </Badge>
    </div>
  );
}
