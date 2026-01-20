import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Printer, Tag, X, Plus, Trash2, ListPlus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import type { Item } from "@shared/schema";

const COLORS = [
    { name: "Marrom", value: "#795548", text: "white" },
    { name: "Laranja Escuro", value: "#F57C00", text: "white" },
    { name: "Azul", value: "#2196F3", text: "white" },
    { name: "Verde", value: "#4CAF50", text: "white" },
    { name: "Amarelo", value: "#FFEB3B", text: "black" },
    { name: "Vermelho", value: "#F44336", text: "white" },
];

const SIZES = [
    { name: "11cm x 2,5cm", width: "11cm", height: "2.5cm" },
    { name: "7cm x 2cm", width: "7cm", height: "2cm" },
];

interface QueueItem {
    id: string;
    item: Item;
    size: typeof SIZES[0];
    color: typeof COLORS[0];
    quantity: number;
}

export default function LabelPrintingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [selectedSize, setSelectedSize] = useState(SIZES[0]);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [quantity, setQuantity] = useState(1);
    const [queue, setQueue] = useState<QueueItem[]>([]);

    const { data: items = [], isLoading } = useQuery<Item[]>({
        queryKey: ["/api/items"],
    });

    const filteredItems = useMemo(() => {
        if (!searchQuery) return [];
        return items.filter(
            (item) =>
                item.itemNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.codigoGce.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
    }, [items, searchQuery]);

    const addToQueue = () => {
        if (!selectedItem) return;
        const newItem: QueueItem = {
            id: Math.random().toString(36).substr(2, 9),
            item: selectedItem,
            size: selectedSize,
            color: selectedColor,
            quantity: quantity,
        };
        setQueue([...queue, newItem]);

        // Reset configuration
        setSelectedItem(null);
        setSelectedSize(SIZES[0]);
        setSelectedColor(COLORS[0]);
        setQuantity(1);
        setSearchQuery("");
    };

    const removeFromQueue = (id: string) => {
        setQueue(queue.filter((item) => item.id !== id));
    };

    const handlePrint = () => {
        window.print();
    };

    const totalLabels = queue.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Emissão de Etiquetas</h1>
                    <p className="text-muted-foreground mt-1">
                        Adicione itens à fila para imprimir múltiplas etiquetas de uma só vez.
                    </p>
                </div>
                {queue.length > 0 && (
                    <Button size="lg" onClick={handlePrint} className="shadow-xl">
                        <Printer className="h-5 w-5 mr-2" />
                        Imprimir {totalLabels} Etiquetas
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-sidebar-border/40 shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="text-xl">Configurar Etiqueta</CardTitle>
                            <CardDescription>Selecione item, cor e tamanho.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Buscar Item</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Nome ou código GCE..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-11"
                                    />
                                    {searchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                            onClick={() => setSearchQuery("")}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {filteredItems.length > 0 && !selectedItem && (
                                    <div className="border rounded-md mt-1 divide-y bg-popover shadow-lg animate-in fade-in zoom-in duration-200 z-10 relative">
                                        {filteredItems.map((item) => (
                                            <button
                                                key={item.id}
                                                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors text-sm"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <div className="font-semibold">{item.itemNome}</div>
                                                <div className="text-xs text-muted-foreground">{item.codigoGce}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedItem && (
                                <div className="p-4 border rounded-lg bg-primary/5 border-primary/20 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm truncate">{selectedItem.itemNome}</div>
                                        <div className="text-xs text-primary font-mono">{selectedItem.codigoGce}</div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)} className="ml-4 shrink-0">
                                        Alterar
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Tamanho</Label>
                                    <Select
                                        value={selectedSize.name}
                                        onValueChange={(val) => setSelectedSize(SIZES.find((s) => s.name === val)!)}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SIZES.map((size) => (
                                                <SelectItem key={size.name} value={size.name}>
                                                    {size.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Quantidade</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Cor de Fundo</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color.name}
                                            className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center relative group ${selectedColor.name === color.name ? "border-primary ring-4 ring-primary/10 scale-105" : "border-transparent hover:scale-105"
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                            onClick={() => setSelectedColor(color)}
                                            title={color.name}
                                        >
                                            {selectedColor.name === color.name && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-3 h-3 rounded-full bg-white shadow-md border border-black/10" />
                                                </div>
                                            )}
                                            <span className="sr-only">{color.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-base font-bold"
                                variant="secondary"
                                disabled={!selectedItem}
                                onClick={addToQueue}
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Adicionar à Fila
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Queue and Preview Panel */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-sidebar-border/40 shadow-sm h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center justify-between">
                                <span>Fila de Impressão</span>
                                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    {totalLabels} etiquetas
                                </span>
                            </CardTitle>
                            <CardDescription>Revise os itens antes de imprimir.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col min-h-[400px]">
                            {queue.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4 bg-muted/10">
                                    <ListPlus className="h-12 w-12 opacity-20 mb-4" />
                                    <p className="font-medium">A fila está vazia</p>
                                    <p className="text-sm opacity-60">Configure e adicione itens para imprimir.</p>
                                </div>
                            ) : (
                                <ScrollArea className="flex-1 pr-4 -mr-4">
                                    <div className="space-y-3">
                                        {queue.map((qItem) => (
                                            <div
                                                key={qItem.id}
                                                className="flex items-center gap-4 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors group"
                                            >
                                                {/* Mini Preview */}
                                                <div
                                                    className="shrink-0 rounded shadow-sm flex items-center justify-center text-[6px] font-bold text-center overflow-hidden select-none"
                                                    style={{
                                                        width: "60px",
                                                        height: "20px",
                                                        backgroundColor: qItem.color.value,
                                                        color: qItem.color.text,
                                                    }}
                                                >
                                                    {qItem.item.codigoGce}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{qItem.item.itemNome}</div>
                                                    <div className="text-xs text-muted-foreground flex gap-2">
                                                        <span>{qItem.size.name}</span>
                                                        <span>•</span>
                                                        <span>{qItem.color.name}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-bold bg-muted px-2 py-1 rounded">
                                                        {qItem.quantity}x
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => removeFromQueue(qItem.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 10mm;
            top: 10mm;
            margin: 0;
            padding: 0;
            display: flex !important;
            flex-direction: column !important;
            gap: 2mm; /* Espaçamento entre etiquetas */
            border: none !important;
          }
        }
      `}} />

            {/* Hidden Print Area */}
            <div id="print-area" className="hidden">
                {queue.map((qItem) => (
                    Array.from({ length: qItem.quantity }).map((_, i) => (
                        <div
                            key={`${qItem.id}-${i}`}
                            style={{
                                width: qItem.size.width,
                                height: qItem.size.height,
                                backgroundColor: qItem.color.value,
                                color: qItem.color.text,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                padding: "2px",
                                boxSizing: "border-box",
                                fontFamily: "sans-serif",
                                fontSize: qItem.size.name.startsWith("11") ? "10pt" : "8pt",
                                lineHeight: "1.1",
                                WebkitPrintColorAdjust: "exact",
                                printColorAdjust: "exact",
                                pageBreakInside: "avoid"
                            }}
                        >
                            <div style={{ fontWeight: "bold", textTransform: "uppercase", width: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                {qItem.item.itemNome}
                            </div>
                            <div style={{ marginTop: "2px", fontFamily: "monospace", letterSpacing: "-0.5px" }}>
                                {qItem.item.codigoGce}
                            </div>
                        </div>
                    ))
                ))}
            </div>
        </div>
    );
}
