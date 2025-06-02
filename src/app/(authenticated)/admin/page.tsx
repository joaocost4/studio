
"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { USER_ROLES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, TestTube2, Users, FileText, Trash2, Edit3, Eye, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, Timestamp, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth as firebaseAuth } from "@/lib/firebase"; // Renamed auth to firebaseAuth to avoid conflict
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
import { FIREBASE_EMAIL_DOMAIN } from "@/lib/constants";

// Interfaces for data
interface UserData {
  id: string;
  matricula: string;
  nomeCompleto: string;
  role: string;
  actualEmail?: string;
  // other fields as necessary
}

interface CalculatorData {
  id: string; // UID of the user who owns this data
  matricula: string;
  updatedAt: Timestamp;
  lastSession: Record<string, any>; // The actual calculator inputs
}

export default function AdminPage() {
  const { userProfile } = useAuth();
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN] });
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [calc1Data, setCalc1Data] = useState<CalculatorData[]>([]);
  const [calc2Data, setCalc2Data] = useState<CalculatorData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserMatricula, setNewUserMatricula] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<USER_ROLES>(USER_ROLES.USER);


  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Fetch Users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsers(usersList);

      // Fetch Calculator 1 Data
      const calc1Snapshot = await getDocs(collection(db, "calculator1Data"));
      const calc1List = calc1Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalculatorData));
      setCalc1Data(calc1List);

      // Fetch Calculator 2 Data
      const calc2Snapshot = await getDocs(collection(db, "calculator2Data"));
      const calc2List = calc2Snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalculatorData));
      setCalc2Data(calc2List);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({ title: "Erro ao carregar dados", description: "Não foi possível buscar os dados para administração.", variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (userProfile?.role === USER_ROLES.ADMIN) {
      fetchData();
    }
  }, [userProfile]);

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

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        matricula: newUserMatricula,
        nomeCompleto: newUserName,
        actualEmail: newUserEmail,
        role: newUserRole,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Usuário Adicionado", description: `Usuário ${newUserName} criado com sucesso.` });
      setIsAddUserDialogOpen(false);
      setNewUserMatricula("");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole(USER_ROLES.USER);
      fetchData(); // Refresh users list
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({ title: "Erro ao adicionar usuário", description: error.message, variant: "destructive" });
    }
  };

  const handleEditUser = (userId: string) => {
    // Placeholder: In a real app, navigate to an edit page or open a modal
    const userToEdit = users.find(u => u.id === userId);
    alert(`Editar usuário: ${userToEdit?.nomeCompleto} (ID: ${userId})\nMatrícula: ${userToEdit?.matricula}\nEmail: ${userToEdit?.actualEmail}\nRole: ${userToEdit?.role}\nFuncionalidade de edição completa a ser implementada.`);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      // Note: Deleting a user from Firestore does not delete their Firebase Auth account.
      // Proper user deletion should handle both. This example only deletes from Firestore.
      await deleteDoc(doc(db, "users", userId));
      toast({ title: "Usuário Excluído", description: `Usuário ${userName} foi excluído do Firestore.` });
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Erro ao excluir usuário", variant: "destructive" });
    }
  };

  // Calculator Data Actions
  const handleViewCalcDetails = (calcId: string, type: "Calc1" | "Calc2") => {
    const data = type === "Calc1" ? calc1Data.find(d => d.id === calcId) : calc2Data.find(d => d.id === calcId);
    alert(`Ver detalhes ${type} ID: ${calcId}\nMatrícula: ${data?.matricula}\nDados: ${JSON.stringify(data?.lastSession, null, 2)}\nFuncionalidade de visualização/edição completa a ser implementada.`);
  };

  const handleDeleteCalcData = async (calcId: string, type: "Calc1" | "Calc2", matricula: string) => {
    try {
      const collectionName = type === "Calc1" ? "calculator1Data" : "calculator2Data";
      await deleteDoc(doc(db, collectionName, calcId));
      toast({ title: `Dados da ${type} Excluídos`, description: `Dados para matrícula ${matricula} foram excluídos.` });
      fetchData(); // Refresh list
    } catch (error) {
      console.error(`Error deleting ${type} data:`, error);
      toast({ title: `Erro ao excluir dados da ${type}`, variant: "destructive" });
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
            <Button variant="destructive" onClick={() => handleAdminAction("Limpar Cache")} className="w-full">
              <TestTube2 className="mr-2 h-5 w-5" /> Limpar Cache (Simulação)
            </Button>
            <Button variant="destructive" onClick={() => handleAdminAction("Recalcular Estatísticas")} className="w-full">
              <TestTube2 className="mr-2 h-5 w-5" /> Recalcular Stats (Simulação)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users CRUD */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="mr-2 h-5 w-5" /> Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes para criar uma nova conta de usuário.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="matricula" className="text-right">Matrícula</Label>
                    <Input id="matricula" value={newUserMatricula} onChange={(e) => setNewUserMatricula(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nome" className="text-right">Nome</Label>
                    <Input id="nome" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email Real</Label>
                    <Input id="email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">Senha</Label>
                    <Input id="password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Função</Label>
                     <select id="role" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as USER_ROLES)} className="col-span-3 border border-input rounded-md p-2">
                        {Object.values(USER_ROLES).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleAddUser}>Salvar Usuário</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? <p>Carregando usuários...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.matricula}</TableCell>
                    <TableCell>{user.nomeCompleto}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.id)}>
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

      {/* Calculator 1 Data CRUD */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados - Calculadora 1</CardTitle>
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
                {calc1Data.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell>{data.matricula}</TableCell>
                    <TableCell>{data.updatedAt?.toDate().toLocaleString('pt-BR') || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewCalcDetails(data.id, "Calc1")}>
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
                {calc2Data.map((data) => (
                  <TableRow key={data.id}>
                    <TableCell>{data.matricula}</TableCell>
                    <TableCell>{data.updatedAt?.toDate().toLocaleString('pt-BR') || 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewCalcDetails(data.id, "Calc2")}>
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
              <li>A exclusão de usuários aqui remove apenas o registro do Firestore, não a conta de Autenticação Firebase. A exclusão completa de usuários requer SDK Admin do Firebase.</li>
              <li>Para que as operações de Leitura (de todos os dados) e Exclusão/Edição funcionem corretamente, suas <strong>Regras de Segurança do Firestore</strong> precisam permitir essas ações para o perfil de administrador.
                Exemplo de regra para `users` (similar para `calculator1Data` e `calculator2Data`):
                <pre className="mt-1 p-2 bg-black/10 rounded text-xs overflow-x-auto">{`
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Admins can read/write any user document
      // Users can read/write their own document
      allow read, write: if request.auth != null && 
                          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == '${USER_ROLES.ADMIN}' || request.auth.uid == userId);
    }
    // ... (regras para calculator1Data, calculator2Data com lógica similar)
  }
}`}
                </pre>
              </li>
               <li>As funcionalidades de "Editar Usuário" e "Ver Detalhes (Calculadora)" são placeholders. A implementação completa exigirá modais ou páginas de edição dedicadas.</li>
            </ul>
        </div>
      </CardFooter>
    </div>
  );
}

    