
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, Calculator, Users, ShieldCheck, LogOut, Apple } from "lucide-react";
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
  subItems?: NavItem[];
}

export function AppSidebar() {
  const { userProfile, logout, loading } = useAuth();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { 
      href: "/calculators", label: "Calculadoras", icon: Calculator,
      subItems: [
        { href: "/calculator1", label: "Calculadora Moranguinho", icon: StrawberryIcon },
        { href: "/calculator2", label: "Calculadora Docinha", icon: Apple },
      ]
    },
    { href: "/management", label: "Gestão", icon: Users, roles: [USER_ROLES.ADMIN, USER_ROLES.REPRESENTATIVE] },
    { href: "/admin", label: "Testes Admin", icon: ShieldCheck, roles: [USER_ROLES.ADMIN] },
  ];

  const getInitials = (fullName?: string | null, matricula?: string | null) => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(' ');
      if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        // Use first letter of first name and first letter of last name
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      if (parts.length === 1 && parts[0]) {
        // Use first two letters of the single name
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    if (matricula) {
      return matricula.substring(0, 2).toUpperCase();
    }
    return "CM"; // Fallback for Calculadora da Moranguinho or if no name/matricula
  };
  
  const isActive = (href: string, isSubItem = false) => {
    if (isSubItem) return pathname === href;
    // For parent items, check if the current path starts with the item's href.
    // Ensure dashboard (exact match) or other parent routes like /calculators correctly activate.
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const renderNavItems = (items: NavItem[], isSubMenu = false) => {
    return items.filter(item => {
        if (loading && !userProfile) return false; // Don't render if auth state is loading initially and no profile yet
        if (!item.roles) return true; // No specific roles required
        return userProfile && item.roles.includes(userProfile.role);
      }).map((item) => (
        <SidebarMenuItem key={item.label}>
          {item.subItems ? (
            <>
              <SidebarMenuButton
                asChild={!isSubMenu}
                className="font-medium"
                isActive={isActive(item.href)}
                // @ts-ignore 
                variant={isActive(item.href) ? "secondary" : "ghost"} 
              >
                 <Link href={item.href} className="flex items-center w-full">
                    <item.icon className="mr-2 h-5 w-5" />
                    <span>{item.label}</span>
                 </Link>
              </SidebarMenuButton>
              <SidebarMenuSub>
                {item.subItems.map(subItem => (
                   <SidebarMenuSubItem key={subItem.label}>
                    <SidebarMenuSubButton 
                        asChild
                        // @ts-ignore
                        variant={isActive(subItem.href, true) ? "secondary" : "ghost"}
                        isActive={isActive(subItem.href, true)}
                    >
                      <Link href={subItem.href}>
                        <subItem.icon className="mr-2 h-4 w-4" />
                        <span>{subItem.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </>
          ) : (
            <SidebarMenuButton 
                asChild={!isSubMenu}
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
          )}
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
              <AvatarImage src={userProfile.email ? `https://avatar.vercel.sh/${userProfile.email}.png` : undefined} alt={userProfile.nomeCompleto || userProfile.matricula} data-ai-hint="user avatar" />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {getInitials(userProfile.nomeCompleto, userProfile.matricula)}
              </AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
              <p className="text-sm font-semibold text-sidebar-foreground truncate" title={userProfile.nomeCompleto || userProfile.matricula}>
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
