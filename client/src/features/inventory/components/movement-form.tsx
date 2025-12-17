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
import { TIPOS_MOVIMENTO, insertMovimentoSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

const formSchema = insertMovimentoSchema.extend({
  quantidade: z.coerce.number().refine((val) => val !== 0, "Quantidade nao pode ser zero"),
  valorUnitarioRef: z.coerce.number().min(0).nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const tipoLabels = {
  entrada: "Entrada",
  saida: "Saida",
  retorno: "Retorno",
  ajuste: "Ajuste",
  patrimonio: "Patrimonio",
  compra: "Compra",
};

interface MovementFormProps {
  itemId: string;
  onSubmit: (data: FormValues) => void;
  isPending?: boolean;
  onCancel?: () => void;
}

export function MovementForm({ itemId, onSubmit, isPending, onCancel }: MovementFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId,
      tipo: "entrada",
      quantidade: 0,
      responsavel: "",
      origem: "",
      destino: "",
      ata: "",
      numeroPedido: "",
      valorUnitarioRef: null,
      observacoes: "",
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  const tipoValue = form.watch("tipo");

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
                    {TIPOS_MOVIMENTO.map((tipo) => (
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
                  {tipoValue === "saida" && (
                    <span className="text-xs text-muted-foreground ml-2">(use valor positivo)</span>
                  )}
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

        <FormField
          control={form.control}
          name="responsavel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsavel</FormLabel>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="origem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Local de origem" 
                    {...field} 
                    value={field.value ?? ""}
                    data-testid="input-origem"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destino"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destino</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Local de destino" 
                    {...field} 
                    value={field.value ?? ""}
                    data-testid="input-destino"
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
            name="valorUnitarioRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Unit. Ref (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    data-testid="input-valor-unitario"
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
                    data-testid="input-movimento-ata"
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
                    data-testid="input-movimento-pedido"
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
