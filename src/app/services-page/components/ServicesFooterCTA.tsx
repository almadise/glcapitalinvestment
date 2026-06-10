'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ServicesFooterCTA() {
  const { t } = useLanguage();

  return (
    <section className="py-20" style={{ background: '#1E2D4A' }}>
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 text-center">
        <p
          className="text-xs font-mono tracking-widest uppercase mb-4"
          style={{ color: '#D4B055' }}
        >
          {t('Prêt à commencer ?', 'Ready to Start?')}
        </p>
        <h2 className="text-4xl font-bold text-white mb-4">
          {t("Soumettez votre dossier dès aujourd'hui", 'Submit your application today')}
        </h2>
        <p className="text-white/60 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
          {t(
            "Créez votre compte sécurisé, complétez l'assistant de soumission, puis notre équipe lance la revue sous 1 à 3 jours ouvrés.",
            'Create your secure account, complete the submission wizard, and our team starts the review within 1 to 3 business days.'
          )}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/dossier-submission-wizard"
            className="flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all duration-200 active:scale-95"
            style={{ background: '#B8912A', color: '#FFFFFF' }}
          >
            {t('Soumettre un dossier', 'Submit an application')}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 hover:bg-white/10"
          >
            <MessageSquare size={16} />
            {t('Demander une consultation', 'Request a consultation')}
          </Link>
        </div>
      </div>
    </section>
  );
}
