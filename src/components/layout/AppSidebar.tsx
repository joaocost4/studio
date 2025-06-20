
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, Users, ShieldCheck, LogOut, Apple, Calculator, ChevronDown, ChevronRight, BookMarked, Cookie, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { USER_ROLES } from "@/lib/constants";
import StrawberryIcon from "../icons/StrawberryIcon";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  roles?: (typeof USER_ROLES)[keyof typeof USER_ROLES][];
  subItems?: NavItem[];
  defaultOpen?: boolean;
}

export function AppSidebar() {
  const { userProfile, logout, loading } = useAuth();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    {
      label: "Calculadoras",
      icon: Calculator,
      defaultOpen: true,
      subItems: [
        { href: "/calculator1", label: "Calculadora 1", icon: StrawberryIcon },
        { href: "/calculator2", label: "Calculadora 2", icon: Apple },
      ],
    },
    { href: "/my-grades", label: "Minhas Notas", icon: BookMarked },
    { href: "/recipes", label: "Receitas", icon: Cookie },
    { href: "/mural", label: "Mural", icon: ClipboardList },
    { href: "/management", label: "Gestão", icon: Users, roles: [USER_ROLES.ADMIN, USER_ROLES.REPRESENTATIVE] },
    { href: "/admin", label: "Testes Admin", icon: ShieldCheck, roles: [USER_ROLES.ADMIN] },
  ];

  useEffect(() => {
    const initialSubmenusState: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.subItems && item.defaultOpen) {
        const isActiveParent = item.subItems.some(sub => sub.href && pathname.startsWith(sub.href));
        if (isActiveParent || item.defaultOpen) {
             initialSubmenusState[item.label] = true;
        }
      }
    });
    navItems.forEach(item => {
        if(item.subItems) {
            item.subItems.forEach(subItem => {
                if (subItem.href && isActive(subItem.href) && !initialSubmenusState[item.label]) {
                    initialSubmenusState[item.label] = true;
                }
            })
        }
    });
    setOpenSubmenus(initialSubmenusState);
  }, [pathname]);


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
    if (!href) return false;
    if (href === "/dashboard" || href === "/my-grades" || href === "/recipes" || href === "/mural") return pathname === href;
    return pathname.startsWith(href);
  };

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (loading && !userProfile) return false; 
      if (!item.roles) return true; 
      return userProfile && item.roles.includes(userProfile.role); 
    }).map((item) => {
      if (item.subItems) {
        const isParentActive = item.subItems.some(sub => sub.href && isActive(sub.href));
        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              onClick={() => toggleSubmenu(item.label)}
              variant={isParentActive ? "secondary" : "ghost"}
              className="font-medium w-full justify-between"
              isActive={isParentActive}
            >
              <div className="flex items-center">
                <item.icon className="mr-2 h-5 w-5" />
                <span>{item.label}</span>
              </div>
              {openSubmenus[item.label] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </SidebarMenuButton>
            {openSubmenus[item.label] && (
              <SidebarMenuSub>
                {item.subItems.map(subItem => (
                  <SidebarMenuSubItem key={subItem.label}>
                    <SidebarMenuSubButton
                      asChild
                      variant={subItem.href && isActive(subItem.href) ? "secondary" : "ghost"}
                      className="font-medium"
                      isActive={subItem.href && isActive(subItem.href)}
                    >
                      <Link href={subItem.href!}>
                        <subItem.icon className="mr-2 h-4 w-4" />
                        <span>{subItem.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        );
      }
      return (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            asChild
            className="font-medium"
            isActive={item.href && isActive(item.href)}
            variant={item.href && isActive(item.href) ? "secondary" : "ghost"}
          >
            <Link href={item.href!}>
              <item.icon className="mr-2 h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };


  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex flex-col items-start gap-1 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <div className="flex items-center gap-2">
            <StrawberryIcon className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">Moranguinho</h1>
          </div>
          <span className="text-xs text-sidebar-foreground/70 ml-10 group-data-[collapsible=icon]:hidden">beta V 0.6</span>
        </Link>
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
