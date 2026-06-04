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

export const projectFinanceContent = {
  heroSubtitle: {
    fr: "Programme de financement mondial pour entreprises et porteurs de projets. Structuration, analyse d'éligibilité et mise en relation avec des prêteurs institutionnels en Europe, aux États-Unis, aux Émirats et au Vietnam.",
    en: 'Global funding programme for companies and project sponsors. Structuring, eligibility review, and introduction to institutional lenders in Europe, the United States, the UAE, and Vietnam.',
  },
  sections: [
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
          fr: 'Comparaison d\'options de financement et estimation du montant mobilisable',
          en: 'Comparison of lending options and indication of borrowing capacity',
        },
      ],
      paragraphs: [
        {
          fr: "Nous accompagnons des structures en création comme des entreprises établies. Le module de financement peut couvrir 100 % du besoin en dette, en fonds propres ou en combinaison, à l'échelle internationale : énergie, technologie, mines, immobilier et projets industriels.",
          en: 'We support start-ups and established companies. The financing module can provide 100% funding as debt, equity, or a combination, worldwide: energy, technology, mining, real estate, and business-based projects.',
        },
      ],
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
    },
    {
      id: 'sectors',
      title: { fr: 'Secteurs financés', en: 'Sectors funded' },
      bullets: [
        { fr: 'Hôtels et complexes touristiques', en: 'Hotels and resorts' },
        { fr: 'Développements commerciaux et construction', en: 'Commercial developments and construction' },
        { fr: 'Projets énergie, eau et transition', en: 'Energy, water, and green-related projects' },
        { fr: 'Immobilier, bureaux, centres commerciaux', en: 'Real estate, offices, shopping centers' },
        { fr: 'Mines, agriculture, expansion d\'activité', en: 'Mining, agriculture, business growth' },
        { fr: 'Aéroports, ports, marinas, parcs, hôpitaux', en: 'Airports, marinas, amusement parks, hospitals' },
        { fr: 'Fonds de roulement et LBO', en: 'Working capital and leveraged buy-outs' },
      ],
    },
    {
      id: 'documents',
      title: {
        fr: 'Documents à fournir (un seul e-mail)',
        en: 'Documents to submit (single email)',
      },
      bullets: [
        { fr: 'Certificat d\'incorporation', en: 'Certificate of incorporation' },
        { fr: 'Facture récente au nom de la société', en: 'Company utility bill' },
        { fr: 'Attestation fiscale', en: 'Tax clearance' },
        { fr: 'Liste des actionnaires', en: 'Shareholders list' },
        { fr: 'États financiers de la dernière année (si disponibles)', en: 'Financial statements for the past year (if any)' },
        { fr: 'Business plan et résumé exécutif', en: 'Business plan and executive summary' },
        { fr: 'Lettre d\'intention (LOI)', en: 'Letter of intent (LOI)' },
        { fr: 'Profil de la société', en: 'Company profile' },
        { fr: 'Deux pièces d\'identité en couleur (permis de conduire et passeport)', en: 'Two forms of ID in color (driver\'s licence and passport)' },
        { fr: 'NDA mutuel CFS', en: 'CFS mutual NDA' },
        { fr: 'Accord de commission de 5 %', en: 'Five percent commission agreement' },
        {
          fr: 'Preuve de fonds pour la caution d\'assurance (environ +/- 3 %)',
          en: 'Proof of funds for the insurance surety bond (approx. +/- 3%)',
        },
      ],
    },
  ] as ContentSection[],
};

