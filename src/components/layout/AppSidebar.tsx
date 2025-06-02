
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, Users, ShieldCheck, LogOut, Apple, Settings } from "lucide-react"; // Added Settings icon
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { USER_ROLES } from "@/lib/constants";
import { StrawberryIcon } from "../icons/StrawberryIcon";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: (typeof USER_ROLES)[keyof typeof USER_ROLES][];
  // subItems are removed as Calculadora 1 and 2 are now top-level
}

export function AppSidebar() {
  const { userProfile, logout, loading } = useAuth();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/calculator1", label: "Calculadora 1", icon: StrawberryIcon },
    { href: "/calculator2", label: "Calculadora 2", icon: Apple }, // Apple icon for Docinha theme
    { href: "/management", label: "Gestão", icon: Users, roles: [USER_ROLES.ADMIN, USER_ROLES.REPRESENTATIVE] },
    { href: "/admin", label: "Testes Admin", icon: ShieldCheck, roles: [USER_ROLES.ADMIN] },
  ];

  const getInitials = (fullName?: string | null, matricula?: string | null) => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(' ');
      if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      if (parts.length === 1 && parts[0]) {
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    if (matricula) {
      return matricula.substring(0, 2).toUpperCase();
    }
    return "CM"; 
  };
  
  const isActive = (href: string) => {
    // Exact match for dashboard, startsWith for others to highlight parent routes if needed (though not strictly necessary with current flat structure)
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const renderNavItems = (items: NavItem[]) => {
    return items.filter(item => {
        if (loading && !userProfile) return false; 
        if (!item.roles) return true; 
        return userProfile && item.roles.includes(userProfile.role);
      }).map((item) => (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton 
              asChild
              className="font-medium"
              isActive={isActive(item.href)}
              // @ts-ignore 
              variant={isActive(item.href) ? "secondary" : "ghost"}
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ));
  };


  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
                <StrawberryIcon className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">Calculadora da Moranguinho</h1>
            </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {renderNavItems(navItems)}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarSeparator />

      <SidebarFooter className="p-4 space-y-2 border-t border-sidebar-border">
        {userProfile && (
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-10 w-10 border-2 border-sidebar-primary">
              <AvatarImage src={userProfile.email ? `https://avatar.vercel.sh/${userProfile.email}.png` : undefined} alt={userProfile.nomeCompleto || userProfile.matricula || "Usuário"} data-ai-hint="user avatar" />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {getInitials(userProfile.nomeCompleto, userProfile.matricula)}
              </AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
              <p className="text-sm font-semibold text-sidebar-foreground truncate" title={userProfile.nomeCompleto || userProfile.matricula || "Usuário"}>
                {userProfile.nomeCompleto || userProfile.matricula}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {userProfile.matricula}
                {userProfile.role && userProfile.role !== USER_ROLES.USER ? ` - ${userProfile.role}` : ''}
              </p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={logout} disabled={loading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
