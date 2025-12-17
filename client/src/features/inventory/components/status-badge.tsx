import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Ban } from "lucide-react";

type StatusType = "Estoque OK" | "Baixo Estoque" | "Desativado" | "Negativo";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const statusConfig = {
  "Estoque OK": {
    variant: "outline" as const,
    className: "bg-chart-2/10 text-chart-2 border-chart-2/30",
    icon: CheckCircle2,
    label: "Estoque OK",
  },
  "Baixo Estoque": {
    variant: "outline" as const,
    className: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    icon: AlertTriangle,
    label: "Baixo Estoque",
  },
  "Desativado": {
    variant: "outline" as const,
    className: "bg-muted text-muted-foreground border-muted-foreground/30",
    icon: Ban,
    label: "Desativado",
  },
  "Negativo": {
    variant: "outline" as const,
    className: "bg-destructive/10 text-destructive border-destructive/30",
    icon: XCircle,
    label: "Negativo",
  },
};

export function StatusBadge({ status, size = "md", showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig["Estoque OK"];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-xs px-2.5 py-1"
      )}
    >
      {showIcon && <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      {config.label}
    </Badge>
  );
}
