import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
          <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-xl font-bold mb-2">Erro não esperado</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Ocorreu um erro ao carregar a interface da aplicação clínica.
              Tente recarregar a página.
            </p>
            <div className="bg-muted p-3 w-full rounded-md text-left text-xs text-muted-foreground mb-6 overflow-auto max-h-32 font-mono">
              {this.state.error?.message}
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Recarregar Aplicação
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
