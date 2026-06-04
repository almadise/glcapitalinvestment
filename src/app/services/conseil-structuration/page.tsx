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
  type LucideIcon,
} from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { ServiceHero } from '@/components/services/ServiceDetailSections';
import { useLanguage } from '@/context/LanguageContext';

function ConseilSection({
  badge,
  title,
  description,
  children,
}: {
  badge: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-4 py-1.5 mb-5">
            <span className="text-navy text-xs font-semibold tracking-widest uppercase">{badge}</span>
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-navy mb-4">{title}</h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto">{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function ExpertStyleCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-start gap-5">
      <div className="w-12 h-12 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
        <Icon size={22} className="text-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-navy font-semibold text-base leading-snug">{title}</p>
        {description && (
          <p className="text-slate-500 text-sm leading-relaxed mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function ConseilStructurationPage() {
  const { lang } = useLanguage();

  const prestations = lang === 'fr'
    ? [
        { icon: Search, title: 'Analyse de faisabilité', description: "Évaluation de viabilité du projet, identification des instruments de financement adaptés, recommandation sur la structure de capital dette/fonds propres." },
        { icon: FileText, title: 'Montage documentaire', description: "Préparation de la Lettre d'Intention (LOI), CIS/FIC, NCNDA, plan d'affaires et résumé exécutif. Constitution d'un dossier complet et conforme aux exigences institutionnelles." },
        { icon: ShieldCheck, title: 'Conformité KYC/AML', description: "Accompagnement dans la préparation du dossier de conformité selon les exigences des plateformes bancaires partenaires. Vérification d'identité et conformité anti-blanchiment." },
        { icon: Users, title: 'Introduction institutionnelle', description: "Mise en relation formelle avec banques d'affaires, family offices, investisseurs institutionnels et opérateurs agréés. Accès au réseau partenaire de GL Capital." },
        { icon: ClipboardList, title: 'Suivi post-financement', description: "Gestion des obligations contractuelles post-décaissement, conformité d'utilisation des fonds, interface avec les partenaires bancaires tout au long de la durée du financement." },
      ]
    : [
        { icon: Search, title: 'Feasibility analysis', description: 'Project viability assessment, identification of suitable financing instruments, recommendation on debt/equity capital structure.' },
        { icon: FileText, title: 'Document preparation', description: 'Preparation of the Letter of Intent (LOI), CIS/FIC, NCNDA, business plan and executive summary. Assembly of a complete file compliant with institutional requirements.' },
        { icon: ShieldCheck, title: 'KYC/AML compliance', description: 'Support in preparing the compliance file according to the requirements of partner banking platforms. Identity verification and anti-money laundering compliance.' },
        { icon: Users, title: 'Institutional introduction', description: "Formal introduction to investment banks, family offices, institutional investors and licensed operators. Access to GL Capital's partner network." },
        { icon: ClipboardList, title: 'Post-financing monitoring', description: 'Management of post-disbursement contractual obligations, fund use compliance, interface with banking partners throughout the financing period.' },
      ];

  const expertiseNetwork = lang === 'fr'
    ? ["Avocats d'affaires", 'Juristes en droit financier international', 'Comptables certifiés', 'Fiscalistes internationaux', 'Gérants de fortune']
    : ['Business lawyers', 'Financial law specialists', 'Certified accountants', 'Tax advisors', 'Wealth managers'];

  const approachTags = lang === 'fr'
    ? ['Structuration sur mesure', 'Réseau pluridisciplinaire', 'Conformité internationale']
    : ['Tailored structuring', 'Multidisciplinary network', 'International compliance'];

  const approachTitle = lang === 'fr' ? 'Coordination des intervenants' : 'Stakeholder coordination';
  const approachText =
    lang === 'fr'
      ? "GL Capital coordonne l'ensemble des intervenants juridiques, financiers et bancaires pour garantir la cohérence et la solidité du dossier présenté aux institutions partenaires. Chaque structuration est adaptée au profil du porteur de projet et aux exigences des financeurs ciblés."
      : "GL Capital coordinates all legal, financial, and banking stakeholders to ensure the coherence and solidity of the file presented to partner institutions. Each structuring is tailored to the project holder's profile and the targeted financiers' requirements.";

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <ServiceHero
        titleLines={{
          fr: 'Conseil en structuration',
          en: 'Financial Structuring',
        }}
        titleAccent={{
          fr: 'financière',
          en: 'Advisory',
        }}
        subtitle={{
          fr: "GL Capital met à disposition un accompagnement expert dans la structuration des dossiers de financement, de la conception du montage jusqu'à la présentation aux institutions partenaires.",
          en: 'GL Capital provides expert support in structuring financing files, from the design of the structure through to presentation to partner institutions.',
        }}
        backgroundImage="/assets/images/services-hero-bg.png"
      />

      <ConseilSection
        badge={lang === 'fr' ? 'Prestations' : 'Services'}
        title={lang === 'fr' ? 'Nos prestations' : 'Our Services'}
        description={
          lang === 'fr'
            ? 'Un accompagnement structuré à chaque étape du processus de financement.'
            : 'Structured support at every stage of the financing process.'
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prestations.map((item) => (
            <ExpertStyleCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </ConseilSection>

      <ConseilSection
        badge={lang === 'fr' ? 'Réseau' : 'Network'}
        title={lang === 'fr' ? "Notre réseau d'experts" : 'Our Expert Network'}
        description={
          lang === 'fr'
            ? "GL Capital s'appuie sur un réseau pluridisciplinaire de professionnels spécialisés en finance internationale."
            : 'GL Capital relies on a multidisciplinary network of professionals specialised in international finance.'
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {expertiseNetwork.map((expert) => (
            <ExpertStyleCard key={expert} icon={Network} title={expert} />
          ))}
        </div>
      </ConseilSection>

      <ConseilSection
        badge={lang === 'fr' ? 'Approche' : 'Approach'}
        title={lang === 'fr' ? 'Une approche intégrée' : 'An integrated approach'}
        description={
          lang === 'fr'
            ? 'Coordination des intervenants pour un dossier cohérent et conforme aux attentes institutionnelles.'
            : 'Coordinated stakeholders for a coherent file aligned with institutional expectations.'
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <ExpertStyleCard icon={ShieldCheck} title={approachTitle} description={approachText} />
          </div>
          {approachTags.map((tag) => (
            <ExpertStyleCard key={tag} icon={CheckCircle} title={tag} />
          ))}
        </div>
      </ConseilSection>

      <ConseilSection
        badge={lang === 'fr' ? 'Contact' : 'Contact'}
        title={lang === 'fr' ? 'Structurez votre dossier avec nos experts' : 'Structure your file with our experts'}
        description={
          lang === 'fr'
            ? "Nos conseillers analysent votre projet et vous accompagnent dans la constitution d'un dossier bancable, prêt à être présenté aux institutions partenaires."
            : 'Our advisors analyse your project and support you in building a bankable file, ready to be presented to partner institutions.'
        }
      >
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-50 rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold text-base px-8 py-4 rounded-xl hover:bg-gold-light active:scale-95 transition-all duration-200 shadow-lg shadow-gold/20"
            >
              {lang === 'fr' ? 'Prendre contact' : 'Get in touch'}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </ConseilSection>

      <PublicFooter />
    </div>
  );
}
