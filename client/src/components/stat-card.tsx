import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger" | "muted";
  testId?: string;
}

const variantStyles = {
  default: "border-l-primary",
  success: "border-l-chart-2",
  warning: "border-l-chart-4",
  danger: "border-l-destructive",
  muted: "border-l-muted-foreground",
};

const iconBgStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-chart-2/10 text-chart-2",
  warning: "bg-chart-4/10 text-chart-4",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  testId,
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        "border-l-4 transition-shadow hover:shadow-md",
        variantStyles[variant]
      )}
      data-testid={testId}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
            <span className="text-3xl font-bold tracking-tight">
              {value}
            </span>
            {description && (
              <span className="text-xs text-muted-foreground mt-1">
                {description}
              </span>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-md",
            iconBgStyles[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
