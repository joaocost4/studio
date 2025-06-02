"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';
import type { UserRole } from '@/lib/constants';

interface UseRequireAuthOptions {
  allowedRoles?: UserRole[];
  redirectTo?: string; // Path to redirect if auth fails or role is not allowed
}

export function useRequireAuth(options?: UseRequireAuthOptions) {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { allowedRoles, redirectTo = '/login' } = options || {};

  useEffect(() => {
    if (loading) {
      return; // Wait until loading is false
    }

    if (!currentUser) {
      // If not logged in, redirect to login page, preserving the intended path
      const params = new URLSearchParams();
      if (pathname !== '/') params.set('redirectedFrom', pathname);
      router.push(`${redirectTo}?${params.toString()}`);
      return;
    }

    if (allowedRoles && userProfile) {
      if (!allowedRoles.includes(userProfile.role)) {
        // User is logged in but doesn't have the required role
        // Redirect to a "not authorized" page or dashboard
        router.push('/dashboard?error=unauthorized'); // Or a dedicated /unauthorized page
      }
    }
  }, [currentUser, userProfile, loading, router, pathname, allowedRoles, redirectTo]);

  return { currentUser, userProfile, loading };
}
