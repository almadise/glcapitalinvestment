'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

/** Synchronise l'attribut lang du document avec la langue active. */
export default function LangHtmlSync() {
  const { lang } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
