'use client';
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasAllPermissions, hasAnyPermission, getPermissions, type Permission } from '@/lib/permissions';

/**
 * Hook that exposes permission-check helpers derived from the authenticated user's role.
 *
 * Usage:
 *   const { can, canAll, canAny, role } = usePermissions();
 *   if (can('case_files:create')) { ... }
 */
export function usePermissions() {
  const { userRole } = useAuth();

  const helpers = useMemo(() => ({
    role: userRole,
    /** Returns true if the current user has the given permission. */
    can: (permission: Permission) => hasPermission(userRole, permission),
    /** Returns true if the current user has ALL of the given permissions. */
    canAll: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    /** Returns true if the current user has ANY of the given permissions. */
    canAny: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    /** Returns the full list of permissions for the current user. */
    permissions: getPermissions(userRole),
  }), [userRole]);

  return helpers;
}
