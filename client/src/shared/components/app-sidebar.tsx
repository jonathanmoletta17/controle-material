import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Package,
  Users,
  LogOut,
  Tag
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/shared/components/ui/sidebar";
import { useAuth } from "@/features/auth/auth-context";

const mainItems = [
  { title: "Todos os Itens", url: "/items", icon: Package },
];

const toolItems = [
  // { title: "Importar Planilha", url: "/import", icon: Upload }, // Hidden by user request
  { title: "Relatorios", url: "/reports", icon: FileText },
  { title: "Emissão de Etiquetas", url: "/labels", icon: Tag },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url) && location !== "/";
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-transparent">
            <img src="/favicon.png" alt="Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">SIGMA - CC</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Sistema de Gestão de Materiais - Casa Civil</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={`sidebar-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
            Ferramentas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={`sidebar-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/users")}
                    data-testid="sidebar-users"
                  >
                    <Link href="/users">
                      <Users className="h-4 w-4" />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.username}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground text-center pt-2">
          v1.0.0 - SIGMA - CC
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
