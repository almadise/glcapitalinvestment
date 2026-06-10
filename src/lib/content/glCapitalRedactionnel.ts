/**
 * Contenu issu du document rédactionnel GL Capital (29 mai 2026).
 * Textes humanisés : ton professionnel, sans tirets cadratins ni formulations type chatbot.
 */

export type Bilingual = { fr: string; en: string };

export type ContentSection = {
  id: string;
  title: Bilingual;
  paragraphs?: Bilingual[];
  bullets?: Bilingual[];
  note?: Bilingual;
};

export const contactProjectTypes = {
  fr: [
    'Financement de projet',
    'Instruments bancaires',
    'Prêts',
    'Programmes de placement privé',
    'Conseil en transactions crypto-actifs',
    'Autre',
  ],
  en: [
    'Project Finance',
    'Bank Instruments',
    'Loans',
    'Private Placement Programs',
    'Cryptocurrency Transaction Advisory',
    'Other',
  ],
};

export type ContactProjectTypeHint = {
  message: Bilingual;
  href: string;
  linkLabel: Bilingual;
};

export const contactProjectTypeHints: Record<string, ContactProjectTypeHint> = {
  'Financement de projet': {
    message: {
      fr: 'Programme structuration en euros (2 M€ à 4 Md€). Préparez une LOI et un résumé exécutif.',
      en: 'Euro structuring programme (EUR 2M to EUR 4B). Prepare an LOI and executive summary.',
    },
    href: '/services/financement-projet',
    linkLabel: { fr: 'Financement de projet', en: 'Project Finance' },
  },
  'Project Finance': {
    message: {
      fr: 'Programme structuration en euros (2 M€ à 4 Md€). Préparez une LOI et un résumé exécutif.',
      en: 'Euro structuring programme (EUR 2M to EUR 4B). Prepare an LOI and executive summary.',
    },
    href: '/services/financement-projet',
    linkLabel: { fr: 'Financement de projet', en: 'Project Finance' },
  },
  'Instruments bancaires': {
    message: {
      fr: 'SBLC, BG, MT-760 et MT-799 : précisez l\'instrument visé et le montant dans votre message.',
      en: 'SBLC, BG, MT-760, and MT-799: state the instrument and amount in your message.',
    },
    href: '/services/instruments-bancaires',
    linkLabel: { fr: 'Instruments bancaires', en: 'Banking Instruments' },
  },
  'Bank Instruments': {
    message: {
      fr: 'SBLC, BG, MT-760 et MT-799 : précisez l\'instrument visé et le montant dans votre message.',
      en: 'SBLC, BG, MT-760, and MT-799: state the instrument and amount in your message.',
    },
    href: '/services/instruments-bancaires',
    linkLabel: { fr: 'Instruments bancaires', en: 'Banking Instruments' },
  },
  Prêts: {
    message: {
      fr: 'Prêt commercial USD : résumé exécutif obligatoire avant toute discussion de taux. Consultez la liste des 12 pièces sur la page Prêts.',
      en: 'USD commercial loan: executive summary required before any rate discussion. See the 12 item checklist on the Loans page.',
    },
    href: '/services/prets',
    linkLabel: { fr: 'Prêts', en: 'Loans' },
  },
  Loans: {
    message: {
      fr: 'Prêt commercial USD : résumé exécutif obligatoire avant toute discussion de taux. Consultez la liste des 12 pièces sur la page Prêts.',
      en: 'USD commercial loan: executive summary required before any rate discussion. See the 12 item checklist on the Loans page.',
    },
    href: '/services/prets',
    linkLabel: { fr: 'Prêts', en: 'Loans' },
  },
  'Programmes de placement privé': {
    message: {
      fr: 'PPP : Small Cap à partir de 100 K USD/EUR ; Large Cap (cash) 100 M à 5 Md ; instruments 125 M à 5 Md. Fonds libres, CIS et preuve de fonds requis.',
      en: 'PPP: Small Cap from USD/EUR 100K; Large Cap (cash) USD/EUR 100M to 5B; instruments USD/EUR 125M to 5B. Unrestricted funds, CIS and proof of funds required.',
    },
    href: '/services/placement-prive',
    linkLabel: { fr: 'Placement privé', en: 'Private Placement' },
  },
  'Private Placement Programs': {
    message: {
      fr: 'PPP : Small Cap à partir de 100 K USD/EUR ; Large Cap (cash) 100 M à 5 Md ; instruments 125 M à 5 Md. Fonds libres, CIS et preuve de fonds requis.',
      en: 'PPP: Small Cap from USD/EUR 100K; Large Cap (cash) USD/EUR 100M to 5B; instruments USD/EUR 125M to 5B. Unrestricted funds, CIS and proof of funds required.',
    },
    href: '/services/placement-prive',
    linkLabel: { fr: 'Placement privé', en: 'Private Placement' },
  },
};

