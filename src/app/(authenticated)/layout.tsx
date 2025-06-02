"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Loader2 } from "lucide-react";
import React from "react";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, currentUser } = useRequireAuth(); // Basic protection

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Carregando Doçura...</p>
      </div>
    );
  }

  if (!currentUser) {
     // useRequireAuth handles redirection, this is a fallback or for when redirection is pending
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
