'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import BackOfficeLayout from '@/components/BackOfficeLayout';
import { Users, Search, RefreshCw, Loader2, AlertTriangle, CheckCircle2, XCircle, Shield, Edit3, UserX, UserCheck, X, Save, Filter, Mail, Building2, Globe, Lock, ShieldCheck, Info } from 'lucide-react';

type UserRole = 'client' | 'analyst' | 'compliance' | 'admin' | 'gestionnaire_contenu';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  organization: string | null;
  country: string | null;
  role: UserRole;
  is_active: boolean;
  mfa_enabled: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

const ROLE_CONFIG: Record<UserRole, { label: string; labelEn: string; color: string; bg: string; border: string }> = {
  admin: { label: 'Administrateur', labelEn: 'Administrator', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  analyst: { label: 'Analyste', labelEn: 'Analyst', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  compliance: { label: 'Conformité', labelEn: 'Compliance', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  gestionnaire_contenu: { label: 'Gest. Contenu', labelEn: 'Content Mgr', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  client: { label: 'Client', labelEn: 'Client', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['Tableau de bord admin', 'Tous les dossiers', 'Créer/supprimer dossiers', 'Export CSV/PDF', 'Gestion utilisateurs', 'Gestion contenu', 'Toutes notifications', 'Paramètres système'],
  analyst: ['Tableau de bord analyste', 'Tous les dossiers (lecture)', 'Mise à jour statut', 'Notifications propres'],
  compliance: ['Tableau de bord conformité', 'Tous les dossiers', 'Décisions conformité', 'Export dossiers', 'Notifications propres'],
  gestionnaire_contenu: ['Tableau de bord contenu', 'Gestion contenu', 'Notifications propres'],
  client: ['Tableau de bord client', 'Dossiers propres', 'Créer dossiers', 'Notifications propres'],
};

const PAGE_SIZE = 20;

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const AVATAR_COLORS = ['bg-navy-800', 'bg-blue-700', 'bg-purple-700', 'bg-emerald-700', 'bg-amber-700', 'bg-rose-700'];
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface EditModalProps {
  user: UserProfile;
  onClose: () => void;
  onSaved: (updated: UserProfile) => void;
  lang: string;
}

function EditModal({ user, onClose, onSaved, lang }: EditModalProps) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(user.full_name);
  const [organization, setOrganization] = useState(user.organization ?? '');
  const [country, setCountry] = useState(user.country ?? '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName, organization, country, role, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    if (data) onSaved(data as UserProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${avatarColor(user.id)} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{initials(user.full_name)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{lang === 'fr' ? 'Modifier l\'utilisateur' : 'Edit User'}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{lang === 'fr' ? 'Nom complet' : 'Full Name'}</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{lang === 'fr' ? 'Organisation' : 'Organization'}</label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{lang === 'fr' ? 'Pays' : 'Country'}</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{lang === 'fr' ? 'Rôle' : 'Role'}</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
                const cfg = ROLE_CONFIG[r];
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected ? `${cfg.bg} ${cfg.border} border-2` : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? `border-current ${cfg.color}` : 'border-slate-300'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${isSelected ? cfg.color : 'text-slate-700'}`}>
                        {lang === 'fr' ? cfg.label : cfg.labelEn}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        {ROLE_PERMISSIONS[r].slice(0, 3).join(' · ')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertTriangle size={13} />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">
            {lang === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {lang === 'fr' ? 'Enregistrer' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PermissionsDrawerProps {
  user: UserProfile;
  onClose: () => void;
  lang: string;
}

function PermissionsDrawer({ user, onClose, lang }: PermissionsDrawerProps) {
  const cfg = ROLE_CONFIG[user.role];
  const perms = ROLE_PERMISSIONS[user.role];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-navy-700" />
            <span className="text-sm font-semibold text-slate-800">{lang === 'fr' ? 'Permissions' : 'Permissions'}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${avatarColor(user.id)} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{initials(user.full_name)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <Shield size={10} />
            {lang === 'fr' ? cfg.label : cfg.labelEn}
          </div>
        </div>

        <div className="px-5 py-4 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {lang === 'fr' ? 'Permissions accordées' : 'Granted Permissions'}
          </p>
          <div className="space-y-2">
            {perms.map((perm) => (
              <div key={perm} className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-700">{perm}</span>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-5 mb-3">
            {lang === 'fr' ? 'Permissions refusées' : 'Denied Permissions'}
          </p>
          <div className="space-y-2">
            {(Object.keys(ROLE_PERMISSIONS) as UserRole[])
              .filter((r) => r !== user.role)
              .flatMap((r) => ROLE_PERMISSIONS[r].filter((p) => !perms.includes(p)))
              .filter((v, i, a) => a.indexOf(v) === i)
              .slice(0, 6)
              .map((perm) => (
                <div key={perm} className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                  <XCircle size={13} className="text-slate-300 flex-shrink-0" />
                  <span className="text-xs text-slate-400 line-through">{perm}</span>
                </div>
              ))}
          </div>

          <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              {lang === 'fr' ?'Les permissions sont définies par le rôle. Pour modifier les permissions, changez le rôle de l\'utilisateur.' :'Permissions are role-based. To change permissions, edit the user\'s role.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BackOfficeUsersPage() {
  const { user: authUser, userRole } = useAuth();
  const { lang } = useLanguage();
  const supabase = createClient();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<UserProfile | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (roleFilter !== 'ALL') query = query.eq('role', roleFilter);
      if (statusFilter === 'active') query = query.eq('is_active', true);
      if (statusFilter === 'inactive') query = query.eq('is_active', false);
      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,organization.ilike.%${search.trim()}%`);
      }

      const { data, error: err, count } = await query;
      if (err) throw err;
      setUsers((data as UserProfile[]) ?? []);
      setTotal(count ?? 0);
    } catch (e: any) {
      setError(e.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (u: UserProfile) => {
    setActionLoading(u.id);
    const newVal = !u.is_active;
    const { error: err } = await supabase
      .from('user_profiles')
      .update({ is_active: newVal, updated_at: new Date().toISOString() })
      .eq('id', u.id);
    setActionLoading(null);
    if (err) { showToast('error', err.message); return; }
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: newVal } : x));
    showToast('success', newVal
      ? (lang === 'fr' ? 'Utilisateur réactivé' : 'User reactivated')
      : (lang === 'fr' ? 'Utilisateur désactivé' : 'User deactivated'));
  };

  const handleSaved = (updated: UserProfile) => {
    setUsers((prev) => prev.map((x) => x.id === updated.id ? updated : x));
    setEditingUser(null);
    showToast('success', lang === 'fr' ? 'Modifications enregistrées' : 'Changes saved');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <BackOfficeLayout role={(userRole as any) ?? 'admin'}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {lang === 'fr' ? 'Gestion des utilisateurs' : 'User Management'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {lang === 'fr' ?'Consultez, modifiez et gérez les rôles et permissions des utilisateurs' :'View, edit, and manage user roles and permissions'}
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
            const cfg = ROLE_CONFIG[r];
            return (
              <button
                key={r}
                onClick={() => { setRoleFilter(roleFilter === r ? 'ALL' : r); setPage(0); }}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all text-left ${
                  roleFilter === r ? `${cfg.bg} ${cfg.border} border-2` : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                  <Users size={13} className={cfg.color} />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${roleFilter === r ? cfg.color : 'text-slate-700'}`}>
                    {lang === 'fr' ? cfg.label : cfg.labelEn}
                  </p>
                  <p className="text-[11px] text-slate-400 tabular-nums">{roleCounts[r] ?? 0}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={lang === 'fr' ? 'Rechercher par nom, email, organisation…' : 'Search by name, email, org…'}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(0); }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option value="ALL">{lang === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
              <option value="active">{lang === 'fr' ? 'Actifs' : 'Active'}</option>
              <option value="inactive">{lang === 'fr' ? 'Désactivés' : 'Inactive'}</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 ml-auto tabular-nums">
            {total} {lang === 'fr' ? 'utilisateur(s)' : 'user(s)'}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">{lang === 'fr' ? 'Chargement…' : 'Loading…'}</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 gap-3 text-red-500">
              <AlertTriangle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Users size={32} className="opacity-30" />
              <p className="text-sm">{lang === 'fr' ? 'Aucun utilisateur trouvé' : 'No users found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {lang === 'fr' ? 'Utilisateur' : 'User'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      {lang === 'fr' ? 'Organisation' : 'Organization'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {lang === 'fr' ? 'Rôle' : 'Role'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      {lang === 'fr' ? 'Statut' : 'Status'}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      {lang === 'fr' ? 'Inscrit le' : 'Joined'}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {lang === 'fr' ? 'Actions' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => {
                    const cfg = ROLE_CONFIG[u.role];
                    const isLoading = actionLoading === u.id;
                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${avatarColor(u.id)} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-[10px] font-bold">{initials(u.full_name)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{u.full_name || '-'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Mail size={10} className="text-slate-400 flex-shrink-0" />
                                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            {u.organization && <Building2 size={11} className="text-slate-400 flex-shrink-0" />}
                            <span className="text-sm text-slate-600 truncate max-w-[140px]">{u.organization || '-'}</span>
                          </div>
                          {u.country && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Globe size={10} className="text-slate-300" />
                              <span className="text-xs text-slate-400">{u.country}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                            <Shield size={9} />
                            {lang === 'fr' ? cfg.label : cfg.labelEn}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${u.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {u.is_active
                                ? <><CheckCircle2 size={11} /> {lang === 'fr' ? 'Actif' : 'Active'}</>
                                : <><XCircle size={11} /> {lang === 'fr' ? 'Désactivé' : 'Inactive'}</>}
                            </span>
                            <div className="flex items-center gap-2">
                              {u.email_verified && (
                                <span className="flex items-center gap-0.5 text-[10px] text-blue-500">
                                  <Mail size={9} /> {lang === 'fr' ? 'Vérifié' : 'Verified'}
                                </span>
                              )}
                              {u.mfa_enabled && (
                                <span className="flex items-center gap-0.5 text-[10px] text-purple-500">
                                  <Lock size={9} /> MFA
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="text-xs text-slate-500">{formatDate(u.created_at)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPermissionsUser(u)}
                              title={lang === 'fr' ? 'Voir les permissions' : 'View permissions'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            >
                              <ShieldCheck size={15} />
                            </button>
                            <button
                              onClick={() => setEditingUser(u)}
                              title={lang === 'fr' ? 'Modifier' : 'Edit'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(u)}
                              disabled={isLoading || u.id === authUser?.id}
                              title={u.is_active
                                ? (lang === 'fr' ? 'Désactiver' : 'Deactivate')
                                : (lang === 'fr' ? 'Réactiver' : 'Reactivate')}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                u.is_active
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' :'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {isLoading
                                ? <Loader2 size={15} className="animate-spin" />
                                : u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
              <p className="text-xs text-slate-400">
                {lang === 'fr' ? `Page ${page + 1} sur ${totalPages}` : `Page ${page + 1} of ${totalPages}`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {lang === 'fr' ? 'Précédent' : 'Previous'}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {lang === 'fr' ? 'Suivant' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handleSaved}
          lang={lang}
        />
      )}

      {/* Permissions Drawer */}
      {permissionsUser && (
        <PermissionsDrawer
          user={permissionsUser}
          onClose={() => setPermissionsUser(null)}
          lang={lang}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          toastMsg.type === 'success' ?'bg-emerald-50 border-emerald-200 text-emerald-800' :'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toastMsg.text}
        </div>
      )}
    </BackOfficeLayout>
  );
}