export const privatePlacementContent = {
  heroSubtitle: {
    fr: "Programmes de placement privé (PPP) pour propriétaires de fonds ou d'actifs éligibles. Opérations sécurisées sur notes MTN, sans trading spéculatif.",
    en: 'Private placement programs (PPP) for eligible fund or asset owners. Secured MTN buy/sell operations, no speculative trading.',
  },
  sections: [
    {
      id: 'overview',
      title: { fr: 'Programme de placement privé', en: 'Private placement program' },
      paragraphs: [
        {
          fr: "Toute information frauduleuse ou liée à des actifs illégaux sera signalée aux autorités compétentes. Les échanges sont encadrés par les usages ICC 500/600 et la documentation contractuelle entre le groupe de trading et le client.",
          en: 'Any fraudulent or illegal asset-related information will be reported to the appropriate authorities. Exchanges are governed by standard ICC 500/600 NCNDA provisions and contractual documentation between the trading group and the client.',
        },
        {
          fr: "Ces éléments sont informatifs et ne constituent pas une offre réglementée de produit financier. Les rendements indiqués le sont à titre indicatif ; seul le trader peut confirmer les chiffres au moment de l'opération.",
          en: 'This material is informational and does not constitute a regulated financial product offer. Indicative returns may only be confirmed by the trader at the time of the trade.',
        },
      ],
      note: {
        fr: "Les performances passées ne préjugent pas des résultats futurs. Falsifier un document ou un instrument financier constitue une infraction grave.",
        en: 'Past performance is no guarantee of future returns. Submitting forged or altered financial documents is a serious criminal offence.',
      },
    },
    {
      id: 'structure',
      title: { fr: 'Structure de l\'offre', en: 'Offer structure' },
      bullets: [
        {
          fr: 'Plateformes et traders en Europe, Asie et autres places : minimum USD/EUR 100 à 500 M (50 M possible selon approbation), fonds librement transférables',
          en: 'Platforms and traders in Europe, Asia, and other centres: minimum USD/EUR 100M to 500M (50M possible with approval), freely transferable cash on deposit',
        },
        {
          fr: "Le trader affecte une ligne de crédit contre le blocage des fonds du client ; les profits nets servent au financement des projets du client selon l'accord signé.",
          en: 'The trader allocates a credit line against blocking of the client\'s funds; net profits fund the client\'s projects under the signed agreement.',
        },
        {
          fr: "Sous-jacent : achat/vente sécurisé de notes MTN à vie, sans menace de perte du capital ; pas de CFD, forex, options binaires, actions, dérivés ni trading crypto spéculatif.",
          en: 'Underlying: secured buy/sell of MTN life notes with no effective threat to client capital; no CFDs, forex, binary options, shares, derivatives, or speculative crypto trading.',
        },
        {
          fr: "Fonds déjà bloqués au profit d'un tiers, y compris au nom du titulaire, ne sont pas acceptés : demander le déblocage avant soumission.",
          en: 'Funds already blocked in favour of any party, including the account owner, are not accepted: request unblocking before submission.',
        },
      ],
    },
    {
      id: 'programs',
      title: { fr: 'Types de programmes', en: 'Program types' },
      bullets: [
        {
          fr: 'Cash, mise en attente administrative (USD 100 M à 5 Md) : sans SWIFT ni transfert de fonds',
          en: 'Cash, administrative hold (USD 100M to 5B): no SWIFT or fund transfer required',
        },
        {
          fr: 'Cash, blocage/réserve (USD 100 M à 5 Md) : blocage ou réserve d\'un an, confirmation SWIFT MT-799',
          en: 'Cash, block/reserve (USD 100M to 5B): one-year block or reserve, SWIFT MT-799 confirmation',
        },
        {
          fr: 'SWIFT MT-760 (USD 150 M à 5 Md) : SBLC, garanties bancaires, MTN pour un an',
          en: 'SWIFT MT-760 (USD 150M to 5B): SBLC, bank guarantees, MTN for one year',
        },
        {
          fr: 'SWIFT MT-542 (USD 150 M à 5 Md) : même logique, modalités contractuelles et conformité',
          en: 'SWIFT MT-542 (USD 150M to 5B): same structure, subject to contract and compliance',
        },
        {
          fr: 'Euroclear, livraison libre (150 M USD à 5 Md) : règlement d\'instruments éligibles pour un an',
          en: 'Euroclear free delivery ($150M to $5B): settlement of eligible instruments for one year',
        },
        {
          fr: 'Small cap : de 100 000 à 99 millions, programmes périodiques ouverts et fermés sans préavis',
          en: 'Small cap: $100,000 to $99 million, periodic programs opened and closed without notice',
        },
      ],
    },
    {
      id: 'funders',
      title: { fr: 'Financeurs de projets', en: 'Project funders' },
      paragraphs: [
        {
          fr: "Nous finançons des projets via la finance structurée, sans licence de valeurs mobilières. Les programmes SBLC buy-sell permettent de financer des projets viables à forte valeur sociétale sans endettement direct, avec des économies potentielles importantes.",
          en: 'We fund projects through structured finance; we are not securities licensed. SBLC buy-sell programs help finance viable projects of societal value without direct debt, with significant potential savings.',
        },
        {
          fr: "Participation sur invitation uniquement, après due diligence. Nous traitons uniquement les propriétaires de fonds ou leurs intermédiaires directs, avec un dossier de conformité complet.",
          en: 'Participation by invitation only, after due diligence. We only engage fund owners or their direct intermediaries with a complete compliance package.',
        },
      ],
    },
  ] as ContentSection[],
};

