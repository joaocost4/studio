
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/contexts/AuthContext"; // Assuming UserProfile is exported
import type { Timestamp } from "firebase/firestore";
import { AlertTriangle, Info } from "lucide-react";

interface TurmaData {
  id: string;
  nome: string;
  ativa: boolean;
  createdAt?: Timestamp;
}

interface TurmaSelectionDialogProps {
  userProfile: UserProfile;
  activeTurmas: TurmaData[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTurmaSelected: () => Promise<void>; // Callback after turma is successfully selected and profile refreshed
}

export function TurmaSelectionDialog({
  userProfile,
  activeTurmas,
  isOpen,
  onOpenChange,
  onTurmaSelected,
}: TurmaSelectionDialogProps) {
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | undefined>(
    activeTurmas.find(t => t.id === userProfile.turmaId)?.id || undefined
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const currentTurmaIsInactive = userProfile.turmaId && !activeTurmas.some(t => t.id === userProfile.turmaId && t.ativa);


  const handleSave = async () => {
    if (!selectedTurmaId) {
      toast({
        title: "Seleção Necessária",
        description: "Por favor, selecione uma turma.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", userProfile.uid);
      await updateDoc(userDocRef, {
        turmaId: selectedTurmaId,
      });
      toast({
        title: "Turma Atualizada!",
        description: "Sua turma foi salva com sucesso.",
      });
      await onTurmaSelected(); // This will refresh context and close dialog via parent state
    } catch (error) {
      console.error("Error updating turmaId:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível atualizar sua turma. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const dialogTitle = !userProfile.turmaId 
    ? "Bem-vindo(a)! Selecione sua Turma" 
    : currentTurmaIsInactive 
    ? "Sua Turma está Inativa"
    : "Atualizar Turma";

  const dialogDescription = !userProfile.turmaId
    ? "Para continuar, precisamos saber a qual turma você pertence. Por favor, escolha uma na lista abaixo."
    : currentTurmaIsInactive
    ? "A turma à qual você estava associado(a) não está mais ativa. Por favor, selecione uma nova turma ativa para continuar."
    : "Você pode atualizar sua turma aqui se necessário.";


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        // Prevent closing if no turma is selected and it's mandatory
        if (!open && !userProfile.turmaId && activeTurmas.length > 0) {
             toast({ title: "Seleção de Turma Necessária", description: "Por favor, selecione uma turma para prosseguir.", variant: "destructive"});
             return; // Don't close
        }
         if (!open && currentTurmaIsInactive && activeTurmas.length > 0) {
             toast({ title: "Seleção de Turma Ativa Necessária", description: "Por favor, selecione uma turma ativa para prosseguir.", variant: "destructive"});
             return; // Don't close
        }
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {(!userProfile.turmaId || currentTurmaIsInactive) && activeTurmas.length > 0 && <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />}
            {activeTurmas.length === 0 && <Info className="mr-2 h-5 w-5 text-blue-500" />}
             {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {activeTurmas.length > 0 ? dialogDescription : "Não há turmas ativas disponíveis no momento. Por favor, entre em contato com um administrador."}
          </DialogDescription>
        </DialogHeader>

        {activeTurmas.length > 0 && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-2">
              <Label htmlFor="turma-select" className="text-left mb-1">
                Selecione sua Turma Ativa:
              </Label>
              <Select
                value={selectedTurmaId}
                onValueChange={setSelectedTurmaId}
              >
                <SelectTrigger id="turma-select" className="w-full">
                  <SelectValue placeholder="Escolha uma turma..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTurmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
            {activeTurmas.length === 0 ? (
                 <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Entendido
                    </Button>
                </DialogClose>
            ) : (
                 <>
                    {(!userProfile.turmaId || currentTurmaIsInactive) ? (
                        <div className="text-xs text-muted-foreground">
                            A seleção é necessária para continuar.
                        </div>
                     ) : <div/>} 
                    <Button type="button" onClick={handleSave} disabled={isSaving || !selectedTurmaId}>
                        {isSaving ? "Salvando..." : "Salvar Turma"}
                    </Button>
                 </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
