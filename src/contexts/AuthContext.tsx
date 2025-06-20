
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/lib/constants';
import { USER_ROLES, FIREBASE_EMAIL_DOMAIN } from '@/lib/constants';

export interface UserProfile {
  uid: string;
  email: string | null;
  matricula: string;
  nomeCompleto: string;
  role: UserRole;
  turmaId?: string;
  turmaNome?: string;
  actualEmail?: string;
}

export interface TurmaData {
  id: string;
  nome: string;
  ativa: boolean;
  createdAt?: Timestamp;
}

export interface FullComunicadoData {
  id: string;
  title: string;
  message: string;
  expiryDate: Timestamp;
  targetTurmaId: string; // 'ALL' or specific turmaId
  targetTurmaName?: string; // Added for display
  createdByUid: string;
  createdAt: Timestamp;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  activeAnnouncements: FullComunicadoData[];
  allTurmas: TurmaData[];
  loadingSessionData: boolean; // Consolidated loading state
  isMatriculaVerified: boolean;
  logout: () => Promise<void>;
  refreshSessionData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeAnnouncements, setActiveAnnouncements] = useState<FullComunicadoData[]>([]);
  const [allTurmas, setAllTurmas] = useState<TurmaData[]>([]);
  const [loadingSessionData, setLoadingSessionData] = useState(true);
  const [isMatriculaVerified, setIsMatriculaVerified] = useState(false);
  const router = useRouter();

  const fetchSessionData = useCallback(async (user: FirebaseUser) => {
    setLoadingSessionData(true);
    try {
      // Fetch User Profile
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let profileData: UserProfile | null = null;

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        profileData = {
          uid: user.uid,
          email: data.actualEmail || user.email,
          matricula: data.matricula,
          nomeCompleto: data.nomeCompleto || data.matricula,
          role: data.role || USER_ROLES.USER,
          turmaId: data.turmaId,
          actualEmail: data.actualEmail,
          turmaNome: undefined, // Will be fetched with allTurmas
        };
      } else {
         profileData = {
            uid: user.uid,
            email: user.email,
            matricula: user.email?.split('@')[0] || 'N/A_fallback',
            nomeCompleto: user.email?.split('@')[0] || 'Fallback User',
            role: USER_ROLES.USER,
            actualEmail: user.email || undefined,
         };
      }
      

      // Fetch All Turmas
      const turmasSnapshot = await getDocs(collection(db, "turmas"));
      const turmasList = turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TurmaData));
      setAllTurmas(turmasList);

      // Set TurmaName in Profile if turmaId exists
      if (profileData && profileData.turmaId) {
        const userTurma = turmasList.find(t => t.id === profileData!.turmaId);
        if (userTurma) {
          profileData.turmaNome = userTurma.nome;
        }
      }
      setUserProfile(profileData);


      // Fetch Announcements (dependent on profileData and turmasList for filtering and naming)
      if (profileData) { // Only fetch if profile is determined
        const now = Timestamp.now();
        const announcementsQuery = query(
          collection(db, "comunicados"),
          where("expiryDate", ">", now),
          orderBy("expiryDate"),
          orderBy("createdAt", "desc")
        );
        const announcementsSnapshot = await getDocs(announcementsQuery);
        const allActiveAnnouncementsRaw = announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<FullComunicadoData, 'targetTurmaName'>));
        
        const relevantAnnouncements = allActiveAnnouncementsRaw
          .filter(ann => ann.targetTurmaId === "ALL" || ann.targetTurmaId === profileData.turmaId)
          .map(ann => {
            let targetTurmaName = "Todas as Turmas";
            if (ann.targetTurmaId !== "ALL") {
              const turma = turmasList.find(t => t.id === ann.targetTurmaId);
              targetTurmaName = turma ? turma.nome : "Turma Desconhecida";
            }
            return { ...ann, targetTurmaName };
          });
        setActiveAnnouncements(relevantAnnouncements);
      } else {
        setActiveAnnouncements([]);
      }

    } catch (error) {
      console.error("Error fetching session data:", error);
      setUserProfile(null); // Reset profile on error
      setActiveAnnouncements([]);
      setAllTurmas([]);
    } finally {
      setLoadingSessionData(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email?.endsWith(`@${process.env.NEXT_PUBLIC_FIREBASE_EMAIL_DOMAIN || FIREBASE_EMAIL_DOMAIN}`)) {
          setIsMatriculaVerified(true);
        } else {
          setIsMatriculaVerified(false);
        }
        await fetchSessionData(user);
      } else {
        setUserProfile(null);
        setActiveAnnouncements([]);
        setAllTurmas([]);
        setIsMatriculaVerified(false);
        setLoadingSessionData(false); // Ensure loading stops if no user
      }
    });

    return () => unsubscribe();
  }, [fetchSessionData]);

  const logout = async () => {
    setLoadingSessionData(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setActiveAnnouncements([]);
      setAllTurmas([]);
      setIsMatriculaVerified(false);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setLoadingSessionData(false);
    }
  };

  const refreshSessionData = useCallback(async () => {
    if (currentUser) {
      await fetchSessionData(currentUser);
    }
  }, [currentUser, fetchSessionData]);
  
  const value = { 
    currentUser, 
    userProfile, 
    activeAnnouncements,
    allTurmas,
    loadingSessionData, 
    isMatriculaVerified, 
    logout, 
    refreshSessionData 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
