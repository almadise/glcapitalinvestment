'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import { HelpCircle, BookOpen, MessageSquare, ChevronDown, Search, Send, Loader2, CheckCircle2, AlertCircle, Mail, ExternalLink,  } from 'lucide-react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';


// ─── FAQ DATA ────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    category: { fr: 'Dossier & Documents', en: 'File & Documents' },
    items: [
      {
        q: { fr: 'Quels documents sont requis pour soumettre un dossier ?', en: 'What documents are required to submit a file?' },
        a: {
          fr: 'GL Capital requiert : lettre d\'intention (LOI), business plan, états financiers des 3 dernières années, justificatifs KYC des bénéficiaires effectifs, et tout document technique pertinent. La liste exacte varie selon le type de financement.',
          en: 'GL Capital requires: letter of intent (LOI), business plan, financial statements for the last 3 years, KYC documents for beneficial owners, and any relevant technical documents. The exact list varies by financing type.',
        },
      },
      {
        q: { fr: 'Comment téléverser des documents sur le portail ?', en: 'How do I upload documents to the portal?' },
        a: {
          fr: 'Accédez à la section "Documents" dans votre tableau de bord. Vous pouvez glisser-déposer vos fichiers ou cliquer pour parcourir. Formats acceptés : PDF, DOCX, XLSX, JPG, PNG (max 10 Mo par fichier).',
          en: 'Go to the "Documents" section in your dashboard. You can drag and drop files or click to browse. Accepted formats: PDF, DOCX, XLSX, JPG, PNG (max 10MB per file).',
        },
      },
      {
        q: { fr: 'Puis-je modifier un dossier après soumission ?', en: 'Can I modify a file after submission?' },
        a: {
          fr: 'Une fois soumis, le dossier ne peut pas être modifié directement. Vous pouvez ajouter des documents complémentaires via la section Documents. Pour toute correction majeure, contactez notre équipe.',
          en: 'Once submitted, the file cannot be directly modified. You can add supplementary documents via the Documents section. For major corrections, contact our team.',
        },
      },
    ],
  },
  {
    category: { fr: 'Statuts & Suivi', en: 'Status & Tracking' },
    items: [
      {
        q: { fr: 'Que signifient les différents statuts de dossier ?', en: 'What do the different file statuses mean?' },
        a: {
          fr: '• Reçu : dossier enregistré, examen initial en cours\n• À compléter : documents manquants ou informations requises\n• Éligible : dossier validé, traitement avancé\n• Clôturé : traitement terminé\n• Rejeté : dossier non retenu (motif communiqué)',
          en: '• Received: file registered, initial review in progress\n• To complete: missing documents or required information\n• Eligible: file validated, advanced processing\n• Closed: processing complete\n• Rejected: file not retained (reason communicated)',
        },
      },
      {
        q: { fr: 'Quels sont les délais de traitement ?', en: 'What are the processing timelines?' },
        a: {
          fr: 'Examen préliminaire : 48-72h ouvrées. Analyse approfondie : 5-15 jours ouvrés. Structuration et présentation aux partenaires : 10-30 jours ouvrés. Ces délais sont indicatifs et peuvent varier selon la complexité du dossier.',
          en: 'Preliminary review: 48-72 business hours. In-depth analysis: 5-15 business days. Structuring and partner presentation: 10-30 business days. These timelines are indicative and may vary by file complexity.',
        },
      },
      {
        q: { fr: 'Comment suis-je notifié des mises à jour ?', en: 'How am I notified of updates?' },
        a: {
          fr: 'Vous recevez des notifications par email et dans votre portail à chaque changement de statut. Vous pouvez configurer vos préférences de notification dans les paramètres de votre compte.',
          en: 'You receive email and in-portal notifications for each status change. You can configure your notification preferences in your account settings.',
        },
      },
    ],
  },
  {
    category: { fr: 'Confidentialité & Sécurité', en: 'Confidentiality & Security' },
    items: [
      {
        q: { fr: 'Comment la confidentialité de mon dossier est-elle garantie ?', en: 'How is my file confidentiality guaranteed?' },
        a: {
          fr: 'GL Capital signe systématiquement un NCNDA avant tout échange. L\'accès aux dossiers est strictement limité aux analystes habilités. Les documents sont transmis via des canaux chiffrés SSL/TLS et stockés de façon sécurisée.',
          en: 'GL Capital systematically signs an NCNDA before any exchange. File access is strictly limited to authorized analysts. Documents are transmitted via SSL/TLS encrypted channels and stored securely.',
        },
      },
      {
        q: { fr: 'GL Capital exécute-t-il des transactions financières ?', en: 'Does GL Capital execute financial transactions?' },
        a: {
          fr: 'Non. GL Capital n\'est pas une banque et n\'exécute aucune transaction financière directe. Notre rôle est exclusivement celui d\'un intermédiaire institutionnel : structuration, mise en relation avec des partenaires agréés, conseil en conformité.',
          en: 'No. GL Capital is not a bank and does not execute any direct financial transactions. Our role is exclusively that of an institutional intermediary: structuring, connecting with licensed partners, compliance advisory.',
        },
      },
    ],
  },
  {
    category: { fr: 'Compte & Accès', en: 'Account & Access' },
    items: [
      {
        q: { fr: 'Comment réinitialiser mon mot de passe ?', en: 'How do I reset my password?' },
        a: {
          fr: 'Cliquez sur "Mot de passe oublié ?" sur la page de connexion. Vous recevrez un email avec un lien de réinitialisation valable 1 heure. Si vous ne recevez pas l\'email, vérifiez vos spams.',
          en: 'Click "Forgot password?" on the login page. You will receive an email with a reset link valid for 1 hour. If you don\'t receive the email, check your spam folder.',
        },
      },
      {
        q: { fr: 'Comment vérifier mon adresse email ?', en: 'How do I verify my email address?' },
        a: {
          fr: 'Après inscription, un email de vérification est envoyé automatiquement. Cliquez sur le lien dans cet email pour activer votre compte. Si vous ne l\'avez pas reçu, utilisez le bouton "Renvoyer" sur la page de vérification.',
          en: 'After registration, a verification email is sent automatically. Click the link in this email to activate your account. If you haven\'t received it, use the "Resend" button on the verification page.',
        },
      },
    ],
  },
];

