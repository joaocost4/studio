
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
  ListPlus, 
  BarChart3,
  PackagePlus,
  Users, 
  Briefcase,
  UserPlus,
  CalendarDays, 
  BookCopy,
  FlaskConical
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation"; 
import React, { useState, useEffect, useCallback } from "react";
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
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";


interface TurmaData {
  id: string;
  nome: string;
  ativa: boolean;
  createdAt?: Timestamp;
}

interface DisciplinaData {
  id: string; 
  nome: string;
  prioridade: number;
  turmaId: string;
  createdAt: Timestamp;
}

interface ProvaData {
  id?: string; 
  turmaId: string;
  disciplinaId: string;
  nome: string;
  peso: number; 
  data: Timestamp; 
  createdAt: Timestamp; 
}


export default function ManagementPage() {
  const { userProfile } = useAuth();
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.REPRESENTATIVE] });
  const router = useRouter(); 
  const { toast } = useToast();

  // State for "Adicionar Aluno à Turma" dialog
  const [isAddStudentToTurmaDialogOpen, setIsAddStudentToTurmaDialogOpen] = useState(false);
  const [studentMatriculaToAdd, setStudentMatriculaToAdd] = useState("");
  const [adminSelectedTurmaId, setAdminSelectedTurmaId] = useState<string | undefined>(undefined);
  const [activeTurmas, setActiveTurmas] = useState<TurmaData[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [isProcessingAssignment, setIsProcessingAssignment] = useState(false);

  // State for "Cadastrar Disciplina" dialog
  const [isCadastrarDisciplinaDialogOpen, setIsCadastrarDisciplinaDialogOpen] = useState(false);
  const [newDisciplinaName, setNewDisciplinaName] = useState("");
  const [newDisciplinaPrioridade, setNewDisciplinaPrioridade] = useState<number[]>([3]); 
  const [adminSelectedTurmaIdForDisciplina, setAdminSelectedTurmaIdForDisciplina] = useState<string | undefined>(undefined);
  const [isProcessingDisciplina, setIsProcessingDisciplina] = useState(false);

  // State for "Cadastrar Prova" dialog
  const [isCadastrarProvaDialogOpen, setIsCadastrarProvaDialogOpen] = useState(false);
  const [selectedTurmaIdForProva, setSelectedTurmaIdForProva] = useState<string | undefined>(undefined);
  const [disciplinasForProvaDropdown, setDisciplinasForProvaDropdown] = useState<DisciplinaData[]>([]);
  const [loadingDisciplinasForProva, setLoadingDisciplinasForProva] = useState(false);
  const [selectedDisciplinaIdForProva, setSelectedDisciplinaIdForProva] = useState<string | undefined>(undefined);
  const [newProvaNome, setNewProvaNome] = useState("");
  const [newProvaPeso, setNewProvaPeso] = useState<string>(""); 
  const [newProvaData, setNewProvaData] = useState<Date | undefined>(undefined);
  const [isProcessingProva, setIsProcessingProva] = useState(false);
  const [isProvaDatePickerOpen, setIsProvaDatePickerOpen] = useState(false);


  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;
  const isRepresentative = userProfile?.role === USER_ROLES.REPRESENTATIVE;

  const fetchActiveTurmas = useCallback(async () => {
    if (!isAdmin) return; 
    setLoadingTurmas(true);
    try {
      const turmasQuery = query(collection(db, "turmas"), where("ativa", "==", true));
      const turmasSnapshot = await getDocs(turmasQuery);
      const turmasList = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TurmaData));
      setActiveTurmas(turmasList);
    } catch (error) {
      console.error("Error fetching active turmas:", error);
      toast({ title: "Erro ao buscar turmas", description: "Não foi possível carregar a lista de turmas ativas.", variant: "destructive" });
    } finally {
      setLoadingTurmas(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchActiveTurmas();
    }
  }, [isAdmin, fetchActiveTurmas]);

  useEffect(() => {
    const fetchDisciplinas = async (turmaId: string) => {
      setLoadingDisciplinasForProva(true);
      setSelectedDisciplinaIdForProva(undefined); 
      try {
        const disciplinasQuery = query(collection(db, "disciplinas"), where("turmaId", "==", turmaId));
        const disciplinasSnapshot = await getDocs(disciplinasQuery);
        const disciplinasList = disciplinasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisciplinaData));
        disciplinasList.sort((a, b) => {
            if (a.prioridade !== b.prioridade) {
                return a.prioridade - b.prioridade;
            }
            return a.nome.localeCompare(b.nome);
        });
        setDisciplinasForProvaDropdown(disciplinasList);
        if (disciplinasList.length === 0) {
            toast({ title: "Sem Disciplinas", description: "Nenhuma disciplina encontrada para esta turma.", variant: "default" });
        }
      } catch (error) {
        console.error("Error fetching disciplinas for prova:", error);
        toast({ title: "Erro ao buscar disciplinas", variant: "destructive" });
        setDisciplinasForProvaDropdown([]);
      } finally {
        setLoadingDisciplinasForProva(false);
      }
    };

    if (isAdmin && selectedTurmaIdForProva) {
      fetchDisciplinas(selectedTurmaIdForProva);
    } else if (isRepresentative && userProfile?.turmaId) {
      if (!selectedTurmaIdForProva) { 
         setSelectedTurmaIdForProva(userProfile.turmaId);
      }
      fetchDisciplinas(userProfile.turmaId);
    } else {
        setDisciplinasForProvaDropdown([]); 
    }
  }, [isAdmin, isRepresentative, userProfile?.turmaId, selectedTurmaIdForProva, toast]);


  if (!userProfile || !(isAdmin || isRepresentative)) {
     return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para visualizar esta página de gestão.</p>
      </div>
    );
  }
  
  const handleSimulatedAction = (action: string, details?: any) => {
    let description = `Ação de gestão "${action}" executada! (Simulação)`;
    if (details) {
      description += ` Detalhes: ${JSON.stringify(details)}`;
    }
    toast({
      title: "Ação Simulada",
      description,
      duration: 5000,
    });
  };

  const handleAssignStudentToTurma = async () => {
    if (!studentMatriculaToAdd.trim()) {
      toast({ title: "Matrícula Necessária", description: "Por favor, insira a matrícula do aluno.", variant: "destructive" });
      return;
    }

    let targetTurmaId: string | undefined = undefined;
    let targetTurmaName: string | undefined = undefined;

    if (isAdmin) {
      if (!adminSelectedTurmaId) {
        toast({ title: "Turma Necessária", description: "Por favor, selecione a turma de destino.", variant: "destructive" });
        return;
      }
      targetTurmaId = adminSelectedTurmaId;
      targetTurmaName = activeTurmas.find(t => t.id === targetTurmaId)?.nome || "Turma Desconhecida";
    } else if (isRepresentative && userProfile.turmaId && userProfile.turmaNome) {
      targetTurmaId = userProfile.turmaId;
      targetTurmaName = userProfile.turmaNome;
    }

    if (!targetTurmaId) {
      toast({ title: "Erro de Configuração", description: "Não foi possível determinar a turma de destino.", variant: "destructive" });
      return;
    }

    setIsProcessingAssignment(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("matricula", "==", studentMatriculaToAdd.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: "Aluno Não Encontrado", description: `Nenhum aluno encontrado com a matrícula "${studentMatriculaToAdd}".`, variant: "destructive" });
        setIsProcessingAssignment(false);
        return;
      }

      const userToUpdateDoc = querySnapshot.docs[0];
      const userToUpdateRef = doc(db, "users", userToUpdateDoc.id);
      
      await updateDoc(userToUpdateRef, {
        turmaId: targetTurmaId,
      });

      toast({
        title: "Sucesso!",
        description: `Aluno ${userToUpdateDoc.data().nomeCompleto || studentMatriculaToAdd} foi atribuído à turma "${targetTurmaName}".`,
      });
      setIsAddStudentToTurmaDialogOpen(false);
      setStudentMatriculaToAdd("");
      if (isAdmin) setAdminSelectedTurmaId(undefined);

    } catch (error: any) {
      console.error("Error assigning student to turma:", error);
      let errMsg = "Ocorreu um erro ao tentar atribuir o aluno à turma.";
      if (error.code === 'permission-denied') {
        errMsg = "Permissão negada para atualizar o aluno. Verifique as regras do Firestore.";
      }
      toast({ title: "Erro na Atribuição", description: errMsg, variant: "destructive" });
    } finally {
      setIsProcessingAssignment(false);
    }
  };

  const handleCadastrarDisciplina = async () => {
    if (!newDisciplinaName.trim()) {
      toast({ title: "Nome da Disciplina Obrigatório", description: "Por favor, insira um nome para a disciplina.", variant: "destructive" });
      return;
    }

    let targetTurmaIdForDisciplina: string | undefined = undefined;

    if (isAdmin) {
      if (!adminSelectedTurmaIdForDisciplina) {
        toast({ title: "Turma Necessária", description: "Por favor, selecione a turma para a disciplina.", variant: "destructive" });
        return;
      }
      targetTurmaIdForDisciplina = adminSelectedTurmaIdForDisciplina;
    } else if (isRepresentative && userProfile.turmaId) {
      targetTurmaIdForDisciplina = userProfile.turmaId;
    } else {
        toast({ title: "Erro de Configuração", description: "Não foi possível determinar a turma para a disciplina.", variant: "destructive" });
        return;
    }
    
    setIsProcessingDisciplina(true);
    try {
      const disciplinaData: Omit<DisciplinaData, 'id'> = {
        nome: newDisciplinaName.trim(),
        prioridade: newDisciplinaPrioridade[0],
        turmaId: targetTurmaIdForDisciplina,
        createdAt: serverTimestamp() as Timestamp,
      };

      await addDoc(collection(db, "disciplinas"), disciplinaData);

      toast({
        title: "Disciplina Cadastrada!",
        description: `A disciplina "${newDisciplinaName.trim()}" foi salva com sucesso.`,
      });

      setIsCadastrarDisciplinaDialogOpen(false);
      setNewDisciplinaName("");
      setNewDisciplinaPrioridade([3]);
      if (isAdmin) setAdminSelectedTurmaIdForDisciplina(undefined);

    } catch (error: any) {
      console.error("Error adding disciplina:", error);
      let errMsg = "Ocorreu um erro ao tentar cadastrar a disciplina.";
      if (error.code === 'permission-denied') {
        errMsg = "Permissão negada para cadastrar a disciplina. Verifique as regras do Firestore.";
      }
      toast({ title: "Erro no Cadastro", description: errMsg, variant: "destructive" });
    } finally {
      setIsProcessingDisciplina(false);
    }
  };

  const handleCadastrarProva = async () => {
    let targetTurmaId: string | undefined = selectedTurmaIdForProva;
    if (isRepresentative && userProfile?.turmaId && !isAdmin) {
        targetTurmaId = userProfile.turmaId;
    }

    if (!targetTurmaId) {
        toast({ title: "Turma não selecionada", description: "Por favor, selecione uma turma.", variant: "destructive"});
        return;
    }
    if (!selectedDisciplinaIdForProva) {
        toast({ title: "Disciplina não selecionada", description: "Por favor, selecione uma disciplina.", variant: "destructive"});
        return;
    }
    if (!newProvaNome.trim()) {
        toast({ title: "Nome da prova obrigatório", description: "Por favor, insira o nome da prova.", variant: "destructive"});
        return;
    }
    const pesoNum = parseFloat(newProvaPeso);
    if (isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 10) {
        toast({ title: "Peso inválido", description: "O peso deve ser um número entre 0.01 e 10.", variant: "destructive"});
        return;
    }
    if (!newProvaData) {
        toast({ title: "Data da prova obrigatória", description: "Por favor, selecione a data da prova.", variant: "destructive"});
        return;
    }

    setIsProcessingProva(true);
    try {
        const provaDataToSave: Omit<ProvaData, "id"> = {
            turmaId: targetTurmaId,
            disciplinaId: selectedDisciplinaIdForProva,
            nome: newProvaNome.trim(),
            peso: pesoNum,
            data: Timestamp.fromDate(newProvaData),
            createdAt: serverTimestamp() as Timestamp,
        };

        await addDoc(collection(db, "provas"), provaDataToSave);
        toast({ title: "Prova Cadastrada!", description: `A prova "${newProvaNome.trim()}" foi salva com sucesso.`});

        setIsCadastrarProvaDialogOpen(false);
        setNewProvaNome("");
        setNewProvaPeso("");
        setNewProvaData(undefined);
        setSelectedDisciplinaIdForProva(undefined);
        if (isAdmin) {
            setSelectedTurmaIdForProva(undefined); 
        } 

    } catch (error: any) {
        console.error("Error adding prova:", error);
        let errMsg = "Ocorreu um erro ao tentar cadastrar a prova.";
        if (error.code === 'permission-denied') {
            errMsg = "Permissão negada para cadastrar a prova. Verifique as regras do Firestore.";
        }
        toast({ title: "Erro no Cadastro da Prova", description: errMsg, variant: "destructive"});
    } finally {
        setIsProcessingProva(false);
    }
  };


  const PageIconComponent = isAdmin ? Briefcase : ClipboardSignature; 
  const pageTitle = isAdmin ? "Página de Gestão Avançada" : "Painel do Representante de Turma";
  const pageDescription = isAdmin 
    ? "Ferramentas administrativas e de gestão de representantes."
    : "Ferramentas e recursos para auxiliar na gestão da turma de Medicina.";

  const canAddStudentToTurma = (isRepresentative && userProfile?.turmaId && userProfile?.turmaNome) || isAdmin;

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
            {isRepresentative && userProfile.turmaNome && (
                <>
                  {' '}(Turma: <strong className="text-primary">{userProfile.turmaNome}</strong>)
                </>
            )}
            Utilize as ferramentas abaixo para gerenciar informações.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="default" onClick={() => handleSimulatedAction("Lançar Notas da Turma")} className="w-full bg-primary hover:bg-primary/90">
              <ClipboardSignature className="mr-2 h-5 w-5" /> Lançar Notas da Turma
            </Button>
            <Button variant="secondary" onClick={() => handleSimulatedAction("Imprimir Lista de Chamada")} className="w-full">
              <Printer className="mr-2 h-5 w-5" /> Imprimir Lista de Chamada
            </Button>
            <Button variant="outline" onClick={() => handleSimulatedAction("Gerenciar Comunicados da Turma")} className="w-full">
              <Megaphone className="mr-2 h-5 w-5" /> Gerenciar Comunicados
            </Button>
            <Button variant="default" onClick={() => handleSimulatedAction("Agendar Reuniões")} className="w-full bg-primary/80 hover:bg-primary/70">
              <CalendarPlus className="mr-2 h-5 w-5" /> Agendar Reuniões
            </Button>
            
            <Dialog open={isCadastrarDisciplinaDialogOpen} onOpenChange={(isOpen) => {
                setIsCadastrarDisciplinaDialogOpen(isOpen);
                if (!isOpen) { 
                    setNewDisciplinaName("");
                    setNewDisciplinaPrioridade([3]);
                    if (isAdmin) setAdminSelectedTurmaIdForDisciplina(undefined);
                }
            }}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full">
                        <ListPlus className="mr-2 h-5 w-5" /> Cadastrar Disciplina
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cadastrar Nova Disciplina</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes da nova disciplina.
                            {isAdmin && " Selecione a turma à qual esta disciplina pertence."}
                            {!isAdmin && userProfile?.turmaNome && ` A disciplina será associada à sua turma: ${userProfile.turmaNome}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {isAdmin && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="disciplina-turma" className="text-right">Turma</Label>
                                {loadingTurmas ? (
                                    <div className="col-span-3 flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando turmas...</div>
                                ) : (
                                    <Select value={adminSelectedTurmaIdForDisciplina} onValueChange={setAdminSelectedTurmaIdForDisciplina}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione a turma" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeTurmas.map(turma => (
                                                <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                                            ))}
                                            {activeTurmas.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhuma turma ativa.</p>}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="disciplina-nome" className="text-right">Nome</Label>
                            <Input 
                                id="disciplina-nome" 
                                value={newDisciplinaName} 
                                onChange={(e) => setNewDisciplinaName(e.target.value)} 
                                className="col-span-3"
                                placeholder="Ex: Processos Biológicos II - 2025.1"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="disciplina-prioridade" className="text-right">Prioridade</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Slider
                                    id="disciplina-prioridade"
                                    min={1}
                                    max={5}
                                    step={1}
                                    value={newDisciplinaPrioridade}
                                    onValueChange={setNewDisciplinaPrioridade}
                                    className="flex-grow"
                                />
                                <span className="text-sm font-medium w-8 text-center bg-muted/50 p-1 rounded-md">
                                    {newDisciplinaPrioridade[0]}
                                </span>
                            </div>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <span className="text-right text-xs text-muted-foreground col-start-2 col-span-3">
                                Prioridade influencia a ordem na listagem de disciplinas (1 = mais alta).
                            </span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCadastrarDisciplinaDialogOpen(false)} disabled={isProcessingDisciplina}>Cancelar</Button>
                        <Button 
                            type="button" 
                            onClick={handleCadastrarDisciplina}
                            disabled={isProcessingDisciplina || !newDisciplinaName.trim() || (isAdmin && !adminSelectedTurmaIdForDisciplina && activeTurmas.length > 0)}
                        >
                           {isProcessingDisciplina ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                           {isProcessingDisciplina ? "Salvando..." : "Salvar Disciplina"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => handleSimulatedAction("Painel de Desempenho da Turma")} className="w-full">
              <BarChart3 className="mr-2 h-5 w-5" /> Desempenho da Turma
            </Button>
            
            {canAddStudentToTurma && (
              <Dialog open={isAddStudentToTurmaDialogOpen} onOpenChange={(isOpen) => {
                setIsAddStudentToTurmaDialogOpen(isOpen);
                if (!isOpen) {
                  setStudentMatriculaToAdd("");
                  if (isAdmin) setAdminSelectedTurmaId(undefined);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <UserPlus className="mr-2 h-5 w-5" /> Adicionar à Turma
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Adicionar Aluno à Turma</DialogTitle>
                    <DialogDescription>
                      {isAdmin 
                        ? "Insira a matrícula do aluno e selecione a turma de destino."
                        : `Insira a matrícula do aluno que deseja adicionar à sua turma: ${userProfile?.turmaNome}.`}
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
                    {isAdmin && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="admin-select-turma" className="text-right">
                          Turma
                        </Label>
                        {loadingTurmas ? (
                            <div className="col-span-3 flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando turmas...</div>
                        ) : (
                            <Select value={adminSelectedTurmaId} onValueChange={setAdminSelectedTurmaId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecione a turma de destino" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeTurmas.map(turma => (
                                        <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                                    ))}
                                    {activeTurmas.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhuma turma ativa encontrada.</p>}
                                </SelectContent>
                            </Select>
                        )}
                      </div>
                    )}
                    {!isAdmin && isRepresentative && userProfile?.turmaNome && (
                        <p className="text-sm text-muted-foreground col-span-4 text-center">
                            Atribuindo à sua turma: <span className="font-semibold text-foreground">{userProfile.turmaNome}</span>.
                        </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddStudentToTurmaDialogOpen(false)} disabled={isProcessingAssignment}>Cancelar</Button>
                    <Button 
                      type="button" 
                      onClick={handleAssignStudentToTurma}
                      disabled={!studentMatriculaToAdd.trim() || (isAdmin && !adminSelectedTurmaId && activeTurmas.length > 0) || isProcessingAssignment || (isAdmin && loadingTurmas)}
                    >
                      {isProcessingAssignment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isProcessingAssignment ? "Atribuindo..." : "Atribuir Aluno"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            <Button variant="default" onClick={() => handleSimulatedAction("Solicitar Materiais/Recursos")} className="w-full col-span-1 md:col-span-2 lg:col-span-1 bg-primary/70 hover:bg-primary/60">
              <PackagePlus className="mr-2 h-5 w-5" /> Solicitar Materiais
            </Button>

            <Dialog open={isCadastrarProvaDialogOpen} onOpenChange={(isOpen) => {
                setIsCadastrarProvaDialogOpen(isOpen);
                if (!isOpen) { 
                    setNewProvaNome("");
                    setNewProvaPeso("");
                    setNewProvaData(undefined);
                    setSelectedDisciplinaIdForProva(undefined);
                    if (isAdmin) setSelectedTurmaIdForProva(undefined); 
                }
            }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <BookCopy className="mr-2 h-5 w-5" /> Cadastrar Prova
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Cadastrar Nova Prova</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes da nova prova.
                            {isAdmin && " Selecione a turma e a disciplina."}
                            {!isAdmin && userProfile?.turmaNome && ` A prova será associada à sua turma: ${userProfile.turmaNome}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {isAdmin && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="prova-turma" className="text-right">Turma</Label>
                                {loadingTurmas ? (
                                    <div className="col-span-3 flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
                                ) : (
                                    <Select 
                                        value={selectedTurmaIdForProva} 
                                        onValueChange={(value) => {
                                            setSelectedTurmaIdForProva(value);
                                        }}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Selecione a turma" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeTurmas.map(turma => (
                                                <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                                            ))}
                                            {activeTurmas.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhuma turma ativa.</p>}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prova-disciplina" className="text-right">Disciplina</Label>
                            {loadingDisciplinasForProva ? (
                                <div className="col-span-3 flex items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
                            ) : (
                                <Select 
                                    value={selectedDisciplinaIdForProva} 
                                    onValueChange={setSelectedDisciplinaIdForProva}
                                    disabled={(!selectedTurmaIdForProva && !userProfile?.turmaId) || disciplinasForProvaDropdown.length === 0}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder={(!selectedTurmaIdForProva && !userProfile?.turmaId) ? "Selecione uma turma primeiro" : "Selecione a disciplina"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {disciplinasForProvaDropdown.map(disc => (
                                            <SelectItem key={disc.id} value={disc.id}>{disc.nome} (Prior: {disc.prioridade})</SelectItem>
                                        ))}
                                        {((selectedTurmaIdForProva || userProfile?.turmaId)) && disciplinasForProvaDropdown.length === 0 && !loadingDisciplinasForProva && (
                                            <p className="p-2 text-sm text-muted-foreground">Nenhuma disciplina para esta turma.</p>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prova-nome" className="text-right">Nome da Prova</Label>
                            <Input 
                                id="prova-nome" 
                                value={newProvaNome} 
                                onChange={(e) => setNewProvaNome(e.target.value)} 
                                className="col-span-3"
                                placeholder="Cognitiva 1 - PB 2 - 2025.1"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prova-peso" className="text-right">Peso</Label>
                            <Input 
                                id="prova-peso" 
                                type="number"
                                value={newProvaPeso} 
                                onChange={(e) => setNewProvaPeso(e.target.value)} 
                                className="col-span-3"
                                placeholder="Ex: 1.0 ou 0.7"
                                step="0.01"
                            />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                             <span className="text-right text-xs text-muted-foreground col-start-2 col-span-3">
                                Se um aluno tirar 10 nessa avaliação, quanto ele garante na nota final, por exemplo histologia garante 1 ponto, ou 10%.
                            </span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prova-data" className="text-right">Data da Prova</Label>
                            <Popover open={isProvaDatePickerOpen} onOpenChange={setIsProvaDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !newProvaData && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {newProvaData ? format(newProvaData, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={newProvaData}
                                        onSelect={(date) => {
                                            setNewProvaData(date);
                                            setIsProvaDatePickerOpen(false); 
                                        }}
                                        initialFocus
                                        locale={ptBR}
                                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCadastrarProvaDialogOpen(false)} disabled={isProcessingProva}>Cancelar</Button>
                        <Button 
                            type="button" 
                            onClick={handleCadastrarProva}
                            disabled={
                                isProcessingProva || 
                                !(isAdmin ? selectedTurmaIdForProva : userProfile?.turmaId) || 
                                !selectedDisciplinaIdForProva || 
                                !newProvaNome.trim() || 
                                !newProvaPeso.trim() || 
                                !newProvaData ||
                                (isAdmin && loadingTurmas) || loadingDisciplinasForProva
                            }
                        >
                           {isProcessingProva ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                           {isProcessingProva ? "Salvando..." : "Salvar Prova"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

          </div>

           {isAdmin && (
            <div className="mt-6 p-4 border border-dashed border-primary/30 rounded-md bg-primary/5">
              <h3 className="text-xl font-semibold text-primary/80 mb-2">Funções Exclusivas de Admin:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="ghost" className="text-primary border border-primary hover:bg-primary/10" onClick={() => router.push('/admin/turmas')}>
                  <Users className="mr-2 h-5 w-5" /> Gerir Turmas
                </Button>
                 {/* O botão "Teste" foi substituído pela funcionalidade "Cadastrar Prova" */}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 border border-dashed border-secondary/30 rounded-md bg-secondary/5">
            <h3 className="text-xl font-semibold text-secondary-foreground/80 mb-2">Avisos e Próximos Passos:</h3>
            <ul className="list-disc list-inside text-sm text-secondary-foreground/70 space-y-1">
              <li>As funcionalidades de "Lançar Notas", "Imprimir Chamada", etc., são simulações.</li>
              <li>A funcionalidade "Adicionar Aluno à Turma" agora interage com o Firestore.</li>
              <li>A funcionalidade "Cadastrar Disciplina" agora salva os dados no Firestore em uma coleção 'disciplinas'.</li>
              <li>A funcionalidade "Cadastrar Prova" agora salva os dados no Firestore em uma coleção 'provas'.</li>
              <li>Certifique-se de que as regras de segurança do Firestore permitem as operações necessárias nas coleções 'users', 'turmas', 'disciplinas' e 'provas'.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
    

    

    

    

    