'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Building2, Plus, Search, Loader2, AlertCircle, X, Edit2, Check, ChevronDown, Globe, Mail, Phone, RefreshCw, BookOpen, Send, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Partner {
  id: string;
  name: string;
  type: string;
  zones: string[];
  criteria: string | null;
  internal_contact: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface SubmissionEntry {
  id: string;
  partner_id: string;
  case_id: string;
  submitted_by: string | null;
  submitted_by_email: string | null;
  note: string | null;
  status: string | null;
  created_at: string;
  partner_name?: string;
  case_title?: string;
}

const PARTNER_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  banque: { label: 'Banque', color: 'text-blue-700', bg: 'bg-blue-100' },
  fonds: { label: 'Fonds', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  courtier_instrument: { label: 'Courtier instrument', color: 'text-amber-700', bg: 'bg-amber-100' },
  avocat: { label: 'Avocat', color: 'text-purple-700', bg: 'bg-purple-100' },
  consultant: { label: 'Consultant', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  autre: { label: 'Autre', color: 'text-slate-700', bg: 'bg-slate-100' },
};

const EMPTY_FORM = { name: '', type: 'banque', zones: '', criteria: '', internal_contact: '', contact_email: '', contact_phone: '', notes: '', is_active: true };

export default function AdminPartnersPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'partners' | 'journal'>('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Submission journal state
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState({ partner_id: '', case_id: '', note: '', status: 'soumis' });
  const [submitting, setSubmitting] = useState(false);
  const [cases, setCases] = useState<{ id: string; title: string }[]>([]);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from('partners').select('*').order('name');
      if (fetchError) throw fetchError;
      setPartners(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('partner_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;

      // Enrich with partner names and case titles
      const enriched = await Promise.all((data || []).map(async (s: SubmissionEntry) => {
        const partner = partners.find((p) => p.id === s.partner_id);
        return { ...s, partner_name: partner?.name || s.partner_id.slice(0, 8) };
      }));
      setSubmissions(enriched);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [partners]);

  const fetchCases = useCallback(async () => {
    try {
      const { data } = await supabase.from('case_files').select('id, title').order('created_at', { ascending: false });
      setCases(data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchPartners(); fetchCases(); }, [fetchPartners, fetchCases]);
  useEffect(() => { if (activeTab === 'journal' && partners.length >= 0) fetchSubmissions(); }, [activeTab, fetchSubmissions]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        zones: form.zones ? form.zones.split(',').map((z) => z.trim()).filter(Boolean) : [],
        criteria: form.criteria.trim() || null,
        internal_contact: form.internal_contact.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await supabase.from('partners').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Partenaire mis à jour');
      } else {
        const { error } = await supabase.from('partners').insert(payload);
        if (error) throw error;
        toast.success('Partenaire ajouté');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await fetchPartners();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Partner) => {
    setForm({
      name: p.name, type: p.type, zones: p.zones?.join(', ') || '',
      criteria: p.criteria || '', internal_contact: p.internal_contact || '',
      contact_email: p.contact_email || '', contact_phone: p.contact_phone || '',
      notes: p.notes || '', is_active: p.is_active,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleToggleActive = async (p: Partner) => {
    try {
      await supabase.from('partners').update({ is_active: !p.is_active }).eq('id', p.id);
      setPartners((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
      toast.success(p.is_active ? 'Partenaire désactivé' : 'Partenaire activé');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSubmit = async () => {
    if (!submitForm.partner_id || !submitForm.case_id) { toast.error('Partenaire et dossier requis'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('partner_submissions').insert({
        partner_id: submitForm.partner_id,
        case_id: submitForm.case_id,
        submitted_by: user?.id,
        submitted_by_email: user?.email,
        note: submitForm.note.trim() || null,
        status: submitForm.status,
      });
      if (error) throw error;
      toast.success('Soumission enregistrée dans le journal');
      setShowSubmitForm(false);
      setSubmitForm({ partner_id: '', case_id: '', note: '', status: 'soumis' });
      await fetchSubmissions();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = partners.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase()));
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const SUBMISSION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    soumis: { label: 'Soumis', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    en_attente: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-100' },
    accepte: { label: 'Accepté', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    refuse: { label: 'Refusé', color: 'text-red-700', bg: 'bg-red-100' },
    en_negociation: { label: 'En négociation', color: 'text-purple-700', bg: 'bg-purple-100' },
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={20} className="text-gold" />
            <h1 className="font-display text-2xl font-bold text-navy">Répertoire Partenaires</h1>
          </div>
          <p className="text-slate-500 text-sm">Gestion confidentielle des partenaires — non exposé côté client</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchPartners(); if (activeTab === 'journal') fetchSubmissions(); }} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} />
          </button>
          {activeTab === 'partners' ? (
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90">
              <Plus size={14} /> Ajouter un partenaire
            </button>
          ) : (
            <button onClick={() => setShowSubmitForm(true)} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90">
              <Send size={14} /> Enregistrer une soumission
            </button>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-4 text-xs text-amber-800">
        <Building2 size={14} className="flex-shrink-0" />
        <span><strong>Confidentiel :</strong> Ce répertoire est strictement réservé au back-office. Côté portail client, seul le message "dossier soumis à une institution agréée" est affiché.</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4 w-fit">
        <button onClick={() => setActiveTab('partners')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'partners' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
          <Building2 size={14} /> Partenaires ({partners.length})
        </button>
        <button onClick={() => setActiveTab('journal')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'journal' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}>
          <BookOpen size={14} /> Journal de soumission
        </button>
      </div>

      {activeTab === 'partners' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un partenaire..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/20" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 size={28} className="animate-spin text-gold" /></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700"><AlertCircle size={18} />{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400">Aucun partenaire trouvé</div>
              ) : filtered.map((p) => {
                const typeCfg = PARTNER_TYPES[p.type] || PARTNER_TYPES.autre;
                return (
                  <div key={p.id} className={`bg-white rounded-xl border p-5 transition-all ${p.is_active ? 'border-slate-200 hover:border-gold/40 hover:shadow-md' : 'border-slate-100 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-navy text-sm">{p.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${typeCfg.bg} ${typeCfg.color}`}>{typeCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg"><Edit2 size={13} /></button>
                        <button onClick={() => handleToggleActive(p)} className={`p-1.5 rounded-lg ${p.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                          <Check size={13} />
                        </button>
                      </div>
                    </div>
                    {p.zones && p.zones.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <Globe size={11} />
                        <span>{p.zones.join(', ')}</span>
                      </div>
                    )}
                    {p.criteria && <p className="text-xs text-slate-600 mb-2 line-clamp-2">{p.criteria}</p>}
                    {p.internal_contact && (
                      <div className="text-xs text-slate-500 mb-1"><span className="font-medium">Contact interne :</span> {p.internal_contact}</div>
                    )}
                    {p.contact_email && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <Mail size={11} />{p.contact_email}
                      </div>
                    )}
                    {p.contact_phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone size={11} />{p.contact_phone}
                      </div>
                    )}
                    {!p.is_active && <div className="mt-2 text-xs text-slate-400 italic">Partenaire inactif</div>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'journal' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-navy" />
              <span className="text-sm font-semibold text-navy">Journal de soumission partenaires</span>
            </div>
            <span className="text-xs text-slate-400">{submissions.length} entrée(s)</span>
          </div>
          {submissionsLoading ? (
            <div className="flex items-center justify-center h-40"><Loader2 size={28} className="animate-spin text-gold" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Partenaire</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Dossier</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Statut</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Soumis par</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Note</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">Aucune soumission enregistrée</td></tr>
                  ) : submissions.map((s) => {
                    const statusCfg = SUBMISSION_STATUS[s.status || 'soumis'] || SUBMISSION_STATUS.soumis;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-navy text-sm">{s.partner_name}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{s.case_id?.slice(0, 8)}…</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{s.submitted_by_email || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{s.note || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{formatDate(s.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Partner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-navy">{editingId ? 'Modifier le partenaire' : 'Ajouter un partenaire'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-navy p-1 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="Nom du partenaire" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <div className="relative">
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full appearance-none px-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white">
                    {Object.entries(PARTNER_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Zones géographiques (séparées par virgule)</label>
                <input value={form.zones} onChange={(e) => setForm({ ...form, zones: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/20" placeholder="Europe, Afrique, Asie..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Critères</label>
                <textarea value={form.criteria} onChange={(e) => setForm({ ...form, criteria: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none" placeholder="Critères d'éligibilité..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contact interne</label>
                  <input value={form.internal_contact} onChange={(e) => setForm({ ...form, internal_contact: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none" placeholder="Nom du contact" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email contact</label>
                  <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none" placeholder="email@..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes internes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none" placeholder="Notes confidentielles..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                <label htmlFor="is_active" className="text-sm text-slate-600">Partenaire actif</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:text-navy text-sm font-medium">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Journal Form Modal */}
      {showSubmitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSubmitForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-navy" />
                <h2 className="font-bold text-navy">Enregistrer une soumission</h2>
              </div>
              <button onClick={() => setShowSubmitForm(false)} className="text-slate-400 hover:text-navy p-1 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Partenaire *</label>
                <div className="relative">
                  <select value={submitForm.partner_id} onChange={(e) => setSubmitForm({ ...submitForm, partner_id: e.target.value })} className="w-full appearance-none px-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white">
                    <option value="">Sélectionner un partenaire...</option>
                    {partners.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.name} ({PARTNER_TYPES[p.type]?.label || p.type})</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dossier *</label>
                <div className="relative">
                  <select value={submitForm.case_id} onChange={(e) => setSubmitForm({ ...submitForm, case_id: e.target.value })} className="w-full appearance-none px-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white">
                    <option value="">Sélectionner un dossier...</option>
                    {cases.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.id.slice(0, 8)}…)</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Statut de soumission</label>
                <div className="relative">
                  <select value={submitForm.status} onChange={(e) => setSubmitForm({ ...submitForm, status: e.target.value })} className="w-full appearance-none px-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white">
                    <option value="soumis">Soumis</option>
                    <option value="en_attente">En attente</option>
                    <option value="accepte">Accepté</option>
                    <option value="refuse">Refusé</option>
                    <option value="en_negociation">En négociation</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note interne</label>
                <textarea value={submitForm.note} onChange={(e) => setSubmitForm({ ...submitForm, note: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none" placeholder="Conditions, remarques, contacts..." />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700">
                <FileText size={11} className="inline mr-1" />
                Cette entrée sera enregistrée dans le journal confidentiel. Le client ne verra que "soumis à une institution agréée".
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setShowSubmitForm(false)} className="px-4 py-2 text-slate-600 hover:text-navy text-sm font-medium">Annuler</button>
              <button onClick={handleSubmit} disabled={submitting || !submitForm.partner_id || !submitForm.case_id} className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 disabled:opacity-50">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
