import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { Item } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface AlertsListProps {
  items: Item[];
  isLoading?: boolean;
  maxItems?: number;
}

function getDisplayStatus(item: Item): "Estoque OK" | "Baixo Estoque" | "Desativado" | "Negativo" {
  if (!item.ativo) return "Desativado";
  if (item.estoqueAtual < 0) return "Negativo";
  if (item.estoqueAtual <= item.estoqueMinimo) return "Baixo Estoque";
  return "Estoque OK";
}

export function AlertsList({ items, isLoading, maxItems = 5 }: AlertsListProps) {
  const alertItems = items
    .filter(item => !item.ativo || item.estoqueAtual < 0 || item.estoqueAtual <= item.estoqueMinimo)
    .slice(0, maxItems);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-chart-4" />
            Alertas de Estoque
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
            Alertas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-chart-2" />
            </div>
            <p className="text-sm font-medium">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nao ha itens com estoque baixo ou problemas
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
          Alertas de Estoque
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {alertItems.length} alerta{alertItems.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {alertItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 px-2 rounded-md hover-elevate"
              data-testid={`alert-item-${item.id}`}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium text-sm truncate">{item.itemNome}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {item.codigoGce} - Estoque: {item.estoqueAtual}/{item.estoqueMinimo}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <StatusBadge status={getDisplayStatus(item)} size="sm" showIcon={false} />
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
