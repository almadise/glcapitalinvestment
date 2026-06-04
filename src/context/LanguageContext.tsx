'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import LangHtmlSync from '@/components/LangHtmlSync';

export type Lang = 'fr' | 'en';

const STORAGE_KEYS = ['glc_lang', 'gl-capital-lang'] as const;

function readStoredLang(): Lang | null {
  if (typeof window === 'undefined') return null;
  for (const key of STORAGE_KEYS) {
    const stored = localStorage.getItem(key);
    if (stored === 'en' || stored === 'fr') return stored;
  }
  return null;
}

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (fr: string, en: string) => string;
  /** false jusqu'au chargement de la préférence locale (évite flash hydratation). */
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  toggleLang: () => {},
  t: (fr) => fr,
  ready: false,
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLang();
    if (stored) setLangState(stored);
    setReady(true);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    STORAGE_KEYS.forEach((key) => localStorage.setItem(key, l));
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next: Lang = current === 'fr' ? 'en' : 'fr';
      STORAGE_KEYS.forEach((key) => localStorage.setItem(key, next));
      return next;
    });
  }, []);

  const t = useCallback(
    (french: string, english: string) => (lang === 'en' ? english : french),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, ready }),
    [lang, setLang, toggleLang, t, ready]
  );

  return (
    <LanguageContext.Provider value={value}>
      <LangHtmlSync />
      {children}
    </LanguageContext.Provider>
  );
}
