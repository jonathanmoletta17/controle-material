import { differenceInDays, addMonths, isBefore } from "date-fns";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/features/inventory/components/status-badge";
import { AlertTriangle, ArrowRight, CalendarClock, AlertOctagon } from "lucide-react";
import type { Item } from "@shared/schema";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge } from "@/shared/components/ui/badge";

import { getItemAlerts } from "@/features/inventory/utils/alerts";

interface AlertsListProps {
  items: Item[];
  isLoading?: boolean;
  maxItems?: number;
}

export function AlertsList({ items, isLoading, maxItems = 10 }: AlertsListProps) {
  const alertItems = items
    .map(item => ({ item, alerts: getItemAlerts(item) }))
    .filter(x => x.alerts.length > 0)
    .slice(0, maxItems);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-chart-4" />
            Alertas de Estoque e Validade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alertItems.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-chart-2" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-chart-2" />
            </div>
            <p className="text-sm font-medium">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sem baixo estoque ou vencimentos proximos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-chart-4" />
          Alertas ({alertItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {alertItems.map(({ item, alerts }) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-muted/50 transition-colors border-b last:border-0"
              data-testid={`alert-item-${item.id}`}
            >
              <div className="flex flex-col min-w-0 flex-1 gap-1">
                <span className="font-medium text-sm truncate">{item.itemNome}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {item.codigoGce}
                </span>

                {/* Alert Badges */}
                <div className="flex flex-wrap gap-2 mt-1">
                  {alerts.map((alert, idx) => (
                    <Badge
                      key={idx}
                      variant={alert.color === 'warning' ? 'outline' : (alert.color as any)}
                      className={`text-[10px] h-5 px-1.5 gap-1 ${alert.color === 'warning' ? 'text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                    >
                      {alert.icon && <alert.icon className="h-3 w-3" />}
                      {alert.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                {/* Stock Status is already shown in alerts if critical, but we can keep the main badge or hide it to avoid clutter. Let's hide it if alerts are shown. */}
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/items/${item.id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
