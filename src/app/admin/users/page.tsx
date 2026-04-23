'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { Users, Search, RefreshCw, Loader2, AlertCircle, Shield, User, BarChart3, CheckCircle2, X,  } from 'lucide-react';


import Icon from '@/components/ui/AppIcon';
import AdminLayout from '@/app/admin/components/AdminLayout';


type UserRole = 'admin' | 'compliance' | 'analyst' | 'client';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

const ROLE_CONFIG: Record<UserRole, { labelFr: string; labelEn: string; color: string; bg: string; icon: React.ElementType }> = {
  admin: { labelFr: 'Admin', labelEn: 'Admin', color: 'text-red-700', bg: 'bg-red-100 border-red-200', icon: Shield },
  compliance: { labelFr: 'Conformité', labelEn: 'Compliance', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200', icon: CheckCircle2 },
  analyst: { labelFr: 'Analyste', labelEn: 'Analyst', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200', icon: BarChart3 },
  client: { labelFr: 'Client', labelEn: 'Client', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200', icon: User },
};

function RoleBadge({ role, lang }: { role: UserRole; lang: string }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.client;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} />
      {lang === 'fr' ? cfg.labelFr : cfg.labelEn}
    </span>
  );
}

export default function AdminUserManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('client');
  const [saving, setSaving] = useState(false);

  const t = {
    title: lang === 'fr' ? 'Gestion des utilisateurs' : 'User Management',
    subtitle: lang === 'fr' ? 'Gérez les rôles et accès des utilisateurs de la plateforme' : 'Manage platform user roles and access',
    search: lang === 'fr' ? 'Rechercher (nom, email…)' : 'Search (name, email…)',
    allRoles: lang === 'fr' ? 'Tous les rôles' : 'All roles',
    refresh: lang === 'fr' ? 'Actualiser' : 'Refresh',
    back: lang === 'fr' ? 'Tableau de bord' : 'Dashboard',
    colName: lang === 'fr' ? 'Nom' : 'Name',
    colEmail: 'Email',
    colRole: lang === 'fr' ? 'Rôle' : 'Role',
    colJoined: lang === 'fr' ? 'Inscrit le' : 'Joined',
    colActions: lang === 'fr' ? 'Actions' : 'Actions',
    editRole: lang === 'fr' ? 'Modifier le rôle' : 'Edit role',
    save: lang === 'fr' ? 'Enregistrer' : 'Save',
    cancel: lang === 'fr' ? 'Annuler' : 'Cancel',
    noUsers: lang === 'fr' ? 'Aucun utilisateur trouvé' : 'No users found',
    roleUpdated: lang === 'fr' ? 'Rôle mis à jour' : 'Role updated',
    total: lang === 'fr' ? 'utilisateurs' : 'users',
    editTitle: lang === 'fr' ? 'Modifier le rôle utilisateur' : 'Edit user role',
  };

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setUsers((data as UserProfile[]) || []);
    } catch (err: any) {
      setError(err?.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/sign-up-login-screen');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchUsers();
  }, [fetchUsers, user]);

  const handleOpenEdit = (u: UserProfile) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setUpdateError(null);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || newRole === selectedUser.role) return;
    setSaving(true);
    setUpdateError(null);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', selectedUser.id);

      if (updateErr) throw updateErr;
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      setSelectedUser(null);
    } catch (err: any) {
      setUpdateError(err?.message || 'Error updating role');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return iso; }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-navy text-xl font-bold font-display">{t.title}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Users size={14} />
            <span>{filtered.length} {t.total}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-navy text-sm placeholder-slate-400 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="relative">
            <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as UserRole | 'ALL')}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-navy text-sm focus:outline-none focus:border-gold/50 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="ALL">{t.allRoles}</option>
              {(['admin', 'compliance', 'analyst', 'client'] as UserRole[]).map(r => (
                <option key={r} value={r}>
                  {lang === 'fr' ? ROLE_CONFIG[r].labelFr : ROLE_CONFIG[r].labelEn}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-navy bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{t.refresh}</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-gold" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users size={40} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">{t.noUsers}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {[t.colName, t.colEmail, t.colRole, t.colJoined, t.colActions].map((col, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-gold text-xs font-bold">
                              {(u.full_name || u.email || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="text-navy font-medium whitespace-nowrap">{u.full_name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{u.email || '-'}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} lang={lang} />
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-navy text-xs transition-all"
                        >
                          <Shield size={12} />
                          {t.editRole}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit role modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-navy font-bold font-display">{t.editTitle}</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-navy p-1 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{t.colName}</p>
                <p className="text-navy font-medium">{selectedUser.full_name || selectedUser.email || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">{t.colRole}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['admin', 'compliance', 'analyst', 'client'] as UserRole[]).map(r => {
                    const cfg = ROLE_CONFIG[r];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={r}
                        onClick={() => setNewRole(r)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          newRole === r
                            ? 'bg-gold/10 border-gold/40 text-gold' :'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={14} />
                        {lang === 'fr' ? cfg.labelFr : cfg.labelEn}
                        {newRole === r && <CheckCircle2 size={12} className="ml-auto text-gold" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {updateError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  {updateError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-navy text-sm transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving || newRole === selectedUser.role}
                className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 disabled:opacity-50 text-navy font-semibold rounded-lg text-sm transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
