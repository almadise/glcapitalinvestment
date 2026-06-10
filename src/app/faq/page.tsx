'use client';
import React, { useState } from 'react';
import PublicNavbar from '../home-page/components/PublicNavbar';
import PublicFooter from '../home-page/components/PublicFooter';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: {
      fr: 'Quels documents sont requis pour soumettre un dossier ?',
      en: 'What documents are required to submit a file?',
    },
    a: {
      fr: `Pour soumettre un dossier de financement, GL Capital requiert généralement les documents suivants :\n\n• Lettre d'intention (LOI) ou Mandat signé\n• Business plan ou mémorandum d'information du projet\n• États financiers des 3 dernières années (si entité existante)\n• Justificatifs d'identité des bénéficiaires effectifs (KYC)\n• Preuve de propriété ou de droits sur le projet\n• Tout document technique ou permis pertinent selon la nature du projet\n\nLa liste exacte peut varier selon le type de financement sollicité (SBLC/BG, financement de projet, conseil en structuration). Notre équipe vous communiquera une liste personnalisée après examen préliminaire de votre dossier.`,
      en: `To submit a financing file, GL Capital generally requires the following documents:\n\n• Letter of Intent (LOI) or signed Mandate\n• Business plan or project information memorandum\n• Financial statements for the last 3 years (if existing entity)\n• Identity documents for beneficial owners (KYC)\n• Proof of ownership or rights over the project\n• Any relevant technical documents or permits depending on the nature of the project\n\nThe exact list may vary depending on the type of financing sought (SBLC/BG, project financing, structuring advisory). Our team will provide a personalized list after a preliminary review of your file.`,
    },
  },
  {
    q: { fr: 'Quels sont les délais de traitement ?', en: 'What are the processing delays?' },
    a: {
      fr: `Les délais de traitement varient selon la complexité du dossier et la complétude des documents fournis :\n\n• Examen préliminaire de recevabilité : 48 à 72 heures ouvrées\n• Analyse approfondie et due diligence : 5 à 15 jours ouvrés\n• Structuration et présentation aux partenaires : 10 à 30 jours ouvrés\n• Réponse de principe des institutions partenaires : variable selon l'institution\n\nCes délais sont indicatifs. Un dossier incomplet ou nécessitant des clarifications supplémentaires peut allonger les délais. GL Capital s'engage à vous tenir informé de l'avancement à chaque étape du processus.`,
      en: `Processing times vary depending on the complexity of the file and the completeness of the documents provided:\n\n• Preliminary eligibility review: 48 to 72 business hours\n• In-depth analysis and due diligence: 5 to 15 business days\n• Structuring and presentation to partners: 10 to 30 business days\n• Principle response from partner institutions: varies by institution\n\nThese timelines are indicative. An incomplete file or one requiring additional clarifications may extend the processing time. GL Capital commits to keeping you informed of progress at each stage of the process.`,
    },
  },
  {
    q: {
      fr: 'Comment la confidentialité est-elle protégée ?',
      en: 'How is confidentiality protected?',
    },
    a: {
      fr: `La confidentialité est au cœur de notre engagement institutionnel. GL Capital met en œuvre plusieurs niveaux de protection :\n\n• Signature systématique d'un accord de non-divulgation (NCNDA/NDA) avant tout échange de documents sensibles\n• Accès aux dossiers strictement limité aux analystes et responsables de conformité habilités\n• Transmission des documents via des canaux sécurisés et chiffrés (SSL/TLS)\n• Politique de conservation des données conforme au RGPD\n• Aucune divulgation à des tiers sans consentement écrit préalable du client\n• Destruction sécurisée des documents en cas de non-aboutissement du dossier, sur demande\n\nNous opérons dans le strict respect du cadre réglementaire européen en matière de protection des données personnelles.`,
      en: `Confidentiality is at the heart of our institutional commitment. GL Capital implements several levels of protection:\n\n• Systematic signing of a non-disclosure agreement (NCNDA/NDA) before any exchange of sensitive documents\n• Access to files strictly limited to authorized analysts and compliance officers\n• Document transmission via secure, encrypted channels (SSL/TLS)\n• Data retention policy compliant with GDPR\n• No disclosure to third parties without prior written consent from the client\n• Secure destruction of documents in case of unsuccessful file, upon request\n\nWe operate in strict compliance with the European regulatory framework for personal data protection.`,
    },
  },
  {
    q: {
      fr: "Quelles sont les raisons de rejet d'un dossier ?",
      en: 'What are the reasons for rejection?',
    },
    a: {
      fr: `Un dossier peut être refusé ou retourné pour les raisons suivantes :\n\n• Documentation incomplète ou non conforme aux exigences KYC/AML\n• Projet ne répondant pas aux critères minimaux de bancabilité\n• Secteur d'activité exclu (activités illicites, secteurs sous embargo, etc.)\n• Juridiction non acceptée ou présentant un risque réglementaire élevé\n• Incohérences dans les informations financières ou les projections\n• Bénéficiaires effectifs non identifiables ou présentant des signaux d'alerte\n• Montant de financement hors des fourchettes opérationnelles de GL Capital\n• Absence de garanties ou de collatéral suffisant\n\nEn cas de rejet, GL Capital s'engage à communiquer les motifs principaux afin de permettre, le cas échéant, une reformulation du dossier.`,
      en: `A file may be refused or returned for the following reasons:\n\n• Incomplete documentation or non-compliance with KYC/AML requirements\n• Project not meeting minimum bankability criteria\n• Excluded business sector (illicit activities, embargoed sectors, etc.)\n• Unaccepted jurisdiction or presenting high regulatory risk\n• Inconsistencies in financial information or projections\n• Unidentifiable beneficial owners or presenting red flags\n• Financing amount outside GL Capital's operational ranges\n• Insufficient guarantees or collateral\n\nIn case of rejection, GL Capital commits to communicating the main reasons to allow, where applicable, a reformulation of the file.`,
    },
  },
  {
    q: { fr: 'Quelles juridictions sont acceptées ?', en: 'Which jurisdictions are accepted?' },
    a: {
      fr: `GL Capital opère principalement avec des dossiers provenant des juridictions suivantes :\n\n• Union Européenne (tous États membres)\n• Royaume-Uni, Suisse, Norvège\n• Amérique du Nord (États-Unis, Canada)\n• Afrique francophone et anglophone (selon évaluation au cas par cas)\n• Moyen-Orient (EAU, Qatar, Arabie Saoudite - sous conditions)\n• Asie du Sud-Est (selon évaluation)\n\nSont généralement exclus : les pays sous sanctions internationales (OFAC, UE, ONU), les juridictions figurant sur les listes noires ou grises du GAFI, ainsi que les territoires présentant un risque de blanchiment ou de financement du terrorisme élevé.\n\nChaque dossier fait l'objet d'une évaluation individuelle du risque juridictionnel. Contactez-nous pour vérifier l'éligibilité de votre pays.`,
      en: `GL Capital primarily operates with files from the following jurisdictions:\n\n• European Union (all member states)\n• United Kingdom, Switzerland, Norway\n• North America (United States, Canada)\n• French and English-speaking Africa (on a case-by-case basis)\n• Middle East (UAE, Qatar, Saudi Arabia - subject to conditions)\n• Southeast Asia (subject to evaluation)\n\nGenerally excluded are: countries under international sanctions (OFAC, EU, UN), jurisdictions on FATF blacklists or grey lists, and territories presenting high money laundering or terrorist financing risk.\n\nEach file is subject to an individual jurisdictional risk assessment. Contact us to verify your country's eligibility.`,
    },
  },
  {
    q: {
      fr: 'GL Capital exécute-t-il des transactions financières ?',
      en: 'Does GL Capital execute financial transactions?',
    },
    a: {
      fr: `Non. GL Capital Investment SA n'est pas une banque, un gestionnaire de fonds, ni un établissement de crédit. GL Capital n'exécute aucune transaction financière directe.\n\nNotre rôle est exclusivement celui d'un intermédiaire institutionnel spécialisé dans :\n\n• La structuration et la présentation de dossiers de financement\n• La mise en relation avec des institutions financières partenaires agréées\n• Le conseil en documentation et en conformité réglementaire\n• L'accompagnement dans les processus de due diligence\n\nToutes les transactions financières sont réalisées directement entre le client et les institutions financières partenaires (banques, fonds, établissements de crédit). GL Capital n'intervient jamais dans le flux des fonds et ne détient aucun actif client.\n\nGL Capital opère dans le strict respect des réglementations en vigueur et ne propose aucun service soumis à agrément bancaire ou financier.`,
      en: `No. GL Capital Investment SA is not a bank, fund manager, or credit institution. GL Capital does not execute any direct financial transactions.\n\nOur role is exclusively that of an institutional intermediary specializing in:\n\n• Structuring and presenting financing files\n• Connecting clients with licensed partner financial institutions\n• Advisory on documentation and regulatory compliance\n• Support in due diligence processes\n\nAll financial transactions are carried out directly between the client and the partner financial institutions (banks, funds, credit institutions). GL Capital never intervenes in the flow of funds and holds no client assets.\n\nGL Capital operates in strict compliance with applicable regulations and does not offer any service subject to banking or financial licensing.`,
    },
  },
  {
    q: {
      fr: 'Publiez-vous des programmes Small Cap en continu ?',
      en: 'Do you publish Small Cap programs continuously?',
    },
    a: {
      fr: `Non. Les opportunités Small Cap sont périodiques, non permanentes, et peuvent se fermer sans préavis.\n\nGL Capital ne publie pas ces fenêtres comme un catalogue public. Chaque demande est traitée au cas par cas, après pré-qualification.\n\nPré-qualification minimale :\n\n• CIS signé\n• Preuve de fonds récente et vérifiable\n• Résumé exécutif du projet ou objectif d'investissement\n\nAucune disponibilité continue ni rendement n'est garanti. Le traitement dépend de la conformité, de l'éligibilité et des conditions de plateforme au moment de la soumission.`,
      en: `No. Small Cap opportunities are periodic, not permanent, and may close without prior notice.\n\nGL Capital does not publish these windows as a public catalog. Each request is handled case by case, after pre-qualification.\n\nMinimum pre-qualification:\n\n• Signed CIS\n• Recent and verifiable proof of funds\n• Executive summary of the project or investment objective\n\nNo continuous availability or return is guaranteed. Processing depends on compliance, eligibility, and platform conditions at submission time.`,
    },
  },
  {
    q: {
      fr: 'Quelle différence entre financement de projet et prêt commercial ?',
      en: 'What is the difference between project finance and commercial loan?',
    },
    a: {
      fr: `Ce sont deux parcours distincts :\n\n• Financement de projet (page Financement de projet) : structuration en euros, 2 M€ à 4 Md€, taux indicatif 4 %, mise en relation institutionnelle.\n• Prêt commercial (page Prêts) : programme en USD, 5 à 5,5 Md USD, taux indicatif 3 %, résumé exécutif obligatoire, caution d'assurance, prêteurs USA, Vietnam et Dubaï.\n\nGL Capital prépare le dossier dans les deux cas ; le décaissement relève du prêteur ou de l'institution retenue.`,
      en: `These are two separate tracks:\n\n• Project finance (Project Finance page): euro structuring, EUR 2M to EUR 4B, indicative 4% rate, institutional introduction.\n• Commercial loan (Loans page): USD programme, USD 5M to 5.5B, indicative 3% rate, mandatory executive summary, insurance surety bond, US, Vietnam, and Dubai lenders.\n\nGL Capital prepares the file in both cases; disbursement is carried out by the selected lender or institution.`,
    },
  },
  {
    q: {
      fr: 'Les fonds restent ils sur mon compte en placement privé ?',
      en: 'Do my funds stay in my account for private placement?',
    },
    a: {
      fr: `Pour les programmes cash en mise en attente administrative ou en blocage/réserve (MT-799), les fonds restent sur le compte du client et sous son contrôle pendant la durée prévue au contrat.\n\nLes schémas MT-760, MT-542 et Euroclear concernent des instruments (SBLC, BG, MTN, CD) selon des modalités contractuelles spécifiques. Le détail figure sur la page Placement privé.`,
      en: `For cash programmes under administrative hold or block/reserve (MT-799), funds remain in the client's account and under the client's control for the period set out in the agreement.\n\nMT-760, MT-542, and Euroclear structures involve instruments (SBLC, BG, MTN, CD) under specific contractual terms. Details are on the Private Placement page.`,
    },
  },
  {
    q: {
      fr: 'Acceptez vous les instruments loués (leased) ?',
      en: 'Do you accept leased instruments?',
    },
    a: {
      fr: `Non. Les instruments loués ne sont pas acceptés pour les programmes de placement privé, quelle que soit la structure envisagée.\n\nSeuls les instruments intégralement adossés à du cash réel sont recevables. Les instruments adossés à des minerais ou à d'autres instruments financiers sont également exclus.`,
      en: `No. Leased instruments are not accepted for private placement programmes, regardless of the structure considered.\n\nOnly instruments fully backed by real cash are eligible. Instruments backed by minerals or other financial instruments are also excluded.`,
    },
  },
  {
    q: {
      fr: 'Quelle assurance est requise pour un prêt ?',
      en: 'What insurance is required for a loan?',
    },
    a: {
      fr: `Tout prêt retenu exige une caution d'assurance (surety bond) après approbation et avant décaissement. L'emprunteur la souscrit via son agent ou courtier d'assurance.\n\nMontants indicatifs selon le prêteur : environ 1 % + 250 000 USD (Vietnam), 3 % (États-Unis), 3 à 5 % (Dubaï). Une preuve de fonds pour régler cette caution fait partie des 12 pièces du dossier.\n\nVoir la page Prêts pour la procédure complète.`,
      en: `Any approved loan requires an insurance surety bond after approval and before disbursement. The borrower arranges it through their insurance agent or broker.\n\nIndicative amounts by lender: approximately 1% + USD 250,000 (Vietnam), 3% (United States), 3% to 5% (Dubai). Proof of funds to pay for this bond is part of the 12 item file checklist.\n\nSee the Loans page for the full procedure.`,
    },
  },
  {
    q: {
      fr: 'Pourquoi un résumé exécutif avant toute discussion de taux ?',
      en: 'Why an executive summary before any rate discussion?',
    },
    a: {
      fr: `Les taux, durées et conditions d'un prêt commercial dépendent de l'objectif du client, du collatéral et du prêteur retenu. Sans résumé exécutif complet, aucun chiffre ne peut être discuté de façon sérieuse.\n\nLe résumé doit préciser le projet, la répartition envisagée des fonds et le calendrier visé. Il fait partie des documents à transmettre en un seul courriel avec les 11 autres pièces listées sur la page Prêts.`,
      en: `Commercial loan rates, tenors, and conditions depend on the client's objective, collateral, and selected lender. Without a complete executive summary, no figures can be seriously discussed.\n\nThe summary must set out the project, intended fund allocation, and target timeline. It is one of the documents to send in a single email with the 11 other items listed on the Loans page.`,
    },
  },
  {
    q: {
      fr: 'Quelle différence entre MT-760 et MT-542 ?',
      en: 'What is the difference between MT-760 and MT-542?',
    },
    a: {
      fr: `Les deux messages SWIFT servent à structurer un programme PPP d'un an, avec affectation temporaire de la plateforme comme bénéficiaire, sous réserve de conformité :\n\n• MT-760 (à partir de 150 M USD) : SBLC, garanties bancaires, MTN.\n• MT-542 (à partir de 150 M USD) : certificats de dépôt et MTN.\n\nLes montants, cycles et conditions exacts sont définis dans l'accord de programme. Aucun rendement n'est garanti à l'avance. Voir la page Placement privé.`,
      en: `Both SWIFT messages structure a one year PPP programme, with temporary assignment of the platform as beneficiary, subject to compliance:\n\n• MT-760 (from USD 150M): SBLC, bank guarantees, MTN.\n• MT-542 (from USD 150M): certificates of deposit and MTN.\n\nExact amounts, cycles, and conditions are defined in the programme agreement. No return is guaranteed in advance. See the Private Placement page.`,
    },
  },
];