// ─── GLOSSARY DATA ────────────────────────────────────────────────────────────
const GLOSSARY_TERMS = [
  { term: 'AML', def: { fr: 'Anti-Money Laundering - Lutte contre le blanchiment d\'argent. Ensemble des procédures et contrôles visant à détecter et prévenir le blanchiment de capitaux.', en: 'Anti-Money Laundering - Set of procedures and controls aimed at detecting and preventing money laundering.' } },
  { term: 'BG', def: { fr: 'Bank Guarantee - Garantie bancaire émise par une institution financière pour sécuriser une transaction ou un engagement contractuel.', en: 'Bank Guarantee - A guarantee issued by a financial institution to secure a transaction or contractual commitment.' } },
  { term: 'Due Diligence', def: { fr: 'Processus d\'investigation approfondie réalisé avant une transaction financière pour évaluer les risques, la conformité et la viabilité d\'un projet.', en: 'In-depth investigation process conducted before a financial transaction to assess risks, compliance, and project viability.' } },
  { term: 'KYC', def: { fr: 'Know Your Customer - Procédure d\'identification et de vérification de l\'identité des clients, obligatoire dans le cadre réglementaire financier.', en: 'Know Your Customer - Client identification and verification procedure, mandatory under financial regulatory frameworks.' } },
  { term: 'LOI', def: { fr: 'Letter of Intent - Lettre d\'intention formalisant l\'intérêt d\'une partie pour une transaction ou un partenariat, avant la signature d\'un contrat définitif.', en: 'Letter of Intent - Document formalizing a party\'s interest in a transaction or partnership, before signing a definitive contract.' } },
  { term: 'NCNDA', def: { fr: 'Non-Circumvention, Non-Disclosure Agreement - Accord de non-contournement et de confidentialité protégeant les parties impliquées dans une transaction financière.', en: 'Non-Circumvention, Non-Disclosure Agreement - Agreement protecting parties involved in a financial transaction from circumvention and disclosure.' } },
  { term: 'OFAC', def: { fr: 'Office of Foreign Assets Control - Bureau américain de contrôle des avoirs étrangers, qui administre et applique les sanctions économiques et commerciales.', en: 'Office of Foreign Assets Control - U.S. bureau that administers and enforces economic and trade sanctions.' } },
  { term: 'PEP', def: { fr: 'Politically Exposed Person - Personne politiquement exposée, présentant un risque accru de corruption en raison de ses fonctions publiques.', en: 'Politically Exposed Person - Individual presenting heightened corruption risk due to their public functions.' } },
  { term: 'SBLC', def: { fr: 'Standby Letter of Credit - Lettre de crédit standby, instrument financier utilisé comme garantie de paiement de dernier recours.', en: 'Standby Letter of Credit - Financial instrument used as a last-resort payment guarantee.' } },
  { term: 'Structuration', def: { fr: 'Processus d\'organisation et d\'optimisation d\'une opération financière (montage, garanties, flux) pour maximiser son éligibilité auprès des institutions partenaires.', en: 'Process of organizing and optimizing a financial operation (structure, guarantees, flows) to maximize eligibility with partner institutions.' } },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function FAQAccordion({ items, lang }: { items: typeof FAQ_ITEMS[0]['items']; lang: 'fr' | 'en' }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-start gap-3 px-4 py-3.5 text-left bg-white hover:bg-slate-50 transition-colors"
          >
            <ChevronDown
              size={15}
              className={`flex-shrink-0 mt-0.5 text-slate-400 transition-transform duration-200 ${openIndex === i ? 'rotate-180 text-gold' : ''}`}
            />
            <span className="text-sm font-semibold text-navy leading-snug">{item.q[lang]}</span>
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4 pt-1 bg-white border-t border-slate-100">
              <div className="ml-6">
                {item.a[lang].split('\n').map((line, j) => (
                  <p key={j} className={`text-slate-600 text-sm leading-relaxed ${line.startsWith('•') ? 'ml-2' : ''} ${j > 0 ? 'mt-1' : ''}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ClientSupportPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'faq' | 'glossary' | 'contact'>('faq');
  const [faqSearch, setFaqSearch] = useState('');
  const [glossarySearch, setGlossarySearch] = useState('');

  // Contact form
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const t = {
    title: lang === 'fr' ? 'Centre d\'aide' : 'Help Center',
    subtitle: lang === 'fr' ? 'FAQ, glossaire et formulaire de contact pour toute question.' : 'FAQ, glossary, and contact form for any question.',
    faq: lang === 'fr' ? 'FAQ' : 'FAQ',
    glossary: lang === 'fr' ? 'Glossaire' : 'Glossary',
    contact: lang === 'fr' ? 'Nous contacter' : 'Contact Us',
    searchFaq: lang === 'fr' ? 'Rechercher dans la FAQ…' : 'Search FAQ…',
    searchGlossary: lang === 'fr' ? 'Rechercher un terme…' : 'Search a term…',
    noResults: lang === 'fr' ? 'Aucun résultat trouvé.' : 'No results found.',
    contactTitle: lang === 'fr' ? 'Envoyer un message' : 'Send a message',
    contactSubtitle: lang === 'fr' ? 'Notre équipe vous répondra dans les 48h ouvrées.' : 'Our team will respond within 48 business hours.',
    subjectLabel: lang === 'fr' ? 'Sujet' : 'Subject',
    subjectPlaceholder: lang === 'fr' ? 'Ex: Question sur mon dossier' : 'E.g. Question about my file',
    messageLabel: lang === 'fr' ? 'Message' : 'Message',
    messagePlaceholder: lang === 'fr' ? 'Décrivez votre question ou problème…' : 'Describe your question or issue…',
    send: lang === 'fr' ? 'Envoyer le message' : 'Send message',
    successMsg: lang === 'fr' ? 'Message envoyé avec succès. Nous vous répondrons sous 48h.' : 'Message sent successfully. We will respond within 48 hours.',
    directContact: lang === 'fr' ? 'Contact direct' : 'Direct contact',
  };

  // Filter FAQ
  const filteredFaq = faqSearch.trim()
    ? FAQ_ITEMS.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.q[lang].toLowerCase().includes(faqSearch.toLowerCase()) ||
            item.a[lang].toLowerCase().includes(faqSearch.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : FAQ_ITEMS;

  // Filter Glossary
  const filteredGlossary = GLOSSARY_TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      t.def[lang].toLowerCase().includes(glossarySearch.toLowerCase())
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !contactForm.subject.trim() || !contactForm.message.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const { error } = await supabase.from('contact_submissions').insert({
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
        source: 'client_support',
      });
      if (error) throw error;
      setSubmitSuccess(true);
      setContactForm({ subject: '', message: '' });
    } catch (err: any) {
      setSubmitError(err.message || 'Erreur lors de l\'envoi.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: 'faq', label: t.faq, icon: HelpCircle },
    { key: 'glossary', label: t.glossary, icon: BookOpen },
    { key: 'contact', label: t.contact, icon: MessageSquare },
  ] as const;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">{t.title}</h1>
        <p className="text-slate-500 text-sm mt-1">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === key
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── FAQ TAB ── */}
      {activeTab === 'faq' && (
        <div className="space-y-5">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder={t.searchFaq}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
            />
          </div>

          {filteredFaq.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">{t.noResults}</div>
          ) : (
            filteredFaq.map((cat, i) => (
              <div key={i}>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-300" />
                  {cat.category[lang]}
                </h2>
                <FAQAccordion items={cat.items} lang={lang} />
              </div>
            ))
          )}
        </div>
      )}

      {/* ── GLOSSARY TAB ── */}
      {activeTab === 'glossary' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={glossarySearch}
              onChange={(e) => setGlossarySearch(e.target.value)}
              placeholder={t.searchGlossary}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
            />
          </div>

          {filteredGlossary.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">{t.noResults}</div>
          ) : (
            <div className="space-y-2">
              {filteredGlossary.map((item, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 inline-block bg-navy text-gold text-xs font-bold px-2.5 py-1 rounded-lg mt-0.5">
                      {item.term}
                    </span>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.def[lang]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONTACT TAB ── */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-display text-base font-bold text-navy mb-1">{t.contactTitle}</h2>
              <p className="text-slate-500 text-sm mb-5">{t.contactSubtitle}</p>

              {submitSuccess && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-emerald-700 text-sm font-medium">{t.successMsg}</p>
                </div>
              )}
              {submitError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.subjectLabel}</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder={t.subjectPlaceholder}
                    required
                    maxLength={200}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.messageLabel}</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder={t.messagePlaceholder}
                    required
                    maxLength={2000}
                    rows={6}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all resize-y"
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{contactForm.message.length}/2000</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !contactForm.subject.trim() || !contactForm.message.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {t.send}
                </button>
              </form>
            </div>
          </div>

          {/* Direct contact info */}
          <div className="space-y-4">
            <div className="bg-navy rounded-2xl p-5 text-white">
              <h3 className="font-display text-sm font-bold mb-4 text-gold">{t.directContact}</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Mail size={14} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">{lang === 'fr' ? 'Email' : 'Email'}</p>
                    <a href="mailto:glcontact@glcapitalinvestment.com" className="text-sm text-white hover:text-gold transition-colors">
                      glcontact@glcapitalinvestment.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <ExternalLink size={14} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">{lang === 'fr' ? 'Portail contact' : 'Contact portal'}</p>
                    <Link href="/contact" className="text-sm text-white hover:text-gold transition-colors">
                      {lang === 'fr' ? 'Formulaire de contact' : 'Contact form'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">
                {lang === 'fr' ? '⏱ Délai de réponse' : '⏱ Response time'}
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {lang === 'fr' ?'Notre équipe répond généralement sous 24-48h ouvrées. Pour les urgences liées à votre dossier, mentionnez-le dans le sujet.' :'Our team typically responds within 24-48 business hours. For file-related urgencies, mention it in the subject.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
