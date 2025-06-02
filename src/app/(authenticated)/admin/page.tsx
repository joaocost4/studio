
"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { USER_ROLES, UserRole, FIREBASE_EMAIL_DOMAIN } from "@/lib/constants"; // Added UserRole
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, TestTube2, Users, FileText, Trash2, Edit3, Eye, UserPlus, Search, Settings, Briefcase, PackagePlus, CalendarPlus, Megaphone, Printer, ClipboardSignature } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, doc, deleteDoc, Timestamp, setDoc, serverTimestamp, updateDoc, addDoc, query, where, getDoc as getFirestoreDoc } from "firebase/firestore"; // Aliased getDoc
import { db, auth as firebaseAuth } from "@/lib/firebase"; // Renamed to avoid conflict
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Interfaces for data
interface UserData {
  id: string; 
  uid: string; 
  matricula: string;
  nomeCompleto: string;
  role: UserRole;
  actualEmail?: string;
  turmaId?: string; 
  turmaNome?: string; // For display purposes
  createdAt?: Timestamp;
}

interface CalculatorData {
  id: string; 
  matricula: string;
  updatedAt: Timestamp;
  lastSession: Record<string, any>; 
}

interface TurmaData {
  id: string;
  nome: string;
  ativa: boolean;
  createdAt?: Timestamp;
}

interface AppSettingsData {
  avisoTrocarTurma: boolean;
  avisoRepresentante: boolean;
  avisoInstalarApp: boolean;
  updatedAt?: Timestamp;
}


