import { useState } from 'react';
import { Activity, Fingerprint, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBiometricLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50/30 md:p-4 p-0">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full md:max-w-md h-screen md:h-auto bg-white md:rounded-2xl shadow-xl border-0 md:border border-slate-100 overflow-hidden flex flex-col"
      >
        <div className="bg-[#008080] p-8 text-center shrink-0">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center backdrop-blur-sm mb-4">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MedAssist AI</h1>
          <p className="text-teal-100 mt-2 text-sm">Espaço Clínico Seguro</p>
        </div>

        <div className="p-8 space-y-6 flex-1 flex flex-col justify-center md:block">
          <div className="space-y-2">
            <Label htmlFor="email">ID Médico / Email</Label>
            <div className="relative">
              <Input id="email" placeholder="dr.silva@clinica.com" className="pl-10" />
              <div className="absolute left-3 top-2.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input id="password" type="password" className="pl-10" />
              <div className="absolute left-3 top-2.5 text-slate-400">
                <Lock size={18} />
              </div>
            </div>
          </div>

          <Button className="w-full bg-[#008080] hover:bg-[#006666] h-12 text-base" onClick={onLogin}>
            Entrar com Segurança
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Ou acesso rápido</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-14 border-slate-200 hover:bg-teal-50 hover:text-[#008080] hover:border-[#008080] transition-all group"
            onClick={handleBiometricLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-pulse flex items-center">
                <div className="h-4 w-4 bg-[#008080] rounded-full mr-2 animate-bounce"></div>
                Autenticando...
              </div>
            ) : (
              <div className="flex items-center flex-col py-1">
                 <Fingerprint className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                 <span className="text-xs font-medium">FaceID / Biometria</span>
              </div>
            )}
          </Button>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 shrink-0">
          <p className="text-xs text-slate-500">Protegido por Criptografia de Ponta a Ponta (Compatível com HIPAA)</p>
        </div>
      </motion.div>
    </div>
  );
}
