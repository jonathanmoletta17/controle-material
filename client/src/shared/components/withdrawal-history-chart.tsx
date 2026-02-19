import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";
import { Calendar, BarChart3, Filter } from "lucide-react";
import type { Movimento } from "@shared/schema";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { startOfDay, startOfWeek, startOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WithdrawalHistoryChartProps {
    movements: Movimento[];
    isLoading?: boolean;
}

type Granularity = "day" | "week" | "month";

export function WithdrawalHistoryChart({ movements, isLoading }: WithdrawalHistoryChartProps) {
    const [granularity, setGranularity] = useState<Granularity>("day");

    const data = useMemo(() => {
        const grouped = new Map<string, number>();

        // Filter only withdrawals
        const withdrawals = movements.filter(m => m.tipo === "RETIRADA_MANUTENCAO" || m.tipo === "RETIRADA_CONSERVACAO");

        withdrawals.forEach(m => {
            const rawDate = m.dataReal || m.dataMovimento;
            if (!rawDate) return;

            const date = new Date(rawDate);
            let key = "";
            let sortKey = 0; // Timestamp for sorting

            if (granularity === "day") {
                const d = startOfDay(date);
                key = format(d, "dd/MM", { locale: ptBR });
                sortKey = d.getTime();
            } else if (granularity === "week") {
                const d = startOfWeek(date, { locale: ptBR });
                key = `Sem • ${format(d, "dd/MM")}`;
                sortKey = d.getTime();
            } else if (granularity === "month") {
                const d = startOfMonth(date);
                key = format(d, "MMM/yy", { locale: ptBR });
                sortKey = d.getTime();
            }

            grouped.set(key, (grouped.get(key) || 0) + Math.abs(m.quantidade));
        });

        // Sort by chronological order (we can't just sort by key if it's formatted string, we need to preserve order)
        // Actually, grouping by string key loses order. 
        // Better approach: Group by timestamp first, then format.

        const timeGrouped = new Map<number, number>();

        withdrawals.forEach(m => {
            const rawDate = m.dataReal || m.dataMovimento;
            if (!rawDate) return;
            const date = new Date(rawDate);
            let timeKey = 0;

            if (granularity === "day") {
                timeKey = startOfDay(date).getTime();
            } else if (granularity === "week") {
                timeKey = startOfWeek(date, { locale: ptBR }).getTime();
            } else if (granularity === "month") {
                timeKey = startOfMonth(date).getTime();
            }

            timeGrouped.set(timeKey, (timeGrouped.get(timeKey) || 0) + Math.abs(m.quantidade));
        });

        const sortedEntries = Array.from(timeGrouped.entries()).sort((a, b) => a[0] - b[0]);

        // Take last N entries to avoid overcrowding chart? 
        // Or just show all (user might need scroll if too big, or range filter).
        // For now, let's limit to last 30 data points if "day", last 12 if "month", etc.
        // Or just show all. Recharts handles it okay-ish.

        // Default slice to reasonable amount
        // let sliced = sortedEntries;
        // if (granularity === "day") sliced = sortedEntries.slice(-14); // Last 2 weeks
        // if (granularity === "week") sliced = sortedEntries.slice(-12); // Last 12 weeks
        // if (granularity === "month") sliced = sortedEntries.slice(-12); // Last year

        // Only slice if there are too many
        const sliced = sortedEntries.slice(-30);

        return sliced.map(([timestamp, total]) => {
            let label = "";
            if (granularity === "day") label = format(timestamp, "dd/MM");
            if (granularity === "week") label = format(timestamp, "dd/MM");
            if (granularity === "month") label = format(timestamp, "MMM yy", { locale: ptBR });

            return {
                date: label,
                total,
                fullDate: format(timestamp, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            };
        });

    }, [movements, granularity]);

    const granularityLabels = {
        day: "Diário",
        week: "Semanal",
        month: "Mensal",
    };

    if (isLoading) {
        return (
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Histórico de Retiradas</CardTitle>
                    <CardDescription>Carregando dados...</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Volume de Retiradas
                    </CardTitle>
                    <CardDescription>Histórico temporal de consumo</CardDescription>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            <Filter className="mr-2 h-3 w-3" />
                            {granularityLabels[granularity]}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setGranularity("day")}>
                            Diário
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGranularity("week")}>
                            Semanal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGranularity("month")}>
                            Mensal
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--muted)' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        {payload[0].payload.fullDate}
                                                    </span>
                                                    <div className="font-bold text-base mt-1">
                                                        {payload[0].value} itens
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="total"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                            <Calendar className="h-8 w-8 mb-2 opacity-50" />
                            Sem dados no período
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
