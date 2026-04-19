'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'fr' | 'en';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (fr: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  toggleLang: () => {},
  t: (fr) => fr,
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    // Check both storage keys for compatibility
    const stored = (localStorage.getItem('glc_lang') || localStorage.getItem('gl-capital-lang')) as Lang | null;
    if (stored === 'en' || stored === 'fr') setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('glc_lang', l);
    localStorage.setItem('gl-capital-lang', l);
  };

  const toggleLang = () => setLang(lang === 'fr' ? 'en' : 'fr');

  const t = (fr: string, en: string) => (lang === 'fr' ? fr : en);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
