import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, XCircle, Ban } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { AlertsList } from "@/components/alerts-list";
import { SetorChart } from "@/components/setor-chart";
import type { Item } from "@shared/schema";

export default function Dashboard() {
  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const totalItems = items.length;
  const lowStockItems = items.filter(
    (item) => item.ativo && item.estoqueAtual <= item.estoqueMinimo && item.estoqueAtual >= 0
  ).length;
  const negativeItems = items.filter((item) => item.estoqueAtual < 0).length;
  const inactiveItems = items.filter((item) => !item.ativo).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visao geral do controle de materiais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Itens"
          value={isLoading ? "-" : totalItems}
          icon={Package}
          description="Itens cadastrados no sistema"
          variant="default"
          testId="stat-total-items"
        />
        <StatCard
          title="Baixo Estoque"
          value={isLoading ? "-" : lowStockItems}
          icon={AlertTriangle}
          description="Abaixo do minimo definido"
          variant="warning"
          testId="stat-low-stock"
        />
        <StatCard
          title="Estoque Negativo"
          value={isLoading ? "-" : negativeItems}
          icon={XCircle}
          description="Requer atencao imediata"
          variant="danger"
          testId="stat-negative"
        />
        <StatCard
          title="Desativados"
          value={isLoading ? "-" : inactiveItems}
          icon={Ban}
          description="Itens inativos"
          variant="muted"
          testId="stat-inactive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SetorChart items={items} isLoading={isLoading} />
        <AlertsList items={items} isLoading={isLoading} maxItems={6} />
      </div>
    </div>
  );
}
