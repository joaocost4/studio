"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import React from "react";
import { Button } from "../ui/button";
import { PanelLeft } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Default open can be controlled by cookie or prop in a real app
  // For simplicity, defaultOpen is true. The Sidebar component handles cookie state.
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
            <SidebarTrigger variant="secondary" className="h-8 w-8" />
            {/* Add Mobile Header Content Here if needed, like App Name */}
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
