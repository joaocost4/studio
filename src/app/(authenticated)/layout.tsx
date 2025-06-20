
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
    if (currentUser && userProfile && !authLoading) {
      const fetchTurmasAndAnnouncements = async () => {
        setLoadingTurmas(true);
        setLoadingAnnouncements(true);
        try {
          // Fetch Turmas
          const turmasSnapshot = await getDocs(collection(db, "turmas"));
          const turmasList = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TurmaData));
          setTurmas(turmasList);
          setActiveTurmas(turmasList.filter(t => t.ativa));

          // Fetch Announcements
          if (userProfile.turmaId || userProfile.role === USER_ROLES.ADMIN) { // Only fetch if turmaId or admin
            const now = Timestamp.now();
            const announcementsQuery = query(
              collection(db, "comunicados"),
              where("expiryDate", ">", now),
              orderBy("expiryDate"), // Could be orderBy("createdAt", "desc") to get newest first
              orderBy("createdAt", "desc") 
            );
            const announcementsSnapshot = await getDocs(announcementsQuery);
            const allActiveAnnouncements = announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FullComunicadoData));
            
            const relevantAnnouncements = allActiveAnnouncements.filter(ann => 
              ann.targetTurmaId === "ALL" || ann.targetTurmaId === userProfile.turmaId
            );

            if (relevantAnnouncements.length > 0) {
              // Show the newest relevant announcement not yet seen in this session
              for (const ann of relevantAnnouncements) { // Iterate to find first unseen
                const seenKey = `seen_announcement_${ann.id}`;
                if (!sessionStorage.getItem(seenKey)) {
                  setActiveAnnouncementToShow(ann);
                  setIsAnnouncementDialogOpen(true);
                  sessionStorage.setItem(seenKey, "true");
                  break; // Show only one
                }
              }
            }
          }
        } catch (error) {
          console.error("Error fetching initial data:", error);
        } finally {
          setLoadingTurmas(false);
          setLoadingAnnouncements(false);
        }
      };
      fetchTurmasAndAnnouncements();
    } else if (!authLoading) {
        setLoadingTurmas(false);
        setLoadingAnnouncements(false);
    }
  }, [currentUser, userProfile, authLoading]);

  useEffect(() => {
    if (!authLoading && userProfile && !loadingTurmas) {
      const userTurma = turmas.find(t => t.id === userProfile.turmaId);
      const needsTurmaSelection = !userProfile.turmaId || (userTurma && !userTurma.ativa);
      
      if (needsTurmaSelection) {
         setIsTurmaDialogOpen(true);
      } else {
         setIsTurmaDialogOpen(false);
      }
    }
  }, [userProfile, turmas, authLoading, loadingTurmas]);


  if (authLoading || (currentUser && (loadingTurmas || loadingAnnouncements) && !isTurmaDialogOpen && !isAnnouncementDialogOpen )) { 
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-xl text-foreground">Carregando Doçura...</p>
      </div>
    );
  }

  if (!currentUser) {
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
            setIsTurmaDialogOpen(false); 
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

    