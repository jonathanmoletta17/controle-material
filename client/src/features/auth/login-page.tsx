import { useForm } from "react-hook-form";
import { useAuth } from "./auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
    const { loginMutation } = useAuth();

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    function onSubmit(data: any) {
        loginMutation.mutate(data);
    }

    return (
        <div className="flex h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center flex flex-col items-center">
                    <img src="/favicon.png" alt="Logo" className="h-16 w-16 mb-4 object-contain" />
                    <CardTitle className="text-2xl">SIGMA - CC</CardTitle>
                    <CardDescription>Sistema de Gestão de Materiais - Casa Civil</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="your.user" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Login
                            </Button>
                            {loginMutation.error && (
                                <p className="text-sm text-destructive text-center">
                                    {loginMutation.error.message}
                                </p>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
