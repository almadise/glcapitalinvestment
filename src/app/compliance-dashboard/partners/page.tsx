'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ComplianceLayout from '../components/ComplianceLayout';
import { Building2, Search, Loader2, AlertCircle, Globe, Mail, RefreshCw } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  type: string;
  zones: string[];
  criteria: string | null;
  internal_contact: string | null;
  contact_email: string | null;
  notes: string | null;
  is_active: boolean;
}

const PARTNER_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  banque: { label: 'Banque', color: 'text-blue-700', bg: 'bg-blue-100' },
  fonds: { label: 'Fonds', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  courtier_instrument: {
    label: 'Courtier instrument',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
  },
  avocat: { label: 'Avocat', color: 'text-purple-700', bg: 'bg-purple-100' },
  consultant: { label: 'Consultant', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  autre: { label: 'Autre', color: 'text-slate-700', bg: 'bg-slate-100' },
};

export default function CompliancePartnersPage() {
  const supabase = createClient();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (fetchError) throw fetchError;
      setPartners(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const filtered = partners.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ComplianceLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={20} className="text-emerald-600" />
            <h1 className="font-display text-2xl font-bold text-navy">Répertoire Partenaires</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Consultation des partenaires agréés - confidentiel back-office
          </p>
        </div>
        <button
          onClick={fetchPartners}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-4 text-xs text-amber-800">
        <Building2 size={14} className="flex-shrink-0" />
        <span>
          <strong>Confidentiel :</strong> Ces informations ne sont pas visibles côté portail client.
          Le client voit uniquement "dossier soumis à une institution agréée".
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un partenaire..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="animate-spin text-gold" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              Aucun partenaire trouvé
            </div>
          ) : (
            filtered.map((p) => {
              const typeCfg = PARTNER_TYPES[p.type] || PARTNER_TYPES.autre;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  <div className="mb-3">
                    <h3 className="font-bold text-navy text-sm">{p.name}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${typeCfg.bg} ${typeCfg.color}`}
                    >
                      {typeCfg.label}
                    </span>
                  </div>
                  {p.zones && p.zones.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <Globe size={11} />
                      <span>{p.zones.join(', ')}</span>
                    </div>
                  )}
                  {p.criteria && (
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">{p.criteria}</p>
                  )}
                  {p.internal_contact && (
                    <div className="text-xs text-slate-500 mb-1">
                      <span className="font-medium">Contact interne :</span> {p.internal_contact}
                    </div>
                  )}
                  {p.contact_email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail size={11} />
                      {p.contact_email}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </ComplianceLayout>
  );
}