export const projectFinanceContent = {
  heroSubtitle: {
    fr: "Structuration de dossiers de financement de projet et mise en relation avec des institutions en Europe, aux États-Unis, aux Émirats et au Vietnam. GL Capital prépare le dossier ; le décaissement relève du partenaire retenu.",
    en: 'Project finance dossier structuring and introduction to institutions in Europe, the United States, the UAE, and Vietnam. GL Capital prepares the file; disbursement is carried out by the selected partner.',
  },
  sections: [
    {
      id: 'scope',
      title: { fr: 'Périmètre de cette page', en: 'What this page covers' },
      paragraphs: [
        {
          fr: "Vous êtes ici sur le volet financement de projet : analyse d'éligibilité, montage documentaire et présentation auprès d'institutions financières. Nous ne décaissons pas nous mêmes les fonds et ne détenons pas de licence bancaire.",
          en: 'This page covers the project finance track: eligibility review, document preparation, and presentation to financial institutions. We do not disburse funds ourselves and do not hold a banking licence.',
        },
        {
          fr: "Le programme décrit ici concerne surtout des montants en euros (2 M€ à 4 Md€, taux indicatif 4 %). Pour un prêt commercial en dollars (5 à 5,5 Md USD, taux indicatif 3 %, caution d'assurance, procédure pas à pas), consultez la page Prêts.",
          en: 'The programme described here mainly covers euro amounts (EUR 2M to EUR 4B, indicative rate 4%). For a commercial loan in US dollars (USD 5M to 5.5B, indicative rate 3%, insurance surety bond, step by step procedure), see the Loans page.',
        },
        {
          fr: "Pour les programmes de placement privé (PPP : Small Cap à partir de 100 K, Large Cap cash 100 M à 5 Md, instruments 125 M à 5 Md USD/EUR), la page Placement privé détaille les schémas cash hold, MT-799, MT-760 et Euroclear.",
          en: 'For private placement programs (PPP: Small Cap from 100K, Large Cap cash USD/EUR 100M to 5B, instruments USD/EUR 125M to 5B), the Private Placement page sets out cash hold, MT-799, MT-760, and Euroclear structures.',
        },
      ],
      note: {
        fr: "Les fourchettes en euros et en dollars renvoient à des programmes distincts. Tous les chiffres sont indicatifs et confirmés par le prêteur ou la plateforme après examen du dossier.",
        en: 'Euro and US dollar ranges refer to separate programmes. All figures are indicative and confirmed by the lender or platform after file review.',
      },
    },
    {
      id: 'programme',
      title: {
        fr: 'Programme de financement mondial',
        en: 'Global Funding Programme',
      },
      paragraphs: [
        {
          fr: "Notre groupe financier allemand propose un programme de financement destiné aux clients qui recherchent des fonds pour des activités et des projets rentables. Le dispositif s'appuie sur un réseau d'institutions financières de premier plan en Europe : capital privé, private equity, financement de projet, énergie, immobilier, financement des activités et du divertissement, capital-risque, fonds spéculatifs et autres solutions de financement.",
          en: 'Our German financial group offers a funding programme for clients seeking capital for profitable business activities and projects. The programme is backed by a network of leading financial institutions in Europe: private capital, private equity, project funding, energy, real estate, business and entertainment funding, venture capital, hedge funds, and other financing solutions.',
        },
        {
          fr: "Nous proposons également des services de gestion et de financement liés aux actifs numériques et aux crypto-actifs pour les clients qui souhaitent un décaissement en cryptomonnaie, afin de limiter les contraintes inutiles et d'accélérer l'allocation du capital.",
          en: 'We also offer digital asset and cryptocurrency management and funding services for clients who prefer disbursement in cryptocurrency, reducing unnecessary restrictions and improving capital allocation efficiency.',
        },
      ],
    },
    {
      id: 'funding',
      title: { fr: 'Obtenir le financement adapté', en: 'Get the right funding for your business' },
      bullets: [
        {
          fr: 'Montants traités : de 2 000 000 EUR à 4 000 000 000 EUR',
          en: 'Transaction range: EUR 2,000,000 to EUR 4,000,000,000',
        },
        { fr: 'Durées : de 1 à 25 ans', en: 'Tenors: 1 to 25 years' },
        { fr: 'Taux indicatif : 4 %', en: 'Indicative rate: 4%' },
        {
          fr: "Vérification d'éligibilité sous 48 heures",
          en: 'Eligibility check within 48 hours',
        },
        {
          fr: "Comparaison d'options de financement et estimation du montant mobilisable",
          en: 'Comparison of lending options and indication of borrowing capacity',
        },
      ],
      paragraphs: [
        {
          fr: "Nous accompagnons des structures en création comme des entreprises établies. Le module de financement peut couvrir 100 % du besoin en dette, en fonds propres ou en combinaison, à l'échelle internationale : énergie, technologie, mines, immobilier et projets industriels.",
          en: 'We support start-ups and established companies. The financing module can provide 100% funding as debt, equity, or a combination, worldwide: energy, technology, mining, real estate, and business-based projects.',
        },
      ],
      note: {
        fr: "Ces critères s'appliquent au programme projet en euros. Les conditions du prêt commercial direct (USD, 3 %, prêteurs USA/Vietnam/Dubaï) sont sur la page Prêts.",
        en: 'These criteria apply to the euro project programme. Commercial direct loan terms (USD, 3%, US/Vietnam/Dubai lenders) are on the Loans page.',
      },
    },
    {
      id: 'commercial',
      title: {
        fr: 'Prêt commercial et financement de projet',
        en: 'Commercial loan and project funding',
      },
      paragraphs: [
        {
          fr: "Cette offre provient de l'ancien président et président du comité des prêts d'un prêteur commercial direct basé à Los Angeles. Les taux, durées et conditions dépendent de l'objectif du client : merci de compléter le modèle de résumé exécutif et de nous l'envoyer pour que nous comprenions votre projet.",
          en: 'This offer comes from the former President and Chairman of the Loan Committee of a Los Angeles-based commercial direct lender. Rates, terms, and conditions depend on what the client aims to achieve: please complete the Executive Summary template and email it to us so we understand your objectives.',
        },
        {
          fr: "La procédure détaillée de demande de prêt (étapes, caution d'assurance, liste des pièces) est décrite sur la page Prêts.",
          en: 'The detailed loan application procedure (steps, insurance surety bond, document list) is set out on the Loans page.',
        },
      ],
    },
    {
      id: 'referral',
      title: { fr: 'Partenaires apporteurs', en: 'Referral partners' },
      bullets: [
        {
          fr: "Les courtiers doivent préqualifier leurs clients et transmettre des dossiers complets. Sinon, la rémunération suit les règles d'introduction (environ un dixième de la commission courtier).",
          en: 'Brokers must screen their clients and submit complete packages. Otherwise, compensation follows introducer rules (about one tenth of a broker commission).',
        },
        {
          fr: "L'essentiel des revenus du secteur provient d'une minorité de clients qualifiés ; la productivité passe par le filtrage des dossiers.",
          en: 'Most industry revenue comes from a small share of qualified clients; productivity depends on filtering deals that can close.',
        },
        {
          fr: 'Nous travaillons avec un prêteur américain, un prêteur aux Émirats et un prêteur au Vietnam.',
          en: 'We work with one US lender, one UAE lender, and one Vietnam lender.',
        },
      ],
      paragraphs: [
        {
          fr: "Les règles de rémunération des courtiers et le détail des prêteurs par pays (délais, caution d'assurance) sont développés sur la page Prêts.",
          en: 'Broker compensation rules and lender detail by country (timelines, insurance surety bond) are set out on the Loans page.',
        },
      ],
    },
    {
      id: 'sectors',
      title: { fr: 'Secteurs financés', en: 'Sectors funded' },
      bullets: [
        { fr: 'Hôtels et complexes touristiques', en: 'Hotels and resorts' },
        {
          fr: 'Développements commerciaux et construction',
          en: 'Commercial developments and construction',
        },
        {
          fr: 'Projets énergie, eau et transition',
          en: 'Energy, water, and green-related projects',
        },
        {
          fr: 'Immobilier, bureaux, centres commerciaux',
          en: 'Real estate, offices, shopping centers',
        },
        {
          fr: "Mines, agriculture, expansion d'activité",
          en: 'Mining, agriculture, business growth',
        },
        {
          fr: 'Aéroports, ports, marinas, parcs, hôpitaux',
          en: 'Airports, marinas, amusement parks, hospitals',
        },
        { fr: 'Fonds de roulement et LBO', en: 'Working capital and leveraged buy-outs' },
      ],
    },
    {
      id: 'documents',
      title: {
        fr: 'Documents à fournir (un seul e-mail)',
        en: 'Documents to submit (single email)',
      },
      paragraphs: [
        {
          fr: "Liste de référence pour un dossier de financement de projet. Pour un prêt commercial, la même liste s'applique avec une procédure d'instruction distincte : voir la page Prêts.",
          en: 'Reference checklist for a project finance file. For a commercial loan, the same list applies with a separate processing procedure: see the Loans page.',
        },
      ],
      bullets: [
        { fr: "Certificat d'incorporation", en: 'Certificate of incorporation' },
        { fr: 'Facture récente au nom de la société', en: 'Company utility bill' },
        { fr: 'Attestation fiscale', en: 'Tax clearance' },
        { fr: 'Liste des actionnaires', en: 'Shareholders list' },
        {
          fr: 'États financiers de la dernière année (si disponibles)',
          en: 'Financial statements for the past year (if any)',
        },
        { fr: 'Business plan et résumé exécutif', en: 'Business plan and executive summary' },
        { fr: "Lettre d'intention (LOI)", en: 'Letter of intent (LOI)' },
        { fr: 'Profil de la société', en: 'Company profile' },
        {
          fr: "Deux pièces d'identité en couleur (permis de conduire et passeport)",
          en: "Two forms of ID in color (driver's licence and passport)",
        },
        { fr: 'NDA mutuel CFS', en: 'CFS mutual NDA' },
        { fr: 'Accord de commission de 5 %', en: 'Five percent commission agreement' },
        {
          fr: "Preuve de fonds pour la caution d'assurance (environ +/- 3 %)",
          en: 'Proof of funds for the insurance surety bond (approx. +/- 3%)',
        },
      ],
    },
  ] as ContentSection[],
};

