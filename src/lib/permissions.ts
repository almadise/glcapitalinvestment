/**
 * Granular permission definitions for GL Capital roles.
 * Each permission maps to a specific action a user can perform.
 */

export type AppRole = 'admin' | 'compliance' | 'analyst' | 'client' | 'gestionnaire_contenu';

export type Permission =
  // Dashboard access
  | 'dashboard:view_admin' |'dashboard:view_client' |'dashboard:view_analyst' |'dashboard:view_compliance' |'dashboard:view_content'
  // Case file operations
  | 'case_files:view_own' |'case_files:view_all' |'case_files:create' |'case_files:update_status' |'case_files:delete' |'case_files:export' |'case_files:assign_partner' |'case_files:flag_compliance'
  // Notification management
  | 'notifications:view_own'
  | 'notifications:view_all' |'notifications:manage_own' |'notifications:send_to_user' |'notifications:manage_settings'
  // User management
  | 'users:view' |'users:edit_roles'
  // Content management
  | 'content:manage';

/** Permission matrix per role */
const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    'dashboard:view_admin',
    'case_files:view_all',
    'case_files:create',
    'case_files:update_status',
    'case_files:delete',
    'case_files:export',
    'case_files:assign_partner',
    'case_files:flag_compliance',
    'notifications:view_all',
    'notifications:send_to_user',
    'users:view',
    'users:edit_roles',
    'content:manage',
  ],
  compliance: [
    'dashboard:view_compliance',
    'case_files:view_all',
    'case_files:update_status',
    'case_files:flag_compliance',
    'case_files:export',
    'notifications:view_own',
    'notifications:manage_own',
    'notifications:manage_settings',
  ],
  analyst: [
    'dashboard:view_analyst',
    'case_files:view_all',
    'case_files:update_status',
    'notifications:view_own',
    'notifications:manage_own',
    'notifications:manage_settings',
  ],
  client: [
    'dashboard:view_client',
    'case_files:view_own',
    'case_files:create',
    'notifications:view_own',
    'notifications:manage_own',
    'notifications:manage_settings',
  ],
  gestionnaire_contenu: [
    'dashboard:view_content',
    'content:manage',
    'notifications:view_own',
    'notifications:manage_own',
    'notifications:manage_settings',
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: AppRole | string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as AppRole];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Check if a role has ALL of the given permissions.
 */
export function hasAllPermissions(role: AppRole | string | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the given permissions.
 */
export function hasAnyPermission(role: AppRole | string | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: AppRole | string | null | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as AppRole] ?? [];
}
