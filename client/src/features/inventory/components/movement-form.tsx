import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { TIPOS_MOVIMENTO, SETORES, insertMovimentoSchema, Responsavel } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GlpiTicketData {
  id: number;
  name: string;
  requester_name?: string;
  category_name?: string;
  mapped_sector?: any;
  status: any;
}

const formSchema = insertMovimentoSchema.extend({
  quantidade: z.coerce.number().refine((val) => val !== 0, "Quantidade nao pode ser zero"),
  valorUnitarioRef: z.coerce.number().min(0).nullable(),
  validadeValorReferencia: z.coerce.date().nullable().optional(),
  validadeAta: z.coerce.date().nullable().optional(),
  requerente: z.string().optional(),
  nomeChamado: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const tipoLabels = {
  RETIRADA_MANUTENCAO: "Retirada (Manutenção)",
  RETORNO_MANUTENCAO: "Retorno (Manutenção)",
  ENTRADA_PATRIMONIO: "Entrada (Patrimônio)",
  PEDIDO_PATRIMONIO: "Pedido (Patrimônio -> Manutenção)",
  ADIANTAMENTO_MANUTENCAO: "Adiantamento (Manutenção)",
  RETIRADA_CONSERVACAO: "Retirada (Conservação)",
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
      requerente: "",
      nomeChamado: "",
    },
  });

  const [ticketData, setTicketData] = useState<GlpiTicketData | null>(null);
  const [isFetchingTicket, setIsFetchingTicket] = useState(false);
  const { toast } = useToast();

  // Combobox state
  const [openResponsavel, setOpenResponsavel] = useState(false);

  const { data: responsaveis = [] } = useQuery<Responsavel[]>({
    queryKey: ["/api/responsaveis"],
  });

  const availableTipos = user?.role === "manutencao"
    ? TIPOS_MOVIMENTO.filter(t => t === "RETIRADA_MANUTENCAO" || t === "RETORNO_MANUTENCAO" || t === "RETIRADA_CONSERVACAO")
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

    if (data.tipo === "RETIRADA_CONSERVACAO") {
      if (!data.responsavel) {
        form.setError("responsavel", { message: "Responsavel e obrigatorio" });
        return;
      }
    }
    onSubmit(data);
  };

  const tipoValue = form.watch("tipo");
  const requiresChamado = tipoValue === "RETIRADA_MANUTENCAO" || tipoValue === "RETORNO_MANUTENCAO";
  const requiresResponsavel = requiresChamado || tipoValue === "RETIRADA_CONSERVACAO";

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
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: 123456"
                        {...field}
                        value={field.value ?? ""}
                        onBlur={(e) => {
                          field.onBlur();
                          const val = e.target.value;
                          if (val && !isNaN(Number(val))) {
                            setIsFetchingTicket(true);
                            fetch(`/api/glpi/tickets/${val}`)
                              .then(res => {
                                if (!res.ok) throw new Error("Chamado nao encontrado");
                                return res.json();
                              })
                              .then(data => {
                                if (data) {
                                  setTicketData(data);
                                  if (data.requester_name) {
                                    // form.setValue("responsavel", data.requester_name); // Removed auto-fill for responsible
                                    form.setValue("requerente", data.requester_name);
                                  }
                                  if (data.name) {
                                    form.setValue("nomeChamado", data.name);
                                  }
                                  if (data.mapped_sector) {
                                    form.setValue("setor", data.mapped_sector);
                                    toast({ title: "Setor detectado", description: `Categoria "${data.category_name}" mapeada para ${data.mapped_sector}` });
                                  }
                                  toast({ title: "Chamado encontrado", description: data.name });
                                }
                              })
                              .catch(() => {
                                setTicketData(null);
                                // Don't auto-clear fields to avoid annoyance
                              })
                              .finally(() => setIsFetchingTicket(false));
                          }
                        }}
                        data-testid="input-numero-chamado"
                      />
                      {isFetchingTicket && <Loader2 className="h-4 w-4 animate-spin my-auto" />}
                    </div>
                  </FormControl>
                  {ticketData && (
                    <div className="text-xs bg-muted p-2 rounded mt-1 border">
                      <p className="font-semibold">{ticketData.name}</p>
                      <p>Status: {ticketData.status} | Requerente: {ticketData.requester_name}</p>
                      {ticketData.category_name && <p className="text-muted-foreground">Categoria: {ticketData.category_name}</p>}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor (Automático)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Setor..."
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="bg-muted"
                      data-testid="input-setor"
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
          name="responsavel"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Responsavel {requiresResponsavel ? "*" : ""}</FormLabel>
              <Popover open={openResponsavel} onOpenChange={setOpenResponsavel}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? responsaveis.find(
                          (responsavel) => responsavel.nome === field.value
                        )?.nome || field.value
                        : "Selecione o responsável"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar responsável..." />
                    <CommandList>
                      <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                      <CommandGroup>
                        {responsaveis.map((responsavel) => (
                          <CommandItem
                            value={responsavel.nome}
                            key={responsavel.id}
                            onSelect={() => {
                              form.setValue("responsavel", responsavel.nome);
                              setOpenResponsavel(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                responsavel.nome === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {responsavel.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requerente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requerente (GLPI)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome do requerente"
                  {...field}
                  value={field.value ?? ""}
                  readOnly
                  className="bg-muted"
                  data-testid="input-requerente"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nomeChamado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titulo do Chamado</FormLabel>
              <FormControl>
                <Input
                  placeholder="Titulo do chamado"
                  {...field}
                  value={field.value ?? ""}
                  readOnly
                  className="bg-muted"
                  data-testid="input-nome-chamado"
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
