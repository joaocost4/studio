"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { USER_ROLES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, TestTube2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
  const { userProfile } = useAuth(); // useAuth to get profile after useRequireAuth confirms access
  // useRequireAuth already handles redirection if not admin.
  // This hook call is primarily to establish that this page needs auth and specific roles.
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN] });


  if (!userProfile || userProfile.role !== USER_ROLES.ADMIN) {
    // This should ideally not be reached if useRequireAuth works correctly,
    // but serves as an additional client-side check or loading state.
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }
  
  const handleAdminAction = (action: string) => {
    alert(`Ação administrativa "${action}" executada! (Simulação)`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg border-2 border-destructive/50 rounded-xl">
        <CardHeader className="text-center bg-destructive/10">
          <ShieldCheck className="mx-auto h-16 w-16 text-destructive mb-4" />
          <CardTitle className="text-3xl font-headline text-destructive">Página de Testes Administrativa</CardTitle>
          <CardDescription className="text-muted-foreground">Recursos e testes exclusivos para administradores.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-lg text-foreground">
            Olá, Administrador <strong className="text-primary">{userProfile.matricula}</strong>! Esta área é para testes de funcionalidades administrativas.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="destructive" onClick={() => handleAdminAction("Limpar Cache")} className="w-full">
              <TestTube2 className="mr-2 h-5 w-5" /> Limpar Cache do Sistema (Simulação)
            </Button>
            <Button variant="destructive" onClick={() => handleAdminAction("Recalcular Estatísticas")} className="w-full">
              <TestTube2 className="mr-2 h-5 w-5" /> Recalcular Estatísticas (Simulação)
            </Button>
             <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 w-full" onClick={() => handleAdminAction("Ver Logs Detalhados")}>
              Ver Logs Detalhados (Simulação)
            </Button>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 w-full" onClick={() => handleAdminAction("Enviar Notificação Global")}>
              Enviar Notificação Global (Simulação)
            </Button>
          </div>

          <div className="mt-6 p-4 border border-dashed border-destructive/30 rounded-md bg-destructive/5">
            <h3 className="text-xl font-semibold text-destructive/80 mb-2">Notas do Desenvolvedor:</h3>
            <ul className="list-disc list-inside text-sm text-destructive/70 space-y-1">
              <li>Esta página é um protótipo para testes de funções administrativas.</li>
              <li>Implemente lógica real para cada botão de ação.</li>
              <li>Considere adicionar logs de auditoria para ações administrativas.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
