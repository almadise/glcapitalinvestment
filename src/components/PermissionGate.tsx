'use client';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { type Permission } from '@/lib/permissions';
import { Loader2, ShieldOff } from 'lucide-react';

interface PermissionGateProps {
  /** The permission(s) required to render children. */
  require: Permission | Permission[];
  /** If true, ALL listed permissions must be held (default: ANY). */
  requireAll?: boolean;
  /** Custom fallback when access is denied. Defaults to a subtle locked-state UI. */
  fallback?: React.ReactNode;
  /** When true, renders nothing (no fallback) on denial. */
  silent?: boolean;
  children: React.ReactNode;
}

/**
 * PermissionGate — renders children only when the current user holds the required permission(s).
 *
 * Usage:
 *   <PermissionGate require="case_files:create">
 *     <NewCaseButton />
 *   </PermissionGate>
 *
 *   <PermissionGate require={['case_files:view_all', 'case_files:export']} requireAll>
 *     <ExportButton />
 *   </PermissionGate>
 */
export default function PermissionGate({
  require,
  requireAll = false,
  fallback,
  silent = false,
  children,
}: PermissionGateProps) {
  const { loading } = useAuth();
  const { can, canAll, canAny } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    );
  }

  const permissions = Array.isArray(require) ? require : [require];
  const allowed = requireAll ? canAll(permissions) : canAny(permissions);

  if (!allowed) {
    if (silent) return null;
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <ShieldOff size={22} className="text-slate-400" />
        </div>
        <p className="text-slate-600 font-semibold text-sm">Accès restreint</p>
        <p className="text-slate-400 text-xs mt-1 max-w-xs">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
