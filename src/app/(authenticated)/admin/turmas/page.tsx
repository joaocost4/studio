
"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { USER_ROLES, UserRole } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Edit3, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, doc, deleteDoc, Timestamp, serverTimestamp, updateDoc, addDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface TurmaData {
  id: string;
  nome: string;
  ativa: boolean;
  createdAt?: Timestamp;
}

export default function GerirTurmasPage() {
  const { userProfile } = useAuth();
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN] });
  const { toast } = useToast();

  const [turmas, setTurmas] = useState<TurmaData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Turma Dialog States
  const [isAddTurmaDialogOpen, setIsAddTurmaDialogOpen] = useState(false);
  const [newTurmaName, setNewTurmaName] = useState("");
  const [newTurmaAtiva, setNewTurmaAtiva] = useState(true);
  const [isEditTurmaDialogOpen, setIsEditTurmaDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<TurmaData | null>(null);
  const [editTurmaName, setEditTurmaName] = useState("");
  const [editTurmaAtiva, setEditTurmaAtiva] = useState(true);

  const fetchTurmas = useCallback(async () => {
    setLoadingData(true);
    try {
      const turmasSnapshot = await getDocs(collection(db, "turmas"));
      const turmasList = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TurmaData));
      setTurmas(turmasList);
    } catch (error: any) {
      console.error("Error fetching turmas data:", error);
      let description = "Não foi possível buscar os dados das turmas.";
      if (error.code === 'permission-denied' || error.message?.includes("Missing or insufficient permissions")) {
        description = "Permissão negada ao buscar dados das turmas. Verifique suas Regras de Segurança do Firestore.";
      }
      toast({ title: "Erro ao Carregar Turmas", description, variant: "destructive", duration: 7000 });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (userProfile?.role === USER_ROLES.ADMIN) {
      fetchTurmas();
    }
  }, [userProfile, fetchTurmas]);

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
      fetchTurmas();
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
      fetchTurmas();
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
      fetchTurmas();
    } catch (error) {
      console.error("Error deleting turma:", error);
      toast({ title: "Erro ao excluir turma", variant: "destructive" });
    }
  };

  if (!userProfile || userProfile.role !== USER_ROLES.ADMIN) {
    return ( // Fallback, useRequireAuth handles redirection
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Acesso Negado.</p>
      </div>
    );
  }
  
  if (loadingData) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Carregando Turmas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-headline">Gerenciamento de Turmas</CardTitle>
                <Dialog open={isAddTurmaDialogOpen} onOpenChange={setIsAddTurmaDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Users className="mr-2 h-5 w-5" /> Adicionar Nova Turma</Button>
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
                            <Button type="button" onClick={() => setIsAddTurmaDialogOpen(false)} variant="outline">Cancelar</Button>
                            <Button onClick={handleAddTurma}>Salvar Turma</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome da Turma</TableHead>
                        <TableHead>Ativa</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {turmas.map((turma) => (
                        <TableRow key={turma.id}>
                            <TableCell className="font-medium">{turma.nome}</TableCell>
                            <TableCell>{turma.ativa ? "Sim" : "Não"}</TableCell>
                            <TableCell>{turma.createdAt?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditTurmaClick(turma)} aria-label="Editar Turma">
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Excluir Turma">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tem certeza que deseja excluir a turma "{turma.nome}"? Esta ação não pode ser desfeita.
                                                Verifique se não há usuários associados a esta turma antes de excluí-la.
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
            {turmas.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhuma turma cadastrada.</p>
            )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">Total de turmas: {turmas.length}</p>
        </CardFooter>
      </Card>

      {/* Edit Turma Dialog */}
      {editingTurma && (
          <Dialog open={isEditTurmaDialogOpen} onOpenChange={setIsEditTurmaDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                      <DialogTitle>Editar Turma</DialogTitle>
                      <DialogDescription>Modifique o nome ou o status de ativação da turma.</DialogDescription>
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
                      <Button type="button" variant="outline" onClick={() => setIsEditTurmaDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleUpdateTurma}>Salvar Alterações</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
    </div>
  );
}
    