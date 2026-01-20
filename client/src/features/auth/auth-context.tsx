import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

type User = {
    id: string;
    username: string;
    role: "admin" | "manutencao" | "patrimonio";
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    loginMutation: any;
    logoutMutation: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [location, setLocation] = useLocation();

    const { data: user, isLoading } = useQuery({
        queryKey: ["/api/auth/user"],
        queryFn: async () => {
            const res = await fetch("/api/auth/user");
            if (!res.ok) {
                if (res.status === 401) return null;
                throw new Error("Failed to fetch user");
            }
            return (await res.json()).user;
        },
        retry: false,
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: any) => {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Login failed");
            }
            return (await res.json()).user;
        },
        onSuccess: (user) => {
            queryClient.setQueryData(["/api/auth/user"], user);
            setLocation("/");
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await fetch("/api/auth/logout", { method: "POST" });
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/auth/user"], null);
            setLocation("/auth");
        },
    });

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                loginMutation,
                logoutMutation,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
