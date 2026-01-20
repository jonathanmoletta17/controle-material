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
  patrimonioAtual: z.coerce.number().min(0),
  validadeValorReferencia: z.coerce.date().nullable().optional(),
  validadeAta: z.coerce.date().nullable().optional(),
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
      setor: "UNIFICADO",
      codigoGce: item?.codigoGce || "",
      itemNome: item?.itemNome || "",
      estoqueMinimo: item?.estoqueMinimo || 0,
      estoqueAtual: item?.estoqueAtual || 0,
      patrimonioAtual: item?.patrimonioAtual || 0,
      validadeValorReferencia: item?.validadeValorReferencia ? new Date(item.validadeValorReferencia) : null,
      ata: item?.ata || "",
      validadeAta: item?.validadeAta ? new Date(item.validadeAta) : null,
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
              <FormItem className="md:col-span-2">
                <FormLabel>Codigo GCE *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 1234.5678.123456"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Se conter letras, retorna o valor original (permite ADIANTAMENTO)
                      if (/[a-zA-Z]/.test(value)) {
                        field.onChange(value);
                        return;
                      }

                      // Remove tudo que não é dígito e aplica a máscara
                      const formatted = value
                        .replace(/\D/g, "")
                        .replace(/^(\d{4})(\d)/, "$1.$2")
                        .replace(/^(\d{4})\.(\d{4})(\d)/, "$1.$2.$3")
                        .slice(0, 16); // 14 dígitos + 2 pontos

                      field.onChange(formatted);
                    }}
                    data-testid="input-codigo-gce"
                  />
                </FormControl>
                <FormDescription>Codigo unico do item no GCE</FormDescription>
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
                    min="0"
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
                    min="0"
                    {...field}
                    data-testid="input-estoque-minimo"
                  />
                </FormControl>
                <FormDescription>Alerta quando atingir</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="patrimonioAtual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patrimonio Atual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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
                    data-testid="input-validade-valor-referencia"
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
                    data-testid="input-validade-ata"
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
