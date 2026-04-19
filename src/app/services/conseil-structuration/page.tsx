'use client';
import React from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  ArrowRight,
  Search,
  FileText,
  ShieldCheck,
  Users,
  ClipboardList,
  Network,
} from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { useLanguage } from '@/context/LanguageContext';

export default function ConseilStructurationPage() {
  const { lang } = useLanguage();

  const prestations = lang === 'fr'
    ? [
        { icon: Search, code: 'AF', title: 'Analyse de faisabilité', description: "Évaluation de viabilité du projet, identification des instruments de financement adaptés, recommandation sur la structure de capital dette/fonds propres." },
        { icon: FileText, code: 'MD', title: 'Montage documentaire', description: "Préparation de la Lettre d'Intention (LOI), CIS/FIC, NCNDA, plan d'affaires et résumé exécutif. Constitution d'un dossier complet et conforme aux exigences institutionnelles." },
        { icon: ShieldCheck, code: 'KYC', title: 'Conformité KYC/AML', description: "Accompagnement dans la préparation du dossier de conformité selon les exigences des plateformes bancaires partenaires. Vérification d'identité et conformité anti-blanchiment." },
        { icon: Users, code: 'II', title: 'Introduction institutionnelle', description: "Mise en relation formelle avec banques d'affaires, family offices, investisseurs institutionnels et opérateurs agréés. Accès au réseau partenaire de GL Capital." },
        { icon: ClipboardList, code: 'SPF', title: 'Suivi post-financement', description: "Gestion des obligations contractuelles post-décaissement, conformité d'utilisation des fonds, interface avec les partenaires bancaires tout au long de la durée du financement." },
      ]
    : [
        { icon: Search, code: 'AF', title: 'Feasibility analysis', description: "Project viability assessment, identification of suitable financing instruments, recommendation on debt/equity capital structure." },
        { icon: FileText, code: 'MD', title: 'Document preparation', description: "Preparation of the Letter of Intent (LOI), CIS/FIC, NCNDA, business plan and executive summary. Assembly of a complete file compliant with institutional requirements." },
        { icon: ShieldCheck, code: 'KYC', title: 'KYC/AML compliance', description: "Support in preparing the compliance file according to the requirements of partner banking platforms. Identity verification and anti-money laundering compliance." },
        { icon: Users, code: 'II', title: 'Institutional introduction', description: "Formal introduction to investment banks, family offices, institutional investors and licensed operators. Access to GL Capital's partner network." },
        { icon: ClipboardList, code: 'SPF', title: 'Post-financing monitoring', description: "Management of post-disbursement contractual obligations, fund use compliance, interface with banking partners throughout the financing period." },
      ];

  const expertiseNetwork = lang === 'fr'
    ? ["Avocats d'affaires", 'Juristes en droit financier international', 'Comptables certifiés', 'Fiscalistes internationaux', 'Gérants de fortune']
    : ['Business lawyers', 'Financial law specialists', 'Certified accountants', 'Tax advisors', 'Wealth managers'];

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
            <span className="text-gold text-xs font-semibold tracking-widest uppercase">Services</span>
          </div>
          <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
            {lang === 'fr' ? (
              <>Conseil en structuration<br /><span className="text-gradient-gold">financière</span></>
            ) : (
              <>Financial Structuring<br /><span className="text-gradient-gold">Advisory</span></>
            )}
          </h1>
          <p className="text-slate-300 text-lg lg:text-xl leading-relaxed max-w-3xl border-l-2 border-gold/40 pl-5">
            {lang === 'fr'
              ? "GL Capital met à disposition un accompagnement expert dans la structuration des dossiers de financement, de la conception du montage jusqu'à la présentation aux institutions partenaires." :"GL Capital provides expert support in structuring financing files, from the design of the structure through to presentation to partner institutions."}
          </p>
        </div>
      </section>
      {/* Prestations Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Prestations' : 'Services'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? 'Nos prestations' : 'Our Services'}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr' ?'Un accompagnement structuré à chaque étape du processus de financement.' :'Structured support at every stage of the financing process.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prestations?.map((item) => (
              <div
                key={`prestation-${item?.code}`}
                className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                    <item.icon size={22} className="text-gold" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gold uppercase tracking-widest">{item?.code}</span>
                    <h3 className="font-display text-base font-bold text-navy leading-snug">{item?.title}</h3>
                  </div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{item?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Expert Network */}
      <section className="py-20 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-navy text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Réseau' : 'Network'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">
              {lang === 'fr' ? "Notre réseau d'experts" : 'Our Expert Network'}
            </h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              {lang === 'fr' ? "GL Capital s'appuie sur un réseau pluridisciplinaire de professionnels spécialisés en finance internationale." :'GL Capital relies on a multidisciplinary network of professionals specialised in international finance.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {expertiseNetwork?.map((expert) => (
              <div
                key={`expert-${expert}`}
                className="bg-slate-50 rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                  <Network size={22} className="text-gold" />
                </div>
                <p className="text-navy font-semibold text-base leading-snug">{expert}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Confidentiality Banner */}
      <section className="py-20 bg-gradient-to-br from-navy-dark to-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold blur-3xl" />
        </div>
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-gold text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Approche' : 'Approach'}
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-6">
              {lang === 'fr' ? 'Une approche intégrée' : 'An integrated approach'}
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-start gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <ShieldCheck size={18} className="text-gold" />
                </div>
                <p className="text-slate-300 text-base leading-relaxed">
                  {lang === 'fr'
                    ? <>GL Capital coordonne l'ensemble des intervenants — juridiques, financiers et bancaires — pour garantir la{' '}<strong className="text-white">cohérence et la solidité</strong> du dossier présenté aux institutions partenaires. Chaque structuration est adaptée au profil du porteur de projet et aux exigences spécifiques des financeurs ciblés.</>
                    : <>GL Capital coordinates all stakeholders — legal, financial and banking — to ensure the <strong className="text-white">coherence and solidity</strong> of the file presented to partner institutions. Each structuring is tailored to the project holder's profile and the specific requirements of the targeted financiers.</>
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {(lang === 'fr'
                ? ['Structuration sur mesure', 'Réseau pluridisciplinaire', 'Conformité internationale']
                : ['Tailored structuring', 'Multidisciplinary network', 'International compliance']
              )?.map((tag) => (
                <div key={`tag-${tag}`} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
                  <CheckCircle size={14} className="text-gold" />
                  <span className="text-slate-300 text-sm font-medium">{tag}</span>
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
            {lang === 'fr' ? 'Structurez votre dossier avec nos experts' : 'Structure your file with our experts'}
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto mb-10">
            {lang === 'fr'
              ? "Nos conseillers analysent votre projet et vous accompagnent dans la constitution d'un dossier bancable, prêt à être présenté aux institutions partenaires." :"Our advisors analyse your project and support you in building a bankable file, ready to be presented to partner institutions."}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold text-base px-8 py-4 rounded-xl hover:bg-gold-light active:scale-95 transition-all duration-200 shadow-lg shadow-gold/20"
          >
            {lang === 'fr' ? 'Prendre contact' : 'Get in touch'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
