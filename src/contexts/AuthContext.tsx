
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/lib/constants';
import { USER_ROLES, FIREBASE_EMAIL_DOMAIN } from '@/lib/constants';

interface UserProfile {
  uid: string;
  email: string | null; // Actual email for communication
  matricula: string;
  nomeCompleto: string; // Added field for full name
  role: UserRole;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isMatriculaVerified: boolean; // Indicates if the matricula/custom email setup is done
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMatriculaVerified, setIsMatriculaVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email?.endsWith(`@${process.env.NEXT_PUBLIC_FIREBASE_EMAIL_DOMAIN || FIREBASE_EMAIL_DOMAIN}`)) {
          setIsMatriculaVerified(true);
        } else {
          setIsMatriculaVerified(false); 
        }

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserProfile({
              uid: user.uid,
              email: data.actualEmail || user.email,
              matricula: data.matricula,
              nomeCompleto: data.nomeCompleto || data.matricula, // Use matricula as fallback
              role: data.role || USER_ROLES.USER,
            });
          } else {
            // User in Auth but not Firestore, possible mid-registration or issue
            // Create a minimal profile, registration should ideally complete this.
             const extractedMatricula = user.email?.split('@')[0] || 'N/A';
             setUserProfile({
                uid: user.uid,
                email: user.email,
                matricula: extractedMatricula,
                nomeCompleto: extractedMatricula, // Fallback to matricula
                role: USER_ROLES.USER,
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        setIsMatriculaVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      // Handle error (e.g., show a toast)
    } finally {
      setLoading(false);
    }
  };
  
  const value = { currentUser, userProfile, loading, isMatriculaVerified, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