export const privatePlacementContent = {
  heroSubtitle: {
    fr: "Programmes de placement privé (PPP) pour propriétaires de fonds ou d'actifs éligibles. Structuration cash backed ou adossée à instruments bancaires, sans trading spéculatif.",
    en: 'Private placement programs (PPP) for eligible fund or asset owners. Cash backed or instrument backed structuring, no speculative trading.',
  },
  sections: [
    {
      id: 'overview',
      title: { fr: 'Programme de placement privé', en: 'Private placement program' },
      paragraphs: [
        {
          fr: 'Toute information frauduleuse ou liée à des actifs illégaux sera signalée aux autorités compétentes. Les échanges sont encadrés par les usages ICC 500/600 et la documentation contractuelle entre le groupe de trading et le client.',
          en: 'Any fraudulent or illegal asset-related information will be reported to the appropriate authorities. Exchanges are governed by standard ICC 500/600 NCNDA provisions and contractual documentation between the trading group and the client.',
        },
        {
          fr: "Ces éléments sont informatifs et ne constituent pas une offre réglementée de produit financier. Les rendements indiqués le sont à titre indicatif ; seul le trader peut confirmer les chiffres au moment de l'opération.",
          en: 'This material is informational and does not constitute a regulated financial product offer. Indicative returns may only be confirmed by the trader at the time of the trade.',
        },
        {
          fr: "GL Capital structure et présente les dossiers éligibles auprès de plateformes partenaires. Les opérations sont exécutées dans le cadre contractuel entre la plateforme et le client, après conformité et acceptation du dossier.",
          en: 'GL Capital structures and presents eligible files to partner platforms. Operations are carried out under the contractual framework between the platform and the client, after compliance review and file acceptance.',
        },
      ],
      note: {
        fr: 'Les performances passées ne préjugent pas des résultats futurs. Falsifier un document ou un instrument financier constitue une infraction grave.',
        en: 'Past performance is no guarantee of future returns. Submitting forged or altered financial documents is a serious criminal offence.',
      },
    },
    {
      id: 'instruments',
      title: { fr: 'Instruments éligibles', en: 'Eligible instruments' },
      paragraphs: [
        {
          fr: "Les programmes privés structurés peuvent s'appuyer sur du cash ou sur des instruments bancaires adossés à des fonds réels : certificats de dépôt (CD), lettres de crédit standby (SBLC), garanties bancaires (BG) et notes à moyen terme (MTN).",
          en: 'Structured private programs may rely on cash or on bank instruments backed by real funds: certificates of deposit (CDs), standby letters of credit (SBLC), bank guarantees (BG), and medium term notes (MTN).',
        },
        {
          fr: "Des solutions de monétisation et de liquidité peuvent être étudiées pour ces instruments, dans un cadre de financement de projet ou de structuration, sous réserve de conformité et d'acceptation plateforme.",
          en: 'Monetisation and liquidity solutions for these instruments may be reviewed for project or structured finance purposes, subject to compliance and platform acceptance.',
        },
      ],
    },
    {
      id: 'tickets',
      title: { fr: 'Fourchettes par catégorie', en: 'Ranges by category' },
      bullets: [
        {
          fr: 'Small Cap : à partir de 100 000 USD/EUR',
          en: 'Small Cap: from USD/EUR 100,000',
        },
        {
          fr: 'Large Cap (cash) : 100 M à 5 Md USD/EUR',
          en: 'Large Cap (cash): USD/EUR 100M to 5B',
        },
        {
          fr: 'Programmes avec instruments (MT-760, MT-542, Euroclear) : 125 M à 5 Md USD/EUR',
          en: 'Instrument programmes (MT-760, MT-542, Euroclear): USD/EUR 125M to 5B',
        },
      ],
    },
    {
      id: 'structure',
      title: { fr: "Structure de l'offre", en: 'Offer structure' },
      bullets: [
        {
          fr: 'Plateformes et traders en Europe, Asie et autres places : fonds librement transférables, selon la catégorie Small Cap, Large Cap ou instruments',
          en: 'Platforms and traders in Europe, Asia, and other centres: freely transferable funds, under Small Cap, Large Cap, or instrument programme categories',
        },
        {
          fr: "Cash déposé auprès d'une banque de premier rang, sous contrôle du bénéficiaire effectif des fonds.",
          en: 'Cash held at a major bank, under the beneficial owner\'s control.',
        },
        {
          fr: "Le trader affecte une ligne de crédit contre le blocage des fonds du client ; les profits nets servent au financement des projets du client selon l'accord signé.",
          en: "The trader allocates a credit line against blocking of the client's funds; net profits fund the client's projects under the signed agreement.",
        },
        {
          fr: 'Sous-jacent : achat/vente sécurisé de notes MTN à vie, sans menace de perte du capital ; pas de CFD, forex, options binaires, actions, dérivés ni trading crypto spéculatif.',
          en: 'Underlying: secured buy/sell of MTN life notes with no effective threat to client capital; no CFDs, forex, binary options, shares, derivatives, or speculative crypto trading.',
        },
        {
          fr: "Fonds déjà bloqués au profit d'un tiers, y compris au nom du titulaire, ne sont pas acceptés : demander le déblocage avant soumission.",
          en: 'Funds already blocked in favour of any party, including the account owner, are not accepted: request unblocking before submission.',
        },
        {
          fr: "Seul le bénéficiaire effectif de fonds libres, transférables et assignables à la plateforme peut être recevable.",
          en: 'Only the beneficial owner of unrestricted, transferable funds assignable to the platform may qualify.',
        },
      ],
    },
    {
      id: 'programs',
      title: { fr: 'Types de programmes', en: 'Program types' },
      paragraphs: [
        {
          fr: "Cinq grands schémas structurels sont proposés selon la nature des fonds ou des instruments. Le détail opérationnel de chaque programme figure ci dessous.",
          en: 'Five main structural schemes are offered depending on the nature of the funds or instruments. Operational detail for each programme is set out below.',
        },
      ],
      bullets: [
        {
          fr: 'Large Cap — Cash, mise en attente administrative (USD/EUR 100 M à 5 Md) : sans SWIFT ni transfert de fonds',
          en: 'Large Cap — Cash, administrative hold (USD/EUR 100M to 5B): no SWIFT or fund transfer required',
        },
        {
          fr: "Large Cap — Cash, blocage/réserve (USD/EUR 100 M à 5 Md) : blocage ou réserve d'un an, confirmation SWIFT MT-799",
          en: 'Large Cap — Cash, block/reserve (USD/EUR 100M to 5B): one-year block or reserve, SWIFT MT-799 confirmation',
        },
        {
          fr: 'Instruments — SWIFT MT-760 (USD/EUR 125 M à 5 Md) : SBLC, garanties bancaires, MTN pour un an',
          en: 'Instruments — SWIFT MT-760 (USD/EUR 125M to 5B): SBLC, bank guarantees, MTN for one year',
        },
        {
          fr: 'Instruments — SWIFT MT-542 (USD/EUR 125 M à 5 Md) : certificats de dépôt et MTN, modalités contractuelles et conformité',
          en: 'Instruments — SWIFT MT-542 (USD/EUR 125M to 5B): certificates of deposit and MTN, subject to contract and compliance',
        },
        {
          fr: "Instruments — Euroclear, livraison libre (USD/EUR 125 M à 5 Md) : règlement d'instruments éligibles pour un an",
          en: 'Instruments — Euroclear free delivery (USD/EUR 125M to 5B): settlement of eligible instruments for one year',
        },
        {
          fr: 'Small Cap : à partir de 100 000 USD/EUR, programmes périodiques ouverts et fermés sans préavis',
          en: 'Small Cap: from USD/EUR 100,000, periodic programs opened and closed without notice',
        },
      ],
    },
    {
      id: 'operational',
      title: { fr: 'Cadre opérationnel par programme', en: 'Operational framework by programme' },
      bullets: [
        {
          fr: "1. Large Cap — Cash, mise en attente administrative (100 M à 5 Md USD/EUR) : mécanisme d'attente administrative, sans transmission SWIFT ni transfert de fonds. Les fonds restent sur le compte du client ; le client en conserve le contrôle pendant toute la durée du programme.",
          en: '1. Large Cap — Cash, administrative hold (USD/EUR 100M to 5B): administrative hold mechanism, no SWIFT transmission or fund transfer. Funds remain in the client\'s account; the client retains control throughout the programme.',
        },
        {
          fr: "2. Large Cap — Cash, blocage ou réserve (100 M à 5 Md USD/EUR) : la banque du client place les fonds en blocage ou réserve pour un an, avec confirmation SWIFT MT-799. Les fonds restent sur le compte du client et sous son contrôle.",
          en: '2. Large Cap — Cash, block or reserve (USD/EUR 100M to 5B): the client\'s bank places funds under block or reserve for one year, with SWIFT MT-799 confirmation. Funds remain in the client\'s account and under the client\'s control.',
        },
        {
          fr: "3. Instruments — SWIFT MT-760 (125 M à 5 Md USD/EUR) : affectation temporaire de la plateforme comme bénéficiaire d'un instrument éligible pour un an (SBLC, BG, MTN), sous réserve des termes contractuels et de l'approbation conformité.",
          en: '3. Instruments — SWIFT MT-760 (USD/EUR 125M to 5B): temporary assignment of the platform as beneficiary of an eligible instrument for one year (SBLC, BG, MTN), subject to contractual terms and compliance approval.',
        },
        {
          fr: "4. Instruments — SWIFT MT-542 (125 M à 5 Md USD/EUR) : même logique d'affectation temporaire pour un an sur certificats de dépôt et MTN, sous réserve des termes contractuels et de l'approbation conformité.",
          en: '4. Instruments — SWIFT MT-542 (USD/EUR 125M to 5B): same temporary assignment logic for one year on certificates of deposit and MTN, subject to contractual terms and compliance approval.',
        },
        {
          fr: "5. Instruments — Euroclear, livraison libre (125 M à 5 Md USD/EUR) : instruction de livraison et de règlement d'un instrument éligible (CD, SBLC, BG, MTN) pour un an, sous réserve des termes contractuels et de l'approbation conformité.",
          en: '5. Instruments — Euroclear free delivery (USD/EUR 125M to 5B): delivery and settlement instruction for an eligible instrument (CD, SBLC, BG, MTN) for one year, subject to contractual terms and compliance approval.',
        },
      ],
      note: {
        fr: "Seules les banques et institutions de premier rang sont retenues. Les instruments émis par des établissements non éligibles ne sont pas traités.",
        en: 'Only major banks and institutions are considered. Instruments issued by ineligible institutions are not processed.',
      },
    },
    {
      id: 'timeline',
      title: { fr: 'Calendrier indicatif', en: 'Indicative timeline' },
      bullets: [
        {
          fr: "Cycle opérationnel d'environ 40 semaines, avec périodes de distribution prévues au contrat, sous réserve de la performance du programme et des conditions convenues.",
          en: 'Operational cycle of approximately 40 weeks, with distribution periods set out in the agreement, subject to programme performance and agreed conditions.',
        },
        {
          fr: "Option de programme longue durée : 3 à 5 ans, selon l'éligibilité de la banque et l'acceptation de la plateforme.",
          en: 'Longer term programme option: 3 to 5 years, subject to bank eligibility and platform acceptance.',
        },
        {
          fr: "Option courte durée (environ 10 jours) : parfois disponible, selon disponibilité et acceptation, via des comptes détenus auprès de banques britanniques de premier rang.",
          en: 'Short term option (approximately 10 days): occasionally available, subject to availability and acceptance, through accounts held at major UK banks.',
        },
      ],
      note: {
        fr: "Aucun calendrier ni rendement n'est garanti à l'avance. Les fenêtres de programme peuvent s'ouvrir ou se fermer selon les conditions de marché et la demande.",
        en: 'No timeline or return is guaranteed in advance. Programme windows may open or close depending on market conditions and demand.',
      },
    },
    {
      id: 'requirements',
      title: { fr: 'Exigences et critères d\'éligibilité', en: 'Requirements and eligibility criteria' },
      bullets: [
        {
          fr: 'Instruments intégralement adossés à du cash uniquement ; les instruments adossés à des minerais ou à d\'autres instruments financiers ne sont pas acceptés.',
          en: 'Fully cash backed instruments only; instruments backed by minerals or other financial instruments are not accepted.',
        },
        {
          fr: "Les instruments loués (leased) ne sont acceptés en aucune circonstance.",
          en: 'Leased instruments are not accepted under any circumstances.',
        },
        {
          fr: "Les structures peuvent varier selon les conditions de marché ; des fenêtres de programme supplémentaires peuvent s'ouvrir selon la demande.",
          en: 'Structures may vary depending on market conditions; additional programme windows may open according to demand.',
        },
        {
          fr: "Bénéficiaire effectif identifié, fonds libres et transférables, dossier de conformité complet (CIS, preuve de fonds, résumé exécutif).",
          en: 'Identified beneficial owner, unrestricted transferable funds, complete compliance package (CIS, proof of funds, executive summary).',
        },
      ],
    },
    {
      id: 'distribution',
      title: { fr: 'Modalités de distribution', en: 'Distribution framework' },
      paragraphs: [
        {
          fr: "Les modalités de distribution sont définies dans l'accord de programme privé signé entre la plateforme et le client. Aucun rendement n'est garanti avant signature et validation conformité.",
          en: 'Distribution terms are defined in the private programme agreement signed between the platform and the client. No return is guaranteed before signing and compliance validation.',
        },
        {
          fr: "Les flux éventuels sont traités selon les termes contractuels en vigueur au moment de l'opération ; seul le trader ou la plateforme peut confirmer les chiffres applicables à ce stade.",
          en: 'Any flows are handled according to the contractual terms in force at the time of the operation; only the trader or platform can confirm the applicable figures at that stage.',
        },
      ],
    },
    {
      id: 'funders',
      title: { fr: 'Financeurs de projets', en: 'Project funders' },
      paragraphs: [
        {
          fr: 'Nous finançons des projets via la finance structurée, sans licence de valeurs mobilières. Les programmes SBLC buy-sell permettent de financer des projets viables à forte valeur sociétale sans endettement direct, avec des économies potentielles importantes.',
          en: 'We fund projects through structured finance; we are not securities licensed. SBLC buy-sell programs help finance viable projects of societal value without direct debt, with significant potential savings.',
        },
        {
          fr: 'Participation sur invitation uniquement, après due diligence. Nous traitons uniquement les propriétaires de fonds ou leurs intermédiaires directs, avec un dossier de conformité complet.',
          en: 'Participation by invitation only, after due diligence. We only engage fund owners or their direct intermediaries with a complete compliance package.',
        },
        {
          fr: "Lorsque le client n'a pas de projet identifié, la plateforme peut, selon les cas, orienter vers un projet compatible avec le secteur d'activité du client, sous réserve d'acceptation mutuelle et de due diligence.",
          en: 'Where the client has no identified project, the platform may, in some cases, direct them toward a project compatible with the client\'s field of business, subject to mutual acceptance and due diligence.',
        },
      ],
      note: {
        fr: "GL Capital ne publie pas ces programmes comme une offre publique continue. Voir aussi la page Services pour les opportunités périodiques Small Cap.",
        en: 'GL Capital does not publish these programmes as a continuous public offer. See also the Services page for periodic Small Cap opportunities.',
      },
    },
  ] as ContentSection[],
};

