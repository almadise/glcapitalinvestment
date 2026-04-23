'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, Activity, FolderOpen, Upload } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const STORAGE_KEY = 'glc_walkthrough_seen';

interface Step {
  icon: React.ElementType;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  bulletsFr: string[];
  bulletsEn: string[];
  color: string;
  bg: string;
}

const steps: Step[] = [
  {
    icon: FolderOpen,
    titleFr: 'Assistant de soumission de dossier',
    titleEn: 'Dossier Submission Wizard',
    descFr: 'Notre assistant guidé vous accompagne étape par étape dans la création et la soumission de votre dossier de financement.',
    descEn: 'Our guided wizard walks you through creating and submitting your financing file step by step.',
    bulletsFr: [
      'Renseignez les informations de votre projet',
      'Sélectionnez le type de financement souhaité',
      'Soumettez votre dossier en quelques clics',
    ],
    bulletsEn: [
      'Enter your project information',
      'Select the desired financing type',
      'Submit your file in a few clicks',
    ],
    color: 'text-gold',
    bg: 'bg-gold/10',
  },
  {
    icon: Upload,
    titleFr: 'Documents requis',
    titleEn: 'Document Requirements',
    descFr: 'Préparez vos documents à l\'avance pour accélérer le traitement de votre dossier. Chaque document est vérifié par notre équipe de conformité.',
    descEn: 'Prepare your documents in advance to speed up your file processing. Each document is verified by our compliance team.',
    bulletsFr: [
      'LOI sur papier à en-tête officiel',
      'Executive Summary du projet',
      'Passeport du dirigeant (couleur)',
      'États financiers des 2 dernières années',
      'Relevés bancaires des 6 derniers mois',
    ],
    bulletsEn: [
      'LOI on official letterhead',
      'Project Executive Summary',
      'Director passport (colour)',
      '2 years financial statements',
      '6 months bank statements',
    ],
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Activity,
    titleFr: 'Suivi de statut en temps réel',
    titleEn: 'Real-Time Status Tracking',
    descFr: 'Suivez l\'avancement de votre dossier en temps réel depuis votre tableau de bord. Recevez des notifications à chaque étape clé.',
    descEn: 'Track your file progress in real time from your dashboard. Receive notifications at each key stage.',
    bulletsFr: [
      'REÇU - Dossier enregistré dans notre système',
      'EN REVUE - Analyse par nos experts',
      'ÉLIGIBLE - Dossier retenu pour soumission',
      'REJETÉ - Motif communiqué par email',
    ],
    bulletsEn: [
      'RECEIVED - File registered in our system',
      'UNDER REVIEW - Analysis by our experts',
      'ELIGIBLE - File selected for submission',
      'REJECTED - Reason communicated by email',
    ],
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
];

export default function WalkthroughModal() {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const handleSkip = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentStep, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  }, [currentStep]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
  }, [handleClose, handleNext, handlePrev]);

  if (!open) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === steps.length - 1;

  const t = {
    skip: lang === 'fr' ? 'Passer' : 'Skip',
    next: lang === 'fr' ? 'Suivant' : 'Next',
    finish: lang === 'fr' ? 'Commencer' : 'Get Started',
    prev: lang === 'fr' ? 'Précédent' : 'Previous',
    stepOf: lang === 'fr' ? `Étape ${currentStep + 1} sur ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`,
    welcome: lang === 'fr' ? 'Bienvenue sur votre portail GL Capital' : 'Welcome to your GL Capital portal',
    welcomeDesc: lang === 'fr' ? 'Découvrez en 3 étapes comment utiliser votre espace client.' : 'Discover in 3 steps how to use your client space.',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={handleSkip} aria-hidden="true" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-950 to-navy-900 px-6 pt-6 pb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 id="walkthrough-title" className="text-white font-display font-bold text-lg leading-tight">{t.welcome}</h2>
              <p className="text-slate-400 text-sm mt-1">{t.welcomeDesc}</p>
            </div>
            <button
              onClick={handleSkip}
              aria-label={lang === 'fr' ? 'Fermer le guide' : 'Close guide'}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 flex-shrink-0 ml-3"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2" role="tablist" aria-label={lang === 'fr' ? 'Étapes du guide' : 'Guide steps'}>
            {steps.map((_, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={idx === currentStep}
                aria-label={`${lang === 'fr' ? 'Étape' : 'Step'} ${idx + 1}`}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'bg-gold w-8' : idx < currentStep ? 'bg-gold/50 w-4' : 'bg-white/20 w-4'}`}
              />
            ))}
            <span className="ml-auto text-slate-400 text-xs">{t.stepOf}</span>
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4 mb-5">
            <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center flex-shrink-0`}>
              <StepIcon size={22} className={step.color} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display font-bold text-navy text-base leading-tight">
                {lang === 'fr' ? step.titleFr : step.titleEn}
              </h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                {lang === 'fr' ? step.descFr : step.descEn}
              </p>
            </div>
          </div>

          <ul className="space-y-2.5" aria-label={lang === 'fr' ? 'Points clés' : 'Key points'}>
            {(lang === 'fr' ? step.bulletsFr : step.bulletsEn).map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle size={15} className="text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-navy text-sm leading-snug">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
          >
            {t.skip}
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                aria-label={t.prev}
                className="flex items-center gap-1.5 px-4 py-2 text-navy border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                {t.prev}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-gold text-navy rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors"
            >
              {isLast ? t.finish : t.next}
              {!isLast && <ChevronRight size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
