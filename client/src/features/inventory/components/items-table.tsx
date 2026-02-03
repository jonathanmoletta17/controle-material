import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Item } from "@shared/schema";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { getItemAlerts } from "@/features/inventory/utils/alerts";

interface ItemsTableProps {
  items: Item[];
  isLoading?: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

export function ItemsTable({ items, isLoading, onEdit, onDelete }: ItemsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Codigo</TableHead>
              <TableHead>Item</TableHead>

              <TableHead className="w-[100px] text-right">Estoque Manut.</TableHead>
              <TableHead className="w-[100px] text-right">Estoque Patr.</TableHead>
              <TableHead className="w-[100px] text-right">Minimo</TableHead>
              <TableHead className="w-[110px]">Validade ATA</TableHead>
              <TableHead className="w-[110px]">Validade Ref.</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[120px] text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table >
      </div >
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-card">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Nao existem itens cadastrados. Adicione um novo item ou importe uma planilha para comecar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table containerClassName="h-[calc(100vh-220px)] overflow-auto">
        <TableHeader className="sticky top-0 z-20 bg-card shadow-sm">
          <TableRow className="hover:bg-muted/50 data-[state=selected]:bg-muted">
            <TableHead className="w-[100px] font-semibold">Codigo</TableHead>
            <TableHead className="font-semibold">Item</TableHead>

            <TableHead className="w-[110px] text-right font-semibold">Estoque Manut.</TableHead>
            <TableHead className="w-[110px] text-right font-semibold">Estoque Patr.</TableHead>
            <TableHead className="w-[100px] text-right font-semibold">Minimo</TableHead>
            <TableHead className="w-[110px] font-semibold">Validade ATA</TableHead>
            <TableHead className="w-[110px] font-semibold">Validade Ref.</TableHead>
            <TableHead className="w-[160px] font-semibold">Alertas</TableHead>
            <TableHead className="w-[120px] text-right font-semibold">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const alerts = getItemAlerts(item);

            // Default "OK" badge if no alerts
            const hasAlerts = alerts.length > 0;

            return (
              <TableRow
                key={item.id}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                data-testid={`row-item-${item.id}`}
              >
                <TableCell className="font-mono text-sm">
                  {item.codigoGce}
                </TableCell>
                <TableCell className="font-medium">
                  {item.itemNome}
                </TableCell>

                <TableCell className="text-right font-mono tabular-nums">
                  {item.estoqueAtual}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {item.patrimonioAtual}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {item.estoqueMinimo}
                </TableCell>
                <TableCell className="text-sm">
                  {item.validadeAta
                    ? new Date(item.validadeAta).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {item.validadeValorReferencia
                    ? new Date(item.validadeValorReferencia).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {!hasAlerts && (
                      <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/30 w-fit">
                        Estoque OK
                      </Badge>
                    )}
                    {alerts.map((alert, idx) => (
                      <Badge
                        key={idx}
                        variant={alert.color === 'warning' ? 'outline' : (alert.color as any)}
                        className={`text-[10px] h-5 px-1.5 gap-1 w-fit whitespace-nowrap ${alert.color === 'warning' ? 'text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                      >
                        {alert.icon && <alert.icon className="h-3 w-3" />}
                        {alert.label}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      data-testid={`button-view-${item.id}`}
                    >
                      <Link href={`/items/${item.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        data-testid={`button-edit-${item.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item)}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
