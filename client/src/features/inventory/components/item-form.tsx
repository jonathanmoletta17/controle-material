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
  FormDescription,
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
import { Switch } from "@/shared/components/ui/switch";
import { SETORES, insertItemSchema, type Item } from "@shared/schema";
import { Loader2 } from "lucide-react";

const formSchema = insertItemSchema.extend({
  estoqueMinimo: z.coerce.number().min(0, "Deve ser maior ou igual a 0"),
  estoqueAtual: z.coerce.number(),
  entradaInicial: z.coerce.number().min(0),
  patrimonioInicial: z.coerce.number().min(0),
  patrimonioAtual: z.coerce.number().min(0),
  pedidoPatrimonio: z.coerce.number().min(0),
  valorReferencia: z.coerce.number().min(0).nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ItemFormProps {
  item?: Item;
  onSubmit: (data: FormValues) => void;
  isPending?: boolean;
  onCancel?: () => void;
}

export function ItemForm({ item, onSubmit, isPending, onCancel }: ItemFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      setor: item?.setor || "ELETRICA",
      codigoGce: item?.codigoGce || "",
      itemNome: item?.itemNome || "",
      estoqueMinimo: item?.estoqueMinimo || 0,
      estoqueAtual: item?.estoqueAtual || 0,
      entradaInicial: item?.entradaInicial || 0,
      patrimonioInicial: item?.patrimonioInicial || 0,
      patrimonioAtual: item?.patrimonioAtual || 0,
      pedidoPatrimonio: item?.pedidoPatrimonio || 0,
      valorReferencia: item?.valorReferencia || null,
      ata: item?.ata || "",
      compra: item?.compra || "",
      numeroPedido: item?.numeroPedido || "",
      observacoes: item?.observacoes || "",
      ativo: item?.ativo ?? true,
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="codigoGce"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codigo GCE *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: 1.2.3.4" 
                    {...field} 
                    data-testid="input-codigo-gce"
                  />
                </FormControl>
                <FormDescription>Codigo unico do item no GCE</FormDescription>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <FormField
          control={form.control}
          name="itemNome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Item *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome completo do item" 
                  {...field} 
                  data-testid="input-item-nome"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="estoqueAtual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Atual</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    data-testid="input-estoque-atual"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estoqueMinimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Minimo</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    data-testid="input-estoque-minimo"
                  />
                </FormControl>
                <FormDescription>Alerta quando atingir</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entradaInicial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entrada Inicial</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    data-testid="input-entrada-inicial"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="patrimonioInicial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patrimonio Inicial</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    data-testid="input-patrimonio-inicial"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="patrimonioAtual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patrimonio Atual</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    data-testid="input-patrimonio-atual"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pedidoPatrimonio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pedido Patrimonio</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    data-testid="input-pedido-patrimonio"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="valorReferencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor de Referencia (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    data-testid="input-valor-referencia"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    data-testid="input-ata"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numeroPedido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numero do Pedido</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Numero do pedido" 
                    {...field} 
                    value={field.value ?? ""}
                    data-testid="input-numero-pedido"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observacoes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notas adicionais sobre o item" 
                  className="resize-none"
                  rows={3}
                  {...field} 
                  value={field.value ?? ""}
                  data-testid="textarea-observacoes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Item Ativo</FormLabel>
                <FormDescription>
                  Itens inativos nao aparecem nas buscas principais
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-ativo"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isPending}
            data-testid="button-submit"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? "Salvar Alteracoes" : "Criar Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
