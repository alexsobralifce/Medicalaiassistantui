import { Settings as SettingsIcon, User, Shield, Bell, Key } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export function Settings() {
  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto bg-background relative">
      <header className="mb-10 text-center max-w-2xl mx-auto mt-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Configurações</h1>
        <p className="text-muted-foreground text-lg">
          Gerencie suas preferências de sistema e conta profissional.
        </p>
      </header>
      
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-[250px_1fr]">
        <nav className="flex flex-col gap-2">
          <Button variant="secondary" className="justify-start"><User className="mr-2 h-4 w-4" /> Perfil</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground"><Shield className="mr-2 h-4 w-4" /> Segurança</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground"><Bell className="mr-2 h-4 w-4" /> Notificações</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground"><Key className="mr-2 h-4 w-4" /> API Keys</Button>
        </nav>
        
        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Informações Clínicas</h2>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Profissional</Label>
                <Input id="name" defaultValue="Dr. Ricardo Silva" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="crm">Registro Profissional (CRM/CRO)</Label>
                <Input id="crm" defaultValue="CRM-SP 123456" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="dr.silva@clinica.com" type="email" />
              </div>
              <Button className="mt-4">Salvar Alterações</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
