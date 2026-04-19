'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, X, ChevronDown, Save, Bookmark, Trash2, Check, Loader2, SlidersHorizontal,  } from 'lucide-react';
import { toast } from 'sonner';

export interface FilterState {
  search: string;
  status: string;
  riskTags: string[];
  dateFrom: string;
  dateTo: string;
  partnerId: string;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  statusOptions: { value: string; label: string }[];
  riskTagOptions: string[];
  partnerOptions?: { id: string; name: string }[];
  dashboard: 'analyst' | 'compliance' | 'admin';
  resultCount: number;
  totalCount: number;
  accentColor?: string;
}

const EMPTY_FILTERS: FilterState = {
  search: '',
  status: 'ALL',
  riskTags: [],
  dateFrom: '',
  dateTo: '',
  partnerId: '',
};

export default function AdvancedFilters({
  filters,
  onChange,
  statusOptions,
  riskTagOptions,
  partnerOptions = [],
  dashboard,
  resultCount,
  totalCount,
  accentColor = 'blue',
}: AdvancedFiltersProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [loadingPresets, setLoadingPresets] = useState(false);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.riskTags.length > 0 ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.partnerId !== '';

  const activeFilterCount = [
    filters.search !== '',
    filters.status !== 'ALL',
    filters.riskTags.length > 0,
    filters.dateFrom !== '' || filters.dateTo !== '',
    filters.partnerId !== '',
  ].filter(Boolean).length;

  const fetchPresets = useCallback(async () => {
    if (!user) return;
    setLoadingPresets(true);
    try {
      const { data } = await supabase
        .from('filter_presets')
        .select('*')
        .eq('user_id', user.id)
        .eq('dashboard', dashboard)
        .order('created_at', { ascending: false });
      setPresets((data || []).map((p: any) => ({ id: p.id, name: p.name, filters: p.filters })));
    } catch {}
    finally { setLoadingPresets(false); }
  }, [user, dashboard]);

  useEffect(() => {
    if (showPresets) fetchPresets();
  }, [showPresets, fetchPresets]);

  const savePreset = async () => {
    if (!user || !presetName.trim()) return;
    setSavingPreset(true);
    try {
      const { data, error } = await supabase.from('filter_presets').insert({
        user_id: user.id,
        name: presetName.trim(),
        dashboard,
        filters,
      }).select().single();
      if (error) throw error;
      setPresets((prev) => [{ id: data.id, name: data.name, filters: data.filters }, ...prev]);
      setPresetName('');
      setShowSaveForm(false);
      toast.success('Filtre sauvegardé');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingPreset(false);
    }
  };

  const deletePreset = async (id: string) => {
    try {
      await supabase.from('filter_presets').delete().eq('id', id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
      toast.success('Filtre supprimé');
    } catch {}
  };

  const applyPreset = (preset: FilterPreset) => {
    onChange(preset.filters);
    setShowPresets(false);
    toast.success(`Filtre "${preset.name}" appliqué`);
  };

  const clearFilters = () => {
    onChange(EMPTY_FILTERS);
  };

  const focusRing = `focus:ring-2 focus:ring-${accentColor}-500/20 focus:border-${accentColor}-400`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-4 space-y-3">
      {/* Main search row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Rechercher par titre, email, ID..."
            className={`w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none ${focusRing}`}
          />
          {filters.search && (
            <button onClick={() => onChange({ ...filters, search: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className={`appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none ${focusRing} bg-white w-full sm:w-auto`}
          >
            <option value="ALL">Tous les statuts</option>
            {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showAdvanced || activeFilterCount > 1 ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          <SlidersHorizontal size={14} />
          Filtres
          {activeFilterCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${showAdvanced || activeFilterCount > 1 ? 'bg-white text-navy' : 'bg-navy text-white'}`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Presets */}
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Bookmark size={14} />
            Presets
          </button>
          {showPresets && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-xs font-semibold text-slate-600">Filtres sauvegardés</span>
                <button onClick={() => { setShowSaveForm(true); setShowPresets(false); }} className="text-xs text-navy hover:underline flex items-center gap-1">
                  <Save size={11} /> Sauvegarder actuel
                </button>
              </div>
              {loadingPresets ? (
                <div className="flex justify-center py-3"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
              ) : presets.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">Aucun preset sauvegardé</p>
              ) : (
                <div className="space-y-1">
                  {presets.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg group">
                      <button onClick={() => applyPreset(p)} className="flex-1 text-left text-sm text-slate-700 truncate">{p.name}</button>
                      <button onClick={() => deletePreset(p.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save preset form */}
      {showSaveForm && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Nom du filtre..."
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            onKeyDown={(e) => e.key === 'Enter' && savePreset()}
          />
          <button onClick={savePreset} disabled={savingPreset || !presetName.trim()} className="flex items-center gap-1 px-3 py-1.5 bg-navy text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {savingPreset ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Sauvegarder
          </button>
          <button onClick={() => { setShowSaveForm(false); setPresetName(''); }} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date from */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date de début</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
          {/* Date to */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date de fin</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
          {/* Partner filter */}
          {partnerOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Partenaire</label>
              <div className="relative">
                <select
                  value={filters.partnerId}
                  onChange={(e) => onChange({ ...filters, partnerId: e.target.value })}
                  className="appearance-none w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white"
                >
                  <option value="">Tous les partenaires</option>
                  {partnerOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
          {/* Risk tags */}
          {riskTagOptions.length > 0 && (
            <div className={partnerOptions.length > 0 ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tags risque</label>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {riskTagOptions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = filters.riskTags.includes(tag)
                        ? filters.riskTags.filter((t) => t !== tag)
                        : [...filters.riskTags, tag];
                      onChange({ ...filters, riskTags: newTags });
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${filters.riskTags.includes(tag) ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {tag.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results + clear */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">
          {resultCount} résultat{resultCount !== 1 ? 's' : ''} sur {totalCount}
        </span>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors">
            <X size={12} /> Réinitialiser les filtres
          </button>
        )}
      </div>
    </div>
  );
}
