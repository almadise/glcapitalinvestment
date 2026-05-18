'use client';
import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Hotel,
  Zap,
  Leaf,
  BarChart3,
  Plane,
  Anchor,
  Fuel,
  ShoppingCart,
  TreePine,
  TrendingUp,
  Home,
  Briefcase,
  Package,
  DollarSign,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { useLanguage } from '@/context/LanguageContext';

export default function GlobalFundingProgramPage() {
  const { lang } = useLanguage();

  const assetClasses = lang === 'fr'
    ? [
        { icon: Hotel, title: 'Hôtels et Resorts', description: 'Structures hôtelières de luxe et complexes touristiques' },
        { icon: Building2, title: 'Développements Commerciaux', description: 'Centres commerciaux et zones commerciales intégrées' },
        { icon: AlertCircle, title: 'Projets de Construction', description: 'Financement de projets immobiliers en phase de construction' },
        { icon: Zap, title: 'Projets Énergétiques', description: 'Énergie solaire, éolienne, hydro-électrique et gaz naturel' },
        { icon: Building2, title: 'Complexes de Bureaux', description: 'Immeubles de bureaux de classe A et B' },
        { icon: DollarSign, title: 'Fonds de Roulement', description: 'Financement du besoin en fonds de roulement d\'exploitation' },
        { icon: Home, title: 'Programmes Immobiliers', description: 'Programmes résidentiels et mixtes à grande échelle' },
        { icon: TrendingUp, title: 'Redressement Commercial', description: 'Financement du développement et du redressement d\'entreprises' },
        { icon: MapPin, title: 'Développement International', description: 'Projets d\'infrastructure et construction à l\'international' },
        { icon: Home, title: 'Complexes d\'Appartements', description: 'Copropriétés résidentielles et condominiums' },
        { icon: TreePine, title: 'Mines et Agriculture', description: 'Exploitation minière, agriculture et agroindustrie internationales' },
        { icon: Leaf, title: 'Eau, Énergie et Vert', description: 'Projets durables et d\'énergie renouvelable' },
        { icon: TrendingUp, title: 'Croissance Entreprise', description: 'Financement pour croissance et expansion d\'entreprises' },
        { icon: Fuel, title: 'Pétrole', description: 'Projets d\'exploration et production pétrolière' },
        { icon: Plane, title: 'Aéroport', description: 'Financement de terminaux et infrastructure aéroportuaire' },
        { icon: Anchor, title: 'Marina', description: 'Développement de ports et installations maritimes' },
        { icon: ShoppingCart, title: 'Parc d\'Attractions', description: 'Parcs thématiques et complexes de loisirs' },
        { icon: ShoppingCart, title: 'Centre Commercial', description: 'Centres commerciaux régionaux et de proximité' },
        { icon: Briefcase, title: 'Rachat Financier', description: 'Financement de rachats d\'entreprises (LBO)' },
        { icon: Package, title: 'Jets Corporatifs', description: 'Financement d\'acquisition de jets privés et flotte aérienne' },
        { icon: Building2, title: 'Hôpital', description: 'Infrastructure médicale et complexes hospitaliers' },
      ]
    : [
        { icon: Hotel, title: 'Hotels and Resorts', description: 'Luxury hotel structures and tourism complexes' },
        { icon: Building2, title: 'Commercial Developments', description: 'Shopping centers and integrated commercial zones' },
        { icon: AlertCircle, title: 'Construction Projects', description: 'Financing of real estate projects under construction' },
        { icon: Zap, title: 'Energy Projects', description: 'Solar, wind, hydro-electric and natural gas projects' },
        { icon: Building2, title: 'Office Building Complexes', description: 'Class A and B office buildings' },
        { icon: DollarSign, title: 'Working Capital', description: 'Working capital requirements financing' },
        { icon: Home, title: 'Real Estate Based Programs', description: 'Large-scale residential and mixed-use programs' },
        { icon: TrendingUp, title: 'Commercial Turnaround and Development', description: 'Enterprise development and turnaround financing' },
        { icon: MapPin, title: 'International Development/Construction', description: 'International infrastructure and construction projects' },
        { icon: Home, title: 'Apartment Complexes and Condo Developments', description: 'Residential cooperatives and condominiums' },
        { icon: TreePine, title: 'International Mining and Agriculture', description: 'Mining operations, agriculture and agro-industry' },
        { icon: Leaf, title: 'Water, Energy, and Green-Related Projects', description: 'Sustainable and renewable energy initiatives' },
        { icon: TrendingUp, title: 'Business Growth and Expansion Projects', description: 'Enterprise growth and expansion financing' },
        { icon: Fuel, title: 'Oil', description: 'Oil exploration and production projects' },
        { icon: Plane, title: 'Airport', description: 'Airport terminal and aviation infrastructure financing' },
        { icon: Anchor, title: 'Marina', description: 'Port development and maritime facilities' },
        { icon: ShoppingCart, title: 'Amusement Park', description: 'Theme parks and leisure complexes' },
        { icon: ShoppingCart, title: 'Shopping Center', description: 'Regional and convenience shopping centers' },
        { icon: Briefcase, title: 'Leveraged Buy-Out', description: 'Leveraged buyout (LBO) financing' },
        { icon: Package, title: 'Corporate Jets', description: 'Private jet and aircraft fleet acquisition financing' },
        { icon: Building2, title: 'Hospital', description: 'Medical infrastructure and hospital complexes' },
      ];

  const eligibility = lang === 'fr'
    ? [
        { icon: Building2, label: 'Montant minimum', value: '€5M à €200M+' },
        { icon: DollarSign, label: 'Fonds propres requis', value: '5% à 10% du besoin total' },
        { icon: TrendingUp, label: 'Historique financier', value: 'Bilan et compte de résultat validés' },
        { icon: AlertCircle, label: 'Conformité KYC/AML', value: 'Vérification complète obligatoire' },
      ]
    : [
        { icon: Building2, label: 'Minimum amount', value: '€5M to €200M+' },
        { icon: DollarSign, label: 'Required equity', value: '5% to 10% of total need' },
        { icon: TrendingUp, label: 'Financial history', value: 'Audited balance sheet and P&L' },
        { icon: AlertCircle, label: 'KYC/AML compliance', value: 'Full verification required' },
      ];

  const process = lang === 'fr'
    ? [
        { number: '01', title: 'Soumission', description: 'Présentation du dossier avec documents justificatifs' },
        { number: '02', title: 'Évaluation', description: 'Analyse approfondie du projet et de la viabilité' },
        { number: '03', title: 'Sélection', description: 'Identification des sources de financement appropriées' },
        { number: '04', title: 'Structuration', description: 'Montage technique et documen taire' },
        { number: '05', title: 'Finalisation', description: 'Signature et décaissement sous 30j' },
      ]
    : [
        { number: '01', title: 'Submission', description: 'File presentation with supporting documentation' },
        { number: '02', title: 'Evaluation', description: 'In-depth analysis of project viability' },
        { number: '03', title: 'Selection', description: 'Identification of appropriate funding sources' },
        { number: '04', title: 'Structuring', description: 'Technical and documentary setup' },
        { number: '05', title: 'Finalization', description: 'Signature and disbursement within 30 days' },
      ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url('/assets/images/financial-hero-v2.png')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-navy/55" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark/90 via-navy/80 to-navy-light/85" aria-hidden="true" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gold blur-3xl" />
        </div>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-gold text-xs font-semibold tracking-widest uppercase">
              {lang === 'fr' ? 'Services' : 'Services'}
            </span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
            {lang === 'fr' ? (
              <>Programme Global de<br /><span className="text-gradient-gold">Financement</span></>
            ) : (
              <>Global<br /><span className="text-gradient-gold">Funding Program</span></>
            )}
          </h1>
          <p className="text-slate-300 text-lg lg:text-xl leading-relaxed max-w-3xl border-l-2 border-gold/40 pl-5">
            {lang === 'fr'
              ? "GL Capital Investment SA vous propose un accès diversifié à des sources de financement pour une large gamme d'actifs et de projets internationaux."
              : 'GL Capital Investment SA offers you diversified access to financing sources for a wide range of assets and international projects.'}
          </p>
        </div>
      </section>

      {/* Asset Classes Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Classe d\'Actifs' : 'Asset Classes'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? '20 Catégories de Financement' : '20 Financing Categories'}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr'
                ? 'Explorez les différentes classes d\'actifs couvertes par notre programme global de financement.'
                : 'Explore the different asset classes covered by our global funding program.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {assetClasses?.map((item, idx) => (
              <div
                key={`asset-${idx}`}
                className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={20} className="text-gold" />
                </div>
                <h3 className="font-display text-sm font-bold text-navy leading-snug">{item?.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Critères' : 'Criteria'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? "Critères d'Éligibilité" : 'Eligibility Criteria'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eligibility?.map((item) => (
              <div
                key={`elig-${item?.label}`}
                className="bg-slate-50 rounded-2xl p-7 border border-slate-100 flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={22} className="text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    {item?.label}
                  </p>
                  <p className="text-navy font-semibold text-base">{item?.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Processus' : 'Process'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? 'Notre Processus en 5 Étapes' : 'Our 5-Step Process'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {process?.map((step) => (
              <div key={`step-${step?.number}`} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mb-4 shadow-lg shadow-navy/20">
                  <span className="text-white font-display text-xl font-bold">{step?.number}</span>
                </div>
                <h3 className="font-display text-base font-bold text-navy mb-2">{step?.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-dark">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-6">
            {lang === 'fr' ? 'Commencer Votre Demande' : 'Start Your Application'}
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            {lang === 'fr'
              ? 'Soumettre votre dossier pour accéder à nos sources de financement globales.'
              : 'Submit your file to access our global funding sources.'}
          </p>
          <Link
            href="/client-dashboard"
            className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-8 py-3 rounded-xl hover:bg-gold/90 transition-colors duration-200"
          >
            {lang === 'fr' ? 'Accès Portail Client' : 'Access Client Portal'}
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
