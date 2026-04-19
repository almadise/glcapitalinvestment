'use client';
import React from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  ArrowRight,
  FileText,
  Search,
  Handshake,
  FileSignature,
  Banknote,
  Shield,
  Globe,
  Building2,
} from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { useLanguage } from '@/context/LanguageContext';

export default function FinancementProjetPage() {
  const { lang } = useLanguage();

  const eligibilityCriteria = lang === 'fr'
    ? [
        { icon: Banknote, label: 'Montant minimum', value: "200 millions d'euros ou USD" },
        { icon: Shield, label: 'Apport en fonds propres requis', value: '5 % à 10 % du besoin total (selon la nature du projet)' },
        { icon: Building2, label: 'Entités éligibles', value: 'Entreprises, gouvernements, organisations internationales, associations' },
        { icon: Globe, label: 'Garanties souveraines acceptées', value: "Obligations d'État, bons du Trésor, nantissement de ressources naturelles" },
      ]
    : [
        { icon: Banknote, label: 'Minimum amount', value: '€200 million or USD equivalent' },
        { icon: Shield, label: 'Required equity contribution', value: '5% to 10% of total need (depending on project nature)' },
        { icon: Building2, label: 'Eligible entities', value: 'Companies, governments, international organisations, associations' },
        { icon: Globe, label: 'Sovereign guarantees accepted', value: 'Government bonds, treasury bills, pledge of natural resources' },
      ];

  const steps = lang === 'fr'
    ? [
        { number: '01', icon: FileText, title: 'Soumission du dossier', description: "Lettre d'Intention (LOI) + documents de conformité" },
        { number: '02', icon: Search, title: 'Analyse de faisabilité', description: 'Examen par nos experts sous 48h à 10 jours ouvrés' },
        { number: '03', icon: Handshake, title: 'Mise en relation institutionnelle', description: 'Introduction formelle auprès des partenaires bancaires éligibles' },
        { number: '04', icon: FileSignature, title: 'Montage contractuel', description: 'Deed of Agreement (DOA), accord fiduciaire, apostille' },
        { number: '05', icon: Banknote, title: 'Décaissement', description: 'Virement des fonds sous 30 jours ouvrés après finalisation des accords' },
      ]
    : [
        { number: '01', icon: FileText, title: 'File submission', description: 'Letter of Intent (LOI) + compliance documents' },
        { number: '02', icon: Search, title: 'Feasibility analysis', description: 'Review by our experts within 48h to 10 business days' },
        { number: '03', icon: Handshake, title: 'Institutional introduction', description: 'Formal introduction to eligible banking partners' },
        { number: '04', icon: FileSignature, title: 'Contractual structuring', description: 'Deed of Agreement (DOA), fiduciary agreement, apostille' },
        { number: '05', icon: Banknote, title: 'Disbursement', description: 'Fund transfer within 30 business days after finalisation of agreements' },
      ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-navy-dark via-navy to-navy-light relative overflow-hidden">
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
              <>Financement de projets<br /><span className="text-gradient-gold">d'investissement</span></>
            ) : (
              <>Project Investment<br /><span className="text-gradient-gold">Financing</span></>
            )}
          </h1>
          <p className="text-slate-300 text-lg lg:text-xl leading-relaxed max-w-3xl border-l-2 border-gold/40 pl-5">
            {lang === 'fr' ? "GL Capital Investment SA mobilise son réseau d'institutions financières partenaires pour accompagner les porteurs de projets dans l'obtention de financements par dette adaptés à leurs besoins." :'GL Capital mobilises its network of partner financial institutions to support project holders in obtaining debt financing.'}
          </p>
        </div>
      </section>
      {/* Eligibility */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Conditions' : 'Conditions'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? "Critères d'éligibilité" : 'Eligibility Criteria'}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr' ?'Vérifiez que votre projet répond aux critères minimaux avant de soumettre votre dossier.' :'Verify that your project meets the minimum criteria before submitting your file.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eligibilityCriteria?.map((item) => (
              <div
                key={`eligibility-${item?.label}`}
                className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={22} className="text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    {item?.label}
                  </p>
                  <p className="text-navy font-semibold text-base leading-snug">{item?.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Process */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Méthodologie' : 'Methodology'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? (
                <>Notre processus en{' '}<span className="text-gradient-gold">5 étapes</span></>
              ) : (
                <>Our{' '}<span className="text-gradient-gold">5-step process</span></>
              )}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr' ?'Un cadre structuré et transparent pour accompagner chaque dossier de la soumission au décaissement.' :'A structured and transparent framework to guide each file from submission to disbursement.'}
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent z-0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
              {steps?.map((step, index) => (
                <div key={`step-${step?.number}`} className="flex flex-col items-center text-center group">
                  <div className="w-20 h-20 rounded-2xl bg-navy flex flex-col items-center justify-center mb-5 shadow-lg shadow-navy/20 group-hover:bg-gold transition-colors duration-300">
                    <span className="text-gold group-hover:text-navy text-xs font-bold tracking-widest transition-colors duration-300">
                      {lang === 'fr' ? 'ÉTAPE' : 'STEP'}
                    </span>
                    <span className="text-white group-hover:text-navy text-2xl font-display font-bold leading-none transition-colors duration-300">
                      {step?.number}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                    <step.icon size={18} className="text-gold" />
                  </div>
                  <h3 className="font-display text-base font-bold text-navy mb-2 leading-snug">
                    {step?.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step?.description}</p>
                  {index < steps?.length - 1 && (
                    <div className="hidden lg:flex absolute items-center justify-center" style={{ display: 'none' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Partner Network */}
      <section className="py-20 bg-gradient-to-br from-navy-dark to-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold blur-3xl" />
        </div>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-gold text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Partenaires' : 'Partners'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-6">
              {lang === 'fr' ? 'Notre réseau' : 'Our Network'}
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-start gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield size={18} className="text-gold" />
                </div>
                <p className="text-slate-300 text-base leading-relaxed">
                  {lang === 'fr'
                    ? <>GL Capital s'appuie sur un réseau de banques d'affaires, d'investisseurs institutionnels et d'opérateurs financiers spécialisés en <strong className="text-white">Europe</strong>, en <strong className="text-white">Afrique</strong> et en <strong className="text-white">Asie</strong>. Les identités de ces partenaires sont protégées par le secret bancaire et ne sont communiquées qu'aux porteurs de dossiers éligibles, dans le cadre strict de la procédure de conformité.</>
                    : <>GL Capital relies on a network of investment banks, institutional investors and specialised financial operators in <strong className="text-white">Europe</strong>, <strong className="text-white">Africa</strong> and <strong className="text-white">Asia</strong>. The identities of these partners are protected by banking secrecy and are only communicated to eligible file holders, within the strict framework of the compliance procedure.</>
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {(lang === 'fr' ? ['Europe', 'Afrique', 'Asie'] : ['Europe', 'Africa', 'Asia'])?.map((region) => (
                <div key={`region-${region}`} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
                  <CheckCircle size={14} className="text-gold" />
                  <span className="text-slate-300 text-sm font-medium">{region}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
            {lang === 'fr' ? 'Prêt à soumettre votre projet ?' : 'Ready to submit your project?'}
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto mb-10">
            {lang === 'fr' ? "Accédez à votre espace sécurisé pour déposer votre Lettre d'Intention et vos documents de conformité."
              : 'Access your secure space to submit your Letter of Intent and compliance documents.'}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold text-base px-8 py-4 rounded-xl hover:bg-gold-light active:scale-95 transition-all duration-200 shadow-lg shadow-gold/20"
          >
            {lang === 'fr' ? 'Soumettre mon dossier' : 'Submit my file'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
