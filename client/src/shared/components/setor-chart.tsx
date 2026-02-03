import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PieChart } from "lucide-react";
import type { Movimento } from "@shared/schema";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface ConsumptionChartProps {
  movements: (Movimento & { setor?: string | null })[];
  isLoading?: boolean;
}

const setorColors = {
  ELETRICA: "hsl(var(--chart-4))",
  MARCENARIA: "hsl(var(--chart-5))",
  HIDRAULICA: "hsl(var(--chart-1))",
  REFRIGERACAO: "hsl(var(--chart-2))",
  PEDREIROS: "hsl(var(--muted-foreground))",
  PINTORES: "hsl(var(--chart-3))",
  CONSERVACAO: "hsl(var(--destructive))",
};

const setorLabels: Record<string, string> = {
  ELETRICA: "Eletrica",
  MARCENARIA: "Marcenaria",
  HIDRAULICA: "Hidraulica",
  REFRIGERACAO: "Refrigeracao",
  PEDREIROS: "Pedreiros",
  PINTORES: "Pintores",
  CONSERVACAO: "Conservação",
};

export function ConsumptionChart({ movements, isLoading }: ConsumptionChartProps) {
  // Aggregate withdrawals by sector dynamically
  const aggregated = movements
    .filter(m => (m.tipo === "RETIRADA_MANUTENCAO" && m.setor) || m.tipo === "RETIRADA_CONSERVACAO")
    .reduce((acc, m) => {
      const sector = m.tipo === "RETIRADA_CONSERVACAO" ? "CONSERVACAO" : m.setor!;
      acc[sector] = (acc[sector] || 0) + m.quantidade;
      return acc;
    }, {} as Record<string, number>);

  const data = Object.entries(aggregated).map(([sector, volume]) => {
    // Try to find a matching key for color/label lookup by normalizing
    // e.g. "Elétrica" -> "ELETRICA"
    const normalizedKey = sector
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    // Use mapped label if available (for consistent casing), otherwise use DB value
    const label = Object.entries(setorLabels).find(([k]) => k === normalizedKey)?.[1] || sector;

    // Find color
    const colorKey = Object.keys(setorColors).find(k => k === normalizedKey) || "OTHER";
    const color = setorColors[colorKey as keyof typeof setorColors] || "hsl(var(--primary))";

    return {
      setor: label,
      originalKey: sector, // helpful for debugging or keys
      count: 0, // removed count as we are focusing on volume
      volume,
      fill: color
    };
  }).sort((a, b) => b.volume - a.volume); // Sort by highest consumption

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="h-5 w-5 text-primary" />
            Consumo por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChart className="h-5 w-5 text-primary" />
          Consumo por Setor (Volume)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="setor"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value) => [`${value} unidades`, "Volume Retirado"]}
              />
              <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.originalKey}
                    fill={entry.fill}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