export default function AdminPage() {
  const { userProfile } = useAuth();
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN] });
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [calc1Data, setCalc1Data] = useState<CalculatorData[]>([]);
  const [calc2Data, setCalc2Data] = useState<CalculatorData[]>([]);
  const [turmas, setTurmas] = useState<TurmaData[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettingsData>({
    avisoTrocarTurma: false,
    avisoRepresentante: false,
    avisoInstalarApp: false,
  });

  const [loadingData, setLoadingData] = useState(true);

  // Add User Dialog State
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserMatricula, setNewUserMatricula] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>(USER_ROLES.USER);
  const [newUserTurmaId, setNewUserTurmaId] = useState<string | undefined>(undefined);


  // Edit User Dialog State
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editUserNomeCompleto, setEditUserNomeCompleto] = useState("");
  const [editUserActualEmail, setEditUserActualEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState<UserRole>(USER_ROLES.USER);
  const [editUserTurmaId, setEditUserTurmaId] = useState<string | undefined>(undefined);


  // View Calculator Data Dialog State
  const [isViewCalcDataDialogOpen, setIsViewCalcDataDialogOpen] = useState(false);
  const [viewingCalcData, setViewingCalcData] = useState<CalculatorData | null>(null);
  const [viewingCalcDataType, setViewingCalcDataType] = useState<"Calc1" | "Calc2" | null>(null);
  
  // Search States
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [calc1SearchTerm, setCalc1SearchTerm] = useState("");
  const [calc2SearchTerm, setCalc2SearchTerm] = useState("");

  // Turma Dialog States
  const [isAddTurmaDialogOpen, setIsAddTurmaDialogOpen] = useState(false);
  const [newTurmaName, setNewTurmaName] = useState("");
  const [newTurmaAtiva, setNewTurmaAtiva] = useState(true);
  const [isEditTurmaDialogOpen, setIsEditTurmaDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<TurmaData | null>(null);
  const [editTurmaName, setEditTurmaName] = useState("");
  const [editTurmaAtiva, setEditTurmaAtiva] = useState(true);


  const activeTurmas = useMemo(() => turmas.filter(t => t.ativa), [turmas]);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const turmasSnapshot = await getDocs(collection(db, "turmas"));
      const turmasList = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TurmaData));
      setTurmas(turmasList);

      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<UserData, 'id' | 'turmaNome'>;
        const turma = turmasList.find(t => t.id === data.turmaId);
        return { 
          id: doc.id, 
          ...data,
          turmaNome: turma ? turma.nome : "N/A" 
        } as UserData;
      });
      setUsers(usersList);

      const calc1Snapshot = await getDocs(collection(db, "calculator1Data"));
      const calc1List = calc1Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalculatorData));
      setCalc1Data(calc1List);

      const calc2Snapshot = await getDocs(collection(db, "calculator2Data"));
      const calc2List = calc2Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalculatorData));
      setCalc2Data(calc2List);

      const settingsDocRef = doc(db, "settings", "appGlobalSettings");
      const settingsDocSnap = await getFirestoreDoc(settingsDocRef); // Using aliased getDoc
      if (settingsDocSnap.exists()) {
        setAppSettings(settingsDocSnap.data() as AppSettingsData);
      } else {
        // Initialize default settings if not exist
        const defaultSettings: AppSettingsData = {
          avisoTrocarTurma: false,
          avisoRepresentante: false,
          avisoInstalarApp: true, // Default to true for install prompt
          updatedAt: serverTimestamp() as Timestamp
        };
        await setDoc(settingsDocRef, defaultSettings);
        setAppSettings(defaultSettings);
      }

    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      let description = "Não foi possível buscar os dados para administração.";
      if (error.code === 'permission-denied' || error.message?.includes("Missing or insufficient permissions") || error.message?.includes("PERMISSION_DENIED")) {
        description = "Permissão negada ao buscar dados. Verifique se suas Regras de Segurança do Firestore concedem acesso de administrador e se sua conta de usuário no banco de dados possui a função (role) 'admin' corretamente configurada. Consulte as 'Notas Importantes do Admin' nesta página para um exemplo de regras.";
      }
      toast({ title: "Erro ao Carregar Dados Administrativos", description, variant: "destructive", duration: 10000 });
    } finally {
      setLoadingData(false);
    }
  }, [toast]); 

  useEffect(() => {
    if (userProfile?.role === USER_ROLES.ADMIN) {
      fetchData();
    }
  }, [userProfile, fetchData]);

  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) {
      return users;
    }
    return users.filter(user =>
      user.nomeCompleto.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.matricula.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [users, userSearchTerm]);

  const filteredCalc1Data = useMemo(() => {
    if (!calc1SearchTerm) {
      return calc1Data;
    }
    return calc1Data.filter(data =>
      data.matricula.toLowerCase().includes(calc1SearchTerm.toLowerCase())
    );
  }, [calc1Data, calc1SearchTerm]);

  const filteredCalc2Data = useMemo(() => {
    if (!calc2SearchTerm) {
      return calc2Data;
    }
    return calc2Data.filter(data =>
      data.matricula.toLowerCase().includes(calc2SearchTerm.toLowerCase())
    );
  }, [calc2Data, calc2SearchTerm]);


  const handleAdminAction = (action: string) => {
    alert(`Ação administrativa "${action}" executada! (Simulação)`);
  };

  // User CRUD Actions
  const handleAddUser = async () => {
    if (!newUserMatricula || !newUserName || !newUserEmail || !newUserPassword) {
      toast({ title: "Campos obrigatórios", description: "Preencha matrícula, nome, email e senha.", variant: "destructive" });
      return;
    }
    try {
      const firebaseAuthEmail = `${newUserMatricula}@${FIREBASE_EMAIL_DOMAIN}`;
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, firebaseAuthEmail, newUserPassword);
      const user = userCredential.user;

      const userDocData: Omit<UserData, 'id' | 'turmaNome' | 'createdAt'> & { createdAt: any } = {
        uid: user.uid,
        matricula: newUserMatricula,
        nomeCompleto: newUserName,
        actualEmail: newUserEmail,
        role: newUserRole,
        createdAt: serverTimestamp(),
      };
      if (newUserTurmaId) {
        userDocData.turmaId = newUserTurmaId;
      }

      await setDoc(doc(db, "users", user.uid), userDocData);

      toast({ title: "Usuário Adicionado", description: `Usuário ${newUserName} criado com sucesso.` });
      setIsAddUserDialogOpen(false);
      setNewUserMatricula("");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole(USER_ROLES.USER);
      setNewUserTurmaId(undefined);
      fetchData(); 
    } catch (error: any) {
      console.error("Error adding user:", error);
      let description = "Ocorreu um erro desconhecido ao adicionar o usuário.";
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            description = `A matrícula "${newUserMatricula}" já está em uso (email ${newUserMatricula}@${FIREBASE_EMAIL_DOMAIN} já existe).`;
            break;
          case 'auth/invalid-email':
            description = `O formato da matrícula é inválido para criar o email de autenticação (${newUserMatricula}@${FIREBASE_EMAIL_DOMAIN}).`;
            break;
          case 'auth/weak-password':
            description = "A senha fornecida é muito fraca. Use pelo menos 6 caracteres.";
            break;
          case 'auth/operation-not-allowed':
            description = "A criação de usuários com email/senha não está habilitada no seu projeto Firebase.";
            break;
          case 'auth/invalid-credential':
             description = "As credenciais fornecidas para a criação do usuário são inválidas (erro inesperado).";
             break;
          default:
            description = error.message || "Erro desconhecido.";
        }
      }
      toast({ title: "Erro ao adicionar usuário", description, variant: "destructive" });
    }
  };
  
  const handleEditUserClick = (user: UserData) => {
    setEditingUser(user);
    setEditUserNomeCompleto(user.nomeCompleto);
    setEditUserActualEmail(user.actualEmail || "");
    setEditUserRole(user.role);
    setEditUserTurmaId(user.turmaId || undefined);
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const userDocRef = doc(db, "users", editingUser.id);
      const updateData: Partial<UserData> = {
        nomeCompleto: editUserNomeCompleto,
        actualEmail: editUserActualEmail,
        role: editUserRole,
      };
      if (editUserTurmaId) {
        updateData.turmaId = editUserTurmaId;
      } else {
        updateData.turmaId = undefined; 
      }
      await updateDoc(userDocRef, updateData);
      toast({ title: "Usuário Atualizado", description: `Dados de ${editUserNomeCompleto} atualizados.` });
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({ title: "Erro ao atualizar usuário", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({ title: "Usuário Excluído", description: `Usuário ${userName} foi excluído do Firestore.` });
      fetchData(); 
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Erro ao excluir usuário", variant: "destructive" });
    }
  };

  // Calculator Data Actions
  const handleViewCalcDetailsClick = (calcData: CalculatorData, type: "Calc1" | "Calc2") => {
    setViewingCalcData(calcData);
    setViewingCalcDataType(type);
    setIsViewCalcDataDialogOpen(true);
  };

  const handleDeleteCalcData = async (calcId: string, type: "Calc1" | "Calc2", matricula: string) => {
    try {
      const collectionName = type === "Calc1" ? "calculator1Data" : "calculator2Data";
      await deleteDoc(doc(db, collectionName, calcId));
      toast({ title: `Dados da ${type} Excluídos`, description: `Dados para matrícula ${matricula} foram excluídos.` });
      fetchData(); 
    } catch (error) {
      console.error(`Error deleting ${type} data:`, error);
      toast({ title: `Erro ao excluir dados da ${type}`, variant: "destructive" });
    }
  };

  // Turma CRUD Actions
  const handleAddTurma = async () => {
    if (!newTurmaName.trim()) {
      toast({ title: "Nome da Turma Obrigatório", description: "Por favor, insira um nome para a turma.", variant: "destructive" });
      return;
    }
    try {
      await addDoc(collection(db, "turmas"), {
        nome: newTurmaName,
        ativa: newTurmaAtiva,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Turma Adicionada", description: `Turma "${newTurmaName}" criada com sucesso.` });
      setIsAddTurmaDialogOpen(false);
      setNewTurmaName("");
      setNewTurmaAtiva(true);
      fetchData();
    } catch (error) {
      console.error("Error adding turma:", error);
      toast({ title: "Erro ao adicionar turma", variant: "destructive" });
    }
  };

  const handleEditTurmaClick = (turma: TurmaData) => {
    setEditingTurma(turma);
    setEditTurmaName(turma.nome);
    setEditTurmaAtiva(turma.ativa);
    setIsEditTurmaDialogOpen(true);
  };

  const handleUpdateTurma = async () => {
    if (!editingTurma || !editTurmaName.trim()) {
      toast({ title: "Nome da Turma Obrigatório", description: "Por favor, insira um nome para a turma.", variant: "destructive" });
      return;
    }
    try {
      const turmaDocRef = doc(db, "turmas", editingTurma.id);
      await updateDoc(turmaDocRef, {
        nome: editTurmaName,
        ativa: editTurmaAtiva,
      });
      toast({ title: "Turma Atualizada", description: `Turma "${editTurmaName}" atualizada.` });
      setIsEditTurmaDialogOpen(false);
      setEditingTurma(null);
      fetchData();
    } catch (error) {
      console.error("Error updating turma:", error);
      toast({ title: "Erro ao atualizar turma", variant: "destructive" });
    }
  };

  const handleDeleteTurma = async (turmaId: string, turmaName: string) => {
    const usersInTurmaQuery = query(collection(db, "users"), where("turmaId", "==", turmaId));
    const usersInTurmaSnapshot = await getDocs(usersInTurmaQuery);

    if (!usersInTurmaSnapshot.empty) {
        toast({ 
            title: "Exclusão Bloqueada", 
            description: `A turma "${turmaName}" não pode ser excluída pois há ${usersInTurmaSnapshot.size} usuário(s) associado(s) a ela. Remova os usuários da turma primeiro.`,
            variant: "destructive",
            duration: 7000 
        });
        return;
    }

    try {
      await deleteDoc(doc(db, "turmas", turmaId));
      toast({ title: "Turma Excluída", description: `Turma "${turmaName}" foi excluída.` });
      fetchData();
    } catch (error) {
      console.error("Error deleting turma:", error);
      toast({ title: "Erro ao excluir turma", variant: "destructive" });
    }
  };

  // App Settings Toggle
  const handleSettingToggle = async (settingKey: keyof AppSettingsData, value: boolean) => {
    try {
      const settingsDocRef = doc(db, "settings", "appGlobalSettings");
      await setDoc(settingsDocRef, {
        ...appSettings, 
        [settingKey]: value,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      setAppSettings(prev => ({ ...prev, [settingKey]: value })); 

      let settingName = "";
      if (settingKey === 'avisoTrocarTurma') settingName = "Aviso Trocar Turma";
      else if (settingKey === 'avisoRepresentante') settingName = "Aviso Representante";
      else if (settingKey === 'avisoInstalarApp') settingName = "Aviso Instalar App";
      
      toast({ title: "Configuração Atualizada", description: `${settingName} ${value ? 'ativado' : 'desativado'}.` });
    } catch (error) {
      console.error("Error updating setting:", error);
      toast({ title: "Erro ao atualizar configuração", variant: "destructive" });
    }
  };


  if (!userProfile || userProfile.role !== USER_ROLES.ADMIN) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="shadow-lg border-2 border-destructive/50 rounded-xl">
        <CardHeader className="text-center bg-destructive/10">
          <ShieldCheck className="mx-auto h-16 w-16 text-destructive mb-4" />
          <CardTitle className="text-3xl font-headline text-destructive">Página de Testes Administrativa</CardTitle>
          <CardDescription className="text-muted-foreground">Recursos e testes exclusivos para administradores.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-lg text-foreground">
            Olá, Administrador <strong className="text-primary">{userProfile.matricula}</strong>!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="destructive" onClick={() => handleAdminAction("Recalcular Estatísticas")} className="w-full">
              <TestTube2 className="mr-2 h-5 w-5" /> Recalcular Stats (Simulação)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users CRUD */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="mr-2 h-5 w-5" /> Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes para criar uma nova conta de usuário. O email de autenticação será {`matricula@${FIREBASE_EMAIL_DOMAIN}`}.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-matricula" className="text-right">Matrícula</Label>
                    <Input id="add-matricula" value={newUserMatricula} onChange={(e) => setNewUserMatricula(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-nome" className="text-right">Nome</Label>
                    <Input id="add-nome" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-email" className="text-right">Email Real</Label>
                    <Input id="add-email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-password" className="text-right">Senha</Label>
                    <Input id="add-password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-role" className="text-right">Função</Label>
                     <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(USER_ROLES).map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-user-turma" className="text-right">Turma</Label>
                    <Select value={newUserTurmaId} onValueChange={(value) => setNewUserTurmaId(value === 'none' ? undefined : value)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione uma turma (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {activeTurmas.map(turma => (
                                <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleAddUser}>Salvar Usuário</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
           <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuários por matrícula ou nome..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? <p>Carregando usuários...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.matricula}</TableCell>
                    <TableCell>{user.nomeCompleto}</TableCell>
                    <TableCell>{user.turmaNome || "N/A"}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditUserClick(user)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o usuário {user.nomeCompleto} ({user.matricula})? Esta ação não pode ser desfeita e removerá o usuário do Firestore (não da Autenticação Firebase).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.nomeCompleto)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Modifique os dados do usuário. A matrícula não pode ser alterada.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-matricula" className="text-right">Matrícula</Label>
                <Input id="edit-matricula" value={editingUser.matricula} readOnly className="col-span-3 bg-muted/50" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nomeCompleto" className="text-right">Nome</Label>
                <Input id="edit-nomeCompleto" value={editUserNomeCompleto} onChange={(e) => setEditUserNomeCompleto(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-actualEmail" className="text-right">Email Real</Label>
                <Input id="edit-actualEmail" type="email" value={editUserActualEmail} onChange={(e) => setEditUserActualEmail(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">Função</Label>
                <Select value={editUserRole} onValueChange={(value) => setEditUserRole(value as UserRole)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(USER_ROLES).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-user-turma" className="text-right">Turma</Label>
                 <Select value={editUserTurmaId} onValueChange={(value) => setEditUserTurmaId(value === 'none' ? undefined : value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione uma turma (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {activeTurmas.map(turma => (
                            <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={handleUpdateUser}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Turmas CRUD */}
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Gerenciamento de Turmas</CardTitle>
                    <Dialog open={isAddTurmaDialogOpen} onOpenChange={setIsAddTurmaDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Users className="mr-2 h-5 w-5" /> Adicionar Turma</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Adicionar Nova Turma</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="turma-name" className="text-right">Nome</Label>
                                    <Input id="turma-name" value={newTurmaName} onChange={(e) => setNewTurmaName(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="turma-ativa" className="text-right">Ativa</Label>
                                    <Switch id="turma-ativa" checked={newTurmaAtiva} onCheckedChange={setNewTurmaAtiva} className="col-span-3 justify-self-start" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddTurma}>Salvar Turma</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {loadingData ? <p>Carregando turmas...</p> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome da Turma</TableHead>
                                <TableHead>Ativa</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {turmas.map((turma) => (
                                <TableRow key={turma.id}>
                                    <TableCell>{turma.nome}</TableCell>
                                    <TableCell>{turma.ativa ? "Sim" : "Não"}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditTurmaClick(turma)}>
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tem certeza que deseja excluir a turma "{turma.nome}"? Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteTurma(turma.id, turma.nome)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>

        {/* Edit Turma Dialog */}
        {editingTurma && (
            <Dialog open={isEditTurmaDialogOpen} onOpenChange={setIsEditTurmaDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Turma</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-turma-name" className="text-right">Nome</Label>
                            <Input id="edit-turma-name" value={editTurmaName} onChange={(e) => setEditTurmaName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-turma-ativa" className="text-right">Ativa</Label>
                            <Switch id="edit-turma-ativa" checked={editTurmaAtiva} onCheckedChange={setEditTurmaAtiva} className="col-span-3 justify-self-start" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditTurmaDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdateTurma}>Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}

       {/* App Global Settings Card */}
        <Card>
            <CardHeader>
                <CardTitle>Configurações Gerais do Aplicativo</CardTitle>
                <CardDescription>Ajustes que afetam o comportamento global do app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loadingData ? <p>Carregando configurações...</p> : (
                    <>
                        <div className="flex items-center justify-between p-3 border rounded-md">
                            <Label htmlFor="aviso-trocar-turma" className="flex flex-col space-y-1">
                                <span>Aviso "Trocar Turma"</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Exibir aviso ao usuário sobre como trocar de turma (se aplicável).
                                </span>
                            </Label>
                            <Switch
                                id="aviso-trocar-turma"
                                checked={appSettings.avisoTrocarTurma}
                                onCheckedChange={(value) => handleSettingToggle('avisoTrocarTurma', value)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-md">
                             <Label htmlFor="aviso-representante" className="flex flex-col space-y-1">
                                <span>Aviso "Representante"</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Exibir informações ou contatos do representante da turma.
                                </span>
                            </Label>
                            <Switch
                                id="aviso-representante"
                                checked={appSettings.avisoRepresentante}
                                onCheckedChange={(value) => handleSettingToggle('avisoRepresentante', value)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-md">
                            <Label htmlFor="aviso-instalar-app" className="flex flex-col space-y-1">
                                <span>Aviso "Instalar App"</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Exibir prompt ou banner para instalar o PWA.
                                </span>
                            </Label>
                            <Switch
                                id="aviso-instalar-app"
                                checked={appSettings.avisoInstalarApp}
                                onCheckedChange={(value) => handleSettingToggle('avisoInstalarApp', value)}
                            />
                        </div>
                    </>
                )}
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Última atualização das configurações: {appSettings.updatedAt?.toDate().toLocaleString('pt-BR') || 'N/A'}
                </p>
            </CardFooter>
        </Card>


      {/* View Calculator Data Dialog */}
      {viewingCalcData && viewingCalcDataType && (
        <Dialog open={isViewCalcDataDialogOpen} onOpenChange={setIsViewCalcDataDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes - {viewingCalcDataType === "Calc1" ? "Calculadora 1" : "Calculadora 2"}</DialogTitle>
              <DialogDescription>
                Dados da sessão para matrícula: {viewingCalcData.matricula} <br/>
                Última atualização: {viewingCalcData.updatedAt?.toDate().toLocaleString('pt-BR') || 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4 max-h-[60vh] overflow-y-auto">
              {Object.entries(viewingCalcData.lastSession).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 items-center gap-4 text-sm">
                  <Label htmlFor={`view-${key}`} className="text-right col-span-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</Label>
                  <Input id={`view-${key}`} value={String(value ?? 'N/A')} readOnly className="col-span-2 bg-muted/50" />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewCalcDataDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Calculator 1 Data CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados - Calculadora 1</CardTitle>
            <div className="relative mt-4">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por matrícula..."
                  value={calc1SearchTerm}
                  onChange={(e) => setCalc1SearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
            </div>
        </CardHeader>
        <CardContent>
          {loadingData ? <p>Carregando dados da Calculadora 1...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Data/Hora (Última Atualização)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalc1Data.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell>{data.matricula}</TableCell>
                    <TableCell>{data.updatedAt?.toDate().toLocaleString('pt-BR') || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewCalcDetailsClick(data, "Calc1")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir os dados da Calculadora 1 para a matrícula {data.matricula}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCalcData(data.id, "Calc1", data.matricula)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Calculator 2 Data CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados - Calculadora 2</CardTitle>
           <div className="relative mt-4">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por matrícula..."
                  value={calc2SearchTerm}
                  onChange={(e) => setCalc2SearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
            </div>
        </CardHeader>
        <CardContent>
          {loadingData ? <p>Carregando dados da Calculadora 2...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Data/Hora (Última Atualização)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalc2Data.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell>{data.matricula}</TableCell>
                    <TableCell>{data.updatedAt?.toDate().toLocaleString('pt-BR') || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewCalcDetailsClick(data, "Calc2")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir os dados da Calculadora 2 para a matrícula {data.matricula}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCalcData(data.id, "Calc2", data.matricula)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

       <CardFooter className="mt-6 p-4 border border-dashed border-destructive/30 rounded-md bg-destructive/5">
        <div className="space-y-2">
            <h3 className="text-xl font-semibold text-destructive/80 mb-2">Notas Importantes do Admin:</h3>
            <ul className="list-disc list-inside text-sm text-destructive/70 space-y-1">
              <li>A exclusão de usuários aqui remove apenas o registro do Firestore, não a conta de Autenticação Firebase. A exclusão completa de usuários requer SDK Admin do Firebase ou intervenção manual no console.</li>
              <li>A alteração de matrícula (e, por consequência, o email de autenticação do Firebase) e senha não são cobertas pela funcionalidade de "Editar Usuário" atual.</li>
              <li>Para que todas as operações CRUD funcionem, suas <strong>Regras de Segurança do Firestore</strong> precisam permitir essas ações para o perfil de administrador. Exemplo:
                <pre className="mt-1 p-2 bg-black/10 rounded text-xs overflow-x-auto">{`
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == '${USER_ROLES.ADMIN}' || 
                           request.auth.uid == userId);
    }
    // Calculator Data
    match /calculator1Data/{docId} {
      allow read, write: if request.auth != null &&
                          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == '${USER_ROLES.ADMIN}' ||
                           request.auth.uid == docId);
    }
    match /calculator2Data/{docId} {
      allow read, write: if request.auth != null &&
                          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == '${USER_ROLES.ADMIN}' ||
                           request.auth.uid == docId);
    }
    // Turmas
    match /turmas/{turmaId} {
      allow read, write: if request.auth != null && 
                           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == '${USER_ROLES.ADMIN}';
      // Allow authenticated users to read turmas list for selection
      // allow list: if request.auth != null; // Consider this if non-admins need to list turmas
    }
    // App Settings
    match /settings/appGlobalSettings {
       allow read, write: if request.auth != null && 
                           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == '${USER_ROLES.ADMIN}';
    }
  }
}`}
                </pre>
              </li>
               <li>Ao excluir uma turma, verifique se há usuários associados. O sistema atualmente impede a exclusão se houver usuários vinculados.</li>
            </ul>
        </div>
      </CardFooter>
    </div>
  );
}

