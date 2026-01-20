import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, Archive, Activity, Layers } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { AlertsList } from "@/features/dashboard/components/alerts-list";
import { ConsumptionChart } from "@/shared/components/setor-chart";
import type { Item } from "@shared/schema";

export default function Dashboard() {
  const { data: items = [], isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // Fetch recent movements for analytics
  const { data: movements = [], isLoading: isLoadingMovements } = useQuery<any[]>({
    queryKey: ["/api/movements"], // Fetches default limit or all
  });

  const isLoading = isLoadingItems || isLoadingMovements;

  const lowStockItems = items.filter(
    (item) => item.ativo && item.estoqueAtual <= item.estoqueMinimo
  ).length;

  const totalManutencao = items.reduce((sum, item) => sum + (item.estoqueAtual || 0), 0);
  const totalPatrimonio = items.reduce((sum, item) => sum + (item.patrimonioAtual || 0), 0);

  // Consumo Mensal (Current Month Withdrawals)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const consumoMensal = movements
    .filter((m: any) => {
      if (m.tipo !== "RETIRADA_MANUTENCAO") return false;
      const date = new Date(m.dataMovimento);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum: number, m: any) => sum + Math.abs(m.quantidade), 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visao geral e indicadores de consumo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Volume Manutenção"
          value={isLoading ? "-" : totalManutencao}
          icon={Layers}
          description="Unidades (Estoque)"
          variant="default"
          testId="stat-total-manutencao"
        />
        <StatCard
          title="Volume Patrimônio"
          value={isLoading ? "-" : totalPatrimonio}
          icon={Archive}
          description="Unidades (Reserva)"
          variant="muted"
          testId="stat-total-patrimonio"
        />
        <StatCard
          title="Consumo Mensal"
          value={isLoading ? "-" : consumoMensal}
          icon={Activity}
          description="Retiradas este mês"
          variant="default"
          testId="stat-consumo-mensal"
        />
        <StatCard
          title="Baixo Estoque"
          value={isLoading ? "-" : lowStockItems}
          icon={AlertTriangle}
          description="Itens para reposição"
          variant="danger"
          testId="stat-low-stock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConsumptionChart movements={movements} isLoading={isLoading} />
        <AlertsList items={items} isLoading={isLoading} maxItems={6} />
      </div>
    </div>
  );
}
