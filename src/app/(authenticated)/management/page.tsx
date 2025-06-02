"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { USER_ROLES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, FileText, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ManagementPage() {
  const { userProfile } = useAuth();
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.REPRESENTATIVE] });

  if (!userProfile || !(userProfile.role === USER_ROLES.ADMIN || userProfile.role === USER_ROLES.REPRESENTATIVE)) {
     return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para visualizar esta página de gestão.</p>
      </div>
    );
  }
  
  const handleManagementAction = (action: string) => {
    alert(`Ação de gestão "${action}" executada! (Simulação)`);
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg border-2 border-primary/30 rounded-xl">
        <CardHeader className="text-center bg-primary/10">
          <Briefcase className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">Página de Gestão</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ferramentas para Representantes de Turma e Administradores.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-lg text-foreground">
            Bem-vindo(a), <strong className="text-accent">{userProfile.role === USER_ROLES.ADMIN ? 'Administrador(a)' : 'Representante'} {userProfile.matricula}</strong>! Utilize as ferramentas abaixo para gerenciar informações.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="default" onClick={() => handleManagementAction("Gerenciar Usuários")} className="w-full bg-primary hover:bg-primary/90">
              <Users className="mr-2 h-5 w-5" /> Gerenciar Usuários (Simulação)
            </Button>
            <Button variant="secondary" onClick={() => handleManagementAction("Visualizar Relatórios")} className="w-full">
              <FileText className="mr-2 h-5 w-5" /> Visualizar Relatórios (Simulação)
            </Button>
            <Button variant="outline" onClick={() => handleManagementAction("Configurações da Turma")} className="w-full">
              Configurações da Turma (Simulação)
            </Button>
          </div>

           {userProfile.role === USER_ROLES.ADMIN && (
            <div className="mt-6 p-4 border border-dashed border-accent/30 rounded-md bg-accent/5">
              <h3 className="text-xl font-semibold text-accent/80 mb-2">Funções Exclusivas de Admin:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="ghost" className="text-accent border border-accent hover:bg-accent/20" onClick={() => handleManagementAction("Definir Permissões Globais")}>
                  Definir Permissões Globais (Simulação)
                </Button>
                <Button variant="ghost" className="text-accent border border-accent hover:bg-accent/20" onClick={() => handleManagementAction("Auditoria do Sistema")}>
                  Auditoria do Sistema (Simulação)
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 border border-dashed border-primary/20 rounded-md bg-primary/5">
            <h3 className="text-xl font-semibold text-primary/80 mb-2">Avisos e Próximos Passos:</h3>
            <ul className="list-disc list-inside text-sm text-primary/70 space-y-1">
              <li>Esta é uma interface de simulação. Funcionalidades reais precisam ser implementadas.</li>
              <li>Considere adicionar filtros e paginação para listas de usuários/relatórios.</li>
              <li>Integre com o backend para persistir as alterações de gestão.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