function AccordionItem({
  faq,
  index,
  lang,
}: {
  faq: (typeof faqs)[0];
  index: number;
  lang: 'fr' | 'en';
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-200 ${open ? 'shadow-md' : 'shadow-sm'}`}
      style={{ border: '1px solid #D8E0EC' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 px-6 py-5 text-left transition-colors duration-150"
        style={{ background: '#FFFFFF' }}
        aria-expanded={open}
      >
        <span
          className="flex-shrink-0 w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center mt-0.5"
          style={{ background: '#F5EDD0', color: '#B8912A' }}
        >
          {index + 1}
        </span>
        <span
          className="flex-1 font-semibold text-sm leading-snug pr-2"
          style={{ color: '#1E2D4A' }}
        >
          {faq.q[lang]}
        </span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 mt-0.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ color: open ? '#B8912A' : '#4A5C7A' }}
        />
      </button>
      {open && (
        <div
          className="px-6 pb-6 pt-1"
          style={{ background: '#FFFFFF', borderTop: '1px solid #D8E0EC' }}
        >
          <div className="ml-11">
            {faq.a[lang].split('\n').map((line, i) => (
              <p
                key={i}
                className={`text-sm leading-relaxed ${line.startsWith('•') ? 'ml-2' : ''} ${i > 0 && line === '' ? 'mt-2' : ''}`}
                style={{ color: '#4A5C7A' }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { lang } = useLanguage();

  const t = {
    badge: { fr: 'Questions fréquentes', en: 'Frequently Asked Questions' },
    title: { fr: 'FAQ - GL Capital', en: 'FAQ - GL Capital' },
    subtitle: {
      fr: 'Retrouvez les réponses aux questions les plus fréquemment posées sur nos services, nos processus et nos exigences.',
      en: 'Find answers to the most frequently asked questions about our services, processes, and requirements.',
    },
    updated: { fr: 'Dernière mise à jour : juin 2026', en: 'Last updated: June 2026' },
    contactTitle: { fr: "Vous avez d'autres questions ?", en: 'Do you have other questions?' },
    contactText: {
      fr: 'Notre équipe est disponible pour répondre à toute question spécifique concernant votre dossier ou nos services.',
      en: 'Our team is available to answer any specific questions about your file or our services.',
    },
    contactBtn: { fr: 'Nous contacter', en: 'Contact us' },
  };

  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen pt-20" style={{ background: '#F7F8FA' }}>
        {/* Hero */}
        <section className="py-16 px-6" style={{ background: '#1E2D4A' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(184,145,42,0.2)' }}
              >
                <HelpCircle size={20} style={{ color: '#B8912A' }} />
              </div>
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: '#B8912A' }}
              >
                {t.badge[lang]}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4 leading-tight text-white">
              {t.title[lang]}
            </h1>
            <p
              className="text-base leading-relaxed max-w-2xl"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {t.subtitle[lang]}
            </p>
            <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t.updated[lang]}
            </p>
          </div>
        </section>

        {/* Accordion */}
        <section className="max-w-3xl mx-auto px-6 py-12 space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} faq={faq} index={i} lang={lang} />
          ))}
        </section>

        {/* Contact CTA */}
        <section className="max-w-3xl mx-auto px-6 pb-16">
          <div className="rounded-2xl p-8 text-white text-center" style={{ background: '#1E2D4A' }}>
            <h2 className="font-display text-xl font-bold mb-3">{t.contactTitle[lang]}</h2>
            <p
              className="text-sm leading-relaxed mb-6 max-w-md mx-auto"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {t.contactText[lang]}
            </p>
            <a
              href="/contact"
              className="inline-block text-sm font-bold px-6 py-3 rounded-xl transition-colors duration-150"
              style={{ background: '#B8912A', color: '#FFFFFF' }}
            >
              {t.contactBtn[lang]}
            </a>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
