import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap, Hammer, Droplets, Thermometer, HardHat, PaintBucket } from "lucide-react";
import type { Setor } from "@shared/schema";

interface SetorBadgeProps {
  setor: Setor;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const setorConfig = {
  ELETRICA: {
    className: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    icon: Zap,
    label: "Eletrica",
  },
  MARCENARIA: {
    className: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    icon: Hammer,
    label: "Marcenaria",
  },
  HIDRAULICA: {
    className: "bg-chart-1/10 text-chart-1 border-chart-1/30",
    icon: Droplets,
    label: "Hidraulica",
  },
  REFRIGERACAO: {
    className: "bg-chart-2/10 text-chart-2 border-chart-2/30",
    icon: Thermometer,
    label: "Refrigeracao",
  },
  PEDREIROS: {
    className: "bg-muted text-muted-foreground border-muted-foreground/30",
    icon: HardHat,
    label: "Pedreiros",
  },
  PINTORES: {
    className: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    icon: PaintBucket,
    label: "Pintores",
  },
};

export function SetorBadge({ setor, size = "md", showIcon = true }: SetorBadgeProps) {
  const config = setorConfig[setor];
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
      {showIcon && <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      {config.label}
    </Badge>
  );
}
