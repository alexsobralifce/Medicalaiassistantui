import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "./utils";

interface AlertBannerProps {
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  className?: string;
}

export function AlertBanner({ type, title, message, className }: AlertBannerProps) {
  const styles = {
    success: "bg-status-success/10 border-status-success text-status-success",
    warning: "bg-status-warning/10 border-status-warning text-status-warning",
    error: "bg-status-critical/10 border-status-critical text-status-critical",
    info: "bg-primary/10 border-primary text-primary",
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  return (
    <div className={cn("rounded-lg border p-4 flex gap-3", styles[type], className)} role="alert">
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>
  );
}
