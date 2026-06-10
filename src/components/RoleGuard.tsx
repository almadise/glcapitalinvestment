'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type Role = 'admin' | 'compliance' | 'analyst' | 'client' | 'gestionnaire_contenu';

interface RoleGuardProps {
  allowedRoles: Role[];
  redirectTo?: string;
  children: React.ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  redirectTo = '/sign-up-login-screen',
  children,
}: RoleGuardProps) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/sign-up-login-screen');
      return;
    }
    if (userRole !== null && !allowedRoles.includes(userRole as Role)) {
      // Redirect to the correct space based on actual role
      if (userRole === 'admin') router.replace('/admin');
      else if (userRole === 'compliance') router.replace('/compliance-dashboard');
      else if (userRole === 'analyst') router.replace('/analyst-dashboard');
      else if (userRole === 'gestionnaire_contenu') router.replace('/content-dashboard');
      else router.replace('/client-dashboard');
    }
  }, [loading, user, userRole, router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;
  if (userRole !== null && !allowedRoles.includes(userRole as Role)) return null;

  return <>{children}</>;
}
