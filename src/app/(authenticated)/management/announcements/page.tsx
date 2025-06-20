
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { USER_ROLES } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Edit, Trash2, CalendarIcon, AlertTriangle, Megaphone } from "lucide-react";
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FullComunicadoData, TurmaData } from "@/contexts/AuthContext";

export default function GerenciarComunicadosPage() {
  const { userProfile, allTurmas, loadingSessionData: authLoading } = useAuth();
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.REPRESENTATIVE] });
  const { toast } = useToast();

  const [comunicadosList, setComunicadosList] = useState<FullComunicadoData[]>([]);
  const [activeTurmasForSelect, setActiveTurmasForSelect] = useState<TurmaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentComunicado, setCurrentComunicado] = useState<FullComunicadoData | null>(null); // For editing
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [formTargetTurmaId, setFormTargetTurmaId] = useState<string | undefined>(undefined);
  const [formSendToAll, setFormSendToAll] = useState(false);

  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;
  const isRepresentative = userProfile?.role === USER_ROLES.REPRESENTATIVE;

  const mapTurmaIdToName = useCallback((turmaId: string) => {
    if (turmaId === "ALL") return "Todas as Turmas";
    const turma = allTurmas.find(t => t.id === turmaId);
    return turma?.nome || "Turma Desconhecida";
  }, [allTurmas]);

  const fetchComunicados = useCallback(async () => {
    if (!userProfile) return;
    setIsLoading(true);
    try {
      let q;
      if (isAdmin) {
        q = query(collection(db, "comunicados"), orderBy("createdAt", "desc"));
      } else if (isRepresentative && userProfile.turmaId) {
        q = query(
          collection(db, "comunicados"),
          where("createdByUid", "==", userProfile.uid),
          orderBy("createdAt", "desc")
          // Further filtering by targetTurmaId == userProfile.turmaId could be done client-side
          // or by adding a composite index if strictly needed for all representative queries.
          // For simplicity, allowing reps to see all they created, and client-side handles display logic.
        );
      } else {
        setComunicadosList([]);
        setIsLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);
      const fetchedComunicados = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          targetTurmaName: mapTurmaIdToName(data.targetTurmaId),
          createdAt: data.createdAt, // Keep as Timestamp for sorting
          expiryDate: data.expiryDate, // Keep as Timestamp
        } as FullComunicadoData;
      });
      
      if(isRepresentative && userProfile.turmaId){
        setComunicadosList(fetchedComunicados.filter(c => c.targetTurmaId === userProfile.turmaId || c.targetTurmaId === "ALL"));
      } else {
        setComunicadosList(fetchedComunicados);
      }

    } catch (error) {
      console.error("Error fetching comunicados: ", error);
      toast({ title: "Erro ao buscar comunicados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, isAdmin, isRepresentative, toast, mapTurmaIdToName]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchComunicados();
      if (isAdmin) {
        setActiveTurmasForSelect(allTurmas.filter(t => t.ativa));
      }
    }
  }, [authLoading, userProfile, fetchComunicados, isAdmin, allTurmas]);


  const resetFormFields = () => {
    setCurrentComunicado(null);
    setFormTitle("");
    setFormMessage("");
    setFormExpiryDate(addDays(new Date(), 7));
    setFormTargetTurmaId(undefined);
    setFormSendToAll(false);
  };

  const handleOpenCreateDialog = () => {
    resetFormFields();
    if (isRepresentative && userProfile?.turmaId) {
      setFormTargetTurmaId(userProfile.turmaId); // Pre-select for representative
    }
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (comunicado: FullComunicadoData) => {
    setCurrentComunicado(comunicado);
    setFormTitle(comunicado.title);
    setFormMessage(comunicado.message);
    setFormExpiryDate(comunicado.expiryDate.toDate());
    setFormTargetTurmaId(comunicado.targetTurmaId === "ALL" ? undefined : comunicado.targetTurmaId);
    setFormSendToAll(comunicado.targetTurmaId === "ALL");
    setIsFormDialogOpen(true);
  };

  const handleSaveComunicado = async () => {
    if (!userProfile) return;
    if (!formTitle.trim() || !formMessage.trim() || !formExpiryDate) {
      toast({ title: "Campos obrigatórios incompletos", variant: "destructive" });
      return;
    }

    let finalTargetTurmaId = "";
    if (isAdmin) {
      finalTargetTurmaId = formSendToAll ? "ALL" : formTargetTurmaId || "";
      if (!formSendToAll && !formTargetTurmaId) {
         toast({ title: "Admin: Selecione uma turma ou 'Todas as Turmas'", variant: "destructive"});
         return;
      }
    } else if (isRepresentative && userProfile.turmaId) {
      finalTargetTurmaId = userProfile.turmaId;
    } else {
      toast({ title: "Não foi possível determinar a turma alvo.", variant: "destructive" });
      return;
    }
    
    setIsProcessingAction(true);
    try {
      const comunicadoData = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        expiryDate: Timestamp.fromDate(formExpiryDate),
        targetTurmaId: finalTargetTurmaId,
        createdByUid: userProfile.uid,
        // createdAt and updatedAt will be handled by serverTimestamp
      };

      if (currentComunicado) { // Update
        const docRef = doc(db, "comunicados", currentComunicado.id);
        await updateDoc(docRef, { ...comunicadoData, updatedAt: serverTimestamp() });
        toast({ title: "Comunicado Atualizado!" });
      } else { // Create
        await addDoc(collection(db, "comunicados"), { ...comunicadoData, createdAt: serverTimestamp() });
        toast({ title: "Comunicado Criado!" });
      }
      setIsFormDialogOpen(false);
      resetFormFields();
      fetchComunicados(); // Refresh list
    } catch (error: any) {
      console.error("Error saving comunicado: ", error);
      toast({ title: "Erro ao salvar comunicado", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!currentComunicado || !currentComunicado.id) return;
    setIsProcessingAction(true);
    try {
      await deleteDoc(doc(db, "comunicados", currentComunicado.id));
      toast({ title: "Comunicado Excluído!" });
      setIsDeleteDialogOpen(false);
      setCurrentComunicado(null);
      fetchComunicados(); // Refresh list
    } catch (error: any) {
      console.error("Error deleting comunicado: ", error);
      toast({ title: "Erro ao excluir comunicado", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const canManageComunicado = (comunicado: FullComunicadoData): boolean => {
    if (isAdmin) return true;
    if (isRepresentative && userProfile && comunicado.createdByUid === userProfile.uid) {
      return true;
    }
    return false;
  };


  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-headline text-primary flex items-center">
                <Megaphone className="mr-3 h-8 w-8" /> Gerenciar Comunicados
              </CardTitle>
              <CardDescription>
                Crie, edite ou exclua comunicados para as turmas.
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreateDialog} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Comunicado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {comunicadosList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhum comunicado encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Turma Alvo</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comunicadosList.map((comunicado) => (
                    <TableRow key={comunicado.id}>
                      <TableCell className="font-medium max-w-xs truncate" title={comunicado.title}>{comunicado.title}</TableCell>
                      <TableCell>{comunicado.targetTurmaName}</TableCell>
                      <TableCell>{format(comunicado.expiryDate.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>{format(comunicado.createdAt.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {canManageComunicado(comunicado) && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(comunicado)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon"
                              onClick={() => {
                                setCurrentComunicado(comunicado);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
        setIsFormDialogOpen(isOpen);
        if (!isOpen) resetFormFields();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentComunicado ? "Editar Comunicado" : "Criar Novo Comunicado"}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes abaixo.
              {isRepresentative && userProfile?.turmaNome && ` Este comunicado será para a turma: ${userProfile.turmaNome}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1.5">
              <Label htmlFor="comunicado-title">Título</Label>
              <Input id="comunicado-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Manutenção Programada" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comunicado-message">Mensagem</Label>
              <Textarea id="comunicado-message" value={formMessage} onChange={(e) => setFormMessage(e.target.value)} placeholder="Detalhes do comunicado..." rows={5} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comunicado-expiry">Expira em</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${!formExpiryDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formExpiryDate ? format(formExpiryDate, "PPP HH:mm", { locale: ptBR }) : <span>Escolha data e hora</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formExpiryDate}
                    onSelect={setFormExpiryDate}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  />
                  {/* Basic time selection could be added here if needed */}
                   <Input 
                      type="time" 
                      className="mt-2"
                      defaultValue={formExpiryDate ? format(formExpiryDate, "HH:mm") : "09:00"}
                      onChange={(e) => {
                        if (formExpiryDate) {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newDate = new Date(formExpiryDate);
                            newDate.setHours(hours, minutes);
                            setFormExpiryDate(newDate);
                        }
                      }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {isAdmin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="comunicado-turma">Turma Específica</Label>
                  <Select
                    value={formTargetTurmaId}
                    onValueChange={setFormTargetTurmaId}
                    disabled={formSendToAll || authLoading || activeTurmasForSelect.length === 0}
                  >
                    <SelectTrigger id="comunicado-turma">
                      <SelectValue placeholder={authLoading ? "Carregando turmas..." : "Selecione uma turma"} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTurmasForSelect.map(turma => (
                        <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comunicado-send-all"
                    checked={formSendToAll}
                    onCheckedChange={(checked) => setFormSendToAll(Boolean(checked))}
                  />
                  <Label htmlFor="comunicado-send-all" className="text-sm font-normal">
                    Enviar para todas as turmas ativas
                  </Label>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isProcessingAction}>Cancelar</Button></DialogClose>
            <Button type="button" onClick={handleSaveComunicado} disabled={isProcessingAction}>
              {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {currentComunicado ? "Salvar Alterações" : "Criar Comunicado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o comunicado "{currentComunicado?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentComunicado(null)} disabled={isProcessingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90" disabled={isProcessingAction}>
              {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

