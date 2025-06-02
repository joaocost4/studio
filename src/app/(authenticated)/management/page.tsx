
"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { USER_ROLES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle,
  ClipboardSignature,
  Printer,
  Megaphone,
  CalendarPlus,
  CalendarDays,
  BarChart3,
  PackagePlus,
  Briefcase // Fallback or general admin icon
} from "lucide-react";
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

  const isAdmin = userProfile.role === USER_ROLES.ADMIN;
  const pageIcon = isAdmin ? Briefcase : ClipboardSignature; // Different main icon for Admin vs Rep
  const pageTitle = isAdmin ? "Página de Gestão Avançada" : "Painel do Representante de Turma";
  const pageDescription = isAdmin 
    ? "Ferramentas administrativas e de gestão de representantes."
    : "Ferramentas e recursos para auxiliar na gestão da turma de Medicina.";

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg border-2 border-primary/30 rounded-xl">
        <CardHeader className="text-center bg-primary/10">
          <svelte:component this={pageIcon} className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary">{pageTitle}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {pageDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-lg text-foreground">
            Bem-vindo(a), <strong className="text-primary">{userProfile.role === USER_ROLES.ADMIN ? 'Administrador(a)' : 'Representante'} {userProfile.matricula}</strong>!
            Utilize as ferramentas abaixo para gerenciar informações.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="default" onClick={() => handleManagementAction("Lançar Notas da Turma")} className="w-full bg-primary hover:bg-primary/90">
              <ClipboardSignature className="mr-2 h-5 w-5" /> Lançar Notas da Turma
            </Button>
            <Button variant="secondary" onClick={() => handleManagementAction("Imprimir Lista de Chamada")} className="w-full">
              <Printer className="mr-2 h-5 w-5" /> Imprimir Lista de Chamada
            </Button>
            <Button variant="outline" onClick={() => handleManagementAction("Gerenciar Comunicados da Turma")} className="w-full">
              <Megaphone className="mr-2 h-5 w-5" /> Gerenciar Comunicados
            </Button>
            <Button variant="default" onClick={() => handleManagementAction("Agendar Reuniões")} className="w-full bg-primary/80 hover:bg-primary/70">
              <CalendarPlus className="mr-2 h-5 w-5" /> Agendar Reuniões
            </Button>
            <Button variant="secondary" onClick={() => handleManagementAction("Visualizar Calendário Acadêmico")} className="w-full">
              <CalendarDays className="mr-2 h-5 w-5" /> Calendário Acadêmico
            </Button>
            <Button variant="outline" onClick={() => handleManagementAction("Painel de Desempenho da Turma")} className="w-full">
              <BarChart3 className="mr-2 h-5 w-5" /> Desempenho da Turma
            </Button>
             <Button variant="default" onClick={() => handleManagementAction("Solicitar Materiais/Recursos")} className="w-full col-span-1 md:col-span-2 lg:col-span-1 bg-primary/70 hover:bg-primary/60">
              <PackagePlus className="mr-2 h-5 w-5" /> Solicitar Materiais
            </Button>
          </div>

           {isAdmin && (
            <div className="mt-6 p-4 border border-dashed border-primary/30 rounded-md bg-primary/5">
              <h3 className="text-xl font-semibold text-primary/80 mb-2">Funções Exclusivas de Admin:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="ghost" className="text-primary border border-primary hover:bg-primary/10" onClick={() => handleManagementAction("Definir Permissões Globais")}>
                  Definir Permissões Globais (Simulação)
                </Button>
                <Button variant="ghost" className="text-primary border border-primary hover:bg-primary/10" onClick={() => handleManagementAction("Auditoria do Sistema")}>
                  Auditoria do Sistema (Simulação)
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 border border-dashed border-secondary/30 rounded-md bg-secondary/5">
            <h3 className="text-xl font-semibold text-secondary-foreground/80 mb-2">Avisos e Próximos Passos:</h3>
            <ul className="list-disc list-inside text-sm text-secondary-foreground/70 space-y-1">
              <li>As funcionalidades apresentadas são simulações. O desenvolvimento completo é necessário para torná-las operacionais.</li>
              <li>Considere integrar com sistemas acadêmicos reais para lançamento de notas e listas de chamada.</li>
              <li>A gestão de comunicados pode envolver notificações por email ou dentro da plataforma.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
