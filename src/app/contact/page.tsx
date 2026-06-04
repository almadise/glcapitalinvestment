'use client';
import React, { useState } from 'react';
import { Mail, User, Building2, Briefcase, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import PublicNavbar from '@/app/home-page/components/PublicNavbar';
import PublicFooter from '@/app/home-page/components/PublicFooter';
import { useLanguage } from '@/context/LanguageContext';
import {
  ENTITY_GL_CAPITAL,
  OFFICIAL_PUBLIC_EMAIL,
  OFFICIAL_WEBSITE_DISPLAY,
  OFFICIAL_WEBSITE_URL,
  PARIS_WORLD_OFFICE,
  REGISTERED_ADDRESS_LINES_EN,
  REGISTERED_ADDRESS_LINES_FR,
} from '@/lib/companyContact';
import { contactProjectTypes } from '@/lib/content/glCapitalRedactionnel';

interface LeadFormData {
  name: string;
  email: string;
  company: string;
  projectType: string;
  message: string;
}

const PROJECT_TYPES_FR = contactProjectTypes.fr;
const PROJECT_TYPES_EN = contactProjectTypes.en;

export default function ContactLeadPage() {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    company: '',
    projectType: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const projectTypes = lang === 'fr' ? PROJECT_TYPES_FR : PROJECT_TYPES_EN;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/send-contact-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomComplet: formData.name,
          societe: formData.company,
          email: formData.email,
          projectType: formData.projectType,
          message: formData.message,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(
          lang === 'fr' ?'Une erreur est survenue. Veuillez réessayer.' :'An error occurred. Please try again.'
        );
      }
    } catch {
      setErrorMsg(
        lang === 'fr' ?'Erreur réseau. Vérifiez votre connexion.' :'Network error. Check your connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    heroTitle: lang === 'fr' ? 'Nous contacter' : 'Contact Us',
    heroSubtitle:
      lang === 'fr' ?'Vous avez une question ou souhaitez en savoir plus sur nos services ? Remplissez ce formulaire et notre équipe vous répondra sous 48h ouvrées.' :'Have a question or want to learn more about our services? Fill in this form and our team will respond within 48 business hours.',
    formTitle: lang === 'fr' ? 'Formulaire de contact' : 'Contact Form',
    name: lang === 'fr' ? 'Nom complet' : 'Full name',
    email: 'Email',
    company: lang === 'fr' ? 'Société' : 'Company',
    projectType: lang === 'fr' ? 'Type de projet' : 'Project type',
    projectTypePlaceholder: lang === 'fr' ? 'Sélectionnez un type' : 'Select a type',
    message: lang === 'fr' ? 'Message' : 'Message',
    messagePlaceholder:
      lang === 'fr' ?'Décrivez brièvement votre demande ou question...' :'Briefly describe your request or question...',
    submit: lang === 'fr' ? 'Envoyer ma demande' : 'Send my request',
    sending: lang === 'fr' ? 'Envoi en cours...' : 'Sending...',
    successTitle: lang === 'fr' ? 'Vérifiez votre email' : 'Check your email',
    successDesc:
      lang === 'fr' ?'Un email de confirmation a été envoyé à votre adresse. Cliquez sur le lien pour finaliser votre demande.' :'A confirmation email has been sent to your address. Click the link to complete your request.',
    successNote:
      lang === 'fr' ?'Ce lien est valable 24 heures. Vérifiez également vos spams.' :'This link is valid for 24 hours. Also check your spam folder.',
    required: lang === 'fr' ? 'Champs obligatoires' : 'Required fields',
    disclaimer:
      lang === 'fr'
        ? "Ce formulaire est destiné aux demandes d'information générales. Pour soumettre un dossier de financement, utilisez notre portail client sécurisé."
        : 'This form is for general information requests. To submit a financing file, use our secure client portal.',
    portalCta: lang === 'fr' ? 'Accéder au portail client' : 'Access client portal',
    doubleOptInNote:
      lang === 'fr' ?'🔒 Votre email sera vérifié avant enregistrement (double opt-in RGPD).' :'🔒 Your email will be verified before registration (GDPR double opt-in).',
  };

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <PublicNavbar />

      <main id="main-content" tabIndex={-1}>
        {/* Hero */}
        <section
          className="relative pt-28 pb-16 overflow-hidden"
          aria-labelledby="contact-hero-title"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: 'url(/assets/images/contact-hero-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* Overlay */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{ background: 'linear-gradient(135deg, rgba(30,45,74,0.90) 0%, rgba(30,45,74,0.82) 60%, rgba(42,61,92,0.75) 100%)' }}
          />
          <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ background: 'rgba(184,145,42,0.15)', border: '1px solid rgba(184,145,42,0.25)' }}>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#D4B055' }}>Contact</span>
            </div>
            <h1
              id="contact-hero-title"
              className="font-display text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
            >
              {t.heroTitle}
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-2xl pl-5" style={{ borderLeft: '2px solid rgba(184,145,42,0.4)' }}>
              {t.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="py-20" style={{ background: '#F7F8FA' }}>
          <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

              {/* Info sidebar */}
              <aside className="lg:col-span-1 space-y-6" aria-label="Informations de contact">
                {/* Disclaimer */}
                <div className="rounded-2xl p-5" style={{ background: '#FFF8E8', border: '1px solid rgba(184,145,42,0.3)' }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} style={{ color: '#B8912A' }} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm leading-relaxed" style={{ color: '#4A5C7A' }}>{t.disclaimer}</p>
                      <a
                        href="/client-portal-dashboard"
                        className="inline-flex items-center gap-1.5 mt-3 font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 rounded"
                        style={{ color: '#B8912A' }}
                      >
                        {t.portalCta}
                        <ArrowRight size={14} aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="rounded-2xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}>
                  <h2 className="font-display font-bold text-base" style={{ color: '#1E2D4A' }}>{ENTITY_GL_CAPITAL}</h2>
                  <p className="text-xs" style={{ color: '#6B7E9A' }}>{PARIS_WORLD_OFFICE}</p>
                  <div className="space-y-3 text-sm mt-3" style={{ color: '#4A5C7A' }}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F5EDD0' }}>
                        <Mail size={14} style={{ color: '#B8912A' }} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs uppercase tracking-wider mb-0.5" style={{ color: '#1E2D4A' }}>Email</div>
                        <a
                          href={`mailto:${OFFICIAL_PUBLIC_EMAIL}`}
                          className="transition-colors focus-visible:outline-none focus-visible:ring-2 rounded"
                          style={{ color: '#4A5C7A' }}
                        >
                          {OFFICIAL_PUBLIC_EMAIL}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F5EDD0' }}>
                        <Building2 size={14} style={{ color: '#B8912A' }} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs uppercase tracking-wider mb-0.5" style={{ color: '#1E2D4A' }}>
                          {lang === 'fr' ? 'Siège social (General Luxury SA)' : 'Registered office (General Luxury SA)'}
                        </div>
                        <address className="not-italic text-sm space-y-0.5" style={{ color: '#4A5C7A' }}>
                          {(lang === 'fr' ? REGISTERED_ADDRESS_LINES_FR : REGISTERED_ADDRESS_LINES_EN).map((line) => (
                            <React.Fragment key={line}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </address>
                        <a
                          href={OFFICIAL_WEBSITE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 rounded"
                          style={{ color: '#B8912A' }}
                        >
                          {OFFICIAL_WEBSITE_DISPLAY}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GDPR note */}
                <div className="rounded-2xl p-4" style={{ background: '#E8EDF5', border: '1px solid #D8E0EC' }}>
                  <p className="text-xs leading-relaxed" style={{ color: '#1E2D4A' }}>{t.doubleOptInNote}</p>
                </div>
              </aside>

              {/* Form */}
              <div className="lg:col-span-2">
                {submitted ? (
                  <div
                    className="rounded-2xl p-12 text-center shadow-sm"
                    style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: '#F5EDD0', border: '1px solid #D8E0EC' }}>
                      <Mail size={32} style={{ color: '#B8912A' }} aria-hidden="true" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-3" style={{ color: '#1E2D4A' }}>{t.successTitle}</h2>
                    <p className="text-base max-w-md mx-auto mb-3" style={{ color: '#4A5C7A' }}>{t.successDesc}</p>
                    <p className="text-sm max-w-sm mx-auto" style={{ color: '#6B7E9A' }}>{t.successNote}</p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl p-8 lg:p-10 shadow-sm"
                    style={{ background: '#FFFFFF', border: '1px solid #D8E0EC' }}
                    aria-label={t.formTitle}
                    noValidate
                  >
                    <h2 className="font-display text-xl font-bold mb-6" style={{ color: '#1E2D4A' }}>{t.formTitle}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4A5C7A' }}>
                          {t.name} <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5C7A' }} aria-hidden="true" />
                          <input
                            id="contact-name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full pl-9 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
                            style={{ background: '#F7F8FA', border: '1px solid #D8E0EC', color: '#1E2D4A' }}
                            placeholder={lang === 'fr' ? 'Jean Dupont' : 'John Smith'}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4A5C7A' }}>
                          {t.email} <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5C7A' }} aria-hidden="true" />
                          <input
                            id="contact-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full pl-9 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
                            style={{ background: '#F7F8FA', border: '1px solid #D8E0EC', color: '#1E2D4A' }}
                            placeholder="vous@exemple.com"
                          />
                        </div>
                      </div>

                      {/* Company */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="contact-company" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4A5C7A' }}>
                          {t.company}
                        </label>
                        <div className="relative">
                          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5C7A' }} aria-hidden="true" />
                          <input
                            id="contact-company"
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full pl-9 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
                            style={{ background: '#F7F8FA', border: '1px solid #D8E0EC', color: '#1E2D4A' }}
                            placeholder={lang === 'fr' ? 'Votre société' : 'Your company'}
                          />
                        </div>
                      </div>

                      {/* Project type */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="contact-project-type" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4A5C7A' }}>
                          {t.projectType} <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5C7A' }} aria-hidden="true" />
                          <select
                            id="contact-project-type"
                            name="projectType"
                            value={formData.projectType}
                            onChange={handleChange}
                            required
                            className="w-full pl-9 pr-4 py-3 text-sm rounded-xl outline-none transition-all appearance-none"
                            style={{ background: '#F7F8FA', border: '1px solid #D8E0EC', color: formData.projectType ? '#1E2D4A' : '#6B7E9A' }}
                          >
                            <option value="" disabled>{t.projectTypePlaceholder}</option>
                            {projectTypes.map((pt) => (
                              <option key={pt} value={pt}>{pt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-2 mt-6">
                      <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4A5C7A' }}>
                        {t.message} <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 text-sm rounded-xl outline-none transition-all resize-none"
                        style={{ background: '#F7F8FA', border: '1px solid #D8E0EC', color: '#1E2D4A' }}
                        placeholder={t.messagePlaceholder}
                      />
                    </div>

                    {errorMsg && (
                      <div className="mt-4 flex items-center gap-2 p-3 rounded-xl" style={{ background: '#FFF5F5', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0" aria-hidden="true" />
                        <p className="text-sm text-red-600">{errorMsg}</p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <p className="text-xs" style={{ color: '#6B7E9A' }}>
                        <span className="text-red-400">*</span> {t.required}
                      </p>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: '#B8912A', color: '#FFFFFF' }}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                            {t.sending}
                          </>
                        ) : (
                          <>
                            {t.submit}
                            <ArrowRight size={16} aria-hidden="true" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
