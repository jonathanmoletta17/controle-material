import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Zap,
  Hammer,
  Droplets,
  Thermometer,
  HardHat,
  PaintBucket,
  Upload,
  FileText,
  Package,
} from "lucide-react";
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
} from "@/components/ui/sidebar";

const setorItems = [
  { title: "Eletrica", url: "/items?setor=ELETRICA", icon: Zap },
  { title: "Marcenaria", url: "/items?setor=MARCENARIA", icon: Hammer },
  { title: "Hidraulica", url: "/items?setor=HIDRAULICA", icon: Droplets },
  { title: "Refrigeracao", url: "/items?setor=REFRIGERACAO", icon: Thermometer },
  { title: "Pedreiros", url: "/items?setor=PEDREIROS", icon: HardHat },
  { title: "Pintores", url: "/items?setor=PINTORES", icon: PaintBucket },
];

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Todos os Itens", url: "/items", icon: Package },
];

const toolItems = [
  { title: "Importar Planilha", url: "/import", icon: Upload },
  { title: "Relatorios", url: "/reports", icon: FileText },
];

export function AppSidebar() {
  const [location] = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url.split("?")[0]) && 
           (url.includes("?") ? location.includes(url.split("?")[1]) : !location.includes("setor="));
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Controle de Materiais</span>
            <span className="text-xs text-muted-foreground">Sistema de Inventario</span>
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
            Setores
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {setorItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={`sidebar-setor-${item.title.toLowerCase()}`}
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
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground">
          v1.0.0 - Controle de Materiais
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
