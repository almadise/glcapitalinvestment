'use client';
// Re-export from canonical location to support both import paths:
// @/context/LanguageContext  (old path used in some files)
// @/contexts/LanguageContext (new canonical path)
export { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
