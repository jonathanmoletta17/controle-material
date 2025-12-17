import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { Plus, Search, Filter, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import type { Item, InsertItem, Setor } from "@shared/schema";
import { SETORES } from "@shared/schema";

export default function ItemsList() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const setorParam = params.get("setor") as Setor | null;

  const [searchQuery, setSearchQuery] = useState("");
  const [setorFilter, setSetorFilter] = useState<Setor | "all">(setorParam || "all");

  // Sync state with URL param
  useEffect(() => {
    setSetorFilter(setorParam || "all");
  }, [setorParam]);

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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSetor = setorFilter === "all" || item.setor === setorFilter;
      const matchesSearch =
        searchQuery === "" ||
        item.itemNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.codigoGce.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSetor && matchesSearch;
    });
  }, [items, setorFilter, searchQuery]);

  const pageTitle = setorFilter !== "all" 
    ? `Itens - ${setorFilter.charAt(0) + setorFilter.slice(1).toLowerCase()}` 
    : "Todos os Itens";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} encontrado{filteredItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-add-item"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
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

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={setorFilter}
            onValueChange={(value) => setSetorFilter(value as Setor | "all")}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-filter-setor">
              <SelectValue placeholder="Filtrar por setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {SETORES.map((setor) => (
                <SelectItem key={setor} value={setor}>
                  {setor.charAt(0) + setor.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ItemsTable
        items={filteredItems}
        isLoading={isLoading}
        onEdit={setEditingItem}
        onDelete={setDeletingItem}
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
