'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AdminLayout from '../components/AdminLayout';
import { Building2, Search, Loader2, X, ChevronDown, Globe, RefreshCw, BookOpen, Send, Clock, FileText, Filter, CheckCircle2, XCircle, AlertTriangle, MapPin, Users, ArrowRight, Eye,  } from 'lucide-react';
import { toast } from 'sonner';
import { caseFileLabel } from '@/lib/caseFileLabel';

interface Partner {
  id: string;
  name: string;
  type: string;
  zones: string[];
  criteria: string | null;
  criteria_text?: string | null;
  internal_contact: string | null;
  contact_email: string | null;
  is_active: boolean;
}

interface CaseFile {
  id: string;
  ref: string;
  project_name: string | null;
  type: string;
  status: string;
  country: string;
  sector: string;
  amount: string;
  client_name: string | null;
  client_email: string | null;
  created_at: string;
}

interface SubmissionEntry {
  id: string;
  partner_id: string;
  case_id: string;
  submitted_by: string | null;
  submitted_by_email: string | null;
  note: string | null;
  status: string;
  response_note: string | null;
  created_at: string;
  partner_name?: string;
  case_ref?: string;
  case_title?: string;
}

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

const PARTNER_TYPES: Record<string, { labelFr: string; labelEn: string; color: string; bg: string }> = {
  banque: { labelFr: 'Banque', labelEn: 'Bank', color: 'text-blue-700', bg: 'bg-blue-100' },
  fonds: { labelFr: 'Fonds', labelEn: 'Fund', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  courtier_instrument: { labelFr: 'Courtier instrument', labelEn: 'Instrument Broker', color: 'text-amber-700', bg: 'bg-amber-100' },
  avocat: { labelFr: 'Avocat', labelEn: 'Lawyer', color: 'text-purple-700', bg: 'bg-purple-100' },
  consultant: { labelFr: 'Consultant', labelEn: 'Consultant', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  autre: { labelFr: 'Autre', labelEn: 'Other', color: 'text-slate-700', bg: 'bg-slate-100' },
};

const SUBMISSION_STATUS: Record<string, { labelFr: string; labelEn: string; color: string; bg: string; icon: React.ElementType }> = {
  soumis: { labelFr: 'Soumis', labelEn: 'Submitted', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: Send },
  en_attente: { labelFr: 'En attente', labelEn: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  accepte: { labelFr: 'Accepté', labelEn: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  refuse: { labelFr: 'Refusé', labelEn: 'Refused', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  en_negociation: { labelFr: 'En négociation', labelEn: 'In Negotiation', color: 'text-purple-700', bg: 'bg-purple-100', icon: ArrowRight },
  cloture: { labelFr: 'Clôturé', labelEn: 'Closed', color: 'text-slate-700', bg: 'bg-slate-100', icon: CheckCircle2 },
};

function validateAssignment(partner: Partner, caseFile: CaseFile): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Region matching
  if (partner.zones && partner.zones.length > 0 && caseFile.country) {
    const caseCountryLower = caseFile.country.toLowerCase();
    const zonesLower = partner.zones.map((z) => z.toLowerCase());
    const regionMatch = zonesLower.some(
      (z) =>
        caseCountryLower.includes(z) ||
        z.includes(caseCountryLower) ||
        z.includes('global') ||
        z.includes('monde') ||
        z.includes('world')
    );
    if (!regionMatch) {
      warnings.push(
        `Region mismatch: partner covers [${partner.zones.join(', ')}], case country is "${caseFile.country}"`
      );
    }
  }

  // Partner type vs case type
  const caseTypeLower = (caseFile.type || '').toLowerCase();
  if (partner.type === 'courtier_instrument' && !caseTypeLower.includes('instrument') && !caseTypeLower.includes('sblc') && !caseTypeLower.includes('garantie')) {
    warnings.push('Partner type "Instrument Broker" may not match this case type');
  }
  if (partner.type === 'avocat' && !caseTypeLower.includes('conseil') && !caseTypeLower.includes('legal')) {
    warnings.push('Partner type "Lawyer" is unusual for this case type');
  }

  // Criteria check
  const criteriaText = partner.criteria_text || partner.criteria || '';
  if (criteriaText) {
    const critLower = criteriaText.toLowerCase();
    if (caseFile.sector && !critLower.includes(caseFile.sector.toLowerCase()) && !critLower.includes('tous') && !critLower.includes('all')) {
      warnings.push(`Partner criteria may not cover sector "${caseFile.sector}"`);
    }
  }

  // Status check
  const assignableStatuses = ['RECU', 'EN_ANALYSE', 'ELIGIBLE', 'EN_REVUE_COMPLIANCE'];
  if (!assignableStatuses.includes(caseFile.status)) {
    errors.push(`Case status "${caseFile.status}" is not suitable for new partner assignment`);
  }

  // Active check
  if (!partner.is_active) {
    errors.push('Partner is inactive and cannot receive new assignments');
  }

  return { valid: errors.length === 0, warnings, errors };
}

export default function PartnerAssignmentsPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'assign' | 'journal'>('assign');

  // Partners state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('');

  // Cases state
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [caseSearch, setCaseSearch] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('all');

  // Assignment state
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null);
  const [assignNote, setAssignNote] = useState('');
  const [assignStatus, setAssignStatus] = useState('soumis');
  const [assigning, setAssigning] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Journal state
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [journalSearch, setJournalSearch] = useState('');
  const [journalStatusFilter, setJournalStatusFilter] = useState('all');

  // Detail modal
  const [detailEntry, setDetailEntry] = useState<SubmissionEntry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newEntryStatus, setNewEntryStatus] = useState('');
  const [responseNote, setResponseNote] = useState('');

  const fetchPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const { data, error } = await supabase.from('partners').select('*').order('name');
      if (error) throw error;
      setPartners(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  const fetchCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_files')
        .select('id, ref, project_name, type, status, project_country, sector, amount, contact_name, contact_email, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []).map((row: Record<string, unknown>) => {
        const projectCountry = row.project_country as string | null | undefined;
        return {
          id: row.id as string,
          ref: row.ref as string,
          project_name: (row.project_name as string | null) ?? null,
          type: row.type as string,
          status: row.status as string,
          country: (typeof projectCountry === 'string' ? projectCountry : '') || '',
          sector: row.sector as string,
          amount: row.amount as string,
          client_name: (row.contact_name as string | null) ?? null,
          client_email: (row.contact_email as string | null) ?? null,
          created_at: row.created_at as string,
        } satisfies CaseFile;
      });
      setCases(rows);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCasesLoading(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const enriched = (data || []).map((s: SubmissionEntry) => {
        const partner = partners.find((p) => p.id === s.partner_id);
        const caseFile = cases.find((c) => c.id === s.case_id);
        return {
          ...s,
          partner_name: partner?.name || s.partner_id?.slice(0, 8) + '…',
          case_ref: caseFile?.ref || s.case_id?.slice(0, 8) + '…',
          case_title: caseFile ? caseFileLabel(caseFile) : '-',
        };
      });
      setSubmissions(enriched);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [partners, cases]);

  useEffect(() => { fetchPartners(); fetchCases(); }, [fetchPartners, fetchCases]);
  useEffect(() => {
    if (activeTab === 'journal' && partners.length >= 0 && cases.length >= 0) {
      fetchSubmissions();
    }
  }, [activeTab, fetchSubmissions]);

  // Revalidate when selection changes
  useEffect(() => {
    if (selectedPartner && selectedCase) {
      setValidation(validateAssignment(selectedPartner, selectedCase));
    } else {
      setValidation(null);
    }
  }, [selectedPartner, selectedCase]);

  const handleAssign = async () => {
    if (!selectedPartner || !selectedCase) {
      toast.error(t('Partenaire et dossier requis', 'Partner and case required'));
      return;
    }
    if (validation && !validation.valid) {
      toast.error(t('Validation échouée - corrigez les erreurs avant de soumettre', 'Validation failed - fix errors before submitting'));
      return;
    }
    setAssigning(true);
    try {
      const { error } = await supabase.from('partner_submissions').insert({
        partner_id: selectedPartner.id,
        case_id: selectedCase.id,
        submitted_by: user?.id,
        submitted_by_email: user?.email,
        note: assignNote.trim() || null,
        status: assignStatus,
      });
      if (error) throw error;

      // Log to audit
      const { error: logError } = await supabase.from('compliance_logs').insert({
        actor_id: user?.id,
        actor_email: user?.email,
        action: 'PARTNER_ASSIGNMENT',
        target_ref: selectedCase.ref,
        detail: `Case ${selectedCase.ref} assigned to partner "${selectedPartner.name}" (${selectedPartner.type}) - status: ${assignStatus}`,
        severity: 'info',
      });
      if (logError) {
        console.warn('Failed to write compliance log:', logError.message);
      }

      toast.success(t('Affectation enregistrée dans le journal', 'Assignment recorded in journal'));
      setSelectedPartner(null);
      setSelectedCase(null);
      setAssignNote('');
      setAssignStatus('soumis');
      setValidation(null);
    } catch (err: any) {
      toast.error(err.message || t('Erreur lors de l\'affectation', 'Assignment error'));
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateEntryStatus = async () => {
    if (!detailEntry || !newEntryStatus) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('partner_submissions')
        .update({ status: newEntryStatus, response_note: responseNote.trim() || null })
        .eq('id', detailEntry.id);
      if (error) throw error;
      toast.success(t('Statut mis à jour', 'Status updated'));
      setDetailEntry(null);
      setNewEntryStatus('');
      setResponseNote('');
      await fetchSubmissions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filtered partners
  const filteredPartners = partners.filter((p) => {
    if (!p.is_active) return false;
    if (partnerTypeFilter !== 'all' && p.type !== partnerTypeFilter) return false;
    if (regionFilter && p.zones) {
      const match = p.zones.some((z) => z.toLowerCase().includes(regionFilter.toLowerCase()));
      if (!match) return false;
    }
    if (partnerSearch) {
      const q = partnerSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    if (caseStatusFilter !== 'all' && c.status !== caseStatusFilter) return false;
    if (caseSearch) {
      const q = caseSearch.toLowerCase();
      return (
        caseFileLabel(c).toLowerCase().includes(q) ||
        c.ref.toLowerCase().includes(q) ||
        (c.client_name || '').toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered journal
  const filteredSubmissions = submissions.filter((s) => {
    if (journalStatusFilter !== 'all' && s.status !== journalStatusFilter) return false;
    if (journalSearch) {
      const q = journalSearch.toLowerCase();
      return (
        (s.partner_name || '').toLowerCase().includes(q) ||
        (s.case_ref || '').toLowerCase().includes(q) ||
        (s.case_title || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const allRegions = Array.from(new Set(partners.flatMap((p) => p.zones || []))).sort();

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-gold" />
            <h1 className="font-display text-2xl font-bold text-navy">
              {t('Affectations Partenaires', 'Partner Assignments')}
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            {t('Gérer les affectations dossier–partenaire avec validation de critères et journal de suivi', 'Manage case–partner assignments with criteria validation and tracking journal')}
          </p>
        </div>
        <button
          onClick={() => { fetchPartners(); fetchCases(); if (activeTab === 'journal') fetchSubmissions(); }}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Confidentiality notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-4 text-xs text-amber-800">
        <Building2 size={14} className="flex-shrink-0" />
        <span>
          <strong>{t('Confidentiel :', 'Confidential:')}</strong>{' '}
          {t('Les affectations partenaires sont strictement réservées au back-office. Le client ne voit que "soumis à une institution agréée".', 'Partner assignments are strictly back-office only. Clients only see "submitted to an approved institution".')}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('assign')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'assign' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
        >
          <ArrowRight size={14} />
          {t('Nouvelle affectation', 'New Assignment')}
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'journal' ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
        >
          <BookOpen size={14} />
          {t('Journal de soumission', 'Submission Journal')} ({submissions.length})
        </button>
      </div>

      {/* ── ASSIGN TAB ── */}
      {activeTab === 'assign' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Partner selection panel */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Building2 size={15} className="text-navy" />
              <span className="text-sm font-semibold text-navy">{t('1. Sélectionner un partenaire', '1. Select a Partner')}</span>
              {selectedPartner && (
                <span className="ml-auto text-xs bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full font-semibold truncate max-w-[120px]">
                  {selectedPartner.name}
                </span>
              )}
            </div>

            {/* Partner filters */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  placeholder={t('Rechercher...', 'Search...')}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={partnerTypeFilter}
                    onChange={(e) => setPartnerTypeFilter(e.target.value)}
                    className="w-full appearance-none pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="all">{t('Tous types', 'All types')}</option>
                    {Object.entries(PARTNER_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{lang === 'fr' ? v.labelFr : v.labelEn}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative flex-1">
                  <MapPin size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full appearance-none pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="">{t('Toutes régions', 'All regions')}</option>
                    {allRegions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Partner list */}
            <div className="flex-1 overflow-y-auto max-h-80 p-2 space-y-1.5">
              {partnersLoading ? (
                <div className="flex items-center justify-center h-24"><Loader2 size={22} className="animate-spin text-gold" /></div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">{t('Aucun partenaire actif trouvé', 'No active partners found')}</div>
              ) : filteredPartners.map((p) => {
                const typeCfg = PARTNER_TYPES[p.type] || PARTNER_TYPES.autre;
                const isSelected = selectedPartner?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPartner(isSelected ? null : p)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${isSelected ? 'border-gold bg-gold/5 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-navy text-sm">{p.name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${typeCfg.bg} ${typeCfg.color}`}>
                        {lang === 'fr' ? typeCfg.labelFr : typeCfg.labelEn}
                      </span>
                    </div>
                    {p.zones && p.zones.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Globe size={10} />
                        <span className="truncate">{p.zones.join(', ')}</span>
                      </div>
                    )}
                    {(p.criteria_text || p.criteria) && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.criteria_text || p.criteria}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Case selection panel */}
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <FileText size={15} className="text-navy" />
              <span className="text-sm font-semibold text-navy">{t('2. Sélectionner un dossier', '2. Select a Case')}</span>
              {selectedCase && (
                <span className="ml-auto text-xs bg-navy/10 text-navy border border-navy/20 px-2 py-0.5 rounded-full font-semibold font-mono truncate max-w-[120px]">
                  {selectedCase.ref}
                </span>
              )}
            </div>

            {/* Case filters */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  placeholder={t('Ref, titre, client, pays...', 'Ref, title, client, country...')}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="relative">
                <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={caseStatusFilter}
                  onChange={(e) => setCaseStatusFilter(e.target.value)}
                  className="w-full appearance-none pl-7 pr-6 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="all">{t('Tous statuts', 'All statuses')}</option>
                  <option value="RECU">REÇU</option>
                  <option value="EN_ANALYSE">EN ANALYSE</option>
                  <option value="ELIGIBLE">ÉLIGIBLE</option>
                  <option value="EN_REVUE_COMPLIANCE">EN REVUE COMPLIANCE</option>
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Case list */}
            <div className="flex-1 overflow-y-auto max-h-80 p-2 space-y-1.5">
              {casesLoading ? (
                <div className="flex items-center justify-center h-24"><Loader2 size={22} className="animate-spin text-gold" /></div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">{t('Aucun dossier trouvé', 'No cases found')}</div>
              ) : filteredCases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCase(isSelected ? null : c)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${isSelected ? 'border-navy bg-navy/5 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-gold font-semibold">{c.ref}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{c.status}</span>
                    </div>
                    <p className="font-semibold text-navy text-sm truncate">{caseFileLabel(c) || c.type}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      {c.country && <span className="flex items-center gap-0.5"><MapPin size={9} />{c.country}</span>}
                      {c.sector && <span>· {c.sector}</span>}
                      {c.amount && <span>· {c.amount}</span>}
                    </div>
                    {c.client_name && <p className="text-[11px] text-slate-400 mt-0.5">{c.client_name}</p>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation + Assignment form */}
          {(selectedPartner || selectedCase) && (
            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-navy" />
                <span className="text-sm font-semibold text-navy">{t('3. Validation & Soumission', '3. Validation & Submission')}</span>
              </div>
              <div className="p-4 space-y-4">
                {/* Selection summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border ${selectedPartner ? 'border-gold/30 bg-gold/5' : 'border-dashed border-slate-200 bg-slate-50'}`}>
                    <p className="text-xs font-semibold text-slate-500 mb-1">{t('Partenaire sélectionné', 'Selected Partner')}</p>
                    {selectedPartner ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-navy text-sm">{selectedPartner.name}</p>
                          <p className="text-xs text-slate-500">{lang === 'fr' ? PARTNER_TYPES[selectedPartner.type]?.labelFr : PARTNER_TYPES[selectedPartner.type]?.labelEn}</p>
                        </div>
                        <button onClick={() => setSelectedPartner(null)} className="text-slate-400 hover:text-red-500 p-1"><X size={14} /></button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">{t('Aucun partenaire sélectionné', 'No partner selected')}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg border ${selectedCase ? 'border-navy/30 bg-navy/5' : 'border-dashed border-slate-200 bg-slate-50'}`}>
                    <p className="text-xs font-semibold text-slate-500 mb-1">{t('Dossier sélectionné', 'Selected Case')}</p>
                    {selectedCase ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-navy text-sm">{caseFileLabel(selectedCase) || selectedCase.type}</p>
                          <p className="text-xs text-slate-500 font-mono">{selectedCase.ref} · {selectedCase.status}</p>
                        </div>
                        <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-red-500 p-1"><X size={14} /></button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">{t('Aucun dossier sélectionné', 'No case selected')}</p>
                    )}
                  </div>
                </div>

                {/* Validation results */}
                {validation && (
                  <div className="space-y-2">
                    {validation.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                          <XCircle size={13} /> {t('Erreurs de validation', 'Validation Errors')}
                        </p>
                        {validation.errors.map((e, i) => (
                          <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0">✗</span>{e}
                          </p>
                        ))}
                      </div>
                    )}
                    {validation.warnings.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle size={13} /> {t('Avertissements', 'Warnings')}
                        </p>
                        {validation.warnings.map((w, i) => (
                          <p key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                            <span className="mt-0.5 flex-shrink-0">⚠</span>{w}
                          </p>
                        ))}
                      </div>
                    )}
                    {validation.valid && validation.warnings.length === 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-700">{t('Validation réussie - affectation autorisée', 'Validation passed - assignment authorized')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Assignment form */}
                {selectedPartner && selectedCase && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Statut de soumission', 'Submission Status')}</label>
                      <div className="relative">
                        <select
                          value={assignStatus}
                          onChange={(e) => setAssignStatus(e.target.value)}
                          className="w-full appearance-none px-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/20"
                        >
                          {Object.entries(SUBMISSION_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{lang === 'fr' ? v.labelFr : v.labelEn}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Note interne', 'Internal Note')}</label>
                      <input
                        value={assignNote}
                        onChange={(e) => setAssignNote(e.target.value)}
                        placeholder={t('Conditions, remarques...', 'Conditions, remarks...')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/20"
                      />
                    </div>
                  </div>
                )}

                {selectedPartner && selectedCase && (
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                    <div className="flex-1 text-xs text-slate-400 flex items-center gap-1">
                      <FileText size={11} />
                      {t('Cette entrée sera enregistrée dans le journal confidentiel', 'This entry will be recorded in the confidential journal')}
                    </div>
                    <button
                      onClick={handleAssign}
                      disabled={assigning || (validation !== null && !validation.valid)}
                      className="flex items-center gap-2 px-5 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 disabled:opacity-50 transition-all"
                    >
                      {assigning ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {t('Enregistrer l\'affectation', 'Record Assignment')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── JOURNAL TAB ── */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {/* Journal filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                placeholder={t('Partenaire, ref dossier...', 'Partner, case ref...')}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div className="relative">
              <select
                value={journalStatusFilter}
                onChange={(e) => setJournalStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
              >
                <option value="all">{t('Tous statuts', 'All statuses')}</option>
                {Object.entries(SUBMISSION_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>{lang === 'fr' ? v.labelFr : v.labelEn}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={fetchSubmissions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={12} />
              {t('Actualiser', 'Refresh')}
            </button>
          </div>

          {/* Journal table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-navy" />
                <span className="text-sm font-semibold text-navy">{t('Journal de soumission partenaires', 'Partner Submission Journal')}</span>
              </div>
              <span className="text-xs text-slate-400">{filteredSubmissions.length} {t('entrée(s)', 'entry/entries')}</span>
            </div>
            {submissionsLoading ? (
              <div className="flex items-center justify-center h-40"><Loader2 size={28} className="animate-spin text-gold" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">{t('Partenaire', 'Partner')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">{t('Dossier', 'Case')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">{t('Statut', 'Status')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">{t('Soumis par', 'Submitted by')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">{t('Note', 'Note')}</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">{t('Date', 'Date')}</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-slate-400">{t('Aucune soumission enregistrée', 'No submissions recorded')}</td></tr>
                    ) : filteredSubmissions.map((s) => {
                      const statusCfg = SUBMISSION_STATUS[s.status] || SUBMISSION_STATUS.soumis;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-navy text-sm">{s.partner_name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-gold font-semibold">{s.case_ref}</div>
                            <div className="text-xs text-slate-500 truncate max-w-[120px]">{s.case_title}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                              <StatusIcon size={10} />
                              {lang === 'fr' ? statusCfg.labelFr : statusCfg.labelEn}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{s.submitted_by_email || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{s.note || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1"><Clock size={10} />{formatDate(s.created_at)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { setDetailEntry(s); setNewEntryStatus(s.status); setResponseNote(s.response_note || ''); }}
                              className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors"
                              title={t('Voir / modifier', 'View / edit')}
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail / Edit modal */}
      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailEntry(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-navy" />
                <h2 className="font-bold text-navy">{t('Détail de soumission', 'Submission Detail')}</h2>
              </div>
              <button onClick={() => setDetailEntry(null)} className="text-slate-400 hover:text-navy p-1 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{t('Partenaire', 'Partner')}</p>
                  <p className="font-semibold text-navy">{detailEntry.partner_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{t('Dossier', 'Case')}</p>
                  <p className="font-mono text-xs text-gold font-semibold">{detailEntry.case_ref}</p>
                  <p className="text-xs text-slate-600">{detailEntry.case_title}</p>
                </div>
              </div>
              {detailEntry.note && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{t('Note initiale', 'Initial Note')}</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{detailEntry.note}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Mettre à jour le statut', 'Update Status')}</label>
                <div className="relative">
                  <select
                    value={newEntryStatus}
                    onChange={(e) => setNewEntryStatus(e.target.value)}
                    className="w-full appearance-none px-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                  >
                    {Object.entries(SUBMISSION_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>{lang === 'fr' ? v.labelFr : v.labelEn}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Note de réponse', 'Response Note')}</label>
                <textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none"
                  placeholder={t('Retour du partenaire, conditions...', 'Partner feedback, conditions...')}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setDetailEntry(null)} className="px-4 py-2 text-slate-600 hover:text-navy text-sm font-medium">{t('Annuler', 'Cancel')}</button>
              <button
                onClick={handleUpdateEntryStatus}
                disabled={updatingStatus}
                className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy/90 disabled:opacity-50"
              >
                {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {t('Mettre à jour', 'Update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
