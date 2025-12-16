import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PieChart } from "lucide-react";
import type { Item } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface SetorChartProps {
  items: Item[];
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

const setorLabels = {
  ELETRICA: "Eletrica",
  MARCENARIA: "Marcenaria",
  HIDRAULICA: "Hidraulica",
  REFRIGERACAO: "Refrigeracao",
  PEDREIROS: "Pedreiros",
  PINTORES: "Pintores",
};

export function SetorChart({ items, isLoading }: SetorChartProps) {
  const data = Object.entries(setorLabels).map(([key, label]) => ({
    setor: label,
    key,
    count: items.filter(item => item.setor === key).length,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="h-5 w-5 text-primary" />
            Distribuicao por Setor
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
          Distribuicao por Setor
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
                formatter={(value) => [`${value} itens`, "Quantidade"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell 
                    key={entry.key} 
                    fill={setorColors[entry.key as keyof typeof setorColors]} 
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
