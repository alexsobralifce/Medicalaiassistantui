import { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Pause, Square, Save, Download, Send, FileText, CheckCircle, ClipboardList, BrainCircuit, Edit3, X } from 'lucide-react';
import { Button } from "../ui/button";
import { Patient } from "../../domain/patient/Patient";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { toast } from "sonner";
import { cn } from "../ui/utils";
import { consultationsApi, aiApi, patientsApi } from "../../lib/api";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import { Textarea } from "../ui/textarea";

interface ConsultationProps {
  patient: Patient;
  onBack: () => void;
}

type Mode = 'recording' | 'processing' | 'review';

export function Consultation({ patient, onBack }: ConsultationProps) {
  const [mode, setMode] = useState<Mode>('recording');
  const [isRecording, setIsRecording] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentPatientName, setCurrentPatientName] = useState(patient.name);
  
  // Real Audio Recording state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Anamnese pipeline state
  const [transcriptClean, setTranscriptClean] = useState('');
  const [anamnesisJson, setAnamnesisJson] = useState<any>(null);
  const [anamnesisMarkdown, setAnamnesisMarkdown] = useState('');

  // AI Analysis State (legacy: hypothesis/diagnosis)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [pharmacistInsights, setPharmacistInsights] = useState<any>(null);
  const [isPharmacistLoading, setIsPharmacistLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [savedConsultationId, setSavedConsultationId] = useState<string | null>(null);

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
          // 1. Transcrever áudio com Whisper
          toast.info("Transcrevendo áudio...");
          const { text } = await aiApi.transcribe(audioBlob);
          setRawTranscript(text);

          // 2. Pipeline completo de anamnese (3 prompts)
          toast.info("Estruturando anamnese clínica...");
          const { transcricao_limpa, anamnesis_json, anamnesis_markdown } = await aiApi.anamnese(text);
          setTranscriptClean(transcricao_limpa);
          setAnamnesisJson(anamnesis_json);
          setAnamnesisMarkdown(anamnesis_markdown);

          // 3. Análise de hipótese diagnóstica (em paralelo)
          const analysis = await aiApi.analyze(transcricao_limpa);
          setAiAnalysis(analysis);
          
          setMode('review');
        } catch (error: any) {
          toast.error("Erro no processamento da IA", { description: error.message });
          setMode('recording');
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      setMediaRecorder(recorder);
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

  const handleSave = async () => {
    try {
      const diagnosisString = aiAnalysis
        ? `${aiAnalysis.hypothesis} (CID-10: ${aiAnalysis.cid10})`
        : anamnesisJson?.hipotese_diagnostica?.descricao ?? 'Aguardando diagnóstico';

      const consultation = await consultationsApi.create({
        patientId: patient.id,
        transcript: rawTranscript ? [rawTranscript] : [],
        transcriptClean,
        anamnesisJson,
        anamnesisMarkdown,
        notes: anamnesisMarkdown,
        diagnosis: diagnosisString,
      } as any);

      setSavedConsultationId(consultation.id);
      toast.success('Consulta salva! Agora você pode assinar digitalmente.', {
        description: 'Vinculada ao paciente ' + patient.name,
      });
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar consulta');
    }
  };

  const handleSign = async () => {
    if (!savedConsultationId) {
      toast.error('Salve a consulta antes de assinar.');
      return;
    }
    try {
      setIsSigning(true);
      await consultationsApi.sign(savedConsultationId);
      toast.success('✅ Consulta assinada digitalmente e finalizada!', {
        description: 'Prontuário salvo com status COMPLETED.',
      });
      onBack();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao assinar consulta');
    } finally {
      setIsSigning(false);
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
            <div className="flex gap-2">
              {!savedConsultationId ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={handleSave}
                >
                  <Save size={16} className="mr-2" /> Salvar Rascunho
                </Button>
              ) : null}
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={handleSign}
                disabled={isSigning}
              >
                <CheckCircle size={16} className="mr-2" />
                {isSigning ? 'Assinando...' : 'Assinar e Finalizar'}
              </Button>
            </div>
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
              rawTranscript={rawTranscript}
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
               rawTranscript={rawTranscript}
               transcriptClean={transcriptClean}
               anamnesisMarkdown={anamnesisMarkdown}
               setAnamnesisMarkdown={setAnamnesisMarkdown}
               anamnesisJson={anamnesisJson}
               patient={{ ...patient, name: currentPatientName }}
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

// ─── Recording View ───────────────────────────────────────────────────────────

function RecordingView({ isRecording, recordingTime, rawTranscript, onStart, onPause, onStop }: any) {
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
             MedAssist irá transcrever e estruturar a anamnese automaticamente.
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
               {rawTranscript && <div className="absolute left-0 top-0 bottom-0 bg-primary w-1/3" />}
            </div>
          )}
        </div>

        {/* Transcript Preview */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border min-h-[200px] max-h-[300px] overflow-y-auto">
           {!rawTranscript ? (
             <p className="text-muted-foreground italic text-center mt-8">A transcrição aparecerá aqui...</p>
           ) : (
             <p className="text-foreground leading-relaxed whitespace-pre-line">
               {rawTranscript}
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
           
           {(rawTranscript || recordingTime > 0) && (
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

// ─── Processing View ──────────────────────────────────────────────────────────

function ProcessingView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      <div className="z-10 flex flex-col items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 border-t-2 border-l-2 border-primary/50 rounded-full mb-8 relative flex items-center justify-center shadow-[0_0_30px_rgba(0,128,128,0.2)]"
        >
           <div className="w-24 h-24 border-r-2 border-b-2 border-primary rounded-full opacity-60" />
        </motion.div>
        
        <h2 className="text-2xl font-bold mb-4 text-primary">Gerando Anamnese</h2>
        <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground font-mono">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            [1/3] Transcrevendo e limpando o áudio...
          </motion.span>
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>
            [2/3] Estruturando anamnese em JSON (CFM 2.056/2013)...
          </motion.span>
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4 }}>
            [3/3] Formatando prontuário para revisão...
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Review View ──────────────────────────────────────────────────────────────

function ReviewView({
  rawTranscript,
  transcriptClean,
  anamnesisMarkdown,
  setAnamnesisMarkdown,
  anamnesisJson,
  patient,
  aiAnalysis,
  pharmacistInsights,
  isPharmacistLoading,
}: any) {
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("anamnese");
  
  // States para o Editor de Anamnese
  const [isEditingAnamnesis, setIsEditingAnamnesis] = useState(false);
  const [editedAnamnesis, setEditedAnamnesis] = useState(anamnesisMarkdown);

  // Sincroniza o prop caso venha vazio primeiro e depois carregue
  useEffect(() => {
    if (!isEditingAnamnesis) {
      setEditedAnamnesis(anamnesisMarkdown);
    }
  }, [anamnesisMarkdown, isEditingAnamnesis]);

  const handleSaveEdit = () => {
    setAnamnesisMarkdown(editedAnamnesis);
    setIsEditingAnamnesis(false);
    toast.success("Edição concluída", { description: "O texto da anamnese foi atualizado." });
  };

  const safeAnalysis = aiAnalysis || {
    hypothesis: 'Aguardando análise...',
    cid10: '—',
    confidence: '0%',
    differential: '—',
    differential_cid: '—',
    evidence_list: [],
  };

  const pendingFields: string[] = anamnesisJson?.campos_nao_identificados ?? [];

  const handleGeneratePDF = () => {
    if (selectedExams.length === 0) {
      toast.error("Selecione pelo menos um exame para gerar o pedido.");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Guia de Solicitação de Exames", 20, 20);
    doc.setFontSize(12);
    doc.text(`Paciente: ${patient.name}`, 20, 35);
    doc.text(`Data da Consulta: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.setFontSize(14);
    doc.text("Exames Solicitados:", 20, 65);
    doc.setFontSize(12);
    let y = 75;
    selectedExams.forEach(ex => {
      doc.text(`• ${ex}`, 25, y);
      y += 10;
    });
    doc.text("________________________________________________", 20, y + 20);
    doc.text("Assinatura do Médico", 20, y + 30);
    doc.save(`Pedido_Exames_${patient.name.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF de Exames gerado com sucesso!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col bg-background overflow-hidden"
    >
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Transcript */}
        <div className="w-full lg:w-1/3 flex flex-col border-r border-border bg-card min-w-0">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-foreground flex items-center">
              <FileText size={18} className="mr-2 text-primary" />
              Transcrição Original
            </h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <p className="text-foreground leading-relaxed whitespace-pre-line text-sm">
              {rawTranscript || <span className="text-muted-foreground italic">Sem transcrição disponível.</span>}
            </p>
          </ScrollArea>
        </div>

        {/* Right Panel: Anamnese Tabs */}
        <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="bg-card border-b border-border px-4 pt-3 shrink-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="anamnese" className="gap-2">
                  <ClipboardList size={14} /> Anamnese
                </TabsTrigger>
                <TabsTrigger value="analise" className="gap-2">
                  <BrainCircuit size={14} /> Análise IA
                </TabsTrigger>
                <TabsTrigger value="exames" className="gap-2">
                  <FileText size={14} /> Exames
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Aba Anamnese: Prontuário em Markdown */}
            <TabsContent value="anamnese" className="flex-1 overflow-y-auto m-0 flex flex-col">
              <div className="p-4 lg:p-6 max-w-4xl mx-auto w-full flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  {pendingFields.length > 0 ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg max-w-2xl">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">⚠️ {pendingFields.length} campo(s) não abordado(s) na consulta:</p>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {pendingFields.map((f: string, i: number) => (
                          <li key={i} className="text-xs text-yellow-700 dark:text-yellow-400">{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : <div />}
                  
                  {anamnesisMarkdown && (
                    <Button 
                      variant={isEditingAnamnesis ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => isEditingAnamnesis ? handleSaveEdit() : setIsEditingAnamnesis(true)}
                      className={cn("ml-4 shrink-0 shadow-sm", isEditingAnamnesis && "bg-emerald-600 hover:bg-emerald-700")}
                    >
                      {isEditingAnamnesis ? (
                        <><CheckCircle size={16} className="mr-2" /> Concluir Edição</>
                      ) : (
                        <><Edit3 size={16} className="mr-2" /> Editar Anamnese</>
                      )}
                    </Button>
                  )}
                </div>

                {isEditingAnamnesis ? (
                  <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <Textarea 
                      value={editedAnamnesis} 
                      onChange={(e) => setEditedAnamnesis(e.target.value)}
                      className="flex-1 min-h-[400px] font-mono text-sm leading-relaxed p-4 border-primary/20 focus-visible:ring-primary shadow-inner bg-muted/10"
                      placeholder="Edite a anamnese aqui..."
                    />
                  </div>
                ) : anamnesisMarkdown ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none text-sm animate-in fade-in duration-200 bg-card p-6 rounded-xl border border-border shadow-sm">
                    <ReactMarkdown>{anamnesisMarkdown}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-center mt-10">Anamnese não disponível.</p>
                )}
              </div>
            </TabsContent>

            {/* Aba Análise IA: Hipótese + Farmacêutico */}
            <TabsContent value="analise" className="flex-1 overflow-y-auto m-0">
              <div className="p-4 lg:p-6 space-y-4 max-w-4xl mx-auto">
                <Card className="border-l-4 border-l-primary shadow-md overflow-hidden bg-card">
                  <CardHeader className="pb-2 bg-primary/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-primary hover:bg-primary text-primary-foreground border-none">Hipótese Diagnóstica</Badge>
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
                             <div className="h-full bg-emerald-500" style={{ width: safeAnalysis.confidence?.includes('%') ? safeAnalysis.confidence : '0%' }}></div>
                           </div>
                           <span className="text-xs font-bold font-mono text-emerald-600">{safeAnalysis.confidence}</span>
                         </div>
                       </div>
                       <div className="p-4 bg-muted/30 rounded-xl border border-border">
                         <h4 className="font-semibold text-foreground mb-1">Diagnóstico Diferencial</h4>
                         <p className="text-lg font-bold text-foreground">{safeAnalysis.differential}</p>
                         <p className="text-sm text-muted-foreground mt-1">CID-10: <span className="font-mono font-medium text-foreground">{safeAnalysis.differential_cid}</span></p>
                       </div>
                    </div>

                    {pharmacistInsights && (
                       <div className="mt-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 rounded-xl space-y-4">
                         <Badge variant="outline" className="bg-orange-500 text-white border-none">Análise Farmacêutica</Badge>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-orange-700">Causas Identificadas</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {pharmacistInsights.causes?.map((c: string, i: number) => <li key={i} className="text-sm text-muted-foreground">{c}</li>)}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-emerald-700">Medicamentos Sugeridos</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {pharmacistInsights.medications?.map((m: string, i: number) => <li key={i} className="text-sm text-muted-foreground">{m}</li>)}
                              </ul>
                            </div>
                         </div>
                       </div>
                    )}

                    <Accordion type="single" collapsible className="w-full border border-border rounded-lg bg-card px-4">
                       <AccordionItem value="evidence" className="border-none">
                         <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                            Ver Evidências Extraídas
                         </AccordionTrigger>
                         <AccordionContent>
                           <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                              {safeAnalysis.evidence_list?.map((ev: string, idx: number) => (
                                <p key={idx}>• {ev}</p>
                              ))}
                           </div>
                         </AccordionContent>
                       </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Exames */}
            <TabsContent value="exames" className="flex-1 overflow-y-auto m-0">
              <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
                <Card className="shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Solicitação de Exames</CardTitle>
                    <CardDescription>Selecione os exames recomendados pela IA para gerar o pedido em PDF</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isPharmacistLoading ? (
                         <p className="text-sm text-muted-foreground animate-pulse">Consultando especialista de diagnósticos...</p>
                      ) : pharmacistInsights?.exams?.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           {pharmacistInsights.exams.map((exam: string, idx: number) => (
                              <label key={idx} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/30 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 rounded text-primary border-border focus:ring-primary"
                                  checked={selectedExams.includes(exam)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedExams([...selectedExams, exam]);
                                    else setSelectedExams(selectedExams.filter(ex => ex !== exam));
                                  }}
                                />
                                <span className="text-sm font-medium text-foreground">{exam}</span>
                              </label>
                           ))}
                         </div>
                      ) : (
                         <p className="text-sm text-muted-foreground">Nenhuma sugestão automática de exames.</p>
                      )}
                      
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={handleGeneratePDF}
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

                <Card className="shadow-sm bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Atestado Médico</CardTitle>
                    <CardDescription>Gerar atestado de comparecimento ou afastamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" className="flex-1 w-full" onClick={() => toast.info("Função em breve")}>
                        Atestado de Horas (Comparecimento)
                      </Button>
                      <Button variant="outline" className="flex-1 w-full" onClick={() => toast.info("Função em breve")}>
                        Atestado de 1 Dia (Afastamento)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}
