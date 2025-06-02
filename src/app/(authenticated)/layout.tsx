
"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TurmaSelectionDialog } from "@/components/dialogs/TurmaSelectionDialog";
import type { UserProfile } from "@/contexts/AuthContext";

// Define TurmaData interface locally or import if centralized
interface TurmaData {
  id: string;
  nome: string;
  ativa: boolean;
  createdAt?: Timestamp;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // useRequireAuth already handles basic auth and loading state for redirection
  const { currentUser, userProfile, loading: authLoading, refreshUserProfile } = useAuth(); 
  useRequireAuth(); // Basic protection, redirection handled by the hook

  const [turmas, setTurmas] = useState<TurmaData[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [isTurmaDialogOpen, setIsTurmaDialogOpen] = useState(false);
  const [activeTurmas, setActiveTurmas] = useState<TurmaData[]>([]);

  useEffect(() => {
    if (currentUser && userProfile && !authLoading) { // Ensure userProfile is loaded
      const fetchTurmas = async () => {
        setLoadingTurmas(true);
        try {
          const turmasSnapshot = await getDocs(collection(db, "turmas"));
          const turmasList = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TurmaData));
          setTurmas(turmasList);
          setActiveTurmas(turmasList.filter(t => t.ativa));
        } catch (error) {
          console.error("Error fetching turmas:", error);
          // Optionally, show a toast to the user
        } finally {
          setLoadingTurmas(false);
        }
      };
      fetchTurmas();
    } else if (!authLoading) {
        // No current user or profile after auth loading, probably being redirected
        setLoadingTurmas(false);
    }
  }, [currentUser, userProfile, authLoading]);

  useEffect(() => {
    if (!authLoading && userProfile && !loadingTurmas) {
      const userTurma = turmas.find(t => t.id === userProfile.turmaId);
      const needsTurmaSelection = !userProfile.turmaId || (userTurma && !userTurma.ativa);
      
      // Only open dialog if turmas have been loaded and there are active turmas to choose from,
      // or if the dialog isn't for selection but to inform (e.g. no active turmas)
      if (needsTurmaSelection) {
         setIsTurmaDialogOpen(true);
      } else {
         setIsTurmaDialogOpen(false);
      }
    }
  }, [userProfile, turmas, authLoading, loadingTurmas]);


  if (authLoading || (currentUser && loadingTurmas && !isTurmaDialogOpen)) { // Also wait for turmas if user is present, unless dialog is about to open
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Carregando Doçura...</p>
      </div>
    );
  }

  if (!currentUser) {
    // useRequireAuth handles redirection, this is a fallback or for when redirection is pending
    return null;
  }
  
  return (
    <AppShell>
      {children}
      {userProfile && isTurmaDialogOpen && (
        <TurmaSelectionDialog
          userProfile={userProfile}
          activeTurmas={activeTurmas}
          isOpen={isTurmaDialogOpen}
          onOpenChange={setIsTurmaDialogOpen}
          onTurmaSelected={async () => {
            await refreshUserProfile(); // Refresh profile from AuthContext
            setIsTurmaDialogOpen(false); // Close dialog
          }}
        />
      )}
    </AppShell>
  );
}