export const bankInstrumentsExtra = {
  services: {
    fr: ['Achat', 'Location (lease)', 'Monétisation'],
    en: ['Purchase', 'Lease', 'Monetization'],
  },
  nonRecourse: {
    fr: 'Prêt sans recours adossé à un instrument bancaire (SBLC). Contactez-nous pour étudier votre dossier.',
    en: 'Non-recourse loan against a bank instrument (SBLC). Contact us to review your file.',
  },
};

export const loansContent = {
  heroSubtitle: {
    fr: 'Prêts commerciaux et de projet adossés à des instruments bancaires. Procédure, conditions indicatives et pièces à préparer avant soumission.',
    en: 'Commercial and project loans backed by banking instruments. Procedure, indicative terms, and documents to prepare before submission.',
  },
  sections: [
    {
      id: 'loans',
      title: { fr: 'Prêts commerciaux et de projet', en: 'Commercial and project loans' },
      paragraphs: [
        {
          fr: "Les prêts commerciaux et de projet s'inscrivent dans notre programme mondial (montants, durées et conditions selon le profil du dossier). Pour un prêt sans recours garanti par SBLC, voir la page Instruments bancaires.",
          en: 'Commercial and project loans fall under our global programme (amounts, tenors, and terms depend on the file). For non-recourse loans secured by SBLC, see the Banking Instruments page.',
        },
        {
          fr: "Cette page décrit la procédure de demande, les prêteurs partenaires et les documents à réunir. GL Capital structure le dossier et assure la mise en relation ; le décaissement est effectué par le prêteur institutionnel retenu, après conformité et accord formel.",
          en: 'This page describes the application procedure, partner lenders, and documents to assemble. GL Capital structures the file and facilitates introductions; disbursement is carried out by the selected institutional lender, after compliance review and formal agreement.',
        },
      ],
    },
    {
      id: 'commercial',
      title: { fr: 'Origine de l\'offre', en: 'Origin of the offer' },
      paragraphs: [
        {
          fr: "L'offre de prêt commercial provient de l'ancien président et président du comité des prêts d'un prêteur commercial direct basé à Los Angeles. Les taux, durées et conditions dépendent de l'objectif du client : sans résumé exécutif complet, aucune discussion chiffrée n'est possible.",
          en: 'The commercial loan offer comes from the former President and Chairman of the Loan Committee of a Los Angeles based commercial direct lender. Rates, tenors, and conditions depend on what the client aims to achieve; without a complete executive summary, no figures can be discussed.',
        },
        {
          fr: "Complétez le modèle de résumé exécutif et envoyez le par courriel afin que nous comprenions votre projet, la répartition envisagée des fonds et le calendrier visé.",
          en: 'Complete the executive summary template and email it to us so we understand your project, the intended allocation of funds, and your target timeline.',
        },
      ],
    },
    {
      id: 'terms',
      title: { fr: 'Conditions indicatives', en: 'Indicative terms' },
      bullets: [
        {
          fr: 'Montants : de 5 000 000 USD à 5 500 000 000 USD (programme prêt commercial direct)',
          en: 'Amounts: USD 5,000,000 to USD 5,500,000,000 (commercial direct loan programme)',
        },
        {
          fr: 'Taux indicatif : 3 % (TAEG selon dossier, collatéral et prêteur retenu)',
          en: 'Indicative rate: 3% APR (effective rate depends on file, collateral, and selected lender)',
        },
        {
          fr: 'Durées : 5, 10 ou 15 ans, selon structure retenue',
          en: 'Tenors: 5, 10, or 15 years, depending on the structure selected',
        },
        {
          fr: 'Zone géographique : projets éligibles dans le monde entier',
          en: 'Geography: eligible projects worldwide',
        },
        {
          fr: 'Délai de décaissement indicatif : environ 30 jours ouvrés (+/-), après finalisation des accords et obtention de la caution d\'assurance',
          en: 'Indicative disbursement timeline: approximately 30 business days (+/-), after agreements are finalised and the insurance surety bond is in place',
        },
        {
          fr: 'Moratoire : 1 à 2 ans possibles, selon prêteur et collatéral (caution d\'assurance, garantie bancaire, SBLC ou fonds bloqués MT-799)',
          en: 'Grace period: 1 to 2 years possible, depending on lender and collateral (insurance surety bond, bank guarantee, SBLC, or blocked funds MT-799)',
        },
        {
          fr: 'Forme retenue : prêt stricto sensu ; pas d\'investissement direct, de joint venture ni de prise de participation dans la société emprunteuse',
          en: 'Structure: loan only; no direct investment, joint venture, or equity stake in the borrowing company',
        },
      ],
      note: {
        fr: 'Les montants en euros traités dans le cadre du programme de financement de projet (2 M€ à 4 Md€, taux indicatif 4 %) restent décrits sur la page Financement de projet. Les fourchettes varient selon le prêteur et le programme.',
        en: 'Euro amounts handled under the project finance programme (EUR 2M to EUR 4B, indicative rate 4%) are described on the Project Finance page. Ranges vary by lender and programme.',
      },
    },
    {
      id: 'lenders',
      title: { fr: 'Prêteurs partenaires', en: 'Partner lenders' },
      paragraphs: [
        {
          fr: "Nous travaillons avec un prêteur américain, un prêteur au Vietnam et un prêteur privé basé à Dubaï (Émirats arabes unis). Le calendrier dépend du dossier et de la réactivité du client.",
          en: 'We work with one US lender, one Vietnam based lender, and one private funder based in Dubai (United Arab Emirates). Timelines depend on the file and on how quickly the client responds.',
        },
      ],
      bullets: [
        {
          fr: 'Vietnam : délais les plus courts ; décaissement possible en environ deux semaines pour un dossier complet et conforme',
          en: 'Vietnam: shortest timelines; disbursement possible in approximately two weeks for a complete, compliant file',
        },
        {
          fr: 'États-Unis : prêteur opérationnel depuis août 2025 ; environ 30 jours ouvrés (+/-) ; sélection stricte des dossiers',
          en: 'United States: lender operational since August 2025; approximately 30 business days (+/-); strict file selection',
        },
        {
          fr: 'Dubaï : environ 30 jours ouvrés (+/-) jusqu\'au décaissement',
          en: 'Dubai: approximately 30 business days (+/-) to disbursement',
        },
      ],
    },
    {
      id: 'insurance',
      title: { fr: 'Caution d\'assurance (surety bond)', en: 'Insurance surety bond' },
      paragraphs: [
        {
          fr: "Tous les prêts retenus exigent une assurance après approbation et avant décaissement. Sans capacité à régler la caution, le prêt ne peut pas être débloqué.",
          en: 'All approved loans require insurance after approval and before disbursement. Without the means to pay for the surety bond, the loan cannot be released.',
        },
        {
          fr: "La caution est une convention tripartite : la compagnie d'assurance (surety) garantit l'obligee (le prêteur) que le principal (vous, l'emprunteur) exécutera ses obligations. Vous devez la souscrire via votre agent ou courtier d'assurance, après accord de principe et avant le versement des fonds.",
          en: 'The surety bond is a three party agreement: the insurance company (surety) guarantees the obligee (the lender) that the principal (you, the borrower) will perform its obligations. You must arrange it through your insurance agent or broker, after approval in principle and before funds are released.',
        },
        {
          fr: "Avant de connaître le nom de l'obligee, transmettez la carte de visite et une lettre de votre agent ou courtier attestant que vous êtes prêt à régler la caution dès l'accord de prêt.",
          en: "Before the obligee's name is known, provide the agent or broker's business card and a letter confirming you are prepared to pay for the bond once the loan is approved.",
        },
      ],
      bullets: [
        {
          fr: 'Vietnam : environ 1 % du montant + 250 000 USD (indicatif)',
          en: 'Vietnam: approximately 1% of the amount + USD 250,000 (indicative)',
        },
        {
          fr: 'États-Unis : environ 3 % (indicatif)',
          en: 'United States: approximately 3% (indicative)',
        },
        {
          fr: 'Dubaï : environ 3 % à 5 % pour la caution d\'assurance (indicatif)',
          en: 'Dubai: approximately 3% to 5% for the insurance surety bond (indicative)',
        },
        {
          fr: 'Preuve de fonds : relevé bancaire récent montrant que vous pouvez régler la caution (environ +/- 3 % selon prêteur)',
          en: 'Proof of funds: recent bank statement showing you can pay for the bond (approximately +/- 3% depending on lender)',
        },
      ],
    },
    {
      id: 'process',
      title: { fr: 'Procédure de demande', en: 'Application procedure' },
      bullets: [
        {
          fr: '1. Le financement suit un processus structuré : envoyez le résumé exécutif et détaillez la répartition prévue des fonds.',
          en: '1. Funding follows a structured process: send the executive summary and outline the intended allocation of funds.',
        },
        {
          fr: '2. Nous revenons vers vous avec une note détaillée, une liste de 12 pièces et les annexes utiles.',
          en: '2. We respond with a detailed narrative, a 12 item checklist, and supporting attachments.',
        },
        {
          fr: '3. Prévoyez plusieurs heures pour compléter le dossier, puis renvoyez l\'ensemble en un seul courriel, avec un relevé bancaire récent prouvant votre capacité à régler la caution d\'assurance.',
          en: '3. Allow several hours to complete the paperwork, then return everything in a single email, with a recent bank statement proving your ability to pay for the insurance surety bond.',
        },
        {
          fr: '4. Comptez quelques jours pour la revue du dossier par notre équipe.',
          en: '4. Allow a few days for our team to review the file.',
        },
        {
          fr: '5. Le rythme d\'avancement suit celui du client : dossier incomplet ou réponses tardives allongent les délais.',
          en: '5. Progress follows the client\'s pace: an incomplete file or delayed responses extend timelines.',
        },
        {
          fr: '6. Après approbation : souscription de la caution d\'assurance par l\'emprunteur, puis décaissement selon le calendrier du prêteur retenu.',
          en: '6. After approval: the borrower arranges the insurance surety bond, then disbursement proceeds on the selected lender\'s timeline.',
        },
      ],
    },
    {
      id: 'referral',
      title: { fr: 'Courtiers et apporteurs', en: 'Brokers and referral partners' },
      bullets: [
        {
          fr: 'Les courtiers doivent préqualifier leurs clients et transmettre des dossiers complets.',
          en: 'Brokers must screen their clients and submit complete packages.',
        },
        {
          fr: "À défaut, la rémunération suit les règles d'introduction (environ un dixième de la commission courtier).",
          en: 'Otherwise, compensation follows introducer rules (about one tenth of a broker commission).',
        },
        {
          fr: "L'essentiel des revenus du secteur provient d'une minorité de clients qualifiés ; la productivité passe par le filtrage des dossiers recevables.",
          en: 'Most industry revenue comes from a small share of qualified clients; productivity depends on filtering deals that can actually close.',
        },
      ],
    },
    {
      id: 'collateral',
      title: { fr: 'Collatéral accepté', en: 'Accepted collateral' },
      bullets: [
        { fr: 'Caution d\'assurance (surety bond)', en: 'Insurance surety bond' },
        { fr: 'Garantie bancaire (BG)', en: 'Bank guarantee (BG)' },
        { fr: 'Lettre de crédit standby (SBLC)', en: 'Standby letter of credit (SBLC)' },
        { fr: 'Fonds bloqués (confirmation SWIFT MT-799)', en: 'Blocked funds (SWIFT MT-799 confirmation)' },
      ],
      paragraphs: [
        {
          fr: "Pour un prêt sans recours adossé à un SBLC, voir la page Instruments bancaires.",
          en: 'For a non-recourse loan secured by an SBLC, see the Banking Instruments page.',
        },
      ],
    },
    {
      id: 'sectors',
      title: { fr: 'Secteurs financés', en: 'Sectors funded' },
      bullets: [
        { fr: 'Hôtels et complexes touristiques', en: 'Hotels and resorts' },
        {
          fr: 'Développements commerciaux et projets de construction',
          en: 'Commercial developments and construction projects',
        },
        { fr: 'Projets énergie, eau et transition', en: 'Energy, water, and green related projects' },
        { fr: 'Bureaux et complexes immobiliers', en: 'Office building complexes' },
        { fr: 'Fonds de roulement', en: 'Working capital' },
        { fr: 'Programmes adossés à l\'immobilier', en: 'Real estate based programmes' },
        {
          fr: 'Retournement commercial et développement',
          en: 'Commercial turnaround and development',
        },
        {
          fr: 'Développement et construction internationaux',
          en: 'International development and construction',
        },
        {
          fr: 'Résidences et programmes mixtes (appartements, condos)',
          en: 'Apartment complexes and condo developments',
        },
        { fr: 'Mines et agriculture internationales', en: 'International mining and agriculture' },
        { fr: 'Croissance et expansion d\'activité', en: 'Business growth and expansion' },
        { fr: 'Pétrole', en: 'Oil' },
        { fr: 'Aéroports, marinas, parcs de loisirs', en: 'Airports, marinas, amusement parks' },
        { fr: 'Centres commerciaux', en: 'Shopping centers' },
        { fr: 'LBO (acquisitions avec effet de levier)', en: 'Leveraged buy outs' },
        { fr: 'Jets d\'affaires', en: 'Corporate jets' },
        { fr: 'Hôpitaux', en: 'Hospitals' },
      ],
    },
    {
      id: 'documents',
      title: {
        fr: 'Documents à fournir (un seul courriel)',
        en: 'Documents to submit (single email)',
      },
      paragraphs: [
        {
          fr: "Rassemblez les pièces ci-dessous et transmettez-les en une seule fois. Un dossier éclaté en plusieurs envois ralentit l'instruction.",
          en: 'Gather the items below and send them at once. A file split across multiple emails slows processing.',
        },
      ],
      bullets: [
        { fr: "Certificat d'incorporation", en: 'Certificate of incorporation' },
        { fr: 'Facture récente au nom de la société', en: 'Company utility bill' },
        { fr: 'Attestation fiscale', en: 'Tax clearance' },
        { fr: 'Liste des actionnaires', en: 'Shareholders list' },
        {
          fr: 'États financiers de la dernière année (si disponibles)',
          en: 'Financial statements for the past year (if any)',
        },
        { fr: 'Business plan et résumé exécutif', en: 'Business plan and executive summary' },
        { fr: "Lettre d'intention (LOI)", en: 'Letter of intent (LOI)' },
        { fr: 'Profil de la société', en: 'Company profile' },
        {
          fr: "Deux pièces d'identité en couleur (permis de conduire et passeport)",
          en: "Two forms of ID in color (driver's licence and passport)",
        },
        { fr: 'NDA mutuel CFS', en: 'CFS mutual NDA' },
        { fr: 'Accord de commission de 5 %', en: 'Five percent commission agreement' },
        {
          fr: "Preuve de fonds pour la caution d'assurance (environ +/- 3 %)",
          en: 'Proof of funds for the insurance surety bond (approx. +/- 3%)',
        },
      ],
    },
    {
      id: 'caveats',
      title: { fr: 'Limites et conformité', en: 'Limits and compliance' },
      bullets: [
        {
          fr: "Aucun prêteur ne peut émettre d'engagement ferme avant examen du dossier, décision interne et procédures réglementaires applicables.",
          en: 'No lender can issue a binding commitment before file review, internal decision, and applicable regulatory procedures.',
        },
        {
          fr: "Les financeurs ne conviennent pas aux entreprises en difficulté financière avérée ; une analyse de viabilité précède toute suite favorable.",
          en: 'Funders are not a viable option for businesses in proven financial difficulty; a viability review precedes any positive outcome.',
        },
        {
          fr: "Le dossier doit préciser quelles autres pistes de financement ont été explorées et pourquoi elles n'ont pas couvert l'intégralité du besoin.",
          en: 'The file must explain which alternative funding routes were explored and why they did not cover the full project need.',
        },
      ],
      note: {
        fr: "GL Capital n'est pas un établissement de crédit, un courtier en valeurs mobilières ni un conseiller financier titré. Ces informations sont fournies à titre documentaire pour les destinataires concernés. Pour un conseil réglementé, consultez un professionnel habilité. Aucun décaissement n'est garanti.",
        en: 'GL Capital is not a credit institution, securities broker, or licensed financial advisor. This material is provided for documentary purposes to intended recipients. For regulated advice, consult a licensed professional. No disbursement is guaranteed.',
      },
    },
  ] as ContentSection[],
};

