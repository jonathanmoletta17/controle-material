import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, RotateCcw, Settings2, Building, ShoppingCart } from "lucide-react";
import type { TipoMovimento } from "@shared/schema";

interface MovementBadgeProps {
  tipo: TipoMovimento;
  size?: "sm" | "md";
}

const tipoConfig = {
  entrada: {
    className: "bg-chart-2/10 text-chart-2 border-chart-2/30",
    icon: ArrowUp,
    label: "Entrada",
  },
  saida: {
    className: "bg-destructive/10 text-destructive border-destructive/30",
    icon: ArrowDown,
    label: "Saida",
  },
  retorno: {
    className: "bg-chart-1/10 text-chart-1 border-chart-1/30",
    icon: RotateCcw,
    label: "Retorno",
  },
  ajuste: {
    className: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    icon: Settings2,
    label: "Ajuste",
  },
  patrimonio: {
    className: "bg-muted text-muted-foreground border-muted-foreground/30",
    icon: Building,
    label: "Patrimonio",
  },
  compra: {
    className: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    icon: ShoppingCart,
    label: "Compra",
  },
};

export function MovementBadge({ tipo, size = "md" }: MovementBadgeProps) {
  const config = tipoConfig[tipo];
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
