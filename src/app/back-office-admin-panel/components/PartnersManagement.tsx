'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Link2,
  MapPin,
  FileText,
  BarChart3,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  type: 'BANK' | 'INVESTOR' | 'GUARANTOR' | 'ADVISOR' | 'OTHER';
  regions: string[];
  criteria: string;
  submissionJournal: SubmissionEntry[];
  activeDeals: number;
  createdAt: string;
}

interface SubmissionEntry {
  dossierId: string;
  dossierRef: string;
  submittedAt: string;
  status: string;
  notes: string;
}

const PARTNER_TYPES = {
  BANK: { fr: 'Banque', en: 'Bank', color: 'bg-blue-100 text-blue-700' },
  INVESTOR: { fr: 'Investisseur', en: 'Investor', color: 'bg-green-100 text-green-700' },
  GUARANTOR: { fr: 'Garant', en: 'Guarantor', color: 'bg-purple-100 text-purple-700' },
  ADVISOR: { fr: 'Conseiller', en: 'Advisor', color: 'bg-amber-100 text-amber-700' },
  OTHER: { fr: 'Autre', en: 'Other', color: 'bg-gray-100 text-gray-700' },
};

const REGIONS = ['Europe', 'Suisse', 'France', 'Belgique', 'Luxembourg', 'International'];

export default function PartnersManagement() {
  const { lang } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK' as const,
    regions: [] as string[],
    criteria: '',
  });

  // Mock data - à remplacer par des requêtes réelles quand la table existera
  const mockPartners: Partner[] = [
    {
      id: '1',
      name: 'Crédit Suisse',
      type: 'BANK',
      regions: ['Suisse', 'International'],
      criteria: 'Projets > 5M EUR, Secteur énergétique prioritaire',
      submissionJournal: [
        {
          dossierId: 'dos-001',
          dossierRef: 'GLC-2026-1234',
          submittedAt: '2026-04-15',
          status: 'ACCEPTED',
          notes: 'Approuvé pour négociation',
        },
      ],
      activeDeals: 3,
      createdAt: '2026-01-01',
    },
    {
      id: '2',
      name: 'BNP Paribas',
      type: 'BANK',
      regions: ['France', 'Europe'],
      criteria: 'Secteur TMT, 2M-20M EUR, Mécanisme syndication',
      submissionJournal: [
        {
          dossierId: 'dos-002',
          dossierRef: 'GLC-2026-1235',
          submittedAt: '2026-04-10',
          status: 'PENDING',
          notes: 'En évaluation',
        },
      ],
      activeDeals: 2,
      createdAt: '2026-02-01',
    },
  ];

  const filteredPartners = useMemo(() => {
    return mockPartners.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.criteria.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'ALL' || p.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, filterType]);

  const handleAddPartner = async () => {
    if (!formData.name || !formData.regions.length) {
      toast.error(
        lang === 'fr' ? 'Veuillez remplir les champs requis' : 'Please fill in required fields'
      );
      return;
    }

    try {
      // TODO: Remplacer par vraie requête Supabase quand la table partenaires existera
      const newPartner: Partner = {
        id: Date.now().toString(),
        ...formData,
        submissionJournal: [],
        activeDeals: 0,
        createdAt: new Date().toISOString(),
      };

      setPartners([...partners, newPartner]);
      setFormData({ name: '', type: 'BANK', regions: [], criteria: '' });
      setShowForm(false);
      toast.success(lang === 'fr' ? 'Partenaire ajouté' : 'Partner added');
    } catch (err) {
      toast.error(lang === 'fr' ? "Erreur lors de l'ajout" : 'Error adding partner');
    }
  };

  const handleDeletePartner = (id: string) => {
    setPartners(partners.filter((p) => p.id !== id));
    toast.success(lang === 'fr' ? 'Partenaire supprimé' : 'Partner deleted');
  };

  return (
    <div className="space-y-6">
      <Toaster position="bottom-right" richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            {lang === 'fr' ? 'Gestion des Partenaires' : 'Partners Management'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {lang === 'fr'
              ? 'Partenaires financiers, investisseurs et conseillers institutionnels'
              : 'Financial partners, investors and institutional advisors'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-navy-900 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-navy-800"
        >
          <Plus size={16} />
          {lang === 'fr' ? 'Nouveau partenaire' : 'New Partner'}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="ALL">{lang === 'fr' ? 'Tous les types' : 'All types'}</option>
          {Object.entries(PARTNER_TYPES).map(([key, val]) => (
            <option key={key} value={key}>
              {lang === 'fr' ? val.fr : val.en}
            </option>
          ))}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <input
            type="text"
            placeholder={lang === 'fr' ? 'Nom du partenaire' : 'Partner name'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
          />
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
          >
            {Object.entries(PARTNER_TYPES).map(([key, val]) => (
              <option key={key} value={key}>
                {lang === 'fr' ? val.fr : val.en}
              </option>
            ))}
          </select>
          <div>
            <label className="block text-sm font-semibold mb-2">
              {lang === 'fr' ? 'Régions' : 'Regions'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REGIONS.map((region) => (
                <label key={region} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.regions.includes(region)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, regions: [...formData.regions, region] });
                      } else {
                        setFormData({
                          ...formData,
                          regions: formData.regions.filter((r) => r !== region),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{region}</span>
                </label>
              ))}
            </div>
          </div>
          <textarea
            placeholder={lang === 'fr' ? 'Critères de sélection' : 'Selection criteria'}
            value={formData.criteria}
            onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm h-24"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold"
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              onClick={handleAddPartner}
              className="px-4 py-2 bg-navy-900 text-white rounded-xl text-sm font-semibold"
            >
              {lang === 'fr' ? 'Ajouter' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Partners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-navy-900">{partner.name}</h3>
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mt-2 ${PARTNER_TYPES[partner.type].color}`}
                >
                  {lang === 'fr' ? PARTNER_TYPES[partner.type].fr : PARTNER_TYPES[partner.type].en}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit3 size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeletePartner(partner.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>

            {/* Regions */}
            <div className="flex items-start gap-2 mb-3">
              <MapPin size={14} className="text-gray-400 mt-1 flex-shrink-0" />
              <div className="text-xs text-gray-600">{partner.regions.join(', ')}</div>
            </div>

            {/* Criteria */}
            <div className="flex items-start gap-2 mb-4 pb-4 border-b border-gray-100">
              <FileText size={14} className="text-gray-400 mt-1 flex-shrink-0" />
              <p className="text-xs text-gray-600 line-clamp-2">{partner.criteria}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <BarChart3 size={14} className="text-gray-400" />
                  <span className="text-gray-600">
                    {partner.activeDeals} {lang === 'fr' ? 'dossiers' : 'deals'}
                  </span>
                </div>
              </div>
              <button className="flex items-center gap-1 text-navy-900 hover:text-navy-700 font-semibold">
                <Link2 size={14} />
                {lang === 'fr' ? 'Affecter' : 'Assign'}
              </button>
            </div>

            {/* Submission Journal Preview */}
            {partner.submissionJournal.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  {lang === 'fr' ? 'Dernière présentation' : 'Latest submission'}
                </p>
                <div className="text-xs text-gray-600">
                  <p>{partner.submissionJournal[0].dossierRef}</p>
                  <p className="text-gray-500">
                    {new Date(partner.submissionJournal[0].submittedAt).toLocaleDateString(
                      lang === 'fr' ? 'fr-FR' : 'en-US'
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {lang === 'fr' ? 'Aucun partenaire trouvé' : 'No partners found'}
          </p>
        </div>
      )}
    </div>
  );
}
