import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { consultationsApi, ConsultationData } from "../../lib/api";
import { Patient } from "../../domain/patient/Patient";
import { Trash2, Edit, Save, X, Activity, AlertCircle, Loader2 } from "lucide-react";
import { CidSearchMenu } from "./CidSearchMenu";
import { toast } from "sonner";

interface MedicalRecordModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MedicalRecordModal({ patient, isOpen, onClose }: MedicalRecordModalProps) {
  const [consultations, setConsultations] = useState<ConsultationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editDiagnosis, setEditDiagnosis] = useState("");

  useEffect(() => {
    if (isOpen && patient?.id) {
      loadHistory();
    }
  }, [isOpen, patient]);

  const loadHistory = async () => {
    if (!patient?.id) return;
    setIsLoading(true);
    try {
      const data = await consultationsApi.listByPatient(patient.id);
      setConsultations(data);
    } catch (err) {
      toast.error("Erro ao carregar prontuário.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (cons: ConsultationData) => {
    setEditingId(cons.id);
    setEditNotes(cons.notes || "");
    setEditDiagnosis(cons.diagnosis || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNotes("");
    setEditDiagnosis("");
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await consultationsApi.update(id, {
        notes: editNotes,
        diagnosis: editDiagnosis
      });
      toast.success("Consulta atualizada!");
      setEditingId(null);
      loadHistory();
    } catch (err) {
      toast.error("Erro ao atualizar consulta.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar este registro? Isso não pode ser desfeito.")) return;
    try {
      await consultationsApi.remove(id);
      toast.success("Registro apagado.");
      loadHistory();
    } catch (err) {
      toast.error("Erro ao apagar registro.");
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 border-b border-border bg-card shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Activity className="text-primary" /> Prontuário: {patient.name}
          </DialogTitle>
          <DialogDescription>
            Histórico completo de consultas e evolução clínica.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-background">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p>Carregando histórico do paciente...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Nenhuma consulta registrada para este paciente ainda.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {consultations.map((cons) => (
                <div key={cons.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="bg-muted/30 px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                       <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-mono uppercase">
                         {new Date(cons.createdAt).toLocaleDateString('pt-BR')} 
                       </span>
                    </div>
                    
                    {editingId !== cons.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditClick(cons)} className="h-8 text-xs">
                          <Edit size={14} className="mr-1.5" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(cons.id)} className="h-8 text-xs">
                          <Trash2 size={14} className="mr-1.5" /> Excluir
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 text-xs">
                          <X size={14} className="mr-1.5" /> Cancelar
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs text-white" onClick={() => handleSaveEdit(cons.id)}>
                          <Save size={14} className="mr-1.5" /> Salvar
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-4">
                    {editingId === cons.id ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 border border-blue-100 dark:border-blue-900 rounded-lg space-y-3">
                          <CidSearchMenu 
                             label="Alterar Diagnóstico (Busca de CID-10 LOCAL)" 
                             selectedCidStr={editDiagnosis}
                             onSelectCid={(cid) => setEditDiagnosis(`${cid.code} - ${cid.description}`)}
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                             Ou digite manualmente:
                             <Input 
                               value={editDiagnosis} 
                               onChange={e => setEditDiagnosis(e.target.value)} 
                               className="mt-1 bg-background"
                               placeholder="Ex: J01 - Sinusite"
                             />
                          </div>
                        </div>

                        <div>
                          <Label className="mb-2 block text-foreground">Notas Médicas / Evolução</Label>
                          <Textarea 
                            rows={6} 
                            value={editNotes} 
                            onChange={e => setEditNotes(e.target.value)}
                            className="resize-none font-mono text-sm bg-background leading-relaxed"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-col md:flex-row gap-5">
                           <div className="flex-1 bg-slate-50 dark:bg-muted/10 rounded-lg p-4 border border-border">
                             <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Diagnóstico Salvo</h4>
                             <p className="text-foreground font-medium text-lg leading-snug">{cons.diagnosis || "Não registrado"}</p>
                           </div>
                        </div>
                        
                        <div>
                           <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Notas Clínicas & Evidências</h4>
                           <div className="bg-background text-sm text-foreground/90 p-4 rounded-lg border border-border whitespace-pre-wrap leading-relaxed">
                              {cons.notes ? cons.notes : <span className="italic opacity-50">Nenhuma nota registrada nesta consulta.</span>}
                           </div>
                        </div>

                        {cons.transcript && cons.transcript.length > 0 && (
                          <div>
                            <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2 text-primary">Transcrição Original Bruta</h4>
                            <div className="bg-muted/50 p-3 rounded-md text-xs font-mono text-muted-foreground max-h-32 overflow-y-auto">
                              {cons.transcript}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
