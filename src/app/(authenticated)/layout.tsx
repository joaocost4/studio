
"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { TurmaSelectionDialog } from "@/components/dialogs/TurmaSelectionDialog";
import type { UserProfile, TurmaData, FullComunicadoData } from "@/contexts/AuthContext"; // Import interfaces
import { AnnouncementDialog } from "@/components/dialogs/AnnouncementDialog";
import { USER_ROLES } from "@/lib/constants";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { 
    currentUser, 
    userProfile, 
    loadingSessionData, 
    refreshSessionData, 
    activeAnnouncements, 
    allTurmas 
  } = useAuth(); 
  
  useRequireAuth(); 

  const [isTurmaDialogOpen, setIsTurmaDialogOpen] = useState(false);
  const [dialogAnnouncement, setDialogAnnouncement] = useState<FullComunicadoData | null>(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);

  useEffect(() => {
    if (!loadingSessionData && userProfile && allTurmas.length > 0) {
      const userTurma = allTurmas.find(t => t.id === userProfile.turmaId);
      const needsTurmaSelection = !userProfile.turmaId || (userProfile.turmaId && userTurma && !userTurma.ativa);
      const activeTurmasForDialog = allTurmas.filter(t => t.ativa);
      
      if (needsTurmaSelection && activeTurmasForDialog.length > 0) {
         setIsTurmaDialogOpen(true);
      } else {
         setIsTurmaDialogOpen(false);
      }
    }
  }, [userProfile, allTurmas, loadingSessionData]);

  useEffect(() => {
    if (!loadingSessionData && activeAnnouncements.length > 0) {
      // Show only the first relevant, non-seen announcement in the dialog
      for (const ann of activeAnnouncements) {
        const seenKey = `seen_announcement_${ann.id}`;
        if (!sessionStorage.getItem(seenKey)) {
          setDialogAnnouncement(ann);
          setIsAnnouncementDialogOpen(true);
          sessionStorage.setItem(seenKey, "true");
          break; 
        }
      }
    }
  }, [activeAnnouncements, loadingSessionData]);


  if (loadingSessionData && !currentUser) { // Show loader if session data is loading and no current user yet (initial auth check)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Carregando Doçura...</p>
      </div>
    );
  }
  
  // If not initial auth check, but still loading session data for an existing user,
  // we might want to show a smaller loader or let content render with its own loaders.
  // For now, if there's a current user but session data is still loading for popups/dialogs, we might still show main loader.
  // However, TurmaSelectionDialog and AnnouncementDialog have their own conditions.
  // The crucial part is to prevent app rendering before userProfile is known for useRequireAuth.
   if (loadingSessionData && currentUser && !isTurmaDialogOpen && !isAnnouncementDialogOpen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Atualizando dados da sessão...</p>
      </div>
    );
  }


  if (!currentUser && !loadingSessionData) { // If loading finished and still no user, useRequireAuth will redirect.
    return null; 
  }
  
  return (
    <AppShell>
      {children}
      {userProfile && isTurmaDialogOpen && (
        <TurmaSelectionDialog
          userProfile={userProfile}
          activeTurmas={allTurmas.filter(t => t.ativa)}
          isOpen={isTurmaDialogOpen}
          onOpenChange={setIsTurmaDialogOpen}
          onTurmaSelected={async () => {
            await refreshSessionData(); 
          }}
        />
      )}
      {dialogAnnouncement && (
        <AnnouncementDialog
            isOpen={isAnnouncementDialogOpen}
            onOpenChange={setIsAnnouncementDialogOpen}
            title={dialogAnnouncement.title}
            message={dialogAnnouncement.message}
            turmaName={dialogAnnouncement.targetTurmaName}
        />
      )}
    </AppShell>
  );
}
