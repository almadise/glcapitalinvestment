'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  ArrowLeft,
  Clock,
  Search,
  Video,
  FolderOpen,
  Handshake,
  FileText,
  Mail,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactSuccessPage() {
  const { lang } = useLanguage();

  const nextSteps =
    lang === 'fr'
      ? [
          {
            number: '01',
            icon: Clock,
            title: 'Accusé de réception',
            description: 'Vous recevrez un email de confirmation sous 48h ouvrées.',
          },
          {
            number: '02',
            icon: Search,
            title: 'Analyse de pré-éligibilité',
            description: 'Nos experts examinent votre dossier selon nos critères institutionnels.',
          },
          {
            number: '03',
            icon: Video,
            title: 'Appel de qualification',
            description: 'Si votre dossier est retenu, un appel en visioconférence sera planifié.',
          },
          {
            number: '04',
            icon: FolderOpen,
            title: 'Dossier complet requis',
            description: 'Nous vous demanderons les pièces justificatives complètes.',
          },
          {
            number: '05',
            icon: Handshake,
            title: 'Introduction institutionnelle',
            description: 'Présentation formelle à nos partenaires bancaires et institutionnels.',
          },
        ]
      : [
          {
            number: '01',
            icon: Clock,
            title: 'Acknowledgement',
            description: 'You will receive a confirmation email within 48 business hours.',
          },
          {
            number: '02',
            icon: Search,
            title: 'Pre-eligibility analysis',
            description: 'Our experts review your application against our institutional criteria.',
          },
          {
            number: '03',
            icon: Video,
            title: 'Qualification call',
            description:
              'If your application is retained, a video conference call will be scheduled.',
          },
          {
            number: '04',
            icon: FolderOpen,
            title: 'Full application package requested',
            description: 'We will request the complete set of supporting documents.',
          },
          {
            number: '05',
            icon: Handshake,
            title: 'Institutional introduction',
            description: 'Formal presentation to our banking and institutional partners.',
          },
        ];

  const documents =
    lang === 'fr'
      ? [
          'LOI sur papier à en-tête',
          'Executive Summary du projet',
          "Certificat d'immatriculation",
          'Justificatif de domicile',
          'Passeport du dirigeant en couleur',
          'États financiers des 2 dernières années',
          'Relevés bancaires des 6 derniers mois',
        ]
      : [
          'LOI on letterhead',
          'Executive Summary',
          'Certificate of incorporation',
          'Proof of address',
          'Director passport (colour)',
          '2 years financial statements',
          '6 months bank statements',
        ];

  return (
    <div className="min-h-screen bg-navy-dark relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-gold/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gold/3 blur-3xl" />
      </div>
      <div className="relative z-10 max-w-screen-lg mx-auto px-6 lg:px-10 py-16 lg:py-24">
        {/* Logo */}
        <div className="flex justify-center mb-14">
          <Image
            src="/assets/images/app_logo.png"
            alt="GL Capital Investment SA logo"
            width={160}
            height={56}
            className="object-contain"
          />
        </div>

        {/* Confirmation card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 lg:p-12 text-center mb-14 backdrop-blur-sm">
          <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-gold/10">
            <CheckCircle size={40} className="text-gold" />
          </div>

          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-gold text-xs font-semibold tracking-widest uppercase">
              {lang === 'fr' ? 'Dossier reçu' : 'Application received'}
            </span>
          </div>

          <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-5 leading-snug">
            {lang === 'fr'
              ? 'Votre dossier a bien été reçu.'
              : 'Your application has been received.'}
          </h1>

          <p className="text-slate-300 text-base lg:text-lg leading-relaxed max-w-2xl mx-auto mb-4">
            {lang === 'fr'
              ? 'Merci pour votre demande. Notre équipe de spécialistes va analyser votre dossier selon nos critères de pré-éligibilité institutionnelle et vous contactera dans les meilleurs délais.'
              : 'Thank you for your submission. Our team of specialists will review your application against our institutional pre-eligibility criteria and will contact you as soon as possible.'}
          </p>

          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Mail size={14} className="text-gold" />
            <span>
              {lang === 'fr'
                ? 'Un accusé de réception vous sera envoyé sous 48h ouvrées.'
                : 'An acknowledgement will be sent to you within 48 business hours.'}
            </span>
          </div>
        </div>

        {/* Next steps */}
        <div className="mb-14">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-5">
              <span className="text-gold text-xs font-semibold tracking-widest uppercase">
                {lang === 'fr' ? 'Prochaines étapes' : 'Next steps'}
              </span>
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-3">
              {lang === 'fr' ? 'Ce qui se passe maintenant' : 'What happens next'}
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              {lang === 'fr'
                ? 'Notre processus est structuré pour garantir une analyse rigoureuse de chaque dossier.'
                : 'Our process is structured to ensure a rigorous analysis of every application.'}
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
              {nextSteps?.map((step) => (
                <div
                  key={`step-${step?.number}`}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-2xl bg-navy border border-white/10 flex flex-col items-center justify-center mb-5 shadow-lg group-hover:border-gold/40 transition-colors duration-300">
                    <span className="text-gold text-xs font-bold tracking-widest">
                      {lang === 'fr' ? 'ÉTAPE' : 'STEP'}
                    </span>
                    <span className="text-white text-2xl font-display font-bold leading-none">
                      {step?.number}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                    <step.icon size={18} className="text-gold" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white mb-2 leading-snug">
                    {step?.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{step?.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Documents reminder */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 lg:p-10 mb-14 backdrop-blur-sm">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-gold" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-1">
                {lang === 'fr' ? 'Préparez vos documents' : 'Prepare your documents'}
              </h3>
              <p className="text-slate-400 text-sm">
                {lang === 'fr'
                  ? 'Si votre dossier est retenu, les pièces suivantes vous seront demandées :'
                  : 'If your application is retained, the following documents will be requested:'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents?.map((doc, index) => (
              <div
                key={`doc-${index}`}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5"
              >
                <CheckCircle size={14} className="text-gold flex-shrink-0" />
                <span className="text-slate-300 text-sm">{doc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-white/10" />
          <div className="w-2 h-2 rounded-full bg-gold/40" />
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/home-page"
            className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold text-base px-8 py-4 rounded-xl hover:bg-gold-light active:scale-95 transition-all duration-200 shadow-lg shadow-gold/20"
          >
            <ArrowLeft size={18} />
            {lang === 'fr' ? "Retour à l'accueil" : 'Back to home'}
          </Link>
          <Link
            href="/services/financement-projet"
            className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-white/10 active:scale-95 transition-all duration-200"
          >
            {lang === 'fr' ? 'Nos services' : 'Our services'}
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-xs mt-12">
          GL Capital Investment SA - {lang === 'fr' ? 'Confidentiel' : 'Confidential'}
        </p>
      </div>
    </div>
  );
}
