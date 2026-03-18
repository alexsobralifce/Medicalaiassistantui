import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Users, Search, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner';
import { usersApi, AuthenticatedUser } from '../../lib/api';

export function AdminUsers() {
  const [users, setUsers] = useState<AuthenticatedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCrm, setFormCrm] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN'|'DOCTOR'>('DOCTOR');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.list();
      setUsers(data);
    } catch (error) {
      toast.error('Erro ao carregar usuários.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormCrm('');
    setFormRole('DOCTOR');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AuthenticatedUser) => {
    resetForm();
    setEditingId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormCrm(user.crm || '');
    setFormRole(user.role);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return toast.error('Nome e Email são obrigatórios!');
    if (!editingId && !formPassword) return toast.error('A senha é obrigatória para um novo usuário!');

    setIsSaving(true);
    try {
      const payload: any = {
        name: formName,
        email: formEmail,
        crm: formCrm,
        role: formRole
      };
      if (formPassword) payload.password = formPassword;

      if (editingId) {
        await usersApi.update(editingId, payload);
        toast.success('Usuário atualizado!');
      } else {
        await usersApi.create(payload);
        toast.success('Usuário criado!');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error: any) {
      toast.error('Erro ao salvar usuário.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover permanentemente o acesso do usuário "${name}"?`)) return;
    
    try {
      await usersApi.remove(id);
      toast.success('Usuário removido.');
      loadUsers();
    } catch (error: any) {
      toast.error('Não foi possível remover, verifique se não é a conta em uso.');
      console.error(error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="section-padding h-full flex flex-col bg-surface relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Administração de Usuários</h1>
          </div>
          <p className="text-muted-foreground mt-1">Gerencie os acessos de Médicos e Administradores do sistema MedAssist.</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 shadow-sm font-semibold">
          <Plus className="h-5 w-5" /> Adicionar Usuário
        </Button>
      </header>

      <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
             <Input 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Buscar usuário por nome ou email..." 
               className="pl-9"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-background">
          {isLoading ? (
             <div className="h-full flex items-center justify-center">
                 <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
             </div>
          ) : filteredUsers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 text-center space-y-3">
               <Users className="w-12 h-12 mb-2" />
               <p className="text-lg">Nenhum usuário correspondente.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
               {filteredUsers.map(user => (
                 <div key={user.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                   
                   <div className={`absolute top-0 right-0 py-1 px-3 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg ${user.role === 'ADMIN' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {user.role}
                   </div>

                   <div>
                     <h3 className="font-bold text-lg text-foreground pr-12 truncate">{user.name}</h3>
                     <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                     {user.crm && <p className="text-xs font-mono mt-1 opacity-70">CRM: {user.crm}</p>}
                   </div>

                   <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
                      <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={() => handleOpenEdit(user)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-none text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => handleDelete(user.id, user.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Altere as informações de acesso.' : 'Forneça os dados iniciais. Ele já poderá acessar o sistema.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Nome Completo</Label>
              <Input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Dr. João Silva" />
            </div>
            <div className="grid gap-2">
              <Label>E-mail (Login)</Label>
              <Input type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="joao@hospital.com" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label>Senha {editingId && <span className="opacity-50 text-[10px]">(Opcional)</span>}</Label>
                 <Input type="password" required={!editingId} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder={editingId ? 'Deixe em branco p/ manter' : '••••••'} />
               </div>
               <div className="grid gap-2">
                 <Label>Nível de Acesso</Label>
                 <select
                    required
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as 'ADMIN'|'DOCTOR')}
                  >
                    <option value="DOCTOR">MÉDICO</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
               </div>
            </div>
            <div className="grid gap-2">
              <Label>CRM <span className="opacity-50 text-[10px]">(Opcional)</span></Label>
              <Input value={formCrm} onChange={e => setFormCrm(e.target.value)} placeholder="123456-SP" />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
