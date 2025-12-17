import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type ImportStep = "upload" | "processing" | "results";

interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  details: Array<{
    row: number;
    setor?: string;
    codigo?: string;
    error?: string;
    status: "success" | "error" | "warning";
  }>;
}

export default function Import() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Falha na importacao");
      }

      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setResult(data);
      setStep("results");
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      if (data.success) {
        toast({
          title: "Importacao concluida",
          description: `${data.imported} itens importados com sucesso.`,
        });
      }
    },
    onError: () => {
      setStep("upload");
      toast({
        title: "Erro na importacao",
        description: "Nao foi possivel processar o arquivo.",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.endsWith(".xlsx")
      ) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Formato invalido",
          description: "Por favor, selecione um arquivo .xlsx",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      setStep("processing");
      importMutation.mutate(selectedFile);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar Planilha</h1>
        <p className="text-muted-foreground mt-1">
          Importe itens de uma planilha Excel (.xlsx)
        </p>
      </div>

      <div className="flex items-center gap-8 mb-8">
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "upload"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </div>
          <span className={step === "upload" ? "font-medium" : "text-muted-foreground"}>
            Upload
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "processing"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
          <span className={step === "processing" ? "font-medium" : "text-muted-foreground"}>
            Processando
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "results"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </div>
          <span className={step === "results" ? "font-medium" : "text-muted-foreground"}>
            Resultado
          </span>
        </div>
      </div>

      {step === "upload" && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Selecionar Arquivo</CardTitle>
            <CardDescription>
              Arraste e solte um arquivo .xlsx ou clique para selecionar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file"
              />
              <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">
                {selectedFile ? selectedFile.name : "Arraste seu arquivo aqui"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique no botao abaixo
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-select-file"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-chart-2" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleImport}
                  data-testid="button-import"
                >
                  Importar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "processing" && (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-6" />
            <h3 className="text-xl font-semibold mb-2">Processando arquivo...</h3>
            <p className="text-muted-foreground mb-6">
              Isso pode levar alguns segundos
            </p>
            <Progress value={66} className="max-w-xs mx-auto" />
          </CardContent>
        </Card>
      )}

      {step === "results" && result && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-chart-2" />
                  Importacao Concluida
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-destructive" />
                  Importacao com Erros
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-chart-2/10 rounded-lg text-center">
                <p className="text-3xl font-bold text-chart-2">{result.imported}</p>
                <p className="text-sm text-muted-foreground">Itens importados</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg text-center">
                <p className="text-3xl font-bold text-destructive">{result.errors}</p>
                <p className="text-sm text-muted-foreground">Erros encontrados</p>
              </div>
            </div>

            {result.details.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Detalhes da importacao</h4>
                <ScrollArea className="h-64 rounded-md border">
                  <div className="p-4 space-y-2">
                    {result.details.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {detail.status === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-chart-2" />
                          )}
                          {detail.status === "error" && (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          {detail.status === "warning" && (
                            <AlertTriangle className="h-4 w-4 text-chart-4" />
                          )}
                          <span className="text-sm">
                            Linha {detail.row}
                            {detail.codigo && ` - ${detail.codigo}`}
                          </span>
                        </div>
                        {detail.error && (
                          <Badge variant="outline" className="text-xs">
                            {detail.error}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                Nova Importacao
              </Button>
              <Button asChild>
                <a href="/items">Ver Itens</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
