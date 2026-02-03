import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, RotateCcw, Settings2, Building, ShoppingCart } from "lucide-react";
import type { TipoMovimento } from "@shared/schema";

interface MovementBadgeProps {
  tipo: TipoMovimento;
  size?: "sm" | "md";
}

const tipoConfig: Record<TipoMovimento, { className: string; icon: any; label: string }> = {
  RETIRADA_MANUTENCAO: {
    className: "bg-destructive/10 text-destructive border-destructive/30",
    icon: ArrowDown,
    label: "Saida",
  },
  RETIRADA_CONSERVACAO: {
    className: "bg-destructive/10 text-destructive border-destructive/30",
    icon: ArrowDown,
    label: "Conservação",
  },
  RETORNO_MANUTENCAO: {
    className: "bg-chart-1/10 text-chart-1 border-chart-1/30",
    icon: RotateCcw,
    label: "Retorno",
  },
  ENTRADA_PATRIMONIO: {
    className: "bg-muted text-muted-foreground border-muted-foreground/30",
    icon: Building,
    label: "Patrimonio",
  },
  PEDIDO_PATRIMONIO: {
    className: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    icon: ShoppingCart,
    label: "Pedido",
  },
  ADIANTAMENTO_MANUTENCAO: {
    className: "bg-chart-2/10 text-chart-2 border-chart-2/30",
    icon: ArrowUp,
    label: "Adiantamento",
  },
};

export function MovementBadge({ tipo, size = "md" }: MovementBadgeProps) {
  const config = tipoConfig[tipo] || tipoConfig.ADIANTAMENTO_MANUTENCAO; // Fallback safe
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-xs px-2.5 py-1"
      )}
    >
      <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {config.label}
    </Badge>
  );
}
