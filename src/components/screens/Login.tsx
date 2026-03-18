import { useState, useEffect } from 'react';
import { Activity, Mail, Lock, Loader2, Download, Smartphone } from 'lucide-react';
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Check iOS
    const checkIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(checkIOS);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    }
  };

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
        <div className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            Primeiro acesso? Mande uma mensagem para o <a href="#" className="text-primary hover:underline font-medium">Administrador</a> para receber seu login.
          </p>

          {/* PWA Pointers */}
          <div className="pt-4 border-t border-border/50 flex flex-col items-center gap-3">
            {(deferredPrompt || isIOS) && (
              <div className="bg-primary/5 border border-primary/20 text-primary-foreground/80 rounded-xl p-4 text-xs w-full text-center">
                <Smartphone className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="mb-2 text-foreground font-medium">Use o MedAssist como aplicativo!</p>
                {deferredPrompt ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-1 border-primary text-primary hover:bg-primary/10"
                    onClick={handleInstallClick}
                  >
                    <Download className="w-4 h-4 mr-2" /> Instalar App
                  </Button>
                ) : isIOS ? (
                  <p className="text-muted-foreground px-2">
                    No Safari (iPhone), toque no ícone <b>Compartilhar</b> <span className="inline-block text-[10px] border px-1 rounded mx-1">↑</span> e depois <b>Adicionar à Tela de Início</b>.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
