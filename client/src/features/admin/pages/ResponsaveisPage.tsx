import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { insertResponsavelSchema, Responsavel } from "@shared/schema";

const formSchema = insertResponsavelSchema;
type FormValues = z.infer<typeof formSchema>;

export default function ResponsaveisPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: responsaveis = [], isLoading } = useQuery<Responsavel[]>({
        queryKey: ["/api/responsaveis"],
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: "",
            idFuncional: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const res = await fetch("/api/responsaveis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/responsaveis"] });
            setIsDialogOpen(false);
            form.reset();
            toast({ title: "Sucesso", description: "Responsável cadastrado com sucesso" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao cadastrar responsável", variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: FormValues }) => {
            const res = await fetch(`/api/responsaveis/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/responsaveis"] });
            setIsDialogOpen(false);
            setEditingId(null);
            form.reset();
            toast({ title: "Sucesso", description: "Responsável atualizado com sucesso" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao atualizar responsável", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/responsaveis/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/responsaveis"] });
            toast({ title: "Sucesso", description: "Responsável removido com sucesso" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao remover responsável", variant: "destructive" });
        }
    });

    const onSubmit = (data: FormValues) => {
        if (editingId) {
            updateMutation.mutate({ id: editingId, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (responsavel: Responsavel) => {
        setEditingId(responsavel.id);
        form.reset({
            nome: responsavel.nome,
            idFuncional: responsavel.idFuncional,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja desativar este responsável?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleAddNew = () => {
        setEditingId(null);
        form.reset({ nome: "", idFuncional: "" });
        setIsDialogOpen(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Gerenciar Responsáveis</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Responsável
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Responsável" : "Novo Responsável"}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="nome"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: João da Silva" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="idFuncional"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ID Funcional (Matrícula)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: 123456" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                        {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Salvar
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>ID Funcional</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : responsaveis.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    Nenhum responsável cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            responsaveis.map((resp) => (
                                <TableRow key={resp.id}>
                                    <TableCell className="font-medium">{resp.nome}</TableCell>
                                    <TableCell>{resp.idFuncional}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(resp)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(resp.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
