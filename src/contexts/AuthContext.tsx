"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import type { UserRole } from '@/lib/constants';
import { USER_ROLES } from '@/lib/constants';

interface UserProfile {
  uid: string;
  email: string | null; // Actual email for communication
  matricula: string;
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
        // Check if it's our custom matricula-based email
        // This is a simplified check; in a real app, you might have more robust verification
        if (user.email?.endsWith(`@${process.env.NEXT_PUBLIC_FIREBASE_EMAIL_DOMAIN || 'doceacesso.app'}`)) {
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
              email: data.actualEmail || user.email, // Use stored actualEmail if available
              matricula: data.matricula,
              role: data.role || USER_ROLES.USER,
            });
          } else {
            // User exists in Auth but not in Firestore, maybe mid-registration or an issue
            setUserProfile(null); 
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
