import { useState } from 'react';
import { Activity, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  isLoading?: boolean;
}

export function Login({ onLogin, isLoading = false }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onLogin(email, password);
    } else {
      toast.error('Por favor, informe e-mail e senha.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Logo area */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="bg-primary/10 p-4 rounded-2xl shadow-sm border border-primary/20">
            <Activity className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">MedAssist AI</h1>
            <p className="text-muted-foreground mt-2">Acesse sua conta para continuar.</p>
          </div>
        </div>

        {/* Login form */}
        <div className="bg-card p-8 rounded-3xl shadow-xl border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">E-mail Mestre ou Doutor(a)</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background border-border/80 focus-visible:ring-primary/40 rounded-xl"
                  placeholder="doutor@medassist.com"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background border-border/80 focus-visible:ring-primary/40 rounded-xl"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all shadow-primary/20"
              disabled={!email || !password || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-sm text-muted-foreground">
          Primeiro acesso? Mande uma mensagem para o <a href="#" className="text-primary hover:underline font-medium">Administrador</a> para receber seu login.
        </p>
      </div>
    </div>
  );
}
