
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/lib/constants';
import { USER_ROLES, FIREBASE_EMAIL_DOMAIN } from '@/lib/constants';

export interface UserProfile { // Exporting for use in other components
  uid: string;
  email: string | null; 
  matricula: string;
  nomeCompleto: string; 
  role: UserRole;
  turmaId?: string;
  turmaNome?: string; // Added turmaNome
  actualEmail?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isMatriculaVerified: boolean; 
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMatriculaVerified, setIsMatriculaVerified] = useState(false);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (user: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let profileData: Omit<UserProfile, 'uid' | 'email'> = {
        matricula: user.email?.split('@')[0] || 'N/A',
        nomeCompleto: user.email?.split('@')[0] || 'N/A',
        role: USER_ROLES.USER,
        turmaId: undefined,
        turmaNome: undefined,
        actualEmail: user.email || undefined,
      };

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        profileData = {
          matricula: data.matricula,
          nomeCompleto: data.nomeCompleto || data.matricula,
          role: data.role || USER_ROLES.USER,
          turmaId: data.turmaId,
          actualEmail: data.actualEmail,
          turmaNome: undefined, // Initialize, will be fetched next
        };

        if (data.turmaId) {
          try {
            const turmaDocRef = doc(db, 'turmas', data.turmaId);
            const turmaDocSnap = await getDoc(turmaDocRef);
            if (turmaDocSnap.exists()) {
              profileData.turmaNome = turmaDocSnap.data()?.nome;
            }
          } catch (turmaError) {
            console.error("Error fetching turma name:", turmaError);
            // turmaNome remains undefined
          }
        }
      }
      
      setUserProfile({
        uid: user.uid,
        email: profileData.actualEmail || user.email,
        ...profileData,
      });

    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
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
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
        setIsMatriculaVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setIsMatriculaVerified(false);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = useCallback(async () => {
    if (currentUser) {
      setLoading(true);
      await fetchUserProfile(currentUser);
      setLoading(false);
    }
  }, [currentUser, fetchUserProfile]);
  
  const value = { currentUser, userProfile, loading, isMatriculaVerified, logout, refreshUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
