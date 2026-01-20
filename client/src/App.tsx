import { Switch, Route, Redirect, useLocation } from "wouter";
import React from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/app-sidebar";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { AuthProvider, useAuth } from "@/features/auth/auth-context";
import { Loader2 } from "lucide-react";


import ItemsList from "@/features/inventory/pages/ItemsListPage";
import ItemDetail from "@/features/inventory/pages/ItemDetailPage";
import Import from "@/features/inventory/pages/ImportPage";
import Reports from "@/features/reports/pages/ReportsPage";
import NotFound from "@/shared/pages/NotFoundPage";
import LoginPage from "@/features/auth/login-page";
import UsersPage from "@/features/auth/users-page";
import LabelPrinting from "@/features/labels/pages/LabelPrintingPage";

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">
            <Switch>
              <Route path="/">
                <Redirect to="/items" />
              </Route>
              <Route path="/items" component={ItemsList} />
              <Route path="/items/:id" component={ItemDetail} />
              <Route path="/import" component={Import} />
              <Route path="/reports" component={Reports} />
              <Route path="/labels" component={LabelPrinting} />
              <Route path="/users" component={UsersPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (location !== "/auth") {
      return <Redirect to="/auth" />;
    }
    return <LoginPage />;
  }

  // Redirect authenticated users away from login page
  if (location === "/auth") {
    return <Redirect to="/" />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="controle-materiais-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
