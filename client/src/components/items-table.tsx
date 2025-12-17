import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { SetorBadge } from "./setor-badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Item, Setor } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemsTableProps {
  items: Item[];
  isLoading?: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

function getDisplayStatus(item: Item): "Estoque OK" | "Baixo Estoque" | "Desativado" | "Negativo" {
  if (!item.ativo) return "Desativado";
  if (item.estoqueAtual < 0) return "Negativo";
  if (item.estoqueAtual <= item.estoqueMinimo) return "Baixo Estoque";
  return "Estoque OK";
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
              <TableHead className="w-[120px]">Setor</TableHead>
              <TableHead className="w-[100px] text-right">Estoque</TableHead>
              <TableHead className="w-[100px] text-right">Minimo</TableHead>
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
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px] font-semibold">Codigo</TableHead>
            <TableHead className="font-semibold">Item</TableHead>
            <TableHead className="w-[120px] font-semibold">Setor</TableHead>
            <TableHead className="w-[100px] text-right font-semibold">Estoque</TableHead>
            <TableHead className="w-[100px] text-right font-semibold">Minimo</TableHead>
            <TableHead className="w-[140px] font-semibold">Status</TableHead>
            <TableHead className="w-[120px] text-right font-semibold">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
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
              <TableCell>
                <SetorBadge setor={item.setor as Setor} size="sm" showIcon={false} />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {item.estoqueAtual}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {item.estoqueMinimo}
              </TableCell>
              <TableCell>
                <StatusBadge status={getDisplayStatus(item)} size="sm" />
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
