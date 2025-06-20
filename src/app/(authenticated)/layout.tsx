
"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, getDocs, Timestamp, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TurmaSelectionDialog } from "@/components/dialogs/TurmaSelectionDialog";
import type { UserProfile } from "@/contexts/AuthContext";
import { AnnouncementDialog } from "@/components/dialogs/AnnouncementDialog"; // Import new dialog
import { USER_ROLES } from "@/lib/constants"; // Added USER_ROLES for checking

interface TurmaData {
  id: string;
  nome: string;
  ativa: boolean;
  createdAt?: Timestamp;
}

interface FullComunicadoData {
  id: string;
  title: string;
  message: string;
  expiryDate: Timestamp;
  targetTurmaId: string;
  createdByUid: string;
  createdAt: Timestamp;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userProfile, loading: authLoading, refreshUserProfile } = useAuth(); 
  useRequireAuth(); 

  const [turmas, setTurmas] = useState<TurmaData[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [isTurmaDialogOpen, setIsTurmaDialogOpen] = useState(false);
  const [activeTurmas, setActiveTurmas] = useState<TurmaData[]>([]);

  const [activeAnnouncementToShow, setActiveAnnouncementToShow] = useState<FullComunicadoData | null>(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    const fetchTurmasAndAnnouncements = async () => {
      if (!currentUser || !userProfile) {
        setLoadingTurmas(false);
        setLoadingAnnouncements(false);
        return;
      }

      setLoadingTurmas(true);
      setLoadingAnnouncements(true);
      try {
        // Fetch Turmas
        const turmasSnapshot = await getDocs(collection(db, "turmas"));
        const turmasList = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TurmaData));
        setTurmas(turmasList);
        setActiveTurmas(turmasList.filter(t => t.ativa));

        // Fetch Announcements
        // Only fetch if user has a turmaId OR is an admin (admins might see "ALL" or specific turmas)
        if (userProfile.turmaId || userProfile.role === USER_ROLES.ADMIN) {
          const now = Timestamp.now();
          const announcementsQuery = query(
            collection(db, "comunicados"),
            where("expiryDate", ">", now),
            orderBy("expiryDate"), 
            orderBy("createdAt", "desc") 
          );
          const announcementsSnapshot = await getDocs(announcementsQuery);
          const allActiveAnnouncements = announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FullComunicadoData));
          
          const relevantAnnouncements = allActiveAnnouncements.filter(ann => 
            ann.targetTurmaId === "ALL" || ann.targetTurmaId === userProfile.turmaId
          );

          if (relevantAnnouncements.length > 0) {
            for (const ann of relevantAnnouncements) {
              const seenKey = `seen_announcement_${ann.id}`; // Corrected line
              if (!sessionStorage.getItem(seenKey)) {
                setActiveAnnouncementToShow(ann);
                setIsAnnouncementDialogOpen(true);
                sessionStorage.setItem(seenKey, "true");
                break; 
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching initial data (turmas/announcements):", error);
      } finally {
        setLoadingTurmas(false);
        setLoadingAnnouncements(false);
      }
    };
    
    if (currentUser && userProfile && !authLoading) {
      fetchTurmasAndAnnouncements();
    } else if (!authLoading) { // If not loading and no user/profile, ensure loading states are false
        setLoadingTurmas(false);
        setLoadingAnnouncements(false);
    }
  }, [currentUser, userProfile, authLoading]);

  useEffect(() => {
    if (!authLoading && userProfile && !loadingTurmas) {
      const userTurma = turmas.find(t => t.id === userProfile.turmaId);
      // Needs selection if no turmaId, OR if their current turmaId points to an inactive turma
      const needsTurmaSelection = !userProfile.turmaId || (userProfile.turmaId && userTurma && !userTurma.ativa);
      
      if (needsTurmaSelection && activeTurmas.length > 0) { // Only open if there are active turmas to select from
         setIsTurmaDialogOpen(true);
      } else {
         setIsTurmaDialogOpen(false);
      }
    }
  }, [userProfile, turmas, activeTurmas, authLoading, loadingTurmas]);


  if (authLoading || (currentUser && (loadingTurmas || loadingAnnouncements) && !isTurmaDialogOpen && !isAnnouncementDialogOpen )) { 
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Carregando Doçura...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by useRequireAuth redirecting to /login
    // If still here, it might be a brief moment before redirect, or if useRequireAuth is not used on a page.
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
            await refreshUserProfile(); 
            // No need to explicitly set setIsTurmaDialogOpen(false) here, 
            // as the parent's useEffect for turma selection will handle it based on new userProfile.
          }}
        />
      )}
      {activeAnnouncementToShow && (
        <AnnouncementDialog
            isOpen={isAnnouncementDialogOpen}
            onOpenChange={setIsAnnouncementDialogOpen}
            title={activeAnnouncementToShow.title}
            message={activeAnnouncementToShow.message}
            turmaName={activeAnnouncementToShow.targetTurmaId !== "ALL" 
                ? turmas.find(t => t.id === activeAnnouncementToShow.targetTurmaId)?.nome 
                : "Todas as Turmas"}
        />
      )}
    </AppShell>
  );
}

    