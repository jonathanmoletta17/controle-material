import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Archive,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { StatusBadge } from "@/features/inventory/components/status-badge";
import { SetorBadge } from "@/features/inventory/components/setor-badge";
import { MovementTimeline } from "@/features/inventory/components/movement-timeline";
import { ItemForm } from "@/features/inventory/components/item-form";
import { MovementForm } from "@/features/inventory/components/movement-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Item, Movimento, InsertItem, InsertMovimento, Setor } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function getDisplayStatus(item: Item): "Estoque OK" | "Baixo Estoque" | "Desativado" | "Negativo" {
  if (!item.ativo) return "Desativado";
  if (item.estoqueAtual < 0) return "Negativo";
  if (item.estoqueAtual <= item.estoqueMinimo) return "Baixo Estoque";
  return "Estoque OK";
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);

  const { data: item, isLoading: isLoadingItem } = useQuery<Item>({
    queryKey: ["/api/items", id],
  });

  const { data: movimentos = [], isLoading: isLoadingMovimentos } = useQuery<Movimento[]>({
    queryKey: ["/api/items", id, "movements"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertItem>) => {
      return apiRequest("PUT", `/api/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Item atualizado",
        description: "As alteracoes foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Nao foi possivel atualizar o item.",
        variant: "destructive",
      });
    },
  });

  const movementMutation = useMutation({
    mutationFn: async (data: InsertMovimento) => {
      return apiRequest("POST", `/api/items/${id}/movements`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/items", id, "movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setIsMovementDialogOpen(false);
      toast({
        title: "Movimentacao registrada",
        description: "O estoque foi atualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel registrar a movimentacao.",
        variant: "destructive",
      });
    },
  });

  if (isLoadingItem) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Item nao encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O item solicitado nao existe ou foi removido.
          </p>
          <Button asChild>
            <Link href="/items">Voltar para lista</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/items">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{item.itemNome}</h1>
              <StatusBadge status={getDisplayStatus(item)} />
            </div>
            <p className="text-muted-foreground font-mono mt-1">
              Codigo: {item.codigoGce}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
              data-testid="button-edit-item"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          <Button
            onClick={() => setIsMovementDialogOpen(true)}
            data-testid="button-add-movement"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentacao
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Informacoes do Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="text-sm text-muted-foreground">Estoque Atual</span>
                  <p className="text-2xl font-bold tabular-nums">{item.estoqueAtual}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Estoque Minimo</span>
                  <p className="text-2xl font-bold tabular-nums text-muted-foreground">{item.estoqueMinimo}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Patrimonio Atual</span>
                  <p className="text-2xl font-bold tabular-nums">{item.patrimonioAtual}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Detalhes Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Validade Valor Referência
                    </span>
                    <p className="font-medium mt-1">
                      {item.validadeValorReferencia
                        ? format(new Date(item.validadeValorReferencia), "dd/MM/yyyy", { locale: ptBR })
                        : "Nao definida"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">ATA</span>
                    <p className="font-medium mt-1">{item.ata || "Nao definido"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Archive className="h-4 w-4" />
                      Patrimonio
                    </span>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm">Atual: <span className="font-medium">{item.patrimonioAtual}</span></p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Ultima Atualizacao
                    </span>
                    <p className="font-medium mt-1">
                      {item.dataAtualizacao
                        ? format(new Date(item.dataAtualizacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "Nao registrada"}
                    </p>
                  </div>
                </div>
              </div>
              {item.observacoes && (
                <div className="mt-6 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Observacoes</span>
                  <p className="mt-1 text-sm">{item.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <MovementTimeline
            movimentos={movimentos}
            isLoading={isLoadingMovimentos}
          />
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          <ItemForm
            item={item}
            onSubmit={(data) => updateMutation.mutate(data)}
            isPending={updateMutation.isPending}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Movimentacao</DialogTitle>
          </DialogHeader>
          <MovementForm
            itemId={id!}
            onSubmit={(data) => movementMutation.mutate(data as InsertMovimento)}
            isPending={movementMutation.isPending}
            onCancel={() => setIsMovementDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
