
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
  Users, 
  Briefcase,
  UserPlus // Added UserPlus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation"; 
import React, { useState } from "react"; // Added useState
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ManagementPage() {
  const { userProfile } = useAuth();
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.REPRESENTATIVE] });
  const router = useRouter(); 
  const { toast } = useToast();

  const [isAddStudentToTurmaDialogOpen, setIsAddStudentToTurmaDialogOpen] = useState(false);
  const [studentMatriculaToAdd, setStudentMatriculaToAdd] = useState("");

  if (!userProfile || !(userProfile.role === USER_ROLES.ADMIN || userProfile.role === USER_ROLES.REPRESENTATIVE)) {
     return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para visualizar esta página de gestão.</p>
      </div>
    );
  }
  
  const handleManagementAction = (action: string, details?: any) => {
    if (action === "Gerir Turmas") {
      router.push('/admin/turmas');
    } else if (action === "Adicionar Aluno à Turma") {
      // Here you would implement the actual logic to add the student.
      // For now, it's a simulation.
      toast({
        title: "Ação Simulada",
        description: `Aluno com matrícula "${details.matricula}" seria adicionado à turma "${userProfile?.turmaNome}".`,
      });
      setIsAddStudentToTurmaDialogOpen(false);
      setStudentMatriculaToAdd("");
    }
     else {
      alert(`Ação de gestão "${action}" executada! (Simulação)`);
    }
  };

  const isAdmin = userProfile.role === USER_ROLES.ADMIN;
  const isRepresentative = userProfile.role === USER_ROLES.REPRESENTATIVE;
  const PageIconComponent = isAdmin ? Briefcase : ClipboardSignature; 
  const pageTitle = isAdmin ? "Página de Gestão Avançada" : "Painel do Representante de Turma";
  const pageDescription = isAdmin 
    ? "Ferramentas administrativas e de gestão de representantes."
    : "Ferramentas e recursos para auxiliar na gestão da turma de Medicina.";

  const canAddStudentToTurma = isRepresentative && userProfile?.turmaId && userProfile?.turmaNome;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg border-2 border-primary/30 rounded-xl">
        <CardHeader className="text-center bg-primary/10">
          <PageIconComponent className="mx-auto h-16 w-16 text-primary mb-4" />
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

            {/* Botão Adicionar Aluno à Turma para Representantes */}
            {canAddStudentToTurma && (
              <Dialog open={isAddStudentToTurmaDialogOpen} onOpenChange={(isOpen) => {
                setIsAddStudentToTurmaDialogOpen(isOpen);
                if (!isOpen) setStudentMatriculaToAdd(""); // Limpa o campo ao fechar
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full text-accent-foreground border-accent hover:bg-accent/10">
                    <UserPlus className="mr-2 h-5 w-5 text-accent" /> Adicionar Aluno à Turma
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Adicionar Aluno à Turma</DialogTitle>
                    <DialogDescription>
                      Insira a matrícula do aluno que deseja adicionar à sua turma: <strong className="text-primary">{userProfile?.turmaNome}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="student-matricula" className="text-right">
                        Matrícula
                      </Label>
                      <Input
                        id="student-matricula"
                        value={studentMatriculaToAdd}
                        onChange={(e) => setStudentMatriculaToAdd(e.target.value)}
                        className="col-span-3"
                        placeholder="Matrícula do Aluno"
                      />
                    </div>
                     <p className="text-sm text-muted-foreground col-span-4">
                        Você está adicionando à turma: <span className="font-semibold text-foreground">{userProfile?.turmaNome}</span>.
                        Esta ação é uma simulação e necessita implementação do backend.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddStudentToTurmaDialogOpen(false)}>Cancelar</Button>
                    <Button 
                      type="button" 
                      onClick={() => handleManagementAction("Adicionar Aluno à Turma", { matricula: studentMatriculaToAdd })}
                      disabled={!studentMatriculaToAdd.trim()}
                    >
                      Adicionar Aluno (Simulação)
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

           {isAdmin && (
            <div className="mt-6 p-4 border border-dashed border-primary/30 rounded-md bg-primary/5">
              <h3 className="text-xl font-semibold text-primary/80 mb-2">Funções Exclusivas de Admin:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="ghost" className="text-primary border border-primary hover:bg-primary/10" onClick={() => handleManagementAction("Gerir Turmas")}>
                  <Users className="mr-2 h-5 w-5" /> Gerir Turmas
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
              <li>A funcionalidade "Adicionar Aluno à Turma" atualmente simula a ação. Seria necessário integrar com o Firestore para atualizar o `turmaId` do aluno especificado.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
