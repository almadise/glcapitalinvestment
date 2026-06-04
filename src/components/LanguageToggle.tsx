'use client';

import React from 'react';
import { useLanguage, type Lang } from '@/context/LanguageContext';

type LanguageToggleProps = {
  className?: string;
  buttonClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
};

/**
 * Sélecteur FR / EN : le bouton actif reflète la langue affichée (pas la langue cible).
 */
export default function LanguageToggle({
  className = 'flex items-center gap-1 rounded-lg border border-white/20 p-0.5',
  buttonClassName = 'px-2.5 py-1 text-xs font-semibold rounded-md transition-all',
  activeClassName = 'bg-white/15 text-white',
  inactiveClassName = 'text-white/60 hover:text-white',
}: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  const select = (next: Lang) => {
    if (lang !== next) setLang(next);
  };

  return (
    <div className={className} role="group" aria-label="Language">
      <button
        type="button"
        onClick={() => select('fr')}
        className={`${buttonClassName} ${lang === 'fr' ? activeClassName : inactiveClassName}`}
        aria-pressed={lang === 'fr'}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => select('en')}
        className={`${buttonClassName} ${lang === 'en' ? activeClassName : inactiveClassName}`}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  );
}
