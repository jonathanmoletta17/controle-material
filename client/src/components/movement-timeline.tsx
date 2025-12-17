import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MovementBadge } from "./movement-badge";
import { History, ArrowUp, ArrowDown, RotateCcw, Settings2, Building, ShoppingCart } from "lucide-react";
import type { Movimento, TipoMovimento } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MovementTimelineProps {
  movimentos: Movimento[];
  isLoading?: boolean;
}

const tipoIcons = {
  entrada: ArrowUp,
  saida: ArrowDown,
  retorno: RotateCcw,
  ajuste: Settings2,
  patrimonio: Building,
  compra: ShoppingCart,
};

const tipoColors = {
  entrada: "bg-chart-2 text-white",
  saida: "bg-destructive text-white",
  retorno: "bg-chart-1 text-white",
  ajuste: "bg-chart-4 text-white",
  patrimonio: "bg-muted-foreground text-white",
  compra: "bg-chart-5 text-white",
};

export function MovementTimeline({ movimentos, isLoading }: MovementTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Historico de Movimentacoes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (movimentos.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Historico de Movimentacoes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Nenhuma movimentacao</p>
            <p className="text-xs text-muted-foreground mt-1">
              Este item ainda nao possui movimentacoes registradas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedMovimentos = [...movimentos].sort(
    (a, b) => new Date(b.dataMovimento).getTime() - new Date(a.dataMovimento).getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Historico de Movimentacoes
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {movimentos.length} registro{movimentos.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
          <div className="space-y-4">
            {sortedMovimentos.map((movimento) => {
              const tipo = movimento.tipo as TipoMovimento;
              const Icon = tipoIcons[tipo];
              const colorClass = tipoColors[tipo];

              return (
                <div
                  key={movimento.id}
                  className="relative flex gap-4 pl-0"
                  data-testid={`movimento-${movimento.id}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <MovementBadge tipo={tipo} size="sm" />
                        <span className="font-semibold text-sm">
                          {movimento.quantidade > 0 ? "+" : ""}{movimento.quantidade} unidades
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(movimento.dataMovimento), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                      {movimento.responsavel && (
                        <p>Responsavel: {movimento.responsavel}</p>
                      )}
                      {movimento.origem && (
                        <p>Origem: {movimento.origem}</p>
                      )}
                      {movimento.destino && (
                        <p>Destino: {movimento.destino}</p>
                      )}
                      {movimento.observacoes && (
                        <p className="italic">{movimento.observacoes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