export const cryptoAdvisoryContent = {
  heroSubtitle: {
    fr: 'Conseil et services sur les actifs numériques : courtage prime, trading OTC, prêt-emprunt et conservation pour investisseurs institutionnels.',
    en: 'Advisory and services on digital assets: prime brokerage, OTC trading, lending, and custody for institutional investors.',
  },
  sections: [
    {
      id: 'context',
      title: { fr: 'Actifs numériques', en: 'Digital assets' },
      paragraphs: [
        {
          fr: "Les actifs numériques occupent une place croissante dans les stratégies de trésorerie et d'investissement. Bitcoin a ouvert la voie à un transfert de valeur sans intermédiaire ; Ethereum est devenu la plus grande plateforme blockchain au monde pour la gestion d'actifs.",
          en: "Digital assets play a growing role in treasury and investment strategies. Bitcoin enabled peer-to-peer value transfer; Ethereum has become the world's largest blockchain ecosystem for asset management.",
        },
        {
          fr: 'Le gouvernement fédéral allemand, le ministère des Finances et la BaFin ont renforcé le cadre légal : conservation des actifs numériques par les institutions, titres électroniques et récente loi sur la localisation des fonds.',
          en: 'The German federal government, the Ministry of Finance, and BaFin have strengthened the legal framework: custody of digital assets by institutions, electronic securities, and the recent fund location act.',
        },
      ],
    },
    {
      id: 'services',
      title: {
        fr: 'Courtier prime en monnaies numériques',
        en: 'Digital currency prime broker',
      },
      paragraphs: [
        {
          fr: 'Notre groupe financier allemand propose une place sécurisée pour négocier, emprunter, prêter et conserver des monnaies numériques.',
          en: 'Our German financial group provides a secure marketplace to trade, borrow, lend, and custody digital currencies.',
        },
      ],
      bullets: [
        {
          fr: 'Trading OTC : exécution de grands ordres, courtier valeurs mobilières auprès de la SEC et de la FINRA',
          en: 'OTC trading: large-order execution, SEC and FINRA regulated securities broker-dealer',
        },
        {
          fr: 'Prêt-emprunt : liquidité alternative pour couverture, spéculation ou fonds de roulement',
          en: 'Lending: borrow and lend digital assets for hedging, speculation, or working capital',
        },
        {
          fr: 'Conservation : stockage froid et technologies MPC hybrides, assurance sur les comptes',
          en: 'Custody: cold storage and hybrid MPC technologies, digital currency insurance on accounts',
        },
      ],
    },
  ] as ContentSection[],
};
