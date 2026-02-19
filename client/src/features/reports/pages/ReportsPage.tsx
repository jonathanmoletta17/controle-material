import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Package,
  AlertTriangle,
  Ban,
  BarChart3,
  Calendar as CalendarIcon,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ConsumptionChart } from "@/shared/components/setor-chart";
import { WithdrawalHistoryChart } from "@/shared/components/withdrawal-history-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { Item } from "@shared/schema";
import { format } from "date-fns";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { data: items = [], isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery<any[]>({
    queryKey: ["/api/movements"],
  });

  // Query specific for analysis tab with filters
  const { data: filteredMovements = [], isLoading: isLoadingFiltered } = useQuery<any[]>({
    queryKey: ["/api/movements/search", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        tipo: "RETIRADA_MANUTENCAO,RETIRADA_CONSERVACAO" // Default focus as requested
      });
      const res = await fetch(`/api/movements/search?${params}`);
      if (!res.ok) throw new Error("Failed to search");
      return res.json();
    }
  });

  const isLoading = isLoadingItems || isLoadingMovements;

  // General KPIs (Tab 1 Logic)
  const filteredItems = items;
  const totalItems = filteredItems.length;
  const lowStockItems = filteredItems.filter(
    (item) => item.ativo && item.estoqueAtual <= item.estoqueMinimo
  ).length;
  const inactiveItems = filteredItems.filter((item) => !item.ativo).length;

  // Aggregation Logic (Tab 2 Logic)
  const aggregatedData = useMemo(() => {
    const byItem: Record<string, number> = {};
    const bySector: Record<string, number> = {};
    const byResponsible: Record<string, number> = {};

    filteredMovements.forEach(m => {
      const qty = Math.abs(m.quantidade);
      // By Item
      const itemName = m.itemNome || "Desconhecido";
      byItem[itemName] = (byItem[itemName] || 0) + qty;

      // By Sector (using nullish coalescing for safety)
      const sector = m.setor || "N/A";
      bySector[sector] = (bySector[sector] || 0) + qty;

      // By Responsible
      const responsible = m.responsavel || "N/A";
      byResponsible[responsible] = (byResponsible[responsible] || 0) + qty;
    });

    return {
      byItem: Object.entries(byItem).sort((a, b) => b[1] - a[1]),
      bySector: Object.entries(bySector).sort((a, b) => b[1] - a[1]),
      byResponsible: Object.entries(byResponsible).sort((a, b) => b[1] - a[1]),
    };
  }, [filteredMovements]);

  // Helper helper to avoid crashes
  const formatDateSafe = (value: any) => {
    if (!value) return "-";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd/MM/yyyy HH:mm");
  };

  const handleExportFiltered = () => {
    const headers = ["Data", "Item", "Qtd", "Setor", "Responsavel", "N. Chamado"];
    const rows = filteredMovements.map(m => {
      const dateStr = formatDateSafe(m.dataReal || m.dataMovimento);
      return [
        dateStr,
        m.itemNome,
        m.quantidade,
        m.setor || "-",
        m.responsavel || "-",
        m.numeroChamado || "-"
      ];
    });

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_retiradas_${dateRange.start}_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Gestão</h1>
          <p className="text-muted-foreground mt-1">
            Análise de inventário e consumo
          </p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="geral">Visão Geral (Cards)</TabsTrigger>
          <TabsTrigger value="analise">Análise de Retiradas (Detalhado)</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Itens</p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Baixo Estoque</p>
                    <p className="text-2xl font-bold text-destructive">{lowStockItems}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Desativados</p>
                    <p className="text-2xl font-bold text-muted-foreground">{inactiveItems}</p>
                  </div>
                  <Ban className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WithdrawalHistoryChart movements={movements} isLoading={isLoading} />
            <ConsumptionChart movements={movements} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="analise" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Análise</CardTitle>
              <CardDescription>Defina o período para análise de retiradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
                <Button onClick={handleExportFiltered} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Dados Filtrados
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Top Itens (Qtd)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregatedData.byItem.map(([name, qty]) => (
                      <TableRow key={name}>
                        <TableCell className="font-medium text-xs">{name}</TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Por Setor (Qtd)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregatedData.bySector.map(([name, qty]) => (
                      <TableRow key={name}>
                        <TableCell className="font-medium text-xs">{name}</TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Por Responsável (Qtd)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregatedData.byResponsible.map(([name, qty]) => (
                      <TableRow key={name}>
                        <TableCell className="font-medium text-xs">{name}</TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Resp.</TableHead>
                    <TableHead>Chamado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingFiltered ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell>
                    </TableRow>
                  ) : filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">Nenhum registro encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell title={`Registrado em: ${formatDateSafe(m.dataMovimento)}`}>
                          {formatDateSafe(m.dataReal || m.dataMovimento)}
                        </TableCell>
                        <TableCell>{m.itemNome}</TableCell>
                        <TableCell className="font-bold text-red-600">-{Math.abs(m.quantidade)}</TableCell>
                        <TableCell>{m.setor}</TableCell>
                        <TableCell>{m.responsavel}</TableCell>
                        <TableCell>{m.numeroChamado}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
