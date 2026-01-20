import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { TIPOS_MOVIMENTO, SETORES, insertMovimentoSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";

const formSchema = insertMovimentoSchema.extend({
  quantidade: z.coerce.number().refine((val) => val !== 0, "Quantidade nao pode ser zero"),
  valorUnitarioRef: z.coerce.number().min(0).nullable(),
  validadeValorReferencia: z.coerce.date().nullable().optional(),
  validadeAta: z.coerce.date().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const tipoLabels = {
  RETIRADA_MANUTENCAO: "Retirada (Manutenção)",
  RETORNO_MANUTENCAO: "Retorno (Manutenção)",
  ENTRADA_PATRIMONIO: "Entrada (Patrimônio)",
  PEDIDO_PATRIMONIO: "Pedido (Patrimônio -> Manutenção)",
  ADIANTAMENTO_MANUTENCAO: "Adiantamento (Manutenção)",
};

interface MovementFormProps {
  itemId: string;
  onSubmit: (data: FormValues) => void;
  isPending?: boolean;
  onCancel?: () => void;
}

export function MovementForm({ itemId, onSubmit, isPending, onCancel }: MovementFormProps) {
  const { user } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId,
      tipo: "RETIRADA_MANUTENCAO",
      quantidade: 0,
      responsavel: "",
      numeroChamado: "",
      setor: undefined,
      ata: "",
      numeroPedido: "",
      valorUnitarioRef: null,
      validadeValorReferencia: null,
      validadeAta: null,
      observacoes: "",
    },
  });

  const availableTipos = user?.role === "manutencao"
    ? TIPOS_MOVIMENTO.filter(t => t === "RETIRADA_MANUTENCAO" || t === "RETORNO_MANUTENCAO")
    : user?.role === "patrimonio"
      ? TIPOS_MOVIMENTO.filter(t => t === "ENTRADA_PATRIMONIO")
      : TIPOS_MOVIMENTO;

  const handleSubmit = (data: FormValues) => {
    // Validacoes adicionais especificas
    if (
      (data.tipo === "RETIRADA_MANUTENCAO" || data.tipo === "RETORNO_MANUTENCAO")
    ) {
      let hasError = false;
      if (!data.numeroChamado) {
        form.setError("numeroChamado", { message: "Numero do chamado e obrigatorio" });
        hasError = true;
      }
      if (!data.responsavel) {
        form.setError("responsavel", { message: "Responsavel e obrigatorio" });
        hasError = true;
      }
      if (!data.setor) {
        form.setError("setor", { message: "Setor e obrigatorio para esta operacao" });
        hasError = true;
      }
      if (hasError) return;
    }
    onSubmit(data);
  };

  const tipoValue = form.watch("tipo");
  const requiresChamado = tipoValue === "RETIRADA_MANUTENCAO" || tipoValue === "RETORNO_MANUTENCAO";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Movimentacao *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-tipo-movimento">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTipos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipoLabels[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Quantidade *
                  <span className="text-xs text-muted-foreground ml-2">(Sempre positivo)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    data-testid="input-quantidade"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {requiresChamado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="numeroChamado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero do Chamado *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 123456"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-numero-chamado"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-setor">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SETORES.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor.charAt(0) + setor.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="responsavel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsavel {requiresChamado ? "*" : ""}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome do responsavel"
                  {...field}
                  value={field.value ?? ""}
                  data-testid="input-responsavel"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoValue === "ENTRADA_PATRIMONIO" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ATA</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Numero da ATA"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-movimento-ata"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validadeAta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade da ATA</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                      data-testid="input-movimento-validade-ata"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validadeValorReferencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade Valor Referência</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                      data-testid="input-movimento-data-ref"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observacoes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionais sobre a movimentacao"
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                  data-testid="textarea-movimento-observacoes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              data-testid="button-movimento-cancel"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            data-testid="button-movimento-submit"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Movimentacao
          </Button>
        </div>
      </form>
    </Form>
  );
}
