import { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Pause, Square, Check, FileText, Save, Download, Send } from 'lucide-react';
import { Button } from "../ui/button";
import { Patient } from "../../domain/patient/Patient";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../ui/utils";
import { AlertBanner } from "../ui/alert-banner";
import { consultationsApi, aiApi, patientsApi } from "../../lib/api";
import { jsPDF } from "jspdf";

interface ConsultationProps {
  patient: Patient;
  onBack: () => void;
}

type Mode = 'recording' | 'processing' | 'review';

export function Consultation({ patient, onBack }: ConsultationProps) {
  const [mode, setMode] = useState<Mode>('recording');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentPatientName, setCurrentPatientName] = useState(patient.name);
  
  // Real Audio Recording state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [pharmacistInsights, setPharmacistInsights] = useState<any>(null);
  const [isPharmacistLoading, setIsPharmacistLoading] = useState(false);

  // Auto-fetch Pharmacist Insights on mount if we have reported issues
  useEffect(() => {
    if (patient.reportedIssues && !pharmacistInsights && !isPharmacistLoading) {
      setIsPharmacistLoading(true);
      aiApi.pharmacist(patient.reportedIssues)
        .then(data => setPharmacistInsights(data))
        .catch(err => console.error("Failed to load pharmacist insights", err))
        .finally(() => setIsPharmacistLoading(false));
    }
  }, [patient.reportedIssues]);

  // Handle Recording Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording && mode === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, mode]);

  const handleStartRecording = async () => {
    try {
      if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        setIsRecording(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setMode('processing');
        
        try {
          // 1. Send Audio to Whisper API
          toast.info("Transcrevendo áudio...");
          const { text } = await aiApi.transcribe(audioBlob);
          setTranscript([text]); // Since it's a full block we map to array of 1, or handle split lines

          // 2. Send Text to GPT for Analysis
          toast.info("Analisando consulta médica...");
          const analysis = await aiApi.analyze(text);
          setAiAnalysis(analysis);
          
          setMode('review');
        } catch (error: any) {
          toast.error("Erro no processamento da IA", { description: error.message });
          setMode('recording'); // Revert mode on error so they can try again
        } finally {
          // Cleanup tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Erro de permissão', { description: 'Por favor autorize o uso do microfone.' });
      console.error(err);
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
    }
    setIsRecording(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white z-10">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="hover:bg-muted gap-2 text-primary" onClick={onBack}>
            <ArrowLeft size={20} />
            <span className="font-semibold">Voltar</span>
          </Button>
          <div className="flex items-center space-x-3">
            <div
              style={{ backgroundColor: 'var(--color-primary-surface)', color: 'var(--color-primary)' }}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center font-bold text-xs shrink-0"
              title={currentPatientName}
            >
              {currentPatientName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">{currentPatientName}</h2>
              <p className="text-xs text-slate-500">{patient.age > 0 ? `${patient.age} anos` : 'Idade não informada'} • {patient.gender}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="font-mono text-xs font-normal text-muted-foreground border-border">
            {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        {mode === 'review' && (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={async () => {
                try {
                  const diagnosisString = aiAnalysis 
                    ? `${aiAnalysis.hypothesis} (CID-10: ${aiAnalysis.cid10})` 
                    : 'Aguardando diagnóstico automático';
                    
                  // Combine AI evidence with reported issues
                  const issuesText = patient.reportedIssues ? `Problemas Relatados: ${patient.reportedIssues}\n\n` : '';
                  const aiEvidences = aiAnalysis?.evidence_list?.join('; ') || 'Nenhuma listada.';
                  const finalNotes = `${issuesText}Consulta gerada pelo MedAssist AI.\nEvidências: ${aiEvidences}`;

                  await consultationsApi.create({
                    patientId: patient.id,
                    transcript,
                    notes: finalNotes,
                    diagnosis: diagnosisString,
                  });
                  toast.success('Consulta salva no prontuário!', { description: 'Vinculada ao paciente ' + patient.name });
                  onBack();
                } catch (err: any) {
                  toast.error(err.message ?? 'Erro ao salvar consulta');
                }
              }}
            >
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
            <ReviewView 
               key="review" 
               transcript={transcript} 
               patient={{...patient, name: currentPatientName}} 
               aiAnalysis={aiAnalysis} 
               pharmacistInsights={pharmacistInsights} 
               isPharmacistLoading={isPharmacistLoading} 
            />
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
      className="h-full flex flex-col items-center justify-center bg-background"
    >
      <div className="w-full max-w-3xl px-6 flex-1 flex flex-col justify-center min-h-0 pb-32">
        <div className="text-center mb-12">
           <h2 className="text-2xl font-bold text-foreground mb-2">
             {isRecording ? "Ouvindo..." : "Pronto para gravar"}
           </h2>
           <p className="text-muted-foreground">
             O MedAssist está pronto para transcrever e analisar a consulta.
           </p>
        </div>

        {/* Visualizer */}
        <div className="h-32 flex items-center justify-center space-x-1 mb-12">
          {isRecording ? (
            Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-primary rounded-full"
                animate={{ height: [10, Math.random() * 60 + 10, 10] }}
                transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
              />
            ))
          ) : (
            <div className="h-1 w-full max-w-md bg-muted rounded-full overflow-hidden relative">
               {transcript.length > 0 && <div className="absolute left-0 top-0 bottom-0 bg-primary w-1/3" />}
            </div>
          )}
        </div>

        {/* Transcript Preview */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border min-h-[200px] max-h-[300px] overflow-y-auto">
           {transcript.length === 0 ? (
             <p className="text-muted-foreground italic text-center mt-8">A transcrição aparecerá aqui em tempo real...</p>
           ) : (
             <p className="text-foreground leading-relaxed whitespace-pre-line">
               {transcript.join(" ")}
               <span className="animate-pulse inline-block w-2 h-4 bg-primary ml-1 align-middle"></span>
             </p>
           )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-6 flex flex-col items-center shadow-lg">
         <div className="font-mono text-2xl font-medium text-foreground mb-6">
           {formatTime(recordingTime)}
         </div>
         
         <div className="flex items-center space-x-6">
           {!isRecording ? (
             <Button size="lg" onClick={onStart} className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/30 scale-100 hover:scale-105 transition-all text-primary-foreground">
               <Mic size={28} />
             </Button>
           ) : (
             <Button size="lg" onClick={onPause} className="h-16 w-16 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 text-white">
               <Pause size={28} />
             </Button>
           )}
           
           {(transcript.length > 0 || recordingTime > 0) && (
             <Button size="lg" variant="destructive" onClick={onStop} className="h-16 w-16 rounded-full shadow-lg">
               <Square size={24} fill="currentColor" />
             </Button>
           )}
         </div>
         <p className="mt-4 text-xs text-muted-foreground uppercase tracking-widest font-semibold">
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
      className="h-full flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div className="z-10 flex flex-col items-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border-t-2 border-l-2 border-primary/50 rounded-full mb-8 relative flex items-center justify-center shadow-[0_0_30px_rgba(0,128,128,0.2)] dark:shadow-[0_0_30px_rgba(0,255,255,0.1)]"
        >
           <div className="w-24 h-24 border-r-2 border-b-2 border-primary rounded-full opacity-60" />
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-2 text-primary">
          Analisando Dados Clínicos
        </h2>
        <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground font-mono">
          <motion.span 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }}
          >
            [1/3] Transcrevendo áudio...
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 1.5 }}
          >
            [2/3] Buscando códigos CID-10...
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 2.5 }}
          >
            [3/3] Gerando plano de tratamento...
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewView({ transcript, patient, aiAnalysis, pharmacistInsights, isPharmacistLoading }: { transcript: string[], patient: Patient, aiAnalysis: any, pharmacistInsights: any, isPharmacistLoading: boolean }) {
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("analysis");

  const handleGeneratePDF = (type: string) => {
    if (type === "Pedido de Exames") {
      if (selectedExams.length === 0) {
         toast.error("Selecione pelo menos um exame para gerar o pedido.");
         return;
      }
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Guia de Solicitação de Exames", 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Paciente: ${patient.name}`, 20, 35);
      doc.text(`Data Nascimento: ${patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Não informada'}`, 20, 45);
      doc.text(`Data da Consulta: ${new Date().toLocaleDateString()}`, 20, 55);
      
      doc.setFontSize(14);
      doc.text("Exames Solicitados:", 20, 75);
      
      doc.setFontSize(12);
      let y = 85;
      selectedExams.forEach(ex => {
        doc.text(`• ${ex}`, 25, y);
        y += 10;
      });

      doc.text("________________________________________________", 20, y + 20);
      doc.text("Assinatura do Médico", 20, y + 30);

      doc.save(`Pedido_Exames_${patient.name.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF de Exames gerado com sucesso!");
      return;
    }

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

  const safeAnalysis = aiAnalysis || {
    hypothesis: 'Analisando...',
    cid10: '...',
    confidence: '0%',
    differential: '...',
    differential_cid: '...',
    evidence_list: []
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="h-full flex flex-col bg-background overflow-hidden"
    >
      {/* Mobile Tabs Header */}
      <div className="lg:hidden bg-card border-b border-border p-2 shrink-0 z-20">
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
          "w-full lg:w-1/3 flex-col border-r border-border bg-card min-w-0 lg:flex",
          activeTab === 'transcript' ? "flex" : "hidden"
        )}>
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-foreground flex items-center">
              <FileText size={18} className="mr-2 text-primary" /> 
              Transcrição da Consulta
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4 lg:p-6">
            <div className="prose prose-slate dark:prose-invert max-w-none pb-20 lg:pb-0">
              {transcript.map((line, i) => (
                <p key={i} className="mb-3 text-foreground leading-relaxed p-2 rounded hover:bg-muted/50 transition-colors">{line}</p>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Middle/Right Panel: AI Analysis & Actions */}
        <div className={cn(
          "flex-1 flex-col bg-background h-full overflow-hidden lg:flex",
          activeTab === 'analysis' ? "flex" : "hidden"
        )}>
           <div className="flex-1 overflow-y-auto p-4 lg:p-6">
             <div className="space-y-6 max-w-4xl mx-auto">
               
               {/* AlertBanner 
                 type="warning" 
                 title="Atenção Crítica" 
                 message="Mensagem de aviso aqui"
                 className="mb-4"
               /> */}

               {/* AI Insights Card */}
               <Card className="border-l-4 border-l-primary shadow-md overflow-hidden bg-card">
                 <CardHeader className="pb-2 bg-primary/5">
                   <div className="flex items-center gap-2 mb-1">
                     <Badge variant="outline" className="bg-primary hover:bg-primary text-primary-foreground border-none">Analysis AI Dashboard</Badge>
                     <span className="text-xs text-muted-foreground font-mono">Baseado em Evidências • Atualizado agora</span>
                   </div>
                   <CardTitle className="text-xl font-bold text-foreground">Diagnóstico Sugerido</CardTitle>
                 </CardHeader>
                 <CardContent className="pt-4 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-xl border border-border">
                        <h4 className="font-semibold text-foreground mb-1">Hipótese Principal</h4>
                        <p className="text-lg font-bold text-primary">{safeAnalysis.hypothesis}</p>
                        <p className="text-sm text-muted-foreground mt-1">CID-10: <span className="font-mono font-medium text-foreground">{safeAnalysis.cid10}</span></p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-status-success" style={{width: safeAnalysis.confidence.includes('%') ? safeAnalysis.confidence : '100%'}}></div>
                          </div>
                          <span className="text-xs font-bold font-mono text-status-success">{safeAnalysis.confidence}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-xl border border-border">
                        <h4 className="font-semibold text-foreground mb-1">Diagnóstico Diferencial</h4>
                        <p className="text-lg font-bold text-foreground">{safeAnalysis.differential}</p>
                        <p className="text-sm text-muted-foreground mt-1">CID-10: <span className="font-mono font-medium text-foreground">{safeAnalysis.differential_cid}</span></p>
                      </div>
                   </div>

                   {/* Pharmacist Insights */}
                   {pharmacistInsights && (
                      <div className="mt-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-orange-500 text-white border-none">Análise Farmacêutica</Badge>
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-mono">Possíveis causas e tratamentos sugeridos</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <h4 className="font-semibold text-foreground text-sm mb-2 text-orange-700 dark:text-orange-300">Causas Identificadas</h4>
                             <ul className="list-disc pl-5 space-y-1">
                               {pharmacistInsights.causes?.map((cause: string, i: number) => (
                                 <li key={i} className="text-sm text-muted-foreground">{cause}</li>
                               ))}
                             </ul>
                           </div>
                           <div>
                             <h4 className="font-semibold text-foreground text-sm mb-2 text-emerald-700 dark:text-emerald-300">Medicamentos Sugeridos</h4>
                             <ul className="list-disc pl-5 space-y-1">
                               {pharmacistInsights.medications?.map((med: string, i: number) => (
                                 <li key={i} className="text-sm text-muted-foreground">{med}</li>
                               ))}
                             </ul>
                           </div>
                        </div>
                      </div>
                   )}

                   <Accordion type="single" collapsible className="w-full border border-border rounded-lg bg-card px-4">
                      <AccordionItem value="evidence" className="border-none">
                        <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                           Ver Evidências Científicas Extraídas
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2 text-sm text-muted-foreground prose prose-slate dark:prose-invert">
                             {safeAnalysis.evidence_list.map((ev: string, idx: number) => (
                               <p key={idx}>• {ev}</p>
                             ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                   </Accordion>
                 </CardContent>
               </Card>

               {/* Exam Request Section */}
               <Card className="shadow-sm bg-card">
                 <CardHeader>
                   <CardTitle className="text-lg font-semibold text-foreground">Solicitação de Exames</CardTitle>
                   <CardDescription>Selecione os exames recomendados pela IA para este perfil clínico</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {isPharmacistLoading ? (
                        <p className="text-sm text-muted-foreground animate-pulse">Consultando especialista de diagnósticos...</p>
                     ) : pharmacistInsights?.exams && pharmacistInsights.exams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {pharmacistInsights.exams.map((exam: string, idx: number) => (
                             <label key={idx} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/30 cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 className="w-5 h-5 rounded text-primary border-border focus:ring-primary"
                                 checked={selectedExams.includes(exam)}
                                 onChange={(e) => {
                                   if (e.target.checked) setSelectedExams([...selectedExams, exam]);
                                   else setSelectedExams(selectedExams.filter(e => e !== exam));
                                 }}
                               />
                               <span className="text-sm font-medium text-foreground">{exam}</span>
                             </label>
                          ))}
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma sugestão automatica de exames.</p>
                     )}
                     
                     <div className="flex justify-end pt-4">
                       <Button 
                         onClick={() => handleGeneratePDF("Pedido de Exames")}
                         disabled={selectedExams.length === 0}
                         className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                       >
                         <FileText size={18} className="mr-2" />
                         Gerar Guia em PDF ({selectedExams.length})
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Certificate Section */}
               <Card className="shadow-sm bg-card">
                 <CardHeader>
                   <CardTitle className="text-lg font-semibold text-foreground">Atestado Médico</CardTitle>
                   <CardDescription>Gerar atestado de comparecimento ou afastamento</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-col sm:flex-row gap-3">
                     <Button variant="outline" className="flex-1 w-full" onClick={() => handleGeneratePDF("Atestado de Horas")}>
                       Atestado de Horas (Comparecimento)
                     </Button>
                     <Button variant="outline" className="flex-1 w-full" onClick={() => handleGeneratePDF("Atestado de 1 Dia")}>
                       Atestado de 1 Dia (Afastamento)
                     </Button>
                   </div>
                 </CardContent>
               </Card>

             </div>
           </div>

           {/* Footer Actions */}
           <div className="shrink-0 bg-card border-t border-border p-4 shadow-lg z-20">
             <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="text-sm text-muted-foreground order-2 md:order-1 text-center md:text-left">
                 <span className="font-semibold text-foreground">Dr. Ray</span> • CRM 123456-SP
               </div>
               <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto order-1 md:order-2">
                  <Button variant="outline" className="w-full sm:w-auto text-foreground border-border" onClick={() => handleGeneratePDF("Relatório Completo")}>
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

