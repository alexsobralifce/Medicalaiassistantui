import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { maskCPF, maskPhone } from "../../utils/masks";

export interface PreConsultationData {
  name: string;
  cpf: string;
  dob: string;
  phone: string;
  city: string;
  state: string;
  reportedIssues: string;
}

interface PreConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PreConsultationData) => void;
  initialData?: Partial<PreConsultationData>;
  isSubmitting?: boolean;
}

export function PreConsultationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false
}: PreConsultationModalProps) {
  const [formData, setFormData] = useState<PreConsultationData>({
    name: initialData?.name || "",
    cpf: initialData?.cpf || "",
    dob: initialData?.dob || "",
    phone: initialData?.phone || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    reportedIssues: initialData?.reportedIssues || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dados Pré-Consulta</DialogTitle>
          <DialogDescription>
            Preencha os dados do paciente antes de iniciar a sessão.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pre-name">Nome Completo *</Label>
            <Input
              id="pre-name"
              required
              placeholder="Nome do Paciente"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pre-cpf">CPF *</Label>
              <Input
                id="pre-cpf"
                required
                placeholder="000.000.000-00"
                maxLength={14}
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pre-phone">Telefone</Label>
              <Input
                id="pre-phone"
                type="tel"
                placeholder="(11) 99999-9999"
                maxLength={15}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pre-dob">Data de Nascimento</Label>
              <Input
                id="pre-dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pre-city">Cidade</Label>
              <Input
                id="pre-city"
                placeholder="Ex: São Paulo"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pre-state">Estado</Label>
              <Input
                id="pre-state"
                placeholder="Ex: SP"
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pre-issues">Problemas Relatados</Label>
            <Textarea
              id="pre-issues"
              placeholder="Descreva brevemente o motivo da consulta ou os problemas relatados..."
              className="min-h-[100px]"
              value={formData.reportedIssues}
              onChange={(e) => setFormData({ ...formData, reportedIssues: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name}>
              {isSubmitting ? "Iniciando..." : "Iniciar Consulta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
