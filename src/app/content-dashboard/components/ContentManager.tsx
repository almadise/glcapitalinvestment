'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ContentLayout from '../components/ContentLayout';
import { Plus, Search, Loader2, Edit2, X, Check, ChevronDown, RefreshCw, AlertCircle, History, Eye, Clock, User, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface ContentPage {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string | null;
  content_fr: string | null;
  content_en: string | null;
  type: string;
  status: string;
  author_id: string | null;
  author_email?: string | null;
  created_at: string;
  updated_at: string;
  version?: number;
}

interface ContentVersion {
  id: string;
  content_id: string;
  title_fr: string;
  content_fr: string | null;
  status: string;
  edited_by_email: string | null;
  version_number: number;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  brouillon: { label: 'Brouillon', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
  publie: { label: 'Publié', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  archive: { label: 'Archivé', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300' },
};

const EMPTY_FORM = { slug: '', title_fr: '', title_en: '', content_fr: '', content_en: '', status: 'brouillon' };

interface ContentManagerProps {
  type: 'page' | 'faq' | 'article' | 'glossaire';
  title: string;
  icon: React.ElementType;
}

export function ContentManager({ type, title, icon: IconComp }: ContentManagerProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [items, setItems] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'fr' | 'en'>('fr');

  // Version history state
  const [viewingHistoryFor, setViewingHistoryFor] = useState<ContentPage | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Preview state
  const [previewItem, setPreviewItem] = useState<ContentPage | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('content_pages')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const fetchVersions = async (item: ContentPage) => {
    setViewingHistoryFor(item);
    setVersionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_versions')
        .select('*')
        .eq('content_id', item.id)
        .order('version_number', { ascending: false });
      if (error) {
        // Table may not exist yet — show graceful fallback
        setVersions([]);
      } else {
        setVersions(data || []);
      }
    } catch {
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title_fr.trim() || !form.slug.trim()) { toast.error('Titre et slug requis'); return; }
    setSaving(true);
    try {
      const payload: any = {
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        title_fr: form.title_fr.trim(),
        title_en: form.title_en.trim() || null,
        content_fr: form.content_fr.trim() || null,
        content_en: form.content_en.trim() || null,
        type,
        status: form.status,
        author_id: user?.id,
        author_email: user?.email,
      };

      if (editingId) {
        // Save version snapshot before updating
        const existing = items.find((i) => i.id === editingId);
        if (existing) {
          const versionCount = await supabase.from('content_versions').select('id', { count: 'exact', head: true }).eq('content_id', editingId);
          await supabase.from('content_versions').insert({
            content_id: editingId,
            title_fr: existing.title_fr,
            content_fr: existing.content_fr,
            status: existing.status,
            edited_by_email: user?.email,
            version_number: (versionCount.count || 0) + 1,
          }).then(() => {});
        }
        const { error } = await supabase.from('content_pages').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId);
        if (error) throw error;
        toast.success('Contenu mis à jour');
      } else {
        const { error } = await supabase.from('content_pages').insert(payload);
        if (error) throw error;
        toast.success('Contenu créé');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setActiveFormTab('fr');
      await fetchItems();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ContentPage) => {
    setForm({
      slug: item.slug,
      title_fr: item.title_fr,
      title_en: item.title_en || '',
      content_fr: item.content_fr || '',
      content_en: item.content_en || '',
      status: item.status,
    });
    setEditingId(item.id);
    setActiveFormTab('fr');
    setShowForm(true);
  };

  const handleToggleStatus = async (item: ContentPage) => {
    const nextStatus = item.status === 'brouillon' ? 'publie' : item.status === 'publie' ? 'archive' : 'brouillon';
    try {
      await supabase.from('content_pages').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', item.id);
      setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, status: nextStatus } : x));
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[nextStatus].label}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = items.filter((i) => !search || i.title_fr.toLowerCase().includes(search.toLowerCase()) || i.slug.toLowerCase().includes(search.toLowerCase()));
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <ContentLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IconComp size={20} className="text-purple-600" />
            <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
          </div>
          <p className="text-slate-500 text-sm">Créer, modifier et publier du contenu institutionnel</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchItems} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"><RefreshCw size={14} /></button>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setActiveFormTab('fr'); }} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700">
            <Plus size={14} /> Nouveau
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Rechercher dans ${title.toLowerCase()}...`} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 size={28} className="animate-spin text-gold" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700"><AlertCircle size={18} />{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Titre</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Slug</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Langues</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Modifié</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">Aucun contenu trouvé</td></tr>
                ) : filtered.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.brouillon;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-navy">{item.title_fr}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{item.slug}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${item.content_fr ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>FR</span>
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${item.content_en ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>EN</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleStatus(item)} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} hover:opacity-80 transition-opacity`}>
                          {statusCfg.label}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(item.updated_at || item.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPreviewItem(item)} className="text-slate-400 hover:text-purple-600 transition-colors" title="Aperçu">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => fetchVersions(item)} className="text-slate-400 hover:text-amber-600 transition-colors" title="Historique versions">
                            <History size={14} />
                          </button>
                          <button onClick={() => handleEdit(item)} className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs font-medium">
                            <Edit2 size={12} /> Modifier
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-navy">{editingId ? 'Modifier le contenu' : 'Nouveau contenu'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-navy p-1 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Slug *</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none font-mono" placeholder="mon-contenu" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Statut</label>
                  <div className="relative">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full appearance-none px-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white">
                      <option value="brouillon">Brouillon</option>
                      <option value="publie">Publié</option>
                      <option value="archive">Archivé</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Language tabs */}
              <div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-3 w-fit">
                  <button onClick={() => setActiveFormTab('fr')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeFormTab === 'fr' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
                    <Globe size={11} /> Français
                  </button>
                  <button onClick={() => setActiveFormTab('en')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeFormTab === 'en' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
                    <Globe size={11} /> English
                  </button>
                </div>

                {activeFormTab === 'fr' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Titre (FR) *</label>
                      <input value={form.title_fr} onChange={(e) => setForm({ ...form, title_fr: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" placeholder="Titre en français" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Contenu (FR)</label>
                      <textarea value={form.content_fr} onChange={(e) => setForm({ ...form, content_fr: e.target.value })} rows={8} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none font-mono" placeholder="Contenu en français..." />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Title (EN)</label>
                      <input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" placeholder="Title in English" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Content (EN)</label>
                      <textarea value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} rows={8} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none font-mono" placeholder="Content in English..." />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:text-navy text-sm font-medium">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {viewingHistoryFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewingHistoryFor(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <History size={16} className="text-amber-600" />
                  <h2 className="font-bold text-navy">Historique des versions</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{viewingHistoryFor.title_fr}</p>
              </div>
              <button onClick={() => setViewingHistoryFor(null)} className="text-slate-400 hover:text-navy p-1 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-4">
              {versionsLoading ? (
                <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-gold" /></div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8">
                  <History size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Aucune version antérieure enregistrée.</p>
                  <p className="text-xs text-slate-400 mt-1">Les versions sont créées automatiquement à chaque modification.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Current version */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">Version actuelle</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[viewingHistoryFor.status]?.bg} ${STATUS_CONFIG[viewingHistoryFor.status]?.color}`}>
                        {STATUS_CONFIG[viewingHistoryFor.status]?.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-navy mt-1">{viewingHistoryFor.title_fr}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500"><Clock size={10} />{formatDateTime(viewingHistoryFor.updated_at || viewingHistoryFor.created_at)}</span>
                    </div>
                  </div>
                  {/* Previous versions */}
                  {versions.map((v) => (
                    <div key={v.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">v{v.version_number}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[v.status]?.bg || 'bg-slate-100'} ${STATUS_CONFIG[v.status]?.color || 'text-slate-600'}`}>
                          {STATUS_CONFIG[v.status]?.label || v.status}
                        </span>
                      </div>
                      <p className="text-sm text-navy mt-1">{v.title_fr}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500"><User size={10} />{v.edited_by_email || 'Anonyme'}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={10} />{formatDateTime(v.created_at)}</span>
                      </div>
                      {v.content_fr && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 italic">"{v.content_fr.substring(0, 100)}{v.content_fr.length > 100 ? '…' : ''}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-purple-600" />
                <h2 className="font-bold text-navy">Aperçu du contenu</h2>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-navy p-1 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[previewItem.status]?.bg} ${STATUS_CONFIG[previewItem.status]?.color} ${STATUS_CONFIG[previewItem.status]?.border}`}>
                  {STATUS_CONFIG[previewItem.status]?.label}
                </span>
                <span className="text-xs text-slate-400 font-mono">{previewItem.slug}</span>
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">{previewItem.title_fr}</h3>
              {previewItem.title_en && <p className="text-sm text-slate-500 italic mb-4">{previewItem.title_en}</p>}
              {previewItem.content_fr ? (
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap border-t border-slate-100 pt-4">
                  {previewItem.content_fr}
                </div>
              ) : (
                <p className="text-slate-400 text-sm italic">Aucun contenu FR rédigé.</p>
              )}
              {previewItem.content_en && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><Globe size={11} /> English version</p>
                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{previewItem.content_en}</div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock size={10} /> Créé : {formatDate(previewItem.created_at)}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> Modifié : {formatDate(previewItem.updated_at || previewItem.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentLayout>
  );
}
