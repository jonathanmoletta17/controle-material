import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { Plus, Search, Filter, X, AlertOctagon, CalendarClock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { ItemsTable } from "@/features/inventory/components/items-table";
import { ItemForm } from "@/features/inventory/components/item-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Item, InsertItem } from "@shared/schema";
import { addMonths, isBefore } from "date-fns";

import { useAuth } from "@/features/auth/auth-context";

export default function ItemsList() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertItem) => {
      return apiRequest("POST", "/api/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Item criado",
        description: "O item foi cadastrado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Nao foi possivel criar o item.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertItem> }) => {
      return apiRequest("PUT", `/api/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setEditingItem(null);
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setDeletingItem(null);
      toast({
        title: "Item excluido",
        description: "O item foi removido do sistema.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Nao foi possivel excluir o item.",
        variant: "destructive",
      });
    },
  });

  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'expired' | 'expiring' | null>(null);

  const { expiredCount, expiringCount } = useMemo(() => {
    const now = new Date();
    const threeMonthsFromNow = addMonths(now, 3);

    let expired = 0;
    let expiring = 0;

    items.forEach(item => {
      const isRefExpired = item.validadeValorReferencia && isBefore(new Date(item.validadeValorReferencia), now);
      const isAtaExpired = item.validadeAta && isBefore(new Date(item.validadeAta), now);

      if (isRefExpired || isAtaExpired) {
        expired++;
        return;
      }

      const isRefExpiring = item.validadeValorReferencia && isBefore(new Date(item.validadeValorReferencia), threeMonthsFromNow);
      const isAtaExpiring = item.validadeAta && isBefore(new Date(item.validadeAta), threeMonthsFromNow);

      if (isRefExpiring || isAtaExpiring) {
        expiring++;
      }
    });

    return { expiredCount: expired, expiringCount: expiring };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.itemNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.codigoGce.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLowStock = showLowStockOnly
        ? item.estoqueAtual <= item.estoqueMinimo && item.ativo
        : true;

      if (activeFilter === 'expired') {
        const now = new Date();
        const isRefExpired = item.validadeValorReferencia && isBefore(new Date(item.validadeValorReferencia), now);
        const isAtaExpired = item.validadeAta && isBefore(new Date(item.validadeAta), now);
        return matchesSearch && matchesLowStock && (isRefExpired || isAtaExpired);
      }

      if (activeFilter === 'expiring') {
        const now = new Date();
        const threeMonthsFromNow = addMonths(now, 3);
        const isRefExpiring = item.validadeValorReferencia &&
          isBefore(new Date(item.validadeValorReferencia), threeMonthsFromNow) &&
          !isBefore(new Date(item.validadeValorReferencia), now);

        const isAtaExpiring = item.validadeAta &&
          isBefore(new Date(item.validadeAta), threeMonthsFromNow) &&
          !isBefore(new Date(item.validadeAta), now);

        return matchesSearch && matchesLowStock && (isRefExpiring || isAtaExpiring);
      }

      return matchesSearch && matchesLowStock;
    });
  }, [items, searchQuery, showLowStockOnly, activeFilter]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Itens de Estoque</h1>
          <p className="text-muted-foreground mt-1">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} encontrado{filteredItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {expiredCount > 0 && (
            <Button
              variant={activeFilter === 'expired' ? "destructive" : "outline"}
              onClick={() => setActiveFilter(activeFilter === 'expired' ? null : 'expired')}
              className={`gap-2 ${activeFilter === 'expired' ? '' : 'text-destructive border-destructive hover:bg-destructive/10'}`}
            >
              <AlertOctagon className="h-4 w-4" />
              {expiredCount} {expiredCount === 1 ? 'Item Vencido' : 'Itens Vencidos'}
            </Button>
          )}

          {expiringCount > 0 && (
            <Button
              variant={activeFilter === 'expiring' ? "secondary" : "outline"}
              onClick={() => setActiveFilter(activeFilter === 'expiring' ? null : 'expiring')}
              className={`gap-2 ${activeFilter === 'expiring' ? 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200' : 'text-yellow-600 border-yellow-600 hover:bg-yellow-50'}`}
            >
              <CalendarClock className="h-4 w-4" />
              {expiringCount} {expiringCount === 1 ? 'A Vencer' : 'A Vencer'}
            </Button>
          )}
          <Button
            variant={showLowStockOnly ? "destructive" : "outline"}
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showLowStockOnly ? "Exibindo Baixo Estoque" : "Filtrar Baixo Estoque"}
          </Button>
          {user?.role === "admin" && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-add-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou codigo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ItemsTable
        items={filteredItems}
        isLoading={isLoading}
        onEdit={user?.role === "admin" ? setEditingItem : undefined}
        onDelete={user?.role === "admin" ? setDeletingItem : undefined}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Item</DialogTitle>
          </DialogHeader>
          <ItemForm
            onSubmit={(data) => createMutation.mutate(data as InsertItem)}
            isPending={createMutation.isPending}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              item={editingItem}
              onSubmit={(data) => updateMutation.mutate({ id: editingItem.id, data })}
              isPending={updateMutation.isPending}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingItem?.itemNome}"? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