export const bankInstrumentsExtra = {
  services: {
    fr: ['Achat', 'Location (lease)', 'Monétisation'],
    en: ['Purchase', 'Lease', 'Monetization'],
  },
  nonRecourse: {
    fr: "Prêt sans recours adossé à un instrument bancaire (SBLC). Contactez-nous pour étudier votre dossier.",
    en: 'Non-recourse loan against a bank instrument (SBLC). Contact us to review your file.',
  },
};

export const loansContent = {
  heroSubtitle: {
    fr: "Prêts institutionnels et financements adossés à des instruments bancaires, dans le cadre de nos programmes de structuration.",
    en: 'Institutional loans and financing backed by banking instruments, within our structuring programmes.',
  },
  sections: [
    {
      id: 'loans',
      title: { fr: 'Prêts', en: 'Loans' },
      paragraphs: [
        {
          fr: "Les prêts commerciaux et de projet s'inscrivent dans notre programme mondial (montants, durées et conditions selon le profil du dossier). Pour un prêt sans recours garanti par SBLC, voir la page Instruments bancaires.",
          en: 'Commercial and project loans fall under our global programme (amounts, tenors, and terms depend on the file). For non-recourse loans secured by SBLC, see the Banking Instruments page.',
        },
      ],
    },
  ] as ContentSection[],
};

export const cryptoAdvisoryContent = {
  heroSubtitle: {
    fr: "Conseil et services sur les actifs numériques : courtage prime, trading OTC, prêt-emprunt et conservation pour investisseurs institutionnels.",
    en: 'Advisory and services on digital assets: prime brokerage, OTC trading, lending, and custody for institutional investors.',
  },
  sections: [
    {
      id: 'context',
      title: { fr: 'Actifs numériques', en: 'Digital assets' },
      paragraphs: [
        {
          fr: "Les actifs numériques occupent une place croissante dans les stratégies de trésorerie et d'investissement. Bitcoin a ouvert la voie à un transfert de valeur sans intermédiaire ; Ethereum est devenu la plus grande plateforme blockchain au monde pour la gestion d'actifs.",
          en: 'Digital assets play a growing role in treasury and investment strategies. Bitcoin enabled peer-to-peer value transfer; Ethereum has become the world\'s largest blockchain ecosystem for asset management.',
        },
        {
          fr: "Le gouvernement fédéral allemand, le ministère des Finances et la BaFin ont renforcé le cadre légal : conservation des actifs numériques par les institutions, titres électroniques et récente loi sur la localisation des fonds.",
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
          fr: "Notre groupe financier allemand propose une place sécurisée pour négocier, emprunter, prêter et conserver des monnaies numériques.",
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
