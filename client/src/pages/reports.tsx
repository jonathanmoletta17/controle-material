import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Package,
  AlertTriangle,
  Ban,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SetorChart } from "@/components/setor-chart";
import type { Item } from "@shared/schema";
import { SETORES } from "@shared/schema";
import { useState } from "react";

export default function Reports() {
  const [selectedSetor, setSelectedSetor] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const filteredItems = selectedSetor === "all" 
    ? items 
    : items.filter(item => item.setor === selectedSetor);

  const totalItems = filteredItems.length;
  const lowStockItems = filteredItems.filter(
    (item) => item.ativo && item.estoqueAtual <= item.estoqueMinimo
  ).length;
  const inactiveItems = filteredItems.filter((item) => !item.ativo).length;
  const totalValue = filteredItems.reduce(
    (sum, item) => sum + (item.valorReferencia || 0) * item.estoqueAtual,
    0
  );

  const handleExportCSV = () => {
    const headers = [
      "Codigo GCE",
      "Item",
      "Setor",
      "Estoque Atual",
      "Estoque Minimo",
      "Status",
      "Valor Referencia",
    ];

    const rows = filteredItems.map((item) => [
      item.codigoGce,
      item.itemNome,
      item.setor,
      item.estoqueAtual,
      item.estoqueMinimo,
      !item.ativo ? "Desativado" : item.estoqueAtual <= item.estoqueMinimo ? "Baixo Estoque" : "Estoque OK",
      item.valorReferencia || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_materiais_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatorios</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e exporte dados do inventario
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSetor} onValueChange={setSelectedSetor}>
            <SelectTrigger className="w-[180px]" data-testid="select-report-setor">
              <SelectValue placeholder="Filtrar setor" />
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
          <Button onClick={handleExportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{totalItems}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Baixo Estoque</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-chart-4">{lowStockItems}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-md bg-chart-4/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Desativados</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">{inactiveItems}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <Ban className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Ref.</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div className="h-10 w-10 rounded-md bg-chart-2/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SetorChart items={items} isLoading={isLoading} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Relatorios Disponiveis
            </CardTitle>
            <CardDescription>
              Exporte dados em diferentes formatos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border hover-elevate">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-chart-2/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="font-medium">Inventario Completo</p>
                  <p className="text-sm text-muted-foreground">
                    Todos os itens com seus dados
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border hover-elevate">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-chart-4/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <p className="font-medium">Itens com Baixo Estoque</p>
                  <p className="text-sm text-muted-foreground">
                    Itens abaixo do minimo
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const lowStock = items.filter(i => i.ativo && i.estoqueAtual <= i.estoqueMinimo);
                  const headers = ["Codigo", "Item", "Setor", "Atual", "Minimo"];
                  const rows = lowStock.map(i => [i.codigoGce, i.itemNome, i.setor, i.estoqueAtual, i.estoqueMinimo]);
                  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `baixo_estoque_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border hover-elevate">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                  <Ban className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Itens Desativados</p>
                  <p className="text-sm text-muted-foreground">
                    Itens fora de uso
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const inactive = items.filter(i => !i.ativo);
                  const headers = ["Codigo", "Item", "Setor", "Ultimo Estoque"];
                  const rows = inactive.map(i => [i.codigoGce, i.itemNome, i.setor, i.estoqueAtual]);
                  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `desativados_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
