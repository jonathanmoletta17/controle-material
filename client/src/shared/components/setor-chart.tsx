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
};

const setorLabels: Record<string, string> = {
  ELETRICA: "Eletrica",
  MARCENARIA: "Marcenaria",
  HIDRAULICA: "Hidraulica",
  REFRIGERACAO: "Refrigeracao",
  PEDREIROS: "Pedreiros",
  PINTORES: "Pintores",
};

export function ConsumptionChart({ movements, isLoading }: ConsumptionChartProps) {
  // Aggregate withdrawals by sector
  const data = Object.keys(setorLabels).map((key) => {
    // Filter movements: Needs to be "RETIRADA_MANUTENCAO" and match sector
    const count = movements.filter(
      (m) =>
        m.tipo === "RETIRADA_MANUTENCAO" &&
        m.setor === key
    ).length;

    return {
      setor: setorLabels[key],
      key,
      count, // Number of withdrawal operations (or quantity? Let's use count for "Activity" or sum quantity for "Volume")
      // User asked "setor consumindo mais", usually quantity is better but count is also good for activity.
      // Let's sum Quantity for volume.
      volume: movements
        .filter((m) => m.tipo === "RETIRADA_MANUTENCAO" && m.setor === key)
        .reduce((sum, m) => sum + m.quantidade, 0)
    };
  });

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
                    key={entry.key}
                    fill={setorColors[entry.key as keyof typeof setorColors] || "hsl(var(--primary))"}
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
