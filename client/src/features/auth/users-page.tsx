import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ShieldAlert } from "lucide-react";

export default function UsersPage() {
    const { toast } = useToast();
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUserUsername, setNewUserUsername] = useState("");
    const [newUserRole, setNewUserRole] = useState("manutencao");

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: { username: string; role: string }) => {
            return apiRequest("POST", "/api/users", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            setIsAddUserOpen(false);
            setNewUserUsername("");
            setNewUserRole("manutencao");
            toast({ title: "Usuário criado com sucesso" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao criar usuário",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string; role: string }) => {
            return apiRequest("PATCH", `/api/users/${id}/role`, { role });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "Permissão atualizada" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao atualizar permissão",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("DELETE", `/api/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            toast({ title: "Usuário removido" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao remover usuário",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserUsername) return;
        createUserMutation.mutate({ username: newUserUsername, role: newUserRole });
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Usuário (AD)</Label>
                                <Input
                                    id="username"
                                    value={newUserUsername}
                                    onChange={(e) => setNewUserUsername(e.target.value)}
                                    placeholder="ex: joao.silva"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Nível de Acesso</Label>
                                <Select value={newUserRole} onValueChange={setNewUserRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manutencao">Manutenção</SelectItem>
                                        <SelectItem value="patrimonio">Patrimônio</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                                {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                        Usuários Cadastrados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Permissão</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(value) =>
                                                updateRoleMutation.mutate({ id: user.id, role: value })
                                            }
                                            disabled={updateRoleMutation.isPending}
                                        >
                                            <SelectTrigger className="w-32 h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manutencao">Manutenção</SelectItem>
                                                <SelectItem value="patrimonio">Patrimônio</SelectItem>
                                                <SelectItem value="admin">Administrador</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => {
                                                if (confirm(`Tem certeza que deseja remover ${user.username}?`)) {
                                                    deleteUserMutation.mutate(user.id);
                                                }
                                            }}
                                            disabled={deleteUserMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        Nenhum usuário encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-900 text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold">Nota sobre Acesso:</p>
                <p className="mt-1">
                    Usuários listados aqui têm acesso permitido. Se um usuário não estiver nesta lista, o sistema verificará as variáveis de ambiente (Bootstrapping) uma única vez para tentar criá-lo. Se não estiver no .env, o acesso será negado.
                    Para revogar acesso, exclua o usuário desta lista.
                </p>
            </div>
        </div>
    );
}
